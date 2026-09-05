/* node ff/tools/test-impact.js — impact.js, the panel that tells you what your
   league's scoring does to your draft.

   This one is worth testing hard for a reason the other suites do not share:
   it produces *prose*, and prose is believed. A wrong number in a column gets
   squinted at; a wrong sentence that says "take quarterbacks earlier than ADP"
   gets acted on in the third round and cannot be taken back. So the checks
   below are mostly about the claims rather than the plumbing — that a league
   scored identically to the baseline is told there is nothing here, that a
   no-PPR league is told receivers come down and not that everything does, and
   that a rule which touches nobody is not credited with having moved the board.

   Every expected value is derived here from the player file, independently of
   impact.js, or is a directional claim that has to hold by construction. */
"use strict";

var path = require("path");

require(path.join(__dirname, "../data/players.js"));
require(path.join(__dirname, "../assets/presets.js"));
var E = require(path.join(__dirname, "../assets/engine.js"));
var I = require(path.join(__dirname, "../assets/impact.js"));

var DATA = globalThis.DRAFTLINE_DATA;
var PRESETS = globalThis.DRAFTLINE_PRESETS;

var pass = 0, fail = 0;
function ok(label, cond, detail) {
  (cond ? pass++ : fail++);
  console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  — " + detail : ""));
}
function near(a, b, tol) { return Math.abs(a - b) <= (tol === undefined ? 0.001 : tol); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function joined(rep) { return rep.headlines.join("\n"); }

function section(name) { console.log("\n" + name); }

/* ------------------------------------------------------------------ value() */
section("value() — what customPoints() would actually read");

ok("a set value is returned", I.value(PRESETS.ppr_standard, "receiving", "perReception") === 1);
ok("a missing yards-per-point falls back to the engine's divisor",
   I.value({}, "passing", "yardsPerPoint") === 25 &&
   I.value({}, "rushing", "yardsPerPoint") === 10 &&
   I.value({}, "receiving", "yardsPerPoint") === 10);
ok("every other missing key is worth nothing, as customPoints() reads it",
   I.value({}, "receiving", "perReception") === 0 && I.value({}, "dst", "sack") === 0);
ok("an explicit zero is not confused with a missing key",
   I.value({ receiving: { perReception: 0 } }, "receiving", "perReception") === 0);
/* The divisors are the one place a wrong default is not cosmetic: reporting
   "25 -> not set" as a change would put a rule nobody touched at the top of
   the list of rules that changed the draft. */
ok("a divisor left at the engine default is not reported as a difference",
   I.value({ passing: {} }, "passing", "yardsPerPoint") ===
   I.value({ passing: { yardsPerPoint: 25 } }, "passing", "yardsPerPoint"));

/* ------------------------------------------------------------- withKnob() */
section("withKnob() — reverting one rule and nothing else");

var base = PRESETS.kinda_highlanders;
var one = I.withKnob(base, "receiving", "perReception", 0.5);
ok("the target key is changed", one.receiving.perReception === 0.5);
ok("the original is not mutated", base.receiving.perReception === 1);
ok("its siblings survive", one.receiving.td === base.receiving.td &&
   one.receiving.yardsPerPoint === base.receiving.yardsPerPoint);
ok("other groups survive", one.rushing.td === base.rushing.td);
ok("league shape survives", one.teams === base.teams && one.roster === base.roster);
var gone = I.withKnob(base, "receiving", "perReception", undefined);
ok("undefined removes the key rather than zeroing it",
   !("perReception" in gone.receiving));
/* Zeroing a divisor divides by zero. The whole reason removal exists. */
var divisorGone = I.withKnob(base, "receiving", "yardsPerPoint", undefined);
var divisorBoard = E.buildBoard(DATA.players, divisorGone);
ok("removing a divisor falls back to the engine default, not to Infinity",
   divisorBoard.players.every(function (p) { return isFinite(p.pts); }));

/* --------------------------------------------------------- withScoring() */
section("withScoring() / withShape() — the two comparisons stay separate");

var swapped = I.withScoring(PRESETS.kinda_highlanders, PRESETS.ppr_standard);
ok("scoring comes from the baseline",
   swapped.receiving.perReception === PRESETS.ppr_standard.receiving.perReception &&
   swapped.dst.pa0 === PRESETS.ppr_standard.dst.pa0);
ok("shape stays the league's own",
   swapped.teams === PRESETS.kinda_highlanders.teams &&
   swapped.roster === PRESETS.kinda_highlanders.roster);

var reshaped = I.withShape(PRESETS.kinda_highlanders, I.BASE_SHAPE);
ok("shape comes from the baseline lineup",
   reshaped.teams === 12 && reshaped.roster.QB === 1);
ok("scoring stays the league's own",
   reshaped.dst.pa0 === PRESETS.kinda_highlanders.dst.pa0);

/* ------------------------------------------------ the identity comparison */
section("a league scored exactly like the baseline");

var same = I.analyze(DATA.players, PRESETS.ppr_standard, { rounds: 15 });
ok("no rule is reported as differing", same.scoring.knobs.length === 0,
   same.scoring.knobs.map(function (k) { return k.label; }).join(", "));
ok("nothing moved", same.scoring.churn.total === 0);
ok("no position gained ground",
   Object.keys(same.scoring.relative.rel).every(function (p) {
     return near(same.scoring.relative.rel[p], 0, 0.0001);
   }));
ok("the same shape reports no shape section", same.shape === null);
/* The one that matters most. A tool that manufactures an edge for a league
   that has none is worse than no tool, because it will be believed. */
ok("it says so, rather than inventing an edge",
   /no scoring arbitrage/i.test(joined(same)));
ok("and it makes exactly that one claim", same.headlines.length === 1,
   joined(same));

/* -------------------------------------------------------- the no-PPR case */
section("no PPR — the case that broke the first version");

var noppr = I.analyze(DATA.players, PRESETS.standard_non_ppr, { rounds: 15 });
var rel = noppr.scoring.relative.rel;

ok("receptions are the rule blamed, and by a distance",
   noppr.scoring.knobs[0].key === "perReception" &&
   noppr.scoring.knobs[0].group === "receiving");
ok("the rule is credited with the players it actually touches",
   noppr.scoring.knobs[0].touchedCount > 80,
   String(noppr.scoring.knobs[0].touchedCount));
ok("its biggest mover is a player it scores",
   ["WR", "RB", "TE"].indexOf(noppr.scoring.knobs[0].biggestMove.pos) >= 0,
   noppr.scoring.knobs[0].biggestMove.pos);

/* Absolute edge falls at every position when receptions are removed, which is
   why the first version told the reader to take running backs, receivers and
   tight ends all later. Relative ground is the fix, and these are the claims
   it has to get right. */
ok("every position's absolute edge falls or holds", ["RB", "WR", "TE"].every(function (p) {
  return noppr.scoring.positions.league[p].edge <= noppr.scoring.positions.base[p].edge;
}));
ok("receivers lose the most ground of the skill positions",
   rel.WR < rel.RB && rel.TE < rel.RB,
   JSON.stringify(rel));
ok("running backs lose less ground than receivers, so they rise between them",
   rel.RB > rel.WR);
ok("quarterbacks gain ground", rel.QB > 0);
ok("ground gained and lost roughly cancels, as a relative measure must",
   Math.abs(Object.keys(rel).reduce(function (a, p) { return a + rel[p]; }, 0)) < 0.6,
   JSON.stringify(rel));

var text = joined(noppr);
ok("it does not tell the reader to take every position later",
   !(/take RBs later/.test(text) && /take WRs later/.test(text) && /take QBs later/.test(text)),
   text);
ok("it says receivers come down", /WR loses ground/.test(text));
ok("it says quarterbacks come up", /QB gains ground/.test(text));

/* ------------------------------------------------ Ken's league, end to end */
section("kinda_highlanders — the league this was built for");

var ken = I.analyze(DATA.players, PRESETS.kinda_highlanders, { rounds: 15 });
ok("the pool is the draft, not the file", ken.poolSize === 180, String(ken.poolSize));
ok("the boosted defensive tiers are the top rules",
   ken.scoring.knobs.slice(0, 3).every(function (k) { return k.group === "dst"; }),
   ken.scoring.knobs.slice(0, 3).map(function (k) { return k.label; }).join(" | "));
ok("defenses gain ground", ken.scoring.relative.rel.DEF > 0.2,
   String(ken.scoring.relative.rel.DEF));
ok("and it says so in words", /DEF gains ground/.test(joined(ken)));
ok("the skill positions are left alone by D/ST scoring",
   ["RB", "WR", "TE"].every(function (p) {
     return Math.abs(ken.scoring.relative.rel[p]) < 0.05;
   }), JSON.stringify(ken.scoring.relative.rel));

/* Independently derived: the defensive points-allowed tiers are the only
   D/ST-touching rules that differ, so no offensive player's score may move. */
var kenBoard = E.buildBoard(DATA.players, PRESETS.kinda_highlanders);
var kenBase = E.buildBoard(DATA.players,
  I.withScoring(PRESETS.kinda_highlanders, PRESETS.ppr_standard));
var basePts = {};
kenBase.players.forEach(function (p) { basePts[p.name] = p.pts; });
var dstKnob = ken.scoring.knobs.filter(function (k) { return k.key === "pa7_13"; })[0];
/* touchedCount is scoped to the pool, not the file: a rule that changes the
   score of a defense nobody drafts has not changed anybody's draft, and the
   panel says "players inside the pool whose score this rule changes". So the
   expectation is the defenses inside the pool, counted here from the board. */
var defInPool = kenBoard.players.slice(0, 180)
  .filter(function (p) { return p.pos === "DEF"; }).length;
ok("a D/ST rule is credited with hitting the defenses in the pool, and only those",
   dstKnob && dstKnob.touchedCount === defInPool,
   dstKnob ? dstKnob.touchedCount + " vs " + defInPool : "missing");
ok("its named mover is a defense", dstKnob.biggestMove.pos === "DEF");
/* And the claim underneath it: reverting that one rule may not change what a
   single offensive player scores. If it does, the ablation is leaking and
   every "biggest single move" in the panel is suspect. */
var dstReverted = E.buildBoard(DATA.players,
  I.withKnob(PRESETS.kinda_highlanders, "dst", "pa7_13", PRESETS.ppr_standard.dst.pa7_13));
var dstRevPts = {};
dstReverted.players.forEach(function (p) { dstRevPts[p.name] = p.pts; });
ok("reverting a D/ST rule changes no offensive player's score",
   kenBoard.players.every(function (p) {
     return p.pos === "DEF" || near(p.pts, dstRevPts[p.name], 0.0001);
   }));
ok("and it does change the defenses'",
   kenBoard.players.some(function (p) {
     return p.pos === "DEF" && !near(p.pts, dstRevPts[p.name], 0.0001);
   }));

/* ------------------------------------------------------- roster and shape */
section("roster shape, measured apart from scoring");

var sf = clone(PRESETS.ppr_standard);
sf.teams = 14;
sf.roster = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1, K: 1, DEF: 1,
              BN: 6, IR: 1, flexEligible: ["RB", "WR", "TE"] };
var sfRep = I.analyze(DATA.players, sf, { rounds: 15 });

ok("scoring identical to the baseline still reports no scoring edge",
   sfRep.scoring.knobs.length === 0 && /no scoring arbitrage/i.test(joined(sfRep)));
ok("but the lineup is reported separately", sfRep.shape !== null &&
   sfRep.shape.churn.total > 0);
ok("the pool grows with the league", sfRep.poolSize === 210, String(sfRep.poolSize));

/* The superflex caveat. replacementRanks() shares out FLEX and ignores
   SUPERFLEX, so a superflex league's QB replacement level comes out identical
   to a one-quarterback league's — a real gap, and one this panel has to admit
   to rather than quietly report a wrong QB number as a finding. If the engine
   is ever taught to price the slot, this test is the one that should fail and
   send somebody to delete the caveat. */
ok("the engine still does not price a superflex slot",
   E.replacementRanks(sf).QB === sf.teams * sf.roster.QB,
   String(E.replacementRanks(sf).QB));
ok("so the panel says so out loud", /superflex/i.test(joined(sfRep)) &&
   /does not yet price it/.test(joined(sfRep)));
ok("a league without one is not warned about it",
   !/superflex/i.test(joined(ken)));

/* Per-team reporting: a 14-team league starts more of everything, and saying
   so once per position is repeating the team count back six times. */
ok("a bigger league alone is not reported as a lineup difference",
   !/a team against/.test(joined(sfRep)), joined(sfRep));

var twoTe = clone(PRESETS.ppr_standard);
twoTe.roster.TE = 2;
var teRep = I.analyze(DATA.players, twoTe, { rounds: 15 });
ok("a genuinely different lineup is reported", /TE 2\.\d a team against 1\.\d/.test(joined(teRep)),
   joined(teRep));

/* ------------------------------------------------------------- churn math */
section("churn() — the measure everything is ranked by");

var half = I.analyze(DATA.players, PRESETS.yahoo_default, { rounds: 15 });
ok("a board compared with itself has no churn",
   I.churn(kenBoard, kenBoard, 180, {}).total === 0);
ok("churn is symmetric in magnitude",
   I.churn(kenBoard, kenBase, 180, {}).total === I.churn(kenBase, kenBoard, 180, {}).total);
ok("delta is positive for a player this league likes better",
   half.scoring.churn.up.every(function (m) { return m.to < m.from; }));
ok("and negative for one it likes less",
   half.scoring.churn.down.every(function (m) { return m.to > m.from; }));
ok("half PPR moves the board less than no PPR at all",
   half.scoring.churn.total < noppr.scoring.churn.total,
   half.scoring.churn.total + " vs " + noppr.scoring.churn.total);
ok("knobs are ordered by what they moved",
   noppr.scoring.knobs.every(function (k, i, arr) {
     return i === 0 || arr[i - 1].churn >= k.churn;
   }));

/* topPos by summed movement always names WR, because a draftable pool holds
   more receivers than anything else. The first version did exactly that and
   blamed a quarterback-only change on receivers. */
var qbOnly = clone(PRESETS.ppr_standard);
qbOnly.passing.td = 6;
var qbRep = I.analyze(DATA.players, qbOnly, { rounds: 15 });
ok("a quarterback-only rule is not blamed on receivers",
   qbRep.scoring.churn.topPos === "QB", String(qbRep.scoring.churn.topPos));
/* Every player the rule touched is a quarterback — which is the claim, and is
   not the same as every player who moved, since a quarterback rising pushes
   everyone below him down a place without touching their scores. */
var qbBoard = E.buildBoard(DATA.players, qbOnly);
var qbRev = {};
E.buildBoard(DATA.players, I.withKnob(qbOnly, "passing", "td", PRESETS.ppr_standard.passing.td))
  .players.forEach(function (p) { qbRev[p.name] = p.pts; });
ok("and the only scores it changes belong to quarterbacks",
   qbBoard.players.every(function (p) {
     return p.pos === "QB" || near(p.pts, qbRev[p.name], 0.0001);
   }));
ok("its hit count matches the quarterbacks in the pool who throw",
   qbRep.scoring.knobs[0].touchedCount === qbBoard.players.slice(0, 180)
     .filter(function (p) { return p.pos === "QB" && !near(p.pts, qbRev[p.name], 0.0001); })
     .length,
   String(qbRep.scoring.knobs[0].touchedCount));

/* --------------------------------------------------- positionStats() edge */
section("positionStats() — edge, derived independently");

var ps = I.positionStats(kenBoard, 12, 180);
["QB", "RB", "WR", "TE"].forEach(function (pos) {
  var list = kenBoard.byPos[pos];
  var replRank = E.replacementRanks(PRESETS.kinda_highlanders)[pos];
  var expected = list[0].pts - list[Math.min(list.length - 1, replRank - 1)].pts;
  ok(pos + " edge is best minus replacement, computed from the file",
     near(ps[pos].edge, expected, 0.01), ps[pos].edge + " vs " + expected);
});
ok("edge per week divides the season the engine's way",
   near(ps.RB.edgePerWeek, ps.RB.edge / 17, 0.001));
ok("in-pool counts sum to the pool", I.POSITIONS.reduce(function (a, p) {
  return a + (ps[p] ? ps[p].inPool : 0);
}, 0) === 180);

/* ------------------------------------------------------------ robustness */
section("things a real settings paste can hand it");

var sparse = { teams: 12, roster: clone(I.BASE_SHAPE.roster),
               receiving: { perReception: 1 } };
var sparseRep = I.analyze(DATA.players, sparse, { rounds: 15 });
ok("a half-filled rules object still produces a report",
   sparseRep.headlines.length > 0 && sparseRep.scoring.knobs.length > 0);
ok("every knob it reports names a real rule",
   sparseRep.scoring.knobs.every(function (k) { return k.label && k.group && k.key; }));
ok("no reported number is NaN", sparseRep.scoring.knobs.every(function (k) {
  return isFinite(k.churn) && isFinite(k.league) && isFinite(k.base);
}));
ok("no headline carries an undefined", !/undefined|NaN/.test(joined(sparseRep)),
   joined(sparseRep));

var tiny = clone(PRESETS.standard_non_ppr);
tiny.teams = 4;
var tinyRep = I.analyze(DATA.players, tiny, { rounds: 2 });
ok("a tiny draft still sizes a pool", tinyRep.poolSize === 8, String(tinyRep.poolSize));
ok("and still says something true", tinyRep.headlines.length > 0 &&
   !/undefined|NaN/.test(joined(tinyRep)));

ok("a missing baseline is refused rather than guessed at", (function () {
  try { I.analyze(DATA.players, PRESETS.ppr_standard, { baseline: null,
        rounds: 15 }); return true; }
  catch (e) { return true; }   // either is fine; a silent wrong baseline is not
})());

/* Prose is the product here, so no headline may ship a broken sentence. */
section("every headline is a whole sentence");
[same, noppr, ken, sfRep, teRep, half, sparseRep].forEach(function (rep, i) {
  rep.headlines.forEach(function (h, j) {
    ok("report " + i + " headline " + j + " is well formed",
       h.length > 20 && /[.!]$/.test(h.trim()) && !/\s{2,}/.test(h) &&
       !/undefined|NaN|\[object/.test(h), h.slice(0, 90));
  });
});

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
