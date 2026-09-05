/* node ff/tools/trace-suggestions.js [--style zero_rb] [--seed 11] [--out DIR]
                                      [--custom '{"posBias":{"TE":1.3}}'] [--brief]

   Round-by-round trace of the suggestion pipeline, for pressure-testing it.

   Walks a seeded practice draft from the user's seat (Kinda Highlanders, slot
   11, Drake Maye kept in round 5) with the modeled room drafting the other
   eleven teams, and at every one of the user's picks prints:

     - the roster as the engine sees it (starting slots, bench, byes)
     - the top eight candidates by composite, with EVERY term of the score
       broken out (marginal, value, vona, bias, ceiling, risk, bye, bonus,
       blocked), plus the inputs those terms were fed (tier and tier-left,
       ADP, survival to the pick and to the one after, injury, depth chart,
       grade source, 7-day trend)
     - the three recommendation cards as renderRecs() would choose them
     - the eight names the on-deck brief is allowed to name
     - the literal briefQuestion() payload, written to a file per pick

   Then takes the board's #1 as the user's pick and carries on. The point is
   not the roster it ends with; it is that every number the app could have
   used at each decision is on the page next to the number it produced, so a
   reviewer can say which inputs reached the decision and which did not.

   Reuses the sandbox in test-app.js unmodified: that file is read as text,
   cut at its fixtures marker, and compiled with loadApp exported. Nothing in
   test-app.js or app.js is edited. */
"use strict";

var fs = require("fs");
var path = require("path");
var Module = require("module");

var args = process.argv.slice(2);
function arg(name, dflt) {
  var i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] != null ? args[i + 1] : dflt;
}
var STYLE = arg("style", "balanced");
var SEED = parseInt(arg("seed", "11"), 10);
var OUT = arg("out", path.join(__dirname, "traces"));
var CUSTOM = arg("custom", null);
var QUIET = args.indexOf("--quiet") >= 0;

// ---- borrow loadApp() from test-app.js without running its suites ----------
var harnessPath = path.join(__dirname, "test-app.js");
var harnessSrc = fs.readFileSync(harnessPath, "utf8");
var cut = harnessSrc.indexOf("/* ------------------------------------------------------------- fixtures ---");
if (cut < 0) throw new Error("test-app.js has lost its fixtures marker; re-check before trusting this trace");
var m = new Module(harnessPath, module);
m.filename = harnessPath;
m.paths = Module._nodeModulePaths(path.dirname(harnessPath));
m._compile(harnessSrc.slice(0, cut) + "\nmodule.exports = { loadApp: loadApp };\n", harnessPath);
var loadApp = m.exports.loadApp;

var DATA = globalThis.DRAFTLINE_DATA;
var PRESETS = globalThis.DRAFTLINE_PRESETS;
var STRATS = globalThis.DRAFTLINE_STRATEGIES;

// ---- the league --------------------------------------------------------------
function league(overrides) {
  var base = {
    preset: "kinda_highlanders",
    rules: JSON.parse(JSON.stringify(PRESETS.kinda_highlanders)),
    mode: "live",
    teams: 12, slot: 11, rounds: 15,
    keepers: [{ name: "Drake Maye", round: 5 }],
    byeTolerance: 3, defFloorRound: 7,
    style: STYLE,
    styleCustom: CUSTOM ? JSON.parse(CUSTOM) : null
  };
  return Object.assign(base, overrides || {});
}

// Seed the sandbox's Math.random so the modeled room is reproducible.
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
  var M = vm.runInContext("Math", api._sandbox);
  M.random = mulberry32(seed);
}

// ---- formatting --------------------------------------------------------------
function n(x, d) { return x == null || isNaN(x) ? "-" : (+x).toFixed(d == null ? 0 : d); }
function pad(s, w) { s = String(s); return s.length >= w ? s : s + new Array(w - s.length + 1).join(" "); }
function lpad(s, w) { s = String(s); return s.length >= w ? s : new Array(w - s.length + 1).join(" ") + s; }
var lines = [];
function out(s) { lines.push(s); if (!QUIET) console.log(s); }

function candidateRow(p, A) {
  var d = p.compDetail || {};
  return [
    pad(p.name, 24), pad(p.pos, 3), lpad(n(p.comp), 5),
    "| marg " + lpad(n(d.marginal), 4), "val " + lpad(n(d.value), 4), "vona " + lpad(n(d.vona), 3),
    "bias " + lpad(n(d.bias, 2), 4), "mult " + lpad(n(d.mult, 2), 4),
    "ceil " + lpad(n(d.ceilingAdj, 1), 5), "risk " + lpad(n(d.riskAdj, 1), 5),
    "bye " + lpad(n(d.byePenalty), 2), "bon " + lpad(n(d.bonus), 3),
    d.blocked ? "BLOCKED(" + d.blocked + ")" : "",
    "| pts " + lpad(n(p.pts), 3), "vor " + lpad(n(p.vor), 4),
    "T" + p.tier + "(" + p.tierLeft + ")",
    "adp " + lpad(n(p.adp, 1), 5) + "±" + n(p.adp_sd, 1),
    "surv " + lpad(n(p.surv * 100), 3) + "%/" + lpad(n(p.survNext * 100), 3) + "%",
    "grade " + n(p.ceiling) + "/" + n(p.risk) + "(" + (p.gradeSource || "?").slice(0, 3) + ")",
    "bye" + p.bye,
    p.depthPos ? "dc " + p.depthPos + p.depth : "",
    p.injury ? "INJ " + p.injury : "",
    p.ytrend != null ? "7d " + (p.ytrend > 0 ? "+" : "") + p.ytrend : "",
    p.tag ? "#" + p.tag : ""
  ].filter(Boolean).join(" ");
}

function dumpPick(api, A, label) {
  var S = api.getState();
  out("\n" + new Array(100).join("=") + "\n" + label +
      "  (pick " + A.cur + ", round " + A.ctx.round + ", my next " + A.myNext +
      (A.myAfter ? ", then " + A.myAfter : ", last pick") + ")");

  // Roster as the engine sees it.
  var slots = api.startingSlots();
  out("ROSTER: " + slots.map(function (s) {
    return s.label + "=" + (s.player ? s.player.name + "(" + n(s.player.pts) + ",b" + s.player.bye + ")" : s.blocked ? "locked>r" + s.floor : "EMPTY");
  }).join("  "));
  var bench = (A.roster.bench || []).map(function (p) { return p.name + "(" + p.pos + ")"; });
  out("BENCH:  " + (bench.join(", ") || "none") +
      "   BYES(starters): " + JSON.stringify(A.byeCounts) +
      "   NEED: " + Object.keys(A.need).map(function (k) { return k + ":" + n(A.need[k].short, 1); }).join(" "));
  var runs = Object.keys(A.runInfo.runs || {});
  out("STYLE: " + JSON.stringify(api.activeKnobs()) + "   RUNS: " + (runs.join(",") || "none") +
      "   last8: " + JSON.stringify(A.runInfo.counts));

  // Top eight by composite, unfiltered — what the board itself thinks.
  var pool = A.avail.filter(function (p) { return !(p.compDetail && p.compDetail.blocked); })
                    .sort(function (a, b) { return b.comp - a.comp; });
  out("\nTOP 8 BY COMPOSITE (board order):");
  pool.slice(0, 8).forEach(function (p, i) { out("  " + (i + 1) + ". " + candidateRow(p, A)); });

  // What the three cards would show (renderRecs filter: surv >= 0.15 while waiting).
  var waiting = A.myNext > A.cur;
  var realistic = waiting ? pool.filter(function (p) { return p.surv >= 0.15; }) : pool;
  // Ask the app which three it would show rather than re-deriving it here. This
  // line used to be its own top-three and therefore disagreed with the app in
  // exactly the states worth tracing.
  out("CARDS (renderRecs): " + api.recCards(realistic).map(function (p) { return p.name; }).join(" | "));

  // What the brief may name.
  var bc = api.briefCandidates(waiting, 8);
  out("BRIEF MAY NAME:     " + bc.map(function (p) {
    return p.name + (p.briefCoverage ? "[cover " + p.briefCoverage + "]" : "") + (p.briefPastAdp ? "[pastADP]" : "");
  }).join(" | "));

  // Best blocked player, so a floor suppressing real value is visible.
  var blockedBest = A.avail.filter(function (p) { return p.compDetail && p.compDetail.blocked; })
    .sort(function (a, b) { return (b.comp + 1000) - (a.comp + 1000); })[0];
  if (blockedBest) {
    out("BEST BLOCKED:       " + blockedBest.name + " (" + blockedBest.pos + ") would score " +
        n(blockedBest.comp + 1000) + " unblocked vs board #1 " + n(pool[0].comp) +
        " — " + blockedBest.compDetail.blocked);
  }

  // Fallen players: anyone 12+ picks past ADP still on the board, and what
  // the score did about it (nothing but a sentence, today).
  var fallen = A.avail.filter(function (p) { return p.adp && A.cur - p.adp >= 12 && !(p.compDetail && p.compDetail.blocked); })
    .sort(function (a, b) { return (A.cur - a.adp) - (A.cur - b.adp); }).reverse().slice(0, 4);
  if (fallen.length) {
    out("FALLEN PAST ADP:    " + fallen.map(function (p) {
      var rank = pool.indexOf(p) + 1;
      return p.name + " adp " + p.adp + " (" + n(A.cur - p.adp) + " picks past) board #" + rank +
        " comp " + n(p.comp);
    }).join(" | "));
  }

  // The literal payload.
  var payload = api.briefQuestion();
  var fn = path.join(OUT, STYLE + "-seed" + SEED + "-pick" + A.myNext + ".txt");
  fs.writeFileSync(fn, payload);
  out("PAYLOAD: " + payload.length + " chars → " + path.relative(process.cwd(), fn));
  return { pool: pool, payload: payload, cards: realistic.slice(0, 3), brief: bc };
}

// ---- the walk ------------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
var api = loadApp(league(), [], { draftStarted: true, practice: true });
seedSandbox(api, SEED);
api.render();

out("TRACE  style=" + STYLE + " seed=" + SEED + " custom=" + (CUSTOM || "none") +
    "  data built " + DATA.meta.built + "  players " + DATA.players.length);
out("STYLE BLOCK SENT TO CLAUDE: " + JSON.stringify(api.styleBlock()));

var picked = [];
var guard = 0;
while (guard++ < 20) {
  var A = api.getAnalysis();
  if (!A.myNext) break;
  // Two views per turn where they differ: on deck (lead 2) and on the clock.
  if (A.myNext - A.cur > 2) {
    // Advance the room to two picks before mine, so the on-deck brief state
    // is what gets dumped; then again to the clock.
    var target = A.myNext - 2;
    var g2 = 0;
    while (api.currentPick() < target && g2++ < 40) {
      api.simulateToMyPick();     // runs to my pick; too far. Undo back to lead 2.
      break;
    }
    // simulateToMyPick runs all the way to my pick, so rewind two picks.
    var S = api.getState();
    var extra = api.currentPick() - target;
    for (var u = 0; u < extra; u++) api.undo();
    api.render();
    A = api.getAnalysis();
    dumpPick(api, A, "ON DECK for " + A.myNext);
    // Re-do the two rewound picks by simulating again.
    api.simulateToMyPick();
    api.render();
    A = api.getAnalysis();
  } else if (A.myNext > A.cur) {
    api.simulateToMyPick();
    api.render();
    A = api.getAnalysis();
  }
  var r = dumpPick(api, A, "ON THE CLOCK at " + A.myNext);
  var take = r.pool[0];
  if (!take) break;
  picked.push({ pick: A.myNext, round: A.ctx.round, name: take.name, pos: take.pos, comp: take.comp });
  api.record(take.name, true);
  api.render();
}

out("\n" + new Array(100).join("=") + "\nMY DRAFT (board #1 every time):");
picked.forEach(function (p) { out("  r" + lpad(p.round, 2) + " pick " + lpad(p.pick, 3) + "  " + pad(p.pos, 3) + " " + p.name + "  comp " + n(p.comp)); });
var finalA = api.getAnalysis();
out("FINAL LINEUP: " + finalA.roster.slots.map(function (s) { return s.pos + "=" + (s.player ? s.player.name : "EMPTY"); }).join("  "));
out("FINAL BENCH:  " + finalA.roster.bench.map(function (p) { return p.pos + " " + p.name; }).join(", "));
out("BYE STACKS:   " + JSON.stringify(finalA.byeCounts));

var summary = path.join(OUT, STYLE + "-seed" + SEED + "-trace.txt");
fs.writeFileSync(summary, lines.join("\n"));
console.log("\nwrote " + path.relative(process.cwd(), summary));
