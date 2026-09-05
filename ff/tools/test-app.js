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
    "claudeContext: claudeContext, briefCandidates: briefCandidates, " +
    "marketAdp: marketAdp, resetDraft: resetDraft, " +
    "stillNeedLine: stillNeedLine, startingSlots: startingSlots, " +
    "briefEyebrow: briefEyebrow, " +
    "supplyBlock: supplyBlock, " +
    "styleBlock: styleBlock, " +
    "teamsAheadBlock: teamsAheadBlock, runLine: runLine, " +
    "briefQuestion: briefQuestion, " +
    "writeBriefAt: function (forPick, cur) { briefWrittenAt[forPick] = cur; }, " +
    "briefWrittenAt: function () { return briefWrittenAt; }, " +
    "openStartingSlots: openStartingSlots, renderStatus: renderStatus, " +
    "briefTries: function () { return briefTries; }, " +
    "spendBriefTry: function (n) { briefTries[n] = 2; }, " +
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

/* ========================================================================
   D2 — the payload never claims a survival chance at a pick that does not exist
   ======================================================================== */
console.log("\n== claudeContext survival horizons (D2) ==");
(function () {
  // Fill the board with unknown picks up to a given pick number, so `cur` lands
  // where we want it. Who took them does not matter here — the two horizons are
  // read off myUpcoming(), not off the rosters.
  function atPick(n) {
    var picks = Array.from({ length: n - 1 }, function (_, i) {
      return { pick: i + 1, name: null, slot: null, mine: false, unknown: true };
    });
    var api = loadApp(kindaHighlandersLeague(), picks);
    return { api: api, A: api.getAnalysis(), text: api.claudeContext() };
  }

  // Waiting at 177 for the last pick of the draft. `A.myAfter` is null here, and
  // this is the state that used to print "still there at my FOLLOWING pick (179)
  // is 100%" alongside "chance he reaches ... (179) is 41%" — the same pick
  // number, two contradictory numbers, in one sentence.
  var late = atPick(177);
  ok("waiting at 177, the brief is written for pick 179", late.A.myNext === 179,
     "myNext " + late.A.myNext);
  ok("there is no pick after 179", late.A.myAfter === null, "myAfter " + late.A.myAfter);
  ok("waiting at 177: the first horizon still names 179",
     late.text.indexOf("chance he reaches the pick I am writing about (179)") >= 0);
  ok("waiting at 177: no claim about a FOLLOWING pick",
     late.text.indexOf("FOLLOWING pick") < 0);
  ok("waiting at 177: the placeholder 100% is gone",
     late.text.indexOf("is 100%") < 0);
  ok("waiting at 177: it says plainly that this is the last pick",
     late.text.indexOf("this is my last pick of the draft") >= 0);

  // On the clock at 179. Nothing is waiting, so the only survival sentence that
  // could appear is the false one.
  var onClock = atPick(179);
  ok("on the clock at 179, myNext is 179 and myAfter is null",
     onClock.A.myNext === 179 && onClock.A.myAfter === null,
     "myNext " + onClock.A.myNext + " myAfter " + onClock.A.myAfter);
  ok("on the clock at 179: no claim about a FOLLOWING pick",
     onClock.text.indexOf("FOLLOWING pick") < 0);
  ok("on the clock at 179: no 100% survival claim",
     onClock.text.indexOf("is 100%") < 0);

  // Mid-draft, both horizons exist and must name DIFFERENT picks. This is the
  // case the clause was written for and it has to keep working.
  var mid = atPick(10);
  ok("waiting at 10, the two horizons are picks 11 and 14",
     mid.A.myNext === 11 && mid.A.myAfter === 14,
     "myNext " + mid.A.myNext + " myAfter " + mid.A.myAfter);
  ok("waiting at 10: the first horizon names 11",
     mid.text.indexOf("chance he reaches the pick I am writing about (11)") >= 0);
  ok("waiting at 10: the second horizon names 14, not 11",
     mid.text.indexOf("FOLLOWING pick (14)") >= 0 &&
     mid.text.indexOf("FOLLOWING pick (11)") < 0);

  // Self-check: prove these assertions can fail. Rebuild the pre-fix expression
  // from the same analysis and confirm it produces exactly the falsehood the
  // assertions above are looking for — otherwise a passing test proves nothing.
  var A = late.A;
  var worst = A.avail.filter(function (q) { return !(q.compDetail && q.compDetail.blocked); })
                     .sort(function (a, b) { return b.comp - a.comp; })[0];
  var preFix = ", chance he is still there at my FOLLOWING pick (" +
    (A.myAfter || A.myNext) + ") is " + Math.round(worst.survNext * 100) + "%";
  ok("self-check: the pre-fix expression really did print a FOLLOWING pick of 179",
     preFix.indexOf("FOLLOWING pick (179)") >= 0, preFix);
  ok("self-check: and really did claim 100% for it",
     preFix.indexOf("is 100%") >= 0, preFix);
})();

/* ========================================================================
   briefCandidates — the survival filter may narrow, but it may not hide

   D3: `surv >= 0.25` is a normal CDF on ADP that does not know the player is
   still on the board, so it deletes anyone who outlived his ADP — exactly the
   players worth naming late. The rule under test is that no player the board
   rates above every player the filter kept can be missing from the list.
   ======================================================================== */
console.log("\n== briefCandidates (D3: the filter cannot hide the board's best) ==");
(function () {
  // Deterministic states. Unknown picks advance the clock without removing
  // anybody from the pool and without calling roomPick(), which falls back to
  // Math.random() and would make a pinned list meaningless. Note the flip side:
  // because nobody leaves the pool, elite players stay "available" long past
  // their ADP here, which is an artifact of the fixture and not a claim about a
  // real draft. It exercises the mechanism, not the magnitude.
  function atPick(n) {
    var picks = Array.from({ length: n - 1 }, function (_, i) {
      return { pick: i + 1, name: null, slot: null, mine: false, unknown: true };
    });
    return loadApp(kindaHighlandersLeague(), picks);
  }
  function names(api, waiting) {
    return api.briefCandidates(waiting, 12).map(function (p) { return p.name; });
  }
  // The pre-D3 selection, kept verbatim as the oracle these assertions are
  // measured against. It is the code that shipped, not a restatement of the fix.
  function oldSelection(A, limit) {
    var pool = A.avail.filter(function (p) { return !(p.compDetail && p.compDetail.blocked); })
                      .sort(function (a, b) { return b.comp - a.comp; });
    var live = pool.filter(function (p) { return p.surv >= 0.25; });
    if (live.length < 6) live = pool;
    return live.slice(0, limit);
  }

  // The on-the-clock branch has no survival filter and must not have moved.
  var ON_CLOCK_AT_11 = ["Jahmyr Gibbs", "Bijan Robinson", "Christian McCaffrey", "Puka Nacua",
    "Ja'Marr Chase", "Jonathan Taylor", "James Cook III", "De'Von Achane", "Chase Brown",
    "Jaxon Smith-Njigba", "Brock Bowers", "Amon-Ra St. Brown"];
  var ON_CLOCK_AT_86 = ["Jahmyr Gibbs", "Bijan Robinson", "Puka Nacua", "Ja'Marr Chase",
    "Brock Bowers", "Christian McCaffrey", "Jonathan Taylor", "Jaxon Smith-Njigba",
    "Amon-Ra St. Brown", "James Cook III", "De'Von Achane", "Chase Brown"];
  ok("on the clock at 11: unchanged by D3, the filter never applied here",
     JSON.stringify(names(atPick(11), false)) === JSON.stringify(ON_CLOCK_AT_11),
     JSON.stringify(names(atPick(11), false)));
  ok("on the clock at 86: unchanged by D3",
     JSON.stringify(names(atPick(86), false)) === JSON.stringify(ON_CLOCK_AT_86),
     JSON.stringify(names(atPick(86), false)));

  // The waiting branch. The board's top six were withheld here before D3.
  var a10 = atPick(10), A10 = a10.getAnalysis();
  var WAITING_AT_10 = ["Jahmyr Gibbs", "Bijan Robinson", "Christian McCaffrey", "Puka Nacua",
    "Ja'Marr Chase", "Jonathan Taylor", "James Cook III", "De'Von Achane", "Chase Brown",
    "Brock Bowers", "Derrick Henry", "Saquon Barkley"];
  ok("waiting at 10: the list now leads with the board's own #1",
     JSON.stringify(names(a10, true)) === JSON.stringify(WAITING_AT_10),
     JSON.stringify(names(a10, true)));

  // Self-check: the oracle must actually disagree, or the assertion above is
  // asserting nothing. Six names the shipped filter withheld at this state.
  var oldNames = oldSelection(A10, 12).map(function (p) { return p.name; });
  var withheld = WAITING_AT_10.filter(function (n) { return oldNames.indexOf(n) < 0; });
  ok("self-check: the pre-D3 filter really did withhold the board's top six here",
     withheld.length === 6, withheld.join(", "));
  ok("self-check: and its best permitted answer was the board's #7",
     oldNames[0] === "James Cook III", oldNames[0]);

  // The rule itself, stated directly: nobody above the best survivor is missing.
  [10, 35, 62, 110, 158, 177].forEach(function (n) {
    var api = atPick(n), A = api.getAnalysis();
    if (!(A.myNext > A.cur)) return;             // not a waiting state at this pick
    var pool = A.avail.filter(function (p) { return !(p.compDetail && p.compDetail.blocked); })
                      .sort(function (a, b) { return b.comp - a.comp; });
    var got = api.briefCandidates(true, 12);
    ok("waiting at " + n + ": the board's #1 (" + pool[0].name + ") is a candidate",
       got.indexOf(pool[0]) >= 0);
    ok("waiting at " + n + ": the list leads with him, rather than burying him",
       got[0] === pool[0], got[0].name + " vs " + pool[0].name);
    ok("waiting at " + n + ": the list is never smaller than it was before",
       got.length >= Math.min(12, oldSelection(A, 12).length),
       got.length + " vs " + oldSelection(A, 12).length);
  });

  // Marked entries carry the fact that put them there, and only marked ones do.
  var late = atPick(177);
  var marked = late.briefCandidates(true, 12).filter(function (p) { return p.briefPastAdp; });
  ok("at 177 the list contains players past their ADP and still on the board",
     marked.length > 0, marked.length + " marked");
  var payload = late.claudeContext();
  ok("the payload states the ADP fact for a marked player, as a fact",
     payload.indexOf("picks past, and he is still on the board") >= 0);
  ok("the payload no longer claims the list is exhaustive",
     payload.indexOf("almost certainly take are already removed") < 0);
  ok("and it explains what the filter actually reads",
     payload.indexOf("the filter reads ADP only") >= 0);

  // Blocked players stay out on both branches. Unchanged, and load-bearing.
  var blocked = atPick(86).briefCandidates(false, 12).filter(function (p) {
    return p.compDetail && p.compDetail.blocked;
  });
  ok("no capped-out player is ever a candidate", blocked.length === 0,
     blocked.map(function (p) { return p.name; }).join(", "));

  // The dead threshold is gone. It fired zero times in 168 sampled waiting
  // states across twelve simulated drafts; the smallest live list was 14.
  var src = require("fs").readFileSync(APP_PATH, "utf8");
  var fn = src.slice(src.indexOf("function briefCandidates"));
  fn = fn.slice(0, fn.indexOf("\n}"));
  ok("the under-six fallback constant is gone from briefCandidates()",
     fn.indexOf("length < 6") < 0);
})();

/* ========================================================================
   C1 — a pasted Yahoo ADP moves the market read, it does not become it

   Yahoo computes Draft Analysis ADP under STANDARD scoring; this league is
   full PPR. marketAdp() used to return that number outright, which imported
   the wrong scoring system into the room model. The level now comes from the
   full-PPR mock and Yahoo supplies only the seven-day movement.
   ======================================================================== */
console.log("\n== marketAdp (C1: movement, not the ranking) ==");
(function () {
  // normName() is app.js's own key function; mirror it exactly, because a key
  // that does not match means yadp is never set and every assertion below
  // passes vacuously.
  function normName(n) {
    return String(n || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[.']/g, " ").replace(/-/g, " ")
      .split(/\s+/)
      .filter(function (w) { return w && ["jr", "sr", "ii", "iii", "iv", "v"].indexOf(w) < 0; })
      .join(" ");
  }

  // Yahoo has him 12 picks later than the full-PPR mock and drifting 4 picks
  // earlier over the last week: the shape of a PPR receiver on a standard board.
  var TARGET = "Chris Olave";
  var base = DATA.players.filter(function (p) { return p.name === TARGET; })[0];
  ok("the fixture player is on the board", !!base, TARGET);

  var yahooAdp = {};
  yahooAdp[normName(TARGET)] = { all: base.adp + 12, recent: base.adp + 16, pct: 88, rank: 40 };
  var api = loadApp(kindaHighlandersLeague({ yahooAdp: yahooAdp }), []);
  var A = api.getAnalysis();
  var p = A.byName[TARGET];

  ok("the paste reached the player", p && p.yadp === base.adp + 12, "yadp " + (p && p.yadp));
  ok("the seven-day movement is carried", p.ytrend === -4, "ytrend " + p.ytrend);

  var m = api.marketAdp(p);
  ok("the market read is flagged real once a paste exists", m.real === true);
  ok("how often he is drafted at all survives — that is scoring-agnostic",
     m.pct === 88, "pct " + m.pct);

  // The claim itself. The level is the PPR mock; the only movement is Yahoo's.
  ok("the market ADP is built off the full-PPR mock, not Yahoo's standard number",
     Math.abs(m.adp - (base.adp - (-4) * 0.5)) < 1e-9,
     "got " + m.adp + ", ppr " + base.adp);
  ok("it is NOT Yahoo's standard-scoring number",
     Math.abs(m.adp - (p.yadp - (-4) * 0.5)) > 1,
     "got " + m.adp + ", the old answer would have been " + (p.yadp + 2));
  ok("the 12-pick standard-scoring gap does not reach the room model at all",
     Math.abs(m.adp - base.adp) === 2, "shift " + (m.adp - base.adp).toFixed(2));

  // Self-check: the pre-C1 expression, kept verbatim, must actually differ.
  var preFix = p.yadp - (p.ytrend || 0) * 0.5;
  ok("self-check: the shipped code really did return a number 14 picks later " +
     "(twelve of standard-scoring gap, two of movement)",
     Math.round(preFix - base.adp) === 14, "was " + preFix + " vs ppr " + base.adp);

  // With no movement to report, a paste must not move the number one pick.
  var flat = {};
  flat[normName(TARGET)] = { all: base.adp + 12, recent: base.adp + 12, pct: 88, rank: 40 };
  var api2 = loadApp(kindaHighlandersLeague({ yahooAdp: flat }), []);
  var p2 = api2.getAnalysis().byName[TARGET];
  ok("a paste with no seven-day drift leaves the market ADP exactly at the mock",
     api2.marketAdp(p2).adp === base.adp, "got " + api2.marketAdp(p2).adp);

  // And a player with no paste is untouched, as before.
  var other = A.avail.filter(function (q) { return q.yadp == null; })[0];
  var mo = api.marketAdp(other);
  ok("a player the paste did not cover still reads off the mock",
     mo.adp === other.adp && mo.real === false && mo.pct === null, other.name);
})();

/* ========================================================================
   D8 - a fresh draft starts with its re-ask budget intact
   ======================================================================== */
console.log("\n== resetDraft clears briefTries (D8) ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), []);
  api.spendBriefTry(11);
  ok("the fixture spent both re-asks at pick 11", api.briefTries()[11] === 2);
  api.resetDraft();
  ok("Start over clears the re-ask counters with the cached briefs",
     Object.keys(api.briefTries()).length === 0,
     JSON.stringify(api.briefTries()));
})();

/* ========================================================================
   rosterBlock — the payload stops saying things the roster contradicts

   The three lines this replaced printed "STARTERS FILLED: RB 5/2", which is
   not a fraction of anything, and carried a standing instruction to say that a
   player who cannot start is worth close to nothing — which attached "he
   CANNOT crack my starting lineup" to the receiver who would have filled an
   empty WR slot, two paragraphs under a line reading WR: EMPTY.
   ======================================================================== */
console.log("\n== rosterBlock (the roster the model is shown) ==");
(function () {
  // Deterministic: unknown picks for the room, named players credited to the
  // user at the user's own picks. No simulateToMyPick(), so no Math.random().
  function withRoster(upTo, mine) {
    var owned = {}, order = mine.slice();
    var picks = [];
    for (var n = 1; n < upTo; n++) {
      var isMine = EXPECTED_SCHEDULE.indexOf(n) >= 0 && n !== 59;
      if (isMine && order.length) {
        var name = order.shift();
        owned[name] = 1;
        picks.push({ pick: n, name: name, slot: 11, mine: true });
      } else {
        picks.push({ pick: n, name: null, slot: null, mine: false, unknown: true });
      }
    }
    return loadApp(kindaHighlandersLeague(), picks);
  }

  // One back, one receiver, one tight end by pick 86: WR2 and RB2 are open.
  var api = withRoster(86, ["James Cook III", "Nico Collins", "Brock Bowers"]);
  var A = api.getAnalysis();
  var text = api.claudeContext();

  ok("the fixture put three players on the user's roster", A.mine.length === 4,
     A.mine.map(function (p) { return p.name; }).join(", "));   // three plus the keeper

  // The falsehoods are gone.
  ok("the payload no longer prints a STARTERS FILLED fraction",
     text.indexOf("STARTERS FILLED") < 0);
  ok("and no longer carries the standing 'cannot start' instruction",
     !/cannot start for me is worth close to nothing/.test(text));

  // The slots are named individually, so an empty one cannot hide behind a count.
  ok("every starting slot is named", text.indexOf("MY ROSTER, SLOT BY SLOT") >= 0);
  ok("the filled receiver slot names the man in it",
     /WR1: Nico Collins/.test(text), text.match(/- WR1:[^\n]*/));
  ok("the empty receiver slot says EMPTY", /WR2: EMPTY/.test(text),
     text.match(/- WR2:[^\n]*/));
  ok("and says who the best man left for it is, in points",
     /WR2: EMPTY\. Best left is .+ \(WR\), \d+ pts/.test(text),
     text.match(/- WR2:[^\n]*/));

  // The floor is stated rather than left as an unexplained absence.
  ok("the kicker slot says why it cannot be filled yet",
     /K: EMPTY \(cannot be taken until round 14\)/.test(text),
     text.match(/- K:[^\n]*/));
  ok("and the still-empty line repeats the floor",
     /STARTING SLOTS STILL EMPTY:.*K \(round 14 at the earliest\)/.test(text),
     text.match(/STARTING SLOTS STILL EMPTY:[^\n]*/));
  ok("the still-empty line names the receiver slot",
     /STARTING SLOTS STILL EMPTY:.*WR2/.test(text));

  // A filled slot states what an upgrade there would actually be worth.
  ok("a filled slot prices the best man left against the man in it",
     /(pts better|pts worse)/.test(text),
     (text.match(/- RB1:[^\n]*/) || [""])[0]);

  // The empty flex must not go silent just because nobody's position is "FLEX".
  ok("an empty flex still names a best available body",
     text.indexOf("FLEX: EMPTY") < 0 ||
     /FLEX: EMPTY\. Best left is .+ \((RB|WR|TE)\)/.test(text),
     (text.match(/- FLEX:[^\n]*/) || [""])[0]);

  ok("the picks remaining are stated", /PICKS I HAVE LEFT: \d+/.test(text),
     (text.match(/PICKS I HAVE LEFT:[^\n]*/) || [""])[0]);

  // With every slot filled the block says so, rather than printing nothing and
  // leaving the reader to infer it.
  var full = withRoster(158, ["James Cook III", "Nico Collins", "Brock Bowers",
    "Derrick Henry", "Jaylen Waddle", "Saquon Barkley", "Houston Defense",
    "Brandon Aubrey", "Trey McBride", "Chase Brown"]);
  var ftext = full.claudeContext();
  ok("a full starting lineup is stated as full",
     /STARTING SLOTS STILL EMPTY: none/.test(ftext),
     (ftext.match(/STARTING SLOTS STILL EMPTY:[^\n]*/) || [""])[0]);
})();

/* ========================================================================
   "Still need", in words, on the strip the user is already reading
   ======================================================================== */
console.log("\n== stillNeedLine ==");
(function () {
  function withRoster(upTo, mine) {
    var order = mine.slice(), picks = [];
    for (var n = 1; n < upTo; n++) {
      if (EXPECTED_SCHEDULE.indexOf(n) >= 0 && n !== 59 && order.length) {
        picks.push({ pick: n, name: order.shift(), slot: 11, mine: true });
      } else {
        picks.push({ pick: n, name: null, slot: null, mine: false, unknown: true });
      }
    }
    return loadApp(kindaHighlandersLeague(), picks);
  }

  // Round 8, one back and one receiver owned: the screenshot's own answer.
  var api = withRoster(86, ["James Cook III", "Nico Collins", "Brock Bowers"]);
  var line = api.stillNeedLine();
  ok("it names the empty receiver slot", /WR2/.test(line), line);
  ok("it names the empty back slot", /RB2/.test(line), line);
  ok("it says how many picks are left to fill them", /\d+ picks left/.test(line), line);
  // The bar scrolls rather than wraps and the clock sits at the end of it, so a
  // long list is truncated to a count rather than allowed to push the clock off
  // a 744px screen.
  ok("a long list is capped, and says how many it did not name",
     !/\+\d+ more/.test(line) || line.split(",").length <= 3, line);
  ok("the line stays short enough for the bar", line.length <= 70, line.length + " chars");

  // The trap: need[pos].short is max(0, want-got) + flexOpen * FLEX_SPLIT[pos],
  // a fraction. "You still need WR 1.4" is not a sentence, and the temptation to
  // print it is the reason this is built off the slots instead.
  ok("no fractional count leaks into the line", !/\d+\.\d/.test(line), line);

  // A kicker slot is empty from pick 1 and cannot be filled until round 14.
  // Calling it a need in round 8 is noise; saying when it opens is not.
  ok("the kicker is not listed as something needed now",
     !/still need[^·]*\bK\b/.test(line), line);
  ok("but the round it opens is stated", /K from round 14/.test(line), line);

  // Round 15: everything is fillable, and the kicker is now a real need.
  var late = withRoster(158, ["James Cook III", "Nico Collins", "Brock Bowers",
    "Derrick Henry", "Jaylen Waddle", "Saquon Barkley", "Trey McBride"]);
  var lateLine = late.stillNeedLine();
  ok("late on, the kicker becomes a need rather than a promise",
     /still need[^·]*\bK\b/.test(lateLine) || !/K from round/.test(lateLine), lateLine);

  // A complete starting lineup says so rather than going blank, which reads as
  // a bug on a bar that is otherwise never empty.
  var full = withRoster(158, ["James Cook III", "Nico Collins", "Brock Bowers",
    "Derrick Henry", "Jaylen Waddle", "Saquon Barkley", "Houston Defense",
    "Brandon Aubrey", "Trey McBride", "Chase Brown"]);
  ok("a full starting lineup is stated, not left blank",
     /every starter filled/.test(full.stillNeedLine()), full.stillNeedLine());

  // It has to survive the render, in every branch that describes a live draft.
  [86, 85, 84].forEach(function (n) {
    var a = withRoster(n, ["James Cook III", "Nico Collins", "Brock Bowers"]);
    var html = a._sandbox.document.getElementById("statusBar").innerHTML || "";
    ok("the strip prints it at pick " + n + " (gap " +
       (a.getAnalysis().myNext - a.getAnalysis().cur) + ")",
       html.indexOf("sb-need") >= 0 && /WR2/.test(html),
       html.slice(0, 160));
  });
})();

/* ========================================================================
   A brief says which pick it was written for, and how old it is
   ======================================================================== */
console.log("\n== brief provenance ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), Array.from({ length: 83 },
    function (_, i) { return { pick: i + 1, name: null, slot: null, mine: false, unknown: true }; }));
  var A = api.getAnalysis();
  ok("waiting at 84 for pick 86", A.cur === 84 && A.myNext === 86,
     "cur " + A.cur + " myNext " + A.myNext);

  // Written for this pick, at this pick: no age to report.
  api.writeBriefAt(86, 84);
  ok("a brief written just now says nothing about its age",
     api.briefEyebrow() === "Claude · on deck for pick 86", api.briefEyebrow());

  // Two picks have gone since it was written. That is the state the header used
  // to render identically to the one above.
  api.writeBriefAt(86, 82);
  ok("a two-pick-old brief says so", /written 2 picks ago/.test(api.briefEyebrow()),
     api.briefEyebrow());
  ok("and still names the pick it was written for", /pick 86/.test(api.briefEyebrow()),
     api.briefEyebrow());

  api.writeBriefAt(86, 83);
  ok("one pick is singular", /written 1 pick ago/.test(api.briefEyebrow()),
     api.briefEyebrow());

  // A brief with no recorded write time must not invent an age.
  api.resetDraft();
  ok("Start over clears the write times with the briefs",
     Object.keys(api.briefWrittenAt()).length === 0);
  ok("and an unknown write time reports no age at all",
     !/written/.test(api.briefEyebrow()), api.briefEyebrow());
})();

/* ========================================================================
   supplyBlock - scarcity as counts, never as a second copy of the board
   ======================================================================== */
console.log("\n== supplyBlock ==");
(function () {
  var api = loadApp(kindaHighlandersLeague(), Array.from({ length: 85 },
    function (_, i) { return { pick: i + 1, name: null, slot: null, mine: false, unknown: true }; }));
  var A = api.getAnalysis();
  var text = api.supplyBlock();

  ["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
    ok("every position is accounted for: " + pos,
       new RegExp("- " + pos + ": ").test(text));
  });

  // The counts must be computed, not asserted against themselves: derive them
  // here from A.avail and the board's own replacement level.
  var wr = A.avail.filter(function (p) { return p.pos === "WR"; });
  var replPts = A.board.replacement.WR.points;
  var above = wr.filter(function (p) { return p.pts > replPts; }).length;
  var line = (text.match(/- WR: [^\n]*/) || [""])[0];
  ok("the WR count matches the pool", line.indexOf(wr.length + " left") >= 0, line);
  ok("the above-replacement count matches a direct computation",
     line.indexOf(above + " above replacement") >= 0, line);
  ok("and it names the replacement level in points",
     line.indexOf("(" + Math.round(replPts) + " pts)") >= 0, line);

  var best = wr.slice().sort(function (a, b) { return b.pts - a.pts; })[0];
  ok("it names the best man left, with his points",
     line.indexOf("Best is " + best.name + " at " + Math.round(best.pts)) >= 0, line);
  ok("it says how many of his tier are left", /tier \d+ with \d+ left in it/.test(line), line);
  ok("and how far the drop to the next tier is",
     /the next tier starts at \d+ \(\d+ pts down\)/.test(line), line);

  // It is a supply block, not a list: no position may enumerate its players.
  var names = wr.slice(1, 6).filter(function (p) { return text.indexOf(p.name) >= 0; });
  ok("it does not list the position out, only the best of it",
     names.length === 0, names.map(function (p) { return p.name; }).join(", "));

  // Six lines, one per position, however deep the draft is.
  ok("it is six lines and a heading",
     text.split("\n").length === 7, text.split("\n").length + " lines");
})();

/* ========================================================================
   styleBlock - on a style with no knobs, say nothing
   ======================================================================== */
console.log("\n== styleBlock ==");
(function () {
  function at(style) {
    var lg = kindaHighlandersLeague();
    if (style) lg.style = style;
    return loadApp(lg, Array.from({ length: 85 }, function (_, i) {
      return { pick: i + 1, name: null, slot: null, mine: false, unknown: true };
    }));
  }

  // Balanced is knobs: {} - literally no overrides - so no pick is ever on top
  // because of it, and a sentence saying one is cannot be checked from outside.
  var bal = at("balanced");
  ok("Balanced really does carry no knobs",
     Object.keys(STRATS.balanced.knobs || {}).length === 0);
  ok("so the style block says nothing at all", bal.styleBlock() === "",
     JSON.stringify(bal.styleBlock()));
  var text = bal.claudeContext();
  ok("and no style section reaches the payload", text.indexOf("MY DRAFT STYLE") < 0);
  ok("the invitation to explain a style effect is gone",
     !/only on top because of the style/.test(text));
  ok("as is the invitation to say the style is steering wrong",
     !/steering me wrong/.test(text));

  // A style with real knobs is named, with the knobs, as numbers.
  var hero = at("hero_rb");
  var hb = hero.styleBlock();
  ok("a style with knobs is still declared", hb.indexOf("MY DRAFT STYLE") === 0, hb.slice(0, 60));
  ok("and it names what the knobs actually are", /It changes the board by:/.test(hb), hb);
  Object.keys(STRATS.hero_rb.knobs || {}).forEach(function (k) {
    ok("knob " + k + " is stated rather than described", hb.indexOf(k) >= 0);
  });
  ok("the payload carries it", hero.claudeContext().indexOf("MY DRAFT STYLE") >= 0);

  // The user's own notes are their words and survive a neutral preset.
  var lg = kindaHighlandersLeague();
  lg.styleCustom = "I want a second tight end late.";
  var noted = loadApp(lg, []);
  ok("custom notes are passed on even under Balanced",
     noted.styleBlock().indexOf("I want a second tight end late.") >= 0,
     noted.styleBlock());
})();

/* ========================================================================
   teamsAheadBlock and runLine - one line per team, and the log as six numbers
   ======================================================================== */
console.log("\n== teamsAheadBlock / runLine ==");
(function () {
  // Slot 11 in a 12-team snake: after pick 14 the next own pick is 35, so the
  // teams in between include one holding two picks across the turn.
  function at(n) {
    return loadApp(kindaHighlandersLeague(), Array.from({ length: n }, function (_, i) {
      return { pick: i + 1, name: null, slot: null, mine: false, unknown: true };
    }));
  }
  var api = at(14);              // cur 15, waiting for 35
  var A = api.getAnalysis();
  ok("waiting across the turn", A.myNext === 35 && A.cur === 15,
     "cur " + A.cur + " myNext " + A.myNext);

  var block = api.teamsAheadBlock();
  var lines = block.split("\n").filter(function (l) { return l.indexOf("- team") === 0; });
  var slots = lines.map(function (l) { return (l.match(/- team (\d+)/) || [])[1]; });
  ok("no team is listed twice", slots.length === new Set(slots).size, slots.join(","));
  ok("there are fewer lines than picks", lines.length < 35 - 15, lines.length + " lines");
  ok("a team holding two picks says so on one line",
     lines.some(function (l) { return /picks \d+ and \d+/.test(l); }),
     lines.filter(function (l) { return /picks/.test(l); })[0] || "(none)");
  ok("the header states both counts", /\d+ picks across \d+ teams/.test(block),
     block.split("\n")[0]);

  // Nobody drafts a kicker in round 2. Listing every team as short at K on
  // every call is noise that crowds out the positions actually in contention.
  ok("no team is reported short at K this early", block.indexOf("K") < 0 ||
     !/still needs[^\n]*\bK\b/.test(block), block.slice(0, 300));

  // Late on, the floor has lifted and K is a real need again.
  var late = at(160);
  var lateBlock = late.teamsAheadBlock();
  ok("late on, K can be reported as a need",
     late.getAnalysis().myNext === null || /\bK\b/.test(lateBlock) || lateBlock.indexOf("none") >= 0,
     lateBlock.slice(0, 200));

  // On the clock there is nobody in between, and it says so rather than
  // printing an empty heading.
  var onClock = at(85);
  ok("on the clock it says there is nobody in between",
     /none, I am on the clock now/.test(onClock.teamsAheadBlock()),
     onClock.teamsAheadBlock());

  // runLine: the whole draft log as six integers plus a verdict.
  var rl = api.runLine();
  ok("the run line reports all six positions",
     ["QB", "RB", "WR", "TE", "K", "DEF"].every(function (p) { return rl.indexOf(p + " ") >= 0; }), rl);
  ok("and states whether it is a run", /No run.|calls that a run at/.test(rl), rl);
  ok("it is one line", rl.indexOf("\n") < 0, rl);
  ok("the payload carries it", api.claudeContext().indexOf("THE LAST") >= 0);
  ok("and no longer carries the old RUN IN PROGRESS heading",
     api.claudeContext().indexOf("RUN IN PROGRESS") < 0);

  // The question still reaches the model with the block in it.
  ok("briefQuestion embeds the teams block",
     api.briefQuestion().indexOf("TEAMS PICKING BEFORE ME") >= 0);
  ok("and the old per-pick heading is gone",
     api.briefQuestion().indexOf("TEAMS PICKING BEFORE YOU") < 0);
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail > 0 ? 1 : 0);
