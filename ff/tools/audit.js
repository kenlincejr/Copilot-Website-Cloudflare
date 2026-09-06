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

/* --------------------------------------------------------- 8. data freshness */
// `meta.built` is the date bake-players.py last ran; `meta.draft` is the real
// draft's date and time. A board baked days before kickoff is running on
// preseason news that has kept moving — the closer the bake is to draft night,
// the more of that movement (a role settling, a camp injury, a depth-chart
// change) actually made it into the projections. Three days is the line: a
// bake older than that on draft morning is a prompt to re-run
// tools/bake-players.py, not yet a reason to distrust the board.
(function checkFreshness() {
  var meta = D.meta || {};
  var builtStr = meta.built, draftStr = meta.draft;
  if (!builtStr || !draftStr) {
    flag("MED", "freshness", "meta.built or meta.draft is missing — cannot check the bake's age");
    return;
  }
  var draftDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(draftStr);
  var builtDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(builtStr);
  if (!draftDateMatch || !builtDateMatch) {
    flag("MED", "freshness", "meta.built (" + builtStr + ") or meta.draft (" + draftStr +
      ") is not in a YYYY-MM-DD-leading format the audit can parse");
    return;
  }
  // Compare at UTC midnight on the calendar dates alone — meta.draft carries a
  // local kickoff time and time zone (e.g. "19:00 CDT") that Date cannot parse
  // reliably across runtimes, and the three-day rule is about calendar days,
  // not hours.
  var built = Date.UTC(+builtDateMatch[1], +builtDateMatch[2] - 1, +builtDateMatch[3]);
  var draft = Date.UTC(+draftDateMatch[1], +draftDateMatch[2] - 1, +draftDateMatch[3]);
  var daysBefore = Math.round((draft - built) / 86400000);
  // meta.built and meta.baked are stamped from the same value by
  // bake-players.py, in the same run. If they ever disagree, something wrote
  // one without the other — a hand-edit, a partial bake — and the freshness
  // read above can no longer be trusted, no matter what daysBefore says.
  if (meta.baked && meta.baked !== builtStr) {
    flag("MED", "freshness", "meta.built (" + builtStr + ") and meta.baked (" + meta.baked +
      ") disagree — the bake did not stamp both fields together, so the freshness check above is not trustworthy");
  }
  if (daysBefore > 3) {
    flag("MED", "freshness", "the bake (meta.built: " + builtStr + ") is " + daysBefore +
      " days before the draft (meta.draft: " + draftStr + ") — more than the 3-day " +
      "freshness window; re-run tools/bake-players.py before draft night");
  } else if (daysBefore < 0) {
    flag("HIGH", "freshness", "meta.built (" + builtStr + ") is AFTER meta.draft (" + draftStr +
      ") — the draft date itself may be wrong, or the bake is stamped with the wrong year");
  } else {
    flag("ok", "freshness", "the bake is " + daysBefore + " day(s) before the draft, inside the 3-day window");
  }
})();

/* ------------------------------------ 9. signal coverage and centering */
/* The failure this is written against: a signal present on forty players
   silently outranking two hundred whose only sin is missing data. Coverage,
   centering and clipping are the three things that go wrong quietly, so each
   gets an assertion rather than a glance. */
(function () {
  var sig = (D.meta || {}).signals;
  if (!sig) { flag("MED", "signals", "no signal layer in this bake — meta.signals is absent"); return; }
  var names = Object.keys(sig);
  flag("ok", "signals", names.length + " signal fields declared");

  names.forEach(function (f) {
    var reg = sig[f];
    if (reg.refused) {
      flag("HIGH", "signals", f + " was REFUSED by the bake: " + reg.refused);
      return;
    }
    var have = D.players.filter(function (p) { return p[f] != null; }).length;
    if (reg.n != null && reg.n !== have) {
      flag("HIGH", "signals", f + " carries " + have + " values but its registry claims " +
        reg.n + " — the bake and its own metadata disagree");
    }
    // `sparse` fields have no coverage they are supposed to reach — an injury
    // designation exists only for injured players, so measuring its absence
    // against a floor would flag a perfectly healthy feed as broken.
    if (!reg.sparse && reg.eligible && reg.floor && have / reg.eligible < reg.floor) {
      flag("HIGH", "signals", f + " covers " + have + " of " + reg.eligible +
        " eligible (" + Math.round(100 * have / reg.eligible) + "%), below its " +
        Math.round(100 * reg.floor) + "% floor, and was applied anyway");
    }
    var zf = reg.zfield;
    if (!zf) return;
    var zs = D.players.map(function (p) { return p[zf]; })
                      .filter(function (v) { return v != null; });
    if (!zs.length) {
      if (have) flag("HIGH", "signals", f + " has values but no z-scores were written");
      return;
    }
    var mean = zs.reduce(function (a, c) { return a + c; }, 0) / zs.length;
    var sd = Math.sqrt(zs.reduce(function (a, c) { return a + (c - mean) * (c - mean); }, 0) / zs.length);
    // Centring is done per position, so the pooled mean is a sum of several
    // zero-mean groups and only approximately zero. A tenth of a standard
    // deviation is generous; anything past it means the centring did not centre.
    if (Math.abs(mean) > 0.10) {
      flag("HIGH", "signals", zf + " has mean " + mean.toFixed(3) +
        " — the centring did not centre");
    }
    if (Math.abs(sd - 1) > 0.25) {
      flag("MED", "signals", zf + " has sd " + sd.toFixed(2) +
        " — expected about 1 for a centred signal");
    }
    var over = zs.filter(function (v) { return Math.abs(v) > 3.01; }).length;
    if (over) flag("HIGH", "signals", zf + ": " + over + " value(s) past the ±3 clip");
    if (reg.clipped && reg.clipped > 0.10 * zs.length) {
      flag("MED", "signals", f + " clipped " + reg.clipped + " of " + zs.length +
        " — that is an outlier problem worth looking at, not a scaling choice");
    }
  });

  // The price term is the one signal that is a composite of others, so it gets
  // its own line: if it covers nobody, every market source failed at once.
  var priced = board.players.filter(function (p) { return p.priceZ != null; }).length;
  if (!priced) {
    flag("HIGH", "signals", "no player carries a price signal — every market source is missing");
  } else {
    var top = board.players.filter(function (p) { return p.priceZ != null; })
      .sort(function (a, b) { return Math.abs(b.priceGapPicks) - Math.abs(a.priceGapPicks); })
      .slice(0, 5)
      .map(function (p) { return p.name + " " + (p.priceGapPicks > 0 ? "+" : "") + p.priceGapPicks; });
    flag("ok", "signals", "price signal on " + priced + " players");
    flag("LOW", "signals", "largest price gaps, worth eyeballing: " + top.join(" · "));
  }
})();

/* ------------------------------------------- 10. per-signal freshness */
/* meta.built dates the bake as a whole. A signal carries its own as-of, which
   is the date the SOURCE published — not the date we downloaded it. The ECR
   mirror is the standing example: it can hand you a four-day-old scrape the
   instant you fetch it, and a signal that reports its download time as its
   freshness is lying about the only thing that matters here. */
(function () {
  var sig = (D.meta || {}).signals;
  if (!sig) return;
  var MAX_AGE = { ecr: 4, espn: 2, velocity: 1, vegas: 3 };
  var today = new Date();
  Object.keys(sig).forEach(function (f) {
    var reg = sig[f];
    if (reg.refused || !reg.asof) return;
    var d = new Date(reg.asof + "T00:00:00Z");
    if (isNaN(d)) { flag("MED", "freshness", f + " has an unparseable as-of: " + reg.asof); return; }
    var age = Math.floor((today - d) / 86400000);
    if (age < 0) {
      flag("HIGH", "freshness", f + " claims an as-of in the future (" + reg.asof +
        ") — that is a parse bug, not a fresh feed");
      return;
    }
    var cap = 3;
    Object.keys(MAX_AGE).forEach(function (k) { if (f.toLowerCase().indexOf(k) === 0) cap = MAX_AGE[k]; });
    if (age > 2 * cap) {
      flag("HIGH", "freshness", f + " is " + age + " days old (source as-of " + reg.asof +
        ", limit " + cap + ") — re-run tools/fetch-sources.py");
    } else if (age > cap) {
      flag("MED", "freshness", f + " is " + age + " days old (source as-of " + reg.asof + ")");
    }
  });
})();

/* --------------------------------------------- 11. crosswalk integrity */
/* Two board players resolving onto one person is the silent-sleeper-disappears
   failure, and it is invisible everywhere else. */
(function () {
  var xw;
  try { xw = require("./crosswalk.json"); }
  catch (e) { flag("MED", "crosswalk", "no crosswalk.json — signals joined by name only"); return; }
  var players = xw.players || {}, seen = {}, dupes = [];
  Object.keys(players).forEach(function (k) {
    var g = players[k].gsis_id;
    if (!g) return;
    if (seen[g]) dupes.push(seen[g] + " and " + k);
    seen[g] = k;
  });
  dupes.forEach(function (d) {
    flag("HIGH", "crosswalk", "two board players resolve to one person: " + d);
  });
  var weak = Object.keys(players).filter(function (k) { return players[k].tier === "name"; });
  if (weak.length) {
    flag("LOW", "crosswalk", weak.length + " player(s) matched on a bare name: " + weak.join(", "));
  }
  var xb = xw.meta && xw.meta.built, mb = (D.meta || {}).built;
  if (xb && mb && xb < mb) {
    flag("LOW", "crosswalk", "the crosswalk was built " + xb + " and the board " + mb +
      " — a roster move since then would not be reflected");
  }
  flag("ok", "crosswalk", (xw.meta && xw.meta.resolved) + " players resolved to stable ids");
})();

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
