/* DRAFTLINE app — draft room UI. Reads engine.js for every number it shows. */
(function () {
"use strict";

var E = DRAFTLINE_ENGINE, PRESETS = DRAFTLINE_PRESETS, DATA = DRAFTLINE_DATA, AUTH = DRAFTLINE_AUTH;
var SYNC = globalThis.DRAFTLINE_SYNC || null;
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

/* Touch is a device fact, not a width. Read it once, put it on the body, and let
   both the stylesheet and the generated row template key on the same flag —
   they describe one grid between them, and a media query on one side with a
   width test on the other is how the row actions ended up with no track to sit
   in. An iPad in landscape is 1133px wide and still has no hover. */
var IS_TOUCH = false;
try {
  IS_TOUCH = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
} catch (e) {}
document.body.classList.toggle("touch", IS_TOUCH);
if (IS_TOUCH) {
  // "Sort: least likely to last" does not fit a select sized to a phone at the
  // 16px font iOS insists on. The label above it already says what it is.
  $$("#sortBy option").forEach(function (o) {
    o.textContent = o.textContent.replace(/^Sort:\s*/, "");
  });
}

/* ---------------------------------------------------------------- session */

var me = AUTH.current();
if (!me) { location.href = "index.html"; return; }
$("#whoami").textContent = me.name;

var KEY_STATE  = "draftline.state." + me.id;
var KEY_CLAUDE = "draftline.claude." + me.id;
var KEY_SEEN   = "draftline.quickstart." + me.id;

var BY_NAME = {};
DATA.players.forEach(function (p) { BY_NAME[p.name] = p; });

/* ------------------------------------------------------------------ state */

/**
 * Two ways to run a draft.
 *
 * "live" tracks all twelve rosters: every pick is credited to whoever is on the
 * clock, which buys opponent-need inference for the Claude brief and a graded
 * league table afterwards. It costs you having to record who took each player.
 *
 * "solo" tracks only your team. You still mark players off as they go — the pool
 * has to be right or nothing downstream is — but nothing is attributed to
 * anyone. Survival and value-over-next-available still work, because those need
 * the pick *count*, not who made them.
 */
function isLive() { return (S.league.mode || "live") !== "solo"; }

/** Same normalization the bake uses, so the two name spaces line up. */
function normName(n) {
  return String(n || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.']/g, " ").replace(/-/g, " ")
    .split(/\s+/)
    .filter(function (w) { return w && ["jr", "sr", "ii", "iii", "iv", "v"].indexOf(w) < 0; })
    .join(" ");
}

/**
 * Real-draft ADP the user pasted from Yahoo, keyed by normalized name. Kept in
 * league state rather than baked, because it is their league's own view of the
 * market and it goes stale the moment they stop refreshing it.
 */
function yahooAdp() { return S.league.yahooAdp || {}; }

var MODES = {
  live: {
    name: "Live draft",
    tagline: "Track the whole league as it happens.",
    gains: ["A draft tracker: who's up, who's on deck, the last picks",
            "Every team's roster, and a graded report on all of them",
            "Claude knows what the teams picking before you still need"],
    costs: ["You record who took each player, not just that he's gone"]
  },
  solo: {
    name: "Just the board",
    tagline: "Cross players off yourself. Only your team is tracked.",
    gains: ["Nothing to do but mark a player gone",
            "Your points, value over replacement and survival odds are identical"],
    costs: ["No opponent rosters, so no league grades",
            "Claude can't see what the teams ahead of you need"]
  }
};

/**
 * What a brand new account starts on. It used to be the author's own league,
 * keeper and draft slot included, which meant a stranger's first board was
 * scored in somebody else's rules and was holding a player they had never heard
 * of. The neutral preset is the scoring consensus ADP is actually built on, so
 * it is the least wrong thing to be looking at before step one of the quick
 * start replaces it. Only used when there is no saved state at all.
 */
function defaultLeague() {
  return {
    preset: "ppr_standard",
    rules: JSON.parse(JSON.stringify(PRESETS.ppr_standard)),
    mode: "live",
    teams: 12, slot: 1, rounds: 15,
    keepers: [],
    byeTolerance: 3, defFloorRound: 7
  };
}

var S = load() || { league: defaultLeague(), picks: [] };

function load() {
  try {
    var raw = localStorage.getItem(KEY_STATE);
    var o = raw ? JSON.parse(raw) : null;
    // Every number on the board is computed from the league, so a saved draft
    // without one is not a draft. Start fresh rather than take an undefined
    // into the first render and die there.
    if (!o || !o.league || !o.league.teams || !Array.isArray(o.picks)) return null;
    return o;
  }
  catch (e) { return null; }
}
function save() {
  var raw = JSON.stringify({
    league: S.league, picks: S.picks,
    draftStarted: S.draftStarted, startedAt: S.startedAt, pickStartedAt: S.pickStartedAt,
    paused: S.paused, pausedAt: S.pausedAt, draftEnded: S.draftEnded, simulated: S.simulated,
    reportShown: S.reportShown
  });
  try { localStorage.setItem(KEY_STATE, raw); }
  catch (e) { flash("#dataMsg", "Couldn't autosave — local storage is full or blocked.", true); }
  // Local first, always: the pick is recorded before anything touches the
  // network. SYNC debounces and swallows its own failures.
  if (SYNC) SYNC.push(raw);
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
/**
 * A keeper is off the board before pick 1, not when the draft happens to reach
 * his round. This returns the ones whose pick has not come around yet, shaped
 * like the picks in the log so everything that reads the log sees them.
 *
 * They are deliberately NOT written into S.picks: that list is the draft as it
 * happened, in order, and `S.picks.length + 1` is the pick on the clock. Pushing
 * a round-5 keeper into it at pick 1 would say four rounds had already gone.
 */
function pendingKeepers() {
  // Any name already in the log is settled, keeper or not. If someone was
  // drafted for real and is also listed as a keeper, the draft is the truth —
  // otherwise the board would show one player owned by two teams at once.
  var recorded = {};
  S.picks.forEach(function (p) { if (p.name) recorded[p.name] = true; });
  return (S.league.keepers || []).filter(function (k) { return !recorded[k.name]; })
    .map(function (k) {
      var slot = k.slot || S.league.slot;
      return { pick: pickNumberFor(k.round, slot), name: k.name, slot: slot,
               mine: slot === S.league.slot, keeper: true, pending: true };
    });
}

/** The draft log plus every keeper not yet reached — who owns whom, right now. */
function allPicks() { return S.picks.concat(pendingKeepers()); }

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
  allPicks().forEach(function (p) { set[p.name] = true; });
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
  // In live mode the clock decides ownership: a pick made at your own slot is
  // yours whichever button was pressed. Without this a mis-click credited the
  // player to your slot with mine:false — he showed up on your team in Rosters
  // and nowhere on your own roster panel.
  var isMine = mine === true || (isLive() && o.slot === S.league.slot);
  S.picks.push({ pick: pick, name: name,
                 slot: isMine ? S.league.slot : o.slot, mine: isMine,
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

function analyze() {
  var rules = S.league.rules;
  rules.teams = S.league.teams;
  var board = E.buildBoard(DATA.players, rules);
  var taken = draftedNames();
  var avail = board.players.filter(function (p) { return !taken[p.name]; });
  var byName = {}; board.players.forEach(function (p) { byName[p.name] = p; });

  var picks = allPicks();
  var mine = picks.filter(function (p) { return p.mine; })
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
    currentPick: cur, nextPick: myAfter || cur, myPlayers: mine,
    strategy: activeKnobs(), stackTeams: stackTeams, handcuffTeams: handcuffTeams
  };

  // Score everyone, not just the pool. Drafted players stay in the list struck
  // through, which is what makes the shape of a run visible — the gaps in the
  // ranking are themselves the information.
  var ya = yahooAdp();
  var survTarget = (myNext && myNext > cur) ? myNext : (myAfter || myNext);
  var pickOf = {};
  picks.forEach(function (pk) { if (pk.name) pickOf[pk.name] = pk; });
  var styled = Object.keys(activeKnobs()).length > 0;
  // Scoring the whole board a second time under Balanced is what lets any pick
  // answer "how much of this is the style I chose?". It is only worth doing when
  // a style is actually active — on Balanced the two boards are the same board.
  var nctx = styled ? Object.assign({}, ctx, { strategy: {} }) : null;
  board.players.forEach(function (p) {
    var c = E.composite(p, ctx);
    p.comp = c.score; p.compDetail = c;
    p.compNeutral = nctx ? E.composite(p, nctx).score : null;
    p.surv = myNext ? E.survival(p, myNext) : 1;
    p.survNext = myAfter ? E.survival(p, myAfter) : 1;
    // What the WAIT? column asks. While you are waiting, that is your next pick;
    // once you are on the clock your next pick is this one, and "will he last
    // until now" is not a question — the horizon has to move to the pick after.
    p.survShown = survTarget ? E.survival(p, survTarget) : 1;
    p.adpDelta = (p.adp || 200) - cur;
    p.takenBy = pickOf[p.name] || null;
    var y = ya[normName(p.name)];
    if (y) {
      p.yadp = y.all;
      // Positive means the room is taking him earlier this week than it has all
      // preseason — the market moving toward him in real drafts.
      p.ytrend = (y.recent != null && y.all != null) ? +(y.all - y.recent).toFixed(1) : null;
      p.ypct = y.pct;
    }
  });

  // Board position under your style and under Balanced, so a pick can say where
  // the style moved it rather than only what it cost.
  if (styled) {
    avail.slice().sort(function (a, b) { return b.comp - a.comp; })
         .forEach(function (q, i) { q.rankStyled = i + 1; });
    avail.slice().sort(function (a, b) { return b.compNeutral - a.compNeutral; })
         .forEach(function (q, i) { q.rankNeutral = i + 1; });
  }

  // How many of his tier are still on the board. This is the number that
  // actually decides whether you can wait a round.
  var tierLeft = {};
  avail.forEach(function (q) {
    var key = q.pos + ":" + q.tier;
    tierLeft[key] = (tierLeft[key] || 0) + 1;
  });
  board.players.forEach(function (q) { q.tierLeft = tierLeft[q.pos + ":" + q.tier] || 0; });

  return { board: board, avail: avail, all: board.players, byName: byName, mine: mine, roster: roster,
           byeCounts: byeCounts, byePos: byePos,
           need: need, ctx: ctx, cur: cur, myNext: myNext, myAfter: myAfter,
           survTarget: survTarget,
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
  A = analyze();

  // Pick number, round, who is on the clock and your next pick used to be
  // repeated in the app bar, the status strip, the ticker and the tracker.
  // The status strip carries the state, the tracker carries the detail, and
  // the bar is identity and actions only.
  var total = S.league.teams * S.league.rounds;

  renderStatus();

  // Keep this short enough to never clip. The box is about 200px wide, and the
  // legend directly beneath already carries the Enter / Shift+Enter guidance
  // with the on-the-clock team named in it — a long placeholder here only
  // repeated that and then truncated mid-word.
  $("#search").placeholder = A.cur > total ? "Draft complete"
    : "Search " + A.avail.length + " available\u2026";
  renderColumnHeads();
  renderFilters(); renderList(); renderRecs(); renderRoster(); renderTurn(); renderBrief();
  renderSchedule(); renderLog(); renderRunBanner(); renderTracker();
  if (view.selected) renderDetail(view.selected);
  maybeOpenReport(total);
}

/**
 * The report is the best thing in here and it sat behind a button nobody had a
 * reason to press once the drafting was over. So the last pick opens it.
 *
 * Once, and only on a draft that actually ran out of picks — a stopped draft is
 * one you mean to resume, and reopening the report on every reload of a finished
 * one is a modal in the way rather than a feature. The flag rides in the saved
 * state so it survives a reload, and resetting the draft clears it along with
 * everything else.
 */
function maybeOpenReport(total) {
  if (A.cur <= total || S.reportShown || S.draftEnded) return;
  S.reportShown = true; save();
  // A beat, so the final pick registers on the board before the report covers
  // it — landing straight on a modal reads as a glitch rather than an ending.
  setTimeout(function () {
    if (A.cur > S.league.teams * S.league.rounds) $("#btnReport").click();
  }, 700);
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
  // The way in stays visible until a draft is actually running, and comes back
  // the moment one is reset — it is how you reach the practice run.
  $("#btnBegin").classList.toggle("hidden", !!S.draftStarted);
  $("#btnLeague").classList.toggle("hidden", !isLive());

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
  var clock = '<span class="sb-clock" id="sbClock"></span>';

  if (gap === 0) {
    el.className = "statusbar up";
    el.innerHTML = "<b>You're on the clock</b>" +
      '<span class="sb-sub">pick ' + A.cur + " · round " + A.onClock.round + "</span>" +
      "<span class='grow'></span>" + clock;
  } else if (gap !== null && gap <= 3) {
    el.className = "statusbar soon";
    el.innerHTML = "<b>" + gap + " pick" + (gap === 1 ? "" : "s") + " until you're up</b>" +
      '<span class="sb-sub">you pick at ' + A.myNext + " · round " + A.ctx.round + "</span>" +
      "<span class='grow'></span>" + clock;
  } else {
    el.className = "statusbar waiting";
    el.innerHTML = "<b>" + (isLive() ? esc(teamLabel(A.onClock.slot)) + " on the clock"
                                     : "Pick " + A.cur) + "</b>" +
      '<span class="sb-sub">pick ' + A.cur + " · round " + A.onClock.round +
        (A.myNext ? " · you pick at " + A.myNext : "") + "</span>" +
      "<span class='grow'></span>" + clock;
  }
  tickClock();
}

$("#livePick").addEventListener("input", renderStatus);

/* ------------------------------------------------- start, or practice first

   The practice run was the best thing in here and the most hidden: a button
   called "Simulate" tucked inside the tracker, which you only ever see once the
   draft is already live. Nobody finds it before draft night, which is the only
   time it is worth anything. It is a front door now, next to the real one, and
   the door explains what is behind both. */

function beginFacts() {
  var m = DATA.meta || {};
  var cov = marketCoverage();
  var out = [];
  out.push(cov.real
    ? "<b>" + cov.pct + "% of the board</b> is priced off <b>your own real Yahoo draft data</b> \u2014 " +
      cov.real + " players from completed drafts on the platform this league runs on, " +
      "leaned halfway toward where the market has moved in the last seven days. " +
      "The rest falls back to mock-draft ADP."
    : "The room is priced off <b>mock-draft ADP</b>. Paste your league's Yahoo draft " +
      "analysis page in League setup and the practice run switches to <b>real " +
      "completed-draft ADP</b> instead \u2014 the same numbers the REAL and 7DAY columns show.");
  if (m.adp_source) out.push("Mock-draft ADP: " + esc(m.adp_source) + ".");
  if (m.proj_source) out.push("Projections: " + esc(m.proj_source) + ".");
  out.push("Your picks, and the suggestions on them, use the same scoring engine the " +
    "live draft uses \u2014 there is no simpler model behind the practice run.");
  return out.map(function (t) { return "<li>" + t + "</li>"; }).join("");
}

function openBegin() {
  var m = DATA.meta || {};
  $("#beginFacts").innerHTML = beginFacts();
  var built = m.built || m.baked;
  var age = built ? Math.round((Date.now() - new Date(built + "T12:00:00").getTime()) / 864e5) : null;
  $("#beginFresh").innerHTML =
    "<b>Data last pulled " + esc(built || "unknown") + "</b>" +
    (age != null ? " \u2014 " + (age <= 0 ? "today" : age === 1 ? "yesterday" : age + " days ago") : "") +
    ". Projections, ADP, depth charts and injuries are all from that pull. " +
    (age != null && age > 7
      ? "That is old enough that news has moved since; rebuild the data before you " +
        "trust a practice run to reflect today's board."
      : "Fresh enough to rehearse against.") +
    (S.picks.length
      ? " <b>This draft already has " + S.picks.length + " pick" +
        (S.picks.length === 1 ? "" : "s") + " recorded</b> \u2014 both options carry on from there. " +
        "Use Reset draft in League setup to clear it."
      : "");
  openModal("#beginModal");
}

function startLive(practice) {
  S.draftStarted = true;
  S.startedAt = Date.now();
  S.pickStartedAt = Date.now();
  if (!S.league.pickSeconds) { S.league.pickSeconds = 120; $("#pickSecs").value = 120; }
  save();
  $("#livePick").value = String(currentPick());
  render(); tickClock();
  closeModal("#beginModal");
  if (practice) {
    if (myTurn() || (A.myNext && A.myNext === A.cur)) {
      banner("Practice run ready \u2014 the first pick is yours. Take one from the board, " +
        "then hit Simulate and the room drafts to your next pick.", true);
    } else {
      simulateToMyPick();
    }
  } else {
    var w = $("#tkWho"); if (w) w.focus();
    banner("Draft tracker is live. Record every pick as it happens and the board stays honest.");
  }
}

$("#btnBegin").addEventListener("click", openBegin);
$("#beginClose").addEventListener("click", function () { closeModal("#beginModal"); });
$("#beginPractice").addEventListener("click", function () { startLive(true); });
$("#beginLive").addEventListener("click", function () { startLive(false); });



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
        (r.mine ? '<span class="mine">you</span>' : esc(teamLabel(r.slot, true))) + "</span>" +
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
    (isLive()
      ? seg("on the clock", esc(teamLabel(A.onClock.slot, true)), A.onClock.slot === S.league.slot) +
        (onDeck ? seg("on deck", esc(teamLabel(onDeck, true)), onDeck === S.league.slot) : "")
      : seg("pick", String(A.cur))) +
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
  var out = $("#sbClock"), secs = pickSeconds();
  if (!out) return;
  if (S.paused) { out.innerHTML = '<b class="amber">paused</b>'; return; }
  if (!secs || !A || !S.pickStartedAt) { out.textContent = ""; return; }
  var elapsed = (Date.now() - S.pickStartedAt) / 1000;
  var left = secs - elapsed;
  var gap = A.myNext ? A.myNext - A.cur : null;

  if (gap === 0) {
    out.innerHTML = '<b class="' + (left < 30 ? "red" : "") + '">' + mmss(left) + "</b>" +
      '<span class="sb-lbl">left on this pick</span>';
  } else if (gap) {
    // Time left on this pick, plus a full clock for each pick between.
    var eta = Math.max(0, left) + (gap - 1) * secs;
    out.innerHTML = "<b>" + mmss(eta) + '</b><span class="sb-lbl">until you\u2019re up</span>';
  } else {
    out.textContent = "";
  }
}
setInterval(tickClock, 1000);

// Rotating an iPad changes which layout applies, and the column template is
// generated rather than declared, so it has to be rebuilt.
var resizeTimer = null;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () { if (A) { renderColumnHeads(); renderList(); } }, 150);
});
/** Pausing stops the clock only; the board and every recorded pick are untouched. */
function togglePause() {
  if (S.paused) {
    // Hand back the time that elapsed while paused, so the countdown resumes
    // where it stopped instead of jumping forward.
    if (S.pausedAt && S.pickStartedAt) S.pickStartedAt += Date.now() - S.pausedAt;
    S.paused = false; S.pausedAt = null;
  } else {
    S.paused = true; S.pausedAt = Date.now();
  }
  save(); render(); tickClock();
}

$("#pickSecs").addEventListener("input", function () {
  S.league.pickSeconds = pickSeconds();
  if (!S.pickStartedAt) S.pickStartedAt = Date.now();
  save(); tickClock();
});

/* --------------------------------------------------------- draft tracker */

/**
 * The panel Start draft actually opens. Everything needed to stay level with a
 * live draft in one place: whose pick it is, who is next, how far away you are,
 * what just went, and a box to record the pick that is happening right now
 * without hunting for it in the list of 267.
 */
function renderTracker() {
  var el = $("#tracker"), total = S.league.teams * S.league.rounds;
  if (!isLive()) { el.innerHTML = ""; return; }
  if (!S.draftStarted && !S.picks.length) { el.innerHTML = ""; return; }

  if (A.cur > total || S.draftEnded) {
    var stopped = S.draftEnded && A.cur <= total;
    el.innerHTML = '<div class="tracker done"><div class="tk-head"><b>' +
      (stopped ? "Draft stopped" : "Draft complete") + "</b>" +
      '<span class="dimtext">' + S.picks.length + " picks</span></div>" +
      '<div class="dimtext" style="font-size:12.5px;margin-bottom:9px">' +
        (stopped ? "Nothing has been lost — every pick is still recorded."
                 : "Open Report for grades and a read on every roster.") + "</div>" +
      '<div class="tk-entry">' +
        (stopped ? '<button class="btn btn-sm btn-primary" id="tkResume">Resume draft</button>' : "") +
        '<button class="btn btn-sm" id="tkReport">Open report</button>' +
        '<button class="btn btn-sm btn-danger" id="tkReset2">Start over</button>' +
      "</div>" +
      '<div class="dimtext" style="font-size:11px;margin-top:7px">Start over clears every pick ' +
      "and returns to pick 1. Your scoring, roster, keepers, team names and draft style are " +
      "kept.</div></div>";
    if ($("#tkResume")) $("#tkResume").onclick = function () {
      S.draftEnded = false; S.pickStartedAt = Date.now(); save(); render();
    };
    $("#tkReport").onclick = function () { $("#btnReport").click(); };
    armOnce($("#tkReset2"), "Start over", resetDraft);
    return;
  }

  var onMe = A.onClock.slot === S.league.slot;
  var deck = [];
  for (var i = 1; i <= 3; i++) {
    var pk = A.cur + i;
    if (pk > total) break;
    var nm = teamLabel(ownerOfPick(pk).slot, true);
    // At the turn a team picks twice in a row, and "Blitzkrieg, Blitzkrieg"
    // reads like a rendering bug rather than the snake doing its job.
    if (deck.length && deck[deck.length - 1].name === nm) deck[deck.length - 1].n++;
    else deck.push({ name: nm, n: 1 });
  }
  deck = deck.map(function (d) { return d.n > 1 ? d.name + " ×" + d.n : d.name; });
  var gap = A.myNext ? A.myNext - A.cur : null;
  var secs = pickSeconds();
  var eta = (gap && secs) ? " \u00b7 about " + mmss(gap * secs) : "";

  var recent = S.picks.slice(-6).reverse().map(function (pk) {
    var pl = BY_NAME[pk.name] || {};
    return '<div class="tk-pick' + (pk.mine ? " mine" : "") + '">' +
      '<span class="mono">' + pk.pick + "</span>" +
      '<span class="tk-team">' + esc(teamLabel(pk.slot, true)) + "</span>" +
      "<span>" + (pk.unknown ? "<i>unknown</i>"
        : '<span class="pos pos-' + (pl.pos || "K") + '">' + (pl.pos || "") + "</span> " +
          esc(pk.name)) + "</span>" +
    "</div>";
  }).join("");

  var d = drift();

  el.innerHTML =
    '<div class="tracker' + (onMe ? " up" : "") + '">' +
      '<div class="tk-head">' +
        "<b>" + (S.paused ? "Paused" :
          onMe ? "You're on the clock" : "Round " + A.onClock.round + " \u00b7 pick " + A.cur) + "</b>" +
        '<span class="tk-ctl">' +
          '<button class="btn btn-sm btn-ghost" id="tkPause">' +
            (S.paused ? "Resume" : "Pause") + "</button>" +
          '<button class="btn btn-sm btn-ghost" id="tkSim" title="Fill in opponent picks so you ' +
            'can practice the flow">Simulate</button>' +
          '<button class="btn btn-sm btn-ghost" id="tkStop">Stop</button>' +
          '<button class="btn btn-sm btn-ghost btn-danger" id="tkReset" ' +
            'title="Clear every pick and go back to pick 1. Settings are kept.">Start over</button>' +
        "</span>" +
      "</div>" +
      '<div class="tk-count dimtext">' + S.picks.length + " of " + total + " recorded" +
        (S.simulated ? " \u00b7 <span style=\"color:var(--amber)\">includes simulated picks</span>" : "") +
      "</div>" +

      '<div class="tk-grid">' +
        '<div><span class="k">on the clock</span><span class="v' + (onMe ? " me" : "") + '">' +
          esc(teamLabel(A.onClock.slot)) + "</span></div>" +
        '<div><span class="k">on deck</span><span class="v" title="' +
          esc(deck.join(", ")) + '">' +
          // Three team names never fit this column and the third was always
          // the one that got cut. Show two, and count the rest.
          (deck.length
            ? esc(deck[0]) +
              (deck.length > 1 ? ' <span class="dimtext">+' + (deck.length - 1) + "</span>" : "")
            : "—") + "</span></div>" +
        '<div><span class="k">you pick at</span><span class="v me" title="' +
          esc(A.myNext ? "Pick " + A.myNext + (gap ? ", " + gap + " picks away" + eta : "")
                       : "No picks left") + '">' +
          // The estimate is worth having and not worth a whole column; it
          // lives on the hover, which is where a number nobody reads belongs.
          (A.myNext ? A.myNext + (gap ? ' <span class="dimtext">' + gap + " away</span>" : "")
                    : "none left") +
          "</span></div>" +
      "</div>" +

      '<div class="tk-entry">' +
        '<input type="text" id="tkWho" autocomplete="off" enterkeyhint="done" ' +
          'autocorrect="off" autocapitalize="words" spellcheck="false" ' +
          'data-1p-ignore data-lpignore="true" ' +
          'placeholder="Who just went at pick ' + A.cur + '? \u2014 goes to ' +
          esc(teamLabel(A.onClock.slot)) + '">' +
        '<button class="btn btn-sm" id="tkRec">Record</button>' +
      "</div>" +
      '<div id="tkSuggest" class="tk-suggest hidden"></div>' +
      '<div class="tk-mini">' +
        '<button class="btn btn-sm btn-ghost" id="tkUnknown">Didn\u2019t catch the name</button>' +
        '<span class="tk-field"><label for="tkLive">live pick</label>' +
          '<input type="number" id="tkLive" inputmode="numeric" pattern="[0-9]*" min="1" ' +
            'autocomplete="off" placeholder="' + A.cur + '" value="' +
            esc($("#livePick").value) + '"></span>' +
        '<span class="tk-field"><label for="tkSecs">clock (s)</label>' +
          '<input type="number" id="tkSecs" inputmode="numeric" pattern="[0-9]*" min="10" ' +
            'max="600" step="5" autocomplete="off" placeholder="120" value="' +
            esc($("#pickSecs").value) + '"></span>' +
      "</div>" +

      (d ? '<div class="tk-drift">' +
            (d > 0 ? "The live draft is " + d + " pick" + (d === 1 ? "" : "s") + " ahead of this board."
                   : "This board is " + (-d) + " pick" + (d === -1 ? "" : "s") + " ahead of the live draft.") +
            (d > 0 ? ' <button class="btn btn-sm btn-primary" id="tkCatch">Catch up</button>' : "") +
           "</div>"
         : '<div class="tk-ok">In step with the live draft' +
           ($("#livePick").value ? "" : " \u2014 type the live pick number in the bar above to keep it honest") +
           "</div>") +

      '<div class="tk-recent">' + (recent || '<div class="dimtext">Nothing recorded yet.</div>') + "</div>" +
    "</div>";

  var who = $("#tkWho");
  var sugg = $("#tkSuggest");

  // A tap-friendly suggestion list. <datalist> is unreliable on iOS Safari and
  // invisible until you have typed nearly the whole name; these are plain
  // buttons that record on tap.
  function paintSuggestions() {
    var q = who.value.trim().toLowerCase();
    var hits = q.length < 2 ? [] : A.avail.filter(function (pl) {
      return pl.name.toLowerCase().indexOf(q) >= 0 || (pl.team || "").toLowerCase() === q;
    }).slice(0, 6);
    if (!hits.length) { sugg.classList.add("hidden"); sugg.innerHTML = ""; return; }
    sugg.classList.remove("hidden");
    sugg.innerHTML = hits.map(function (pl) {
      return '<button type="button" data-pick="' + esc(pl.name) + '">' +
        '<span class="pos pos-' + pl.pos + '">' + pl.pos + "</span>" +
        "<span>" + esc(pl.name) + '</span><span class="dimtext">' + pl.team +
        " \u00b7 " + n0(pl.pts) + "</span></button>";
    }).join("");
    $$("#tkSuggest button").forEach(function (b) {
      b.onclick = function () {
        who.value = ""; sugg.classList.add("hidden"); record(b.dataset.pick, false);
      };
    });
  }
  who.addEventListener("input", paintSuggestions);

  var commit = function () {
    var nm = who.value.trim();
    if (!nm) return;
    if (!BY_NAME[nm]) {
      // Accept a partial: whatever is top of the current board and matches.
      var hit = A.avail.filter(function (p) {
        return p.name.toLowerCase().indexOf(nm.toLowerCase()) >= 0;
      })[0];
      if (!hit) { banner("No available player matching \u201c" + nm + "\u201d.", true); return; }
      nm = hit.name;
    }
    who.value = "";
    sugg.classList.add("hidden");
    record(nm, false);
  };
  // The live-pick and clock fields moved here from the app bar. They write
  // through to the hidden originals so nothing else had to change, and carry
  // inputmode="numeric" so iOS opens a number pad instead of a full keyboard.
  var live = $("#tkLive");
  live.addEventListener("input", function () {
    $("#livePick").value = live.value;
    var pos = live.selectionStart;
    renderStatus(); renderTracker();
    var again = $("#tkLive");
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) {} }
  });
  var secsIn = $("#tkSecs");
  secsIn.addEventListener("input", function () {
    $("#pickSecs").value = secsIn.value;
    S.league.pickSeconds = pickSeconds();
    if (!S.pickStartedAt) S.pickStartedAt = Date.now();
    save(); tickClock();
  });

  $("#tkPause").onclick = togglePause;
  $("#tkSim").onclick = simulateToMyPick;
  $("#tkStop").onclick = function () {
    S.draftEnded = true; S.paused = false; save(); render();
  };
  armOnce($("#tkReset"), "Start over", resetDraft);
  $("#tkRec").onclick = commit;
  who.addEventListener("keydown", function (e) { if (e.key === "Enter") commit(); });
  $("#tkUnknown").onclick = function () { record(null, false); };
  if ($("#tkCatch")) $("#tkCatch").onclick = openCatchup;
}

/**
 * Back to pick one. Clears every pick and the draft's own state — the clock, the
 * pause, whether it was started or stopped, the simulated flag — and touches
 * nothing else. Scoring, roster shape, keepers, team names, draft style and
 * column choices all survive, which is what makes it safe to press when you just
 * want another run at it.
 */
function resetDraft() {
  S.picks = [];
  S.draftStarted = false;
  S.draftEnded = false;
  S.paused = false;
  S.pausedAt = null;
  S.pickStartedAt = null;
  S.simulated = false;
  S.reportShown = false;          // a fresh draft earns its ending again
  view.selected = null;
  view.rosterSlot = null;
  briefCache = {};
  $("#livePick").value = "";
  save();
  syncKeepers();   // a keeper is roster config, not a pick, so it comes straight back
  save();
  render();
  banner("Back to pick 1. League settings, keepers, team names and your draft style are all " +
    "exactly as they were.");
}

/**
 * A destructive button that asks with itself rather than with a browser dialog:
 * first press arms it, second press does it, and it disarms on its own.
 */
function armOnce(btn, label, run) {
  if (!btn) return;
  var armed = false, timer = null;
  btn.onclick = function () {
    if (armed) { clearTimeout(timer); run(); return; }
    armed = true;
    btn.textContent = "Sure?";
    btn.classList.add("armed");
    timer = setTimeout(function () {
      armed = false; btn.textContent = label; btn.classList.remove("armed");
    }, 4000);
  };
}

/**
 * The best draft position we have for a player, and how much to trust it.
 *
 * Yahoo's number comes from real completed drafts on the platform this league
 * actually runs on, which is why it is worth pasting. But Yahoo computes it
 * under STANDARD scoring — its own page says so in the first line the fixture
 * captured — and this league is full PPR. Measured against that fixture,
 * receivers sit a mean 3.15 picks later than the full-PPR mock ADP, up to 11.9
 * for Chris Olave and 7.3 for A.J. Brown, while pass-catching backs move the
 * other way (Achane +5.5) from volume backs (Barkley -7.1). This function used
 * to return Yahoo's number outright, so pasting the page imported the wrong
 * scoring system into the room model — and at slot 11 the whole night is "does
 * he last the twenty-one picks from 14 to 35", which is a question about ADP.
 *
 * So the level comes from the full-PPR mock, and Yahoo supplies only movement.
 * A player drifting five picks earlier over seven days is drifting earlier in
 * any scoring system; where he sits is not. draftanalysis.js says the same
 * thing in its own docstring: use them for movement, not as a ranking.
 *
 * We still carry how often he is drafted at all — a player taken in 40% of
 * leagues is not reliably taken at his ADP, and that is scoring-agnostic.
 */
function marketAdp(p) {
  if (p.yadp != null) {
    return { adp: p.adp - (p.ytrend || 0) * 0.5, sd: p.adp_sd,
             pct: p.ypct != null ? p.ypct : null, real: true };
  }
  return { adp: p.adp, sd: p.adp_sd, pct: null, real: false };
}

/** How much of the board the user's own real-draft data covers. */
function marketCoverage() {
  var avail = (A && A.avail) || [];
  var real = avail.filter(function (p) { return p.yadp != null; }).length;
  return { real: real, total: avail.length,
           pct: avail.length ? Math.round(real / avail.length * 100) : 0 };
}

/**
 * Fills in opponent picks so the flow can be practiced before it matters.
 *
 * The room is modeled rather than guessed: every team draws near a player's
 * real draft position with that player's own spread, respects the same position
 * caps you do, and leans into a run once one starts. It stops the moment the
 * pick is yours, which is the whole point \u2014 you make that one, then run it on.
 * Everything it records is an ordinary pick: undo works, and Reset draft in
 * League clears the lot.
 */
function simulateToMyPick() {
  if (!A.myNext) return;
  var target = A.myNext, taken = draftedNames(), added = 0, guard = 0;
  var pool = A.avail.slice();
  var counts = {};                       // per-slot position counts, as we go
  var rosters = allRosters();
  Object.keys(rosters).forEach(function (slot) {
    counts[slot] = {};
    rosters[slot].forEach(function (q) { counts[slot][q.pos] = (counts[slot][q.pos] || 0) + 1; });
  });
  var recent = S.picks.slice(-8).map(function (pk) { return A.byName[pk.name] || { pos: "?" }; });

  while (currentPick() < target && guard++ < 120) {
    var slot = ownerOfPick(currentPick()).slot;
    var cands = [];
    for (var i = 0; i < pool.length; i++) {
      if (taken[pool[i].name]) continue;
      var m = marketAdp(pool[i]);
      cands.push({ player: pool[i], adp: m.adp, sd: m.sd, pct: m.pct });
    }
    if (!cands.length) break;
    var chosen = E.roomPick(cands, null, {
      counts: counts[slot] || {}, roster: S.league.rules.roster,
      runs: E.detectRuns(recent).runs
    });
    if (!chosen) break;
    taken[chosen.name] = true;
    counts[slot] = counts[slot] || {};
    counts[slot][chosen.pos] = (counts[slot][chosen.pos] || 0) + 1;
    recent.push(chosen); if (recent.length > 8) recent.shift();
    record(chosen.name, false, true);
    added++;
  }
  S.simulated = true;
  S.pickStartedAt = Date.now();
  save(); render();
  var cov = marketCoverage();
  banner("Simulated " + added + " opponent pick" + (added === 1 ? "" : "s") +
    " up to pick " + target + " \u2014 your pick. " +
    (cov.real
      ? "Drafted against your real Yahoo draft data on " + cov.pct + "% of the board"
      : "Drafted against mock-draft ADP") +
    ", each player with his own spread. Make your pick, then hit Simulate again. " +
    "Reset draft in League before the real thing.", true);
}

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
  allPicks().forEach(function (pk) {
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

  renderTeamCards(slots, rosters);
  wireTeamNameInputs();
}

function renderTeamCards(slots, rosters) {
  $("#leagueBody").innerHTML = '<div class="teamgrid">' + slots.map(function (slot) {
    var team = rosters[slot];
    /* This was every player at a position on one wrapping line separated by
       middots, which broke names across columns and told you nothing about
       whether the team could actually field a lineup. It is the lineup now:
       one slot per row, empty slots shown as empty, bench underneath. Reading
       an opponent's holes is the entire reason to open this panel. */
    var real = team.filter(function (p) { return p.pos !== "?"; });
    var lineup = E.assignRoster(real, S.league.rules);
    var body = lineup.slots.map(function (sl) {
      var p = sl.player;
      return '<div class="tg-row' + (p ? "" : " empty") + '">' +
        '<span class="pos pos-' + sl.pos + '">' + sl.pos + "</span>" +
        (p ? '<span class="tg-n">' + esc(p.name) + "</span>" +
             '<span class="tg-b">' + (p.bye || "\u2014") + "</span>"
           : '<span class="tg-n dimtext">\u2014</span><span class="tg-b"></span>') +
      "</div>";
    }).join("");
    var bench = lineup.bench.concat(team.filter(function (p) { return p.pos === "?"; }));
    if (bench.length) {
      body += '<div class="tg-bench"><span class="tg-bk">BN</span>' +
        bench.map(function (p) {
          return '<span class="tg-bp"><i class="pos pos-' + (p.pos === "?" ? "K" : p.pos) + '">' +
            (p.pos === "?" ? "\u2013" : p.pos) + "</i>" + esc(p.name) + "</span>";
        }).join("") + "</div>";
    }
    return '<div class="teamcard' + (slot === S.league.slot ? " me" : "") + '">' +
      '<div class="tc-head">' +
        '<input class="tc-name" type="text" autocomplete="off" data-name-slot="' + slot + '" ' +
          'value="' + esc(((S.league.teamNames || [])[slot - 1] || "")) + '" ' +
          'placeholder="' + (slot === S.league.slot ? "your team" : "team " + slot) + '">' +
        '<span class="dimtext">' + (slot === S.league.slot ? "you \u00b7 " : "") +
          team.length + "</span></div>" +
      (team.length ? body : '<div class="dimtext" style="font-size:12px">nothing recorded</div>') +
    "</div>";
  }).join("") + "</div>";
}

/** Names save as they are typed — there is no reason to make this a form. */
function wireTeamNameInputs() {
  $$("#leagueBody .tc-name").forEach(function (el) {
    var commit = function () {
      var names = S.league.teamNames || [];
      names[+el.dataset.nameSlot - 1] = el.value.trim();
      S.league.teamNames = names;
      save(); render();
      $("#nameSaved").textContent = " Saved.";
      clearTimeout(el._t);
      el._t = setTimeout(function () { $("#nameSaved").textContent = ""; }, 1500);
    };
    el.addEventListener("change", commit);
    el.addEventListener("blur", commit);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") el.blur(); });
  });
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

  if (!isLive()) {
    // Nothing was tracked but this roster, so there is no league to rank against.
    // Grading it anyway would mean inventing a field of twelve.
    var r2 = E.assignRoster(A.mine, S.league.rules);
    var starters = r2.slots.filter(function (x) { return x.player; });
    $("#reportSub").textContent = A.mine.length + " player" +
      (A.mine.length === 1 ? "" : "s") + " on your roster.";
    $("#reportBody").innerHTML =
      '<div class="note">You ran this in <b>board-only</b> mode, so no opponent rosters ' +
      "exist to rank against \u2014 there is no league table here, and inventing one would be " +
      "worse than leaving it out. What follows is your roster measured against replacement " +
      "level in your own scoring.</div>" +
      '<div class="mt"><table><tr><th>Slot</th><th>Player</th>' +
        "<th class='right'>Pts</th><th class='right'>Over repl.</th><th class='right'>Bye</th></tr>" +
      r2.slots.map(function (x) {
        return "<tr><td>" + x.pos + "</td><td>" +
          (x.player ? '<span class="pos pos-' + x.player.pos + '">' + x.player.pos + "</span> " +
            esc(x.player.name) : '<span class="dimtext">empty</span>') + "</td>" +
          '<td class="right num">' + (x.player ? n0(x.player.pts) : "\u2014") + "</td>" +
          '<td class="right num">' + (x.player ? n0(x.player.vor) : "\u2014") + "</td>" +
          '<td class="right num">' + (x.player ? x.player.bye : "\u2014") + "</td></tr>";
      }).join("") +
      "<tr><td colspan='2'><b>Starting lineup</b></td>" +
        '<td class="right num"><b>' +
          n0(starters.reduce(function (a, x) { return a + x.player.pts; }, 0)) + "</b></td>" +
        "<td colspan='2'></td></tr>" +
      "</table></div>";
    return rows;
  }
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

var REPORT_SOLO_SYSTEM =
  "You are reading one fantasy manager's completed draft. Only their own roster was " +
  "tracked \u2014 there are no opponent rosters, so do NOT speculate about what rivals hold " +
  "or invent a league context. The points were computed by a scoring engine using this " +
  "league's exact rules; trust them. Write three short paragraphs, no headings, no bullets, " +
  "under 220 words: what this roster actually is; its single biggest weakness and what it " +
  "will cost; and two concrete waiver or trade moves for the first two weeks. Be direct.";

var REPORT_SYSTEM =
  "You are reading a completed or in-progress fantasy football draft for the manager who " +
  "drafted one of these teams. The grades and projected points were computed by a scoring " +
  "engine using their league's exact rules — trust them, do not recompute or re-rank. " +
  "Write four short paragraphs, no headings, no bullets, under 300 words total: what their " +
  "draft actually is (the shape of it, not a list of names); the single biggest weakness and " +
  "what it will cost them; which rival team is the real threat and why; and two concrete " +
  "waiver or trade moves to make in the first two weeks. Be specific and direct. Do not " +
  "hedge every sentence.";

$("#reportAsk").addEventListener("click", function () {
  if (!claudeReady()) { closeModal("#reportModal"); $("#btnClaude").click(); return; }
  var rows = gradeDraft(), rosters = allRosters();
  var mine = rows.find(function (r) { return r.slot === S.league.slot; });

  if (!isLive()) {
    // Nothing was tracked but this roster, so there is no league to rank against.
    // Grading it anyway would mean inventing a field of twelve.
    var r2 = E.assignRoster(A.mine, S.league.rules);
    var starters = r2.slots.filter(function (x) { return x.player; });
    $("#reportSub").textContent = A.mine.length + " player" +
      (A.mine.length === 1 ? "" : "s") + " on your roster.";
    $("#reportBody").innerHTML =
      '<div class="note">You ran this in <b>board-only</b> mode, so no opponent rosters ' +
      "exist to rank against \u2014 there is no league table here, and inventing one would be " +
      "worse than leaving it out. What follows is your roster measured against replacement " +
      "level in your own scoring.</div>" +
      '<div class="mt"><table><tr><th>Slot</th><th>Player</th>' +
        "<th class='right'>Pts</th><th class='right'>Over repl.</th><th class='right'>Bye</th></tr>" +
      r2.slots.map(function (x) {
        return "<tr><td>" + x.pos + "</td><td>" +
          (x.player ? '<span class="pos pos-' + x.player.pos + '">' + x.player.pos + "</span> " +
            esc(x.player.name) : '<span class="dimtext">empty</span>') + "</td>" +
          '<td class="right num">' + (x.player ? n0(x.player.pts) : "\u2014") + "</td>" +
          '<td class="right num">' + (x.player ? n0(x.player.vor) : "\u2014") + "</td>" +
          '<td class="right num">' + (x.player ? x.player.bye : "\u2014") + "</td></tr>";
      }).join("") +
      "<tr><td colspan='2'><b>Starting lineup</b></td>" +
        '<td class="right num"><b>' +
          n0(starters.reduce(function (a, x) { return a + x.player.pts; }, 0)) + "</b></td>" +
        "<td colspan='2'></td></tr>" +
      "</table></div>";
    return rows;
  }
  var out = $("#reportOut");
  out.classList.remove("hidden"); out.classList.remove("err");
  out.querySelector(".claude-out").innerHTML = '<span class="spinner"></span> reading the draft\u2026';
  $("#reportAsk").disabled = true;

  var table = !isLive() ? "(board-only mode \u2014 no opponent rosters were tracked)"
    : rows.map(function (r) {
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
    isLive() ? REPORT_SYSTEM : REPORT_SOLO_SYSTEM, 4000)
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

/** Empty the diff panel and drop the selection highlight with it. */
function clearStyleDiff() {
  var d = $("#styleDiff");
  d.innerHTML = ""; d.className = "";
  $$("#styleList .stylecard").forEach(function (o) { o.classList.remove("sel"); });
}

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
  // activeKnobs() falls the league's own bye tolerance in behind whatever the
  // style says, so the "after" side has to do it too. Without this every style
  // that stays silent on bye tolerance reported it as a change to nothing —
  // a row in the diff for something that does not move.
  if (S.league.byeTolerance && after.byeTolerance == null)
    after.byeTolerance = S.league.byeTolerance;

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

  var host = $("#styleDiff");
  host.className = "panel mt styleopen";
  host.innerHTML =
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
    save(); renderStyleList(); clearStyleDiff(); render();
    banner("Draft style is now " + styleName() + ". The board has re-ranked.");
  };
  $("#styleCancel").onclick = clearStyleDiff;
}

/* ------------------------------------------------------------ mock drafts

   Answers the question a list of style names cannot: what does this actually
   leave me holding? Runs the draft out from wherever it currently stands
   against the same modeled room the live practice run uses — real
   completed-draft ADP where the user has pasted it, each player drawn with his
   own standard deviation, opponents held to the same position caps — and the
   user's own picks chosen by the style's composite score.

   The honest caveat, surfaced in the UI: nobody in the modeled room is chasing
   their own team's players, and no team in it is reading the room the way a
   human does.

   The first version also skipped value-over-next-available to save time, which
   turned out to be a much worse shortcut than it sounded: without it there is
   nothing stopping the engine taking the position with the fattest raw VOR over
   and over, so every style produced the same running-back-heavy roster. It is
   computed properly here, and the styles separate as they should.

   Both styles in a comparison are handed the identical sequence of opponent
   picks, from a seeded generator reset per style, so a difference between them is
   the style and not the dice. */

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runMock(knobs, iterations, seed) {
  var rules = S.league.rules;
  var board = E.buildBoard(DATA.players, rules);
  var byName = {}; board.players.forEach(function (q) { byName[q.name] = q; });
  var adpOrder = board.players.slice().sort(function (a, b) { return a.adp - b.adp; });
  // Carry the user's own real-draft data onto this board. The mock builds its
  // own copy of the players, and without this the modeled room would fall back
  // to mock ADP while the live board in front of them is using real ADP.
  var ya = yahooAdp();
  board.players.forEach(function (q) {
    var y = ya[normName(q.name)];
    if (!y) return;
    q.yadp = y.all; q.ypct = y.pct;
    q.ytrend = (y.recent != null && y.all != null) ? +(y.all - y.recent).toFixed(1) : null;
  });
  var total = S.league.teams * S.league.rounds;
  var startPick = currentPick();
  var seededTaken = draftedNames();
  var seededMine = A.mine.slice();
  var runs = [];

  for (var it = 0; it < iterations; it++) {
    var rnd = mulberry32(seed + it * 7919);
    var taken = Object.assign({}, seededTaken);
    var mine = seededMine.slice();
    var oppCounts = {};
    // What every other team already holds, so the modeled room starts the
    // simulation from the real draft rather than from an empty league.
    var known = allRosters();
    Object.keys(known).forEach(function (sl) {
      if (+sl === S.league.slot) return;
      oppCounts[sl] = {};
      known[sl].forEach(function (q) { oppCounts[sl][q.pos] = (oppCounts[sl][q.pos] || 0) + 1; });
    });

    for (var pk = startPick; pk <= total; pk++) {
      var k = keeperAt(pk);
      if (k) {
        taken[k.name] = true;
        // seededMine came from A.mine, which already holds a pending keeper —
        // he is off the board from pick 1, not when the draft reaches him. Adding
        // him again here gave every simulated roster two Drake Mayes: the style
        // card reported QB 2, and depthCap("QB") = 2 then blocked the mock from
        // ever taking a real backup, so it could not show what one would cost.
        if (ownerOfPick(pk).slot === S.league.slot && byName[k.name] &&
            !mine.some(function (q) { return q.name === k.name; })) mine.push(byName[k.name]);
        continue;
      }
      if (ownerOfPick(pk).slot === S.league.slot) {
        var avail = board.players.filter(function (q) { return !taken[q.name]; });
        // Value-over-next-available has to be in here. Without it the mock has no
        // reason not to keep taking the position with the fattest raw VOR, and it
        // hoards running backs regardless of the style — which is exactly the
        // behavior VONA exists to prevent on the live board.
        var later = myPickNumbers().filter(function (x) { return x > pk && !keeperAt(x); });
        var nextMine = later[0] || null;
        var need = E.positionalNeed(mine, rules);
        var byeCounts = {};
        E.assignRoster(mine, rules).slots.forEach(function (sl) {
          if (sl.player) byeCounts[sl.player.bye] = (byeCounts[sl.player.bye] || 0) + 1;
        });
        var stack = {}, cuffs = {};
        mine.forEach(function (q) {
          if (q.pos === "QB") stack[q.team] = true;
          if (q.pos === "RB") cuffs[q.team] = true;
        });
        var ctx = {
          rules: rules, round: ownerOfPick(pk).round, rounds: S.league.rounds,
          need: need, byeCounts: byeCounts,
          byeTolerance: knobs.byeTolerance || S.league.byeTolerance || 3,
          defFloorRound: S.league.defFloorRound || 7,
          kFloorRound: Math.max(1, S.league.rounds - 1),
          vona: nextMine ? E.expectedBestAvailable(avail, nextMine) : null,
          runs: {}, replacement: board.replacement,
          currentPick: pk, nextPick: nextMine || pk, myPlayers: mine, strategy: knobs,
          stackTeams: stack, handcuffTeams: cuffs
        };
        var best = null, bestScore = -1e9;
        for (var i = 0; i < avail.length; i++) {
          var sc = E.composite(avail[i], ctx).score;
          if (sc > bestScore) { bestScore = sc; best = avail[i]; }
        }
        if (best) { taken[best.name] = true; mine.push(best); }
      } else {
        // The same modeled room the live Simulate drafts against, on the same
        // numbers: real completed-draft ADP where the user has it, each player
        // with his own spread, opponents obeying the same position caps. A
        // seeded generator so two styles get the identical sequence.
        var oslot = ownerOfPick(pk).slot;
        var cands = [];
        for (var j = 0; j < adpOrder.length; j++) {
          if (taken[adpOrder[j].name]) continue;
          var m = marketAdp(adpOrder[j]);
          cands.push({ player: adpOrder[j], adp: m.adp, sd: m.sd, pct: m.pct });
        }
        if (!cands.length) break;
        var chosen = E.roomPick(cands, rnd, {
          counts: oppCounts[oslot] || (oppCounts[oslot] = {}), roster: rules.roster
        });
        if (!chosen) break;
        taken[chosen.name] = true;
        oppCounts[oslot][chosen.pos] = (oppCounts[oslot][chosen.pos] || 0) + 1;
      }
    }
    runs.push(mine);
  }
  return summarizeMock(runs, rules);
}

function summarizeMock(runs, rules) {
  var slotCounts = [], totals = [], posCounts = {}, own = {};
  runs.forEach(function (mine) {
    mine.forEach(function (q) { own[q.name] = (own[q.name] || { pos: q.pos, n: 0 }); own[q.name].n++; });
    var r = E.assignRoster(mine, rules);
    var pts = 0;
    r.slots.forEach(function (sl, i) {
      slotCounts[i] = slotCounts[i] || { pos: sl.pos, names: {} };
      if (sl.player) {
        slotCounts[i].names[sl.player.name] = (slotCounts[i].names[sl.player.name] || 0) + 1;
        pts += sl.player.pts;
      }
    });
    totals.push(pts);
    var seen = {};
    mine.forEach(function (q) { seen[q.pos] = (seen[q.pos] || 0) + 1; });
    Object.keys(seen).forEach(function (pos) {
      (posCounts[pos] = posCounts[pos] || []).push(seen[pos]);
    });
  });

  totals.sort(function (a, b) { return a - b; });
  var median = totals.length ? totals[Math.floor(totals.length / 2)] : 0;

  // Two WR slots drawing from the same pool will both have the same modal name,
  // which reads as though you drafted him twice. Once a name has taken a slot it
  // is not offered to the next one.
  var used = {};
  var slots = slotCounts.map(function (sc) {
    var ranked = Object.keys(sc.names)
      .filter(function (n) { return !used[n]; })
      .sort(function (a, b) { return sc.names[b] - sc.names[a]; });
    var best = ranked[0];
    if (best) used[best] = true;
    return { pos: sc.pos, name: best || null,
             pct: best ? Math.round(sc.names[best] / runs.length * 100) : 0,
             distinct: Object.keys(sc.names).length };
  });

  var comp = {};
  Object.keys(posCounts).forEach(function (pos) {
    var arr = posCounts[pos].slice().sort(function (a, b) { return a - b; });
    comp[pos] = arr[Math.floor(arr.length / 2)];
  });

  return { slots: slots, median: median, comp: comp, runs: runs.length, own: own,
           low: totals[0] || 0, high: totals[totals.length - 1] || 0 };
}

function mockCard(key, res) {
  var st = STRATS[key] || { name: "Custom" };
  var comp = ["QB", "RB", "WR", "TE", "K", "DEF"]
    .filter(function (pos) { return res.comp[pos]; })
    .map(function (pos) { return '<span class="mk-c">' + pos + " " + res.comp[pos] + "</span>"; })
    .join("");
  return '<div class="mockcard"><div class="mk-head"><b>' + esc(st.name) + "</b>" +
      '<span class="mono">' + n0(res.median) + " pts</span></div>" +
    '<div class="mk-comp">' + comp + "</div>" +
    '<table class="mk-tbl">' + res.slots.map(function (sl) {
      return "<tr><td>" + sl.pos + "</td><td>" +
        (sl.name ? esc(sl.name) : '<span class="dimtext">empty</span>') + "</td>" +
        '<td class="right dimtext">' + (sl.name ? sl.pct + "%" : "") + "</td></tr>";
    }).join("") + "</table>" +
    '<div class="dimtext" style="font-size:11px;margin-top:7px">Starting lineup ' +
      n0(res.low) + "–" + n0(res.high) + " across " + res.runs + " drafts. The percentage is " +
      "how often that player filled the slot.</div></div>";
}

/* What the two styles actually disagree about.
   The card above each roster shows the modal starting lineup — the name that
   filled a slot most often across the runs — and that is the view least likely
   to separate two styles: they can differ in a third of their picks and still
   share nine modal starters, because the picks they differ on are the ones
   further down the board. It made two genuinely different styles read as the
   same draft, which was the complaint and was not a fair summary of the runs.
   This reads the whole roster rather than the starting nine and names the
   players one style ends up holding and the other does not. */
function mockDivergence(keyA, resA, keyB, resB) {
  var names = {};
  Object.keys(resA.own).forEach(function (n) { names[n] = true; });
  Object.keys(resB.own).forEach(function (n) { names[n] = true; });

  var rows = Object.keys(names).map(function (n) {
    var a = resA.own[n], b = resB.own[n];
    return { name: n, pos: (a || b).pos,
             a: a ? a.n / resA.runs : 0, b: b ? b.n / resB.runs : 0 };
  }).filter(function (r) {
    // A name either style lands on almost every time is common ground, however
    // the arithmetic rounds. Only a real split is worth a line.
    return Math.abs(r.a - r.b) >= 0.25;
  }).sort(function (x, y) {
    return Math.abs(y.a - y.b) - Math.abs(x.a - x.b);
  }).slice(0, 8);

  var nameA = esc((STRATS[keyA] || {}).name || "A"), nameB = esc((STRATS[keyB] || {}).name || "B");
  if (!rows.length)
    return '<div class="note mt">On this board, from where you are sitting, <b>' + nameA +
      "</b> and <b>" + nameB + "</b> build the same team. The early picks are decided by " +
      "value gaps neither style is large enough to overturn, and the two agree on the rest. " +
      "That is a real answer: on this board the choice between them does not matter.</div>";

  return '<div class="panel mt" style="padding:12px"><div class="eyebrow" ' +
    'style="margin-bottom:7px">Where they actually part company</div>' +
    '<table class="mk-tbl mk-diff"><tr><th>player</th><th class="right">' + nameA +
      '</th><th class="right">' + nameB + "</th></tr>" +
    rows.map(function (r) {
      var pa = Math.round(r.a * 100), pb = Math.round(r.b * 100);
      var lead = pa > pb ? "a" : "b";
      return '<tr><td><span class="pos pos-' + r.pos + '">' + r.pos + "</span> " +
        esc(r.name) + "</td>" +
        '<td class="right' + (lead === "a" ? '"><b>' : ' dimtext">') + pa + "%" +
          (lead === "a" ? "</b>" : "") + "</td>" +
        '<td class="right' + (lead === "b" ? '"><b>' : ' dimtext">') + pb + "%" +
          (lead === "b" ? "</b>" : "") + "</td></tr>";
    }).join("") + "</table>" +
    '<div class="dimtext" style="font-size:11px;margin-top:7px">How often each style ' +
    "ended up holding him, across the runs. Players both styles take at the same rate are " +
    "left out — the two agree about them.</div></div>";
}

function fillMockSelects() {
  var opts = Object.keys(STRATS).map(function (k) {
    return '<option value="' + k + '">' + esc(STRATS[k].name) + "</option>";
  }).join("");
  $("#mockA").innerHTML = opts;
  $("#mockB").innerHTML = '<option value="">— none —</option>' + opts;
  $("#mockA").value = S.league.style || "balanced";
}

$("#mockRun").addEventListener("click", function () {
  var a = $("#mockA").value, b = $("#mockB").value;
  var btn = $("#mockRun");
  btn.disabled = true; btn.textContent = "Drafting…";
  $("#mockOut").innerHTML = '<div class="note"><span class="spinner"></span> ' +
    "Running " + (b ? "50" : "25") + " mock drafts…</div>";

  // Let the spinner paint before the loop blocks the thread.
  setTimeout(function () {
    var seed = 20260908;
    var t0 = Date.now();
    var resA = runMock((STRATS[a] || {}).knobs || {}, 25, seed);
    var resB = b ? runMock((STRATS[b] || {}).knobs || {}, 25, seed) : null;
    $("#mockOut").innerHTML =
      '<div class="mockgrid">' + mockCard(a, resA) + (resB ? mockCard(b, resB) : "") + "</div>" +
      (resB ? mockDivergence(a, resA, b, resB) : "") +
      '<p class="dimtext" style="font-size:11.5px;margin-top:9px">' +
      (resB ? "Both styles got the identical sequence of opponent picks, so the difference " +
              "between them is the style rather than the dice. " : "") +
      (function () {
        var cov = marketCoverage();
        return "The room drew from " + (cov.real
          ? "<b>your own real Yahoo draft data</b> on " + cov.pct + "% of the board"
          : "mock-draft ADP") +
          ", each player with his own spread, and every team held to the same position " +
          "limits you are. What it still does not model: nobody in it is chasing their " +
          "own team's players, and no team is reading the room the way you are. ";
      })() +
      "Ran in " + (Date.now() - t0) + "ms.</p>";
    btn.disabled = false; btn.textContent = b ? "Run 50 drafts" : "Run 25 drafts";
  }, 30);
});

$("#mockA").addEventListener("change", function () {
  $("#mockRun").textContent = $("#mockB").value ? "Run 50 drafts" : "Run 25 drafts";
});
$("#mockB").addEventListener("change", function () {
  $("#mockRun").textContent = $("#mockB").value ? "Run 50 drafts" : "Run 25 drafts";
});

function renderStyleList() {
  var cur = S.league.style || "balanced";
  $("#styleList").innerHTML = Object.keys(STRATS).map(function (k) {
    var st = STRATS[k];
    return '<div class="stylecard' + (k === cur ? " on" : "") + '" data-style="' + k + '">' +
      '<div class="sc-head"><b>' + esc(st.name) + "</b>" +
        (k === cur ? '<span class="badge badge-current">current</span>' : "") + "</div>" +
      '<div class="sc-tag">' + esc(st.tagline) + "</div>" +
    "</div>";
  }).join("");
  $$("#styleList .stylecard").forEach(function (el) {
    el.onclick = function () {
      // The card has to answer the click where the click happened. The diff
      // used to render below the mock-draft panel, a full screen down, so
      // picking a style looked like it did nothing at all.
      $$("#styleList .stylecard").forEach(function (o) { o.classList.remove("sel"); });
      el.classList.add("sel");
      renderStyleDiff(el.getAttribute("data-style"), null);
      var d = $("#styleDiff");
      if (d.scrollIntoView) d.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  });
  $("#styleCurrent").textContent = "Current: " + styleName();
}

/* ------------------------------------------------------------- app bar */

$("#btnRosters").addEventListener("click", function () { $("#btnLeague").click(); });

// The visible bar carries identity and actions; everything situational lives in
// the tracker or the status strip now. Secondary actions go behind one menu so
// the bar cannot overflow on a tablet.
(function moreMenu() {
  var TARGETS = { start: "#btnStart", report: "#btnReport", style: "#btnStyle",
                  cols: "#btnCols", setup: "#btnSetup", data: "#btnData", out: "#btnOut" };
  var wrap = $("#moreMenu"), btn = $("#btnMore");

  // The app bar scrolls horizontally on a tablet, which means overflow-y:hidden,
  // which clipped this dropdown to a six-pixel sliver — it was opening correctly
  // and being cut off. Moving it to the body and positioning it fixed against the
  // button's own rect takes it out of that clipping context entirely.
  document.body.appendChild(wrap);
  function place() {
    var r = btn.getBoundingClientRect();
    wrap.style.position = "fixed";
    wrap.style.top = (r.bottom + 6) + "px";
    wrap.style.right = Math.max(8, window.innerWidth - r.right) + "px";
    wrap.style.left = "auto";
  }
  function close() { wrap.classList.add("hidden"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var nowHidden = wrap.classList.toggle("hidden");
    if (!nowHidden) place();
    btn.setAttribute("aria-expanded", nowHidden ? "false" : "true");
  });
  window.addEventListener("resize", function () { if (!wrap.classList.contains("hidden")) place(); });
  document.addEventListener("click", close);
  wrap.addEventListener("click", function (e) { e.stopPropagation(); });
  $$("#moreMenu button[data-more]").forEach(function (b) {
    b.onclick = function () { close(); var t = TARGETS[b.dataset.more]; if (t) $(t).click(); };
  });
})();

$("#btnStyle").addEventListener("click", function () {
  renderStyleList(); fillMockSelects();
  clearStyleDiff(); $("#mockOut").innerHTML = "";
  openModal("#styleModal");
});
$("#styleClose").addEventListener("click", function () { closeModal("#styleModal"); });
$("#styleRevert").addEventListener("click", function () {
  S.league.style = "balanced"; S.league.styleCustom = null; S.league.stylePrev = null;
  save(); renderStyleList(); clearStyleDiff(); render();
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
  "  riskWeight 0-2 \u2014 how heavily a RISKY player is PENALIZED. RAISE it for a\n" +
  "    cautious win-now manager; LOWER it for one happy to gamble. Mind the\n" +
  "    direction: a high riskWeight means MORE risk-averse, not more risk taken.\n" +
  "  byeTolerance 2-6 \u2014 starters allowed on one bye week before it costs\n" +
  "    points. LOWER is stricter.\n" +
  "  stackBonus / handcuffBonus 0-25 \u2014 points added for a pass-catcher on your\n" +
  "    quarterback's team, or a back behind one you already own.\n" +
  "  posBias / earlyPosBias: object keyed QB RB WR TE K DEF, each 0.4-1.6, 1 = neutral.\n" +
  "    Above 1 favors the position, below 1 avoids it. earlyPosBias applies only\n" +
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
/* Where a player's ceiling and risk grades came from. Worth saying on the
   panel that shows the arithmetic: a grade someone wrote after watching him and
   a grade inferred from the market's own disagreement are not the same claim,
   and the panel is the one place a reader is asking exactly how the number was
   arrived at. */
function gradeNote(p) {
  if (!p.ceiling && !p.risk) return "";
  return p.gradeSource === "modeled"
    ? ' <span class="dimtext">(grades modeled)</span>'
    : ' <span class="dimtext">(grades from research)</span>';
}

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
    'title="Keep drafted players in the list, struck through. A name you type is ' +
    'always searched against the whole board, drafted or not.">drafted ' +
    // Players off the board, not picks recorded. A keeper is owned from before
    // pick 1 without a pick having happened, so counting the log said "drafted
    // 0" on a board that was already a player short.
    '<span class="dimtext">' + (A.all.length - A.avail.length) + "</span></span>";
  $$("#posFilters .pill[data-pos]").forEach(function (el) {
    el.onclick = function () { view.pos = el.getAttribute("data-pos"); renderFilters(); renderList(); };
  });
  $("#pillTaken").onclick = function () {
    view.showTaken = !view.showTaken;
    try { localStorage.setItem("draftline.showTaken", view.showTaken ? "1" : "0"); } catch (e) {}
    renderColumnHeads();
  renderFilters(); renderList();
  };
  // The survival header is written by renderColumnHeads now, since which columns
  // exist is the user's choice.

  var lg = $("#rowLegend");
  if (lg) {
    // Enter and Shift+Enter mean nothing on a device with no keyboard until you
    // tap a field, and the row buttons they describe are not on the row there.
    lg.innerHTML = A.cur > S.league.teams * S.league.rounds ? ""
      : IS_TOUCH
        ? "Tap a player to draft him or mark him taken. Search, then <b>Go</b>, records the " +
          "top match to <b>" + esc(myTurn() ? "you" : onClockLabel()) + "</b>."
      : myTurn()
        ? "Your pick — <b>DRAFT</b> puts him on your roster. Enter drafts the top match."
        : "<b>" + esc(onClockShort()) + "</b> = " + esc(onClockLabel()) +
          " took him (or press Enter) · <b>TO ME</b> = he goes on your roster " +
          "(Shift+Enter) instead";
  }
}

/* --------------------------------------------------------------- columns

   Raw numbers make the reader do the interpreting, and there is no time for
   that on a two-minute clock. A percentage is a fact; "NOW" is a decision. The
   columns that can be read as a decision say so in words, and the numeric
   versions stay on the menu for anyone who prefers them.

   The menu is also the documentation — nothing here depends on hovering, which
   does not exist on a tablet. */

/* Research flags, in the reader's language rather than the industry's.

   The data keys are the vocabulary the sources use; "flag plant" is what an
   analyst calls staking their name on a player, and it means nothing at all to
   somebody looking at a draft board on a two-minute clock. The badge shows the
   plain word and carries the sentence that explains it. */
var TAGS = {
  FLAG_PLANT: "A high-conviction call — analysts are staking their name on him going " +
              "well past where the market has him, rather than a consensus ranking.",
  BREAKOUT:   "Tipped to take a big step up this season.",
  SLEEPER:    "Going later in drafts than his projection says he should.",
  RISER:      "The room has been taking him earlier than it was a week ago.",
  FALLER:     "The room has been taking him later than it was a week ago.",
  LANDMINE:   "Real downside risk at the price he is going for — the research " +
              "expects him to disappoint the pick you would spend.",
  AVOID:      "The research says pass at any price.",
  INJURY:     "Carrying an injury worth checking before you put him in a lineup."
};
function tagLabel(t) { return E.TAG_LABEL[t] || String(t).replace(/_/g, " "); }
function tagBadge(t) {
  if (!t) return "";
  return ' <span class="badge tag-' + t + '"' +
    (TAGS[t] ? ' title="' + esc(TAGS[t]) + '"' : "") + ">" + esc(tagLabel(t)) + "</span>";
}

/* ------------------------------------------------------- who took him

   "Someone else took him" put a player in the nethers: off the board, credited
   to whichever team the snake said was on the clock, and if that guess was
   wrong there was no way to say so. Which team has a player is not trivia — it
   is how you read what the room still needs, and it is the one thing the user
   can always look up on their league's own draft board.

   So: name the team. Any player, taken or not, from any row. On an available
   player it records the pick and credits the team you name. On a player already
   recorded it re-credits him, which is the repair for a catch-up run that
   guessed wrong or a mis-click three rounds ago. */

/** Move an already-recorded pick to a different team. */
function reassign(name, slot) {
  var pk = S.picks.find(function (q) { return q.name === name; });
  // A keeper the draft has not reached yet is not in the log, so the thing to
  // correct is the keeper itself — otherwise the fix silently does nothing.
  if (!pk) {
    var k = (S.league.keepers || []).find(function (q) { return q.name === name; });
    if (!k) return;
    k.slot = slot;
    save(); render();
    banner(esc(name) + " is kept by " + esc(teamTitle(slot)) + ".");
    return;
  }
  pk.slot = slot;
  pk.mine = slot === S.league.slot;
  save(); render();
  banner(esc(name) + " is now on " + esc(teamTitle(slot)) + ".");
}

/** Record a player as taken, crediting the team the user names. */
function recordTo(name, slot) {
  record(name, slot === S.league.slot);
  var pk = S.picks[S.picks.length - 1];
  if (pk && pk.name === name && pk.slot !== slot) { pk.slot = slot; pk.mine = slot === S.league.slot; save(); render(); }
}

var assignFor = null;
function openAssign(name, anchorEl, ev) {
  if (ev) ev.stopPropagation();
  if (!isLive()) { record(name, false); return; }   // solo mode has no teams
  assignFor = name;
  var already = S.picks.find(function (q) { return q.name === name; });
  var pop = $("#assignPop");
  var onClock = A.onClock ? A.onClock.slot : null;
  var rows = [];
  for (var i = 1; i <= S.league.teams; i++) rows.push(i);
  pop.innerHTML =
    '<div class="ap-head">' + esc(name) + "<span>" +
      (already ? "move to" : "went to") + "</span></div>" +
    '<div class="ap-grid">' + rows.map(function (sl) {
      var isNow = already ? already.slot === sl : false;
      return '<button class="ap-t' + (isNow ? " on" : "") +
        (!already && sl === onClock ? " suggest" : "") + '" data-slot="' + sl + '">' +
        esc(teamTitle(sl)) +
        (!already && sl === onClock ? '<span class="ap-hint">on the clock</span>' : "") +
        (isNow ? '<span class="ap-hint">now</span>' : "") + "</button>";
    }).join("") + "</div>" +
    '<div class="ap-foot">' +
      (already
        ? "Recorded at pick " + already.pick + ". Changing this does not move the pick, " +
          "only who is credited with it."
        : "Records the pick and credits that team. The team on the clock is the " +
          "safe bet if you are keeping up.") +
    "</div>";
  var r = anchorEl.getBoundingClientRect();
  pop.classList.remove("hidden");
  var w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + "px";
  pop.style.top = (r.bottom + h + 8 > window.innerHeight && r.top - h - 6 > 0
    ? r.top - h - 6 : r.bottom + 6) + "px";
  $$("#assignPop .ap-t").forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var sl = +b.dataset.slot;
      if (already) reassign(assignFor, sl); else recordTo(assignFor, sl);
      closeAssign();
    };
  });
}
function closeAssign() { assignFor = null; $("#assignPop").classList.add("hidden"); }
document.addEventListener("click", function (e) {
  if (assignFor && !e.target.closest("#assignPop")) closeAssign();
});
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAssign(); });

/* ------------------------------------------------- what the style did here

   A draft style is a set of weights, and weights are invisible. You pick "Zero
   RB", the board rearranges, and nothing tells you whether the player now at the
   top is there because he is good or because you told the engine to dislike
   running backs. So every pick carries the answer: the same player scored under
   Balanced, the difference, where he moved on the board, and which knobs of the
   style you chose actually touched him. */

/** The style's effect on one player, against Balanced. Null on Balanced. */
function styleEffect(p) {
  if (!p || p.compNeutral == null || p.takenBy) return null;
  return {
    delta: p.comp - p.compNeutral,
    from: p.rankNeutral, to: p.rankStyled,
    move: (p.rankNeutral || 0) - (p.rankStyled || 0)
  };
}

/** The knobs of the active style that actually bit on this player. */
function knobsHitting(p) {
  var k = activeKnobs(), d = p.compDetail || {}, out = [];
  var round = A.ctx.round, early = round <= (k.earlyRounds || 5);
  if (early && k.earlyPosBias && k.earlyPosBias[p.pos] != null)
    out.push([p.pos + " weighted \u00d7" + k.earlyPosBias[p.pos] + " through round " + (k.earlyRounds || 5),
              k.earlyPosBias[p.pos] > 1 ? "up" : "down"]);
  else if (k.posBias && k.posBias[p.pos] != null)
    out.push([p.pos + " weighted \u00d7" + k.posBias[p.pos] + " all draft",
              k.posBias[p.pos] > 1 ? "up" : "down"]);
  if (k.needWeight != null && k.needWeight !== 1)
    out.push([k.needWeight === 0
      ? "roster need switched off \u2014 pure best available"
      : "roster need weighted \u00d7" + k.needWeight, "flat"]);
  if (k.ceilingWeight != null && k.ceilingWeight !== 1 && Math.abs(d.ceilingAdj) > 2)
    out.push(["ceiling weighted \u00d7" + k.ceilingWeight + " (his grade " + p.ceiling + ")",
              k.ceilingWeight > 1 ? "up" : "down"]);
  if (k.riskWeight != null && k.riskWeight !== 1 && Math.abs(d.riskAdj) > 2)
    out.push(["risk weighted \u00d7" + k.riskWeight + " (his grade " + p.risk + ")",
              k.riskWeight > 1 ? "down" : "up"]);
  if (d.tagPenalty) out.push(["\u2212" + Math.round(d.tagPenalty) + " for the " +
    tagLabel(p.tag) + " flag", "down"]);
  if (k.stackBonus && d.bonus && ["WR", "TE"].indexOf(p.pos) >= 0)
    out.push(["+" + k.stackBonus + " for stacking your " + p.team + " quarterback", "up"]);
  if (k.handcuffBonus && d.bonus && p.pos === "RB")
    out.push(["+" + k.handcuffBonus + " for handcuffing your own back", "up"]);
  if (k.posFloorRound && k.posFloorRound[p.pos] != null && round < k.posFloorRound[p.pos])
    out.push(["no " + p.pos + " before round " + k.posFloorRound[p.pos], "down"]);
  if (k.byeTolerance && d.byePenalty)
    out.push(["\u2212" + Math.round(d.byePenalty) + ", over your bye tolerance of " + k.byeTolerance, "down"]);
  return out;
}

/** One-line summary for the recommendation card. */
function styleChipHtml(p) {
  var fx = styleEffect(p);
  if (!fx || (Math.abs(fx.delta) < 1 && !fx.move)) return "";
  var d = Math.round(fx.delta);
  var dir = d > 0 ? "up" : d < 0 ? "down" : "flat";
  return '<span class="sfx sfx-' + dir + '" title="' + esc(styleName() +
      " against Balanced: " + (d >= 0 ? "+" : "") + d + " on the score, board rank " +
      fx.from + " to " + fx.to) + '">' + esc(styleName()) + " " +
    (d >= 0 ? "+" : "\u2212") + Math.abs(d) +
    (fx.move ? " \u00b7 #" + fx.from + "\u2192#" + fx.to : "") + "</span>";
}

/** Survival to whichever pick the WAIT? question is actually about. */
function survShown(p) {
  return p.survShown != null ? p.survShown : (p.surv != null ? p.surv : 1);
}

var COLUMNS = {
  pts: {
    short: "PTS", label: "Projected points", w: "46px",
    desc: "Season points in YOUR scoring — bonuses, return yards and your D/ST tiers " +
          "included. The number every other column is derived from.",
    render: function (p) { return { v: n0(p.pts) }; }
  },
  posrank: {
    short: "RANK", label: "Rank at his own position", w: "50px",
    desc: "RB5 means the fifth-best back left on this board in your scoring — often " +
          "several places from where consensus has him, which is the point of the tool.",
    render: function (p) { return { v: p.pos + p.posRank, cls: "pos pos-" + p.pos }; }
  },
  tier: {
    short: "TIER", label: "Tier, and how many are left in it",
    w: "60px",
    desc: "Players grouped by the scoring cliffs at their position. Inside a tier they are " +
          "close enough to be interchangeable, so the question stops being who is best and " +
          "becomes how many are left. The bracketed number is exactly that: at (1) he is the " +
          "last of his group and waiting means dropping a whole tier.",
    render: function (p) {
      // A drafted player's tier still tells you where he sat; the "how many are
      // left" count is about the choice in front of you, so it goes.
      if (p.takenBy) return { v: "T" + p.tier, cls: "dimtext" };
      var last = p.tierLeft <= 1;
      return { v: "T" + p.tier + " <small>(" + p.tierLeft + ")</small>",
               style: last ? "color:var(--amber);font-weight:700" : "" };
    }
  },
  wait: {
    short: "WAIT?", label: "Can you afford to wait for him?", w: "64px",
    desc: "A forecast, never a draft state — nobody in this column has been taken. His " +
          "survival odds read as a decision, and which decision depends on whose pick it " +
          "is. On the clock: WAIT is better than 70% he lasts to your following pick, so " +
          "spend this one elsewhere; RISKY is a coin flip; NOW is under 35% — if you want " +
          "him it has to be this pick. While you are waiting you cannot take anyone now, so " +
          "the column answers the only question that is live: does he last to the pick named " +
          "in the header — YES, MAYBE, or NO. That pick moves when you come on the clock.",
    render: function (p) {
      var s = survShown(p);
      // Two different questions wear this column, and answering the wrong one
      // is worse than saying nothing. On the clock it is "can I wait?" and the
      // answer to no is NOW. While you are *waiting* you cannot take anybody
      // now, so NOW is meaningless — the question is "does he last until then?"
      if (myTurn()) {
        if (s >= 0.7) return { v: "wait", style: "color:var(--green)" };
        if (s >= 0.35) return { v: "risky", style: "color:var(--amber)" };
        return { v: "NOW", style: "color:var(--red);font-weight:700" };
      }
      // "there"/"gone" were read as a report of who had already been drafted.
      // Answering the header's question outright cannot be read as history.
      if (s >= 0.7) return { v: "yes", style: "color:var(--green)" };
      if (s >= 0.35) return { v: "maybe", style: "color:var(--amber)" };
      return { v: "no", style: "color:var(--red);font-weight:700" };
    }
  },
  survives: {
    short: "SURV", label: "Survival odds as a percentage", w: "48px",
    desc: "The raw number behind WAIT? — the chance he is still on the board the next time " +
          "you choose, from his own ADP standard deviation across ~7,800 mock drafts.",
    render: function (p) {
      var pct = Math.round(survShown(p) * 100);
      return { v: pct + "%", style: "color:" +
        (pct > 70 ? "var(--green)" : pct > 35 ? "var(--amber)" : "var(--red)") };
    }
  },
  value: {
    short: "VALUE", label: "Bargain or reach at this pick", w: "62px",
    desc: "His ADP against the pick on the clock, in rounds. FELL means the room has let him " +
          "slide most of a round or more past where he usually goes — that is the free " +
          "money this board exists to find. REACH means you would be taking him a round or " +
          "more early. FAIR is on schedule.",
    render: function (p) {
      var rounds = p.adpDelta / (S.league.teams || 12);
      if (rounds <= -0.75) return { v: "fell " + Math.abs(rounds).toFixed(1),
                                    style: "color:var(--green);font-weight:700" };
      if (rounds >= 1) return { v: "reach " + rounds.toFixed(1), style: "color:var(--red)" };
      return { v: "fair", style: "color:var(--dim)" };
    }
  },
  vor: {
    short: "VOR", label: "Points over replacement", w: "48px",
    desc: "Points above a player you could have for nothing at that position. It is what " +
          "makes a tight end and a running back comparable at all — 250 points means " +
          "very different things at the two.",
    render: function (p) { return { v: n0(p.vor) }; }
  },
  adp: {
    short: "ADP", label: "Average draft position", w: "44px",
    desc: "Where the market takes him across ~7,800 mock drafts. Where he goes, not where he " +
          "ought to.",
    render: function (p) { return { v: (p.adp || 0).toFixed(0), cls: "dimtext" }; }
  },
  delta: {
    short: "Δ", label: "Picks early or late (raw)", w: "44px",
    desc: "The raw number behind VALUE: his ADP minus the pick on the clock. Negative means " +
          "he is overdue.",
    render: function (p) {
      var d = p.adpDelta;
      return { v: (d > 0 ? "+" : "") + n0(d),
               style: "color:" + (d > 0 ? "var(--green)" : "var(--red)") };
    }
  },
  bye: {
    short: "BYE", label: "Bye week, and clashes with your roster", w: "38px",
    desc: "His bye week. Amber when another of your starters at that position is already out " +
          "that week; red when the position would have nobody left to start.",
    render: function (p) {
      var br = byeRisk(p);
      return { v: String(p.bye), cls: br ? "bye-" + br.level : "dimtext",
               title: br ? br.why : "" };
    }
  },
  depth: {
    short: "DEPTH", label: "Where he sits on his own depth chart", w: "54px",
    desc: "His team's depth chart slot, straight from Sleeper and refreshed with the bake. " +
          "RB1 is the starter; RB3 needs an injury in front of him to matter. This is the " +
          "single best answer to \u201chas he actually won the job\u201d, and it covers 216 " +
          "players on this board against the 84 the hand-written research layer reaches.",
    render: function (p) {
      if (!p.depth) return { v: "\u2014", cls: "dimtext" };
      var label = (p.depthPos || p.pos) + p.depth;
      return { v: label, style: "color:" +
        (p.depth === 1 ? "var(--green)" : p.depth === 2 ? "var(--muted)" : "var(--amber)") };
    }
  },
  adp2: {
    short: "SLP", label: "Sleeper's own ADP", w: "44px",
    desc: "A second ADP, computed across Sleeper's whole user base. Read it beside the main " +
          "one rather than instead of it: Sleeper mixes mock with real drafts and refreshes " +
          "once or twice a month, so it can be behind the news.",
    render: function (p) {
      if (!p.adp2) return { v: "\u2014", cls: "dimtext" };
      return { v: p.adp2.toFixed(0), cls: "dimtext" };
    }
  },
  split: {
    short: "SPLIT", label: "Where the other market disagrees", w: "56px",
    desc: "How far Sleeper's ADP sits from where players of this board ADP normally sit on " +
          "Sleeper. Negative means the other market is higher on him than his peers, positive " +
          "means lower. It is a de-drifted residual rather than a raw difference: Sleeper " +
          "ranks about 2,150 players against this board's 267, so the two lists pull apart " +
          "with depth for reasons that have nothing to do with anyone's opinion — subtracting " +
          "them directly would flag most of the late rounds as a disagreement. Even " +
          "corrected, a wide split is a question rather than an answer: Josh Jacobs reads as " +
          "a bargain over there purely because Sleeper has not absorbed his move to the " +
          "exempt list.",
    render: function (p) {
      if (p.adpResid == null) return { v: "\u2014", cls: "dimtext" };
      var d = Math.round(p.adpResid);
      if (Math.abs(d) < 12) return { v: "\u2014", cls: "dimtext" };
      return { v: (d > 0 ? "+" : "") + d,
               style: "color:" + (Math.abs(d) >= 30 ? "var(--amber)" : "var(--muted)") };
    }
  },
  yadp: {
    short: "REAL", label: "ADP from real Yahoo drafts", w: "46px",
    desc: "Where the room actually took him in completed drafts on Yahoo, as opposed to the " +
          "mock-draft ADP the rest of this board runs on. Only present for players on pages " +
          "you have pasted in, and Yahoo computes it under standard scoring rather than " +
          "yours \u2014 so read it as market behavior, not as a ranking.",
    render: function (p) {
      if (p.yadp == null) return { v: "\u2014", cls: "dimtext" };
      return { v: p.yadp.toFixed(0) };
    }
  },
  trend: {
    short: "7DAY", label: "Which way he is moving this week", w: "50px",
    desc: "Yahoo's last-seven-days ADP against its all-preseason ADP, in picks. Positive " +
          "means the room has started taking him earlier than it did all summer \u2014 " +
          "somebody has won a job, or the news has turned. This is the one genuinely live " +
          "signal on the board; everything else here is a snapshot.",
    render: function (p) {
      if (p.ytrend == null) return { v: "\u2014", cls: "dimtext" };
      if (Math.abs(p.ytrend) < 0.3) return { v: "flat", cls: "dimtext" };
      return { v: (p.ytrend > 0 ? "\u2191" : "\u2193") + Math.abs(p.ytrend).toFixed(1),
               style: "color:" + (p.ytrend > 0 ? "var(--green)" : "var(--red)") };
    }
  },
  vsstd: {
    short: "VS STD", label: "What your scoring does to him", w: "54px",
    desc: "Points your rules add or remove versus plain full PPR. This is the arbitrage the " +
          "whole tool exists for — a big positive number means the rest of your league, " +
          "drafting off consensus, is undervaluing him.",
    render: function (p) {
      var std = standardBoard()[p.name];
      if (!std) return { v: "—", cls: "dimtext" };
      var d = p.pts - std.pts;
      return { v: (d > 0 ? "+" : "") + n0(d),
               style: "color:" + (d > 20 ? "var(--green)" : d < -20 ? "var(--red)" : "var(--dim)") };
    }
  },
  risk: {
    short: "RISK", label: "Risk grade — research where there is one, modeled otherwise", w: "44px",
    desc: "0-100, where high means age, injury history, or a role that may not hold. Written " +
          "by an analyst for the players who were written up; modeled from the market's own " +
          "disagreement, depth chart and injury designation for everybody else. A modeled " +
          "grade is shown in italics.",
    render: function (p) {
      if (!p.risk) return { v: "—", cls: "dimtext" };
      return { v: String(p.risk), cls: p.gradeSource === "modeled" ? "modeled" : "",
        style: "color:" +
        (p.risk >= 70 ? "var(--red)" : p.risk >= 55 ? "var(--amber)" : "var(--dim)") };
    }
  },
  ceiling: {
    short: "CEIL", label: "Ceiling grade — research where there is one, modeled otherwise", w: "44px",
    desc: "0-100 for upside. High means he could finish far above his price. Written by an " +
          "analyst for the players who were written up; modeled from the market's own " +
          "disagreement, depth chart and how much of his projection is touchdowns for " +
          "everybody else. A modeled grade is shown in italics.",
    render: function (p) {
      if (!p.ceiling) return { v: "—", cls: "dimtext" };
      return { v: String(p.ceiling), cls: p.gradeSource === "modeled" ? "modeled" : "",
               style: "color:" + (p.ceiling >= 85 ? "var(--green)" : "var(--muted)") };
    }
  }
};

var DEFAULT_COLS = ["pts", "bye", "tier", "wait"];
/* A touch device in portrait fits three. Bye is the one to lose: it is a
   tiebreaker, and the detail card still carries it. */
var TOUCH_COLS = ["pts", "tier", "wait"];

function activeCols() {
  var c = S.league.columns;
  // Three columns on a touch device in portrait, four everywhere else. At 744px
  // the board column is about 400px; four data columns, the gaps and the padding
  // leave the name around 150px, which is where "Christian McC..." comes from.
  // Landscape is not compact, so it keeps the fourth.
  var narrow = IS_TOUCH && document.body.classList.contains("compact");
  var cap = narrow ? 3 : 4;
  // Not DEFAULT_COLS.slice(0, 3): that would drop "wait", which is the one
  // column the whole board is for on the clock, and keep "bye".
  var fallback = narrow ? TOUCH_COLS.slice() : DEFAULT_COLS.slice();
  if (!c || !c.length) return fallback;
  var ok = c.filter(function (k) { return COLUMNS[k]; }).slice(0, cap);
  return ok.length ? ok : fallback;
}

function renderColumnHeads() {
  // The grid template is generated here, so it has to decide the narrow layout
  // too — a media query that hides the rank cell cannot remove its track, and
  // the content then shifts one column left and squeezes the player's name to
  // nothing. Drop the track itself instead.
  //
  // This has to be set before activeCols() is asked anything, because how many
  // columns fit is a function of it.
  var compact = window.innerWidth < 1000;
  document.body.classList.toggle("compact", compact);
  // The rank cell is the row's position in a list you are already reading top
  // down, and on touch it is 22px the name needs more: in landscape it is the
  // difference between "Christian McCaffrey SF" and a truncation. Dropped on
  // touch in both orientations, which is why this is its own flag rather than
  // part of compact — landscape still gets its fourth data column.
  var norank = compact || IS_TOUCH;
  document.body.classList.toggle("norank", norank);
  var cols = activeCols();
  // On touch the row actions are gone from the row entirely — you act on a
  // player by tapping him — so there is no track for them and the name keeps
  // everything the columns do not take. Off touch they stay an absolutely
  // positioned hover overlay, which also needs no track. Either way the
  // template below is the whole row, and .rowacts is never a grid item.
  var tpl = (norank ? "" : "22px ") + "minmax(0,1fr) " +
    cols.map(function (k) { return COLUMNS[k].w; }).join(" ");
  var head = $(".phead");
  head.innerHTML = (norank ? "" : '<span class="c-rank"></span>') + "<span>Player</span>" +
    cols.map(function (k) {
      var c = COLUMNS[k];
      // The column asks a different question on and off the clock, and the answers
      // below already switch. The header has to switch with them or it labels the
      // wrong question — "lasts to 11?" is what yes/maybe/no are answering.
      var label = (k === "wait" && A.survTarget)
                  ? (myTurn() ? "WAIT →" : "LASTS→") + A.survTarget
                : (k === "survives" && A.survTarget) ? "→" + A.survTarget
                : c.short;
      return '<span class="num" title="' + esc(c.label) + '">' + label + "</span>";
    }).join("");
  var st = document.getElementById("colStyle");
  if (!st) {
    st = document.createElement("style"); st.id = "colStyle";
    document.head.appendChild(st);
  }
  st.textContent = ".prow,.phead{grid-template-columns:" + tpl + " !important}";
}

function renderColumnPicker() {
  var cur = activeCols();
  $("#colBody").innerHTML =
    '<div class="note">Pick up to four. Each one says what it is <em>for</em>, not just what ' +
    "it is — and this list is the explanation, so there is nothing to hover over on a " +
    "tablet.</div>" +
    '<div class="mt">' + Object.keys(COLUMNS).map(function (k) {
      var c = COLUMNS[k], on = cur.indexOf(k) >= 0;
      return '<label class="colopt' + (on ? " on" : "") + '">' +
        '<input type="checkbox" data-col="' + k + '"' + (on ? " checked" : "") + ">" +
        "<span><b>" + esc(c.label) + '</b> <span class="colshort">' + esc(c.short) + "</span>" +
        '<span class="coldesc">' + esc(c.desc) + "</span></span></label>";
    }).join("") + "</div>" +
    '<div class="mt" style="display:flex;gap:8px;align-items:center">' +
      '<button class="btn btn-sm" id="colReset">Back to the defaults</button>' +
      '<span class="dimtext" id="colMsg"></span></div>';

  $$("#colBody input[data-col]").forEach(function (cb) {
    cb.onchange = function () {
      var picked = $$("#colBody input[data-col]")
        .filter(function (x) { return x.checked; })
        .map(function (x) { return x.dataset.col; });
      if (picked.length > 4) {
        cb.checked = false;
        $("#colMsg").textContent = "Four at a time — untick one first.";
        return;
      }
      if (!picked.length) {
        cb.checked = true;
        $("#colMsg").textContent = "Keep at least one.";
        return;
      }
      S.league.columns = picked;
      save(); render(); renderColumnPicker();
    };
  });
  $("#colReset").onclick = function () {
    S.league.columns = DEFAULT_COLS.slice(); save(); render(); renderColumnPicker();
  };
}

$("#btnCols").addEventListener("click", function () {
  renderColumnPicker(); openModal("#colModal");
});
$("#colClose").addEventListener("click", function () { closeModal("#colModal"); });

function matches(p) {
  if (view.pos === "FLEX") { if (["RB","WR","TE"].indexOf(p.pos) < 0) return false; }
  else if (view.pos !== "ALL" && p.pos !== view.pos) return false;
  var q = view.q.trim().toLowerCase();
  if (!q) return true;
  return q.split(/\s+/).every(function (t) {
    return (p.name + " " + p.pos + " " + p.team + " " +
            (p.tag || "") + " " + (p.tag ? tagLabel(p.tag) : ""))
             .toLowerCase().replace(/_/g, " ").indexOf(t.replace(/_/g, " ")) >= 0;
  });
}

/**
 * The list, from the pool the two filters leave behind.
 *
 * A typed query searches the whole board, drafted players included, whatever the
 * "drafted" toggle says. The toggle is a browsing preference — how dense you
 * want the list while you scroll it — but typing a name is a lookup, and there
 * is no reading of "Drake Maye" under which the right answer is "Nobody matches
 * that". He is on a roster, and the row already knows how to say so: struck
 * through, with the team that holds him and `kept` where the pick number goes.
 */
function sortedList() {
  var searching = !!view.q.trim();
  var l = (view.showTaken || searching ? A.all : A.avail).filter(matches);
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
/** True when the pick about to be recorded belongs to you. */
function myTurn() {
  return !!(A && A.onClock && isLive() && A.onClock.slot === S.league.slot);
}

function onClockShort() {
  if (!A || !A.onClock || !isLive()) return "GONE";
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
  var tag = tagBadge(p.tag);
  // An injury designation is too important to sit behind a column toggle.
  var inj = p.injury ? ' <span class="badge inj inj-' + p.injury.replace(/[^A-Za-z]/g, "") +
    '" title="' + esc(p.injury + (p.injuryPart ? " \u2014 " + p.injuryPart : "")) + '">' +
    esc(p.injury === "Questionable" ? "Q" : p.injury) + "</span>" : "";
  var est = p.projSource === "modeled" ? ' <span class="dimtext" title="modeled, not projected">~</span>' : "";
  var surv = Math.round(survShown(p) * 100);
  var survColor = surv > 70 ? "var(--green)" : surv > 35 ? "var(--amber)" : "var(--red)";
  var t = p.takenBy;
  var br = t ? null : byeRisk(p);
  var cls = "prow" + (view.selected === p.name ? " sel" : "") +
            (t ? " taken" + (t.mine ? " by-me" : "") : "");
  var who = t ? '<span class="sub">' +
        (isLive() || t.mine ? esc(teamLabel(t.slot, true)) + " \u00b7 " : "") +
        // A keeper is owned, but the pick he will burn has not happened yet —
        // printing its number reads as a pick that already went. The round it
        // will cost is a fact rather than a claim, and it is the thing you
        // actually want to know about a name you just searched for.
        (t.keeper ? "kept R" + ownerOfPick(t.pick).round : t.pick) + "</span>" : "";
  return '<div class="' + cls + '" data-name="' + esc(p.name) + '">' +
    (document.body.classList.contains("compact") ? "" :
      '<span class="rank">' + (i + 1) + "</span>") +
    '<span class="nm"><span class="pos pos-' + p.pos + '">' + p.pos + "</span> " + esc(p.name) +
      '<span class="sub">' + p.team + "</span>" + inj + tag + who + "</span>" +
    activeCols().map(function (k) {
      var c = COLUMNS[k].render(p);
      var blankWhenTaken = (k === "wait" || k === "survives" || k === "value");
      return '<span class="num ' + (c.cls || "") + '"' +
        (c.style && !t ? ' style="' + c.style + '"' : "") +
        (c.title ? ' title="' + esc(c.title) + '"' : "") + ">" +
        (t && blankWhenTaken ? "\u2014" : c.v) + (k === "pts" ? est : "") + "</span>";
    }).join("") +
    // A taken player keeps one action: name the team that has him. Which team
    // holds a player is how you read what the room still needs, and a guess
    // three rounds ago should not be permanent.
    (t
      ? '<span class="rowacts">' + (isLive()
          ? '<button data-act="assign" title="Change which team is credited with him">' +
            "move</button>" : "") + "</span>"
      : '<span class="rowacts">' +
          (myTurn()
            ? ""   // your pick: "someone else took him" isn't a thing that can happen
            : '<button data-act="gone" title="' + esc(onClockLabel()) +
              ' took him — off the board">' + esc(onClockShort()) + "</button>" +
              (isLive()
                ? '<button data-act="assign" title="Somebody else took him — name which team">' +
                  "who?</button>" : "")) +
          '<button class="mine" data-act="mine" title="' +
            (myTurn() ? "Draft him" : "I took him") + ' — onto your roster">' +
            (myTurn() ? "DRAFT" : "TO ME") + "</button>" +
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
      b.onclick = function (e) {
        e.stopPropagation();
        if (b.dataset.act === "assign") { openAssign(name, b, e); return; }
        record(name, b.dataset.act === "mine");
      };
    });
    el.onclick = function (e) {
      // A taken player has one action — re-credit him — and on touch there is no
      // row button left to carry it, so the row itself is the button. Off touch
      // the "move" overlay still does this and the row stays inert.
      if (taken) { if (IS_TOUCH && isLive()) openAssign(name, el, e); return; }
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
  $("#recCtx").textContent = waiting
    ? "round " + A.ctx.round + " \u00b7 " + (A.myNext - A.cur) + " away" +
      (A.myAfter ? " \u00b7 then " + A.myAfter : "")
    : "round " + A.ctx.round + " \u00b7 you're on the clock" +
      (A.myAfter ? " \u00b7 then " + A.myAfter : "");

  /* Three cards, and the three numbers that actually decide between them: what
     he adds to the lineup you can field, whether he will still be there next
     time, and how many of his tier are left. The reason sentence used to carry
     all of that as prose — "+108 over replacement (RB31)" three times over,
     once per card, which is a lot of column for a number that barely separates
     them. Prose says the one thing a number cannot; the numbers stay numbers. */
  var best = top[0] ? top[0].comp : 1;
  $("#recs").innerHTML = top.map(function (p, i) {
    var d = p.compDetail;
    var conf = Math.max(8, Math.min(100, Math.round(p.comp / Math.max(best, 1) * 100)));
    // The lead reason, not three of them. The others are in Why?.
    var why = d.reasons.length ? d.reasons[0] : "best remaining value";
    var surv = Math.round(survShown(p) * 100);
    var survCls = surv >= 70 ? "good" : surv >= 35 ? "warn" : "bad";
    var stats = [
      { k: "to your lineup", v: (d.marginal > 0 ? "+" : "") + n0(d.marginal),
        cls: d.marginal > 0 ? "good" : "dim",
        t: "Points he adds to the best starting lineup you can field, over a freely available " + p.pos },
      { k: A.survTarget ? "reaches " + A.survTarget : "survives", v: surv + "%", cls: survCls,
        t: "Chance he is still on the board the next time you choose" },
      { k: "tier " + p.tier, v: p.tierLeft + " left", cls: p.tierLeft <= 1 ? "warn" : "dim",
        t: p.tierLeft + " players left in tier " + p.tier + " at " + p.pos +
           ". Inside a tier they are close enough to be interchangeable." }
    ];
    return '<div class="rec' + (i === 0 ? " top" : "") + '">' +
      '<div class="rec-head">' +
        '<span class="rec-rank">' + (i + 1) + "</span>" +
        '<span class="pos pos-' + p.pos + '">' + p.pos + "</span>" +
        '<span class="name">' + esc(p.name) + "</span>" +
        '<span class="rec-meta">' + p.team + " \u00b7 bye " + p.bye + "</span>" +
        tagBadge(p.tag) +
      "</div>" +
      '<div class="rec-stats">' + stats.map(function (st) {
        return '<span class="rs" title="' + esc(st.t) + '">' +
          '<b class="rs-' + st.cls + '">' + st.v + "</b>" +
          '<span class="rs-k">' + esc(st.k) + "</span></span>";
      }).join("") + "</div>" +
      '<div class="rec-why">' + esc(why) + "</div>" +
      styleChipHtml(p) +
      '<div class="rec-foot">' +
        '<div class="bar" title="' + esc("Board score " + n0(p.comp) +
          (i ? ", against " + n0(best) + " for the top pick" : ", the top of the board")) +
          '"><span style="width:' + conf + '%"></span></div>' +
        '<div class="rec-actions">' +
          '<button class="btn btn-sm btn-primary" data-take="' + esc(p.name) + '">' +
            (myTurn() ? "Draft" : "I drafted him") + "</button>" +
          // On your own clock "somebody else took him" cannot happen, and
          // offering it would credit your own pick to another team.
          (myTurn() ? "" :
            '<button class="btn btn-sm" data-assign="' + esc(p.name) + '">' +
            (isLive() ? "Taken by…" : "Taken") + "</button>") +
          '<button class="btn btn-sm btn-ghost" data-open="' + esc(p.name) + '">Why?</button>' +
        "</div>" +
      "</div></div>";
  }).join("") || '<div class="note">Nothing left that clears the position caps.</div>';

  var chip = $("#styleChip");
  if (chip) chip.onclick = function () { $("#btnStyle").click(); };
  $$("#recs [data-take]").forEach(function (b) { b.onclick = function () { record(b.dataset.take, true); }; });
  $$("#recs [data-assign]").forEach(function (b) {
    b.onclick = function (e) { openAssign(b.dataset.assign, b, e); };
  });
  $$("#recs [data-open]").forEach(function (b) {
    b.onclick = function () { view.selected = b.dataset.open; renderList(); renderDetail(b.dataset.open); };
  });
  // The selected player may have just been drafted — fall back to the top pick
  // so the detail panel is never empty while there is something to explain.
  var stillThere = view.selected && A.avail.some(function (p) { return p.name === view.selected; });
  if (!stillThere && top[0]) view.selected = top[0].name;
  if (view.selected) renderDetail(view.selected);
}

/** The full "what your style did to this pick" block for the detail panel. */
function styleBlockHtml(p) {
  var fx = styleEffect(p);
  if (!fx) return "";
  var hits = knobsHitting(p);
  if (Math.abs(fx.delta) < 1 && !fx.move && !hits.length) return "";
  var d = Math.round(fx.delta);
  var arrow = fx.move > 0
      ? '<span style="color:var(--green)">up ' + fx.move + " place" + (fx.move === 1 ? "" : "s") + "</span>"
    : fx.move < 0
      ? '<span style="color:var(--red)">down ' + (-fx.move) + " place" + (fx.move === -1 ? "" : "s") + "</span>"
    : '<span class="dimtext">no move</span>';
  return '<div class="panel-sub mt">' +
    '<div class="eyebrow" style="margin-bottom:6px">What ' + esc(styleName()) +
      " did to this pick</div>" +
    "<table>" +
      '<tr><td>Score under Balanced</td><td class="right num dimtext">' + n0(p.compNeutral) + "</td></tr>" +
      '<tr><td>Score under ' + esc(styleName()) + '</td><td class="right num"><b>' + n0(p.comp) +
        '</b> <span style="color:var(--' + (d >= 0 ? "green" : "red") + ')">' +
        (d >= 0 ? "+" : "\u2212") + Math.abs(d) + "</span></td></tr>" +
      '<tr><td>Board rank</td><td class="right num">#' + fx.from + " \u2192 #" + fx.to +
        " \u00b7 " + arrow + "</td></tr>" +
    "</table>" +
    (hits.length
      ? '<ul class="knoblist">' + hits.map(function (h) {
          return '<li class="k-' + h[1] + '">' + esc(h[0]) + "</li>";
        }).join("") + "</ul>"
      : '<div class="dimtext mt" style="font-size:12px">Your style has no knob that ' +
        "touches this player \u2014 the difference is what it did to everyone around him." +
        "</div>") +
    "</div>";
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

  /* On touch this card is how a player is drafted, so it opens with the same
     three actions the row used to carry on desktop — the same data-act values,
     bound by the same handler below, so record() and openAssign() are reached
     by a different route and not by different code. The card sits at the top of
     the column on touch (CSS order), which is why the buttons come first. */
  var acts = !IS_TOUCH ? "" :
    '<div class="detail-acts">' +
      (myTurn()
        ? '<button class="btn btn-primary" data-dact="mine">Draft him</button>'
        : '<button class="btn" data-dact="gone">' + esc(onClockLabel()) + " took him</button>" +
          (isLive() ? '<button class="btn" data-dact="assign">who?</button>' : "") +
          '<button class="btn btn-teal" data-dact="mine">TO ME</button>') +
      '<button class="btn detail-x" data-dact="close" aria-label="Close">×</button>' +
    "</div>";

  $("#detail").innerHTML =
    '<div class="panel mt"><div class="panel-head">' +
      "<h3>" + esc(p.name) + ' <span class="pos pos-' + p.pos + '">' + p.pos + "</span></h3>" +
      '<span class="eyebrow">' + p.pos + String(p.posRank) + " · ADP " + p.adp + "</span></div>" +
    acts +

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
      "<div><div class=\"eyebrow\" style=\"margin-bottom:6px\">How the suggestion is built</div>" +
        (d.marginal <= 0.5 && d.aware > 0.5
          ? '<div class="note warn" style="margin-bottom:8px">He cannot enter your starting ' +
            "lineup as it stands — you are already better at " + p.pos +
            ". The first number below is what he is worth to any team; the second is what " +
            "he is worth to yours." + "</div>"
          : "") +
        "<table>" +
        '<tr><td>Value over replacement <span class="dimtext">(any team)</span></td>' +
          '<td class="right num dimtext">' + n0(p.vor) + "</td></tr>" +
        '<tr><td><b>Adds to your starting lineup</b> <span class="dimtext">(over a free ' +
          p.pos + ')</span></td><td class="right num"><b>' + n0(d.marginal) + "</b></td></tr>" +
        '<tr><td>Value over next available</td><td class="right num">' + n0(d.vona) + "</td></tr>" +
        '<tr><td>Bias multiplier</td><td class="right num">×' + d.mult.toFixed(2) + "</td></tr>" +
        '<tr><td>Ceiling adjustment' + gradeNote(p) + '</td><td class="right num">' + (d.ceilingAdj ? "+" + d.ceilingAdj.toFixed(1) : "—") + "</td></tr>" +
        '<tr><td>Risk adjustment</td><td class="right num">' + (d.riskAdj ? "-" + d.riskAdj.toFixed(1) : "—") + "</td></tr>" +
        '<tr><td>Bye penalty</td><td class="right num">' + (d.byePenalty ? "-" + d.byePenalty.toFixed(0) : "—") + "</td></tr>" +
        '<tr><td><b>Composite</b></td><td class="right num"><b>' + n0(p.comp) + "</b></td></tr>" +
        (d.blocked ? '<tr><td colspan="2" class="dimtext">Blocked: ' + esc(d.blocked) + "</td></tr>" : "") +
      "</table>" +
      '<div class="mt dimtext" style="font-size:12px">' +
        "Survives to " + (A.survTarget || "—") + ": <b>" + Math.round(survShown(p) * 100) + "%</b>" +
        (A.myAfter && A.myAfter !== A.survTarget
          ? " · to " + A.myAfter + ": <b>" + Math.round(p.survNext * 100) + "%</b>" : "") +
      "</div></div>" +
    "</div>" +

    styleBlockHtml(p) +

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

  // The touch action bar. Same three actions the row carries on desktop, same
  // two functions underneath — only the thing you tapped to get here differs.
  $$("#detail [data-dact]").forEach(function (b) {
    b.onclick = function (e) {
      var act = b.dataset.dact;
      if (act === "close") { view.selected = null; $("#detail").innerHTML = ""; renderList(); return; }
      if (act === "assign") { openAssign(p.name, b, e); return; }
      record(p.name, act === "mine");
    };
  });
}

/**
 * The right-hand panel can show any team, not just yours. Reading an opponent's
 * roster mid-draft is how you work out what they are about to take, and having
 * to open a modal for it is friction you do not have on a two-minute clock.
 */
function renderRosterPicker() {
  var sel = $("#rosterTeam");
  if (!isLive()) {
    sel.innerHTML = '<option value="' + S.league.slot + '">Your roster</option>';
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  var cur = view.rosterSlot || S.league.slot;
  var opts = [];
  for (var i = 1; i <= S.league.teams; i++) {
    opts.push('<option value="' + i + '"' + (i === cur ? " selected" : "") + ">" +
      esc(i === S.league.slot ? "Your roster" : teamTitle(i)) + "</option>");
  }
  sel.innerHTML = opts.join("");
}
$("#rosterTeam").addEventListener("change", function (e) {
  view.rosterSlot = parseInt(e.target.value, 10) || S.league.slot;
  render();
});

function renderRoster() {
  renderRosterPicker();
  var slot = (isLive() && view.rosterSlot) || S.league.slot;
  var isMine = slot === S.league.slot;

  // Viewing someone else: build their roster the same way, from the picks
  // credited to them.
  var players = isMine ? A.mine : allRosters()[slot].filter(function (p) { return p.pos !== "?"; });
  var r = isMine ? A.roster : E.assignRoster(players, S.league.rules);
  $("#rosterCount").textContent = players.length + " player" + (players.length === 1 ? "" : "s");

  var tol = S.league.byeTolerance || 3;
  var counts = {}, onBye = {};
  r.slots.forEach(function (x) {
    if (!x.player) return;
    counts[x.player.bye] = (counts[x.player.bye] || 0) + 1;
    (onBye[x.player.bye] = onBye[x.player.bye] || []).push(x.player);
  });

  // Slots, not per-position counts. The question is "which of my starting
  // spots is still empty", and the lineup assignment already answers it
  // exactly — including the flex, which a tally gets wrong the moment
  // anyone is in it.
  var groups = {}, printed = {};
  r.slots.forEach(function (sl) { (groups[sl.pos] = groups[sl.pos] || []).push(sl); });

  // Color is only worth spending where the picks are genuinely running out.
  var left = isMine && A.myNext
    ? myUpcoming(A.cur).length
    : S.league.rounds - (players.length || 1);
  var empties = r.slots.filter(function (sl) { return !sl.player; }).length;
  var pressed = left > 0 && empties >= left;

  var html = r.slots.map(function (s) {
    var g = groups[s.pos];
    var have = g.filter(function (x) { return x.player; }).length;
    // The count belongs to the position, not to each of its rows, so it is
    // printed once — on the first slot of the group. Repeating "0/2" down
    // both RB rows reads as two separate facts about two separate things.
    var first = !printed[s.pos]; printed[s.pos] = 1;
    var cnt = !first ? ""
      : '<span class="cnt ' + (have === g.length ? "done" : pressed ? "urgent" : "") +
        '" title="' + esc(have === g.length
          ? s.pos + ": filled"
          : (g.length - have) + " of " + g.length + " " + s.pos + " slot" +
            (g.length === 1 ? "" : "s") + " still open" +
            (pressed ? " — and you are running out of picks" : "")) + '">' +
        have + "/" + g.length + "</span>";
    var lbl = '<span class="lbl">' + s.pos + cnt + "</span>";
    if (!s.player) return '<div class="slot empty">' + lbl + '<span class="who">—</span></div>';
    var n = counts[s.player.bye] || 0;
    var lvl = n >= tol ? " bad" : (tol > 1 && n === tol - 1) ? " warn" : "";
    return '<div class="slot' + (n >= tol ? " bye-clash" : "") + '">' + lbl +
      '<span class="who"><span class="pos pos-' + s.player.pos + '">' + s.player.pos + "</span> " +
        esc(s.player.name) + "</span>" +
      '<span class="bye' + lvl + '" title="' + esc("bye week " + s.player.bye +
        (n > 1 ? " — " + n + " of your starters are out that week" : "")) + '">' +
        s.player.bye + "</span>" +
      '<span class="num dimtext" style="font-size:11px">' + n0(s.player.pts) + "</span></div>";
  }).join("");
  var bench = r.bench.map(function (p) {
    return '<div class="slot"><span class="lbl">BN</span>' +
      '<span class="who"><span class="pos pos-' + p.pos + '">' + p.pos + "</span> " + esc(p.name) + "</span>" +
      '<span class="bye" title="' + esc("bye week " + p.bye) + '">' + p.bye + "</span>" +
      '<span class="num dimtext" style="font-size:11px">' + n0(p.pts) + "</span></div>";
  }).join("");

  // Two bare numbers on the right of every row, and nothing anywhere saying
  // which is the bye week and which is the projection.
  var head = '<div class="slot-head"><span class="lbl">Slot</span>' +
    '<span class="who">Player</span>' +
    '<span class="bye" title="Week this player is on bye">Bye</span>' +
    '<span class="num" title="Projected season points in your league’s scoring">Proj</span></div>';
  $("#roster").innerHTML = head + html +
    (bench ? '<div class="eyebrow" style="margin:8px 0 4px">Bench</div>' + bench : "");

  renderByeLine(counts, onBye, tol, r.slots.length - empties);
}

/* A ten-row chart of every bye week in the league, nine rows of which were
   empty, to say one thing: is any week going to leave you short. That one
   thing is a sentence, and the week each player is out is already on his own
   roster row, colored when it is part of a pile-up. */
function renderByeLine(counts, onBye, tol, starters) {
  var el = $("#byeLine");
  if (!starters) { el.innerHTML = ""; return; }
  var weeks = Object.keys(counts).map(Number).sort(function (a, b) { return a - b; });
  var heavy = weeks.filter(function (w) { return counts[w] >= tol; });
  var watch = weeks.filter(function (w) { return tol > 1 && counts[w] === tol - 1; });
  var note = "Starters only — bench players on a bye cost you nothing. " +
             "Flagged at " + tol + " in one week, which your style can change.";

  function names(w) {
    return onBye[w].map(function (p) {
      var parts = p.name.replace(/\s+(Defense|D\/ST)$/i, "").split(/\s+/);
      return parts.length > 1 ? parts[parts.length - 1] : parts[0];
    }).join(", ");
  }
  function row(w, cls) {
    return '<div class="byeline ' + cls + '" title="' + esc(note) + '">' +
      "<b>wk " + w + "</b> " + counts[w] + " starters out — " + esc(names(w)) + "</div>";
  }

  el.innerHTML = heavy.length ? heavy.map(function (w) { return row(w, "bad"); }).join("")
    : watch.length ? watch.map(function (w) { return row(w, "warn"); }).join("")
    : '<div class="byeline ok" title="' + esc(note) + '">Byes are spread — no week takes ' +
      "more than " + Math.max.apply(null, weeks.map(function (w) { return counts[w]; })) +
      " of your starters.</div>";
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
      (isLive() || p.mine ? esc(teamLabel(p.slot, true)) + " · " : "") +
      (p.unknown ? "<i>unknown</i>" : esc(p.name)) +
      ' <span class="pos pos-' + (pl.pos || "K") + '">' + (pl.pos || "") + "</span>" +
      (p.keeper ? ' <span class="dimtext">keeper</span>' : "") + "</div>";
  }).join("");
}

/* ------------------------------------------------------------ interaction */

// Second line of defense against Chrome deciding this is a login field: it will
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
$("#btnOut").addEventListener("click", function () {
  // Get the last autosave up to the account before dropping the token that
  // would let us send it.
  if (SYNC) SYNC.flushNow();
  AUTH.logout();
  location.href = "index.html";
});

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
  // Nothing in this form is committed until Save league, so a rebuild has to
  // carry the half-typed names with it. Changing the team count used to throw
  // away every name you had entered.
  var names = (S.league.teamNames || []).slice();
  $$("#teamNames input").forEach(function (el) { names[+el.dataset.team - 1] = el.value; });
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
  // Rename a team and the keeper picker has to agree with you immediately —
  // otherwise you are choosing from names you have already replaced.
  $$("#teamNames input").forEach(function (el) {
    el.addEventListener("input", function () { buildKeeperSlots(); buildKeeperList(); });
  });
}

/* A keeper belongs to a person, and you know your league by their names, not by
   which seed the draft order handed them. The number was also a trap: typing 11
   for the team called "team 11" is right only until someone is renamed.

   It reads the names out of the form above rather than out of saved state, so a
   name you have just typed is already on the dropdown when you add the keeper —
   nothing is committed until Save league. */
function setupTeamTitle(slot) {
  var el = $('#teamNames input[data-team="' + slot + '"]');
  var typed = el ? el.value.trim() : "";
  var name = typed || ((S.league.teamNames || [])[slot - 1] || "").trim();
  var mine = slot === (parseInt($("#cfgSlot").value, 10) || S.league.slot);
  return name ? name + (mine ? " (you)" : "") : mine ? "your team" : "team " + slot;
}

function buildKeeperSlots() {
  var sel = $("#kSlot");
  var teams = parseInt($("#cfgTeams").value, 10) || S.league.teams;
  var keep = parseInt(sel.value, 10);
  var mine = parseInt($("#cfgSlot").value, 10) || S.league.slot;
  // Shrinking the league can strand the chosen team off the end of the list.
  // Falling through to your own slot, then to the first team, always lands on
  // a team that exists rather than on a blank picker.
  var want = keep && keep <= teams ? keep : mine <= teams ? mine : 1;
  var opts = [];
  for (var i = 1; i <= teams; i++) {
    opts.push('<option value="' + i + '"' + (i === want ? " selected" : "") + ">" +
      esc(setupTeamTitle(i)) + "</option>");
  }
  sel.innerHTML = opts.join("");
}

function buildKeeperList() {
  $("#keeperList").innerHTML = (S.league.keepers || []).map(function (k, i) {
    return '<div class="slot"><span class="who">' + esc(k.name) + "</span>" +
      '<span class="dimtext">round ' + k.round + " · " + esc(setupTeamTitle(k.slot || S.league.slot)) + "</span>" +
      '<button class="btn btn-sm btn-ghost btn-danger" data-delk="' + i + '">remove</button></div>';
  }).join("") || '<div class="dimtext">No keepers.</div>';
  $$("#keeperList [data-delk]").forEach(function (b) {
    b.onclick = function () {
      S.league.keepers.splice(+b.dataset.delk, 1); buildKeeperList();
    };
  });
}

function renderModePicker() {
  var cur = S.league.mode || "live";
  $("#modePicker").innerHTML = Object.keys(MODES).map(function (k) {
    var m = MODES[k];
    return '<div class="modecard' + (k === cur ? " on" : "") + '" data-mode="' + k + '">' +
      "<b>" + esc(m.name) + "</b>" +
      '<div class="mc-tag">' + esc(m.tagline) + "</div>" +
      "<ul>" + m.gains.map(function (g) { return '<li class="up">' + esc(g) + "</li>"; }).join("") +
        m.costs.map(function (c) { return '<li class="down">' + esc(c) + "</li>"; }).join("") +
      "</ul></div>";
  }).join("");
  $$("#modePicker .modecard").forEach(function (el) {
    el.onclick = function () {
      S.league.mode = el.getAttribute("data-mode");
      save(); renderModePicker(); render();
    };
  });
}

/* --------------------------------------------------------- the quick start

   The first thing a new account sees. It used to be openSetup() cold: forty
   scoring fields, no statement of what to do first, and no way to tell which of
   it mattered. Everything here is checked against the state the app is actually
   in, so it is a checklist rather than a page of instructions — it knows whether
   the league has been saved, whether the teams have names, whether a keeper is
   recorded and whether a practice draft has been run.

   Every step carries the two sentences that were missing: what it buys, and what
   skipping it costs. Skipping is a real choice — the board is fully usable with
   none of it done — so the cost is stated once, plainly, rather than implied by
   nagging. */

function goSetup(section) {
  closeModal("#startModal");
  openSetup(section);
}

function quickStartSteps() {
  var L = S.league;
  var others = Math.max(0, (L.teams || 12) - 1);
  var named = (L.teamNames || []).filter(function (n, i) {
    return String(n || "").trim() && (i + 1) !== L.slot;
  }).length;
  var keepers = (L.keepers || []).length;
  var yahooCount = Object.keys(yahooAdp()).length;
  var mode = MODES[L.mode || "live"];

  return [
    {
      title: "Tell it about your league",
      need: "required",
      done: !!L.configured,
      now: (L.configured ? "Saved — " : "Still on the shipped default — ") +
        L.teams + " teams, you pick at " + L.slot + ", " + L.rounds + " rounds, " +
        ((PRESETS[L.preset] || {}).name || "custom scoring"),
      body: "How many teams, which slot you drew, how many rounds, and the scoring. " +
        "Paste your league's own settings page in and Draftline reads the rules back out " +
        "of it — receptions, yardage bonuses, return yards, your defensive tiers, the " +
        "roster shape — and shows you what it found before anything is saved. Or start " +
        "from a preset and edit the numbers by hand.",
      cost: "the board computes every player's points in a league that isn't yours. That " +
        "is not a rounding error. A point per reception on or off moves real players by " +
        "whole rounds, and every suggestion moves with them.",
      acts: [{ label: "Open League setup" }]
    },
    {
      title: "Decide how much you'll track",
      need: "required",
      // The mode has a default, so it is never unset — what this asks is whether
      // you have actually seen the choice, which is the same trip as step one.
      done: !!L.configured,
      now: "Currently: " + mode.name + " — " + mode.tagline,
      body: "<b>Live draft</b> credits every pick to whoever made it, so the board holds " +
        "all twelve rosters. <b>Just the board</b> tracks only yours — you still mark " +
        "players off as they go, but nothing is attributed to anyone. Your own points, " +
        "value over replacement and survival odds are identical either way.",
      cost: "on Just the board there are no opponent rosters, so there is no graded league " +
        "table at the end, and Claude cannot tell you what the teams picking ahead of you " +
        "still need — which is the one thing it knows that no ranking does.",
      acts: [{ label: "Choose the mode" }]
    },
    {
      title: "Name the other teams",
      need: "recommended",
      done: others > 0 && named >= Math.ceil(others / 2),
      now: named
        ? named + " of " + others + " other teams named"
        : "Nobody named yet — they read as team 1 through team " + L.teams,
      body: "Two minutes, and it changes how the whole night reads. Names show up on the " +
        "ticker, in the draft log, on the roster switcher and all through the report.",
      cost: "everything says team 7. The real cost is not cosmetic: the commonest mistake " +
        "on draft night is putting a pick on the wrong roster, and a list of names is far " +
        "easier to check at a glance than a column of numbers.",
      acts: [{ label: "Name the teams", section: "#dTeams" }]
    },
    {
      title: "Add the keepers",
      need: keepers ? "recommended" : "if your league has them",
      done: keepers > 0,
      now: keepers
        ? keepers + " keeper" + (keepers === 1 ? "" : "s") + " recorded"
        : "None recorded",
      body: "A keeper comes off the board before pick 1 and burns that round's pick for " +
        "whoever owns him. Add your rivals' keepers too if you know them.",
      cost: "the board keeps offering you players who were never available, and every pick " +
        "number after the first kept round is wrong — so who is on the clock, and which " +
        "picks are yours, are both off.",
      acts: [{ label: "Add keepers", section: "#dKeepers" }]
    },
    {
      title: "Add real draft data from your platform",
      need: "optional",
      done: yahooCount > 0,
      now: yahooCount
        ? yahooCount + " players carrying your league's real ADP"
        : "Not added — running on the shipped mock-draft ADP",
      body: "The ADP baked into this board comes from about 7,800 <em>mock</em> drafts. " +
        "Yahoo publishes ADP from <b>real completed drafts</b> on its own platform, plus a " +
        "last-seven-days column that shows which way a player is moving this week. It is " +
        "free, every league member can see it, and it takes a minute.",
      cost: "nothing breaks. You are reading a market that was frozen when this data was " +
        "built rather than the one moving this week.",
      acts: [{ label: "Add Yahoo draft data", section: "#dYahoo" }]
    },
    {
      title: "Rehearse the whole thing",
      need: "recommended",
      // S.simulated only turns on once the modeled room has actually drafted,
      // which for a manager at slot 1 does not happen until after their own
      // first pick — so a run that is under way needs to say so on its own.
      done: !!S.simulated,
      now: S.simulated
        ? "You have run a practice draft"
        : S.draftStarted
          ? "A draft is under way — hit Simulate and the room drafts to your next pick"
          : "Not run yet",
      body: "Practice mode drafts the other eleven teams out and stops the moment the pick " +
        "is yours — same board, same suggestions, same clock. Hit Simulate and the room " +
        "runs to your turn, you pick, you hit Simulate again. It never drafts your team " +
        "for you, nothing is real, and <em>Start over</em> clears the lot.",
      cost: "you learn the interface for the first time on the night, on a two-minute " +
        "clock, with eleven people waiting on you.",
      acts: [{ label: "Start a practice draft", begin: true }]
    }
  ];
}

function renderQuickStart() {
  var steps = quickStartSteps();
  var left = steps.filter(function (st) { return !st.done; }).length;
  $("#qsSub").textContent = left
    ? left + " of the " + steps.length + " steps still to do — about five minutes for the lot."
    : "All " + steps.length + " done. The board is set up for your league.";

  $("#qsSteps").innerHTML = steps.map(function (st, i) {
    return '<div class="qs-step' + (st.done ? " done" : "") + '">' +
      '<div class="qs-n">' + (st.done ? "✓" : (i + 1)) + "</div>" +
      "<div>" +
        '<div class="qs-h"><h3>' + esc(st.title) + "</h3>" +
          '<span class="badge qs-need' + (st.need === "required" ? " qs-req" : "") + '">' +
            esc(st.need) + "</span></div>" +
        '<div class="qs-now">' + esc(st.now) + "</div>" +
        "<p>" + st.body + "</p>" +
        '<p class="qs-skip"><b>Skip it and</b> ' + st.cost + "</p>" +
        '<div class="qs-act">' + st.acts.map(function (a, j) {
          return '<button class="btn btn-sm" data-qs="' + i + "," + j + '">' +
            esc(a.label) + "</button>";
        }).join("") + "</div>" +
      "</div>" +
    "</div>";
  }).join("");

  $$("#qsSteps [data-qs]").forEach(function (b) {
    var ix = b.dataset.qs.split(","), a = steps[+ix[0]].acts[+ix[1]];
    b.onclick = function () {
      if (a.begin) { closeModal("#startModal"); openBegin(); return; }
      goSetup(a.section);
    };
  });

  $("#qsClaudeState").textContent = !claudeReady()
    ? "needs a key of your own — see Ask Claude"
    : claudeCfg.auto
      ? "on, and the brief arrives " + claudeCfg.lead +
        " pick" + (claudeCfg.lead === 1 ? "" : "s") + " before your turn"
      : "available, but the automatic brief is switched off";
}

function openQuickStart() {
  renderQuickStart();
  openModal("#startModal");
  // Shown once per account per device, then it lives in the More menu. Written on
  // open rather than on close so a user who navigates away mid-guide is not asked
  // to sit through it again.
  try { localStorage.setItem(KEY_SEEN, "1"); } catch (e) {}
}

$("#btnStart").addEventListener("click", openQuickStart);
$("#startClose").addEventListener("click", function () { closeModal("#startModal"); });
$("#qsDismiss").addEventListener("click", function () { closeModal("#startModal"); });
$("#qsGoSetup").addEventListener("click", function () { goSetup(); });


function openSetup(section) {
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
  buildScoringForm(); buildRosterForm(); buildTeamNames();
  buildKeeperSlots(); buildKeeperList();
  renderModePicker();
  openModal("#setupModal");
  // The quick start sends you at one panel of this modal rather than at the top
  // of forty scoring fields, so open that panel and put it under the eye.
  if (section) {
    var el = $(section);
    if (el) {
      el.open = true;
      setTimeout(function () { el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 30);
    }
  }
}
// addEventListener hands the click Event to its listener, and an Event is truthy
// — passing openSetup directly would make every plain click look like a request
// for a section. Wrap it.
$("#btnSetup").addEventListener("click", function () { openSetup(); });
$("#setupClose").addEventListener("click", function () { closeModal("#setupModal"); });
$("#presetSel").addEventListener("change", function (e) {
  S.league.preset = e.target.value;
  S.league.rules = JSON.parse(JSON.stringify(PRESETS[e.target.value]));
  S.league.teams = S.league.rules.teams || S.league.teams;
  $("#cfgTeams").value = S.league.teams;
  $("#presetBlurb").textContent = PRESETS[e.target.value].blurb || "";
  buildScoringForm(); buildRosterForm(); buildTeamNames();
  buildKeeperSlots(); buildKeeperList();
});
// The team count and your own slot both decide what the keeper picker can offer
// and which entry says "(you)", so both have to repaint it.
["#cfgTeams", "#cfgSlot"].forEach(function (sel) {
  $(sel).addEventListener("input", function () {
    buildTeamNames(); buildKeeperSlots(); buildKeeperList();
  });
});
$("#kAdd").addEventListener("click", function () {
  var nm = $("#kName").value.trim();
  var round = +$("#kRound").value || 1;
  var slot = +$("#kSlot").value || S.league.slot;
  var rounds = parseInt($("#cfgRounds").value, 10) || S.league.rounds;
  var keepers = S.league.keepers = S.league.keepers || [];
  if (!BY_NAME[nm]) return flash("#keeperMsg", "No player on the board with that exact name.", true);
  // Each of these silently produced a keeper that could never be honored: a
  // round past the end of the draft has no pick to burn, and two keepers on one
  // team in one round means only the first is ever reached.
  if (round > rounds) return flash("#keeperMsg",
    "Round " + round + " is past the end of a " + rounds + "-round draft.", true);
  if (keepers.some(function (k) { return k.name === nm; }))
    return flash("#keeperMsg", nm + " is already kept.", true);
  var clash = keepers.find(function (k) {
    return k.round === round && (k.slot || S.league.slot) === slot;
  });
  if (clash) return flash("#keeperMsg",
    setupTeamTitle(slot) + " already keeps " + clash.name + " in round " + round +
    " — one keeper burns one pick.", true);
  keepers.push({ name: nm, round: round, slot: slot });
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
  S.league.configured = true;   // the quick start checks this, not a guess at the values
  save(); closeModal("#setupModal"); render();
});
$("#btnReset").addEventListener("click", function () {
  if (!confirm("Clear every pick and go back to pick 1? Scoring, roster, keepers, team " +
               "names and your draft style are all kept.")) return;
  closeModal("#setupModal");
  resetDraft();
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
          "Anything unrecognized is listed for you rather than guessed at."
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
      "Select all, copy, paste below, and see what it recognizes."
    ],
    note: "The parser matches on category names rather than page layout, so unfamiliar " +
          "platforms often work anyway. Whatever it misses, set by hand in the scoring form below — " +
          "and send me the lines it listed as unrecognized so they can be added."
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


$("#yahooParse").addEventListener("click", function () {
  var res = globalThis.DRAFTLINE_YAHOO.parse($("#yahooBox").value);
  if (!res.rows.length) {
    $("#yahooMsg").textContent = "Nothing recognized on that page.";
    return;
  }
  var store = S.league.yahooAdp || {}, added = 0, matched = 0;
  res.rows.forEach(function (r) {
    var key = normName(r.name);
    store[key] = { all: r.adpAll, recent: r.adpRecent, pct: r.pctDrafted, rank: r.rank };
    added++;
    if (BY_NAME[r.name] || DATA.players.some(function (q) { return normName(q.name) === key; })) matched++;
  });
  S.league.yahooAdp = store;
  save(); render();
  $("#yahooBox").value = "";
  $("#yahooMsg").textContent = "Added " + added + " (" + matched + " on this board). " +
    Object.keys(store).length + " players stored. Page through and paste the next one.";
});

$("#yahooClear").addEventListener("click", function () {
  S.league.yahooAdp = null; save(); render();
  $("#yahooMsg").textContent = "Cleared.";
});

$("#parseBtn").addEventListener("click", function () {
  var res = DRAFTLINE_PARSER.parse($("#pasteBox").value);
  var rows = res.hits.map(function (h) {
    return "<tr><td>" + esc(h[0]) + '</td><td class="right num">' + esc(h[1]) + "</td>" +
      '<td class="dimtext">' + (h[2] ? h[2].join(".") : "") + "</td></tr>";
  }).join("");
  $("#parseOut").innerHTML =
    '<div class="note' + (res.confidence < 0.4 ? " warn" : "") + '">Recognized <b>' + res.hits.length +
      "</b> settings, " + (res.missed.length ? res.missed.length + " lines not recognized"
        : "everything on the page recognized") + ". Nothing has been applied yet — " +
      "check the values below, then apply.</div>" +
    '<div class="mt" style="max-height:240px;overflow:auto"><table>' + rows + "</table></div>" +
    (res.missed.length ? '<details class="mt"><summary class="dimtext">Lines it did not recognize</summary>' +
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
      "paste. Ask as much as you like — the proxy pins the model so nobody can order something " +
      "expensive, and carries a daily stop set fifty times above what a whole draft night costs, " +
      "which is there to catch a loop rather than to ration you. The draft board is unaffected " +
      "either way."
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
  // Must match the prices the Worker pins, or the running total quietly lies.
  var usd = PROXY ? (s.in / 1e6) * 2.0 + (s.out / 1e6) * 10.0
                  : (s.in / 1e6) * 1.0 + (s.out / 1e6) * 5.0;
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
  if (!A.myNext || !isLive()) return [];
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

/**
 * The players the brief is allowed to name, best first.
 *
 * Draw from the same pool the recommendation cards draw from, on the same two
 * conditions. A player the board caps out has no Draft button anywhere, so
 * naming him only sends the reader hunting for a control that does not exist.
 * And the brief is written up to `lead` picks *before* the clock reaches you:
 * handing over the raw top of the board meant handing over players the teams
 * in between were about to take, so the advice arrived naming somebody already
 * gone. Ask instead for the top of the board that is likely to still be there.
 */
function briefCandidates(waiting, limit) {
  var byComp = function (a, b) { return b.comp - a.comp; };
  var pool = A.avail.filter(function (p) { return !(p.compDetail && p.compDetail.blocked); })
                    .sort(byComp);
  pool.forEach(function (p) { p.briefPastAdp = false; });
  if (!waiting) return pool.slice(0, limit);

  // survival() is a normal CDF on ADP and nothing else. It does not know the
  // player is still on the board, so a man who outlived his ADP by twenty picks
  // scores near zero for the next two and the filter deletes him — exactly when
  // he is the bargain. At 177 waiting for 179 that dropped eleven of the board's
  // own top twelve, and the best answer the prompt then permitted was the
  // board's #8, twenty-two composite points behind the #1 on the cards the user
  // was looking at while reading it.
  //
  // So the filter may narrow the field, but it may never hide a player the board
  // rates above every player it kept. That is a statement about when this filter
  // is wrong, not about when the ranking is: comp is still printed on every line
  // and nothing here tells the reader to doubt it.
  var live = pool.filter(function (p) { return p.surv >= 0.25; });
  var bestLive = live.length ? live[0].comp : -Infinity;
  var out = pool.filter(function (p) { return p.surv >= 0.25 || p.comp > bestLive; });
  out.forEach(function (p) { p.briefPastAdp = p.surv < 0.25; });
  return out.slice(0, limit);
}

/** Everything Claude sees. Numbers only — it never re-derives the scoring. */
function claudeContext() {
  var waiting = A.myNext > A.cur;
  var top = briefCandidates(waiting, 12);
  var lines = top.map(function (p) {
    var extra = [];
    if (p.depth) extra.push("depth chart " + (p.depthPos || p.pos) + p.depth);
    if (p.injury) extra.push("listed " + p.injury + (p.injuryPart ? " (" + p.injuryPart + ")" : ""));
    if (p.yadp != null) {
      extra.push("real Yahoo drafts take him at " + p.yadp +
        (p.ytrend != null && Math.abs(p.ytrend) >= 1
          ? ", and he has moved " + Math.abs(p.ytrend) + " picks " +
            (p.ytrend > 0 ? "earlier" : "later") + " in the last seven days"
          : ""));
    }
    if (p.adpResid != null && Math.abs(p.adpResid) >= 25) {
      extra.push("the other ADP market is " + Math.abs(Math.round(p.adpResid)) + " picks " +
        (p.adpResid < 0 ? "higher" : "lower") + " on him than players of his price here");
    }
    // The marginal number is the one that stops a model rationalizing a
    // downgrade: it says in points whether he can play for this roster at all.
    var marg = p.compDetail ? Math.round(p.compDetail.marginal) : null;
    if (marg != null) {
      extra.push(marg <= 0
        ? "he CANNOT crack my starting lineup — I am already better at " + p.pos +
          ", so he is bench depth and nothing else"
        : "he adds " + marg + " pts to my starting lineup over a free " + p.pos);
    }
    // What the chosen style is doing to him, so the brief can argue with it.
    var fx = styleEffect(p);
    if (fx && (Math.abs(fx.delta) >= 1 || fx.move)) {
      extra.push("my " + styleName() + " style moves him " +
        (fx.delta >= 0 ? "+" : "") + Math.round(fx.delta) + " and from board rank " +
        fx.from + " to " + fx.to + " versus neutral scoring");
    }
    return "- " + p.name + " (" + p.pos + " " + p.team + ", bye " + p.bye + "): " +
      Math.round(p.pts) + " pts in this league, VOR " + Math.round(p.vor) +
      (extra.length ? ", " + extra.join(", ") : "") +
      ", ADP " + p.adp +
      // He is only on this list because the board rates him above everyone the
      // survival filter kept. Say why he looks unlikely, as a fact about ADP.
      (p.briefPastAdp ? " (which he is " + Math.max(1, Math.round(A.cur - p.adp)) +
        " picks past, and he is still on the board)" : "") +
      // Two horizons, and conflating them is what produced advice like "only a
      // 5% chance he lasts, so take him now" about a player who would not last
      // to "now" either. The first number is whether he reaches the pick this
      // brief is written for; the second is whether he would keep until the one
      // after it, which is the question a fallback plan turns on.
      //
      // There is not always a pick after it. At the last pick of the draft
      // `A.myAfter` is null, `analyze()` parks `survNext` at 1 as a placeholder,
      // and this line used to print that placeholder while labelling it with
      // `(A.myAfter || A.myNext)` — so on the clock at 179 every candidate was
      // described as "100% chance he is still there at pick 179", which is the
      // pick being made. A placeholder is not a fact and must not be printed as
      // one: say there is no following pick instead.
      (waiting ? ", chance he reaches the pick I am writing about (" + A.myNext +
        ") is " + Math.round(p.surv * 100) + "%" : "") +
      (A.myAfter ? ", chance he is still there at my FOLLOWING pick (" +
        A.myAfter + ") is " + Math.round(p.survNext * 100) + "%"
        : ", and this is my last pick of the draft — there is no pick after it") +
      ", composite " + Math.round(p.comp) +
      (p.tag ? ", flagged " + tagLabel(p.tag) +
        (TAGS[p.tag] ? " (" + TAGS[p.tag] + ")" : "") : "") +
      (p.note ? ". Research note: " + p.note : "");
  }).join("\n");
  // Projected points on every player I already own. Without them a model can
  // recommend a candidate who is plainly worse than the man in the slot, and
  // will happily write a paragraph explaining why he is an upgrade.
  var line = function (pl) {
    return pl.name + " (" + pl.pos + ", " + Math.round(pl.pts) + " pts, bye " + pl.bye + ")";
  };
  var roster = A.roster.slots.map(function (s) {
    return s.pos + ": " + (s.player ? line(s.player) : "EMPTY");
  }).join("; ");
  var bench = (A.roster.bench || []).map(line).join("; ");
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
    "MY STARTERS: " + roster,
    bench ? "MY BENCH: " + bench : "",
    "STARTERS FILLED: " + needs,
    "Compare any candidate against the man already in that slot, not against the " +
      "league. A player who cannot start for me is worth close to nothing however " +
      "well he scores in the abstract — say so plainly rather than arguing him up.",
    "MY DRAFT STYLE: " + styleName() +
      (STRATS[S.league.style || "balanced"]
        ? " — " + STRATS[S.league.style || "balanced"].tagline : "") +
      ". The scores below already have it applied. Say when a pick is only on top " +
      "because of the style, and say so too when the style is steering me wrong here.",
    (waiting
      ? "LIKELY AVAILABLE WHEN MY TURN COMES, BY THE BOARD'S OWN SCORE. Most of " +
        "the players the teams in between will take are already removed. Anyone " +
        "marked as past his ADP is here because the board rates him above every " +
        "player that filter kept, and the filter reads ADP only — it does not know " +
        "he is still available. Name a player from this list and nobody else."
      : "AVAILABLE RIGHT NOW, BY THE BOARD'S OWN SCORE. I am on the clock, so " +
        "every player here is takeable this second. Name a player from this list " +
        "and nobody else.") + "\n" + lines
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
  "do not substitute generic consensus rankings. Your job is judgment on top of the math: " +
  "where the board's logic is thin, what the research notes actually imply, and what an " +
  "opponent might do next. Depth-chart slots and injury designations come straight from " +
  "the league feed and are current; where two ADP sources are given and they disagree, that " +
  "is a disagreement between markets and often just means one has not absorbed a piece of " +
  "news yet — say which you think it is rather than assuming an edge. " +
  "Be direct and brief — under 150 words unless asked for more. " +
  "No preamble, no bullet-point sprawl, no restating the question. If the board looks right, " +
  "say so in a sentence and add the one thing it doesn't know.";

/**
 * One transport for every Claude call. Prefers the shared proxy, which holds the
 * key as a Cloudflare secret and pins the model and answer length server-side;
 * falls back to a key the user pasted in themselves.
 */
/**
 * One retry, at the ceiling, when the model spends its whole budget thinking.
 *
 * Sonnet 5 reasons adaptively and those tokens come out of max_tokens, so a
 * short answer occasionally comes back as a thinking block and nothing else.
 * That is a coin flip against a budget, not news, and making the user click
 * "Ask again" to reflip it is a worse answer than reflipping it for them.
 */
var CLAUDE_TIMEOUT_MS = 30000;

function claudeCall(question, systemOverride, maxTokens) {
  return claudeOnce(question, systemOverride, maxTokens).catch(function (err) {
    if (!err.emptyAnswer) throw err;
    return claudeOnce(question, systemOverride, Math.max(4000, (maxTokens || 0) * 2));
  });
}

function claudeOnce(question, systemOverride, maxTokens) {
  var body = {
    system: systemOverride || SYSTEM,
    messages: [{ role: "user", content: question }],
    max_tokens: maxTokens || 2000
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

  // A fetch with no timeout can hang forever, and the brief marks itself
  // in-flight while it waits: one stalled connection and the panel keeps a
  // spinner up for the rest of the draft, with no Ask again to escape by. You
  // are on a two-minute clock, so failing is better than never answering.
  var ctl = typeof AbortController === "function" ? new AbortController() : null;
  var timer = ctl && setTimeout(function () { ctl.abort(); }, CLAUDE_TIMEOUT_MS);

  return fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body),
                      signal: ctl ? ctl.signal : undefined })
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
      if (!text) {
        var e = new Error("The model used its whole token budget reasoning and returned " +
          "nothing. Ask again, or ask for something shorter.");
        e.emptyAnswer = true;
        throw e;
      }
      if (res.j.stop_reason === "max_tokens") text += "\n\n[cut off at the token limit]";
      return text;
    })
    .catch(function (err) {
      if (err && err.name === "AbortError") {
        throw new Error("Claude took longer than " + Math.round(CLAUDE_TIMEOUT_MS / 1000) +
                        " seconds to answer.");
      }
      throw err;
    })
    .then(function (text) { if (timer) clearTimeout(timer); return text; },
          function (err) { if (timer) clearTimeout(timer); throw err; });
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
var briefCache = {};   // reassigned wholesale by resetDraft
var briefTries = {};   // re-asks per pick, so a bad answer cannot bill in a loop

/**
 * The player named in a line of a brief. The prompt asks for the name alone on
 * its own line, but it is a sentence generator, so match against the board
 * rather than trusting the line to be nothing but a name.
 *
 * Earliest match wins, not longest. Longest was guarding against a surname
 * sitting inside a longer name, and no such pair exists on this board — no one
 * of the 267 names is a substring of another — so the rule protected against
 * nothing and cost the thing below it. On a line naming two players, "Take Chase
 * Brown over Ja'Marr Chase", longest-wins bound the button to Ja'Marr Chase: the
 * man the sentence is arguing *against*. One tap on the clock then records the
 * wrong pick, and the head rendered above the button names the wrong player too,
 * so nothing on screen contradicts it. The recommendation is the subject of the
 * sentence and comes first in every natural phrasing of it.
 *
 * And when the line genuinely names two different players, bind to nobody rather
 * than guess. No button is a documented outcome; the wrong button is not.
 *
 * Matching is on normName(), which is what the Yahoo ADP join already uses and
 * was never pointed at this. A model writes "James Cook" for James Cook III and
 * a curly apostrophe in Ja'Marr Chase, and an exact substring scan returns null
 * for both — 24 of the 267 names carry a suffix or an apostrophe, among them six
 * top-40 picks. That failed safe (no button) but cost a name typed into search
 * under the clock. Comparison is padded with spaces so a normalized match has to
 * land on whole words: "chase brown" must not be found inside "ja marr chase
 * brown lastname".
 */
function playerIn(line) {
  var s = (line || "").trim();
  if (!s) return null;
  if (A.byName[s]) return A.byName[s];
  // normName folds the punctuation that appears *inside* names — the period, the
  // apostrophe, the hyphen — and nothing else, because the ADP join it was built
  // for only ever sees bare names. A sentence brings its own: "Take Bijan
  // Robinson, he is the best back left" leaves "robinson," glued together and
  // matches nobody. Everything that is not a letter or a digit becomes a space
  // first, and the word-boundary padding below does the rest.
  var ns = " " + normName(s.replace(/’/g, "'").replace(/[^\p{L}\p{N}'.\- ]+/gu, " ")) + " ";
  var hit = null, hitAt = Infinity, rivals = [];
  A.all.forEach(function (p) {
    if (!p.name) return;
    var np = " " + normName(p.name) + " ";
    var at = ns.indexOf(np);
    if (at < 0) return;
    // Two names that contain one another are one reference, not two players.
    var distinct = rivals.every(function (q) {
      var nq = normName(q.name), n = normName(p.name);
      return nq.indexOf(n) < 0 && n.indexOf(nq) < 0;
    });
    if (distinct) rivals.push(p);
    if (at < hitAt) { hit = p; hitAt = at; }
  });
  return rivals.length > 1 ? null : hit;
}

function briefPlayer(text) { return playerIn((text || "").split("\n")[0]); }

/**
 * The brief is written up to `lead` picks before you are on the clock, and those
 * are exactly the picks that can take the player it names. Cached against the
 * pick number alone it went on recommending him afterwards — including, in one
 * practice run, a back the user had already drafted himself two picks earlier.
 *
 * So the cache is keyed by the pick but valid only while its answer still is:
 * the moment the named player is off the board the advice is void and it is
 * asked again. Nothing else invalidates it, so a quiet board still costs one
 * call, and briefTries caps the re-asks in case an answer never names anyone
 * available.
 */
function briefStale(text) {
  if (!text || text.charAt(0) === "!") return false;
  var p = briefPlayer(text);
  return !!(p && p.takenBy);
}

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
    "spend your words on what it cannot see.\n" +
    "Every player listed above is ON THE BOARD right now — nobody has taken them. " +
    "A survival percentage is the chance he lasts until my pick, not a report that " +
    "he has gone. Never describe an available player as gone, taken or off the " +
    "board: say he is unlikely to last, which is the thing that is actually true.";
}

/** On deck is a different moment from on the clock, and saying so costs nothing. */
function briefEyebrow() {
  return A.myNext <= A.cur
    ? "Claude · on the clock at pick " + A.myNext
    : "Claude · on deck for pick " + A.myNext;
}

function renderBrief() {
  var el = $("#brief");
  if (!claudeReady() || !claudeCfg.auto || !A.myNext) { el.innerHTML = ""; return; }

  var gap = A.myNext - A.cur;
  if (gap > (claudeCfg.lead || 2)) { el.innerHTML = ""; return; }

  var cached = briefCache[A.myNext];
  if (cached && briefStale(cached) && (briefTries[A.myNext] || 0) < 2) {
    briefTries[A.myNext] = (briefTries[A.myNext] || 0) + 1;
    delete briefCache[A.myNext];
    cached = undefined;
  }
  if (cached === undefined) {
    briefCache[A.myNext] = null;                     // in flight; don't ask twice
    el.innerHTML = '<div class="rec top"><div class="eyebrow" style="margin-bottom:6px">' +
      briefEyebrow() + '</div>' +
      '<div class="claude-out"><span class="spinner"></span> reading the board…</div></div>';
    var forPick = A.myNext;
    claudeCall(briefQuestion(), null, 2500)
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

  // The two players the brief actually tells you to take: its pick, and the
  // fallback on the "If gone:" line. Both were prose and nothing else, so the
  // advice arrived with no way to act on it — and because Claude chooses from
  // the top twelve while the cards below show three, its pick is regularly on
  // none of them. That left the reader searching the list for a name that is
  // nowhere near the top of it.
  var pick = failed ? null : briefPlayer(cached);
  var alt = failed ? null : playerIn(lines.filter(function (l) {
    return /^\s*if gone\s*:/i.test(l);
  })[0]);
  if (alt && pick && alt.name === pick.name) alt = null;

  // A brief written on deck can be overtaken by the picks in between. It is
  // re-asked when that happens, but only twice, so the third time the advice has
  // to say plainly that it has been overtaken rather than leaving a
  // recommendation on screen for a player who is off the board.
  var gone = pick && pick.takenBy
    ? esc(pick.name) + " went at pick " + pick.takenBy.pick +
      (pick.takenBy.mine ? " — to you" : "") + ", after this was written." +
      (alt ? " The fallback is still on the board." : "")
    : "";

  el.innerHTML = '<div class="rec top' + (failed ? " brief-failed" : "") + '">' +
    '<div class="eyebrow" style="margin-bottom:6px">' + briefEyebrow() + "</div>" +
    (failed
      ? '<div class="claude-out">Claude is unavailable: ' + esc(body) +
        ' <span class="dimtext">The board below is unaffected.</span></div>'
      : (pick ? briefHeadHtml(pick)
              : '<div class="rec-head"><span class="name">' + esc(head) + "</span></div>") +
        '<div class="claude-out">' + esc(lines.join("\n")) + "</div>" +
        (gone ? '<div class="banner">' + gone + "</div>" : "")) +
    '<div class="rec-actions">' +
      briefTakeHtml(pick, myTurn() ? "Draft" : "I drafted him", true) +
      (alt ? briefTakeHtml(alt, (gone ? "Take " : "Fallback: ") + alt.name, !!gone) : "") +
      (pick && !pick.takenBy
        ? '<button class="btn btn-sm btn-ghost" data-bopen="' + esc(pick.name) + '">Why?</button>'
        : "") +
      '<button class="btn btn-sm btn-ghost" id="briefAgain">Ask again</button>' +
    "</div>" +
  "</div>";
  $("#briefAgain").onclick = function () {
    delete briefCache[A.myNext]; briefTries[A.myNext] = 0; renderBrief();
  };
  $$("#brief [data-btake]").forEach(function (b) {
    b.onclick = function () { record(b.dataset.btake, true); };
  });
  $$("#brief [data-bopen]").forEach(function (b) {
    b.onclick = function () {
      view.selected = b.dataset.bopen; renderList(); renderDetail(b.dataset.bopen);
    };
  });
}

/** Where a player sits in the suggested order the board list is showing. */
function briefRank(p) {
  var order = A.avail.slice().sort(function (a, b) { return b.comp - a.comp; });
  for (var i = 0; i < order.length; i++) if (order[i].name === p.name) return i + 1;
  return 0;
}

/**
 * The brief's head, built like a recommendation card's head — because that is
 * what it is. The board rank is the honest part of it: Claude is handed the top
 * twelve and invited to argue with the composite, so it will name a player the
 * three cards below do not carry. Saying where he sits turns that from a
 * contradiction the reader has to reconcile into a disagreement they can see.
 */
function briefHeadHtml(p) {
  var r = briefRank(p);
  return '<div class="rec-head">' +
    '<span class="pos pos-' + p.pos + '">' + p.pos + "</span>" +
    '<span class="name">' + esc(p.name) + "</span>" +
    '<span class="rec-meta">' + esc(p.team) + " · bye " + p.bye +
      (r ? " · board #" + r : "") + "</span>" +
    tagBadge(p.tag) +
  "</div>";
}

/** The button the advice was missing. Nothing to draft if he is already gone. */
function briefTakeHtml(p, label, primary) {
  if (!p || p.takenBy) return "";
  return '<button class="btn btn-sm' + (primary ? " btn-primary" : "") +
    (label.indexOf(p.name) >= 0 ? " btn-wide" : "") +
    '" data-btake="' + esc(p.name) + '">' + esc(label) + "</button>";
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

/**
 * What the account did to this board on the way in, and what to do when two
 * devices disagree. Everything here is a statement of fact plus, where there is
 * a real choice, the two buttons that make it — a draft is the wrong moment to
 * be guessing which version somebody meant.
 */
function syncBanner(html, tone) {
  var old = $("#syncBar");
  if (old) old.remove();
  var el = document.createElement("div");
  el.id = "syncBar";
  el.className = "statusbar " + (tone || "soon");
  el.innerHTML = html;
  $("#statusBar").insertAdjacentElement("afterend", el);
  return el;
}

function whenAgo(ts) {
  if (!ts) return "";
  var mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return " just now";
  if (mins < 60) return " " + mins + " minute" + (mins === 1 ? "" : "s") + " ago";
  var hrs = Math.round(mins / 60);
  if (hrs < 24) return " " + hrs + " hour" + (hrs === 1 ? "" : "s") + " ago";
  return " on " + new Date(ts).toLocaleDateString();
}

function offerConflict(info) {
  var from = info.device ? "on " + esc(info.device) : "on another device";
  syncBanner(
    "<span>This draft was also changed " + from + whenAgo(info.at) +
    ". Two versions exist and only one can win — nothing has been overwritten yet." +
    "</span><span class='grow'></span>" +
    '<button class="btn btn-sm" id="takeTheirs">Use that one</button>' +
    '<button class="btn btn-sm btn-primary" id="takeMine">Keep this one</button>', "drift");

  $("#takeTheirs").onclick = function () {
    SYNC.resolve("theirs").then(function () { location.reload(); });
  };
  $("#takeMine").onclick = function () {
    $("#takeMine").disabled = $("#takeTheirs").disabled = true;
    SYNC.resolve("mine").then(function () {
      syncBanner("<span>Kept this device's draft. The account now matches what is on screen.</span>");
      setTimeout(function () { var b = $("#syncBar"); if (b) b.remove(); }, 6000);
    });
  };
}

function initSync() {
  if (!SYNC) return;
  var h = globalThis.DRAFTLINE_HYDRATION || {};

  if (h.broughtOver) {
    syncBanner("<span>Your existing draft on this device is now saved to your account, " +
      "so it will be there on any other device you sign in from.</span>");
    setTimeout(function () { var b = $("#syncBar"); if (b) b.remove(); }, 10000);
  } else if (h.mode === "adopted") {
    syncBanner("<span>Loaded the draft saved to your account" +
      (h.from ? " from " + esc(h.from) : "") + whenAgo(h.at) + ".</span>");
    setTimeout(function () { var b = $("#syncBar"); if (b) b.remove(); }, 8000);
  } else if (h.mode === "conflict") {
    offerConflict(SYNC.conflict() || h);
  } else if (h.mode === "offline") {
    syncBanner("<span>Working offline — the board is running on this device's copy and " +
      "will sync to your account when the connection is back.</span>", "soon");
  }

  SYNC.onNotice = function (kind, info) {
    if (kind === "offline") {
      // Say it once and leave it up. Picks are still being recorded; what has
      // stopped is the copy going to the account, and that is worth knowing
      // before you pick up a different device.
      if (!$("#syncBar") || !$("#syncBar").dataset.offline) {
        syncBanner("<span>Can't reach your account right now — every pick is still being " +
          "saved on this device, and they'll go up as soon as the connection is back.</span>",
          "soon").dataset.offline = "1";
      }
    }
    else if (kind === "saved") {
      var b = $("#syncBar");
      if (b && b.dataset.offline) b.remove();
    }
    else if (kind === "conflict") offerConflict(info);
    else if (kind === "signedout") {
      syncBanner("<span>Your sign-in expired, so nothing is being saved to your account. " +
        "This device's copy is intact." + "</span><span class='grow'></span>" +
        '<a class="btn btn-sm btn-primary" href="index.html">Sign in again</a>', "drift");
    }
  };
}

syncKeepers();
initSync();
if (S.league.pickSeconds) $("#pickSecs").value = S.league.pickSeconds;
render();
tickClock();
checkForUpdate();
// A new account used to land on League setup with no context: forty scoring
// fields and nothing saying what to do first. The guide leads there instead, and
// it is shown once per account on this device.
if (!localStorage.getItem(KEY_SEEN)) openQuickStart();
save();
/* Not on touch. Focusing this at boot raises the iOS keyboard and Chrome's
   autofill accessory bar — key, card, location — over the roster strip before
   the user has tapped anything, and guardSearch()'s readonly trick cannot stop
   it because it lifts itself on the focus event. The keyboard is one tap away
   and the board is what the user came for. Desktop keeps it, and so does "/". */
if (!IS_TOUCH) $("#search").focus();
})();
