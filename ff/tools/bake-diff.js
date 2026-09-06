/* node ff/tools/bake-diff.js <before.js> <after.js> — a real diff for
   ff/data/players.js. `git diff` on that file is useless: it is two lines and
   ~116 KB of minified JSON, so every bake looks like "the whole file changed"
   even when one player's ADP moved by a point. This loads both snapshots,
   builds a board from each the same way tools/audit.js does, and reports what
   actually moved: points, ADP (and the survival odds that ride on it), the
   side-data sets (injury/depth/projSource), the headline counts, and the
   top of the board in full.

   Usage: node bake-diff.js before.js after.js
   before.js/after.js are two copies of data/players.js — e.g. the committed
   version and a freshly re-baked one, or two arbitrary snapshots saved off
   for comparison. */

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var E = require("../assets/engine.js");
var P = require("../assets/presets.js");

var rules = P.kinda_highlanders;

/* Both files are `globalThis.DRAFTLINE_DATA = {...};` — plain scripts meant to
   be loaded one at a time into a browser or a require()'d global. Loading two
   of them into one process the way audit.js loads one would mean the second
   require() stomps the first's globalThis.DRAFTLINE_DATA before we can read
   it. So each file gets its own throwaway vm context instead: same effect as
   a browser <script> tag, but isolated, and nothing here touches the real
   globalThis. */
function loadData(file) {
  var src = fs.readFileSync(file, "utf8");
  var sandbox = {};
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: file });
  if (!sandbox.DRAFTLINE_DATA) throw new Error(file + " never set globalThis.DRAFTLINE_DATA");
  return sandbox.DRAFTLINE_DATA;
}

function loadBoard(file) {
  var data = loadData(file);
  return { data: data, board: E.buildBoard(data.players, rules) };
}

if (process.argv.length < 4) {
  console.error("usage: node bake-diff.js <before.js> <after.js>");
  process.exit(1);
}
var before = loadBoard(process.argv[2]);
var after = loadBoard(process.argv[3]);

function byName(board) {
  var m = {};
  board.players.forEach(function (p) { m[p.name] = p; });
  return m;
}
var beforeByName = byName(before.board);
var afterByName = byName(after.board);
var allNames = Object.keys(Object.assign({}, beforeByName, afterByName));

function fmt(n, d) { return n == null ? "none" : Number(n).toFixed(d == null ? 1 : d); }
function pct(n) { return n == null ? "none" : (n * 100).toFixed(0) + "%"; }
function tag(p) { return p ? p.name + " " + p.pos + " " + (p.team || "") : "(absent)"; }

/* ------------------------------------------------- 1. movers by points --- */
console.log("\n== 1. Movers by points (|delta pts| >= 1.0) ==");
var ptMovers = [];
allNames.forEach(function (n) {
  var b = beforeByName[n], a = afterByName[n];
  if (!b || !a) return;
  var delta = a.pts - b.pts;
  if (Math.abs(delta) >= 1.0) ptMovers.push({ b: b, a: a, delta: delta });
});
ptMovers.sort(function (x, y) { return Math.abs(y.delta) - Math.abs(x.delta); });
if (!ptMovers.length) console.log("  (no player's points moved by 1.0 or more)");
ptMovers.forEach(function (m) {
  var sign = m.delta >= 0 ? "+" : "";
  var flag = Math.abs(m.delta) > 5.0 ? "   >>> INVESTIGATE" : "";
  console.log("  " + tag(m.a) + " | pts " + fmt(m.b.pts) + " -> " + fmt(m.a.pts) +
              " (" + sign + fmt(m.delta) + ") | boardRank " + m.b.vorRank + " -> " + m.a.vorRank +
              " | tier " + m.b.tier + " -> " + m.a.tier + flag);
});

/* ----------------------------------------------------- 2. ADP movers ----- */
console.log("\n== 2. ADP movers ==");
var adpMovers = [];
allNames.forEach(function (n) {
  var b = beforeByName[n], a = afterByName[n];
  if (!b || !a) return;
  if (b.adp == null || a.adp == null) return;
  var delta = a.adp - b.adp;
  if (delta !== 0) adpMovers.push({ b: b, a: a, delta: delta });
});
adpMovers.sort(function (x, y) { return Math.abs(y.delta) - Math.abs(x.delta); });
if (!adpMovers.length) console.log("  (no player's ADP changed)");
adpMovers.forEach(function (m) {
  var sign = m.delta >= 0 ? "+" : "";
  console.log("  " + tag(m.a) + " | adp " + fmt(m.b.adp) + " -> " + fmt(m.a.adp) +
              " (" + sign + fmt(m.delta) + ")" +
              " | adp_sd " + fmt(m.b.adp_sd) + " -> " + fmt(m.a.adp_sd));
  [11, 14].forEach(function (pick) {
    var sb = E.survival(m.b, pick), sa = E.survival(m.a, pick);
    console.log("      survival@" + pick + " " + pct(sb) + " -> " + pct(sa));
  });
});

/* --------------------------------------------------- 3. set changes ------ */
console.log("\n== 3. Set changes ==");
var any3 = false;
allNames.forEach(function (n) {
  var b = beforeByName[n], a = afterByName[n];
  if (!b && a) { console.log("  ADDED to the board: " + tag(a)); any3 = true; return; }
  if (b && !a) { console.log("  DROPPED from the board: " + tag(b)); any3 = true; return; }
  if (!b || !a) return;
  if ((b.injury || null) !== (a.injury || null)) {
    console.log("  " + tag(a) + " | injury " + (b.injury || "none") + " -> " + (a.injury || "none"));
    any3 = true;
  }
  if ((b.depth || null) !== (a.depth || null) || (b.depthPos || null) !== (a.depthPos || null)) {
    console.log("  " + tag(a) + " | depth " + (b.depthPos || "-") + (b.depth != null ? b.depth : "") +
                " -> " + (a.depthPos || "-") + (a.depth != null ? a.depth : ""));
    any3 = true;
  }
  if ((b.projSource || null) !== (a.projSource || null)) {
    var bug = a.projSource === "none" ? "   >>> BUG (fell to \"none\")" : "";
    console.log("  " + tag(a) + " | projSource " + (b.projSource || "none") + " -> " +
                (a.projSource || "none") + bug);
    any3 = true;
  }
});
if (!any3) console.log("  (no injury/depth/projSource changes, no board additions or drops)");

/* ------------------------------------------------ 6. signal movers ------- */
/* Whether a re-bake actually changed anything, per signal. Without this a
   refetch that quietly returned yesterday's file looks exactly like one that
   worked. */
console.log("\n== 6. Signal movers (|delta z| >= 0.5) ==");
(function () {
  var sb = (before.data.meta || {}).signals || {};
  var sa = (after.data.meta || {}).signals || {};
  var fields = Object.keys(sa).filter(function (f) { return sa[f].zfield; });
  if (!fields.length) { console.log("  (no signal layer in these bakes)"); return; }
  var pb = {}, any = false;
  before.data.players.forEach(function (p) { pb[p.name] = p; });
  fields.forEach(function (f) {
    var zf = sa[f].zfield, rows = [];
    after.data.players.forEach(function (p) {
      var q = pb[p.name];
      if (!q) return;
      var a = p[zf], b = q[zf];
      if (a == null && b == null) return;
      var d = (a || 0) - (b || 0);
      if (Math.abs(d) >= 0.5) rows.push({ n: p.name, d: d, a: a, b: b });
    });
    if (!rows.length) return;
    any = true;
    rows.sort(function (x, y) { return Math.abs(y.d) - Math.abs(x.d); });
    console.log("  " + f + ": " + rows.length + " moved");
    rows.slice(0, 15).forEach(function (r) {
      console.log("    " + r.n.padEnd(24) +
        (r.b == null ? "  —  " : String(r.b).padStart(6)) + " -> " +
        (r.a == null ? "  —  " : String(r.a).padStart(6)) +
        "   (" + (r.d > 0 ? "+" : "") + r.d.toFixed(2) + ")");
    });
  });
  if (!any) console.log("  (no signal moved by half a standard deviation)");
})();

/* ------------------------------- 7. signal coverage and provenance ------- */
/* A signal that was present on Sunday and refused on Monday is the single most
   important line this tool can print, and until now it printed nothing at all. */
console.log("\n== 7. Signal coverage and provenance ==");
(function () {
  var sb = (before.data.meta || {}).signals || {};
  var sa = (after.data.meta || {}).signals || {};
  var names = Object.keys(sa).concat(Object.keys(sb).filter(function (f) { return !sa[f]; }));
  if (!names.length) { console.log("  (no signal layer in these bakes)"); return; }
  var said = false;
  names.sort().forEach(function (f) {
    var a = sa[f], b = sb[f];
    if (!a) { console.log("  " + f.padEnd(14) + "GONE — present before, absent now"); said = true; return; }
    if (!b) { console.log("  " + f.padEnd(14) + "NEW"); said = true; return; }
    if (!!a.refused !== !!b.refused) {
      console.log("  " + f.padEnd(14) + (a.refused ? "NOW REFUSED: " + a.refused
                                                   : "no longer refused (was: " + b.refused + ")"));
      said = true;
    }
    if (a.n !== b.n) { console.log("  " + f.padEnd(14) + "coverage " + b.n + " -> " + a.n); said = true; }
    if (a.asof !== b.asof) { console.log("  " + f.padEnd(14) + "as-of " + b.asof + " -> " + a.asof); said = true; }
  });
  if (!said) console.log("  (every signal has the same coverage, freshness and verdict)");
})();

/* ---------------------------------------------- 4. headline counts ------- */
console.log("\n== 4. Headline counts (before | after) ==");
function headline(x) {
  var d = x.data, meta = d.meta || {};
  return {
    players: d.players.length,
    matched: meta.proj_matched != null ? meta.proj_matched : "?",
    derived: meta.proj_derived != null ? meta.proj_derived : "?"
  };
}
var hb = headline(before), ha = headline(after);
console.log("  players:            " + hb.players + " | " + ha.players);
console.log("  sleeper-matched:    " + hb.matched + " | " + ha.matched);
console.log("  modeled/none:       " + hb.derived + " | " + ha.derived);

/* -------------------------------------------- 5. top-24 board order ------ */
console.log("\n== 5. Top-24 board order, before vs after ==");
var topB = before.board.players.slice(0, 24);
var topA = after.board.players.slice(0, 24);
console.log("  rk  before                              after");
for (var i = 0; i < Math.max(topB.length, topA.length); i++) {
  var pb = topB[i], pa = topA[i];
  var lb = pb ? tag(pb) : "";
  var la = pa ? tag(pa) : "";
  var changed = !pb || !pa || pb.name !== pa.name;
  console.log("  " + String(i + 1).padStart(2) + "  " + lb.padEnd(36) + " " + la +
              (changed ? "   <-- changed" : ""));
}
console.log();
