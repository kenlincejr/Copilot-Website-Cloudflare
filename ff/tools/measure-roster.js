/* node ff/tools/measure-roster.js [--drafts 25] [--seed0 1] [--style balanced]

   Does the roster this board builds actually score points?

   Lineup points on their own cannot answer that. They field the best eleven you
   own and never ask whether you could field them in week 6, so a roster with
   six running backs and three receivers measures identically to a balanced one
   right up until two of your receivers share a bye and you start nobody. That
   is exactly the failure being investigated — the board builds 6 RB / 3 WR in a
   league that starts two receivers and a flex — so the measure has to be one
   that can see it.

   BYE-ADJUSTED SEASON POINTS is that measure. For each of the 17 weeks, remove
   everybody on their bye, field the best legal lineup from who is left, and
   take a seventeenth of its season total. Sum the weeks. A roster deep where it
   needs to be scores what its starters are worth; one that is thin in the wrong
   place gives back the difference between a starter and whatever it can field
   instead, on the weeks it cannot cover. Nothing here is estimated: byes are in
   the data and the lineup rules are the league's own.

   It does not model injuries. That needs games-missed history this board does
   not bake, and every gap it would open runs the same direction as a bye — so
   this is a floor on the cost of being thin, not the whole of it.

   Reported against the plain lineup number so the two can be read together: if
   a change lifts lineup points and drops the bye-adjusted figure, it has bought
   a better starting eleven with a worse team.
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
var DRAFTS = parseInt(arg("drafts", "25"), 10);
var SEED0 = parseInt(arg("seed0", "1"), 10);
var STYLE = arg("style", "balanced");

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
var SEASON_WEEKS = 17;

function league() {
  return {
    preset: "kinda_highlanders",
    rules: JSON.parse(JSON.stringify(PRESETS.kinda_highlanders)),
    mode: "live", teams: 12, slot: 11, rounds: 15,
    keepers: [{ name: "Drake Maye", round: 5 }],
    byeTolerance: 3, defFloorRound: 7, style: STYLE, styleCustom: null
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

/** What the roster actually scores once byes are taken into account. */
function byeAdjusted(mine, rules) {
  var total = 0, blank = 0, byPos = {}, lost = 0;
  var full = E.lineupPoints(mine, rules);
  for (var w = 1; w <= SEASON_WEEKS; w++) {
    var fit = mine.filter(function (p) { return p.bye !== w; });
    var asg = E.assignRoster(fit, rules);
    asg.slots.forEach(function (s) {
      if (!s.player) { blank++; byPos[s.pos] = (byPos[s.pos] || 0) + 1; }
    });
    var wk = E.lineupPoints(fit, rules);
    total += wk / SEASON_WEEKS;
    // What the bye actually costs, week by week, against a full-strength week.
    lost += (full - wk) / SEASON_WEEKS;
  }
  return { points: total, blankSlots: blank, blankByPos: byPos, lost: lost };
}

var rows = [];
for (var d = 0; d < DRAFTS; d++) {
  var api = loadApp(league(), []);
  require("vm").runInContext("Math", api._sandbox).random = mulberry32(SEED0 + d * 7919);
  var rules = api.getState().league.rules;

  for (var g = 0; g < 400; g++) {
    var A = api.getAnalysis();
    if (!A.myNext) break;
    if (A.cur < A.myNext) { api.simulateToMyPick(); continue; }
    var pool = A.avail.filter(function (p) { return !p.compDetail.blocked; })
      .sort(function (a, b) { return b.comp - a.comp; });
    if (!pool.length) break;
    api.record(pool[0].name, true);
  }
  var mine = api.getAnalysis().mine || [];
  var counts = {};
  mine.forEach(function (p) { counts[p.pos] = (counts[p.pos] || 0) + 1; });
  var adj = byeAdjusted(mine, rules);
  rows.push({ counts: counts, lineup: E.lineupPoints(mine, rules),
              adj: adj.points, blank: adj.blankSlots,
              blankByPos: adj.blankByPos, lost: adj.lost });
}

function median(a) {
  var s = a.slice().sort(function (x, y) { return x - y; });
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}
function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

var shape = {};
rows.forEach(function (r) {
  Object.keys(r.counts).forEach(function (k) {
    (shape[k] = shape[k] || []).push(r.counts[k]);
  });
});

console.log("\n" + DRAFTS + " seeded drafts · style " + STYLE +
            " · taking the board's #1 at every pick\n");
console.log("  median lineup points (byes ignored)   " +
            median(rows.map(function (r) { return r.lineup; })).toFixed(0));
console.log("  median BYE-ADJUSTED season points     " +
            median(rows.map(function (r) { return r.adj; })).toFixed(0) +
            "   <- the number that matters");
console.log("  mean starting slots left empty        " +
            mean(rows.map(function (r) { return r.blank; })).toFixed(1) +
            "   (across all 17 weeks)");
console.log("  mean points given up to byes          " +
            mean(rows.map(function (r) { return r.lost; })).toFixed(0));
var bp = {};
rows.forEach(function (r) {
  Object.keys(r.blankByPos || {}).forEach(function (k) {
    bp[k] = (bp[k] || 0) + r.blankByPos[k];
  });
});
console.log("\n  empty starting slots, by slot (mean per draft, across 17 weeks):");
Object.keys(bp).sort(function (a, b) { return bp[b] - bp[a]; }).forEach(function (k) {
  console.log("    " + k.padEnd(9) + (bp[k] / DRAFTS).toFixed(2));
});
console.log("\n  roster shape, mean per draft:");
["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
  if (!shape[pos]) return;
  console.log("    " + pos.padEnd(4) + mean(shape[pos]).toFixed(1));
});
console.log("");
