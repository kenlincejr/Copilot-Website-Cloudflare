/* node ff/tools/test-sync.js — assets/sync.js has never had a test. It is the
   file that decides, every time a device opens the board, whose draft wins:
   this device's or the account's — and it is the newest, least exercised part
   of the whole app.

   sync.js is a small `(function (root) { ... })(globalThis)` wrapper, so it is
   run the same way test-app.js runs app.js: the real file's text, unmodified,
   inside a Node `vm` context whose `globalThis` is a fake root this harness
   controls (fetch, localStorage, addEventListener). No line of sync.js is
   altered in memory or on disk — unlike app.js it needs no instrumentation,
   because it already hands its whole public surface to `root.DRAFTLINE_SYNC`.

   THE CONFLICT MATRIX. hydrate() decides what to do from two facts: what the
   server has (empty / current / ahead / behind, relative to this device's
   last known revision) and what this device has (clean / dirty / absent).
   That is 4 x 3 = 12 cells. Reading the actual branches in hydrate():

     - "server empty" only checks whether local has anything at all — clean
       and dirty behave identically there (both get pushed up). So EMPTY x
       CLEAN and EMPTY x DIRTY are the same code path; both are tested, and
       the comment on each says so rather than pretending they are different.
     - "current" (serverRev === the rev this device last saw) skips the
       adopt/conflict branch entirely — CLEAN sits still, DIRTY still owes a
       push from a session that ended offline. CURRENT x ABSENT (a rev number
       on disk with no draft behind it) is pathological — it should not
       happen in normal use — and is tested only to confirm it does not
       crash, not because a real user hits it.
     - "ahead" and "behind" are NOT distinguished anywhere in hydrate(): the
       code only ever tests `serverRev === rev()`, never which one is larger.
       A per-device integer cannot tell direction without a vector clock, so
       AHEAD and BEHIND run the identical branch. That collapses the matrix
       in a way worth stating plainly: a clean device always silently adopts
       whatever the server currently holds, even if that is an OLDER draft
       than what this device already had (BEHIND x CLEAN, below) — that is
       surprising, it is not a bug this file is fixing, and it is exactly the
       kind of thing a test should pin down in writing rather than leave to
       be rediscovered on draft night. A dirty device, by contrast, always
       gets the conflict banner on any mismatch, in either direction — that
       is the one safety property that actually matters here, and both
       AHEAD x DIRTY and BEHIND x DIRTY are tested to confirm it holds both
       ways. BEHIND x ABSENT is genuinely unreachable — a device cannot both
       have no saved draft and a revision counter ahead of the server's — and
       is not given a test. */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var SYNC_PATH = path.join(__dirname, "../assets/sync.js");

var pass = 0, fail = 0;
function ok(label, cond, detail) {
  (cond ? pass++ : fail++);
  console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  — " + detail : ""));
}

function makeFakeLocalStorage(seed) {
  var store = {};
  Object.keys(seed || {}).forEach(function (k) { store[k] = seed[k]; });
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; },
    _dump: function () { return store; }
  };
}

/** A minimal fetch Response: `.ok`, `.status`, `.json()`. */
function fakeResponse(ok_, body, status) {
  return { ok: ok_, status: status || (ok_ ? 200 : 500), json: function () { return Promise.resolve(body); } };
}

/**
 * Build a fresh sandbox and run the real sync.js source in it. `fetchImpl(url,
 * opts)` stands in for the network; `calls` (an array this function returns
 * alongside the SYNC object) records every call so a test can assert on the
 * request body and method, not just the outcome.
 */
function loadSync(user, seed, fetchImpl) {
  var calls = [];
  var notices = [];
  var listeners = {};
  var sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.console = console;
  sandbox.setTimeout = setTimeout;
  sandbox.clearTimeout = clearTimeout;
  sandbox.navigator = { userAgent: "node-test-harness (Windows NT; Chrome-ish)" };
  sandbox.document = { visibilityState: "visible" };
  sandbox.addEventListener = function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); };
  sandbox.removeEventListener = function () {};
  sandbox.AbortController = function () { this.signal = {}; };
  sandbox.AbortController.prototype.abort = function () {};
  sandbox.fetch = function (url, opts) {
    calls.push({ url: url, method: (opts && opts.method) || "GET", body: opts && opts.body ? JSON.parse(opts.body) : null });
    return fetchImpl(url, opts);
  };
  sandbox.localStorage = makeFakeLocalStorage(seed || {});
  sandbox.DRAFTLINE_AUTH = {
    current: function () { return user; },
    token: function () { return user ? "tok-" + user.id : null; }
  };
  sandbox.DRAFTLINE_CONFIG = { claudeProxy: "https://fake.example" };

  vm.createContext(sandbox);
  var src = fs.readFileSync(SYNC_PATH, "utf8");
  vm.runInContext(src, sandbox, { filename: "sync.js (sandboxed copy, test-sync.js)" });

  var SYNC = sandbox.DRAFTLINE_SYNC;
  SYNC.onNotice = function (kind, info) { notices.push({ kind: kind, info: info }); };
  return { SYNC: SYNC, calls: calls, notices: notices, ls: sandbox.localStorage, fire: function (type, evt) {
    (listeners[type] || []).forEach(function (fn) { fn(evt || {}); });
  },
  // Flips what DRAFTLINE_AUTH.current() answers, in place — this is the one
  // thing an actual sign-out/sign-in changes. Used only by the script-12
  // test below to simulate a session teardown without rebuilding the sandbox
  // (which would also throw away the localStorage state under test).
  setUser: function (u) { user = u; } };
}

function draft(pickCount) {
  var picks = [];
  for (var i = 0; i < (pickCount || 0); i++) picks.push({ pick: i + 1, name: "Player " + i });
  return JSON.stringify({ league: { teams: 12, slot: 11 }, picks: picks });
}

var USER = { id: "u1", name: "Tester" };
var K_STATE = "draftline.state.u1", K_REV = "draftline.rev.u1", K_DIRTY = "draftline.dirty.u1";

/** Let queued microtasks (the promise chains inside sync.js) actually run. */
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

var failures = [];
function record(name, fn) {
  return fn().catch(function (e) { failures.push(name + ": " + (e && e.stack || e)); fail++; });
}

(async function main() {

  /* ===================================================================
     1. EMPTY x ABSENT — brand new account, nothing anywhere.
     =================================================================== */
  await record("EMPTY x ABSENT", async function () {
    var h = loadSync(USER, {}, function () { return Promise.resolve(fakeResponse(true, { rev: 0, state: null })); });
    var res = await h.SYNC.hydrate();
    ok("EMPTY x ABSENT: mode is empty", res.mode === "empty");
    ok("EMPTY x ABSENT: only the GET happened, nothing to push", h.calls.length === 1 && h.calls[0].method === "GET");
    ok("EMPTY x ABSENT: rev recorded as 0", h.ls.getItem(K_REV) === "0");
  });

  /* ===================================================================
     2/3. EMPTY x CLEAN and EMPTY x DIRTY — same branch either way: this
     device's draft becomes the account's, dirty or not.
     =================================================================== */
  for (var localDirty = 0; localDirty <= 1; localDirty++) (function (dirtyFlag) {
    return record("EMPTY x " + (dirtyFlag ? "DIRTY" : "CLEAN"), async function () {
      var seed = {}; seed[K_STATE] = draft(3); seed[K_DIRTY] = String(dirtyFlag);
      var putResponded = false;
      var h = loadSync(USER, seed, function (url, opts) {
        if (opts && opts.method === "PUT") { putResponded = true; return Promise.resolve(fakeResponse(true, { rev: 1, updatedAt: Date.now() })); }
        return Promise.resolve(fakeResponse(true, { rev: 0, state: null }));
      });
      var res = await h.SYNC.hydrate();
      ok("EMPTY x " + (dirtyFlag ? "DIRTY" : "CLEAN") + ": mode is seeded",
         res.mode === "seeded" && res.broughtOver === false);
      h.SYNC.flushNow();
      await tick();
      ok("EMPTY x " + (dirtyFlag ? "DIRTY" : "CLEAN") + ": the local draft was PUT to the server",
         putResponded && h.calls[1].body.rev === 0);
      ok("EMPTY x " + (dirtyFlag ? "DIRTY" : "CLEAN") + ": rev advances to what the server returned",
         h.ls.getItem(K_REV) === "1");
    });
  })(localDirty);

  /* ===================================================================
     4. CURRENT x CLEAN — steady state, the common case on every render.
     =================================================================== */
  await record("CURRENT x CLEAN", async function () {
    var seed = {}; seed[K_STATE] = draft(5); seed[K_REV] = "3"; seed[K_DIRTY] = "0";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 3, state: draft(5), device: "Mac · Safari" })); });
    var res = await h.SYNC.hydrate();
    ok("CURRENT x CLEAN: mode is current", res.mode === "current");
    ok("CURRENT x CLEAN: no push — nothing was owed", h.calls.length === 1);
  });

  /* ===================================================================
     5. CURRENT x DIRTY — this device owes an autosave from a session that
     ended before it could reach the server (e.g. closed while offline).
     =================================================================== */
  await record("CURRENT x DIRTY", async function () {
    var seed = {}; seed[K_STATE] = draft(5); seed[K_REV] = "3"; seed[K_DIRTY] = "1";
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") return Promise.resolve(fakeResponse(true, { rev: 4, updatedAt: Date.now() }));
      return Promise.resolve(fakeResponse(true, { rev: 3, state: draft(5), device: "Mac · Safari" }));
    });
    var res = await h.SYNC.hydrate();
    ok("CURRENT x DIRTY: mode is current", res.mode === "current");
    // hydrate() queues the owed push through the normal debounce (push()),
    // it does not send it inline — flushNow() is the same call pagehide
    // makes and is the fair way to observe it without a real 1.5s wait.
    h.SYNC.flushNow();
    await tick();
    ok("CURRENT x DIRTY: the owed autosave was pushed without being asked twice",
       h.calls.length === 2 && h.calls[1].method === "PUT");
  });

  /* ===================================================================
     6. CURRENT x ABSENT — pathological (a rev counter with no draft behind
     it). Only checked for "does not crash and does not push undefined".
     =================================================================== */
  await record("CURRENT x ABSENT (defensive only — not a reachable user state)", async function () {
    var seed = {}; seed[K_REV] = "3"; seed[K_DIRTY] = "0";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 3, state: draft(1) })); });
    var res = await h.SYNC.hydrate();
    ok("CURRENT x ABSENT: mode is current and nothing was pushed", res.mode === "current" && h.calls.length === 1);
  });

  /* ===================================================================
     7. AHEAD x ABSENT — the classic "sign in on a new device" case.
     =================================================================== */
  await record("AHEAD x ABSENT", async function () {
    var seed = {}; seed[K_REV] = "1";
    var serverDraft = draft(20);
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 5, state: serverDraft, device: "iPad · Safari", updatedAt: 111 })); });
    var res = await h.SYNC.hydrate();
    ok("AHEAD x ABSENT: mode is adopted", res.mode === "adopted" && res.from === "iPad · Safari");
    ok("AHEAD x ABSENT: the account's draft is now on this device", h.ls.getItem(K_STATE) === serverDraft);
    ok("AHEAD x ABSENT: rev catches up", h.ls.getItem(K_REV) === "5");
  });

  /* ===================================================================
     8. AHEAD x CLEAN — this device has a draft but has not touched it
     since its last sync, so the newer server copy silently wins.
     =================================================================== */
  await record("AHEAD x CLEAN", async function () {
    var localDraft = draft(2), serverDraft = draft(20);
    var seed = {}; seed[K_STATE] = localDraft; seed[K_REV] = "1"; seed[K_DIRTY] = "0";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 5, state: serverDraft, device: "iPad", updatedAt: 111 })); });
    var res = await h.SYNC.hydrate();
    ok("AHEAD x CLEAN: mode is adopted", res.mode === "adopted");
    ok("AHEAD x CLEAN: the clean local copy is replaced, not merged", h.ls.getItem(K_STATE) === serverDraft);
  });

  /* ===================================================================
     9. AHEAD x DIRTY — the real two-device race the brief cares about.
     Neither copy is touched until the user picks a side.
     =================================================================== */
  await record("AHEAD x DIRTY", async function () {
    var localDraft = draft(9), serverDraft = draft(20);
    var seed = {}; seed[K_STATE] = localDraft; seed[K_REV] = "1"; seed[K_DIRTY] = "1";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 5, state: serverDraft, device: "iPad · Safari", updatedAt: 222 })); });
    var res = await h.SYNC.hydrate();
    ok("AHEAD x DIRTY: mode is conflict", res.mode === "conflict");
    ok("AHEAD x DIRTY: neither copy is touched until resolved",
       h.ls.getItem(K_STATE) === localDraft && h.SYNC.hasConflict());
    ok("AHEAD x DIRTY: the conflict carries the other device's label", h.SYNC.conflict().device === "iPad · Safari");

    // "theirs": adopt the server's copy and say so with reload:true.
    var outcome = await h.SYNC.resolve("theirs");
    ok("resolve('theirs') hands back reload:true", outcome.reload === true);
    ok("resolve('theirs') writes the server's draft locally", h.ls.getItem(K_STATE) === serverDraft);
    ok("resolve('theirs') clears the conflict", !h.SYNC.hasConflict());
  });

  await record("AHEAD x DIRTY, resolved 'mine'", async function () {
    var localDraft = draft(9), serverDraft = draft(20);
    var seed = {}; seed[K_STATE] = localDraft; seed[K_REV] = "1"; seed[K_DIRTY] = "1";
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") return Promise.resolve(fakeResponse(true, { rev: 6, updatedAt: 333 }));
      return Promise.resolve(fakeResponse(true, { rev: 5, state: serverDraft, device: "iPad", updatedAt: 222 }));
    });
    await h.SYNC.hydrate();
    var outcome = await h.SYNC.resolve("mine");
    ok("resolve('mine') does not reload", outcome.reload === false);
    ok("resolve('mine') forces the local copy over the server", h.calls[1].body.force === true && h.calls[1].body.state === localDraft);
    ok("resolve('mine') keeps the local draft on this device", h.ls.getItem(K_STATE) === localDraft);
    ok("resolve('mine') clears the conflict", !h.SYNC.hasConflict());
  });

  /* ===================================================================
     11. BEHIND x CLEAN — an external server-side reset (a restored KV
     backup, an admin wiping a record) leaves the server ON AN OLDER
     revision than this device. hydrate() cannot tell BEHIND from AHEAD —
     it only tests inequality — so a clean device silently adopts the
     server's OLDER draft, discarding rounds this device already had. This
     is a real, if rare, way to lose picks; it is documented here rather
     than "fixed" because sync.js is not being edited for this workstream,
     and fixing it needs a real per-write clock, not a one-line patch.
     =================================================================== */
  await record("BEHIND x CLEAN (documents a real, rare data-loss path)", async function () {
    var newerLocal = draft(14), olderServer = draft(2);
    var seed = {}; seed[K_STATE] = newerLocal; seed[K_REV] = "9"; seed[K_DIRTY] = "0";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 2, state: olderServer, device: "reset", updatedAt: 1 })); });
    var res = await h.SYNC.hydrate();
    ok("BEHIND x CLEAN: hydrate cannot distinguish this from AHEAD and adopts the older copy",
       res.mode === "adopted" && h.ls.getItem(K_STATE) === olderServer,
       "local had 14 picks, server had 2, and the 14-pick copy was silently replaced");
  });

  /* ===================================================================
     12. BEHIND x DIRTY — the safety property that matters: ANY mismatch
     with unsynced local changes surfaces a conflict, regardless of which
     side is actually ahead.
     =================================================================== */
  await record("BEHIND x DIRTY", async function () {
    var newerLocal = draft(14), olderServer = draft(2);
    var seed = {}; seed[K_STATE] = newerLocal; seed[K_REV] = "9"; seed[K_DIRTY] = "1";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 2, state: olderServer, device: "reset", updatedAt: 1 })); });
    var res = await h.SYNC.hydrate();
    ok("BEHIND x DIRTY: a dirty device still gets a conflict, not a silent loss",
       res.mode === "conflict" && h.ls.getItem(K_STATE) === newerLocal);
  });

  /* (BEHIND x ABSENT is not tested: a device cannot hold a revision counter
     ahead of the server's own count while having no draft behind it — there
     is no path in the app that produces that combination.) */

  /* ===================================================================
     Bonus: an unreadable/truncated server payload must never overwrite a
     working local board — looksLikeADraft() is the guard, and this is what
     it is actually for.
     =================================================================== */
  await record("server payload fails looksLikeADraft, local has a draft", async function () {
    var localDraft = draft(4);
    var seed = {}; seed[K_STATE] = localDraft; seed[K_REV] = "1"; seed[K_DIRTY] = "0";
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") return Promise.resolve(fakeResponse(true, { rev: 9 }));
      return Promise.resolve(fakeResponse(true, { rev: 5, state: "\"just a string, not a draft\"" }));
    });
    var res = await h.SYNC.hydrate();
    ok("garbage from the server does not overwrite a working local board",
       res.mode === "seeded" && h.ls.getItem(K_STATE) === localDraft);
  });

  await record("server payload fails looksLikeADraft, local is absent", async function () {
    var seed = {}; seed[K_REV] = "1";
    var h = loadSync(USER, seed, function () { return Promise.resolve(fakeResponse(true, { rev: 5, state: "garbage" })); });
    var res = await h.SYNC.hydrate();
    ok("garbage from the server with nothing local yields empty, not a crash", res.mode === "empty");
  });

  /* ===================================================================
     legacyDraft(): the device-local profile a browser had before accounts
     existed must be adopted into a brand new account rather than silently
     stranded.
     =================================================================== */
  await record("legacy device-local draft is adopted into a new account", async function () {
    var legacy = draft(7);
    var seed = {
      "draftline.profiles": JSON.stringify({ "old-id-1": { lastSeen: 100 }, "old-id-2": { lastSeen: 500 } }),
      "draftline.state.old-id-1": draft(1),
      "draftline.state.old-id-2": legacy
    };
    var putSeen = false;
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") { putSeen = true; return Promise.resolve(fakeResponse(true, { rev: 1 })); }
      return Promise.resolve(fakeResponse(true, { rev: 0, state: null }));
    });
    var res = await h.SYNC.hydrate();
    ok("the newest legacy profile (by lastSeen) is the one adopted",
       res.mode === "seeded" && res.broughtOver === true);
    ok("it is copied under the account's own key", h.ls.getItem(K_STATE) === legacy);
    h.SYNC.flushNow();
    await tick();
    ok("and pushed up to the account", putSeen);
  });

  /* ===================================================================
     push()/flush(): the 409 branch outside of hydrate() — an autosave that
     goes up mid-draft and finds another device got there first.
     =================================================================== */
  await record("flush() 409 with a real competing draft surfaces a conflict", async function () {
    var seed = {}; seed[K_STATE] = draft(5); seed[K_REV] = "1"; seed[K_DIRTY] = "0";
    var competing = draft(50);
    var putCount = 0;
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") {
        putCount++;
        return Promise.resolve(fakeResponse(false, { conflict: true, rev: 9, state: competing, device: "Android · Chrome", updatedAt: 777 }, 409));
      }
      return Promise.resolve(fakeResponse(true, { rev: 1, state: draft(5) }));
    });
    await h.SYNC.hydrate();
    h.SYNC.push(draft(6));
    h.SYNC.flushNow();
    await tick();
    ok("exactly one PUT was attempted before the conflict surfaced", putCount === 1);
    ok("a 409 against a real draft sets hasConflict()", h.SYNC.hasConflict());
    ok("onNotice('conflict') fired so the app can show the banner",
       h.notices.some(function (n) { return n.kind === "conflict"; }));
    ok("the conflict remembers the competing device's label", h.SYNC.conflict().device === "Android · Chrome");
  });

  await record("flush() 409 against an empty/unreadable server state just catches up and retries", async function () {
    var seed = {}; seed[K_STATE] = draft(5); seed[K_REV] = "1"; seed[K_DIRTY] = "0";
    var puts = 0;
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") {
        puts++;
        if (puts === 1) return Promise.resolve(fakeResponse(false, { conflict: true, rev: 4, state: null }, 409));
        return Promise.resolve(fakeResponse(true, { rev: 5, updatedAt: 999 }));
      }
      return Promise.resolve(fakeResponse(true, { rev: 1, state: draft(5) }));
    });
    await h.SYNC.hydrate();
    h.SYNC.push(draft(6));
    h.SYNC.flushNow();
    await tick(); await tick();
    ok("a 409 with nothing real behind it retries instead of asking the user",
       puts === 2 && !h.SYNC.hasConflict());
    ok("no conflict banner was raised for an empty competing state",
       !h.notices.some(function (n) { return n.kind === "conflict"; }));
    ok("rev catches up to what the retry succeeded at", h.ls.getItem(K_REV) === "5");
  });

  /* ===================================================================
     Network failure: the draft must never be lost, only marked offline.
     =================================================================== */
  await record("a network failure during flush marks offline and keeps the write queued", async function () {
    var seed = {}; seed[K_STATE] = draft(5); seed[K_REV] = "1"; seed[K_DIRTY] = "0";
    var fail1 = true;
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") {
        if (fail1) { fail1 = false; return Promise.reject(new Error("network down")); }
        return Promise.resolve(fakeResponse(true, { rev: 2, updatedAt: 1 }));
      }
      return Promise.resolve(fakeResponse(true, { rev: 1, state: draft(5) }));
    });
    await h.SYNC.hydrate();
    h.SYNC.push(draft(6));
    h.SYNC.flushNow();
    await tick();
    ok("status is offline after the network failure", h.SYNC.status === "offline");
    ok("onNotice('offline') fired", h.notices.some(function (n) { return n.kind === "offline"; }));
    ok("dirty stays set — the write was not thrown away", h.ls.getItem(K_DIRTY) === "1");
    // The retry timer is on a real backoff (5s+); flushNow() is the same path
    // pagehide uses and is a fair stand-in for "try again right now".
    h.SYNC.flushNow();
    await tick();
    ok("retrying once the network is back succeeds and clears dirty", h.ls.getItem(K_DIRTY) === "0" && h.SYNC.status === "saved");
  });

  /* ===================================================================
     Script 9 — offline. Ten picks recorded while the network is down (the
     whole draft keeps running on localStorage regardless), then the network
     comes back. Every push() call replaces `pending` with the FULL current
     draft snapshot — this is a whole-state sync, not a per-pick queue — so
     "no loss and no duplication" here means the final successful PUT must
     carry all ten picks, in order, and none of the ten failed attempts in
     between is allowed to silently drop the growing state back to an
     earlier one. flushNow() stands in for the retry timer the same way the
     other network-failure test above does.
     =================================================================== */
  await record("script 9: ten saves offline, then the network returns", async function () {
    var seed = {}; seed[K_STATE] = draft(0); seed[K_REV] = "1"; seed[K_DIRTY] = "0";
    var netUp = false, puts = 0, lastPutBody = null;
    var h = loadSync(USER, seed, function (url, opts) {
      if (opts && opts.method === "PUT") {
        puts++;
        lastPutBody = opts.body ? JSON.parse(opts.body) : null;
        if (!netUp) return Promise.reject(new Error("network down"));
        return Promise.resolve(fakeResponse(true, { rev: 2, updatedAt: Date.now() }));
      }
      return Promise.resolve(fakeResponse(true, { rev: 1, state: draft(0) }));
    });
    await h.SYNC.hydrate();

    // Ten picks, each one an autosave attempt while the network is down.
    // Every attempt fails, and the draft must never stop growing underneath
    // the failures — each push carries the state as it stood after THAT
    // pick, ten names deep by the last one.
    for (var i = 1; i <= 10; i++) {
      h.SYNC.push(draft(i));
      h.SYNC.flushNow();
      await tick();
      ok("script 9: after failed save " + i + ", status reads offline (the UI's " +
         "\"offline\" state)", h.SYNC.status === "offline");
    }
    ok("script 9: all ten saves really did attempt a PUT while the network was down",
       puts === 10, "" + puts);
    ok("script 9: the draft is not lost — dirty stays set through every failure",
       h.ls.getItem(K_DIRTY) === "1");
    ok("script 9: onNotice('offline') fired at least once, the way the sync banner reads it",
       h.notices.some(function (n) { return n.kind === "offline"; }));

    // The network returns. The next flush — the same retry path the backoff
    // timer would eventually take on its own — must succeed and carry the
    // full ten-pick state, not a partial or stale one.
    netUp = true;
    h.SYNC.flushNow();
    await tick();
    ok("script 9: the queue actually flushed once the network came back",
       puts === 11, "" + puts);
    ok("script 9: sync status transitions to saved, the way the UI reports success",
       h.SYNC.status === "saved");
    ok("script 9: dirty clears now that the save went through",
       h.ls.getItem(K_DIRTY) === "0");
    ok("script 9: onNotice('saved') fired", h.notices.some(function (n) { return n.kind === "saved"; }));

    var sentPicks = lastPutBody && JSON.parse(lastPutBody.state).picks;
    ok("script 9: the payload that finally reached the server carries all ten picks",
       !!sentPicks && sentPicks.length === 10, sentPicks && sentPicks.length);
    ok("script 9: in order, first to last, with none lost or duplicated",
       sentPicks && JSON.stringify(sentPicks.map(function (p) { return p.pick; })) ===
       JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
       sentPicks && sentPicks.map(function (p) { return p.pick; }).join(","));
  });

  /* ===================================================================
     Script 12 — sign out and back in mid-draft. Signing out does not touch
     localStorage (app.js's own sign-out never clears the saved draft key —
     only "Start over" does that), so the draft the user was on is still
     sitting there; what has to be proven is that hydrate() running again
     under the same account, against a server that has not moved, hands the
     board back exactly what it had before the session tore down. This is
     the CURRENT x CLEAN branch, exercised explicitly across a simulated
     sign-out rather than as a single steady-state call.
     =================================================================== */
  await record("script 12: sign out and back in mid-draft", async function () {
    var midDraft = draft(23);
    var seed = {}; seed[K_STATE] = midDraft; seed[K_REV] = "7"; seed[K_DIRTY] = "0";
    var h = loadSync(USER, seed, function () {
      return Promise.resolve(fakeResponse(true, { rev: 7, state: midDraft, device: "Mac · Safari" }));
    });

    var before = await h.SYNC.hydrate();
    ok("script 12: signed in, the draft hydrates as current", before.mode === "current");
    var stateBeforeTeardown = h.ls.getItem(K_STATE);

    // "Sign out": the account context goes away (DRAFTLINE_AUTH.current()
    // starts answering null, exactly what it does after the app's own
    // logout — see app.js ~line 3357, AUTH.logout()). hydrate() run in that
    // state must not touch, let alone clear, the draft already on disk: the
    // whole point of local-first storage is that closing the session cannot
    // lose the board underneath it.
    h.setUser(null);
    var duringSignedOut = await h.SYNC.hydrate();
    ok("script 12: hydrate() with no session reports local, not empty or an error",
       duringSignedOut.mode === "local");
    ok("script 12: the draft is still on disk while signed out — nothing in " +
       "sign-out touches the saved draft key",
       h.ls.getItem(K_STATE) === stateBeforeTeardown);
    ok("script 12: the revision counter also survives the teardown untouched",
       h.ls.getItem(K_REV) === "7");

    // Sign back in, same account, server unchanged: hydrate() again must
    // reproduce the exact same draft, not merely "a" draft.
    h.setUser(USER);
    var after = await h.SYNC.hydrate();
    ok("script 12: signing back in mid-draft re-hydrates as current, not as a " +
       "fresh empty draft or a false conflict", after.mode === "current");
    ok("script 12: the draft state after rehydrating is byte-identical to what " +
       "it was before the session tore down",
       h.ls.getItem(K_STATE) === stateBeforeTeardown && h.ls.getItem(K_STATE) === midDraft);
    ok("script 12: the revision counter is unchanged — nothing was silently " +
       "renegotiated", h.ls.getItem(K_REV) === "7");
    ok("script 12: no conflict was raised over a session teardown with nothing " +
       "actually different on either side", !h.SYNC.hasConflict());
  });

  console.log("\n" + pass + " passed, " + fail + " failed\n");
  if (failures.length) { console.log(failures.join("\n")); }
  process.exit(fail > 0 ? 1 : 0);
})();
