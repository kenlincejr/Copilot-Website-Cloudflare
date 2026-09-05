/* node ff/tools/test-app.js — a Node harness for the ten functions in app.js
   whose failure would change a pick or lose a draft: analyze, record, undo,
   keeperAt, myPickNumbers, simulateToMyPick, gradeDraft, runMock, playerIn,
   briefStale.

   app.js is a 4,000+ line browser IIFE. It reads `document`, `window` and
   `localStorage` the moment it loads (session check, touch detection, the
   saved draft), and none of its internals are exported — every function above
   is a local variable inside one closure. Two ways to get at them were on the
   table: pull the pure logic out into a second file, or run the real,
   unmodified file in a sandboxed context with a fake DOM and grab the
   functions off a line appended to a copy of its text. This harness does the
   second. Nothing in assets/app.js is edited — a copy of its source is read
   into a string, one export line is appended just before the closing `})();`,
   and the result is run with Node's `vm` module against the fake
   document/window/localStorage/fetch built below. A fresh sandbox is built
   for every scenario, so no test's board state can leak into another's.

   One instrumentation, not an export: runMock() only ever returns
   summarizeMock()'s output, which already deduplicates a repeated name before
   handing it back — exactly the shape that would hide the bug this file is
   here to pin. To see the actual roster runMock built before that dedup runs,
   the in-memory copy gets one extra line appended right after the real
   `runs.push(mine);so a capture array can see what was really assembled.
   That is the only line in the file this harness alters, it is applied to the
   in-memory string only, and app.js on disk is never touched. */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

require(path.join(__dirname, "../data/players.js"));
require(path.join(__dirname, "../assets/presets.js"));
var ENGINE = require(path.join(__dirname, "../assets/engine.js"));
require(path.join(__dirname, "../assets/strategies.js"));

var DATA = globalThis.DRAFTLINE_DATA;
var PRESETS = globalThis.DRAFTLINE_PRESETS;
var STRATS = globalThis.DRAFTLINE_STRATEGIES;
var KNOB_SPEC = globalThis.DRAFTLINE_KNOB_SPEC;

var APP_PATH = path.join(__dirname, "../assets/app.js");

var pass = 0, fail = 0;
function ok(label, cond, detail) {
  (cond ? pass++ : fail++);
  console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  — " + detail : ""));
}

/* ------------------------------------------------------------- fake DOM ---
   Permissive on purpose: these ten functions do real work (composite scoring,
   pick bookkeeping, simulation) and touch the DOM only to report the result.
   A generic auto-vivifying element — any property read that was not set comes
   back as a harmless function, any property write just sticks — lets the real
   render() pipeline run to completion under it without this file having to
   anticipate every selector app.js queries. */
function makeStyleProxy() {
  var store = {};
  return new Proxy(store, {
    get: function (t, k) { return k in t ? t[k] : ""; },
    set: function (t, k, v) { t[k] = v; return true; }
  });
}

function makeClassList() {
  var set = {};
  return {
    add: function () { for (var i = 0; i < arguments.length; i++) set[arguments[i]] = true; },
    remove: function () { for (var i = 0; i < arguments.length; i++) delete set[arguments[i]]; },
    toggle: function (c, force) {
      var has = !!set[c];
      var next = force === undefined ? !has : !!force;
      if (next) set[c] = true; else delete set[c];
      return next;
    },
    contains: function (c) { return !!set[c]; }
  };
}

function makeFakeElement(tag) {
  var handlers = {};
  var base = {
    tagName: String(tag || "div").toUpperCase(),
    id: "", className: "", textContent: "", innerText: "", innerHTML: "",
    value: "", checked: false, disabled: false, hidden: false, readOnly: false,
    placeholder: "", dataset: {}, style: makeStyleProxy(), classList: null,
    children: [], onclick: null, onchange: null, onkeydown: null, oninput: null,
    _attrs: {},
    addEventListener: function (type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
    removeEventListener: function (type, fn) {
      if (handlers[type]) handlers[type] = handlers[type].filter(function (h) { return h !== fn; });
    },
    dispatchEvent: function (evt) {
      var type = evt && evt.type;
      (handlers[type] || []).forEach(function (h) { try { h.call(base, evt); } catch (e) {} });
      return true;
    },
    click: function () {
      base.dispatchEvent({ type: "click" });
      if (typeof base.onclick === "function") base.onclick({ type: "click" });
    },
    focus: function () {}, blur: function () {}, remove: function () {}, scrollIntoView: function () {},
    appendChild: function (c) { base.children.push(c); return c; },
    removeChild: function (c) { base.children = base.children.filter(function (x) { return x !== c; }); return c; },
    insertAdjacentElement: function () { return base; },
    insertAdjacentHTML: function () {},
    setAttribute: function (k, v) { base._attrs[k] = String(v); },
    getAttribute: function (k) { return Object.prototype.hasOwnProperty.call(base._attrs, k) ? base._attrs[k] : null; },
    removeAttribute: function (k) { delete base._attrs[k]; },
    hasAttribute: function (k) { return Object.prototype.hasOwnProperty.call(base._attrs, k); },
    querySelector: function () { return makeFakeElement("div"); },
    querySelectorAll: function () { return []; },
    closest: function () { return null; },
    contains: function () { return false; },
    matches: function () { return false; },
    getBoundingClientRect: function () { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
  };
  base.classList = makeClassList();
  return new Proxy(base, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (typeof p === "symbol") return undefined;
      return function () { return undefined; };
    },
    set: function (t, p, v) { t[p] = v; return true; }
  });
}

function makeFakeDocument() {
  var cache = {};
  function forSelector(sel) {
    if (!Object.prototype.hasOwnProperty.call(cache, sel)) cache[sel] = makeFakeElement("div");
    return cache[sel];
  }
  return {
    body: forSelector("body"), documentElement: forSelector("html"), head: forSelector("head"),
    activeElement: null, visibilityState: "visible", cookie: "",
    querySelector: function (sel) { return forSelector(sel); },
    querySelectorAll: function () { return []; },
    getElementById: function (id) { return forSelector("#" + id); },
    createElement: function (tag) { return makeFakeElement(tag); },
    createTextNode: function (t) { return { textContent: t }; },
    addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return true; }
  };
}

function makeFakeLocalStorage(seed) {
  var store = {};
  Object.keys(seed || {}).forEach(function (k) { store[k] = seed[k]; });
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; },
    key: function (i) { return Object.keys(store)[i] || null; }
  };
}

/**
 * Build a fresh sandbox, seed localStorage with the given league/picks, run
 * the real app.js source (with the one capture line added) in it, and hand
 * back the functions under test. `opts.reintroduceKeeperBug` runs the OLD,
 * broken one-line version of the pending-keeper guard instead — used once
 * below to prove this harness can actually fail.
 */
function loadApp(leagueState, picksState, opts) {
  opts = opts || {};
  var me = { id: "t1", name: "Tester" };
  var sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.console = console;
  sandbox.setTimeout = setTimeout; sandbox.clearTimeout = clearTimeout;
  sandbox.setInterval = function () { return 0; }; sandbox.clearInterval = function () {};
  sandbox.navigator = { userAgent: "node-test-harness" };
  sandbox.location = { href: "", pathname: "/app.html", search: "", replace: function () {}, reload: function () {} };
  sandbox.document = makeFakeDocument();
  sandbox.matchMedia = function () { return { matches: false }; };
  // app.js binds window-level listeners at load (resize, beforeunload, and the
  // rest). Without these the sandbox throws on the first one and the whole
  // suite never gets as far as its first assertion.
  sandbox.addEventListener = function () {};
  sandbox.removeEventListener = function () {};
  sandbox.fetch = function () { return Promise.reject(new Error("no network in tests")); };
  sandbox.AbortController = function () { this.signal = {}; };
  sandbox.AbortController.prototype.abort = function () {};

  var seed = {};
  seed["draftline.state." + me.id] = JSON.stringify({ league: leagueState, picks: picksState || [] });
  seed["draftline.quickstart." + me.id] = "1";   // skip the first-run guide
  sandbox.localStorage = makeFakeLocalStorage(seed);

  sandbox.DRAFTLINE_ENGINE = ENGINE;
  sandbox.DRAFTLINE_PRESETS = PRESETS;
  sandbox.DRAFTLINE_DATA = DATA;
  sandbox.DRAFTLINE_STRATEGIES = STRATS;
  sandbox.DRAFTLINE_KNOB_SPEC = KNOB_SPEC;
  sandbox.DRAFTLINE_SYNC = undefined;
  // No proxy, no key: claudeReady() is false, so render()'s call into
  // renderBrief() returns immediately and never reaches fetch.
  sandbox.DRAFTLINE_CONFIG = { claudeProxy: "", build: "" };
  sandbox.DRAFTLINE_AUTH = { current: function () { return me; }, logout: function () {} };
  sandbox.DRAFTLINE_HYDRATION = {};

  vm.createContext(sandbox);

  var src = fs.readFileSync(APP_PATH, "utf8");

  if (opts.reintroduceKeeperBug) {
    // The file is checked out with CRLF line endings on this machine — match
    // whichever the copy in memory actually uses rather than hardcoding one,
    // so this does not silently stop matching the day someone's editor
    // normalizes it.
    var eol = src.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
    var buggy =
      "        if (ownerOfPick(pk).slot === S.league.slot && byName[k.name] &&" + eol +
      "            !mine.some(function (q) { return q.name === k.name; })) mine.push(byName[k.name]);";
    var reverted =
      "        if (ownerOfPick(pk).slot === S.league.slot && byName[k.name]) mine.push(byName[k.name]);";
    if (src.indexOf(buggy) < 0) {
      throw new Error("could not find the seededMine guard to revert in a scratch copy — " +
        "app.js has moved since this harness was written; re-check the fix near `seededMine` " +
        "before trusting this result");
    }
    src = src.replace(buggy, reverted);
  }

  var marker = "runs.push(mine);";
  var occurrences = src.split(marker).length - 1;
  if (occurrences !== 1) {
    throw new Error("expected exactly one `runs.push(mine);` in app.js to instrument, found " +
      occurrences + " — app.js has changed shape, re-check before trusting runMock tests");
  }
  src = src.replace(marker, marker + " if (globalThis.__RUNMOCK_CAPTURE__) globalThis.__RUNMOCK_CAPTURE__.push(mine.slice());");

  var closeIdx = src.lastIndexOf("})();");
  if (closeIdx < 0) {
    throw new Error("app.js no longer ends with the expected `})();` wrapper — re-check before trusting this harness");
  }
  var exportLine =
    "\nglobalThis.__APP_TEST__ = { analyze: analyze, record: record, undo: undo, " +
    "keeperAt: keeperAt, myPickNumbers: myPickNumbers, simulateToMyPick: simulateToMyPick, " +
    "gradeDraft: gradeDraft, runMock: runMock, playerIn: playerIn, briefStale: briefStale, " +
    "getState: function () { return S; }, getAnalysis: function () { return A; }, " +
    "currentPick: currentPick, ownerOfPick: ownerOfPick, pickNumberFor: pickNumberFor, " +
    "draftedNames: draftedNames, allRosters: allRosters };\n";
  src = src.slice(0, closeIdx) + exportLine + src.slice(closeIdx);

  vm.runInContext(src, sandbox, { filename: "app.js (sandboxed copy, test-app.js)" });

  var api = sandbox.__APP_TEST__;
  api._sandbox = sandbox;
  return api;
}

/* ------------------------------------------------------------- fixtures ---
   The league from the brief: Kinda Highlanders, 12 teams, slot 11, 15 rounds,
   Drake Maye kept in round 5 (pick 59). Independently hand-computed schedule
   (not read from engine.js, so this does not just check the engine agrees
   with itself): odd rounds put slot 11 at idx 11, even rounds flip to
   teams-slot+1 = 2, and pick = (round-1)*teams + idx. */
function kindaHighlandersLeague(overrides) {
  var base = {
    preset: "kinda_highlanders",
    rules: JSON.parse(JSON.stringify(PRESETS.kinda_highlanders)),
    mode: "live",
    teams: 12, slot: 11, rounds: 15,
    keepers: [{ name: "Drake Maye", round: 5 }],
    byeTolerance: 3, defFloorRound: 7
  };
  return Object.assign(base, overrides || {});
}

var EXPECTED_SCHEDULE = [11, 14, 35, 38, 59, 62, 83, 86, 107, 110, 131, 134, 155, 158, 179];

/* ========================================================================
   1. keeperAt
   ======================================================================== */
console.log("\n== keeperAt ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var atKeeper = api.keeperAt(59);
  ok("pick 59 (round 5, slot 11) is the keeper", !!atKeeper && atKeeper.name === "Drake Maye",
     JSON.stringify(atKeeper));
  ok("pick 58 is not a keeper pick", !api.keeperAt(58));
  ok("pick 60 is not a keeper pick", !api.keeperAt(60));
  // A keeper is per-round-and-slot, not per-pick-number-mod-anything: round 5 for
  // a DIFFERENT slot must not also read as kept.
  var otherSlotLeague = kindaHighlandersLeague({ keepers: [{ name: "Drake Maye", round: 5, slot: 3 }] });
  var api2 = loadApp(otherSlotLeague, []);
  ok("a keeper held by slot 3 does not show up at slot 11's round-5 pick",
     !api2.keeperAt(59));
})();

/* ========================================================================
   2. myPickNumbers
   ======================================================================== */
console.log("\n== myPickNumbers ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var got = api.myPickNumbers();
  ok("all 15 picks for slot 11 of 12 match the hand-computed snake schedule",
     JSON.stringify(got) === JSON.stringify(EXPECTED_SCHEDULE), got.join(","));

  // Slot 1 never flips: it is always the low index in odd rounds and the high
  // index in even rounds.
  var api2 = loadApp(kindaHighlandersLeague({ slot: 1, keepers: [] }), []);
  ok("slot 1 pick 1 is pick 1", api2.myPickNumbers()[0] === 1);
  ok("slot 1 pick 2 is pick 24 (last pick of round 2, 12 teams)", api2.myPickNumbers()[1] === 24);
})();

/* ========================================================================
   3. record
   ======================================================================== */
console.log("\n== record ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var before = api.currentPick();
  ok("draft starts on the clock at pick 1", before === 1);

  api.record("Ja'Marr Chase", true);
  var s = api.getState();
  ok("recording a real player advances the pick count", api.currentPick() === 2);
  ok("the pick is logged with the right name", s.picks[0].name === "Ja'Marr Chase");
  ok("recorded to yourself is flagged mine", s.picks[0].mine === true);

  // A name not on the board must not be recorded at all — the guard at the top
  // of record() is the only thing standing between a typo and a phantom pick
  // nothing else in the app can ever reconcile.
  var lenBefore = api.getState().picks.length;
  api.record("Not A Real Player", true);
  ok("an unknown name is refused, not recorded", api.getState().picks.length === lenBefore);

  // In live mode, ownership follows the clock: recording at your own turn is
  // "mine" even if the caller passed mine:false (the mis-click case the
  // comment above record() describes).
  var api2 = loadApp(kindaHighlandersLeague(), Array.from({ length: 10 }, function (_, i) {
    return { pick: i + 1, name: null, slot: api.ownerOfPick(i + 1).slot, mine: false, unknown: true };
  }));
  ok("on-the-clock pick 11 is the user's own slot", api2.ownerOfPick(11).slot === 11);
  api2.record("Justin Jefferson", false);
  ok("a pick recorded on your own turn is credited to you even if mine=false was passed",
     api2.getState().picks[10].mine === true);
})();

/* ========================================================================
   4. undo
   ======================================================================== */
console.log("\n== undo ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  // Fill picks 1..58 with whatever the board likes best each time, so the
  // draft naturally reaches the round-5 keeper at pick 59 via syncKeepers().
  for (var i = 0; i < 58; i++) {
    var av = api.getAnalysis().avail;
    api.record(av[0].name, false);   // not quiet — getAnalysis() must see the pick next iteration
  }
  var afterFill = api.getState();
  ok("58 real picks plus the auto-synced keeper puts the log at 59",
     afterFill.picks.length === 59, "length " + afterFill.picks.length);
  ok("the last entry is the round-5 keeper", afterFill.picks[58].name === "Drake Maye" &&
     afterFill.picks[58].keeper === true);

  var lastRealName = afterFill.picks[57].name;
  api.undo();
  var afterUndo = api.getState();
  // undo() skips a keeper entry rather than "undoing" it (that would read as
  // un-keeping Drake Maye), so a single undo removes the keeper AND the real
  // pick underneath it in the same call.
  ok("undo removes both the auto-synced keeper and the real pick under it",
     afterUndo.picks.length === 57, "length " + afterUndo.picks.length);
  ok("the undone real pick is gone from the log",
     !afterUndo.picks.some(function (p) { return p.name === lastRealName && p.pick === 58; }));
  // The keeper itself is never deleted from the league — only its place in the
  // pick log rolled back. Re-recording pick 58 must bring him right back.
  ok("Drake Maye is still on the books as a keeper after undo",
     afterUndo.league.keepers.some(function (k) { return k.name === "Drake Maye"; }));
  var av2 = api.getAnalysis().avail;
  api.record(av2[0].name, false);
  var refilled = api.getState();
  ok("re-recording pick 58 re-syncs the keeper at 59 — undo cannot permanently un-keep him",
     refilled.picks.length === 59 && refilled.picks[58].name === "Drake Maye");
})();

/* ========================================================================
   5. simulateToMyPick
   ======================================================================== */
console.log("\n== simulateToMyPick ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var a0 = api.getAnalysis();
  ok("at pick 1 the user's next pick is 11", a0.myNext === 11);
  api.simulateToMyPick();
  var s = api.getState();
  ok("simulating to pick 11 records exactly the 10 picks before it",
     s.picks.length === 10, "length " + s.picks.length);
  ok("the draft is now on the clock at pick 11", api.currentPick() === 11);
  var names = s.picks.map(function (p) { return p.name; });
  ok("no player was drafted twice by the simulation",
     new Set(names).size === names.length);
  ok("none of the simulated picks were credited to the user",
     s.picks.every(function (p) { return p.mine !== true; }));

  // The guard is 120 iterations; the largest real gap on this schedule is 21
  // picks (14 to 35), so it must never bind.
  var api2 = loadApp(kindaHighlandersLeague(), Array.from({ length: 14 }, function (_, i) {
    var slot = api2Owner(i + 1);
    return { pick: i + 1, name: null, unknown: true, slot: slot, mine: slot === 11 };
  }));
  function api2Owner(pick) {
    var r = Math.ceil(pick / 12), idx = pick - (r - 1) * 12;
    return (r % 2 === 1) ? idx : (12 - idx + 1);
  }
  var before2 = api2.getAnalysis();
  ok("from pick 15 the next real pick is 35, a 21-pick gap", before2.cur === 15 && before2.myNext === 35);
  api2.simulateToMyPick();
  ok("the 120-iteration guard is nowhere close to binding on a 21-pick gap",
     api2.currentPick() === 35);
})();

/* ========================================================================
   6. gradeDraft
   ======================================================================== */
console.log("\n== gradeDraft ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var total = 12 * 15;
  var guard = 0;
  while (api.currentPick() <= total && guard++ < total + 5) {
    api.simulateToMyPick();
    if (api.currentPick() > total) break;
    var av = api.getAnalysis().avail;
    if (!av.length) break;
    // Never force mine:true here — a few picks after the user's own last one
    // (round 15 does not end the draft for every slot) belong to someone else,
    // and record()'s own on-the-clock detection is exactly what is under test
    // elsewhere; let it decide ownership the way the real UI does.
    api.record(av[0].name, false);
  }
  ok("a full 180-pick draft completed", api.currentPick() > total, "stopped at " + api.currentPick());

  var rows = api.gradeDraft();
  ok("gradeDraft returns one row per team", rows.length === 12, "rows " + rows.length);
  var ranks = rows.map(function (r) { return r.rank; }).sort(function (a, b) { return a - b; });
  ok("ranks are exactly 1..12, once each", JSON.stringify(ranks) === JSON.stringify(
    Array.from({ length: 12 }, function (_, i) { return i + 1; })));
  ok("rows are sorted by points, highest first",
     rows.every(function (r, i) { return i === 0 || rows[i - 1].pts >= r.pts; }));
  ok("every row got a real letter grade", rows.every(function (r) { return /^[A-D][+-]?$/.test(r.grade); }));
  var me = rows.find(function (r) { return r.isMe; });
  ok("the user's own team is in the table", !!me);
  ok("every team drafted a full 15-man roster", rows.every(function (r) { return r.picks === 15; }));
})();

/* ========================================================================
   7. runMock — the mandatory duplicate-keeper regression
   ======================================================================== */
console.log("\n== runMock ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var rounds = api.getState().league.rounds;
  api._sandbox.__RUNMOCK_CAPTURE__ = [];
  var summary = api.runMock({}, 5, 20260908);
  var captured = api._sandbox.__RUNMOCK_CAPTURE__;
  ok("runMock actually ran the requested 5 iterations", captured.length === 5, "" + captured.length);
  ok("summarizeMock reports the same run count", summary.runs === 5);

  captured.forEach(function (roster, i) {
    var names = roster.map(function (p) { return p.name; });
    ok("mock draft " + i + ": no duplicate player name in the roster",
       new Set(names).size === names.length, names.join(", "));
    ok("mock draft " + i + ": roster length equals the number of rounds (" + rounds + ")",
       roster.length === rounds, "got " + roster.length);
  });

  // Proof this test can fail: re-run the identical scenario against a scratch
  // copy of app.js with the old one-line pending-keeper guard restored (never
  // against the real file — see loadApp's reintroduceKeeperBug branch). The
  // bug pushed the pending keeper a second time every time the sim reached his
  // round, so every mocked roster held two Drake Mayes and was one slot over
  // the round count once he was double-counted against a 15-round roster.
  var buggyApi = loadApp(kindaHighlandersLeague(), [], { reintroduceKeeperBug: true });
  buggyApi._sandbox.__RUNMOCK_CAPTURE__ = [];
  buggyApi.runMock({}, 5, 20260908);
  var buggyCaptured = buggyApi._sandbox.__RUNMOCK_CAPTURE__;
  var anyDup = buggyCaptured.some(function (roster) {
    var names = roster.map(function (p) { return p.name; });
    return new Set(names).size !== names.length;
  });
  ok("reverting the fix in a scratch copy reproduces the duplicate-Maye bug " +
     "(this harness would have caught it)", anyDup);
})();

/* ========================================================================
   8. playerIn — the mandatory binding cases
   ======================================================================== */
console.log("\n== playerIn ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);

  // 1. "Take X over Y": two full player names both appear in the line. An
  // earlier version of playerIn() picked whichever name was longest, which
  // bound this exact sentence to "Ja'Marr Chase" — the player being passed
  // over — instead of "Chase Brown", the one actually recommended, or to
  // nobody. That version is gone (playerIn() now treats two non-overlapping
  // names in one line as ambiguous and returns null rather than guessing),
  // but the sentence is kept here as a permanent regression case: it is
  // exactly the shape of answer a real brief produces, and this must never
  // go back to resolving it to the wrong player.
  var r1 = api.playerIn("Take Chase Brown over Ja'Marr Chase");
  ok("\"Take Chase Brown over Ja'Marr Chase\" must not bind to Ja'Marr Chase " +
     "(the player being passed over) — nobody or Chase Brown are both acceptable",
     !r1 || r1.name !== "Ja'Marr Chase",
     r1 ? r1.name : "null");

  // 2. Trailing period.
  var r2 = api.playerIn("Take James Cook III.");
  ok("a trailing period does not break the match", r2 && r2.name === "James Cook III",
     r2 ? r2.name : "null");

  // 3. Apostrophe in the name.
  var r3 = api.playerIn("Take Ja'Marr Chase, the receiving floor is safer here.");
  ok("a name with an apostrophe matches", r3 && r3.name === "Ja'Marr Chase",
     r3 ? r3.name : "null");

  // 4. Suffix.
  var r4 = api.playerIn("Take James Cook III, he is my guy at this turn.");
  ok("a name with a suffix (III) matches the whole name, not a shorter prefix",
     r4 && r4.name === "James Cook III", r4 ? r4.name : "null");

  // 5. A nickname the board does not know: must bind to nobody, never to
  // whichever real player happens to share a surname.
  var r5 = api.playerIn("Take Hollywood Brown, he is finally healthy.");
  ok("a nickname the board has no record of binds to nobody, not to a same-surname player",
     r5 === null, r5 ? r5.name : "null");

  // Bonus: a curly apostrophe (what a language model actually types) against a
  // straight one in the data. Binding to nobody is safe; binding to the wrong
  // player would not be.
  var r6 = api.playerIn("Take Ja’Marr Chase, the receiving floor is safer here.");
  ok("a curly apostrophe does not cause a wrong bind (nobody is an acceptable answer)",
     r6 === null || r6.name === "Ja'Marr Chase", r6 ? r6.name : "null");
})();

/* ========================================================================
   9. briefStale
   ======================================================================== */
console.log("\n== briefStale ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var av = api.getAnalysis().avail;
  var pick = av[0].name;

  ok("a cached brief naming an available player is not stale",
     !api.briefStale("Take " + pick + ".\n\nHe is the clear top of the board.\n\nIf gone: someone else."));
  // Now take that exact player and confirm the same text is stale afterward.
  api.record(pick, true);
  ok("the same brief text is stale once its named player is off the board",
     api.briefStale("Take " + pick + ".\n\nHe is the clear top of the board.\n\nIf gone: someone else.") === true);
  ok("an error line (starting with !) is never treated as stale — there is no player to re-check",
     api.briefStale("!Claude took longer than 30 seconds to answer.") === false);
  ok("an empty cache entry is not stale", api.briefStale("") === false);
})();

/* ========================================================================
   10. analyze — spot checks on the pipeline undo/record/gradeDraft all lean on
   ======================================================================== */
console.log("\n== analyze ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  var a = api.getAnalysis();
  ok("analyze() runs at boot and produces a board", a && a.board && a.avail.length > 0);
  // The keeper is off the board from pick 1 (he never enters the pool at all),
  // so at the very start avail is the full board minus exactly him.
  ok("nobody real is drafted yet, so avail is the full board minus the one keeper",
     a.avail.length === a.all.length - 1);
  ok("myNext is the user's first real pick (11)", a.myNext === 11);
  ok("the keeper is not in the available pool", !a.avail.some(function (p) { return p.name === "Drake Maye"; }));
  ok("the keeper occupies the user's QB slot", a.mine.some(function (p) { return p.name === "Drake Maye"; }));

  // After a record, analyze() (called again via render()) must reflect it:
  // the drafted player leaves avail and the pick count moves.
  var top = a.avail[0].name;
  api.record(top, true);
  var a2 = api.getAnalysis();
  ok("a recorded player leaves the available pool", !a2.avail.some(function (p) { return p.name === top; }));
  ok("cur advances by one", a2.cur === a.cur + 1);
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail > 0 ? 1 : 0);
