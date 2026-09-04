/* node ff/tools/test-engine.js — checks the engine against numbers derived
   independently in the research digest, and against Sleeper's own PPR totals. */
require("../data/players.js");
require("../assets/presets.js");
var E = require("../assets/engine.js");

var DATA = globalThis.DRAFTLINE_DATA, P = globalThis.DRAFTLINE_PRESETS;
var ken = P.kinda_highlanders, yahoo = P.yahoo_default;
// Sleeper computes its own pts_ppr with a -1 interception; clone the preset so
// the comparison tests the engine, not a rules mismatch.
var ppr = JSON.parse(JSON.stringify(P.ppr_standard)); ppr.passing.int = -1;
var pass = 0, fail = 0;

function ok(label, cond, detail) {
  (cond ? pass++ : fail++);
  console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  — " + detail : ""));
}
function near(label, actual, expected, tol) {
  ok(label, Math.abs(actual - expected) <= tol,
     "got " + (Math.round(actual * 10) / 10) + ", expected ~" + expected);
}

var find = function (n) { return DATA.players.find(function (p) { return p.name === n; }); };

console.log("\n== D/ST: the whole thesis ==");
var sea = find("Seattle Defense");
var kenSea = E.customPoints(sea, ken), yahSea = E.customPoints(sea, yahoo);
near("Seattle PA component in Ken's scoring ≈176", kenSea.byCategory["Points allowed"], 176, 6);
near("Seattle total in Ken's scoring ≈340", kenSea.total, 342, 20);
console.log("       Seattle: Ken " + kenSea.total.toFixed(1) + " vs Yahoo default " + yahSea.total.toFixed(1));
var avgDef = DATA.players.filter(function (p) { return p.pos === "DEF" && p.dst_tier === 3; })[0];
near("Average (tier 3) defense PA ≈123", E.customPoints(avgDef, ken).byCategory["Points allowed"], 123, 8);
var worst = DATA.players.filter(function (p) { return p.pos === "DEF" && p.dst_tier === 5; })[0];
var spread = E.customPoints(sea, ken).byCategory["Points allowed"] -
             E.customPoints(worst, ken).byCategory["Points allowed"];
near("Good-vs-bad PA spread ≈93-100", spread, 96, 12);
var ySpread = E.customPoints(sea, yahoo).byCategory["Points allowed"] -
              E.customPoints(worst, yahoo).byCategory["Points allowed"];
console.log("       Same spread under Yahoo default: " + ySpread.toFixed(1));

console.log("\n== Replacement levels derive from roster, never hardcoded ==");
var ranks = E.replacementRanks(ken);
ok("QB12", ranks.QB === 12, JSON.stringify(ranks));
ok("TE13", ranks.TE === 13);
ok("RB~31", Math.abs(ranks.RB - 31) <= 1);
ok("WR~29", Math.abs(ranks.WR - 29) <= 1);
ok("K12 / DEF12", ranks.K === 12 && ranks.DEF === 12);

console.log("\n== Scoring engine vs Sleeper's own PPR totals (full-PPR preset) ==");
["Ja'Marr Chase", "Bijan Robinson", "Drake Maye", "Kenneth Walker", "Tucker Kraft"].forEach(function (n) {
  var pl = find(n), mine = E.customPoints(pl, ppr).total;
  var delta = pl.sleeperPPR ? (mine - pl.sleeperPPR) / pl.sleeperPPR * 100 : 0;
  ok(n + " within 2% of Sleeper PPR", Math.abs(delta) <= 2.0,
     mine.toFixed(1) + " vs " + pl.sleeperPPR + " (" + delta.toFixed(1) + "%)");
});

console.log("\n== Survival probabilities vs the digest ==");
[["Drake London", 11, 0.90], ["Chase Brown", 11, 0.80], ["Justin Jefferson", 11, 0.61],
 ["James Cook III", 11, 0.56], ["CeeDee Lamb", 11, 0.34],
 ["Kenneth Walker", 14, 0.97], ["Ashton Jeanty", 14, 0.96], ["Rashee Rice", 14, 0.90],
 ["Saquon Barkley", 14, 0.90], ["A.J. Brown", 14, 0.85], ["Derrick Henry", 14, 0.79],
 ["Seattle Defense", 83, 0.43], ["Seattle Defense", 86, 0.29],
 ["Denver Defense", 83, 0.70], ["Denver Defense", 86, 0.55]
].forEach(function (t) {
  var s = E.survival(find(t[0]), t[1]);
  near(t[0] + " @ " + t[1], s * 100, t[2] * 100, 4);
});

console.log("\n== Pick schedule, slot 11 of 12, Maye kept in round 5 ==");
var sched = E.scheduleWithKeepers(12, 11, 15, [{ name: "Drake Maye", round: 5 }]);
var open = sched.filter(function (s) { return !s.keeper; }).map(function (s) { return s.pick; });
var expected = [11, 14, 35, 38, 62, 83, 86, 107, 110, 131, 134, 155, 158, 179];
ok("14 open picks match the digest", JSON.stringify(open) === JSON.stringify(expected),
   open.join(","));

console.log("\n== VONA: 3-pick gap vs 21-pick gap ==");
var board = E.buildBoard(DATA.players, ken);
var avail = board.players;
var near14 = E.expectedBestAvailable(avail, 14, ["RB", "WR"]);
var far35 = E.expectedBestAvailable(avail.filter(function (p) { return p.adp > 14; }), 35, ["RB", "WR"]);
var wr = avail.filter(function (p) { return p.pos === "WR"; })[0];
ok("VONA at a 3-pick gap is small",
   wr.pts - near14.WR.expected < wr.pts - far35.WR.expected,
   "gap3=" + (wr.pts - near14.WR.expected).toFixed(1) +
   " gap21=" + (wr.pts - far35.WR.expected).toFixed(1));

console.log("\n== Top of the board in Ken's scoring ==");
board.players.slice(0, 12).forEach(function (p, i) {
  console.log("   " + String(i + 1).padStart(2) + ". " + p.name.padEnd(24) +
    p.pos.padEnd(4) + "pts " + p.pts.toFixed(0).padStart(4) +
    "  VOR " + p.vor.toFixed(0).padStart(4) + "   ADP " + p.adp);
});
console.log("   D/ST at the top of its own position:");
board.byPos.DEF.slice(0, 3).forEach(function (p) {
  console.log("      " + p.name.padEnd(22) + "pts " + p.pts.toFixed(0) +
    "  VOR " + p.vor.toFixed(0) + "  ADP " + p.adp);
});

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
