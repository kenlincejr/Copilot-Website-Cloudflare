/* node ff/tools/test-signals.js — invariants of the signal layer, asserted
   against the real committed artifacts rather than a fixture.

   These are the properties that, if they broke, would break quietly: a loader
   writing a key nobody declared, a z-score that never got centred, a crosswalk
   with two board players resolved onto one person, a board file that has
   quietly doubled in size. None of them throw. All of them are wrong. */

require("../data/players.js");
require("../assets/presets.js");
var E = require("../assets/engine.js");
var fs = require("fs"), path = require("path");

var D = globalThis.DRAFTLINE_DATA;
var pass = 0, fail = 0;
function ok(label, cond, detail) {
  (cond ? pass++ : fail++);
  console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  — " + detail : ""));
}

console.log("\n== The registry and the board agree ==");
var sig = (D.meta || {}).signals || {};
ok("the bake declared a signal registry", Object.keys(sig).length > 0,
   Object.keys(sig).length + " fields");

/* Keys the board carried before the signal layer existed. Anything on a player
   that is neither one of these nor declared in the registry is a loader typo
   that shipped — the failure where a field is written under a misspelt name,
   reaches nothing, and is never noticed because nothing throws. */
var KNOWN = ("name pos team bye adp adp_sd adp_rank proj projSource sleeperPPR " +
  "tag ceiling risk note source edge dst_tier depth depthPos injury injuryPart " +
  "sleeperTeam adp2 adpResid returner").split(" ");
var undeclared = {};
D.players.forEach(function (p) {
  Object.keys(p).forEach(function (k) {
    if (KNOWN.indexOf(k) >= 0 || sig[k]) return;
    if (/Z$/.test(k) && sig[k.slice(0, -1)]) return;      // the z of a declared field
    undeclared[k] = (undeclared[k] || 0) + 1;
  });
});
ok("every field on every player is either a board key or a declared signal",
   Object.keys(undeclared).length === 0, Object.keys(undeclared).join(", "));

Object.keys(sig).forEach(function (f) {
  var reg = sig[f];
  if (reg.refused) return;
  var have = D.players.filter(function (p) { return p[f] != null; }).length;
  ok(f + " reaches at least one player", have > 0 || f.indexOf("vel") === 0,
     have + " players");
});

console.log("\n== Centring ==");
/* A signal centred over its own coverage set has mean zero. If it does not, the
   z-scores are measuring the centring rather than the player — and because
   every downstream guard is `!= null` rather than truthy, a miscentred signal
   is applied to everyone rather than nobody. */
Object.keys(sig).forEach(function (f) {
  var zf = sig[f].zfield;
  if (!zf || sig[f].refused) return;
  var zs = D.players.map(function (p) { return p[zf]; })
                    .filter(function (v) { return v != null; });
  if (!zs.length) return;
  var mean = zs.reduce(function (a, c) { return a + c; }, 0) / zs.length;
  var max = Math.max.apply(null, zs.map(Math.abs));
  ok(zf + " is centred", Math.abs(mean) < 0.10, "mean " + mean.toFixed(3));
  ok(zf + " respects the ±3 clip", max <= 3.01, "max |z| " + max.toFixed(2));
  ok(zf + " count matches the registry",
     sig[f].n == null || sig[f].n === zs.length, sig[f].n + " declared, " + zs.length + " found");
});

console.log("\n== Absent is not zero ==");
/* The distinction the whole layer rests on. A player with no data must carry no
   key, so the engine's null guards can tell "we do not know" from "average" —
   they are different claims and only one of them should move a score. */
var zeroFilled = 0;
D.players.forEach(function (p) {
  if (p.wopr === undefined && p.woprZ === 0) zeroFilled++;
});
ok("no player was zero-filled for a signal he has no data for", zeroFilled === 0,
   zeroFilled + " zero-filled");

var rookieNoUsage = D.players.filter(function (p) {
  return p.draftRound != null && p.wopr != null;
});
ok("a 2026 rookie carries no 2025 usage", rookieNoUsage.length === 0,
   rookieNoUsage.map(function (p) { return p.name; }).slice(0, 4).join(", "));

console.log("\n== Provenance ==");
Object.keys(sig).forEach(function (f) {
  var reg = sig[f];
  ok(f + " names its source", !!reg.source, reg.source || "MISSING");
  if (reg.asof) {
    ok(f + " has a parseable, non-future as-of",
       /^\d{4}-\d{2}-\d{2}$/.test(reg.asof) && new Date(reg.asof + "T00:00:00Z") <= new Date(),
       reg.asof);
  }
});

console.log("\n== The crosswalk ==");
var xw = null;
try { xw = require("./crosswalk.json"); } catch (e) { /* optional */ }
ok("crosswalk.json parses", !!xw);
if (xw) {
  var ids = {}, dupes = [];
  Object.keys(xw.players).forEach(function (k) {
    var g = xw.players[k].gsis_id;
    if (!g) return;
    if (ids[g]) dupes.push(ids[g] + " / " + k);
    ids[g] = k;
  });
  ok("no two board players resolve to one person", dupes.length === 0, dupes.join(", "));
  ok("position is in every key", Object.keys(xw.players).every(function (k) {
    return /\|(QB|RB|WR|TE|K|DEF)$/.test(k); }));
  var skill = D.players.filter(function (p) {
    return ["QB", "RB", "WR", "TE"].indexOf(p.pos) >= 0; }).length;
  ok("at least 95% of skill players resolved to ids",
     xw.meta.resolved >= 0.95 * skill, xw.meta.resolved + " of " + skill);
}

console.log("\n== Signals never touch the projection ==");
/* impact.js measures scoring-rule churn off pts and vorRank alone, so it is
   insulated from this whole layer by exactly one rule: signals move grades and
   price, never points. This is that rule, asserted directly. */
var rules = globalThis.DRAFTLINE_PRESETS.kinda_highlanders;
var STRIP = Object.keys(sig).concat(Object.keys(sig).map(function (f) { return f + "Z"; }));
var bare = D.players.map(function (p) {
  var q = {}; Object.keys(p).forEach(function (k) { if (STRIP.indexOf(k) < 0) q[k] = p[k]; });
  return q;
});
var withSig = E.buildBoard(D.players, rules), without = E.buildBoard(bare, rules);
var ptsMoved = 0, vorMoved = 0;
withSig.players.forEach(function (p) {
  var q = without.players.filter(function (x) { return x.name === p.name; })[0];
  if (!q) return;
  if (p.pts !== q.pts) ptsMoved++;
  if (p.vor !== q.vor) vorMoved++;
});
ok("no signal moved a single player's points", ptsMoved === 0, ptsMoved + " moved");
ok("nor his value over replacement", vorMoved === 0, vorMoved + " moved");

console.log("\n== Payload size ==");
var bytes = fs.statSync(path.join(__dirname, "..", "data", "players.js")).size;
ok("data/players.js is under 250 KB", bytes < 250 * 1024, Math.round(bytes / 1024) + " KB");

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
