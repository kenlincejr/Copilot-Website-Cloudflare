/* node ff/tools/test-engine.js — checks the engine against numbers derived
   independently in the research digest, and against Sleeper's own PPR totals. */
require("../data/players.js");
require("../assets/presets.js");
var E = require("../assets/engine.js");

require("../assets/strategies.js");
var DATA = globalThis.DRAFTLINE_DATA, P = globalThis.DRAFTLINE_PRESETS;
var STRATS = globalThis.DRAFTLINE_STRATEGIES;
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

// A keeper does not just remove a player, it removes a pick slot. Counting the
// round-5 slot as still available would tell the engine it waits 21 picks after
// 38 when it actually waits 24, which understates VONA exactly where the draft
// is hardest.
var gaps = open.slice(1).map(function (p, i) { return p - open[i]; });
ok("gap after pick 38 is 24, not 21", gaps[3] === 24, "gaps: " + gaps.join(","));
ok("no keeper-consumed slot survives in the schedule", open.indexOf(59) === -1);

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

console.log("\n== Tiers group interchangeable players, not runs of singletons ==");
// The first attempt broke a tier on any gap beating a multiple of the MEDIAN gap.
// The median is dragged down by the compressed tail, so the threshold came out at
// about six points — noise across a season — and the top three backs landed in
// three separate tiers. Anyone seeing that would rightly distrust the board.
var rb = board.byPos.RB, wr = board.byPos.WR, te = board.byPos.TE, qb = board.byPos.QB;
ok("the two best RBs share a tier (6 pts apart)", rb[0].tier === rb[1].tier,
   rb[0].name + " T" + rb[0].tier + " / " + rb[1].name + " T" + rb[1].tier);
ok("the two best WRs share a tier", wr[0].tier === wr[1].tier,
   wr[0].name + " / " + wr[1].name);
ok("the two elite TEs share a tier", te[0].tier === te[1].tier,
   te[0].name + " / " + te[1].name);
ok("RB3 has dropped a tier from RB1", rb[2].tier > rb[0].tier);
// A singleton is correct where the gap is real: Allen is ~34 points clear.
ok("the runaway QB stands alone", qb[0].tier === 1 && qb[1].tier === 2,
   qb[0].name + " " + Math.round(qb[0].pts) + " vs " + Math.round(qb[1].pts));
["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
  var l = board.byPos[pos];
  var monotonic = l.every(function (p, i) { return i === 0 || p.tier >= l[i - 1].tier; });
  ok(pos + " tiers never go backwards down the board", monotonic);
});

console.log("\n== Roster-aware value: what he adds to YOUR lineup ==");
/* The bug these cover: the board recommended three tight ends in a row to a
   manager who already had two, because value over replacement compares a
   player to a stranger at his position rather than to the player sitting in
   your slot, and the old need multiplier had a dead zone that let two surplus
   bodies through at full weight. */
var kenBoard = E.buildBoard(DATA.players, ken);
var pick = function (n) { return kenBoard.players.find(function (p) { return p.name === n; }); };
var CORE = ["Drake Maye", "James Cook III", "Chase Brown", "Parker Washington",
            "Jayden Reed", "Javonte Williams", "Houston Defense"].map(pick);
var TE1 = pick("Colston Loveland"), TE2 = pick("Sam LaPorta"), TE3 = pick("Tucker Kraft");

function ctxFor(mine, opts) {
  opts = opts || {};
  var taken = {}; mine.forEach(function (p) { taken[p.name] = 1; });
  var avail = kenBoard.players.filter(function (p) { return !taken[p.name]; });
  return {
    rules: ken, round: opts.round || 10, rounds: 15,
    need: E.positionalNeed(mine, ken), byeCounts: {}, byeTolerance: 3,
    defFloorRound: 7, kFloorRound: 14,
    vona: E.expectedBestAvailable(avail, opts.nextPick || 131),
    runs: {}, replacement: kenBoard.replacement,
    currentPick: opts.pick || 110, nextPick: opts.nextPick || 131,
    myPlayers: mine, strategy: opts.strategy || {}, stackTeams: {}, handcuffTeams: {}
  };
}

var noTe = CORE, oneTe = CORE.concat([TE1]), twoTe = CORE.concat([TE1, TE2]);
var replTE = kenBoard.replacement.TE.points;
near("an empty TE slot: marginal value tracks classic VOR",
     E.marginalVor(TE1, noTe, ken, replTE), TE1.vor, 1);
ok("a second TE adds nothing to the starting lineup",
   Math.abs(E.marginalVor(TE2, oneTe, ken, replTE)) < 0.001,
   "marginal " + E.marginalVor(TE2, oneTe, ken, replTE).toFixed(1));
ok("a third TE adds nothing either",
   Math.abs(E.marginalVor(TE3, twoTe, ken, replTE)) < 0.001);

var s0 = E.composite(TE1, ctxFor(noTe)), s1 = E.composite(TE2, ctxFor(oneTe)),
    s2 = E.composite(TE3, ctxFor(twoTe));
ok("filling the TE slot scores far above backing it up",
   s0.score > s1.score * 3, Math.round(s0.score) + " vs " + Math.round(s1.score));
ok("taking a second TE lowers what the third is worth",
   s2.score < s1.score, Math.round(s1.score) + " -> " + Math.round(s2.score));
ok("the third TE is blocked outright", !!s2.blocked, s2.blocked || "not blocked");
ok("and the board says why in words",
   s1.reasons.some(function (r) { return /crack your starting lineup/.test(r); }),
   s1.reasons.join(" | "));
ok("scarcity at a filled position is worth nothing",
   s2.vona < s0.vona / 5, "TE3 vona " + s2.vona.toFixed(1) + " vs TE1 " + s0.vona.toFixed(1));

var bpa = E.composite(TE3, ctxFor(twoTe, { strategy: { needWeight: 0 } }));
near("needWeight 0 falls back to classic value over replacement", bpa.value, TE3.vor, 0.5);

var flat = ["QB", "RB", "WR"].map(function (pos) {
  var p = kenBoard.byPos[pos].find(function (q) { return twoTe.indexOf(q) < 0; });
  return E.composite(p, ctxFor(twoTe)).mult;
});
ok("the multiplier no longer carries need at all", flat.every(function (m) { return m === 1; }),
   flat.map(function (m) { return m.toFixed(2); }).join(", "));

ok("a filled flex is reported as filled", E.openFlexSlots(twoTe, ken) === 0,
   "open flex " + E.openFlexSlots(twoTe, ken));
ok("an empty flex is reported as open", E.openFlexSlots(CORE.slice(0, 3), ken) === 1);

console.log("\n== Draft styles point the way they say they do ==");
/* The bug these cover: bias was applied by multiplying the score, which works
   only while the score is positive. In the back half of a draft everyone left
   is below replacement, so multiplying inverted every style — RB-heavy pushed
   late running backs down and Zero RB pulled them up. */
var lateRB = kenBoard.byPos.RB.find(function (p) {
  return p.vor < -10 && twoTe.indexOf(p) < 0;
});
var earlyRB = kenBoard.byPos.RB[0];
function scoreUnder(player, mine, knobs, round) {
  return E.composite(player, ctxFor(mine, { strategy: knobs, round: round || 10 })).score;
}
var neutralEarly = scoreUnder(earlyRB, [], {}, 1);
ok("emphasising a position still lifts an above-replacement player",
   scoreUnder(earlyRB, [], { earlyPosBias: { RB: 1.35 } }, 1) > neutralEarly);
ok("de-emphasising still drops him",
   scoreUnder(earlyRB, [], { earlyPosBias: { RB: 0.45 } }, 1) < neutralEarly);
// Where the old multiply was correct, the new signed shift must be identical.
near("and the arithmetic is unchanged where the old form was already right",
     scoreUnder(earlyRB, [], { earlyPosBias: { RB: 1.35 } }, 1),
     neutralEarly * 1.35, 0.01);

var neutralLate = scoreUnder(lateRB, twoTe, {});
ok("emphasising a position lifts a BELOW-replacement player too",
   scoreUnder(lateRB, twoTe, { posBias: { RB: 1.35 } }) > neutralLate,
   lateRB.name + " VOR " + Math.round(lateRB.vor) + ": " + Math.round(neutralLate) +
     " -> " + Math.round(scoreUnder(lateRB, twoTe, { posBias: { RB: 1.35 } })));
ok("de-emphasising drops him rather than lifting him",
   scoreUnder(lateRB, twoTe, { posBias: { RB: 0.45 } }) < neutralLate,
   Math.round(neutralLate) + " -> " +
     Math.round(scoreUnder(lateRB, twoTe, { posBias: { RB: 0.45 } })));
ok("a position floor still blocks outright",
   !!E.composite(earlyRB, ctxFor([], { round: 2, strategy: { posFloorRound: { RB: 6 } } })).blocked);

console.log("\n== The modelled room ==");
/* Opponents used to take at random from the top three by ADP: no variance that
   belonged to the player, no rosters, no runs. */
function seeded(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var draws = [], g = seeded(99);
for (var i = 0; i < 4000; i++) draws.push(E.gauss(g));
var mean = draws.reduce(function (a, b) { return a + b; }, 0) / draws.length;
var sd = Math.sqrt(draws.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / draws.length);
near("the ADP draw is a standard normal (mean)", mean, 0, 0.06);
near("the ADP draw is a standard normal (sd)", sd, 1, 0.05);

var poolTop = kenBoard.players.slice(0, 40).map(function (p) {
  return { player: p, adp: p.adp, sd: p.adp_sd, pct: null };
});
var counts9 = {}, r9 = seeded(7), picks9 = {};
for (var n = 0; n < 400; n++) picks9[E.roomPick(poolTop, r9, { roster: ken.roster }).name] = 1;
ok("the room does not take the same player every time",
   Object.keys(picks9).length > 3, Object.keys(picks9).length + " distinct winners in 400 draws");
var r10 = seeded(11), first = kenBoard.players[0], firstWins = 0;
for (var n2 = 0; n2 < 400; n2++) if (E.roomPick(poolTop, r10, { roster: ken.roster }) === first) firstWins++;
ok("but it still usually takes near the top of the board", firstWins > 120,
   first.name + " won " + firstWins + "/400");

// Rosters: a team that is full at a position stops taking it.
var kOnly = kenBoard.byPos.K.slice(0, 6).map(function (p) {
  return { player: p, adp: 1, sd: 1.5, pct: null };
});
// When every candidate is capped the room must still pick somebody, or the
// simulation stalls at the pick rather than the draft.
ok("a pick is always returned even when every candidate is capped",
   !!E.roomPick(kOnly, seeded(3), { roster: ken.roster, counts: { K: 1 } }));
var mixed = kOnly.concat(kenBoard.byPos.RB.slice(0, 4).map(function (p) {
  return { player: p, adp: 40, sd: 4, pct: null };
}));
ok("with a capped position and an open one, it takes the open one",
   E.roomPick(mixed, seeded(3), { roster: ken.roster, counts: { K: 1 } }).pos === "RB");

// A run pulls the room toward the position it is already taking.
var rbs = kenBoard.byPos.RB.slice(0, 8).map(function (p) { return { player: p, adp: 50, sd: 6, pct: null }; });
var wrs = kenBoard.byPos.WR.slice(0, 8).map(function (p) { return { player: p, adp: 50, sd: 6, pct: null }; });
var both = rbs.concat(wrs);
function rbShare(runs, seed) {
  var rr = seeded(seed), hits = 0;
  for (var j = 0; j < 600; j++)
    if (E.roomPick(both, rr, { roster: ken.roster, runs: runs }).pos === "RB") hits++;
  return hits / 600;
}
var flatShare = rbShare({}, 21), runShare = rbShare({ RB: 4 }, 21);
ok("a run pulls the room toward that position", runShare > flatShare + 0.1,
   "RB share " + flatShare.toFixed(2) + " -> " + runShare.toFixed(2) + " during an RB run");

// Someone taken in a minority of leagues should not go at his ADP reliably.
var pair = [{ player: kenBoard.byPos.WR[20], adp: 60, sd: 5, pct: 100 },
            { player: kenBoard.byPos.WR[21], adp: 60, sd: 5, pct: 35 }];
var rr2 = seeded(5), sureWins = 0;
for (var j2 = 0; j2 < 600; j2++)
  if (E.roomPick(pair, rr2, { roster: ken.roster }) === pair[0].player) sureWins++;
ok("a player drafted in only a third of leagues loses to one always drafted",
   sureWins > 400, sureWins + "/600");

console.log("\n== A whole draft, start to finish ==");
/* The end-to-end guard. Fifteen rounds against ADP-ordered opponents: the
   roster that comes out has to be legal and startable, which is exactly what a
   board recommending a third tight end was quietly failing to produce. */
function mockDraft(strategy, slot) {
  var teams = 12, rounds = 15;
  var order = kenBoard.players.slice().sort(function (a, b) { return (a.adp || 300) - (b.adp || 300); });
  var taken = {}, mine = [], cursor = 0, mineAt = {};
  for (var r = 1; r <= rounds; r++)
    mineAt[(r - 1) * teams + (r % 2 ? slot : teams - slot + 1)] = true;
  var myPicks = Object.keys(mineAt).map(Number).sort(function (a, b) { return a - b; });
  for (var pk = 1; pk <= teams * rounds; pk++) {
    if (!mineAt[pk]) {
      while (cursor < order.length && taken[order[cursor].name]) cursor++;
      if (cursor < order.length) { taken[order[cursor].name] = true; cursor++; }
      continue;
    }
    var avail = kenBoard.players.filter(function (p) { return !taken[p.name]; });
    var later = myPicks.filter(function (x) { return x > pk; });
    var ctx = {
      rules: ken, round: Math.ceil(pk / teams), rounds: rounds,
      need: E.positionalNeed(mine, ken), byeCounts: {}, byeTolerance: 3,
      defFloorRound: 7, kFloorRound: 14,
      vona: later[0] ? E.expectedBestAvailable(avail, later[0]) : null,
      runs: {}, replacement: kenBoard.replacement,
      currentPick: pk, nextPick: later[0] || pk, myPlayers: mine,
      strategy: strategy, stackTeams: {}, handcuffTeams: {}
    };
    var best = null, bestScore = -1e9;
    avail.forEach(function (p) {
      var sc = E.composite(p, ctx).score;
      if (sc > bestScore) { bestScore = sc; best = p; }
    });
    taken[best.name] = true; mine.push(best);
  }
  return mine;
}

["balanced", "hero_rb", "zero_rb", "elite_te", "bpa"].forEach(function (key) {
  var team = mockDraft(STRATS[key].knobs || {}, 8);
  var counts = {}; team.forEach(function (p) { counts[p.pos] = (counts[p.pos] || 0) + 1; });
  var lineup = E.assignRoster(team, ken);
  var empty = lineup.slots.filter(function (s) { return !s.player; });
  ok(key + ": every starting slot is filled", empty.length === 0,
     empty.map(function (s) { return s.pos; }).join(",") || "none empty");
  ok(key + ": no more than two tight ends", (counts.TE || 0) <= 2, "TE " + (counts.TE || 0));
  ok(key + ": exactly one kicker and one defense", counts.K === 1 && counts.DEF === 1,
     "K " + counts.K + " DEF " + counts.DEF);
  console.log("       " + key.padEnd(10) + ["QB", "RB", "WR", "TE", "K", "DEF"]
    .map(function (p) { return p + (counts[p] || 0); }).join(" ") +
    "   starters " + Math.round(lineup.slots.reduce(function (a, s) {
      return a + (s.player ? s.player.pts : 0); }, 0)) + " pts");
});

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
