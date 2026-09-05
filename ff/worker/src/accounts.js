/**
 * Draftline accounts.
 *
 * Until now a "profile" was a row in one browser's localStorage, which meant the
 * name and password you made on a laptop did not exist on a phone — the sign-in
 * screen said exactly that, and it read like a bug. This module is the account
 * the app always implied it had: the record lives in KV, so the same credential
 * works from any device, and the draft state travels with it.
 *
 * What this is not: an identity provider. There is no email on file, so there is
 * no password reset and no recovery — losing the password loses the account, and
 * the UI has to keep saying so. Passwords are PBKDF2-SHA256 at the highest
 * iteration count the runtime allows, with a per-account salt; the difference
 * from before is that the hash now lives somewhere its owner cannot read.
 *
 * Signup is invite-only. The board spends a shared Anthropic key on every brief,
 * so an account anyone can make is a bill anyone can run up; a one-use code
 * issued out of band is the smallest thing that closes that. See the invite
 * section below for why the code is checked the way it is.
 *
 * Routes, all under /api/ so the bare-root Claude proxy keeps working for any
 * browser still running an older build of the page:
 *
 *   POST /api/signup       {name, password, invite}  -> {token, user}
 *   POST /api/login        {name, password}          -> {token, user}
 *   POST /api/logout                                 -> {ok}
 *   GET  /api/session                                -> {user}
 *   GET  /api/state                                  -> {rev, updatedAt, device, state}
 *   PUT  /api/state        {rev, state, device}      -> {rev, updatedAt} | 409 conflict
 *   POST /api/admin/codes  {count, note, ...}        -> {codes}
 *   GET  /api/admin/codes                            -> {codes}
 *
 * Everything but signup and login takes `Authorization: Bearer <token>`; the
 * admin pair takes the ADMIN_TOKEN secret instead of a session.
 */

// 100k is the ceiling the Workers runtime enforces on PBKDF2: ask for more and
// deriveBits throws NotSupportedError. `wrangler dev --local` does not enforce it,
// so 150k passed every local test and every signup on the deployed Worker
// returned a 1101. The iteration count is written into each record's `kdf`, so
// raising it later is a per-account migration rather than a flag day.
const ITER = 100000;
const SESSION_TTL = 60 * 60 * 24 * 90;   // 90 days
const MIN_PASSWORD = 6;
const MAX_BODY_BYTES = 512 * 1024;       // a 15-round draft is a few KB; this is slack

// Brute force is the one attack this shape actually invites, so failed sign-ins
// are counted per IP and per account name over a rolling window.
const AUTH_LIMIT = 20;
const AUTH_WINDOW = 900;                 // 15 minutes

/* Invite codes.
 *
 * No 0, 1, I, L, O or U: these get read off one phone screen and typed into
 * another one, and every pair in that set is the same glyph to somebody doing it
 * in a hurry. Eight characters out of the remaining thirty is 30^8, about
 * 6.6e11 — against the failure limit below, guessing one is not a thing that
 * happens, and a longer code would only be harder to read aloud.
 *
 * Unlike the sign-in name bucket, this limit is allowed to REFUSE rather than
 * only count. The reasoning that makes that bucket advisory does not apply: an
 * invite bucket keyed on the address cannot be aimed at a particular victim, and
 * there is no innocent way to get a code wrong ten times running. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LEN = 8;
const INVITE_LIMIT = 10;

const enc = new TextEncoder();

function hex(buf) {
  return Array.prototype.map
    .call(new Uint8Array(buf), (b) => ("0" + b.toString(16)).slice(-2))
    .join("");
}
function randomHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return hex(a);
}
async function derive(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: ITER, hash: "SHA-256" },
    key, 256
  );
  return hex(bits);
}

/** Compare without leaking where two hashes first differ. */
function sameHash(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Names are matched case-insensitively and stored as typed. An email is a fine
   name here and is treated as an opaque string — it is never mailed to, because
   there is nothing to mail. */
const nameKey  = (name) => "u:name:" + String(name || "").trim().toLowerCase();
const userKey  = (id) => "u:" + id;
const sessKey  = (token) => "s:" + token;
const stateKey = (id) => "st:" + id;
const codeKey  = (code) => "ic:" + code;

/**
 * Fold what somebody typed down to the canonical eight characters, or "" if it
 * cannot be one. Hyphens, spaces and lower case all survive the trip; a
 * character outside the alphabet does not, and the length check then rejects the
 * whole thing. That is deliberate — mapping look-alikes back (a typed O to a 0)
 * would need a table that the browser and this file both carry and could drift
 * apart on, and the payoff is one saved retype against a clear error message.
 */
function normalizeCode(input) {
  const s = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length !== CODE_LEN) return "";
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return "";
  return s;
}

/** Hyphenated for display only. Never stored, never compared. */
const formatCode = (code) => code.slice(0, 4) + "-" + code.slice(4);

function randomCode() {
  const bytes = new Uint8Array(CODE_LEN);
  crypto.getRandomValues(bytes);
  let out = "";
  // Rejection-free because 256 % 30 is not 0, so the low values are very
  // slightly favored. At 6.6e11 codes and a ten-guess limit that bias buys an
  // attacker nothing, and the alternative is a loop that can in principle spin.
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

/** True when this record can still be spent. One place, so signup and the admin
    listing can never disagree about what "used" means. */
function codeSpendable(rec) {
  if (!rec) return false;
  if ((rec.uses || 0) >= (rec.maxUses || 1)) return false;
  if (rec.expiresAt && Date.now() > rec.expiresAt) return false;
  return true;
}

function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+([A-Za-z0-9_-]+)$/.exec(h.trim());
  return m ? m[1] : null;
}

/** Resolve the caller, or null. Touches nothing on a miss. */
async function whoami(request, env) {
  const token = bearer(request);
  if (!token) return null;
  const id = await env.USERS.get(sessKey(token));
  if (!id) return null;
  const rec = await env.USERS.get(userKey(id), "json");
  return rec ? { rec, token } : null;
}

/** Rolling failure counter, shared by every rate-limited path. */
async function attempts(env, bucket, limit = AUTH_LIMIT) {
  const key = `al:${bucket}:${Math.floor(Date.now() / 1000 / AUTH_WINDOW)}`;
  const used = parseInt((await env.LIMITS.get(key)) || "0", 10);
  return { over: used >= limit, key, used };
}
async function countFailure(env, buckets) {
  await Promise.all(buckets.map(async (b) => {
    const { key, used } = await attempts(env, b);
    await env.LIMITS.put(key, String(used + 1), { expirationTtl: AUTH_WINDOW * 2 });
  }));
}

async function startSession(env, rec) {
  const token = randomHex(32);
  await env.USERS.put(sessKey(token), rec.id, { expirationTtl: SESSION_TTL });
  rec.lastSeen = Date.now();
  await env.USERS.put(userKey(rec.id), JSON.stringify(rec));
  return { token, user: { id: rec.id, name: rec.name } };
}

/**
 * @param {Request} request
 * @param {object} env
 * @param {string} path  pathname, e.g. "/api/login"
 * @param {(body: any, status: number) => Response} json  pre-bound with the CORS origin
 */
export async function handleAccounts(request, env, path, json) {
  if (!env.USERS) {
    return json({ error: { message:
      "Accounts are not configured on this deployment: the USERS KV namespace is " +
      "missing. Create it and redeploy the Worker." } }, 503);
  }

  const method = request.method;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  let body = {};
  if (method === "POST" || method === "PUT") {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: { message: "Too large." } }, 413);
    if (raw) {
      try { body = JSON.parse(raw); }
      catch { return json({ error: { message: "Malformed JSON." } }, 400); }
    }
  }

  /* -------------------------------------------------------------- signup */
  if (path === "/api/signup" && method === "POST") {
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const invite = normalizeCode(body.invite);

    // Shape first: it costs nothing and it is the common failure, so the person
    // who dropped a character gets told that instead of a generic refusal.
    if (!invite) {
      return json({ error: { message:
        "That signup code doesn't look right — it's eight characters, like K7M2-PQ4X." } }, 400);
    }
    if (name.length < 2)   return json({ error: { message: "Pick a name with at least 2 characters." } }, 400);
    if (name.length > 120) return json({ error: { message: "That name is too long." } }, 400);
    if (password.length < MIN_PASSWORD) {
      return json({ error: { message:
        `Password needs at least ${MIN_PASSWORD} characters.` } }, 400);
    }
    if ((await attempts(env, `ip:${ip}`)).over) {
      return json({ error: { message: "Too many attempts. Wait fifteen minutes." } }, 429);
    }
    if ((await attempts(env, `iv:${ip}`, INVITE_LIMIT)).over) {
      return json({ error: { message:
        "Too many wrong signup codes from this connection. Wait fifteen minutes." } }, 429);
    }
    if (await env.USERS.get(nameKey(name))) {
      return json({ error: { message: "That name is already taken." } }, 409);
    }

    // Derived before the code is read, not after. The window in which two
    // requests can both see one unused code is the gap between reading it and
    // marking it spent, and PBKDF2 at 100k iterations is ~100ms of wall clock —
    // easily the widest thing that could sit in that gap. Moving it above the
    // read leaves a couple of KV round trips there instead.
    const salt = randomHex(16);
    const rec = {
      id: "p_" + randomHex(8), name, salt,
      hash: await derive(password, salt),
      kdf: `pbkdf2-sha256-${ITER}`,
      created: Date.now(), lastSeen: Date.now(),
      invite,
    };

    const code = await env.USERS.get(codeKey(invite), "json");
    if (!codeSpendable(code)) {
      // One message for never-existed, already-spent and expired. Which of the
      // three it was is only useful to somebody working through the code space.
      await countFailure(env, [`iv:${ip}`]);
      return json({ error: { message:
        "That signup code isn't valid, or it's already been used." } }, 403);
    }

    /* Spend the code BEFORE writing the account. KV has no compare-and-swap, so
       two requests that read the same unused code in the same instant can both
       get here; marking first narrows that to the width of one put instead of
       the width of an account creation. It cannot close it, and it does not need
       to — on a board shared with a dozen friends, one code used twice is worth
       nothing to an attacker and shows up in usedBy afterwards. A Durable Object
       for a counter that ticks a dozen times a season is not the trade. */
    code.uses = (code.uses || 0) + 1;
    code.usedBy = (code.usedBy || []).concat([{ id: rec.id, name, at: Date.now(), ip }]);
    await env.USERS.put(codeKey(invite), JSON.stringify(code));

    try {
      // KV is eventually consistent, so two signups racing on one name can both
      // pass the check above. On a private board shared with a dozen friends that
      // is a theoretical loss of a name, not of data: each account keeps its own
      // id and its own state, and the loser simply cannot sign in under that name.
      await env.USERS.put(userKey(rec.id), JSON.stringify(rec));
      await env.USERS.put(nameKey(name), rec.id);
    } catch (e) {
      // Hand the code back rather than eating it on an error the user did not
      // cause — they have no way to get another one except by asking.
      code.uses -= 1;
      code.usedBy.pop();
      await env.USERS.put(codeKey(invite), JSON.stringify(code));
      throw e;
    }
    return json(await startSession(env, rec), 200);
  }

  /* --------------------------------------------------------------- login */
  if (path === "/api/login" && method === "POST") {
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const buckets = [`ip:${ip}`, `nm:${name.toLowerCase()}`];

    /* Only the IP bucket can refuse a sign-in. Both buckets are still counted
       below, because the name count is what tells you afterwards that someone
       was working on one account rather than sweeping — but a bucket keyed on
       the account name must never be the thing that turns a *correct* password
       away. Names on this board are the names of a dozen friends, so anyone who
       knows one could spend twenty requests from any address that is not the
       owner's and lock the owner out for fifteen minutes. At 18:50 on draft
       night that is the whole app. Rate-limiting the address is the half that
       actually costs an attacker something: it cannot be aimed at a chosen
       victim, and multiplying it means multiplying IPs. */
    if ((await attempts(env, `ip:${ip}`)).over) {
      return json({ error: { message:
        "Too many sign-in attempts. Wait fifteen minutes and try again." } }, 429);
    }
    const id = await env.USERS.get(nameKey(name));
    const rec = id ? await env.USERS.get(userKey(id), "json") : null;

    // One message for both halves, so this cannot be used to enumerate names.
    if (!rec || !sameHash(await derive(password, rec.salt), rec.hash)) {
      await countFailure(env, buckets);
      return json({ error: { message: "That name and password don't match an account." } }, 401);
    }
    return json(await startSession(env, rec), 200);
  }

  /* --------------------------------------------------------- admin: codes */
  /* Minting is a job for whoever owns the deployment, not for an account, so
     this is gated on a secret rather than on a session — there is no notion of
     an admin user and adding one would mean a role on every record.

     A missing or wrong token gets the same 404 an unknown route does. A 401
     would confirm that there is something here to find a token for, and this is
     the only path on the Worker that can create the thing signup requires. */
  if (path === "/api/admin/codes") {
    const supplied = bearer(request) || "";
    const secret = env.ADMIN_TOKEN || "";
    if (!secret || !sameHash(supplied, secret)) {
      if (supplied) await countFailure(env, [`iv:${ip}`]);
      return json({ error: { message: "No such endpoint." } }, 404);
    }

    if (method === "GET") {
      // Small by construction — a code per person invited. If this ever needs
      // paging, the thing to fix is upstream of the listing.
      const listed = await env.USERS.list({ prefix: "ic:", limit: 1000 });
      const codes = await Promise.all(listed.keys.map(async (k) => {
        const rec = await env.USERS.get(k.name, "json");
        return rec && { ...rec, display: formatCode(rec.code), spendable: codeSpendable(rec) };
      }));
      return json({ codes: codes.filter(Boolean).sort((a, b) => b.created - a.created) }, 200);
    }

    if (method === "POST") {
      const count = Math.min(50, Math.max(1, parseInt(body.count, 10) || 1));
      const maxUses = Math.min(50, Math.max(1, parseInt(body.maxUses, 10) || 1));
      const days = Math.max(0, parseInt(body.expiresDays, 10) || 0);
      const note = String(body.note || "").slice(0, 200);
      const made = [];
      for (let i = 0; i < count; i++) {
        // A collision here would silently hand out a code that already belongs
        // to somebody. At 6.6e11 it will not happen; checking costs one read.
        let code = randomCode();
        while (await env.USERS.get(codeKey(code))) code = randomCode();
        const rec = {
          code, note, source: "manual",
          created: Date.now(),
          expiresAt: days ? Date.now() + days * 86400000 : 0,
          maxUses, uses: 0, usedBy: [], capture: "",
        };
        await env.USERS.put(codeKey(code), JSON.stringify(rec));
        made.push(formatCode(code));
      }
      return json({ codes: made }, 200);
    }

    return json({ error: { message: "No such endpoint." } }, 404);
  }

  /* ------------------------------------------------------- session, state */
  const who = await whoami(request, env);

  if (path === "/api/logout" && method === "POST") {
    if (who) await env.USERS.delete(sessKey(who.token));
    return json({ ok: true }, 200);
  }

  if (!who) return json({ error: { message: "Not signed in." }, signedOut: true }, 401);

  if (path === "/api/session" && method === "GET") {
    return json({ user: { id: who.rec.id, name: who.rec.name } }, 200);
  }

  if (path === "/api/state") {
    if (method === "GET") {
      const cur = await env.USERS.get(stateKey(who.rec.id), "json");
      return json(cur || { rev: 0, updatedAt: 0, device: "", state: null }, 200);
    }
    if (method === "PUT") {
      const cur = (await env.USERS.get(stateKey(who.rec.id), "json")) || { rev: 0 };
      const sentRev = parseInt(body.rev, 10) || 0;

      // The client says which revision it was editing. If the server has moved
      // past it, another device wrote in the meantime and this write would
      // silently eat it — hand back what is there and let the app ask.
      if (sentRev !== (cur.rev || 0) && !body.force) {
        return json({ conflict: true, ...cur }, 409);
      }
      const next = {
        rev: (cur.rev || 0) + 1,
        updatedAt: Date.now(),
        device: String(body.device || "").slice(0, 60),
        state: body.state == null ? null : body.state,
      };
      await env.USERS.put(stateKey(who.rec.id), JSON.stringify(next));
      return json({ rev: next.rev, updatedAt: next.updatedAt }, 200);
    }
  }

  return json({ error: { message: "No such endpoint." } }, 404);
}
