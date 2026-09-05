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


// A superflex slot is a second quarterback for all but one week in seventeen, so
// twelve of them raise the QB replacement rank by 12 x 0.941 = 11.3, landing on
// 23.3 -> 23. The 0.059 that is not a quarterback splits by FLEX_SPLIT and is
// worth 0.39 of a back, 0.28 of a receiver and 0.04 of a tight end across the
// league — real, and correctly too small to move a rounded rank off 31/29/13.
var sflex = JSON.parse(JSON.stringify(ken));
sflex.roster.SUPERFLEX = 1;
var sranks = E.replacementRanks(sflex);
ok("superflex QB23, not QB12", sranks.QB === 23, JSON.stringify(sranks));
ok("superflex leaves RB31/WR29/TE13 alone",
   sranks.RB === ranks.RB && sranks.WR === ranks.WR && sranks.TE === ranks.TE);
ok("superflex leaves K/DEF alone", sranks.K === 12 && sranks.DEF === 12);
// The bug this replaces: SUPERFLEX was read by nobody, so a superflex league and
// a one-QB league priced quarterbacks identically. Pin that they now differ.
ok("a superflex league no longer prices QBs like a one-QB league",
   sranks.QB > ranks.QB + 6);
// Two superflex slots is three starting quarterbacks a team: 12 + 24 x 0.941 =
// 34.6 -> 35, which is past the 30 quarterbacks this board carries. Replacement
// is a rank, not a promise that the player exists; the board floors it later.
var sflex2 = JSON.parse(JSON.stringify(ken)); sflex2.roster.SUPERFLEX = 2;
ok("two superflex slots scale linearly", E.replacementRanks(sflex2).QB === 35);
// superflexEligible is honored, not assumed. A league that lists only QB gives
// the residual to nobody, so the flex-type ranks fall back to flex-only.
var qbOnly = JSON.parse(JSON.stringify(ken));
qbOnly.roster.SUPERFLEX = 1; qbOnly.roster.superflexEligible = ["QB"];
var qranks = E.replacementRanks(qbOnly);
ok("superflexEligible ['QB'] still lifts QB", qranks.QB === 23);
ok("superflexEligible ['QB'] gives the flex positions nothing",
   qranks.RB === ranks.RB && qranks.WR === ranks.WR && qranks.TE === ranks.TE);
// And a league with no superflex slot is byte-identical to before the change.
ok("no SUPERFLEX key changes nothing",
   JSON.stringify(E.replacementRanks(ken)) === JSON.stringify(ranks));

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
ok("emphasizing a position still lifts an above-replacement player",
   scoreUnder(earlyRB, [], { earlyPosBias: { RB: 1.35 } }, 1) > neutralEarly);
ok("de-emphasizing still drops him",
   scoreUnder(earlyRB, [], { earlyPosBias: { RB: 0.45 } }, 1) < neutralEarly);
// Where the old multiply was correct, the new signed shift must be identical.
// Asserted on `base` — the part the bias multiplier touches. The composite adds
// ceiling and risk on top of it, and those do not scale with the bias, so the
// claim was only ever exactly true of the whole score while this player had no
// grades. He has modeled ones now, and the assertion has to be about the term
// it is actually a claim about.
function baseUnder(player, mine, knobs, round) {
  return E.composite(player, ctxFor(mine, { strategy: knobs, round: round || 10 })).base;
}
near("and the arithmetic is unchanged where the old form was already right",
     baseUnder(earlyRB, [], { earlyPosBias: { RB: 1.35 } }, 1),
     baseUnder(earlyRB, [], {}, 1) * 1.35, 0.01);

var neutralLate = scoreUnder(lateRB, twoTe, {});
ok("emphasizing a position lifts a BELOW-replacement player too",
   scoreUnder(lateRB, twoTe, { posBias: { RB: 1.35 } }) > neutralLate,
   lateRB.name + " VOR " + Math.round(lateRB.vor) + ": " + Math.round(neutralLate) +
     " -> " + Math.round(scoreUnder(lateRB, twoTe, { posBias: { RB: 1.35 } })));
ok("de-emphasizing drops him rather than lifting him",
   scoreUnder(lateRB, twoTe, { posBias: { RB: 0.45 } }) < neutralLate,
   Math.round(neutralLate) + " -> " +
     Math.round(scoreUnder(lateRB, twoTe, { posBias: { RB: 0.45 } })));
ok("a position floor still blocks outright",
   !!E.composite(earlyRB, ctxFor([], { round: 2, strategy: { posFloorRound: { RB: 6 } } })).blocked);

console.log("\n== The modeled room ==");
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

console.log("\n== The board must not stack a position it is already full at ==");
/* The bug these cover: at pick 62, one pick after taking Drake Maye (320) at
   quarterback, the board's top recommendation was Lamar Jackson (328) — an
   eight-point upgrade across a whole season, half a point a Sunday, bought with
   a pick and a bench slot in a one-QB league. Two faults put him there. VONA was
   added to value whole, so a player whose position had no comparable
   replacement had his own worth counted a second time; and bench depth was
   counted against starting slots rather than against doors into the lineup, so
   the second quarterback in a one-QB league carried a starter's weight. */

var R62 = ["Drake Maye", "James Cook III", "Derrick Henry", "Nico Collins",
           "Jaylen Waddle", "Tyler Warren", "Saquon Barkley"].map(pick);
var noQb = R62.filter(function (p) { return p.pos !== "QB"; });
var lamar = pick("Lamar Jackson");

// The complaint in one line: owning a quarterback has to make the next one
// worth less. It is the whole point of scoring against your roster.
var withQb = E.composite(lamar, ctxFor(R62, { round: 6, pick: 62, nextPick: 83 }));
var withoutQb = E.composite(lamar, ctxFor(noQb, { round: 6, pick: 62, nextPick: 83 }));
ok("a quarterback you already own makes the next one worth less",
   withQb.score < withoutQb.score,
   "full " + withQb.score.toFixed(1) + " vs empty slot " + withoutQb.score.toFixed(1));
ok("and worth a lot less, not a rounding's worth",
   withQb.score < withoutQb.score * 0.5,
   withQb.score.toFixed(1) + " vs " + withoutQb.score.toFixed(1));

/* VONA is the cost of waiting: value now, less value at your next pick. Added
   to value it became a second copy of it, roughly doubling every score before
   any other term was reached — and inverting outright where everything left at
   a position was below what the roster already fielded, which turned "there is
   nothing left worth having" into an urgency bonus. It is clamped at zero and
   at value, so on a player worth nothing to you it contributes nothing. */
var vonaBad = [], scanned = 0;
[[R62, 6, 83], [noQb, 6, 83], [CORE, 10, 131], [[], 1, 24]].forEach(function (c) {
  var ctx = ctxFor(c[0], { round: c[1], nextPick: c[2] });
  var taken = {}; c[0].forEach(function (p) { taken[p.name] = 1; });
  kenBoard.players.forEach(function (p) {
    if (taken[p.name]) return;
    scanned++;
    var d = E.composite(p, ctx);
    if (d.vona > Math.max(0, d.value) + 1e-9) vonaBad.push(p.name + " vona " +
      d.vona.toFixed(1) + " > value " + d.value.toFixed(1));
  });
});
ok("VONA never exceeds the value it is a difference of",
   vonaBad.length === 0,
   vonaBad.slice(0, 3).join("; ") || scanned + " scored across 4 rosters, clean");

// Waiting cannot be the loudest thing in the score, least of all at a position
// where everything left is below the starter the roster already fields.
var qbLater = E.expectedBestAvailable(
  kenBoard.players.filter(function (p) { return R62.indexOf(p) < 0; }), 83).QB.expected;
ok("the QB likely left at the next pick is below the starter already rostered",
   qbLater < pick("Drake Maye").pts,
   "later " + Math.round(qbLater) + " vs Maye " + Math.round(pick("Drake Maye").pts));
ok("so the wait-cost is not the largest term in the score",
   withQb.score - withQb.value < withQb.value,
   "wait-cost contributes " + (withQb.score - withQb.value).toFixed(1) +
   " against value " + withQb.value.toFixed(1));

console.log("\n== Bench depth is counted in doors into the lineup ==");
/* A backup reaches the field through injury, bye or the flex, and the number of
   those doors is the position's own starting slots plus the flex if he is
   eligible for it: one at quarterback in a one-QB league, three at running
   back. The old arithmetic counted starting slots, so the *first* unstartable
   body at every position went in at a starter's weight and the discount only
   began at the third. These lock the rule to the door count. */
function benchFraction(player, mine) {
  var d = E.composite(player, ctxFor(mine, { round: 8 }));
  var beyond = (player.pts - kenBoard.replacement[player.pos].points) - d.marginal;
  return beyond > 0.01 ? (d.value - d.marginal) / beyond : null;
}
/* This used to read the flex straight off the rules, which is a verbatim copy
   of the line in composite() it was checking — so it asserted the formula
   against itself and could not catch a wrong flex count by construction. Worse,
   its own fixture is R62, whose inline comment reads "flex taken": it was
   pinning the wrong answer in exactly the state the bug is about. It now asks
   how many flex doors are actually open, which is what positionalNeed() has
   asked all along. */
function doorsFor(pos, mine) {
  var r = ken.roster;
  return (r[pos] || 0) +
    (r.flexEligible.indexOf(pos) >= 0 ? E.openFlexSlots(mine, ken) : 0);
}
[["QB", pick("Trevor Lawrence"), 1],       // 301, cannot beat Maye's 320
 ["TE", pick("Kyle Pitts Sr."), 1],        // behind Tyler Warren, flex taken
 ["RB", pick("Jaylen Warren"), 3]          // behind Cook, Henry and Barkley
].forEach(function (c) {
  var pos = c[0], player = c[1], have = c[2], doors = doorsFor(pos, R62);
  var want = Math.min(0.45, 0.14 * doors) * Math.pow(0.55, Math.max(0, have - doors + 1));
  var got = benchFraction(player, R62);
  near(pos + (have + 1) + " keeps the fraction his " + doors + " door" +
       (doors === 1 ? "" : "s") + " earn (" + player.name + ")", got, want, 0.005);
});

// The regression itself: under the old starters-based rule the second
// quarterback in a one-QB league kept the undiscounted 0.14, the same as a
// starter. He must now keep strictly less.
ok("the second quarterback is no longer priced like the first",
   benchFraction(pick("Trevor Lawrence"), R62) < 0.14 - 1e-9,
   "keeps " + benchFraction(pick("Trevor Lawrence"), R62).toFixed(3) + ", was 0.14");

// The streaming positions were already special-cased at 0.04 and must stay
// there: the fix moves the exponent, not the floor.
var oneK = [kenBoard.byPos.K[0]], oneDef = [kenBoard.byPos.DEF[0]];
ok("a backup kicker is still worth almost nothing",
   Math.abs(E.composite(kenBoard.byPos.K[3], ctxFor(oneK, { round: 14 })).value) < 3,
   E.composite(kenBoard.byPos.K[3], ctxFor(oneK, { round: 14 })).value.toFixed(2));
ok("a backup defense is still worth almost nothing",
   Math.abs(E.composite(kenBoard.byPos.DEF[3], ctxFor(oneDef, { round: 10 })).value) < 4,
   E.composite(kenBoard.byPos.DEF[3], ctxFor(oneDef, { round: 10 })).value.toFixed(2));

console.log("\n== The displacement accounting, so nobody 'fixes' it back ==");
/* What survives of a displacing player's open-market worth is exactly the
   surplus of the man he pushes out of the lineup — not a comparison against a
   free agent, which is what a reading of the code once suggested. It is
   asserted here because it looks like a bug and is not one: taking Lamar
   converts Maye into bench insurance, and that insurance is what this term
   prices. */
var replQb = kenBoard.replacement.QB.points, floorQb = pick("Drake Maye").pts;
near("a displacing player keeps exactly the displaced starter's surplus",
     (lamar.pts - replQb) - withQb.marginal, floorQb - replQb, 0.5);

console.log("\n== A narrow upgrade has to read as a narrow upgrade ==");
var upgradeReason = withQb.reasons.filter(function (r) {
  return r.indexOf("upgrades your starting") === 0;
})[0] || "";
ok("the upgrade is priced per week, not as a season total",
   /pts a week/.test(upgradeReason), upgradeReason || "no upgrade reason at all");
ok("and a half-point-a-week upgrade says what it costs",
   /and benches the QB you have/.test(upgradeReason), upgradeReason);
console.log("       " + (upgradeReason || "(none)"));

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


console.log("\n== While a starting slot is empty, the board's #1 can start ==");
/* The invariant, in arithmetic: while the user has an empty starting slot, no
   player whose marginal contribution to the startable lineup is <= 0 may be the
   board's #1. Measured over 200 seeded drafts on the shipped engine it broke on
   5.5% of the user's mid-round picks, every one of them fixable — some player on
   the board did add points and was ranked behind someone who did not.

   These pin the property itself rather than the guard's arithmetic, so a later
   change that reaches the same end by better means does not have to touch them. */
(function () {
  function boardTop(mine, opts) {
    var taken = {}; mine.forEach(function (p) { taken[p.name] = 1; });
    var scored = kenBoard.players
      .filter(function (p) { return !taken[p.name]; })
      .map(function (p) { return { p: p, d: E.composite(p, ctxFor(mine, opts)) }; })
      .sort(function (a, b) { return b.d.score - a.d.score; });
    return scored;
  }
  function openSlots(mine) {
    return E.assignRoster(mine, ken).slots.filter(function (s) { return !s.player; });
  }

  // Drop a receiver from the round-6 roster: WR2 is now empty and fillable.
  var noWr = R62.filter(function (p) { return p.name !== "Jaylen Waddle"; });
  var open = openSlots(noWr).map(function (s) { return s.slot || s.pos; });
  ok("the fixture really does leave a startable receiver slot open",
     open.some(function (s) { return String(s).indexOf("WR") === 0; }), open.join(", "));

  var top = boardTop(noWr, { round: 8, pick: 86, nextPick: 107 });
  ok("with WR2 empty, the board's #1 adds points to the lineup he would start in",
     top[0].d.marginal > 0,
     top[0].p.name + " (" + top[0].p.pos + ") marginal " + top[0].d.marginal.toFixed(2));

  // And again with the tight end gone, which is the shape the whole finding is
  // named for: a backup tight end on top while a starting slot sits empty.
  var noTe = R62.filter(function (p) { return p.name !== "Tyler Warren"; });
  var topTe = boardTop(noTe, { round: 8, pick: 86, nextPick: 107 });
  ok("with TE empty, the board's #1 can also crack the lineup",
     topTe[0].d.marginal > 0,
     topTe[0].p.name + " (" + topTe[0].p.pos + ") marginal " + topTe[0].d.marginal.toFixed(2));

  // The guard is conditional, not a blanket penalty on depth. Fill every slot
  // and a zero-marginal player must be scored exactly as he was before it
  // existed. Note what "every slot" means: the kicker slot counts even though
  // the floor forbids taking one until round 14, so in practice this guard is
  // live for most of a draft. That is deliberate — while any starter is
  // missing, a body who cannot start is not the pick.
  var bestAt = function (pos) {
    return kenBoard.players.filter(function (p) {
      return p.pos === pos && R62.indexOf(p) < 0;
    }).sort(function (a, b) { return b.pts - a.pts; })[0];
  };
  var full = R62.concat([bestAt("K"), bestAt("DEF")]);
  var stillOpen = openSlots(full);
  ok("the full-roster fixture leaves no starting slot empty", stillOpen.length === 0,
     stillOpen.map(function (s) { return s.slot || s.pos; }).join(", "));

  // A second tight end behind a filled tight end and a filled flex adds nothing.
  var depth = pick("Kyle Pitts Sr.");
  var dFull = E.composite(depth, ctxFor(full, { round: 8, pick: 86, nextPick: 107 }));
  var dOpen = E.composite(depth, ctxFor(noWr, { round: 8, pick: 86, nextPick: 107 }));
  ok("the depth-only player really is zero-marginal in both states",
     dFull.marginal <= 0.5 && dOpen.marginal <= 0.5,
     "full " + dFull.marginal.toFixed(2) + ", open " + dOpen.marginal.toFixed(2));
  ok("he is penalized while a slot is open, and not once every slot is filled",
     Math.round(dOpen.value - dFull.value) === Math.round(dOpen.score - dFull.score + 100),
     "score gap " + (dOpen.score - dFull.score).toFixed(1) +
     " against value gap " + (dOpen.value - dFull.value).toFixed(1));

  // Best-player-available turns roster awareness off on purpose, so the guard
  // must not fire there — it is a statement about a roster, and that mode is
  // deliberately not making one.
  var bpa = E.composite(depth, ctxFor(noWr,
    { round: 8, pick: 86, nextPick: 107, strategy: { needWeight: 0 } }));
  var bpaFull = E.composite(depth, ctxFor(full,
    { round: 8, pick: 86, nextPick: 107, strategy: { needWeight: 0 } }));
  near("under best-player-available an open slot does not penalize depth",
       bpa.score - bpaFull.score, 0, 0.5);
})();


console.log("\n== A pick nobody caught is not a run ==");
/* "Didn't catch the name" records a pick with no player, and analyze() hands
   detectRuns a { pos: "?" } placeholder for it. Counting those together made
   four unknowns in eight picks a run at "?", and renderRunBanner then put
   "? run in progress - 5 of the last 8 picks" on screen. That is the one flow
   the draft-day runbook tells the user to reach for when they fall behind, so
   the bug fired exactly when they were already under pressure. */
(function () {
  var unknown8 = [];
  for (var i = 0; i < 8; i++) unknown8.push({ pos: "?" });
  var r = E.detectRuns(unknown8);
  ok("eight uncaught picks are not a run at anything",
     Object.keys(r.runs).length === 0, JSON.stringify(r.runs));
  ok("and they are counted as unknown rather than as a position",
     r.unknown === 8, "unknown " + r.unknown);
  ok("no phantom position appears in the counts",
     Object.keys(r.counts).indexOf("?") < 0, JSON.stringify(r.counts));

  // A real run still fires, and unknowns beside it do not mask it.
  var mixed = [{ pos: "WR" }, { pos: "WR" }, { pos: "?" }, { pos: "WR" },
               { pos: "RB" }, { pos: "?" }, { pos: "WR" }, { pos: "TE" }];
  var m = E.detectRuns(mixed);
  ok("four receivers in eight picks is still a run", m.runs.WR === 4,
     JSON.stringify(m.runs));
  ok("the two uncaught picks are reported separately", m.unknown === 2);
  ok("the window is still the last eight picks", m.window === 8);

  // Three real plus an unknown is not four. We do not guess the missing one.
  var three = [{ pos: "WR" }, { pos: "WR" }, { pos: "WR" }, { pos: "?" },
               { pos: "RB" }, { pos: "TE" }, { pos: "QB" }, { pos: "RB" }];
  ok("three receivers and an uncaught pick is not promoted to a run",
     Object.keys(E.detectRuns(three).runs).length === 0,
     JSON.stringify(E.detectRuns(three).runs));
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
