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
 * Routes, all under /api/ so the bare-root Claude proxy keeps working for any
 * browser still running an older build of the page:
 *
 *   POST /api/signup   {name, password}      -> {token, user}
 *   POST /api/login    {name, password}      -> {token, user}
 *   POST /api/logout                         -> {ok}
 *   GET  /api/session                        -> {user}
 *   GET  /api/state                          -> {rev, updatedAt, device, state}
 *   PUT  /api/state    {rev, state, device}  -> {rev, updatedAt} | 409 conflict
 *
 * Everything but signup and login takes `Authorization: Bearer <token>`.
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
async function attempts(env, bucket) {
  const key = `al:${bucket}:${Math.floor(Date.now() / 1000 / AUTH_WINDOW)}`;
  const used = parseInt((await env.LIMITS.get(key)) || "0", 10);
  return { over: used >= AUTH_LIMIT, key, used };
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
    if (name.length < 2)   return json({ error: { message: "Pick a name with at least 2 characters." } }, 400);
    if (name.length > 120) return json({ error: { message: "That name is too long." } }, 400);
    if (password.length < MIN_PASSWORD) {
      return json({ error: { message:
        `Password needs at least ${MIN_PASSWORD} characters.` } }, 400);
    }
    if ((await attempts(env, `ip:${ip}`)).over) {
      return json({ error: { message: "Too many attempts. Wait fifteen minutes." } }, 429);
    }
    if (await env.USERS.get(nameKey(name))) {
      return json({ error: { message: "That name is already taken." } }, 409);
    }

    const salt = randomHex(16);
    const rec = {
      id: "p_" + randomHex(8), name, salt,
      hash: await derive(password, salt),
      kdf: `pbkdf2-sha256-${ITER}`,
      created: Date.now(), lastSeen: Date.now(),
    };
    // KV is eventually consistent, so two signups racing on one name can both
    // pass the check above. On a private board shared with a dozen friends that
    // is a theoretical loss of a name, not of data: each account keeps its own
    // id and its own state, and the loser simply cannot sign in under that name.
    await env.USERS.put(userKey(rec.id), JSON.stringify(rec));
    await env.USERS.put(nameKey(name), rec.id);
    return json(await startSession(env, rec), 200);
  }

  /* --------------------------------------------------------------- login */
  if (path === "/api/login" && method === "POST") {
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const buckets = [`ip:${ip}`, `nm:${name.toLowerCase()}`];
    for (const b of buckets) {
      if ((await attempts(env, b)).over) {
        return json({ error: { message:
          "Too many sign-in attempts. Wait fifteen minutes and try again." } }, 429);
      }
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
