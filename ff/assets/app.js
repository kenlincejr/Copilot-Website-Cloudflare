/* DRAFTLINE app — draft room UI. Reads engine.js for every number it shows. */
(function () {
"use strict";

var E = DRAFTLINE_ENGINE, PRESETS = DRAFTLINE_PRESETS, DATA = DRAFTLINE_DATA, AUTH = DRAFTLINE_AUTH;
var STRATS = globalThis.DRAFTLINE_STRATEGIES, KNOBS = globalThis.DRAFTLINE_KNOB_SPEC;
var $  = function (s) { return document.querySelector(s); };
var $$ = function (s, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(s));
};
var esc = function (s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};
var n0 = function (v) { return (v >= 0 ? "" : "-") + Math.abs(Math.round(v)); };

/* ---------------------------------------------------------------- session */

var me = AUTH.current();
if (!me) { location.href = "index.html"; return; }
$("#whoami").textContent = me.name;

var KEY_STATE  = "draftline.state." + me.id;
var KEY_CLAUDE = "draftline.claude." + me.id;

var BY_NAME = {};
DATA.players.forEach(function (p) { BY_NAME[p.name] = p; });

/* ------------------------------------------------------------------ state */

function defaultLeague() {
  return {
    preset: "kinda_highlanders",
    rules: JSON.parse(JSON.stringify(PRESETS.kinda_highlanders)),
    teams: 12, slot: 11, rounds: 15,
    keepers: [{ name: "Drake Maye", round: 5, slot: 11 }],
    byeTolerance: 3, defFloorRound: 7
  };
}

var S = load() || { league: defaultLeague(), picks: [] };

function load() {
  try { var raw = localStorage.getItem(KEY_STATE); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(KEY_STATE, JSON.stringify({ league: S.league, picks: S.picks })); }
  catch (e) { flash("#dataMsg", "Couldn't autosave — local storage is full or blocked.", true); }
}

/* --------------------------------------------------------- draft plumbing */

/** Display name for a draft slot: the league's own name if we have it. */
function teamLabel(slot, short) {
  if (slot === S.league.slot) return "you";
  var n = (S.league.teamNames || [])[slot - 1];
  if (n && n.trim()) return short && n.length > 14 ? n.slice(0, 13) + "\u2026" : n;
  return "team " + slot;
}

function ownerOfPick(pick) {
  var t = S.league.teams, r = Math.ceil(pick / t), idx = pick - (r - 1) * t;
  return { round: r, slot: (r % 2 === 1) ? idx : (t - idx + 1) };
}
function pickNumberFor(round, slot) {
  var t = S.league.teams;
  var idx = (round % 2 === 1) ? slot : (t - slot + 1);
  return (round - 1) * t + idx;
}
function keeperAt(pick) {
  var o = ownerOfPick(pick);
  return (S.league.keepers || []).find(function (k) {
    return k.round === o.round && (k.slot || S.league.slot) === o.slot;
  });
}
/** Keepers occupy their slot automatically as the draft reaches them. */
function syncKeepers() {
  var guard = 0;
  while (guard++ < 400) {
    var next = S.picks.length + 1;
    if (next > S.league.teams * S.league.rounds) break;
    var k = keeperAt(next);
    if (!k) break;
    var o = ownerOfPick(next);
    S.picks.push({ pick: next, name: k.name, slot: o.slot,
                   mine: o.slot === S.league.slot, keeper: true });
  }
}
function currentPick() { return S.picks.length + 1; }
function myPickNumbers() {
  var out = [];
  for (var r = 1; r <= S.league.rounds; r++) out.push(pickNumberFor(r, S.league.slot));
  return out;
}
/**
 * My remaining picks from `from` onward — excluding any round a keeper has
 * already spent. Leaving those in silently shortens the gap the engine thinks
 * it is drafting across: with a round-5 keeper, pick 38's real wait is 24 picks
 * to 62, not 21 to a slot that is already gone.
 */
function myUpcoming(from) {
  return myPickNumbers().filter(function (p) { return p >= from && !keeperAt(p); });
}

function draftedNames() {
  var set = {};
  S.picks.forEach(function (p) { set[p.name] = true; });
  return set;
}

/**
 * `name` may be null: a pick you know happened but not who went. The slot is
 * consumed either way, and that matters more than the name — refusing to record
 * it would leave the board permanently behind the real draft, which is the whole
 * failure this is here to prevent.
 */
function record(name, mine, quiet) {
  if (name !== null && !BY_NAME[name]) return;
  var pick = currentPick();
  if (pick > S.league.teams * S.league.rounds) return;
  var o = ownerOfPick(pick);
  S.picks.push({ pick: pick, name: name,
                 slot: mine ? S.league.slot : o.slot, mine: !!mine,
                 unknown: name === null });
  syncKeepers();
  bumpLivePick();
  S.pickStartedAt = Date.now();
  save();
  if (!quiet) render();
}

/**
 * The live-pick field is a checkpoint the user types, not a running counter. Once
 * our own count passes it, carry it forward — otherwise recording your own pick
 * would immediately read as "you have recorded more picks than have happened".
 */
function bumpLivePick() {
  var box = $("#livePick"), live = parseInt(box.value, 10);
  if (live && currentPick() > live) box.value = currentPick();
}
function undo() {
  var popped = null, guard = 0;
  while (S.picks.length && guard++ < 50) {
    popped = S.picks.pop();
    if (!popped.keeper) break;
  }
  save(); syncKeepers(); render();
}

/* ------------------------------------------------------- derived analysis */

var STANDARD_BOARD = null;   // full-PPR comparison, computed once
function standardBoard() {
  if (!STANDARD_BOARD) {
    var b = E.buildBoard(DATA.players, PRESETS.ppr_standard);
    STANDARD_BOARD = {};
    b.players.forEach(function (p) { STANDARD_BOARD[p.name] = p; });
  }
  return STANDARD_BOARD;
}

function analyse() {
  var rules = S.league.rules;
  rules.teams = S.league.teams;
  var board = E.buildBoard(DATA.players, rules);
  var taken = draftedNames();
  var avail = board.players.filter(function (p) { return !taken[p.name]; });
  var byName = {}; board.players.forEach(function (p) { byName[p.name] = p; });

  var mine = S.picks.filter(function (p) { return p.mine; })
                    .map(function (p) { return byName[p.name]; })
                    .filter(Boolean);

  var cur = currentPick();
  var upcoming = myUpcoming(cur);
  var myNext = upcoming[0] || null;             // the pick I'm working toward
  var myAfter = upcoming[1] || null;            // the one after it — drives VONA
  var onClock = ownerOfPick(Math.min(cur, S.league.teams * S.league.rounds));

  var roster = E.assignRoster(mine, rules);
  var need = E.positionalNeed(mine, rules);
  var byeCounts = {}, byePos = {};
  roster.slots.forEach(function (s) {
    if (!s.player) return;
    var w = s.player.bye;
    byeCounts[w] = (byeCounts[w] || 0) + 1;
    (byePos[w] = byePos[w] || {})[s.player.pos] = (byePos[w][s.player.pos] || 0) + 1;
  });

  // Teams to stack (your quarterbacks) and to handcuff (your running backs).
  var stackTeams = {}, handcuffTeams = {};
  mine.forEach(function (p) {
    if (p.pos === "QB") stackTeams[p.team] = true;
    if (p.pos === "RB") handcuffTeams[p.team] = true;
  });

  var recent = S.picks.slice(-8).map(function (p) { return byName[p.name] || { pos: "?" }; });
  var runInfo = E.detectRuns(recent);

  var vona = myAfter ? E.expectedBestAvailable(avail, myAfter) : null;
  var round = myNext ? ownerOfPick(myNext).round : ownerOfPick(cur).round;

  var ctx = {
    rules: rules, round: round, rounds: S.league.rounds, need: need,
    byeCounts: byeCounts, byeTolerance: S.league.byeTolerance || 3,
    defFloorRound: S.league.defFloorRound || 7,
    kFloorRound: Math.max(1, S.league.rounds - 1),
    vona: vona, runs: runInfo.runs, replacement: board.replacement,
    currentPick: cur, nextPick: myAfter || cur,
    strategy: activeKnobs(), stackTeams: stackTeams, handcuffTeams: handcuffTeams
  };

  // Score everyone, not just the pool. Drafted players stay in the list struck
  // through, which is what makes the shape of a run visible — the gaps in the
  // ranking are themselves the information.
  var pickOf = {};
  S.picks.forEach(function (pk) { if (pk.name) pickOf[pk.name] = pk; });
  board.players.forEach(function (p) {
    var c = E.composite(p, ctx);
    p.comp = c.score; p.compDetail = c;
    p.surv = myNext ? E.survival(p, myNext) : 1;
    p.survNext = myAfter ? E.survival(p, myAfter) : 1;
    p.adpDelta = (p.adp || 200) - cur;
    p.takenBy = pickOf[p.name] || null;
  });

  return { board: board, avail: avail, all: board.players, byName: byName, mine: mine, roster: roster,
           byeCounts: byeCounts, byePos: byePos,
           need: need, ctx: ctx, cur: cur, myNext: myNext, myAfter: myAfter,
           onClock: onClock, runInfo: runInfo, upcoming: upcoming };
}

/* -------------------------------------------------------------- rendering */

var view = {
  pos: "ALL", sort: "composite", q: "", selected: null,
  showTaken: (function () {
    try { return localStorage.getItem("draftline.showTaken") !== "0"; } catch (e) { return true; }
  })()
};
var A = null;   // latest analysis

function render() {
  syncKeepers();
  A = analyse();

  var total = S.league.teams * S.league.rounds;
  var done = A.cur > total;
  $("#pickNo").textContent = done ? "done" : A.cur;
  $("#roundNo").textContent = done ? "" : "· round " + A.onClock.round;
  var mineNow = !done && A.onClock.slot === S.league.slot;
  var oc = $("#onClock");
  oc.textContent = done ? "draft complete" : (mineNow ? "YOU'RE UP" : teamLabel(A.onClock.slot, true));
  oc.className = "onclock" + (mineNow ? " me" : "");
  $("#nextPickInfo").innerHTML = A.myNext
    ? '<span class="dimtext">your next</span> <b>' + A.myNext + "</b>" +
      (A.myAfter ? ' <span class="dimtext">then</span> <b>' + A.myAfter + "</b>" +
        ' <span class="dimtext">(' + (A.myAfter - A.myNext) + " picks)</span>" : "")
    : '<span class="dimtext">no picks left</span>';

  renderStatus(); renderTicker();

  // Say out loud whose roster the next click fills. The assignment has always
  // followed the clock; it was just invisible.
  var onMe = A.onClock.slot === S.league.slot;
  $("#search").placeholder = A.cur > total
    ? "Draft complete"
    : onMe
      ? "Search \u2014 Enter drafts to YOU (you're on the clock)"
      : "Search \u2014 Enter puts him on " + teamLabel(A.onClock.slot) + ", Shift+Enter on yours";
  renderFilters(); renderList(); renderRecs(); renderRoster(); renderTurn(); renderBrief();
  renderSchedule(); renderLog(); renderRunBanner(); renderByeTracker();
  if (view.selected) renderDetail(view.selected);
}

/* --------------------------------------------------- draft status + sync */

/**
 * The board silently computes survival, VONA and the brief against whatever
 * pick number it thinks the draft is on. If the user misses a few opponent
 * picks, every one of those numbers is wrong and nothing says so. `livePick` is
 * the user's report of where the real draft actually is; the gap between that
 * and our own count is the only reliable drift signal available without a live
 * feed, so it gets the loudest element on the page.
 */
function drift() {
  var live = parseInt($("#livePick").value, 10);
  if (!live || live < 1) return null;
  return live - A.cur;                       // >0 = we are behind reality
}

function renderStatus() {
  var el = $("#statusBar"), total = S.league.teams * S.league.rounds;
  $("#btnStart").classList.toggle("hidden", S.picks.length > 0);

  if (A.cur > total) {
    el.className = "statusbar waiting";
    el.innerHTML = "<b>Draft complete.</b> <span class='grow'></span>" +
      "<span>15 rounds recorded. Export from Save / load if you want a copy.</span>";
    return;
  }

  var d = drift();
  if (d !== null && d !== 0) {
    var behind = d > 0;
    el.className = "statusbar drift";
    el.innerHTML =
      "<b>" + (behind ? "You're " + d + " pick" + (d === 1 ? "" : "s") + " behind the real draft"
                      : "You've recorded " + (-d) + " more pick" + (d === -1 ? "" : "s") + " than have happened") +
      "</b><span class='grow'></span>" +
      (behind
        ? "<span>Suggestions still count those players as available.</span>" +
          '<button class="btn btn-sm btn-primary" id="btnCatchup">Catch up ' + d +
            " pick" + (d === 1 ? "" : "s") + "</button>"
        : '<button class="btn btn-sm" id="btnUndoDrift">Undo ' + (-d) + "</button>");
    if (behind) $("#btnCatchup").onclick = openCatchup;
    else $("#btnUndoDrift").onclick = function () { for (var i = 0; i < -d; i++) undo(); };
    return;
  }

  var gap = A.myNext ? A.myNext - A.cur : null;
  if (gap === 0) {
    el.className = "statusbar up";
    el.innerHTML = "<b>You're on the clock — pick " + A.cur + "</b>" +
      "<span class='grow'></span><span>Enter takes a player off the board, " +
      "Shift+Enter drafts him to you.</span>";
  } else if (gap !== null && gap <= 3) {
    el.className = "statusbar soon";
    el.innerHTML = "<b>" + gap + " pick" + (gap === 1 ? "" : "s") + " until you're up</b>" +
      "<span class='grow'></span><span>Pick " + A.myNext + " of round " + A.ctx.round +
      (d === 0 ? " · in sync with the live draft" : "") + "</span>";
  } else {
    el.className = "statusbar waiting";
    el.innerHTML = "<span>Pick <b>" + A.cur + "</b> · team " + A.onClock.slot +
      " on the clock</span><span class='grow'></span>" +
      (A.myNext ? "<span>You pick at " + A.myNext + (gap ? " — " + gap + " away" : "") + "</span>" : "") +
      (d === 0 ? " <span class='dimtext'>· in sync</span>" : "");
  }
}

$("#livePick").addEventListener("input", renderStatus);
$("#btnStart").addEventListener("click", function () {
  S.startedAt = Date.now();
  S.pickStartedAt = Date.now();
  save();
  $("#livePick").value = 1;
  $("#search").focus(); render(); tickClock();
});

/* ------------------------------------------------------------- catch-up */

function openCatchup() {
  var d = drift(); if (!d || d < 1) return;
  var pool = A.avail.slice().sort(function (a, b) { return a.adp - b.adp; });
  var rows = [], used = {};
  for (var i = 0; i < d; i++) {
    var pk = A.cur + i, o = ownerOfPick(pk);
    if (pk > S.league.teams * S.league.rounds) break;
    var guess = pool.find(function (p) { return !used[p.name]; });
    if (guess) used[guess.name] = true;
    rows.push({ pick: pk, slot: o.slot, mine: o.slot === S.league.slot,
                guess: guess ? guess.name : "" });
  }
  $("#catchupSub").textContent = "Picks " + rows[0].pick + " to " + rows[rows.length - 1].pick +
    " happened while you weren't looking.";
  $("#catchupCount").textContent = rows.length + " picks";
  $("#catchupRows").innerHTML = rows.map(function (r, i) {
    return '<div class="catchup-row">' +
      '<span class="slotlbl">pick ' + r.pick + "<br>" +
        (r.mine ? '<span class="mine">you</span>' : teamLabel(r.slot, true)) + "</span>" +
      '<input type="text" list="allPlayers" data-cu="' + i + '" value="" placeholder="who went here?">' +
      '<button class="btn btn-sm btn-ghost" data-cuguess="' + i + '">' +
        (r.guess ? "ADP" : "—") + "</button>" +
    "</div>";
  }).join("");
  $("#allPlayers").innerHTML = A.avail.map(function (p) {
    return '<option value="' + esc(p.name) + '">';
  }).join("");

  $$("#catchupRows [data-cuguess]").forEach(function (b) {
    b.onclick = function () {
      var i = +b.dataset.cuguess;
      $('#catchupRows [data-cu="' + i + '"]').value = rows[i].guess;
    };
  });
  $("#catchupGuess").onclick = function () {
    rows.forEach(function (r, i) { $('#catchupRows [data-cu="' + i + '"]').value = r.guess; });
  };
  $("#catchupApply").onclick = function () {
    var named = 0, unknown = 0, bad = [];
    // In pick order, so each recorded name lands on the right team.
    rows.forEach(function (r, i) {
      var nm = $('#catchupRows [data-cu="' + i + '"]').value.trim();
      var ok = nm && BY_NAME[nm] && !draftedNames()[nm];
      if (nm && !ok) bad.push(nm);
      record(ok ? nm : null, r.mine, true);
      ok ? named++ : unknown++;
    });
    closeModal("#catchupModal");
    render();
    var msg = "Recorded " + rows.length + " picks — " + named + " by name" +
      (unknown ? ", " + unknown + " as unknown (the slot is spent, the player stays available)" : "") +
      (bad.length ? ". Not on the board or already drafted: " + bad.join(", ") : ".");
    banner(msg, bad.length > 0);
  };
  openModal("#catchupModal");
}
$("#catchupClose").addEventListener("click", function () { closeModal("#catchupModal"); });

/** A short-lived message under the status bar, for things worth reading once. */
function banner(msg, isWarn) {
  var el = document.createElement("div");
  el.className = "statusbar " + (isWarn ? "drift" : "soon");
  el.innerHTML = "<span>" + esc(msg) + "</span>";
  $("#statusBar").insertAdjacentElement("afterend", el);
  setTimeout(function () { el.remove(); }, 9000);
}

/* ------------------------------------------------- ticker and pick clock */

/**
 * Round, who is on the clock, who is on deck, and the last few names off the
 * board. The draft log in the right column is a record; this is the thing you
 * glance at without moving your eyes far.
 */
function renderTicker() {
  var el = $("#ticker"), total = S.league.teams * S.league.rounds;
  if (A.cur > total) { el.className = ""; el.innerHTML = ""; return; }

  var onDeckPick = A.cur + 1;
  var onDeck = onDeckPick <= total ? ownerOfPick(onDeckPick).slot : null;
  var recent = S.picks.slice(-5).reverse();

  function seg(k, v, mine) {
    return '<span class="seg' + (mine ? " me" : "") + '"><span class="k">' + k +
           '</span><span class="v">' + v + "</span></span>";
  }

  el.className = "ticker";
  el.innerHTML =
    seg("round", A.onClock.round + " of " + S.league.rounds) +
    '<span class="sep"></span>' +
    seg("on the clock", teamLabel(A.onClock.slot, true),
        A.onClock.slot === S.league.slot) +
    (onDeck ? seg("on deck", teamLabel(onDeck, true),
                  onDeck === S.league.slot) : "") +
    '<span class="sep"></span>' +
    seg("your pick", A.myNext ? "#" + A.myNext : "none left", true) +
    '<span class="sep"></span>' +
    '<span class="recent">' +
      (recent.length
        ? recent.map(function (pk) {
            var pl = BY_NAME[pk.name] || {};
            return '<span class="rp"><span class="mono">' + pk.pick + "</span> " +
              (pk.unknown ? "<i>unknown</i>"
                : '<span class="pos pos-' + (pl.pos || "K") + '">' + (pl.pos || "") + "</span> " +
                  esc(pk.name)) + "</span>";
          }).join("")
        : '<span class="rp dimtext">no picks recorded yet</span>') +
    "</span>";
}

/**
 * A countdown for the league's own pick clock. Nothing here talks to Yahoo, so
 * it is a stopwatch started by the last recorded pick, not a mirror of the real
 * timer — its job is to answer "roughly how long until I'm up", which is the
 * question you actually have while waiting.
 */
function pickSeconds() {
  var v = parseInt($("#pickSecs").value, 10);
  return v > 0 ? v : 0;
}
function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2);
}
function tickClock() {
  var out = $("#clockRead"), secs = pickSeconds();
  if (!secs || !A || !S.pickStartedAt) { out.textContent = ""; return; }
  var elapsed = (Date.now() - S.pickStartedAt) / 1000;
  var left = secs - elapsed;
  var gap = A.myNext ? A.myNext - A.cur : null;

  if (gap === 0) {
    out.innerHTML = '<b style="color:' + (left < 30 ? "var(--red)" : "var(--teal)") + '">' +
      mmss(left) + "</b>";
  } else if (gap) {
    // Time left on this pick, plus a full clock for each pick between.
    var eta = Math.max(0, left) + (gap - 1) * secs;
    out.innerHTML = '<span class="dimtext">you\u2019re up in ~</span> <b>' + mmss(eta) + "</b>";
  } else {
    out.textContent = "";
  }
}
setInterval(tickClock, 1000);
$("#pickSecs").addEventListener("input", function () {
  S.league.pickSeconds = pickSeconds();
  if (!S.pickStartedAt) S.pickStartedAt = Date.now();
  save(); tickClock();
});

/* ------------------------------------------------------- league rosters */

/** The team's own name where we have one — "you" is unhelpful in a list of twelve. */
function teamTitle(slot) {
  var n = ((S.league.teamNames || [])[slot - 1] || "").trim();
  return n || (slot === S.league.slot ? "your team" : "team " + slot);
}

/** Every team's picks, keyed by slot, scored in this league's rules. */
function allRosters() {
  var out = {};
  for (var i = 1; i <= S.league.teams; i++) out[i] = [];
  S.picks.forEach(function (pk) {
    var pl = pk.name && A.byName[pk.name];
    if (pl) out[pk.slot].push(Object.assign({}, pl, { pick: pk.pick }));
    else if (pk.unknown) out[pk.slot].push({ name: "unknown", pos: "?", pick: pk.pick, pts: 0, bye: 0 });
  });
  return out;
}

var leagueView = { slot: null };

function renderLeague() {
  var rosters = allRosters();
  $("#leagueSub").textContent = S.picks.length + " picks recorded across " +
    S.league.teams + " teams.";

  $("#leagueFilters").innerHTML =
    '<span class="pill' + (leagueView.slot == null ? " on" : "") + '" data-slot="all">All teams</span>' +
    Array.apply(null, { length: S.league.teams }).map(function (_, i) {
      var slot = i + 1;
      return '<span class="pill' + (leagueView.slot === slot ? " on" : "") +
        '" data-slot="' + slot + '">' + esc(teamTitle(slot)) +
        ' <span class="dimtext">' + rosters[slot].length + "</span></span>";
    }).join("");
  $$("#leagueFilters .pill").forEach(function (el) {
    el.onclick = function () {
      var v = el.getAttribute("data-slot");
      leagueView.slot = v === "all" ? null : +v;
      renderLeague();
    };
  });

  var slots = leagueView.slot ? [leagueView.slot]
            : Array.apply(null, { length: S.league.teams }).map(function (_, i) { return i + 1; });

  $("#leagueBody").innerHTML = '<div class="teamgrid">' + slots.map(function (slot) {
    var team = rosters[slot];
    var byPos = {};
    team.forEach(function (p) { (byPos[p.pos] = byPos[p.pos] || []).push(p); });
    var order = ["QB", "RB", "WR", "TE", "K", "DEF", "?"];
    var body = order.filter(function (pos) { return byPos[pos]; }).map(function (pos) {
      return '<div class="tg-pos"><span class="pos pos-' + (pos === "?" ? "K" : pos) + '">' +
        pos + "</span> " +
        byPos[pos].map(function (p) {
          return '<span class="tg-p">' + esc(p.name) +
            '<span class="dimtext"> ' + (p.bye || "") + "</span></span>";
        }).join("") + "</div>";
    }).join("");
    return '<div class="teamcard' + (slot === S.league.slot ? " me" : "") + '">' +
      '<div class="tc-head"><b>' + esc(teamTitle(slot)) +
        (slot === S.league.slot ? ' <span class="dimtext">(you)</span>' : "") + "</b>" +
        '<span class="dimtext">' + team.length + " picks</span></div>" +
      (body || '<div class="dimtext" style="font-size:12px">nothing recorded</div>') +
    "</div>";
  }).join("") + "</div>";
}

$("#btnLeague").addEventListener("click", function () { renderLeague(); openModal("#leagueModal"); });
$("#leagueClose").addEventListener("click", function () { closeModal("#leagueModal"); });

/* ---------------------------------------------------------- draft report */

/**
 * Grades are computed here, not asked for. Every team's best legal starting
 * lineup is scored in this league's rules and compared with the rest of the
 * league — a grade is a percentile of projected starter points, which is a
 * defensible thing to put a letter on. Claude is asked to read the table
 * afterwards, not to produce it.
 */
function gradeDraft() {
  var rosters = allRosters(), rows = [];
  for (var slot = 1; slot <= S.league.teams; slot++) {
    var team = rosters[slot].filter(function (p) { return p.pos !== "?"; });
    var r = E.assignRoster(team, S.league.rules);
    var starters = r.slots.filter(function (x) { return x.player; });
    var pts = starters.reduce(function (a, x) { return a + x.player.pts; }, 0);
    var vor = team.reduce(function (a, p) { return a + Math.max(0, p.vor || 0); }, 0);
    var byes = {};
    starters.forEach(function (x) { byes[x.player.bye] = (byes[x.player.bye] || 0) + 1; });
    var worstBye = Object.keys(byes).reduce(function (a, w) {
      return byes[w] > (byes[a] || 0) ? w : a; }, null);
    rows.push({
      // In a standings table the manager's own team should read by its name, with
      // "you" appended — "you" alone loses the row when you scan the column.
      slot: slot,
      name: ((S.league.teamNames || [])[slot - 1] || "").trim() ||
            (slot === S.league.slot ? "your team" : "team " + slot),
      isMe: slot === S.league.slot,
      picks: team.length,
      starters: starters.length, empty: r.slots.length - starters.length,
      pts: pts, vor: vor,
      worstBye: worstBye ? { week: +worstBye, n: byes[worstBye] } : null,
      best: team.slice().sort(function (a, b) { return b.pts - a.pts; })[0] || null
    });
  }
  rows.sort(function (a, b) { return b.pts - a.pts; });
  var n = rows.length;
  var LETTERS = ["A+", "A", "A-", "B+", "B", "B", "B-", "C+", "C", "C-", "D+", "D"];
  rows.forEach(function (r, i) {
    r.rank = i + 1;
    r.grade = LETTERS[Math.min(LETTERS.length - 1, Math.floor(i / n * LETTERS.length))];
  });
  return rows;
}

function renderReport() {
  var rows = gradeDraft();
  var total = S.league.teams * S.league.rounds;
  var mine = rows.find(function (r) { return r.slot === S.league.slot; });
  $("#reportSub").textContent = S.picks.length + " of " + total + " picks recorded" +
    (S.picks.length < total ? " — grades will move as the rest come in." : ".");

  $("#reportBody").innerHTML =
    '<div class="note"><b>You finished ' + mine.rank + " of " + rows.length +
      "</b> on projected starting-lineup points in your own scoring" +
      (mine.empty ? " — with " + mine.empty + " starting slot" + (mine.empty === 1 ? "" : "s") +
        " still empty, which is dragging that number down." : ".") +
      " Grades are a percentile of that, computed here rather than asked for." +
    "</div>" +
    '<div class="mt" style="max-height:44vh;overflow:auto"><table>' +
      "<tr><th>#</th><th>Team</th><th class='right'>Grade</th>" +
      "<th class='right'>Starters</th><th class='right'>Proj pts</th>" +
      "<th class='right'>Surplus</th><th>Best pick</th><th>Bye risk</th></tr>" +
      rows.map(function (r) {
        return "<tr" + (r.slot === S.league.slot ? ' style="background:rgba(45,212,191,.07)"' : "") + ">" +
          "<td>" + r.rank + "</td><td>" + esc(r.name) +
            (r.isMe ? ' <span class="dimtext">(you)</span>' : "") + "</td>" +
          '<td class="right"><b>' + r.grade + "</b></td>" +
          '<td class="right num">' + r.starters + "/" + (r.starters + r.empty) + "</td>" +
          '<td class="right num">' + n0(r.pts) + "</td>" +
          '<td class="right num">' + n0(r.vor) + "</td>" +
          "<td>" + (r.best ? '<span class="pos pos-' + r.best.pos + '">' + r.best.pos +
            "</span> " + esc(r.best.name) : "\u2014") + "</td>" +
          "<td>" + (r.worstBye && r.worstBye.n >= 3
            ? '<span style="color:var(--amber)">' + r.worstBye.n + " in wk " + r.worstBye.week + "</span>"
            : '<span class="dimtext">ok</span>') + "</td>" +
        "</tr>";
      }).join("") +
    "</table></div>" +
    '<p class="dimtext" style="font-size:11.5px;margin-top:10px">' +
      "Proj pts is the best legal starting lineup from that roster, scored in your league's " +
      "rules. Surplus adds up every pick's points above replacement, which rewards depth the " +
      "starting lineup can't show. Neither knows about injuries that haven't happened yet.</p>";
  return rows;
}

$("#btnReport").addEventListener("click", function () {
  renderReport(); $("#reportOut").classList.add("hidden"); openModal("#reportModal");
});
$("#reportClose").addEventListener("click", function () { closeModal("#reportModal"); });

var REPORT_SYSTEM =
  "You are reading a completed or in-progress fantasy football draft for the manager who " +
  "drafted one of these teams. The grades and projected points were computed by a scoring " +
  "engine using their league's exact rules — trust them, do not recompute or re-rank. " +
  "Write four short paragraphs, no headings, no bullets, under 300 words total: what their " +
  "draft actually is (the shape of it, not a list of names); the single biggest weakness and " +
  "what it will cost them; which rival team is the real threat and why; and two concrete " +
  "waiver or trade moves to make in the first fortnight. Be specific and direct. Do not " +
  "hedge every sentence.";

$("#reportAsk").addEventListener("click", function () {
  if (!claudeReady()) { closeModal("#reportModal"); $("#btnClaude").click(); return; }
  var rows = gradeDraft(), rosters = allRosters();
  var mine = rows.find(function (r) { return r.slot === S.league.slot; });
  var out = $("#reportOut");
  out.classList.remove("hidden"); out.classList.remove("err");
  out.querySelector(".claude-out").innerHTML = '<span class="spinner"></span> reading the draft\u2026';
  $("#reportAsk").disabled = true;

  var table = rows.map(function (r) {
    return "  " + r.rank + ". " + r.name + " \u2014 grade " + r.grade + ", " +
      Math.round(r.pts) + " projected starter points, " + r.starters + " of " +
      (r.starters + r.empty) + " slots filled" +
      (r.worstBye && r.worstBye.n >= 3 ? ", " + r.worstBye.n + " starters on the week " +
        r.worstBye.week + " bye" : "");
  }).join("\n");

  var myRoster = rosters[S.league.slot].map(function (p) {
    return "  " + p.pos + " " + p.name + " (" + p.team + ", bye " + p.bye + ", " +
      Math.round(p.pts) + " pts, taken " + p.pick + ")";
  }).join("\n");

  claudeCall(
    "LEAGUE: " + S.league.teams + " teams. " + scoringHighlights() + "\n" +
    "DRAFT STYLE THEY USED: " + styleName() + "\n" +
    "PROGRESS: " + S.picks.length + " of " + (S.league.teams * S.league.rounds) + " picks.\n\n" +
    "STANDINGS BY PROJECTED STARTING LINEUP:\n" + table + "\n\n" +
    "MY ROSTER (I am " + mine.name + ", finished " + mine.rank + "):\n" + myRoster,
    REPORT_SYSTEM, 1800)
    .then(function (text) { out.querySelector(".claude-out").textContent = text; })
    .catch(function (err) {
      out.classList.add("err");
      out.querySelector(".claude-out").textContent = err.message;
    })
    .then(function () { $("#reportAsk").disabled = false; });
});

/* ------------------------------------------------------------ draft style */

/** The knobs currently in force: a named style, plus any custom overrides. */
function activeKnobs() {
  var base = (STRATS[S.league.style || "balanced"] || STRATS.balanced).knobs || {};
  var out = JSON.parse(JSON.stringify(base));
  var custom = S.league.styleCustom;
  if (custom) {
    Object.keys(custom).forEach(function (k) {
      if (custom[k] && typeof custom[k] === "object" && !Array.isArray(custom[k]))
        out[k] = Object.assign(out[k] || {}, custom[k]);
      else out[k] = custom[k];
    });
  }
  if (S.league.byeTolerance && out.byeTolerance == null) out.byeTolerance = S.league.byeTolerance;
  return out;
}

function styleName() {
  var n = (STRATS[S.league.style || "balanced"] || STRATS.balanced).name;
  return S.league.styleCustom ? n + " + your notes" : n;
}

/**
 * Everything a model returns passes through here. Unknown keys are dropped,
 * known ones are coerced and clamped to the bounds in DRAFTLINE_KNOB_SPEC. A
 * language model proposing draft weights is a suggestion; letting it write
 * arbitrary numbers into the scoring engine would not be.
 */
function sanitizeKnobs(raw) {
  var out = {}, rejected = [];
  if (!raw || typeof raw !== "object") return { knobs: out, rejected: ["not an object"] };
  Object.keys(raw).forEach(function (k) {
    var spec = KNOBS[k];
    if (!spec) { rejected.push(k); return; }
    var v = raw[k];
    if (spec.type === "map") {
      if (!v || typeof v !== "object") { rejected.push(k); return; }
      var m = {};
      Object.keys(v).forEach(function (pos) {
        if (spec.keys.indexOf(pos) < 0) { rejected.push(k + "." + pos); return; }
        var n = parseFloat(v[pos]);
        if (!isFinite(n)) { rejected.push(k + "." + pos); return; }
        n = Math.min(spec.max, Math.max(spec.min, n));
        m[pos] = spec.int ? Math.round(n) : Math.round(n * 100) / 100;
      });
      if (Object.keys(m).length) out[k] = m;
    } else {
      var n2 = parseFloat(v);
      if (!isFinite(n2)) { rejected.push(k); return; }
      n2 = Math.min(spec.max, Math.max(spec.min, n2));
      out[k] = spec.type === "int" ? Math.round(n2) : Math.round(n2 * 100) / 100;
    }
  });
  return { knobs: out, rejected: rejected };
}

/** Human-readable description of one knob's value, for the diff table. */
function knobLabel(key, val) {
  if (val == null) return "\u2014";
  if (typeof val === "object")
    return Object.keys(val).map(function (k) { return k + " " + val[k]; }).join(", ") || "\u2014";
  return String(val);
}

var KNOB_MEANING = {
  earlyRounds:   "where \u201cearly\u201d stops",
  needWeight:    "how hard roster need pulls (0 = pure best available)",
  ceilingWeight: "weight on upside",
  riskWeight:    "weight on the risk penalty",
  byeTolerance:  "starters on one bye before it costs points",
  stackBonus:    "bonus for pass-catchers on your QB's team",
  handcuffBonus: "bonus for backups to your own running backs",
  posBias:       "position emphasis, all rounds",
  earlyPosBias:  "position emphasis, early rounds only",
  posFloorRound: "earliest round a position is allowed",
  tagPenalty:    "extra penalty on research flags"
};

/** Board top-N under a given knob set, without disturbing the live analysis. */
function boardUnder(knobs, n) {
  var ctx = Object.assign({}, A.ctx, { strategy: knobs });
  return A.avail.map(function (p) {
      return { name: p.name, pos: p.pos, score: E.composite(p, ctx).score };
    })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, n || 12);
}

/** The part that answers "what does this actually do to my draft". */
function renderStyleDiff(newStyleKey, customKnobs) {
  var before = activeKnobs();
  var afterBase = (STRATS[newStyleKey] || STRATS.balanced).knobs || {};
  var after = JSON.parse(JSON.stringify(afterBase));
  if (customKnobs) Object.keys(customKnobs).forEach(function (k) { after[k] = customKnobs[k]; });

  var keys = Object.keys(KNOBS).filter(function (k) {
    return JSON.stringify(before[k]) !== JSON.stringify(after[k]);
  });
  var rows = keys.map(function (k) {
    return "<tr><td>" + esc(KNOB_MEANING[k] || k) + "</td>" +
      '<td class="right dimtext">' + esc(knobLabel(k, before[k])) + "</td>" +
      '<td class="right"><b>' + esc(knobLabel(k, after[k])) + "</b></td></tr>";
  }).join("");

  var b4 = boardUnder(before, 12), af = boardUnder(after, 12);
  var b4rank = {}; b4.forEach(function (p, i) { b4rank[p.name] = i + 1; });
  var moves = af.map(function (p, i) {
    var was = b4rank[p.name], now = i + 1;
    var delta = was ? was - now : null;
    var arrow = delta == null ? '<span style="color:var(--green)">new</span>'
      : delta > 0 ? '<span style="color:var(--green)">\u2191' + delta + "</span>"
      : delta < 0 ? '<span style="color:var(--red)">\u2193' + (-delta) + "</span>"
      : '<span class="dimtext">\u2014</span>';
    return "<tr><td>" + now + '</td><td><span class="pos pos-' + p.pos + '">' + p.pos +
      "</span> " + esc(p.name) + '</td><td class="right">' + arrow + "</td></tr>";
  }).join("");

  $("#styleDiff").innerHTML =
    '<div class="note"><b>' + esc((STRATS[newStyleKey] || {}).name || "Custom") + "</b> \u2014 " +
      esc((STRATS[newStyleKey] || {}).detail || "") + "</div>" +
    '<div class="grid-auto mt">' +
      "<div><div class=\"eyebrow\" style=\"margin-bottom:6px\">What changes in the engine</div>" +
        (rows ? "<table><tr><th>knob</th><th class='right'>now</th><th class='right'>after</th></tr>" +
                rows + "</table>"
              : '<p class="dimtext">Nothing \u2014 this is the default weighting.</p>') + "</div>" +
      "<div><div class=\"eyebrow\" style=\"margin-bottom:6px\">Who moves, at your next pick</div>" +
        "<table>" + moves + "</table></div>" +
    "</div>" +
    '<button class="btn btn-primary mt" id="styleApply">Use this style</button> ' +
    '<button class="btn mt" id="styleCancel">Cancel</button>';

  $("#styleApply").onclick = function () {
    S.league.stylePrev = { style: S.league.style, custom: S.league.styleCustom };
    S.league.style = newStyleKey;
    S.league.styleCustom = customKnobs || null;
    save(); renderStyleList(); $("#styleDiff").innerHTML = ""; render();
    banner("Draft style is now " + styleName() + ". The board has re-ranked.");
  };
  $("#styleCancel").onclick = function () { $("#styleDiff").innerHTML = ""; };
}

function renderStyleList() {
  var cur = S.league.style || "balanced";
  $("#styleList").innerHTML = Object.keys(STRATS).map(function (k) {
    var st = STRATS[k];
    return '<div class="stylecard' + (k === cur ? " on" : "") + '" data-style="' + k + '">' +
      '<div class="sc-head"><b>' + esc(st.name) + "</b>" +
        (k === cur ? '<span class="badge tag-FLAG_PLANT">current</span>' : "") + "</div>" +
      '<div class="sc-tag">' + esc(st.tagline) + "</div>" +
    "</div>";
  }).join("");
  $$("#styleList .stylecard").forEach(function (el) {
    el.onclick = function () { renderStyleDiff(el.getAttribute("data-style"), null); };
  });
  $("#styleCurrent").textContent = "Current: " + styleName();
}

$("#btnStyle").addEventListener("click", function () {
  renderStyleList(); $("#styleDiff").innerHTML = ""; openModal("#styleModal");
});
$("#styleClose").addEventListener("click", function () { closeModal("#styleModal"); });
$("#styleRevert").addEventListener("click", function () {
  S.league.style = "balanced"; S.league.styleCustom = null; S.league.stylePrev = null;
  save(); renderStyleList(); $("#styleDiff").innerHTML = ""; render();
  banner("Back to the default weighting.");
});

var STYLE_SYSTEM =
  "You translate a fantasy manager's description of how they want to draft into a set " +
  "of numeric weights for a draft engine. Reply with ONLY a JSON object, no prose and no " +
  "code fence. Allowed keys and ranges:\n" +
  "  earlyRounds 1-10 \u2014 how many rounds count as early.\n" +
  "  needWeight 0-2 \u2014 how hard an empty starting slot pulls. 0 ignores roster\n" +
  "    need entirely and drafts pure value; 1 neutral; 2 doubles it.\n" +
  "  ceilingWeight 0-2 \u2014 how much a HIGH-UPSIDE player is REWARDED. Raise it\n" +
  "    for a manager chasing league-winners; LOWER it for one who wants safe floors.\n" +
  "  riskWeight 0-2 \u2014 how heavily a RISKY player is PENALISED. RAISE it for a\n" +
  "    cautious win-now manager; LOWER it for one happy to gamble. Mind the\n" +
  "    direction: a high riskWeight means MORE risk-averse, not more risk taken.\n" +
  "  byeTolerance 2-6 \u2014 starters allowed on one bye week before it costs\n" +
  "    points. LOWER is stricter.\n" +
  "  stackBonus / handcuffBonus 0-25 \u2014 points added for a pass-catcher on your\n" +
  "    quarterback's team, or a back behind one you already own.\n" +
  "  posBias / earlyPosBias: object keyed QB RB WR TE K DEF, each 0.4-1.6, 1 = neutral.\n" +
  "    Above 1 favours the position, below 1 avoids it. earlyPosBias applies only\n" +
  "    through earlyRounds, which is how Hero RB (one back early, then pivot)\n" +
  "    differs from Zero RB (none at all early).\n" +
  "  posFloorRound: object keyed by position, earliest round the position is allowed.\n" +
  "  tagPenalty: object keyed LANDMINE INJURY AVOID FALLER, each 0-40 points off a\n" +
  "    player carrying that research flag. Higher means avoid them harder.\n" +
  "Include only the keys the description actually implies. Add a \"why\" key: one sentence, " +
  "under 25 words, saying what you changed and why. Nothing else.";

$("#styleAsk").addEventListener("click", function () {
  var text = $("#styleFree").value.trim();
  if (!text) return;
  if (!claudeReady()) { closeModal("#styleModal"); $("#btnClaude").click(); return; }
  $("#styleAsk").disabled = true;
  $("#styleAskMsg").innerHTML = '<span class="spinner"></span> thinking\u2026';

  claudeCall("The league: " + scoringHighlights() + ".\n" +
             "Roster: " + Object.keys(A.need).map(function (k) {
               return k + " " + A.need[k].have + "/" + A.need[k].starters; }).join(", ") + ".\n" +
             "Currently on style: " + styleName() + ".\n\n" +
             "How they want to draft: " + text, STYLE_SYSTEM)
    .then(function (out) {
      var m = out.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Claude didn't return anything usable.");
      var parsed = JSON.parse(m[0]);
      var why = parsed.why; delete parsed.why;
      var res = sanitizeKnobs(parsed);
      if (!Object.keys(res.knobs).length) throw new Error("Nothing in that mapped to a knob the engine has.");
      $("#styleAskMsg").innerHTML = esc(why || "") +
        (res.rejected.length ? ' <span class="dimtext">(ignored: ' + esc(res.rejected.join(", ")) + ")</span>" : "");
      renderStyleDiff(S.league.style || "balanced", res.knobs);
    })
    .catch(function (err) { $("#styleAskMsg").textContent = err.message; })
    .then(function () { $("#styleAsk").disabled = false; });
});

/* ---------------------------------------------------------- bye weeks */

/**
 * Two different problems wear the same word. A *position clash* is a starter at
 * the same position already on that bye — take this player and one of them sits
 * with no like-for-like replacement. A *week overload* is simply too many of
 * your starters idle in one week, whatever they play.
 */
function byeRisk(p) {
  if (!p || !A) return null;
  var w = p.bye;
  var samePos = (A.byePos[w] && A.byePos[w][p.pos]) || 0;
  var total = A.byeCounts[w] || 0;
  var tol = (A.ctx.strategy && A.ctx.strategy.byeTolerance) || S.league.byeTolerance || 3;
  if (samePos >= (S.league.rules.roster[p.pos] || 1))
    return { level: "clash", samePos: samePos, total: total,
             why: samePos + " of your " + p.pos + " starter" + (samePos === 1 ? "" : "s") +
                  (samePos === 1 ? " already sits" : " already sit") + " out week " + w };
  if (total + 1 > tol)
    return { level: "overload", samePos: samePos, total: total,
             why: (total + 1) + " starters would be on bye in week " + w };
  if (samePos >= 1)
    return { level: "watch", samePos: samePos, total: total,
             why: "another " + p.pos + " starter is on bye in week " + w };
  return null;
}

function renderByeTracker() {
  var weeks = [];
  DATA.players.forEach(function (p) { if (weeks.indexOf(p.bye) < 0) weeks.push(p.bye); });
  weeks.sort(function (a, b) { return a - b; });
  var tol = (A.ctx.strategy && A.ctx.strategy.byeTolerance) || S.league.byeTolerance || 3;

  var worst = 0;
  weeks.forEach(function (w) { worst = Math.max(worst, A.byeCounts[w] || 0); });
  $("#byeSummary").textContent = A.mine.length
    ? (worst >= tol ? "week " + weeks.filter(function (w) { return (A.byeCounts[w] || 0) >= tol; }).join(", ") + " is heavy"
                    : "no clashes")
    : "";

  $("#byeTracker").innerHTML = weeks.map(function (w) {
    var n = A.byeCounts[w] || 0;
    var pos = A.byePos[w] || {};
    var lvl = n >= tol ? "bad" : n === tol - 1 ? "warn" : n ? "ok" : "none";
    var who = Object.keys(pos).map(function (k) { return k + (pos[k] > 1 ? "\u00d7" + pos[k] : ""); }).join(" ");
    return '<div class="byerow ' + lvl + '">' +
      '<span class="wk">wk ' + w + "</span>" +
      '<span class="bar"><span style="width:' + Math.min(100, n / 4 * 100) + '%"></span></span>' +
      '<span class="who">' + (who || "\u2014") + "</span>" +
      '<span class="n">' + (n || "") + "</span>" +
    "</div>";
  }).join("") +
  '<p class="dimtext mb0" style="font-size:11.5px;margin-top:7px">' +
    "Starters only \u2014 bench players on a bye cost you nothing. Flagged at " + tol +
    " in one week, which your style can change.</p>";
}

function renderFilters() {
  var counts = {};
  A.avail.forEach(function (p) { counts[p.pos] = (counts[p.pos] || 0) + 1; });
  var list = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF", "FLEX"];
  $("#posFilters").innerHTML = list.map(function (p) {
    var c = p === "ALL" ? A.avail.length
          : p === "FLEX" ? (counts.RB || 0) + (counts.WR || 0) + (counts.TE || 0)
          : (counts[p] || 0);
    return '<span class="pill' + (view.pos === p ? " on" : "") + '" data-pos="' + p + '">' +
           p + ' <span class="dimtext">' + c + "</span></span>";
  }).join("") +
  '<span style="flex:1"></span>' +
  '<span class="pill' + (view.showTaken ? " on" : "") + '" id="pillTaken" ' +
    'title="Keep drafted players in the list, struck through">drafted ' +
    '<span class="dimtext">' + S.picks.length + "</span></span>";
  $$("#posFilters .pill[data-pos]").forEach(function (el) {
    el.onclick = function () { view.pos = el.getAttribute("data-pos"); renderFilters(); renderList(); };
  });
  $("#pillTaken").onclick = function () {
    view.showTaken = !view.showTaken;
    try { localStorage.setItem("draftline.showTaken", view.showTaken ? "1" : "0"); } catch (e) {}
    renderFilters(); renderList();
  };
  $("#survHead").textContent = A.myNext && A.myNext > A.cur ? "→" + A.myNext : "Survives";
}

function matches(p) {
  if (view.pos === "FLEX") { if (["RB","WR","TE"].indexOf(p.pos) < 0) return false; }
  else if (view.pos !== "ALL" && p.pos !== view.pos) return false;
  var q = view.q.trim().toLowerCase();
  if (!q) return true;
  return q.split(/\s+/).every(function (t) {
    return (p.name + " " + p.pos + " " + p.team + " " + (p.tag || "")).toLowerCase().indexOf(t) >= 0;
  });
}

function sortedList() {
  var l = (view.showTaken ? A.all : A.avail).filter(matches);
  var cmp = {
    composite: function (a, b) { return b.comp - a.comp; },
    pts:       function (a, b) { return b.pts - a.pts; },
    vor:       function (a, b) { return b.vor - a.vor; },
    adp:       function (a, b) { return a.adp - b.adp; },
    delta:     function (a, b) { return b.adpDelta - a.adpDelta; },
    survival:  function (a, b) { return a.surv - b.surv; }
  }[view.sort];
  return l.sort(cmp);
}

/** Who the plain "took him" action will credit — always whoever is on the clock. */
function onClockLabel() {
  return A && A.onClock ? teamLabel(A.onClock.slot) : "the team on the clock";
}
function onClockShort() {
  if (!A || !A.onClock) return "GONE";
  if (A.onClock.slot === S.league.slot) return "GONE";
  var n = ((S.league.teamNames || [])[A.onClock.slot - 1] || "").trim();
  if (!n) return "T" + A.onClock.slot;
  var words = n.split(/\s+/).filter(function (w) { return /[a-z0-9]/i.test(w); });
  // "Gridiron Goons" reads better as GG than as GRIDIR.
  return words.length > 1
    ? words.map(function (w) { return w[0]; }).join("").slice(0, 4).toUpperCase()
    : n.slice(0, 5).toUpperCase();
}

function rowHtml(p, i) {
  var d = p.adpDelta;
  var tag = p.tag ? ' <span class="badge tag-' + p.tag + '">' + p.tag.replace("_", " ") + "</span>" : "";
  var est = p.projSource === "modeled" ? ' <span class="dimtext" title="modeled, not projected">~</span>' : "";
  var surv = Math.round((p.surv || 1) * 100);
  var survColor = surv > 70 ? "var(--green)" : surv > 35 ? "var(--amber)" : "var(--red)";
  var t = p.takenBy;
  var br = t ? null : byeRisk(p);
  var cls = "prow" + (view.selected === p.name ? " sel" : "") +
            (t ? " taken" + (t.mine ? " by-me" : "") : "");
  var who = t ? '<span class="sub">' + teamLabel(t.slot, true) + " \u00b7 " + t.pick + "</span>" : "";
  return '<div class="' + cls + '" data-name="' + esc(p.name) + '">' +
    '<span class="rank">' + (i + 1) + "</span>" +
    '<span class="nm"><span class="pos pos-' + p.pos + '">' + p.pos + "</span> " + esc(p.name) +
      '<span class="sub">' + p.team + "</span>" + tag + who + "</span>" +
    '<span class="num">' + n0(p.pts) + est + "</span>" +
    '<span class="num c-bye ' + (br ? "bye-" + br.level : "dimtext") + '"' +
      (br ? ' title="' + esc(br.why) + '"' : "") + ">" + p.bye + "</span>" +
    '<span class="num c-vor">' + n0(p.vor) + "</span>" +
    '<span class="num dimtext">' + (p.adp || "").toFixed(0) + "</span>" +
    '<span class="num delta ' + (d > 0 ? "pos-val" : "neg-val") + '">' + (d > 0 ? "+" : "") + n0(d) + "</span>" +
    '<span class="num" style="color:' + survColor + '">' + (t ? "\u2014" : surv + "%") + "</span>" +
    (t ? '<span class="rowacts"></span>'
       : '<span class="rowacts">' +
           '<button data-act="gone" title="Goes to ' + esc(onClockLabel()) + '">' +
             esc(onClockShort()) + "</button>" +
           '<button class="mine" data-act="mine" title="I drafted him">MINE</button>' +
         "</span>") +
  "</div>";
}

function renderList() {
  var l = sortedList().slice(0, 220);
  $("#plist").innerHTML = l.map(rowHtml).join("") ||
    '<div class="col-pad dimtext">Nobody matches that.</div>';
  $$("#plist .prow").forEach(function (el) {
    var name = el.getAttribute("data-name");
    var taken = el.classList.contains("taken");
    $$("[data-act]", el).forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); record(name, b.dataset.act === "mine"); };
    });
    el.onclick = function (e) {
      if (taken) return;
      if (e.shiftKey) return record(name, true);
      if (e.altKey || e.metaKey || e.ctrlKey) return record(name, false);
      view.selected = name; renderList(); renderDetail(name);
    };
    if (!taken) el.ondblclick = function () { record(name, false); };
  });
}

function renderRunBanner() {
  var runs = Object.keys(A.runInfo.runs);
  $("#runBanner").innerHTML = runs.length
    ? runs.map(function (pos) {
        return '<div class="banner"><b>' + pos + " run in progress</b> — " +
               A.runInfo.runs[pos] + " of the last " + A.runInfo.window +
               " picks. That position's urgency is raised.</div>";
      }).join("")
    : "";
}

function renderRecs() {
  if (!A.myNext) { $("#recs").innerHTML = '<div class="note">Your draft is finished.</div>'; return; }

  // Until you're on the clock, ranking the whole board is noise — the top of it
  // will be gone. Restrict to players who can realistically still be there.
  var waiting = A.myNext > A.cur;
  var pool = A.avail.filter(function (p) { return !p.compDetail.blocked; });
  var realistic = waiting ? pool.filter(function (p) { return p.surv >= 0.15; }) : pool;
  if (!realistic.length) realistic = pool;
  var top = realistic.sort(function (a, b) { return b.comp - a.comp; }).slice(0, 3);

  $("#recTitle").innerHTML = (waiting ? "Target at pick " + A.myNext : "Take one of these") +
    ' <span class="stylechip" id="styleChip">' + esc(styleName()) + "</span>";
  $("#recCtx").textContent = "round " + A.ctx.round +
    (waiting ? " · " + (A.myNext - A.cur) + " picks away · 15%+ to reach you" : " · you're on the clock") +
    (A.myAfter ? " · then " + A.myAfter : "");

  var best = top[0] ? top[0].comp : 1;
  $("#recs").innerHTML = top.map(function (p, i) {
    var d = p.compDetail;
    var conf = Math.max(8, Math.min(100, Math.round(p.comp / Math.max(best, 1) * 100)));
    var why = d.reasons.slice(0, 3).map(function (r) { return "<b>" + esc(r) + "</b>"; }).join(" · ");
    return '<div class="rec' + (i === 0 ? " top" : "") + '">' +
      '<div class="rec-head"><span class="pos pos-' + p.pos + '">' + p.pos + "</span>" +
        '<span class="name">' + esc(p.name) + "</span>" +
        '<span class="dimtext num">' + p.team + " · bye " + p.bye + "</span>" +
        (p.tag ? ' <span class="badge tag-' + p.tag + '">' + p.tag.replace("_", " ") + "</span>" : "") +
      "</div>" +
      '<div class="rec-why">' + (why || "best remaining value") + "</div>" +
      '<div class="bar"><span style="width:' + conf + '%"></span></div>' +
      '<div class="rec-actions">' +
        '<button class="btn btn-sm btn-primary" data-take="' + esc(p.name) + '">I drafted him</button>' +
        '<button class="btn btn-sm" data-gone="' + esc(p.name) + '">Taken</button>' +
        '<button class="btn btn-sm btn-ghost" data-open="' + esc(p.name) + '">Why?</button>' +
      "</div></div>";
  }).join("") || '<div class="note">Nothing left that clears the position caps.</div>';

  var chip = $("#styleChip");
  if (chip) chip.onclick = function () { $("#btnStyle").click(); };
  $$("#recs [data-take]").forEach(function (b) { b.onclick = function () { record(b.dataset.take, true); }; });
  $$("#recs [data-gone]").forEach(function (b) { b.onclick = function () { record(b.dataset.gone, false); }; });
  $$("#recs [data-open]").forEach(function (b) {
    b.onclick = function () { view.selected = b.dataset.open; renderList(); renderDetail(b.dataset.open); };
  });
  // The selected player may have just been drafted — fall back to the top pick
  // so the detail panel is never empty while there is something to explain.
  var stillThere = view.selected && A.avail.some(function (p) { return p.name === view.selected; });
  if (!stillThere && top[0]) view.selected = top[0].name;
  if (view.selected) renderDetail(view.selected);
}

function renderDetail(name) {
  var p = A.avail.find(function (x) { return x.name === name; });
  if (!p) { $("#detail").innerHTML = ""; return; }
  var std = standardBoard()[name];
  var d = p.compDetail;

  var cats = Object.keys(p.byCategory).sort(function (a, b) {
    return Math.abs(p.byCategory[b]) - Math.abs(p.byCategory[a]);
  });
  var catRows = cats.map(function (c) {
    var v = p.byCategory[c];
    return "<tr><td>" + esc(c) + '</td><td class="right num">' +
      (v >= 0 ? "" : "-") + Math.abs(v).toFixed(1) + "</td></tr>";
  }).join("");

  var swing = std ? p.pts - std.pts : 0;
  var rankSwing = std ? std.posRank - p.posRank : 0;

  $("#detail").innerHTML =
    '<div class="panel mt"><div class="panel-head">' +
      "<h3>" + esc(p.name) + ' <span class="pos pos-' + p.pos + '">' + p.pos + "</span></h3>" +
      '<span class="eyebrow">' + p.pos + String(p.posRank) + " · ADP " + p.adp + "</span></div>" +

    '<div class="note" style="margin-bottom:12px">' +
      "<b>" + n0(p.pts) + " points in your scoring</b>" +
      (std ? " vs <b>" + n0(std.pts) + "</b> in plain full PPR — a " +
        (swing >= 0 ? "+" : "") + n0(swing) + "-point swing" +
        (rankSwing ? ", moving him " + Math.abs(rankSwing) + " spot" + (Math.abs(rankSwing) === 1 ? "" : "s") +
          (rankSwing > 0 ? " up" : " down") + " at " + p.pos : "") + "." : ".") +
      (p.estimated ? ' <span class="dimtext">Includes modeled components — see below.</span>' : "") +
    "</div>" +

    (p.note ? '<div class="note warn" style="margin-bottom:12px">' + esc(p.note) +
      (p.source ? ' <span class="dimtext">— ' + esc(p.source) + "</span>" : "") + "</div>" : "") +

    '<div class="grid-auto">' +
      "<div><div class=\"eyebrow\" style=\"margin-bottom:6px\">Where the points come from</div>" +
        "<table>" + catRows + "</table></div>" +
      "<div><div class=\"eyebrow\" style=\"margin-bottom:6px\">How the suggestion is built</div><table>" +
        '<tr><td>Value over replacement</td><td class="right num">' + n0(p.vor) + "</td></tr>" +
        '<tr><td>Value over next available</td><td class="right num">' + n0(d.vona) + "</td></tr>" +
        '<tr><td>Need multiplier</td><td class="right num">×' + d.mult.toFixed(2) + "</td></tr>" +
        '<tr><td>Ceiling adjustment</td><td class="right num">' + (d.ceilingAdj ? "+" + d.ceilingAdj.toFixed(1) : "—") + "</td></tr>" +
        '<tr><td>Risk adjustment</td><td class="right num">' + (d.riskAdj ? "-" + d.riskAdj.toFixed(1) : "—") + "</td></tr>" +
        '<tr><td>Bye penalty</td><td class="right num">' + (d.byePenalty ? "-" + d.byePenalty.toFixed(0) : "—") + "</td></tr>" +
        '<tr><td><b>Composite</b></td><td class="right num"><b>' + n0(p.comp) + "</b></td></tr>" +
        (d.blocked ? '<tr><td colspan="2" class="dimtext">Blocked: ' + esc(d.blocked) + "</td></tr>" : "") +
      "</table>" +
      '<div class="mt dimtext" style="font-size:12px">' +
        "Survives to " + (A.myNext || "—") + ": <b>" + Math.round(p.surv * 100) + "%</b>" +
        (A.myAfter ? " · to " + A.myAfter + ": <b>" + Math.round(p.survNext * 100) + "%</b>" : "") +
      "</div></div>" +
    "</div>" +

    '<div class="rec-actions mt">' +
      '<button class="btn btn-sm btn-primary" data-take2="' + esc(p.name) + '">I drafted him</button>' +
      '<button class="btn btn-sm" data-gone2="' + esc(p.name) + '">Someone else took him</button>' +
    "</div>" +
    (p.estimated ? '<p class="dimtext mb0 mt" style="font-size:11.5px">' +
      (p.pos === "DEF"
        ? "Points allowed is modeled: a per-game probability across the seven tiers, set by " +
          "this unit's researched tier. No projection source publishes points-allowed buckets."
        : p.pos === "K"
        ? "Kicker lines are modeled off position rank. Every kicker in the projection source " +
          "carries an identical stat line, so rank is the only real signal available."
        : "40+ yard play counts are estimated from this player's own volume and efficiency — " +
          "no projection source publishes them. They are worth about a point each; treat them " +
          "as a tiebreaker, not a reason.") + "</p>" : "") +
    "</div>";

  $$("#detail [data-take2]").forEach(function (b) { b.onclick = function () { record(b.dataset.take2, true); }; });
  $$("#detail [data-gone2]").forEach(function (b) { b.onclick = function () { record(b.dataset.gone2, false); }; });
}

function renderRoster() {
  var r = A.roster;
  $("#rosterCount").textContent = A.mine.length + " players";
  var html = r.slots.map(function (s) {
    if (!s.player) return '<div class="slot empty"><span class="lbl">' + s.pos + "</span>" +
      '<span class="who">—</span></div>';
    var clash = (A.ctx.byeCounts[s.player.bye] || 0) >= (S.league.byeTolerance || 3);
    return '<div class="slot' + (clash ? " bye-clash" : "") + '">' +
      '<span class="lbl">' + s.pos + "</span>" +
      '<span class="who"><span class="pos pos-' + s.player.pos + '">' + s.player.pos + "</span> " +
        esc(s.player.name) + "</span>" +
      '<span class="bye">' + s.player.bye + "</span>" +
      '<span class="num dimtext" style="font-size:11px">' + n0(s.player.pts) + "</span></div>";
  }).join("");
  var bench = r.bench.map(function (p) {
    return '<div class="slot"><span class="lbl">BN</span>' +
      '<span class="who"><span class="pos pos-' + p.pos + '">' + p.pos + "</span> " + esc(p.name) + "</span>" +
      '<span class="bye">' + p.bye + "</span></div>";
  }).join("");
  $("#roster").innerHTML = html + (bench ? '<div class="eyebrow" style="margin:8px 0 4px">Bench</div>' + bench : "");

  var byeList = Object.keys(A.ctx.byeCounts).filter(function (w) {
    return A.ctx.byeCounts[w] >= (S.league.byeTolerance || 3);
  });
  $("#needs").innerHTML = ["QB", "RB", "WR", "TE", "K", "DEF"].map(function (pos) {
    var nd = A.need[pos] || { have: 0, starters: 0, short: 0 };
    var cls = nd.short > 0.5 ? " short" : nd.short <= 0 ? " done" : "";
    return '<span class="n' + cls + '">' + pos + " " + nd.have + "/" + nd.starters + "</span>";
  }).join("") +
  (byeList.length ? '<span class="n short">bye clash wk ' + byeList.join(", ") + "</span>" : "");
}

function renderTurn() {
  if (!A.myNext) { $("#turn").innerHTML = ""; return; }
  var gap = A.myNext - A.cur;
  $("#turnTitle").textContent = gap <= 0
    ? "Who survives to pick " + (A.myAfter || "—") + "?"
    : "Who survives to pick " + A.myNext + "?";
  var target = gap <= 0 ? A.myAfter : A.myNext;
  if (!target) { $("#turn").innerHTML = '<div class="dimtext">Last pick — take the best board score.</div>'; return; }

  var pool = A.avail.filter(function (p) { return E.survival(p, target) >= 0.05; })
                    .sort(function (a, b) { return b.comp - a.comp; }).slice(0, 10);
  $("#turn").innerHTML = pool.map(function (p) {
    var s = E.survival(p, target), pct = Math.round(s * 100);
    var col = pct > 70 ? "var(--green)" : pct > 35 ? "var(--amber)" : "var(--red)";
    return '<div class="srow"><span class="pos pos-' + p.pos + '" style="width:26px">' + p.pos + "</span>" +
      '<span style="width:118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.name) + "</span>" +
      '<span class="sbar"><span style="width:' + pct + "%;background:" + col + '"></span></span>' +
      '<span class="pct">' + pct + "%</span></div>";
  }).join("") +
  '<p class="dimtext" style="font-size:11.5px;margin-top:8px">' +
    (gap > 0 && gap <= 6
      ? "You pick again in " + gap + " picks. Anything above ~70% is worth waiting on."
      : "From ADP standard deviations across ~7,800 mock drafts.") + "</p>";
}

function renderSchedule() {
  var taken = {}; S.picks.forEach(function (p) { if (p.mine) taken[p.pick] = p.name; });
  $("#schedule").innerHTML = myPickNumbers().map(function (pk) {
    var k = keeperAt(pk);
    var label = taken[pk] ? esc(taken[pk]) : k ? "keeper: " + esc(k.name) : "";
    var isNext = pk === A.myNext;
    return '<div style="padding:2px 0;color:' + (isNext ? "var(--teal)" : label ? "var(--muted)" : "var(--dim)") + '">' +
      (isNext ? "▸ " : "&nbsp;&nbsp;") + String(pk).padStart(3, " ") + "  " + label + "</div>";
  }).join("");
}

function renderLog() {
  $("#logCount").textContent = S.picks.length + " picks";
  $("#log").innerHTML = S.picks.slice().reverse().slice(0, 40).map(function (p) {
    var pl = BY_NAME[p.name] || {};
    return '<div style="padding:2px 0;' + (p.mine ? "color:var(--teal)" : "color:var(--dim)") + '">' +
      '<span class="mono">' + p.pick + "</span> " +
      (p.mine ? "you" : "t" + p.slot) + " · " +
      (p.unknown ? "<i>unknown</i>" : esc(p.name)) +
      ' <span class="pos pos-' + (pl.pos || "K") + '">' + (pl.pos || "") + "</span>" +
      (p.keeper ? ' <span class="dimtext">keeper</span>' : "") + "</div>";
  }).join("");
}

/* ------------------------------------------------------------ interaction */

// Second line of defence against Chrome deciding this is a login field: it will
// not autofill a readonly input, and the attribute is dropped the moment you
// actually mean to type in it.
(function guardSearch() {
  var el = $("#search");
  el.setAttribute("readonly", "readonly");
  ["focus", "pointerdown", "touchstart"].forEach(function (ev) {
    el.addEventListener(ev, function () { el.removeAttribute("readonly"); });
  });
  el.addEventListener("blur", function () {
    if (!el.value) el.setAttribute("readonly", "readonly");
  });
})();

$("#search").addEventListener("input", function (e) { view.q = e.target.value; renderList(); });
$("#search").addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;
  var l = sortedList();
  if (!l.length) return;
  var name = l[0].name;
  e.target.value = ""; view.q = "";   // clear before the re-render, not after
  record(name, e.shiftKey);
});
$("#sortBy").addEventListener("change", function (e) { view.sort = e.target.value; renderList(); });
$("#btnUndo").addEventListener("click", undo);
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  if (e.key === "/" && document.activeElement !== $("#search")) { e.preventDefault(); $("#search").focus(); }
});
$("#btnOut").addEventListener("click", function () { AUTH.logout(); location.href = "index.html"; });

function flash(sel, msg, isErr) {
  var el = $(sel); if (!el) return;
  el.innerHTML = '<div class="note ' + (isErr ? "err" : "") + '">' + esc(msg) + "</div>";
  setTimeout(function () { if (el.firstChild) el.innerHTML = ""; }, 6000);
}
function openModal(id) { $(id).classList.remove("hidden"); }
function closeModal(id) { $(id).classList.add("hidden"); }

/* ----------------------------------------------------------- setup modal */

var HUMAN = {
  yardsPerPoint: "Yards per point", td: "Touchdown", int: "Interception", twoPt: "2-pt conversion",
  bonus400: "Bonus at 400 yds", bonus500: "Bonus at 500 yds", bonus150: "Bonus at 150 yds",
  bonus200: "Bonus at 200 yds", comp40plus: "40+ yard completion", run40plus: "40+ yard run",
  rec40plus: "40+ yard reception", td40plus: "40+ yard TD", perReception: "Per reception",
  fumbleLost: "Fumble lost", offFumbleRetTd: "Fumble return TD",
  returnYardsPerPoint: "Return yards per point", returnTd: "Return TD",
  sack: "Sack", fumRec: "Fumble recovery", safety: "Safety", blockKick: "Blocked kick",
  extraPointReturned: "XP returned", pa0: "0 points allowed", pa1_6: "1-6 allowed",
  pa7_13: "7-13 allowed", pa14_20: "14-20 allowed", pa21_27: "21-27 allowed",
  pa28_34: "28-34 allowed", pa35plus: "35+ allowed",
  fg0_19: "FG 0-19", fg20_29: "FG 20-29", fg30_39: "FG 30-39", fg40_49: "FG 40-49",
  fg50plus: "FG 50+", miss0_19: "Miss 0-19", miss20_29: "Miss 20-29", miss30_39: "Miss 30-39",
  miss40_49: "Miss 40-49", miss50plus: "Miss 50+", pat: "Extra point", patMiss: "Missed XP"
};
var GROUPS = [["passing", "Passing"], ["rushing", "Rushing"], ["receiving", "Receiving"],
              ["misc", "Miscellaneous"], ["kicking", "Kicking"], ["dst", "Defense / special teams"]];

function buildScoringForm() {
  var r = S.league.rules;
  $("#scoringForm").innerHTML = GROUPS.map(function (g) {
    var obj = r[g[0]] || {};
    var fields = Object.keys(obj).map(function (k) {
      return '<div class="field" style="min-width:150px;flex:1"><label>' + (HUMAN[k] || k) + "</label>" +
        '<input type="number" step="0.05" data-grp="' + g[0] + '" data-key="' + k + '" value="' + obj[k] + '"></div>';
    }).join("");
    return '<div class="eyebrow" style="margin:14px 0 6px">' + g[1] + "</div>" +
           '<div style="display:flex;flex-wrap:wrap;gap:10px">' + fields + "</div>";
  }).join("");
}
function buildRosterForm() {
  var r = S.league.rules.roster;
  $("#rosterForm").innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
    ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF", "BN", "IR"].map(function (k) {
      return '<div class="field" style="width:90px"><label>' + k + "</label>" +
        '<input type="number" min="0" data-roster="' + k + '" value="' + (r[k] || 0) + '"></div>';
    }).join("") + "</div>";
}
function buildTeamNames() {
  var names = S.league.teamNames || [];
  var rows = [];
  for (var i = 1; i <= S.league.teams; i++) {
    rows.push('<div class="field" style="width:170px;margin-bottom:8px">' +
      "<label>" + (i === S.league.slot ? "you (slot " + i + ")" : "slot " + i) + "</label>" +
      '<input type="text" autocomplete="off" data-team="' + i + '" value="' +
        esc(names[i - 1] || "") + '" placeholder="' +
        (i === S.league.slot ? "your team" : "team " + i) + '"></div>');
  }
  $("#teamNames").innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
    rows.join("") + "</div>";
}

function buildKeeperList() {
  $("#keeperList").innerHTML = (S.league.keepers || []).map(function (k, i) {
    return '<div class="slot"><span class="who">' + esc(k.name) + "</span>" +
      '<span class="dimtext">round ' + k.round + " · team " + (k.slot || S.league.slot) + "</span>" +
      '<button class="btn btn-sm btn-ghost btn-danger" data-delk="' + i + '">remove</button></div>';
  }).join("") || '<div class="dimtext">No keepers.</div>';
  $$("#keeperList [data-delk]").forEach(function (b) {
    b.onclick = function () {
      S.league.keepers.splice(+b.dataset.delk, 1); buildKeeperList();
    };
  });
}

function openSetup() {
  $("#presetSel").innerHTML = Object.keys(PRESETS).map(function (k) {
    return '<option value="' + k + '"' + (S.league.preset === k ? " selected" : "") + ">" +
      esc(PRESETS[k].name) + "</option>";
  }).join("");
  $("#presetBlurb").textContent = (PRESETS[S.league.preset] || {}).blurb || "";
  $("#cfgTeams").value = S.league.teams;
  $("#cfgSlot").value = S.league.slot;
  $("#cfgRounds").value = S.league.rounds;
  $("#allPlayers").innerHTML = DATA.players.map(function (p) {
    return '<option value="' + esc(p.name) + '">';
  }).join("");
  buildScoringForm(); buildRosterForm(); buildKeeperList(); buildTeamNames();
  openModal("#setupModal");
}
$("#btnSetup").addEventListener("click", openSetup);
$("#setupClose").addEventListener("click", function () { closeModal("#setupModal"); });
$("#presetSel").addEventListener("change", function (e) {
  S.league.preset = e.target.value;
  S.league.rules = JSON.parse(JSON.stringify(PRESETS[e.target.value]));
  S.league.teams = S.league.rules.teams || S.league.teams;
  $("#cfgTeams").value = S.league.teams;
  $("#presetBlurb").textContent = PRESETS[e.target.value].blurb || "";
  buildScoringForm(); buildRosterForm();
});
$("#kAdd").addEventListener("click", function () {
  var nm = $("#kName").value.trim();
  if (!BY_NAME[nm]) return flash("#keeperList", "No player on the board with that exact name.", true);
  S.league.keepers.push({ name: nm, round: +$("#kRound").value || 1,
                          slot: +$("#kSlot").value || S.league.slot });
  $("#kName").value = ""; buildKeeperList();
});
$("#setupSave").addEventListener("click", function () {
  $$("#scoringForm input").forEach(function (i) {
    S.league.rules[i.dataset.grp][i.dataset.key] = parseFloat(i.value) || 0;
  });
  $$("#rosterForm input").forEach(function (i) {
    S.league.rules.roster[i.dataset.roster] = parseInt(i.value, 10) || 0;
  });
  S.league.teams  = parseInt($("#cfgTeams").value, 10) || 12;
  S.league.slot   = parseInt($("#cfgSlot").value, 10) || 1;
  S.league.rounds = parseInt($("#cfgRounds").value, 10) || 15;
  S.league.rules.teams = S.league.teams;
  var names = [];
  $$("#teamNames input").forEach(function (i) { names[+i.dataset.team - 1] = i.value.trim(); });
  S.league.teamNames = names;
  save(); closeModal("#setupModal"); render();
});
$("#btnReset").addEventListener("click", function () {
  if (!confirm("Clear every pick in this draft? League settings and keepers stay.")) return;
  S.picks = []; save(); closeModal("#setupModal"); render();
});

/* ------------------------------- league settings import (see parser.js) */

// Where each platform keeps the page, and what to copy. Written as steps rather
// than a screenshot so it stays correct when they reskin the site.
var SITE_STEPS = {
  yahoo: {
    label: "Yahoo",
    link: "https://football.fantasysports.yahoo.com/f1/",
    steps: [
      "In your league, click <b>League</b> in the top nav, then <b>Settings</b>.",
      "The page is titled <b>Scoring &amp; Settings</b> and its address ends in <span class=\"mono\">/settings</span>.",
      "Click anywhere on the page, press <span class=\"kbd\">Ctrl</span>+<span class=\"kbd\">A</span> then <span class=\"kbd\">Ctrl</span>+<span class=\"kbd\">C</span>, and paste below.",
      "Grab the <b>whole page</b>, not just the scoring tables — the roster slots, team count and playoff weeks live in the settings table above them."
    ],
    note: "Yahoo prints a second column of its own default values next to anything you have changed. " +
          "Draftline always reads your league's number, never Yahoo's."
  },
  espn: {
    label: "ESPN",
    link: "https://fantasy.espn.com/football/",
    steps: [
      "In your league, open <b>League</b> → <b>Settings</b>.",
      "Open the <b>Scoring</b> tab, select all and copy, and paste below.",
      "Then do the same for the <b>Roster</b> tab and paste that too — ESPN splits them across two pages, and you can paste both one after the other."
    ],
    note: "ESPN labels most categories the same way Yahoo does, so the same rules apply. " +
          "Anything unrecognised is listed for you rather than guessed at."
  },
  sleeper: {
    label: "Sleeper",
    link: "https://sleeper.com/",
    steps: [
      "Open your league, then <b>League Settings</b> → <b>Scoring Settings</b>.",
      "Select all and copy, and paste below.",
      "Sleeper's web app lays scoring out as label-and-value rows, which parses the same way."
    ],
    note: "Sleeper is the one platform with a clean public API. If pasting is awkward, the " +
          "manual form below takes about two minutes and is exact."
  },
  other: {
    label: "Another platform",
    link: "",
    steps: [
      "Find whichever page lists your scoring categories and their point values.",
      "Select all, copy, paste below, and see what it recognises."
    ],
    note: "The parser matches on category names rather than page layout, so unfamiliar " +
          "platforms often work anyway. Whatever it misses, set by hand in the scoring form below — " +
          "and send me the lines it listed as unrecognised so they can be added."
  }
};

function renderSiteSteps(site) {
  var c = SITE_STEPS[site] || SITE_STEPS.other;
  $("#siteSteps").innerHTML =
    "<b>" + esc(c.label) + "</b>" +
    (c.link ? ' — <a href="' + c.link + '" target="_blank" rel="noopener">open your leagues</a>' : "") +
    '<ol style="margin:8px 0 0;padding-left:20px;line-height:1.6">' +
    c.steps.map(function (st) { return "<li>" + st + "</li>"; }).join("") +
    "</ol>" +
    '<p class="dimtext mb0" style="font-size:12px;margin-top:8px">' + c.note + "</p>";
}
$$("#setupModal .pill[data-site]").forEach(function (el) {
  el.onclick = function () {
    $$("#setupModal .pill[data-site]").forEach(function (o) { o.classList.remove("on"); });
    el.classList.add("on");
    renderSiteSteps(el.getAttribute("data-site"));
  };
});
renderSiteSteps("yahoo");


$("#parseBtn").addEventListener("click", function () {
  var res = DRAFTLINE_PARSER.parse($("#pasteBox").value);
  var rows = res.hits.map(function (h) {
    return "<tr><td>" + esc(h[0]) + '</td><td class="right num">' + esc(h[1]) + "</td>" +
      '<td class="dimtext">' + (h[2] ? h[2].join(".") : "") + "</td></tr>";
  }).join("");
  $("#parseOut").innerHTML =
    '<div class="note' + (res.confidence < 0.4 ? " warn" : "") + '">Recognised <b>' + res.hits.length +
      "</b> settings, " + (res.missed.length ? res.missed.length + " lines not recognised"
        : "everything on the page recognised") + ". Nothing has been applied yet — " +
      "check the values below, then apply.</div>" +
    '<div class="mt" style="max-height:240px;overflow:auto"><table>' + rows + "</table></div>" +
    (res.missed.length ? '<details class="mt"><summary class="dimtext">Lines it did not recognise</summary>' +
      '<pre class="dimtext" style="font-size:11px;white-space:pre-wrap">' +
      esc(res.missed.join("\n")) + "</pre></details>" : "") +
    '<button class="btn btn-primary mt" id="applyParse">Apply these values</button>';
  $("#applyParse").onclick = function () {
    Object.keys(res.scoring).forEach(function (grp) {
      S.league.rules[grp] = S.league.rules[grp] || {};
      Object.keys(res.scoring[grp]).forEach(function (k) {
        S.league.rules[grp][k] = res.scoring[grp][k];
      });
    });
    if (res.draft.roster) S.league.rules.roster =
      Object.assign({ flexEligible: ["RB", "WR", "TE"] }, res.draft.roster);
    if (res.draft.teams) { S.league.teams = res.draft.teams; $("#cfgTeams").value = res.draft.teams; }
    if (res.draft.fractional !== undefined) S.league.rules.fractional = res.draft.fractional;
    if (res.draft.playoffWeeks) S.league.rules.playoffWeeks = res.draft.playoffWeeks;
    buildScoringForm(); buildRosterForm();
    flash("#parseOut", "Applied. Review the scoring section, then Save league.");
  };
});

/* ------------------------------------------------------------ export/import */

$("#btnData").addEventListener("click", function () { openModal("#dataModal"); });
$("#dataClose").addEventListener("click", function () { closeModal("#dataModal"); });
$("#btnExport").addEventListener("click", function () {
  var blob = new Blob([JSON.stringify({ version: 1, profile: me.name,
    league: S.league, picks: S.picks, exported: new Date().toISOString() }, null, 2)],
    { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "draftline-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click(); URL.revokeObjectURL(a.href);
});
$("#btnImport").addEventListener("click", function () { $("#fileIn").click(); });
$("#fileIn").addEventListener("change", function (e) {
  var f = e.target.files[0]; if (!f) return;
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var o = JSON.parse(fr.result);
      if (!o.league || !o.picks) throw new Error("That file isn't a Draftline export.");
      S.league = o.league; S.picks = o.picks; save(); render();
      flash("#dataMsg", "Loaded " + o.picks.length + " picks.");
    } catch (err) { flash("#dataMsg", err.message, true); }
  };
  fr.readAsText(f);
});

/* ----------------------------------------------------------------- Claude */

var PROXY = (globalThis.DRAFTLINE_CONFIG || {}).claudeProxy || "";

var claudeCfg = (function () {
  try { return JSON.parse(localStorage.getItem(KEY_CLAUDE) || "{}"); } catch (e) { return {}; }
})();
if (claudeCfg.auto === undefined) claudeCfg.auto = true;
if (!claudeCfg.lead) claudeCfg.lead = 2;

/** Claude is reachable if a shared proxy is configured, or the user brought a key. */
function claudeReady() { return !!PROXY || !!claudeCfg.key; }

function claudeSaveCfg() {
  try { localStorage.setItem(KEY_CLAUDE, JSON.stringify(claudeCfg)); } catch (e) {}
}
function claudePanes() {
  var ready = claudeReady();
  $("#claudeSetup").classList.toggle("hidden", ready);
  $("#claudeAsk").classList.toggle("hidden", !ready);
  $("#claudeModeNote").innerHTML = PROXY
    ? "Claude runs through this site's own proxy, so there is nothing for you to set up and no key to " +
      "paste. The proxy pins the model and answer length, rate-limits per person, and stops for the day " +
      "if the shared budget runs out — the draft board is unaffected either way."
    : "Optional; the draft board works fully without it. There is no server behind this page, so you " +
      "paste your own key. It stays in this browser's local storage and the request goes straight from " +
      "your machine to Anthropic. Haiku 4.5 answers cost a fraction of a cent each.";
  $("#autoBrief").checked = !!claudeCfg.auto;
  $("#briefLead").value = String(claudeCfg.lead);
  renderSpend();
}
function renderSpend() {
  var s = claudeCfg.spend || { calls: 0, in: 0, out: 0 };
  if (!s.calls) { $("#spendLine").textContent = "No questions asked yet this draft."; return; }
  var usd = (s.in / 1e6) * 1.0 + (s.out / 1e6) * 5.0;
  $("#spendLine").textContent = s.calls + " question" + (s.calls === 1 ? "" : "s") + " so far · " +
    s.in.toLocaleString() + " in / " + s.out.toLocaleString() + " out · about $" + usd.toFixed(3) +
    (PROXY ? " against the shared budget" : " on your key") +
    (claudeCfg.budget ? " · shared spend today $" + claudeCfg.budget.spentToday.toFixed(3) +
      " of $" + claudeCfg.budget.dailyBudget.toFixed(2) : "");
}
$("#btnClaude").addEventListener("click", function () {
  $("#apiKey").value = claudeCfg.key || "";
  $("#modelSel").value = claudeCfg.model || "claude-haiku-4-5";
  claudePanes(); openModal("#claudeModal");
});
$("#autoBrief").addEventListener("change", function (e) {
  claudeCfg.auto = e.target.checked; claudeSaveCfg(); render();
});
$("#briefLead").addEventListener("change", function (e) {
  claudeCfg.lead = parseInt(e.target.value, 10) || 2; claudeSaveCfg(); render();
});
$("#claudeClose").addEventListener("click", function () { closeModal("#claudeModal"); });
$("#keyReveal").addEventListener("click", function () {
  // Toggles the mask, not the input type — see the note on #apiKey in app.html.
  var el = $("#apiKey"), shown = el.classList.toggle("revealed");
  $("#keyReveal").textContent = shown ? "Hide" : "Show";
});
$("#keySave").addEventListener("click", function () {
  claudeCfg.key = $("#apiKey").value.trim();
  claudeCfg.model = $("#modelSel").value;
  claudeSaveCfg(); claudePanes();
});
$("#keyClear").addEventListener("click", function () {
  claudeCfg = {}; claudeSaveCfg(); $("#apiKey").value = ""; claudePanes();
});
$("#keyEdit").addEventListener("click", function () {
  $("#claudeSetup").classList.remove("hidden"); $("#claudeAsk").classList.add("hidden");
});
$$("#claudeAsk .pill").forEach(function (el) {
  el.onclick = function () {
    var q = {
      brief: "__BRIEF__",
      compare: "Compare the top two available players for my situation. Which one, and why?",
      roster: "Look at my roster and tell me what shape it's in and what I should be hunting for.",
      risk: "What is this board's blind spot right now? What would a sharp opponent do that I'm not seeing?"
    }[el.dataset.q];
    if (q === "__BRIEF__") {
      closeModal("#claudeModal");
      delete briefCache[A.myNext];
      claudeCfg.auto = true; claudeSaveCfg();
      return renderBrief();
    }
    $("#claudeQ").value = q; askClaude();
  };
});
$("#claudeGo").addEventListener("click", askClaude);

/**
 * What every other team has drafted. Each recorded pick is attributed to the
 * team that was on the clock, so opponent rosters come for free — and knowing
 * that the two teams ahead of you both still need a running back says more
 * about who survives than raw ADP does.
 */
function opponentRosters() {
  var byTeam = {};
  S.picks.forEach(function (p) {
    var pl = A.byName[p.name]; if (!pl) return;
    (byTeam[p.slot] = byTeam[p.slot] || []).push(pl);
  });
  return byTeam;
}

/** The teams picking between now and your next turn, and what they still need. */
function teamsAhead() {
  if (!A.myNext) return [];
  var rosters = opponentRosters(), r = S.league.rules.roster, out = [];
  for (var pk = A.cur; pk < A.myNext; pk++) {
    var slot = ownerOfPick(pk).slot;
    if (slot === S.league.slot) continue;
    var have = {};
    (rosters[slot] || []).forEach(function (p) { have[p.pos] = (have[p.pos] || 0) + 1; });
    var short = ["QB", "RB", "WR", "TE", "K", "DEF"].filter(function (pos) {
      return (have[pos] || 0) < (r[pos] || 0);
    });
    out.push({ pick: pk, slot: slot,
               roster: (rosters[slot] || []).map(function (p) { return p.pos; }).join("/") || "empty",
               needs: short.join(", ") || "starters full" });
  }
  return out;
}

/** Everything Claude sees. Numbers only — it never re-derives the scoring. */
function claudeContext() {
  var top = A.avail.slice().sort(function (a, b) { return b.comp - a.comp; }).slice(0, 12);
  var lines = top.map(function (p) {
    return "- " + p.name + " (" + p.pos + " " + p.team + ", bye " + p.bye + "): " +
      Math.round(p.pts) + " pts in this league, VOR " + Math.round(p.vor) +
      ", ADP " + p.adp + ", chance he is still there at my FOLLOWING pick (" +
      (A.myAfter || A.myNext) + ") is " +
      Math.round(p.survNext * 100) + "%, composite " + Math.round(p.comp) +
      (p.tag ? ", flagged " + p.tag : "") +
      (p.note ? ". Research note: " + p.note : "");
  }).join("\n");
  var roster = A.roster.slots.map(function (s) {
    return s.pos + ": " + (s.player ? s.player.name + " (" + s.player.pos + ", bye " + s.player.bye + ")" : "empty");
  }).join("; ");
  var needs = Object.keys(A.need).map(function (k) {
    return k + " " + A.need[k].have + "/" + A.need[k].starters;
  }).join(", ");
  var runs = Object.keys(A.runInfo.runs);
  return [
    "LEAGUE: " + (S.league.rules.name || "custom") + ", " + S.league.teams + " teams, I pick at slot " + S.league.slot + ".",
    "SCORING THAT DIFFERS FROM DEFAULT: " + scoringHighlights(),
    "DRAFT STATE: pick " + A.cur + " of " + (S.league.teams * S.league.rounds) +
      ", round " + A.onClock.round + ". My next pick is " + A.myNext +
      (A.myAfter ? ", then " + A.myAfter + " (" + (A.myAfter - A.myNext) + " picks apart)" : "") + ".",
    runs.length ? "RUN IN PROGRESS: " + runs.join(", ") : "",
    "MY ROSTER: " + roster,
    "STARTERS FILLED: " + needs,
    "TOP AVAILABLE BY THE BOARD'S OWN SCORE:\n" + lines
  ].filter(Boolean).join("\n\n");
}
function scoringHighlights() {
  var r = S.league.rules, out = [];
  if (r.receiving.perReception) out.push(r.receiving.perReception + " pt per reception");
  if (r.passing.td !== 4) out.push(r.passing.td + " pt passing TD");
  if (r.passing.bonus400) out.push("yardage bonuses at 400/500 pass, 150/200 rush and rec");
  if (r.passing.comp40plus || r.receiving.rec40plus) out.push("40+ yard play and TD bonuses");
  if (r.misc.returnYardsPerPoint) out.push("return yards at 1 pt per " + r.misc.returnYardsPerPoint);
  if (r.dst.pa0 > 12) out.push("boosted D/ST points-allowed tiers (" + r.dst.pa0 + " for a shutout, " +
    r.dst.pa7_13 + " for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th");
  return out.join("; ") || "nothing unusual";
}

var SYSTEM =
  "You are a fantasy football draft advisor sitting next to the user during a live draft. " +
  "You will be given the current state of their board, computed by a scoring engine that " +
  "already applies their exact league rules. Trust those numbers — do not recompute them and " +
  "do not substitute generic consensus rankings. Your job is judgement on top of the math: " +
  "where the board's logic is thin, what the research notes actually imply, and what an " +
  "opponent might do next. Be direct and brief — under 150 words unless asked for more. " +
  "No preamble, no bullet-point sprawl, no restating the question. If the board looks right, " +
  "say so in a sentence and add the one thing it doesn't know.";

/**
 * One transport for every Claude call. Prefers the shared proxy, which holds the
 * key as a Cloudflare secret and pins the model and answer length server-side;
 * falls back to a key the user pasted in themselves.
 */
function claudeCall(question, systemOverride, maxTokens) {
  var body = {
    system: systemOverride || SYSTEM,
    messages: [{ role: "user", content: question }],
    max_tokens: maxTokens || 700
  };
  var url, headers = { "content-type": "application/json" };

  if (PROXY) {
    url = PROXY;
  } else {
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = claudeCfg.key;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
    body.model = claudeCfg.model || "claude-haiku-4-5";
  }

  return fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body) })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error((res.j.error && res.j.error.message) || "Request failed.");
      var u = res.j.usage || {};
      var s = claudeCfg.spend || { calls: 0, in: 0, out: 0 };
      s.calls++; s.in += u.input_tokens || 0; s.out += u.output_tokens || 0;
      claudeCfg.spend = s;
      if (res.j.budget) claudeCfg.budget = res.j.budget;
      claudeSaveCfg(); renderSpend();
      var text = (res.j.content || []).filter(function (b) { return b.type === "text"; })
                   .map(function (b) { return b.text; }).join("\n").trim();
      // Thinking tokens count against the budget, so a long answer can come back
      // truncated — or, if reasoning ate the lot, with no text block at all.
      if (!text) throw new Error(
        "The model used its whole token budget reasoning and returned nothing. Ask again, " +
        "or ask for something shorter.");
      if (res.j.stop_reason === "max_tokens") text += "\n\n[cut off at the token limit]";
      return text;
    });
}

function askClaude() {
  var q = $("#claudeQ").value.trim();
  if (!q) return;
  if (!claudeReady()) { claudePanes(); return; }
  var out = $("#claudeOut");
  out.classList.remove("hidden"); out.classList.remove("err");
  out.querySelector(".claude-out").innerHTML = '<span class="spinner"></span> thinking…';
  $("#claudeGo").disabled = true;

  claudeCall(claudeContext() + "\n\nQUESTION: " + q)
    .then(function (text) { out.querySelector(".claude-out").textContent = text; })
    .catch(function (err) {
      out.classList.add("err");
      out.querySelector(".claude-out").textContent = err.message;
    })
    .then(function () { $("#claudeGo").disabled = false; });
}

/* ------------------------------------------------------- the on-deck brief */

// Cached against the pick number it was written for, so it is asked once and
// survives re-renders, undo and reload without spending again.
var briefCache = {};

/**
 * The question that earns its keep. Everything in here is either computed by the
 * board or known only because we track who drafted what — in particular, what
 * the teams picking between now and your turn still need, which is the part raw
 * ADP cannot tell you.
 */
function briefQuestion() {
  var ahead = teamsAhead();
  var aheadLines = ahead.length
    ? ahead.map(function (t) {
        return "  pick " + t.pick + " — team " + t.slot + " has " + t.roster +
               ", still needs " + t.needs;
      }).join("\n")
    : "  (you are on the clock now)";

  return claudeContext() + "\n\nTEAMS PICKING BEFORE YOU:\n" + aheadLines +
    "\n\nQUESTION: I am about to be on the clock at pick " + A.myNext +
    ". Give me the call before the timer starts.\n" +
    "Answer in exactly this shape, no headings, no bullets:\n" +
    "Line 1 — the player you would take, and nothing else on that line.\n" +
    "Then two or three sentences on why, grounded in my open roster slots, the " +
    "board's numbers and anything the research notes flag.\n" +
    "Last line — start it with \"If gone:\" and name one fallback in a single clause. " +
    "Do not quote survival percentages on that line; a fallback is by definition " +
    "the player you take when the first one is already gone.\n" +
    "Under 110 words total. If the board's top pick is right, say so plainly and " +
    "spend your words on what it cannot see.";
}

function renderBrief() {
  var el = $("#brief");
  if (!claudeReady() || !claudeCfg.auto || !A.myNext) { el.innerHTML = ""; return; }

  var gap = A.myNext - A.cur;
  if (gap > (claudeCfg.lead || 2)) { el.innerHTML = ""; return; }

  var cached = briefCache[A.myNext];
  if (cached === undefined) {
    briefCache[A.myNext] = null;                     // in flight; don't ask twice
    el.innerHTML = '<div class="rec top"><div class="eyebrow" style="margin-bottom:6px">' +
      'Claude · on deck for pick ' + A.myNext + '</div>' +
      '<div class="claude-out"><span class="spinner"></span> reading the board…</div></div>';
    var forPick = A.myNext;
    claudeCall(briefQuestion())
      .then(function (text) { briefCache[forPick] = text; })
      .catch(function (err) { briefCache[forPick] = "!" + err.message; })
      .then(function () { if (A.myNext === forPick) renderBrief(); });
    return;
  }
  if (cached === null) return;                       // still waiting; leave the spinner

  var failed = cached.charAt(0) === "!";
  var body = failed ? cached.slice(1) : cached;
  var lines = body.split("\n").filter(function (l) { return l.trim(); });
  var head = failed ? "" : lines.shift();

  el.innerHTML = '<div class="rec top' + (failed ? " brief-failed" : "") + '">' +
    '<div class="eyebrow" style="margin-bottom:6px">Claude · on deck for pick ' + A.myNext + "</div>" +
    (failed
      ? '<div class="claude-out">Claude is unavailable: ' + esc(body) +
        ' <span class="dimtext">The board below is unaffected.</span></div>'
      : '<div class="rec-head"><span class="name">' + esc(head) + "</span></div>" +
        '<div class="claude-out">' + esc(lines.join("\n")) + "</div>") +
    '<div class="rec-actions"><button class="btn btn-sm btn-ghost" id="briefAgain">Ask again</button></div>' +
  "</div>";
  $("#briefAgain").onclick = function () { delete briefCache[A.myNext]; renderBrief(); };
}

/* ------------------------------------------------------------------- boot */

/**
 * GitHub Pages serves this page with max-age=600. A browser holding the old HTML
 * keeps running it — and the ?v= stamps live *inside* that HTML, so they are
 * stale too and cannot bust anything. Re-fetch the config past the cache and, if
 * the deployed build has moved on, offer a reload to a URL the cache has never
 * seen. Nothing here blocks the board if it fails.
 */
function checkForUpdate() {
  var mine = (globalThis.DRAFTLINE_CONFIG || {}).build;
  if (!mine) return;
  fetch("assets/config.js?bust=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (text) {
      if (!text) return;
      var m = text.match(/build:\s*"([^"]+)"/);
      if (!m || m[1] === mine) return;
      var el = document.createElement("div");
      el.className = "statusbar soon";
      el.innerHTML = "<span>A newer version of Draftline is deployed (" + esc(m[1]) +
        "; you are on " + esc(mine) + "). Your draft is saved and will survive the reload." +
        "</span><span class='grow'></span>" +
        '<button class="btn btn-sm btn-primary" id="doUpdate">Reload</button>';
      $("#statusBar").insertAdjacentElement("afterend", el);
      $("#doUpdate").onclick = function () {
        location.replace(location.pathname + "?v=" + m[1]);
      };
    })
    .catch(function () { /* offline is the normal case at draft time */ });
}

syncKeepers();
if (S.league.pickSeconds) $("#pickSecs").value = S.league.pickSeconds;
render();
tickClock();
checkForUpdate();
if (!S.picks.length && !localStorage.getItem(KEY_STATE)) openSetup();
save();
$("#search").focus();
})();
