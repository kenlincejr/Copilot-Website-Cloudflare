/* node ff/tools/audit.js — hunts for the class of bug the tiering had: numbers
   that render without error and are quietly wrong. Reports findings by severity;
   it is meant to be re-run after any change to the bake or the engine. */

require("../data/players.js");
require("../assets/presets.js");
var E = require("../assets/engine.js");

var D = globalThis.DRAFTLINE_DATA, P = globalThis.DRAFTLINE_PRESETS;
var rules = P.kinda_highlanders;
var board = E.buildBoard(D.players, rules);
var findings = [];
function flag(sev, area, msg) { findings.push({ sev: sev, area: area, msg: msg }); }

/* ---------------------------------------------- 1. name-matched side data */
// depth/injury/adp2 are joined by normalized name. Sleeper's file has 12,226
// records including retired and practice-squad players who share names with
// starters, so a bad join would silently attach one player's injury to another.
var posMismatch = 0;
D.players.forEach(function (p) {
  if (p.depthPos && ["QB", "RB", "WR", "TE", "K"].indexOf(p.pos) >= 0) {
    // Sleeper writes receiver slots as LWR / RWR / SWR and everything else
    // plainly, so a receiver is any slot containing WR and the rest match exactly.
    var same = p.pos === "WR" ? /WR/.test(p.depthPos) : p.depthPos === p.pos;
    if (!same) { posMismatch++; flag("HIGH", "join",
      p.name + " (" + p.pos + " " + p.team + ") got depth slot " + p.depthPos + p.depth); }
  }
});
if (!posMismatch) flag("ok", "join", "no depth-chart slot contradicts the player's position");

// A 2026 team change is the likeliest way a name join goes wrong: attaching the
// depth chart of the team he left. The research board carries the current team,
// so anything with depth data must agree with it.
var teamMismatch = [];
D.players.forEach(function (p) {
  if (p.depth && p.sleeperTeam && p.sleeperTeam !== p.team) teamMismatch.push(p.name);
});
if (teamMismatch.length)
  flag("HIGH", "join", teamMismatch.length + " players carry a depth chart from a different " +
    "team than the board says: " + teamMismatch.slice(0, 6).join(", "));

/* ------------------------------------------- 2. degenerate scoring inputs */
D.players.forEach(function (p) {
  var s = E.customPoints(p, rules);
  if (!isFinite(s.total)) flag("HIGH", "scoring", p.name + " scores " + s.total);
  if (s.total < 0) flag("MED", "scoring", p.name + " scores negative (" + s.total.toFixed(0) + ")");
  if (p.pos !== "K" && p.pos !== "DEF" && s.total === 0)
    flag("MED", "scoring", p.name + " scores exactly zero — projection probably missing");
  if ((p.proj || {}).gp && p.proj.gp > 18)
    flag("MED", "scoring", p.name + " projected for " + p.proj.gp + " games");
});

/* ----------------------------------------------- 3. replacement / ranking */
["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
  var list = board.byPos[pos], r = board.replacement[pos];
  if (!list) return;
  if (r.rank > list.length)
    flag("HIGH", "replacement", pos + " replacement rank " + r.rank +
      " exceeds the " + list.length + " players on the board — VOR is measured against the worst one");
  var neg = list.filter(function (p) { return p.vor < 0; }).length;
  if (neg / list.length > 0.75)
    flag("LOW", "replacement", pos + ": " + neg + " of " + list.length + " have negative VOR");
});

/* --------------------------------------------------------- 4. survival */
[1, 90, 180].forEach(function (pick) {
  D.players.slice(0, 60).forEach(function (p) {
    var s = E.survival(p, pick);
    if (!isFinite(s) || s < 0 || s > 1)
      flag("HIGH", "survival", p.name + " at pick " + pick + " gives " + s);
  });
});
var noSd = D.players.filter(function (p) { return !p.adp_sd; }).length;
if (noSd) flag("MED", "survival", noSd + " players have no ADP standard deviation");

/* ------------------------------------------------------------ 5. tiers */
["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
  var l = board.byPos[pos];
  var tiers = {};
  l.forEach(function (p) { tiers[p.tier] = (tiers[p.tier] || 0) + 1; });
  var singles = Object.keys(tiers).filter(function (t) { return tiers[t] === 1; });
  var biggest = Math.max.apply(null, Object.keys(tiers).map(function (t) { return tiers[t]; }));
  if (singles.length > 3)
    flag("MED", "tiers", pos + " has " + singles.length + " single-player tiers");
  if (biggest > l.length * 0.6)
    flag("MED", "tiers", pos + "'s biggest tier holds " + biggest + " of " + l.length +
      " — the tiering is not separating them");
});

/* ------------------------------------- 6. composite at the edges of a draft */
var ctx = {
  rules: rules, round: 1, rounds: 15,
  need: E.positionalNeed([], rules), byeCounts: {}, byeTolerance: 3,
  defFloorRound: 7, kFloorRound: 14, vona: null, runs: {},
  replacement: board.replacement, currentPick: 1, nextPick: 14, strategy: {}
};
board.players.forEach(function (p) {
  var c = E.composite(p, ctx);
  if (!isFinite(c.score)) flag("HIGH", "composite", p.name + " scores " + c.score);
});

// A full roster must not still be recommending that position.
var full = board.byPos.QB.slice(0, 2).concat(board.byPos.K.slice(0, 1),
                                             board.byPos.DEF.slice(0, 1));
var ctxFull = Object.assign({}, ctx, { need: E.positionalNeed(full, rules), round: 10 });
["QB", "K", "DEF"].forEach(function (pos) {
  var top = board.byPos[pos][3];
  if (top && !E.composite(top, ctxFull).blocked)
    flag("HIGH", "caps", "a " + pos + " is still unblocked with the position full");
});

/* ------------------------------------------- 7. the two ADP sources agreeing */
var splits = D.players.filter(function (p) { return p.adpResid != null; })
  .map(function (p) { return { n: p.name, d: p.adpResid }; })
  .sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
if (splits.length) {
  // Raw differences drift with depth, so this checks the de-drifted residual.
  // A median far from zero would mean the correction itself has failed.
  var med = splits.map(function (x) { return x.d; }).sort(function (a, b) { return a - b; });
  var m = med[Math.floor(med.length / 2)];
  if (Math.abs(m) > 3)
    flag("HIGH", "adp", "median ADP residual is " + m.toFixed(1) +
      ", so the de-drift correction is not centered");
  splits.filter(function (x) { return Math.abs(x.d) > 70; }).forEach(function (x) {
    flag("LOW", "adp", x.n + " residual " + Math.round(x.d) +
      " — extreme even after de-drifting; worth eyeballing");
  });
}

/* ---------------------------------------------------------------- report */
var order = { HIGH: 0, MED: 1, LOW: 2, ok: 3 };
findings.sort(function (a, b) { return order[a.sev] - order[b.sev]; });
var counts = {};
findings.forEach(function (f) { counts[f.sev] = (counts[f.sev] || 0) + 1; });

console.log("\nAUDIT — " + (counts.HIGH || 0) + " high, " + (counts.MED || 0) +
            " medium, " + (counts.LOW || 0) + " low\n");
findings.forEach(function (f) {
  if (f.sev === "ok") return;
  console.log("  [" + f.sev.padEnd(4) + "] " + f.area.padEnd(12) + f.msg);
});
console.log();
process.exit(0);
