/* node ff/tools/measure-roompick.js — measures how often roomPick()'s ranked
 * prediction for "who the team on the clock takes next" actually contains
 * the pick that happens, ahead of building tap-target buttons for it
 * (qa-review-prompt.md §J1).
 *
 * GROUND TRUTH, STATED UP FRONT: this repo has no logged real drafts, so
 * there is no external ground truth to test roomPick() against. Comparing
 * roomPick() to itself (same model, same draw) would be circular and would
 * read close to 100% by construction, which would tell us nothing.
 *
 * Instead this script drives the board with a SECOND, structurally
 * different pick model for "what actually happens" ("the room"), and scores
 * roomPick()'s prediction against that:
 *
 *   - roomPick() (the prediction) is Gaussian: draw = adp + sd*gauss(rnd)
 *     per candidate, lowest draw wins, subject to position caps. Its
 *     predicted ranking here is a Monte Carlo estimate: roomPick is run many
 *     times per pick with fresh random draws and the results are tallied
 *     into a frequency-ranked list.
 *
 *   - "the room" (ground truth) is rank-order: sort remaining candidates by
 *     raw ADP, take the top K (K=3) still under their position cap, and pick
 *     uniformly among just those K. No per-player standard deviation, no
 *     Gaussian noise, no run/pct adjustment anywhere in it — a "mostly-chalk,
 *     occasional reach among the top few" model, chosen specifically so it
 *     does not share roomPick's generative family.
 *
 * LIMITATION, stated plainly: this is still a synthetic proxy, not real
 * draft behavior. Real Yahoo pct/trend data would let roomPick's own
 * pct-availability and run terms fire (they never do here, since bare
 * players.js has no yadp/ypct), which would make roomPick and this ground
 * truth even more alike than they already are as two ADP-anchored models.
 * If a logged real draft ever becomes available, replace groundTruthPick()
 * with a replay of it — that would be actual ground truth, this is not.
 * Treat the numbers below as "how well does roomPick track a plausible
 * chalk-with-reaches room", not "how well does it predict real humans".
 */

require("../data/players.js");
require("../assets/presets.js");
var E = require("../assets/engine.js");

var D = globalThis.DRAFTLINE_DATA, P = globalThis.DRAFTLINE_PRESETS;
var rules = P.kinda_highlanders;
var TEAMS = rules.teams;           // 12
var ROUNDS = 15;                    // matches meta.your_picks length (15 of 180)
var TOTAL_PICKS = TEAMS * ROUNDS;   // 180
var MY_SLOT = D.meta.slot || 1;     // excluded from prediction scoring, like the real user

var DRAFTS = 200;
var TRIALS = 150;   // Monte Carlo repeats of roomPick per opponent pick
var POOL = 70;       // candidate pool truncation (by ADP) for the Monte Carlo — see note below
var REACH_K = 3;     // ground truth: uniform pick among the top-K by ADP under cap

var board = E.buildBoard(D.players, rules);
// roomPick reads {player, adp, sd, pct}; pct stays null throughout (no real
// yadp/ypct in players.js), matching how the app behaves before any real
// draft results are pasted in.
var allPlayers = board.players.filter(function (p) { return p.adp != null; });

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ownerOfPick(pick) {
  var r = Math.ceil(pick / TEAMS), idx = pick - (r - 1) * TEAMS;
  return { round: r, slot: (r % 2 === 1) ? idx : (TEAMS - idx + 1) };
}

/* Ground truth: rank-order-with-reaches. `sortedCands` is the full remaining
 * pool, already sorted by adp ascending. No sd, no Gaussian — deliberately a
 * different mechanism than roomPick. */
function groundTruthPick(sortedCands, counts, roster, rnd) {
  var eligible = [];
  for (var i = 0; i < sortedCands.length && eligible.length < REACH_K; i++) {
    var pl = sortedCands[i].player;
    if ((counts[pl.pos] || 0) < E.depthCap(pl.pos, roster)) eligible.push(pl);
  }
  if (!eligible.length) return sortedCands.length ? sortedCands[0].player : null;
  return eligible[Math.floor(rnd() * eligible.length)];
}

var overall = { n: 0, top1: 0, top3: 0, top5: 0 };
var byRound = [];
for (var r = 0; r <= ROUNDS; r++) byRound[r] = { n: 0, top1: 0, top3: 0, top5: 0 };

var predSeed = 0xC0FFEE, gtSeed = 0xFACADE;

console.log("measure-roompick: " + DRAFTS + " drafts, " + TRIALS +
  " MC trials/pick, pool " + POOL + ", reach-K " + REACH_K + " ...");
var t0 = Date.now();

for (var it = 0; it < DRAFTS; it++) {
  var rndPred = mulberry32(predSeed + it * 97 + 13);
  var rndGT = mulberry32(gtSeed + it * 131 + 7);
  var taken = Object.create(null);
  var counts = {};
  for (var s = 1; s <= TEAMS; s++) counts[s] = {};

  for (var pk = 1; pk <= TOTAL_PICKS; pk++) {
    var owner = ownerOfPick(pk), slot = owner.slot, round = owner.round;
    var avail = allPlayers.filter(function (p) { return !taken[p.name]; });
    if (!avail.length) break;
    avail.sort(function (a, b) { return a.adp - b.adp; });
    var candsFull = avail.map(function (p) {
      return { player: p, adp: p.adp, sd: Math.max(p.adp_sd || 6, 1.5), pct: null };
    });

    var actual;
    if (slot !== MY_SLOT) {
      var pool = candsFull.slice(0, Math.min(POOL, candsFull.length));
      var tally = Object.create(null);
      for (var t = 0; t < TRIALS; t++) {
        var picked = E.roomPick(pool, rndPred, { counts: counts[slot], roster: rules.roster });
        if (picked) tally[picked.name] = (tally[picked.name] || 0) + 1;
      }
      var ranked = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; });

      actual = groundTruthPick(candsFull, counts[slot], rules.roster, rndGT);
      if (actual) {
        var idx = ranked.indexOf(actual.name); // -1 if never once predicted
        overall.n++; byRound[round].n++;
        if (idx === 0) { overall.top1++; byRound[round].top1++; }
        if (idx >= 0 && idx < 3) { overall.top3++; byRound[round].top3++; }
        if (idx >= 0 && idx < 5) { overall.top5++; byRound[round].top5++; }
      }
    } else {
      actual = groundTruthPick(candsFull, counts[slot], rules.roster, rndGT);
    }

    if (!actual) break;
    taken[actual.name] = true;
    counts[slot][actual.pos] = (counts[slot][actual.pos] || 0) + 1;
  }
  if ((it + 1) % 20 === 0)
    console.log("  ..." + (it + 1) + "/" + DRAFTS + " drafts (" +
      ((Date.now() - t0) / 1000).toFixed(0) + "s)");
}

function pct(n, d) { return d ? (100 * n / d).toFixed(1) + "%" : "n/a"; }

console.log("\n=== roomPick prediction vs. rank-order-with-reaches ground truth ===\n");
console.log("opponent picks sampled: " + overall.n + " (" + DRAFTS + " drafts x up to " +
  (TOTAL_PICKS - ROUNDS) + " opponent picks each)\n");
console.log("overall  top-1: " + pct(overall.top1, overall.n) +
  "   top-3: " + pct(overall.top3, overall.n) +
  "   top-5: " + pct(overall.top5, overall.n));

console.log("\nround  n     top-1     top-3     top-5");
for (var rr = 1; rr <= ROUNDS; rr++) {
  var b = byRound[rr];
  console.log(
    String(rr).padStart(3) + "  " +
    String(b.n).padStart(4) + "  " +
    pct(b.top1, b.n).padStart(8) + "  " +
    pct(b.top3, b.n).padStart(8) + "  " +
    pct(b.top5, b.n).padStart(8)
  );
}
console.log("\n(" + ((Date.now() - t0) / 1000).toFixed(1) + "s)");
