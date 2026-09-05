/* node ff/tools/measure-bench.js [--drafts 40] [--seed0 1]

   What the board recommends once the starting lineup is full.

   The reported failure: round 9, every starter filled, Drake Maye kept at
   quarterback, and the top three cards were all quarterbacks — each one labeled
   "can't crack your starting lineup, depth only". That is not a bad grade on
   one player. It is what the composite does at every pick where nothing left
   can improve the lineup, which on a normal roster is most of rounds 7 to 13.

   Four numbers, measured over seeded drafts from the user's own seat, with the
   modeled room drafting the other eleven teams and the user always taking the
   board's own #1 — so what is measured is the board's advice, followed:

     dead-position #1    the board's top player plays a position where the user
                         already holds every body he could start and a backup has
                         no door into the lineup. The second quarterback in a
                         one-QB league is the case that started this.

     grades outrank      picks where |ceiling - risk| on the board's #1 is larger
     value               than its value term. When this is high the board is not
                         ranking on value at all — it is ranking on two
                         hand-weighted grades and using value as the tiebreaker.

     whole board < -60   picks where the empty-slot guard fired on every player
                         at once, so every score on screen reads as catastrophic
                         and a real problem cannot be told from a normal round.

     lineup points       what the followed advice actually built, as a sanity
                         check that none of the above was bought by making the
                         team worse.

   Run it against a stashed copy of engine.js to get a before, by pointing
   assets/engine.js at the old file — this script deliberately drives the real
   app through test-app.js's sandbox rather than reimplementing the context the
   composite needs, so it measures what ships and not a paraphrase of it.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var Module = require("module");

var args = process.argv.slice(2);
function arg(name, dflt) {
  var i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] != null ? args[i + 1] : dflt;
}
var DRAFTS = parseInt(arg("drafts", "40"), 10);
var SEED0 = parseInt(arg("seed0", "1"), 10);

// ---- borrow loadApp() from test-app.js without running its suites ----------
var harnessPath = path.join(__dirname, "test-app.js");
var harnessSrc = fs.readFileSync(harnessPath, "utf8");
var cut = harnessSrc.indexOf("/* ------------------------------------------------------------- fixtures ---");
if (cut < 0) throw new Error("test-app.js has lost its fixtures marker; re-check before trusting this run");
var m = new Module(harnessPath, module);
m.filename = harnessPath;
m.paths = Module._nodeModulePaths(path.dirname(harnessPath));
m._compile(harnessSrc.slice(0, cut) + "\nmodule.exports = { loadApp: loadApp };\n", harnessPath);
var loadApp = m.exports.loadApp;

var PRESETS = globalThis.DRAFTLINE_PRESETS;
var E = globalThis.DRAFTLINE_ENGINE;

function league() {
  return {
    preset: "kinda_highlanders",
    rules: JSON.parse(JSON.stringify(PRESETS.kinda_highlanders)),
    mode: "live", teams: 12, slot: 11, rounds: 15,
    keepers: [{ name: "Drake Maye", round: 5 }],
    byeTolerance: 3, defFloorRound: 7, style: "balanced", styleCustom: null
  };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seedSandbox(api, seed) {
  var vm = require("vm");
  vm.runInContext("Math", api._sandbox).random = mulberry32(seed);
}

/* Doors into the lineup for another body at this position: the starting slots
   for it, plus the flex if he is eligible and it is not already occupied. At or
   below zero, a pick there cannot reach the field except through an injury. */
function doorsOpen(pos, mine, rules, api) {
  var flexEl = rules.roster.flexEligible || ["RB", "WR", "TE"];
  var have = mine.filter(function (p) { return p.pos === pos; }).length;
  var spots = rules.roster[pos] || 0;
  if (flexEl.indexOf(pos) >= 0) {
    var used = E.assignRoster(mine, rules).slots
      .filter(function (s) { return s.pos === "FLEX" && s.player; }).length;
    spots += Math.max(0, (rules.roster.FLEX || 0) - used);
  }
  return spots - have;
}

var stat = { picks: 0, full: 0, dead: 0, deadFull: 0, grade: 0, gradeFull: 0,
             board60: 0, byPos: {}, lineup: [],
             stack3: 0, stack3Pos: {}, spareQb: 0 };

for (var d = 0; d < DRAFTS; d++) {
  var api = loadApp(league(), []);
  seedSandbox(api, SEED0 + d * 7919);
  var rules = api.getState().league.rules;

  for (var guard = 0; guard < 400; guard++) {
    var A = api.getAnalysis();
    if (!A.myNext) break;
    if (A.cur < A.myNext) { api.simulateToMyPick(); continue; }

    var avail = A.avail.slice().sort(function (a, b) { return b.comp - a.comp; });
    if (!avail.length) break;
    var top = avail[0];
    var mine = A.mine || [];
    var det = top.compDetail || {};

    var openNow = api.openStartingSlots().length;   // floor-blocked slots excluded
    stat.picks++;
    if (openNow === 0) stat.full++;

    if (doorsOpen(top.pos, mine, rules, api) <= 0) {
      stat.dead++;
      if (openNow === 0) stat.deadFull++;
      stat.byPos[top.pos] = (stat.byPos[top.pos] || 0) + 1;
    }

    /* The screenshot, exactly: all three cards the same position, none of them
       improving the lineup by a point. That is the board telling you to spend a
       round-9 pick on a third body at a position you cannot start one more of. */
    var three = api.recCards(avail.filter(function (p) { return !p.compDetail.blocked; }));
    var addsNothing = function (p) { return Math.abs((p.compDetail || {}).marginal || 0) < 0.5; };
    if (three.length === 3 && three.every(function (p) { return p.pos === three[0].pos; }) &&
        three.every(addsNothing)) {
      stat.stack3++;
      stat.stack3Pos[three[0].pos] = (stat.stack3Pos[three[0].pos] || 0) + 1;
    }
    /* And the narrower case that started it: a spare quarterback on top in a
       one-QB league, adding nothing, when one is already rostered. */
    if (top.pos === "QB" && addsNothing(top) &&
        mine.filter(function (p) { return p.pos === "QB"; }).length >= (rules.roster.QB || 1)) {
      stat.spareQb++;
    }
    var grades = Math.abs((det.ceilingAdj || 0) - (det.riskAdj || 0));
    if (grades > Math.abs(det.value || 0)) {
      stat.grade++;
      if (openNow === 0) stat.gradeFull++;
    }
    if (avail.length > 3 && avail.slice(0, 4).every(function (p) { return p.comp < -60; })) {
      stat.board60++;
    }
    api.record(top.name, true);
  }
  stat.lineup.push(E.lineupPoints(api.getAnalysis().mine || [], rules));
}

function pc(n, of) { return of ? (n / of * 100).toFixed(1) + "%" : "—"; }
function median(a) {
  var s = a.slice().sort(function (x, y) { return x - y; });
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

console.log("\n" + DRAFTS + " seeded drafts · " + stat.picks + " of the user's own picks · " +
            stat.full + " with every fillable starting slot already full\n");
console.log("  board's #1 at a dead position   " + String(stat.dead).padStart(4) + "   " +
            pc(stat.dead, stat.picks).padStart(6) + " of picks    " +
            pc(stat.deadFull, stat.full).padStart(6) + " of full-lineup picks");
console.log("  grades outrank the value term   " + String(stat.grade).padStart(4) + "   " +
            pc(stat.grade, stat.picks).padStart(6) + " of picks    " +
            pc(stat.gradeFull, stat.full).padStart(6) + " of full-lineup picks");
console.log("  whole board under -60           " + String(stat.board60).padStart(4) + "   " +
            pc(stat.board60, stat.picks).padStart(6) + " of picks");
console.log("  three cards, one dead position  " + String(stat.stack3).padStart(4) + "   " +
            pc(stat.stack3, stat.picks).padStart(6) + " of picks    " +
            pc(stat.stack3, stat.full).padStart(6) + " of full-lineup picks");
console.log("  spare quarterback on top        " + String(stat.spareQb).padStart(4) + "   " +
            pc(stat.spareQb, stat.picks).padStart(6) + " of picks    " +
            pc(stat.spareQb, stat.full).padStart(6) + " of full-lineup picks");
console.log("  median lineup points built      " + median(stat.lineup).toFixed(0));
var s3 = Object.keys(stat.stack3Pos).sort(function (a, b) { return stat.stack3Pos[b] - stat.stack3Pos[a]; });
if (s3.length) console.log("\n  three-card stacks by position: " +
    s3.map(function (k) { return k + " " + stat.stack3Pos[k]; }).join(", "));
var poss = Object.keys(stat.byPos).sort(function (a, b) { return stat.byPos[b] - stat.byPos[a]; });
if (poss.length) {
  console.log("\n  dead-position #1 by position: " +
    poss.map(function (k) { return k + " " + stat.byPos[k]; }).join(", "));
}
console.log("");
