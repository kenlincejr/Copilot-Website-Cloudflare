/* DRAFTLINE app — draft room UI. Reads engine.js for every number it shows. */
(function () {
"use strict";

var E = DRAFTLINE_ENGINE, PRESETS = DRAFTLINE_PRESETS, DATA = DRAFTLINE_DATA, AUTH = DRAFTLINE_AUTH;
var SYNC = globalThis.DRAFTLINE_SYNC || null;
var IMPACT = globalThis.DRAFTLINE_IMPACT;
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

/**
 * Whether the live draft box is on screen. renderStatus uses it to stay out of
 * the box's way: the two panels sit within an inch of each other and every fact
 * printed in both of them is one the reader has to check twice.
 */
function trackerShowing() {
  return isLive() && !!(S.draftStarted || S.picks.length);
}

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
    // The per-pick countdown is gone, and so is the pause that went with it. All
    // that is kept from it is the one fact it was ever built on: when the last
    // pick was recorded. Drafts saved before this carry the old field names.
    if (o.lastPickAt == null && o.pickStartedAt != null) o.lastPickAt = o.pickStartedAt;
    delete o.pickStartedAt; delete o.paused; delete o.pausedAt;
    if (o.league) delete o.league.pickSeconds;
    return o;
  }
  catch (e) { return null; }
}
function save() {
  var raw = JSON.stringify({
    league: S.league, picks: S.picks,
    draftStarted: S.draftStarted, startedAt: S.startedAt, lastPickAt: S.lastPickAt,
    draftEnded: S.draftEnded, simulated: S.simulated,
    practice: S.practice, planShown: S.planShown,
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
  // A pick logged without a name is a spent slot, not a spent player — he is
  // still on the board. Writing p.name in unfiltered put a literal "null" key in
  // the set, which nothing ever looked up but which made the set mean something
  // other than what it is called.
  allPicks().forEach(function (p) { if (p.name) set[p.name] = true; });
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
  S.lastPickAt = Date.now();
  save();
  if (!quiet) { openUndoWindow(); render(); }
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

  // Real-draft telemetry has to land on the board BEFORE anything is scored.
  // It used to be attached in the same loop that scores, a dozen lines below
  // the composite() call, so every player was priced against his grade as it
  // stood before his own trend was known — the signal was on screen in the
  // TREND column and reached the score for nobody. Attaching it here, and
  // re-deriving the grades off it, is the whole difference between showing the
  // market moving and acting on it.
  board.players.forEach(function (p) {
    var y = ya[normName(p.name)];
    if (!y) return;
    p.yadp = y.all;
    // Positive means the room is taking him earlier this week than it has all
    // preseason — the market moving toward him in real drafts.
    p.ytrend = (y.recent != null && y.all != null) ? +(y.all - y.recent).toFixed(1) : null;
    p.ypct = y.pct;
  });
  E.applyMarketSignals(board.players);

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
  // repeated in the app bar, the status strip and the tracker. The live draft
  // box carries all of it now; the strip carries the roster gap and nothing
  // else; the bar is identity and actions only.
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
  // The breakdown modal, when it happens to be open on a player, is kept live —
  // recording a pick while it is open should not leave stale numbers on screen.
  if (view.selected && !$("#detailModal").classList.contains("hidden")) {
    renderDetail(view.selected);
  }
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

/* Drift detection used to live here: a pick number the user re-typed every
   round so the board could turn red when the two disagreed. It only ever worked
   if it was fed, and feeding it is the exact chore a person sitting in a live
   draft will not do. What replaced it is `sinceLastPick()` below — a fact the
   board already owns — and a catch-up sheet the user opens on purpose when they
   sit back down. See renderTracker's "keeping up" band. */

/**
 * The starting lineup as labeled slots, with who is in each and whether an
 * empty one can actually be filled this round.
 *
 * assignRoster() returns slots tagged only by position, so two running back
 * slots are both "RB" and an empty one cannot be named. Everything that has to
 * talk about a hole — the status strip, the payload's roster block — needs the
 * same three answers, and they were being derived separately in each place.
 *
 * "Blocked" is the floor, not the cap: a kicker slot is empty from pick 1 and
 * cannot be filled until round 14, so calling it a need in round 8 is noise.
 */
function startingSlots() {
  var roster = (S.league.rules.roster) || {};
  var round = A.onClock ? A.onClock.round : 1;
  var seen = {};
  return A.roster.slots.map(function (s) {
    var n = (seen[s.pos] = (seen[s.pos] || 0) + 1);
    var many = (s.pos === "FLEX" ? 1 : (roster[s.pos] || 1)) > 1;
    var floor = s.pos === "K" ? A.ctx.kFloorRound
              : s.pos === "DEF" ? A.ctx.defFloorRound : 0;
    return {
      pos: s.pos,
      label: s.pos + (many ? String(n) : ""),
      player: s.player || null,
      floor: floor || 0,
      blocked: !!(floor && round < floor)
    };
  });
}

/** The slots still empty that the board would let you fill right now. */
function openStartingSlots() {
  return startingSlots().filter(function (s) { return !s.player && !s.blocked; });
}

/**
 * What is still missing from the starting lineup, as data rather than a
 * sentence.
 *
 * It used to be prose, and the prose was the whole problem with the strip:
 * "still need RB1, RB2, WR1 +3 more · K from round 14, DEF from round 7 · 14
 * picks left" is four separate ideas competing for one line, and on an iPad it
 * crowded into an unreadable ribbon. The strip prints the open slots as chips
 * now, capped, and nothing else.
 *
 * The floors — a kicker that cannot be taken until round 14 — are deliberately
 * dropped here rather than shortened. They are a promise about later, not
 * something to act on this pick, and the roster panel already shows K 0/1.
 *
 * Deliberately not built from need[pos].short: that is
 * max(0, want - got) + flexOpen * FLEX_SPLIT[pos], a fraction, and "you still
 * need WR 1.4" is not a thing to put in front of anyone. The slots themselves
 * are the honest source.
 */
function needSummary() {
  if (!A.myNext) return null;
  var open = [];
  startingSlots().forEach(function (sl) {
    if (!sl.player && !sl.blocked) open.push(sl.label);
  });
  return { open: open, picks: (A.upcoming || []).length,
           filled: open.length === 0 };
}

/**
 * How long since a pick was recorded on this board.
 *
 * This is the honest remainder of the pick clock. That clock counted down from
 * the league's pick length, started by the last pick recorded here — so it was
 * never Yahoo's timer, and it could not be: nobody takes their full two minutes
 * and the next team is on the clock the instant the last one picks. It was
 * precision the board did not have.
 *
 * What the same timestamp does support is the question actually worth asking on
 * draft night: have I stepped away and missed a run of picks? Ten minutes of
 * silence on a board that is being kept by hand means yes.
 */
function sinceLastPick() {
  if (!S.lastPickAt) return null;
  var mins = Math.floor((Date.now() - S.lastPickAt) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  var hrs = Math.floor(mins / 60);
  return hrs + " hr " + (mins % 60) + " min ago";
}

/**
 * The strip under the app bar: what you are still drafting for, and nothing
 * else.
 *
 * It used to carry the state phrase, the round, the pick, your next pick, four
 * clauses of roster need and a countdown, all on one scrolling line. Every one
 * of those except the need is now in the live draft box, twenty pixels below
 * it, said better. What is left is the one thing the box does not say and the
 * roster panel says too far away to glance at: the holes in your starting
 * lineup, as chips, with how many picks you have left to fill them.
 */
function renderStatus() {
  var el = $("#statusBar"), total = S.league.teams * S.league.rounds;

  // The way in stays visible until a draft is actually running, and comes back
  // the moment one is reset — it is how you reach the practice run.
  $("#btnBegin").classList.toggle("hidden", !!S.draftStarted);
  $("#btnLeague").classList.toggle("hidden", !isLive());

  var need = A.myNext ? needSummary() : null;

  // Before a draft is running, and after it is over, there is nothing to be
  // drafting for. An empty bar is better than a bar saying nothing.
  if (!need || A.cur > total) { el.className = "statusbar hidden"; el.innerHTML = ""; return; }

  el.className = "statusbar";
  if (need.filled) {
    el.innerHTML = '<span class="sb-k">roster</span>' +
      '<span class="sb-full">Every starter filled</span>' +
      "<span class='grow'></span>" + sbPicksLeft(need);
    return;
  }

  // Four chips is what fits beside the label and the pick count on an iPad in
  // portrait, measured. Past that the count is the useful half of the sentence
  // anyway, and the roster panel has the full list.
  var CAP = 4;
  var shown = need.open.slice(0, CAP);
  var rest = need.open.length - shown.length;
  el.innerHTML =
    '<span class="sb-k">still need</span>' +
    '<span class="sb-chips">' +
      shown.map(function (lbl) {
        return '<span class="sb-chip pos-' + lbl.replace(/\d+$/, "") + '">' + esc(lbl) + "</span>";
      }).join("") +
      (rest ? '<span class="sb-chip sb-more" title="' + esc(need.open.join(", ")) + '">+' +
        rest + "</span>" : "") +
    "</span>" +
    "<span class='grow'></span>" + sbPicksLeft(need);
}

function sbPicksLeft(need) {
  return '<span class="sb-left"><b>' + need.picks + "</b> pick" +
    (need.picks === 1 ? "" : "s") + " left</span>";
}

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
  // Which of the two doors was used. Simulate is a rehearsal control and the
  // tracker has no other way to know it is not wanted on the night.
  S.practice = !!practice;
  S.startedAt = Date.now();
  S.lastPickAt = Date.now();
  save();
  render();
  closeModal("#beginModal");
  if (practice) {
    if (myTurn() || (A.myNext && A.myNext === A.cur)) {
      banner("Practice run ready \u2014 the first pick is yours. Take one from the board, " +
        "then hit Simulate and the room drafts to your next pick.", true);
    } else {
      simulateToMyPick();
    }
  } else {
    banner("Draft tracker is live. Tap a player as each pick goes in — " +
      "twice on a tablet — and the board stays honest.");
  }
  // The plan is worth most in the sixty seconds before the first pick, which is
  // exactly when nobody thinks to go looking for it in a menu. Shown once per
  // draft, on the way in, and reachable from More afterwards.
  if (!S.planShown) {
    S.planShown = true; save();
    setTimeout(openDraftPlan, 400);
  }
}

$("#btnBegin").addEventListener("click", openBegin);
$("#beginClose").addEventListener("click", function () { closeModal("#beginModal"); });
$("#beginPractice").addEventListener("click", function () { startLive(true); });
$("#beginLive").addEventListener("click", function () { startLive(false); });



/* ------------------------------------------------------------- catch-up */

/**
 * The way back from stepping away: one row per pick this board has not got,
 * in order, each addressed to the team whose slot it was.
 *
 * It takes the count from its caller now rather than reading a drift signal of
 * its own. There is no drift signal any more — the board does not watch the
 * real draft, it is told about it, once, by someone who has just sat back down.
 */
function openCatchup(d) {
  if (!d || d < 1) return;
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
$("#btnPlan").addEventListener("click", openDraftPlan);
$("#planClose").addEventListener("click", function () { closeModal("#planModal"); });
$("#detailClose").addEventListener("click", function () { closeModal("#detailModal"); });

/** A short-lived message under the status bar, for things worth reading once. */
function banner(msg, isWarn) {
  var el = document.createElement("div");
  // It used to borrow the strip's own state colors. The strip has no state
  // colors any more — it is one quiet line about the roster — so the banner
  // carries its own.
  el.className = "flashbar" + (isWarn ? " warn" : "");
  el.innerHTML = "<span>" + esc(msg) + "</span>";
  $("#statusBar").insertAdjacentElement("afterend", el);
  setTimeout(function () { el.remove(); }, 9000);
}

/* ---------------------------------------------------------- view plumbing */

// Rotating an iPad changes which layout applies, and the column template is
// generated rather than declared, so it has to be rebuilt.
var resizeTimer = null;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () { if (A) { renderColumnHeads(); renderList(); } }, 150);
});

// The strip and the box both print how long ago the last pick landed, and that
// number goes stale on its own with nothing to trigger a re-render. A minute is
// the resolution it is printed at, so a minute is how often it is refreshed.
setInterval(function () { if (A && S.draftStarted) renderTracker(); }, 60000);

/* --------------------------------------------------------- draft tracker */

/* ------------------------------------------------------------------ the box

   The live draft box answers three questions, pick after pick, without being
   read: where the draft is, who just went, and what to do next. The brief and
   the cards below it answer the fourth — who to take.

   Four bands, in that order:

     head   your own state, the round, and how far through the draft it is
     do     the single next action, in a sentence, with its one button
     order  the picks either side of now, so "am I still in step" is a glance
     keep   how long since a pick landed here, and the way back if you stepped
            away and missed a run of them

   Two things it deliberately does not have. There is no search box: a pick is
   recorded by tapping the player in the list, which is where the names already
   are and where the ADP, the tier and the survival number are too. And there is
   no clock. The countdown that used to sit here started from the last pick
   recorded on this board, so it was never Yahoo's timer and could not be —
   nobody takes their full two minutes, and the next team is up the instant the
   last one picks. All that survives it is the timestamp in the "keep" band,
   which answers the question that is actually worth asking: have I been away
   long enough to have missed something? */

/** Both folds are view state, not draft state — they never reach save(). */
var tkKeepOpen = false, tkMoreOpen = false;

/** Minutes of silence on a hand-kept board before it is worth asking about. */
var TK_STALE_MIN = 8;

/**
 * A team, in its own color.
 *
 * The hue is the slot walked around the wheel by the golden angle, so any team
 * count spreads as far apart as it can with no table to keep in step. Saturation
 * and lightness are fixed, which means every chip weighs the same against the
 * panel and none of them is legible only by hue — the chip always carries the
 * team's own name, and the color is a way to find it fast across a room, not the
 * information itself. Your own seat stays teal, because that is what teal means
 * everywhere else in this app.
 */
function teamChip(slot) {
  var mine = slot === S.league.slot;
  return '<span class="tk-who' + (mine ? " me" : "") + '"' +
    (mine ? "" : ' style="--tc:' + Math.round((slot * 137.508) % 360) + '"') +
    ">" + esc(teamLabel(slot, true)) + "</span>";
}

/**
 * The line the user checks against Yahoo after every pick.
 *
 * It is one line, directly under the head, because it is read more often than
 * anything else on the panel and reading it must never mean scrolling. For four
 * seconds after a record it carries its own Undo — see openUndoWindow.
 */
function lastPickLine() {
  var p = S.picks[S.picks.length - 1];
  if (!p) return "";
  var pl = BY_NAME[p.name] || {};
  return '<div class="tk-last">' +
    '<span class="tk-lastlab">Last</span>' +
    '<span class="tk-lastpk">pick ' + p.pick + "</span>" + teamChip(p.slot) +
    (p.unknown
      ? '<button type="button" class="tk-name" id="tkNameIt">name not recorded — name him</button>'
      : '<span class="tk-lastwho">' + (pl.pos ? posChip(pl.pos) + " " : "") + esc(p.name) + "</span>") +
    (undoWindowOpen()
      ? '<button class="btn btn-sm btn-ghost tk-undo" id="tkUndo">Undo</button>' : "") +
    "</div>";
}

/**
 * Four past picks is the right number on a screen with room for it, and two is
 * the right number on a tablet, where the panel has to fit its column: in
 * portrait the pick-to-pick loop above has to stay above the fold, and in
 * landscape E1 requires the whole tracker visible without scrolling. The
 * last-pick line carries the most recent one either way, so the rows below it
 * are history rather than the thing being checked.
 */
function tkPastCount() {
  try {
    return window.matchMedia("(max-width: 1200px)").matches ? 2 : 4;
  } catch (e) { return 4; }
}

/** Three picks ahead, the pick on the clock, and the recent past under it. */
function orderRows() {
  var total = S.league.teams * S.league.rounds;
  function row(pk, slot, what, cls) {
    return '<div class="tk-row ' + cls + (slot === S.league.slot ? " mine" : "") + '">' +
      '<span class="tk-n">' + pk + "</span>" +
      '<span class="tk-t">' + esc(teamLabel(slot, true)) + "</span>" +
      '<span class="tk-w">' + what + "</span></div>";
  }
  var guess = {};
  if (!S.draftEnded && A.cur <= total) {
    (roomTargets().ahead || []).forEach(function (g) {
      if (g.player) guess[g.pick] = g.player;
    });
  }
  var rows = [];
  for (var pk = Math.min(total, A.cur + 3); pk > A.cur; pk--) {
    var kp = keeperAt(pk), owner = ownerOfPick(pk).slot;
    var g = guess[pk];
    rows.push(row(pk, owner,
      kp ? '<span class="tk-kp">keeper</span> ' + esc(kp.name)
         : owner === S.league.slot ? "your pick"
         // One rollout of the room, not a prediction with a number on it — dim,
         // and never a tap target. It is here so a run is visible forming.
         : g ? '<span class="tk-guess">maybe ' + esc(g.name) + "</span>"
         : "", "up"));
  }
  rows.push(row(A.cur, A.onClock.slot, "on the clock", "now"));
  S.picks.slice(-tkPastCount()).reverse().forEach(function (p) {
    var pl = BY_NAME[p.name] || {};
    // The snake says whose pick it was; p.slot says who was credited with it.
    // When they differ the row used to just show the credited team, which reads
    // as a defect rather than as the re-credit it is.
    var moved = !p.keeper && p.slot !== ownerOfPick(p.pick).slot;
    rows.push(row(p.pick, p.slot, (p.unknown
      ? "<i>name not recorded</i>"
      : posChip(pl.pos || "K") + " " + esc(p.name)) +
      (moved ? ' <span class="tk-rc">re-credited</span>' : ""), "past"));
  });
  return rows.join("");
}

/** One tap: the player the room was going to take anyway, to the team on it. */
function takeTarget(name) {
  if (!name || !A.onClock) return;
  recordTo(name, A.onClock.slot);
}

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
      S.draftEnded = false; S.lastPickAt = Date.now(); save(); render();
    };
    $("#tkReport").onclick = function () { $("#btnReport").click(); };
    armOnce($("#tkReset2"), "Start over", resetDraft);
    return;
  }

  var onMe = A.onClock.slot === S.league.slot;
  var gap = A.myNext ? A.myNext - A.cur : null;
  var plural = function (c, one) { return c === 1 ? one : one + "s"; };

  /* ---- head: where the DRAFT is, and where you are under it.
     It used to lead with "You're up in 8 picks" and bury the team on the clock
     in a sentence three bands down. But for 165 of the 180 picks the question
     the user has is not about them — it is "whose pick is this, and did the
     last one land". So the clock leads, and your own turn takes the line back
     the moment it is yours. */
  var mine = onMe ? "You're on the clock"
    : gap === null ? "Your picks are all in"
    : gap === 1 ? "You're up next"
    : "You're up in " + gap + " picks";
  // No "on the clock" after the chip: the pick number and the team are the
  // whole sentence, and on a tablet column the extra three words are a third
  // line the panel cannot spare.
  var clock = "Pick " + A.cur + " · Round " + A.onClock.round + " · " +
    teamChip(A.onClock.slot);

  var state = onMe ? mine : clock;
  var sub = onMe
    ? clock
    : mine + (A.myNext ? " · picks " + A.myNext + (A.myAfter ? " and " + A.myAfter : "") : "");
  var done = Math.round(S.picks.length / total * 100);

  /* ---- do: one instruction, one button. The branches are exclusive, so there
     is never a second thing on screen competing to be the next move. */
  var doHtml;
  if (S.practice && !onMe && A.myNext) {
    doHtml = '<div class="tk-do">' +
      "<div><b>Practice run.</b><span>The room drafts itself up to your turn — " +
      "nothing in here is real.</span></div>" +
      '<button class="btn btn-sm btn-primary" id="tkSim">Simulate to ' + A.myNext + "</button></div>";
  } else if (onMe) {
    doHtml = '<div class="tk-do me"><div><b>Your pick — take it off the board.</b><span>' +
      (IS_TOUCH ? "Tap a name in the player list, then tap it again to draft him."
                : "Double-click a name in the player list, or use Draft on his card.") +
      "</span></div></div>";
  } else {
    /* The pick-to-pick loop. Three names the room is most likely to take, each
       one tap; the head advances and the next team's three render in the same
       place, so recording an opponent's pick costs a tap and no scrolling.
       Every chip carries the position, the NFL team and the ADP as well as the
       name, because the tap is confirmed against the Yahoo panel by eye and a
       bare name is not enough to do that with. The caption is computed from the
       round, so the confidence on screen falls off with the measurement instead
       of outliving it. */
    var tg = roomTargets();
    var caption = targetCaption(A.onClock.round);
    var chips = tg.list.map(function (t, i) {
      var p = t.player;
      return '<button class="btn tk-tgt" data-name="' + esc(p.name) + '">' +
        '<kbd class="tk-key">' + (i + 1) + "</kbd>" +
        '<span class="tk-tname">' + esc(p.name) + "</span>" +
        posChip(p.pos) +
        '<span class="tk-tmeta">' + esc(p.team || "") +
          " · adp " + (Math.round(marketAdp(p).adp * 10) / 10) + "</span></button>";
    }).join("");

    doHtml = '<div class="tk-do">' +
      // The head above already leads with the pick and the team, so repeating
      // it here is a third line saying the same thing on a column this narrow.
      // It earns its place only when there are no chips under it to explain.
      (chips
        ? '<div class="tk-tgtcap">' + caption + '</div><div class="tk-targets' +
          (caption === "long shots" ? " ghost" : "") + '">' + chips + "</div>"
        : "<div><b>Pick " + A.cur + " goes to " + esc(teamLabel(A.onClock.slot)) + ".</b></div>") +
      '<div class="tk-fall"><span>' +
      (IS_TOUCH ? "Took someone else? Tap him in the player list."
                : "Took someone else? Double-click him in the player list.") +
      "</span></div>" +
      // The old button here was "Missed the name", and it was two steps
      // pretending to be one: it logged an unnamed pick against whichever team
      // the snake said was on the clock, and then naming the player afterwards
      // recorded a *second* pick. Two slots burned for one real pick, and a
      // draft log that disagreed with the draft. This does the whole thing in
      // one action, and the team is chosen rather than assumed.
      '<button class="btn btn-sm btn-ghost" id="tkPickTeam" ' +
        'title="Log this pick against a team without a player name">' +
        "Pick went to…</button></div>";
  }

  /* ---- order: three picks ahead, the pick on the clock, and the past under
     it. Reading down the column is going back in time, which is the direction
     the numbers already run. It replaces both the on-the-clock / on-deck grid
     and the recent list — those were the same handful of facts, printed twice,
     in two different shapes, and neither one showed both sides of now. Built by
     orderRows(). */

  /* ---- keep: the step-away band.
     This board only knows what has been typed into it, so the failure that
     actually happens on draft night is not mistyping a pick — it is getting up
     for five minutes and coming back six picks behind. The line says how long
     it has been quiet; past TK_STALE_MIN it says so in amber and opens itself.
     Catching up is one number: the pick Yahoo is showing. */
  var idle = S.lastPickAt ? Math.floor((Date.now() - S.lastPickAt) / 60000) : null;
  var stale = idle !== null && idle >= TK_STALE_MIN && !onMe;
  var keepOpen = tkKeepOpen || stale;
  var keepNote = !S.picks.length ? "No picks recorded here yet"
    : stale ? "Nothing recorded for " + sinceLastPick().replace(" ago", "") + " — stepped away?"
    : "Last pick recorded " + sinceLastPick();

  el.innerHTML =
    '<div class="tracker' + (onMe ? " up" : "") + '">' +

      '<div class="tk-head">' +
        "<b>" + state + "</b>" +
        '<span class="tk-ctl">' +
          '<button class="btn btn-sm btn-ghost" id="tkMore" aria-expanded="' + tkMoreOpen +
            '" aria-label="More draft controls">⋯</button>' +
        "</span>" +
      "</div>" +
      '<div class="tk-sub">' + sub + "</div>" +
      '<div class="tk-bar" title="' + S.picks.length + " of " + total +
        ' picks recorded"><i style="width:' + done + '%"></i></div>' +
      lastPickLine() +
      (S.simulated
        ? '<div class="tk-sim">Includes simulated picks — this is not a record of a ' +
          "real draft.</div>"
        : "") +

      '<div class="tk-over' + (tkMoreOpen ? "" : " hidden") + '">' +
        (S.practice && (onMe || !A.myNext)
          ? '<button class="btn btn-sm btn-ghost" id="tkSim">Simulate</button>' : "") +
        '<button class="btn btn-sm btn-ghost" id="tkStop">Stop draft</button>' +
        '<button class="btn btn-sm btn-ghost btn-danger" id="tkReset" ' +
          'title="Clear every pick and go back to pick 1. Settings are kept.">Start over</button>' +
        '<span class="tk-overnote">Stop keeps every pick and lets you resume. Start over clears ' +
          "them and returns to pick 1 — scoring, roster, keepers and team names are kept.</span>" +
      "</div>" +

      doHtml +
      '<div class="tk-order">' + orderRows() + "</div>" +

      '<div class="tk-keep' + (stale ? " stale" : "") + '">' +
        '<button type="button" class="tk-keepbtn" id="tkKeepT" aria-expanded="' + keepOpen + '">' +
          '<span class="tk-dot"></span><span class="tk-keepnote">' + esc(keepNote) + "</span>" +
          '<span class="tk-chev">' + (keepOpen ? "▴" : "▾") + "</span></button>" +
        '<div class="tk-keepbody' + (keepOpen ? "" : " hidden") + '">' +
          '<div class="tk-keephint">Stepped away? This board has <b>' + A.cur +
            "</b> on the clock. Type the pick number Yahoo is showing and record what " +
            "went while you were gone.</div>" +
          '<span class="tk-field"><label for="tkYahoo">Yahoo is on pick</label>' +
            '<input type="number" id="tkYahoo" inputmode="numeric" pattern="[0-9]*" ' +
              'min="1" max="' + total + '" autocomplete="off" placeholder="' + A.cur + '"></span>' +
          '<button class="btn btn-sm btn-primary" id="tkCatch" disabled>Catch up</button>' +
          '<span class="tk-keepmsg" id="tkKeepMsg"></span>' +
        "</div>" +
      "</div>" +
    "</div>";

  $("#tkKeepT").onclick = function () { tkKeepOpen = !keepOpen; renderTracker(); };
  $("#tkMore").onclick = function () { tkMoreOpen = !tkMoreOpen; renderTracker(); };
  if ($("#tkSim")) $("#tkSim").onclick = simulateToMyPick;
  $("#tkStop").onclick = function () {
    S.draftEnded = true; save(); render();
  };
  armOnce($("#tkReset"), "Start over", resetDraft);
  if ($("#tkPickTeam")) $("#tkPickTeam").onclick = function (e) {
    openPickTeam($("#tkPickTeam"), e);
  };
  if ($("#tkUndo")) $("#tkUndo").onclick = undo;
  // Naming a blank pick already has a path — find the player, and his assign
  // popover offers to fill the blank rather than spend a second slot. This is
  // the first step of it, so the line that reports the problem also starts the
  // fix instead of describing it.
  if ($("#tkNameIt")) $("#tkNameIt").onclick = function () { $("#search").focus(); };
  // One delegated handler: the chips are rewritten on every record, and this
  // block re-binds after each innerHTML write like everything else here.
  $$("#tracker .tk-tgt").forEach(function (b) {
    b.onclick = function () { takeTarget(b.dataset.name); };
  });

  /* The catch-up field writes into its own message and button rather than
     re-rendering the panel. A re-render on every keystroke is what forced the
     old live-pick field to save and restore its own caret, and the field is
     under a thumb on a tablet. */
  var yah = $("#tkYahoo"), msg = $("#tkKeepMsg"), go = $("#tkCatch");
  function readGap() {
    var v = parseInt(yah.value, 10);
    if (!v || v < 1) return null;
    return v - A.cur;
  }
  function paintGap() {
    var g = readGap();
    if (g === null) { msg.textContent = ""; msg.className = "tk-keepmsg"; go.disabled = true; return; }
    if (g > 0) {
      msg.textContent = g + " " + plural(g, "pick") + " to record.";
      msg.className = "tk-keepmsg";
      go.disabled = false;
      go.textContent = "Catch up " + g;
    } else if (g === 0) {
      msg.textContent = "In step — nothing to record.";
      msg.className = "tk-keepmsg ok";
      go.disabled = true; go.textContent = "Catch up";
    } else {
      // Recorded more than have happened. Undo is in the app bar, one press
      // deep, and saying so is more use than a second button for it here.
      msg.textContent = "This board is " + (-g) + " ahead. Use Undo in the bar above.";
      msg.className = "tk-keepmsg warn";
      go.disabled = true; go.textContent = "Catch up";
    }
  }
  yah.addEventListener("input", paintGap);
  go.onclick = function () { var g = readGap(); if (g > 0) openCatchup(g); };
}

/**
 * Back to pick one. Clears every pick and the draft's own state — when the last
 * pick landed, whether it was started or stopped, the simulated flag — and touches
 * nothing else. Scoring, roster shape, keepers, team names, draft style and
 * column choices all survive, which is what makes it safe to press when you just
 * want another run at it.
 */
function resetDraft() {
  S.picks = [];
  S.draftStarted = false;
  S.draftEnded = false;
  S.lastPickAt = null;
  S.simulated = false;
  S.practice = false;
  S.reportShown = false;          // a fresh draft earns its ending again
  S.planShown = false;            // and its plan
  view.selected = null;
  view.rosterSlot = null;
  briefCache = {};
  // And the re-ask counters with it. A practice draft that spent both
  // re-asks at pick 11 was reaching pick 11 of the real draft with the
  // budget already gone, so the first stale brief of the night went
  // straight to the "went at pick N" banner without being re-asked.
  briefTries = {};
  briefWrittenAt = {};
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

/* ------------------------------------------------- the four-second window

   armOnce above is press-to-arm, because what it guards cannot be taken back.
   This is the other shape: recording a pick is one tap by design, so the
   confirmation has to come after it. For four seconds the last-pick line
   carries an Undo, and that window is the whole safety net for a mis-tap.

   State is a timestamp and nothing else. undo() already means "pop the last
   real pick", so there is no stack to keep in step: record again inside the
   window and it simply re-opens against the new last pick. Batched records —
   catch-up, Simulate — pass quiet and arm nothing, which is right, because
   nobody is watching those go by one at a time. */
var TK_UNDO_MS = 4000;
var tkUndoUntil = 0, tkUndoTimer = null;

function undoWindowOpen() { return Date.now() < tkUndoUntil; }

function openUndoWindow() {
  tkUndoUntil = Date.now() + TK_UNDO_MS;
  // Without this, three fast records leave three pending re-renders behind and
  // the band flickers as each one fires.
  clearTimeout(tkUndoTimer);
  tkUndoTimer = setTimeout(function () { renderTracker(); }, TK_UNDO_MS + 20);
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

/* --------------------------------------------------- the room, per pick */

/** Every team's position counts so far, keyed by slot. */
function slotCounts() {
  var rosters = allRosters(), counts = {};
  Object.keys(rosters).forEach(function (slot) {
    counts[slot] = {};
    rosters[slot].forEach(function (q) { counts[slot][q.pos] = (counts[slot][q.pos] || 0) + 1; });
  });
  return counts;
}

/* roomPick() draws once. Ranking by how often a name wins the draw needs many
   draws, and the pool is truncated by ADP first because a player forty picks
   past the current one never wins one. measure-roompick.js runs 150 over 70
   offline; 120 over 60 holds the top two steady at a few milliseconds, and the
   third chip is a coin toss from round 9 by measurement, so the sampling
   precision beyond this would be describing noise more precisely. */
var TARGET_TRIALS = 120, TARGET_POOL = 60;
var TARGET_CACHE = { a: null, out: null };

/**
 * The three players the team on the clock is most likely to take, by frequency.
 *
 * Deliberately not ordered by the board's own score: the question here is what
 * the room will do, not what it should do. Same roomPick() and marketAdp() the
 * practice room and Simulate use, so a pasted Yahoo draft-analysis file sharpens
 * these the way it sharpens everything else, and the rehearsal drafts the room
 * the night will.
 *
 * The seed is fixed to the pick number, so re-rendering the panel cannot
 * re-order the chips. On a touch screen a list that re-sorts between the eye
 * and the finger is a wrong-tap generator, and a wrong tap here is a silently
 * wrong board.
 */
function roomTargets() {
  if (TARGET_CACHE.a === A) return TARGET_CACHE.out;

  var slot = A.onClock.slot, counts = slotCounts();
  var runs = (A.runInfo || {}).runs || {};
  var roster = S.league.rules.roster;
  var pool = A.avail.slice().sort(function (x, y) { return marketAdp(x).adp - marketAdp(y).adp; })
    .slice(0, TARGET_POOL)
    .map(function (p) { var m = marketAdp(p); return { player: p, adp: m.adp, sd: m.sd, pct: m.pct }; });

  var rnd = mulberry32(A.cur * 7919 + 20260908);
  var tally = Object.create(null), byName = Object.create(null);
  for (var t = 0; t < TARGET_TRIALS; t++) {
    var got = E.roomPick(pool, rnd, { counts: counts[slot] || {}, roster: roster, runs: runs });
    if (!got) continue;
    tally[got.name] = (tally[got.name] || 0) + 1;
    byName[got.name] = got;
  }
  var list = Object.keys(tally).sort(function (x, y) { return tally[y] - tally[x]; })
    .slice(0, 3)
    .map(function (n) { return { player: byName[n], freq: tally[n] / TARGET_TRIALS }; });

  /* The upcoming rows want one name each, not three more simulations: this is
     one rollout of the next few picks off the same draw, so a run forming is
     visible before it lands. One sample, so it renders dim and is never a tap
     target. */
  var ahead = [], gone = Object.create(null), total = S.league.teams * S.league.rounds;
  for (var k = 1; k <= 3 && A.cur + k <= total; k++) {
    var aslot = ownerOfPick(A.cur + k).slot;
    var left = pool.filter(function (c) { return !gone[c.player.name]; });
    var pick = left.length
      ? E.roomPick(left, rnd, { counts: counts[aslot] || {}, roster: roster, runs: runs })
      : null;
    if (pick) {
      gone[pick.name] = true;
      counts[aslot] = counts[aslot] || {};
      counts[aslot][pick.pos] = (counts[aslot][pick.pos] || 0) + 1;
    }
    ahead.push({ pick: A.cur + k, slot: aslot, player: pick });
  }

  TARGET_CACHE = { a: A, out: { slot: slot, round: A.onClock.round, list: list, ahead: ahead } };
  return TARGET_CACHE.out;
}

/**
 * How much weight to put on those three, in the user's own words.
 *
 * From the measurement in tools/measure-roompick.js: three predictions cover
 * the actual pick 88% of the time in round 1 and 52% in round 8, then fall to a
 * coin toss by round 9 and to noise by round 12. The caption is computed from
 * the round so the confidence on screen degrades with the number rather than
 * outliving it.
 */
function targetCaption(round) {
  return round <= 8 ? "likely" : round <= 11 ? "maybe" : "long shots";
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
  var counts = slotCounts();             // per-slot position counts, as we go
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
  S.lastPickAt = Date.now();
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
    // A pick with no slot belongs to no team and cannot be put on one. State
    // saved before the board credited every pick still carries them.
    if (!out[pk.slot]) return;
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
  // Same reason as in analyze(): the mock has to price players against grades
  // that already know what the market did this week, or a rehearsal is scored
  // on different information than the live board beside it.
  E.applyMarketSignals(board.players);
  var total = S.league.teams * S.league.rounds;
  var startPick = currentPick();
  var seededTaken = draftedNames();
  var seededMine = A.mine.slice();
  var runs = [];

  // What each simulated draft actually handed us, pick number by pick number.
  // `runs` only keeps the roster, which is enough to score a style and useless
  // for answering "what does round 6 look like" — the question the pre-draft
  // plan exists to answer.
  var planRuns = [];

  for (var it = 0; it < iterations; it++) {
    var rnd = mulberry32(seed + it * 7919);
    var taken = Object.assign({}, seededTaken);
    var mine = seededMine.slice();
    var myPicks = [];
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
        if (ownerOfPick(pk).slot === S.league.slot && byName[k.name]) {
          myPicks.push({ pick: pk, name: k.name, pos: byName[k.name].pos, keeper: true });
        }
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
        var best = null, bestScore = -1e9, bestWhy = null;
        for (var i = 0; i < avail.length; i++) {
          // The detail, not just the score. composite() already writes the
          // sentence explaining itself; throwing it away and then guessing at
          // the reason afterwards is how a panel ends up inventing one.
          var det = E.composite(avail[i], ctx);
          if (det.score > bestScore) { bestScore = det.score; best = avail[i]; bestWhy = det; }
        }
        if (best) {
          taken[best.name] = true; mine.push(best);
          myPicks.push({ pick: pk, name: best.name, pos: best.pos,
                         // What was still empty when this pick was made. "Your
                         // backs were already full by here" is the other half of
                         // any answer about why a position went when it did.
                         open: E.assignRoster(mine.slice(0, mine.length - 1), rules).slots
                                .filter(function (sl) { return !sl.player; })
                                .map(function (sl) { return sl.pos; }),
                         why: (bestWhy.reasons || []).slice(0, 3) });
        }
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
    planRuns.push(myPicks);
  }
  return summarizeMock(runs, rules, planRuns);
}

/**
 * The round-by-round view of those same simulations: for each of your picks,
 * what position it usually turns into and who is usually there.
 *
 * The names are the point and also the thing most likely to be wrong, so the
 * percentage is printed beside every one of them. "Chase Brown, 34%" is an
 * honest sentence; "you will get Chase Brown" is not.
 */
function summarizePlan(planRuns) {
  if (!planRuns || !planRuns.length) return [];
  var byPick = {};
  planRuns.forEach(function (run) {
    run.forEach(function (p) {
      var slot = byPick[p.pick] || (byPick[p.pick] = { pick: p.pick, keeper: !!p.keeper,
                                                       pos: {}, names: {}, why: {} });
      slot.pos[p.pos] = (slot.pos[p.pos] || 0) + 1;
      slot.names[p.name] = (slot.names[p.name] || 0) + 1;
      (p.why || []).forEach(function (w) {
        // The reason text carries the pick number it was computed against
        // ("+31 over what's likely left at pick 38"), which would make every
        // simulation's wording unique and every count 1. The shape is what is
        // being counted, so the numbers come out.
        var key = String(w).replace(/[-+]?\d+(\.\d+)?/g, "#");
        slot.why[key] = (slot.why[key] || { n: 0, sample: w });
        slot.why[key].n++;
      });
    });
  });
  var n = planRuns.length;
  return Object.keys(byPick).map(Number).sort(function (a, b) { return a - b; })
    .map(function (pk) {
      var slot = byPick[pk];
      var posRank = Object.keys(slot.pos).sort(function (a, b) { return slot.pos[b] - slot.pos[a]; });
      var nameRank = Object.keys(slot.names).sort(function (a, b) {
        return slot.names[b] - slot.names[a];
      });
      return {
        pick: pk,
        round: ownerOfPick(pk).round,
        keeper: slot.keeper,
        pos: posRank[0] || null,
        posPct: posRank[0] ? Math.round(slot.pos[posRank[0]] / n * 100) : 0,
        // A second position worth naming only when the simulation genuinely
        // split — "RB or WR" is information, "RB or, 4% of the time, TE" is not.
        alt: posRank[1] && slot.pos[posRank[1]] / n >= 0.25 ? posRank[1] : null,
        altPct: posRank[1] ? Math.round(slot.pos[posRank[1]] / n * 100) : 0,
        names: nameRank.slice(0, 3).map(function (nm) {
          return { name: nm, pct: Math.round(slot.names[nm] / n * 100) };
        }),
        // The engine's own account of the pick, kept only when it gave the
        // same account in most of the drafts. A reason that showed up a third
        // of the time is not why this pick happens.
        why: Object.keys(slot.why)
          .sort(function (a, b) { return slot.why[b].n - slot.why[a].n; })
          .filter(function (k) { return slot.why[k].n / n >= 0.5; })
          .slice(0, 2)
          .map(function (k) { return slot.why[k].sample; }),
        // How settled the pick is. One name at 60% is a plan; twelve names at
        // 8% each is a coin toss, and saying so is the useful part.
        spread: nameRank.length
      };
    });
}

function summarizeMock(runs, rules, planRuns) {
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
           low: totals[0] || 0, high: totals[totals.length - 1] || 0,
           plan: summarizePlan(planRuns) };
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

/* ------------------------------------------------------------ draft plan

   Before the first pick: what this draft is probably going to look like from
   your seat.

   Everything in here is the board's own simulator — the same `runMock()` that
   scores a draft style, run against your style's knobs, your scoring, your
   roster shape, your keepers and your real Yahoo ADP where you have pasted it.
   The room drafts the way the room drafts; you draft the way your style says.
   Forty of those, and what comes out is a distribution over your fourteen
   picks.

   It is deliberately a local simulation and not a Claude call. This is the
   screen somebody opens at 18:55 on a hotel wifi, and a plan that cannot be
   produced without a network is not a plan.

   The honesty rule for this panel: every name carries the percentage of drafts
   it actually showed up in. "Chase Brown, 31%" is a true sentence. "You will
   get Chase Brown in round 3" is not, and it is the sentence a panel like this
   wants to write. */

var PLAN_RUNS = 40;
var planCache = null;      // { sig, plan, res } — the sim is not cheap

/** A signature for everything the plan depends on. */
function planSig() {
  return JSON.stringify([S.league.slot, S.league.teams, S.league.rounds,
    S.league.style, S.league.styleCustom, S.league.keepers,
    S.league.rules, S.picks.length, Object.keys(yahooAdp()).length]);
}

function draftPlan() {
  var sig = planSig();
  if (planCache && planCache.sig === sig) return planCache;
  // The seed is fixed so that opening the panel twice does not quietly show two
  // different drafts. It is the same board either way; a plan that reshuffles
  // itself while you read it is not one you can act on.
  var res = runMock(activeKnobs(), PLAN_RUNS, 20260908);
  planCache = { sig: sig, plan: res.plan, res: res };
  return planCache;
}

/**
 * Why this plan looks like this — the three things that shaped it, before the
 * table that came out of them.
 *
 * The panel's first version printed the roster and left the reasoning to the
 * reader, which is the wrong half of the job: a manager who knows he is taking
 * a defense in round 7 and does not know *why* will talk himself out of it at
 * 19:40 with eleven people waiting. Every block here is derived — from the
 * scoring impact analysis, from the snake, from the style's own knobs — and
 * nothing in it is written by hand about any particular league.
 */
function planWhy() {
  var out = [];

  /* ---- 1. what your scoring does -------------------------------------
     impact.js already measures this and already writes the sentence. It is
     the single most valuable thing in this panel for a league with unusual
     rules, and it was buried at the bottom under the round-by-round table. */
  try {
    var rep = impactReport();
    var rel = rep.scoring.relative.rel || {};
    var movers = Object.keys(rel)
      .filter(function (pos) { return Math.abs(rel[pos]) >= 0.10; })
      .sort(function (a, b) { return Math.abs(rel[b]) - Math.abs(rel[a]); });
    // The headline that names a position is the one worth leading with; the
    // first headline is always the "how far from baseline" summary.
    var posLines = (rep.headlines || []).filter(function (h) {
      return movers.some(function (pos) { return h.indexOf(pos + " gains") === 0 ||
                                                 h.indexOf(pos + " loses") === 0; });
    });
    out.push({
      k: "scoring",
      head: movers.length
        ? movers.map(function (pos) {
            return pos + " " + (rel[pos] > 0 ? "gains" : "loses") + " " +
                   Math.round(Math.abs(rel[pos]) * 100) + "%";
          }).join(", ") + " against a standard board"
        : "Your scoring ranks the pool almost exactly as a standard board does",
      body: posLines.length ? posLines : [(rep.headlines || [])[0]].filter(Boolean)
    });
  } catch (e) { /* the plan survives without it */ }

  /* ---- 2. what your seat does ----------------------------------------
     A snake slot is not a preference, it is arithmetic, and it decides more
     about the shape of a draft than most managers realize. Slot 11 of 12
     picks in pairs three apart and then waits twenty-one. */
  var sched = myPickNumbers();
  var gaps = [];
  for (var i = 1; i < sched.length; i++) gaps.push(sched[i] - sched[i - 1]);
  if (gaps.length) {
    var shortG = Math.min.apply(null, gaps), longG = Math.max.apply(null, gaps);
    var seat = [];
    if (longG - shortG >= 6) {
      seat.push("Your picks arrive in pairs " + shortG + " apart, then a gap of " + longG +
        ". You are choosing two players at a time, so pair them by position rather than " +
        "taking the same one twice — and assume nothing you are undecided about survives " +
        "the long wait.");
    } else {
      seat.push("Your picks are evenly spaced, about " + Math.round(
        gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length) +
        " apart. No turn to plan around; take the board as it comes.");
    }
    var mid = (S.league.teams + 1) / 2;
    var edge = Math.abs(S.league.slot - mid) / (mid - 1);
    if (edge > 0.6) {
      seat.push("At slot " + S.league.slot + " of " + S.league.teams + " you are near the turn: " +
        "the elite tier is gone before your first pick, and in exchange you get the two best " +
        "players nobody else can reach between your pairs.");
    }
    out.push({ k: "seat", head: "Slot " + S.league.slot + " of " + S.league.teams, body: seat });
  }

  /* ---- 3. what your style does ---------------------------------------
     Read off the knobs actually in force rather than the style's blurb, so a
     style someone has edited describes what it now is. */
  var st = STRATS[S.league.style || "balanced"] || STRATS.balanced;
  var knobs = activeKnobs();
  var styleBody = [];
  if (st.detail) styleBody.push(st.detail);
  var biases = [];
  ["earlyPosBias", "posBias"].forEach(function (key) {
    var b = knobs[key];
    if (!b) return;
    Object.keys(b).forEach(function (pos) {
      if (Math.abs(b[pos] - 1) < 0.1) return;
      biases.push(pos + " " + (b[pos] > 1 ? "up" : "down") + " " +
        Math.round(Math.abs(b[pos] - 1) * 100) + "%" +
        (key === "earlyPosBias" ? " for the first " + (knobs.earlyRounds || 5) + " rounds" : ""));
    });
  });
  if (biases.length) {
    styleBody.push("In force right now: " + biases.join(", ") + ".");
  } else if (!S.league.styleCustom) {
    styleBody.push("No positional thumb on the scale — every position is priced on what it " +
      "adds to your lineup and nothing else. If the plan below is not the draft you want, " +
      "this is the thing to change.");
  }
  out.push({ k: "style", head: styleName(), body: styleBody });

  /* ---- 4. the floors -------------------------------------------------
     Two rounds in every draft are decided by a setting rather than by the
     board, and a plan that shows a kicker in round 14 without saying why
     reads as a recommendation instead of a rule. */
  var kFloor = A.ctx ? A.ctx.kFloorRound : null;
  var dFloor = S.league.defFloorRound || 7;
  out.push({ k: "floor", head: "Floors you set",
    body: ["This board refuses to take a defense before round " + dFloor +
      (kFloor ? " or a kicker before round " + kFloor : "") + ". Those are your settings, not " +
      "the board's opinion — if the plan takes one the moment the floor lifts, that is the " +
      "scoring saying the position is worth more here than what is left around it."] });

  return out;
}

/**
 * When each starting position actually gets filled, counting what you already
 * hold.
 *
 * The first version of this read the simulation alone and reported "first QB in
 * round 11" for a manager holding a kept quarterback — round 11 was the
 * *second* one. A need you have already met is not a need, and a plan that says
 * otherwise sends you shopping for a position you are done with.
 */
function planFillRounds(plan) {
  var out = {};
  // Anything already on the roster — drafted or kept — is filled now.
  A.mine.forEach(function (p) { if (p && !out[p.pos]) out[p.pos] = { round: 0 }; });
  plan.forEach(function (r) {
    if (!r.pos && !r.keeper) return;
    var pos = r.keeper ? ((BY_NAME[r.names[0] && r.names[0].name] || {}).pos) : r.pos;
    if (!pos || out[pos]) return;
    out[pos] = { round: r.round, pick: r.pick, keeper: !!r.keeper, pct: r.posPct };
  });
  return out;
}

/**
 * What the distribution says, in sentences, without overclaiming.
 *
 * Four kinds of note, and only the ones the numbers support: the shape the plan
 * comes out in, the picks the simulation is genuinely confident about, where it
 * stops being confident, and what your scoring is doing underneath all of it.
 * The third is the most useful and the one a panel like this normally leaves
 * out.
 */
function planNotes(plan, fill) {
  var out = [];
  var live = plan.filter(function (r) { return !r.keeper; });
  if (!live.length) return out;

  // ---- the shape of the first third -------------------------------------
  var early = live.slice(0, 5);
  var counts = {};
  early.forEach(function (r) { if (r.pos) counts[r.pos] = (counts[r.pos] || 0) + 1; });
  var lead = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  if (lead && counts[lead] >= 3) {
    var lateOnes = ["RB", "WR", "TE"].filter(function (pos) {
      return pos !== lead && fill[pos] && fill[pos].round >= 5;
    });
    out.push({ k: "shape", t: "This plan is " + lead + "-heavy: " + counts[lead] +
      " of your first " + early.length + " picks come out at " + lead + "." +
      (lateOnes.length
        ? " Your first " + lateOnes.map(function (pos) {
            return pos + " lands in round " + fill[pos].round;
          }).join(", and your first ") + ". If that is not the draft you want, the " +
          "style is the thing to change, not the pick."
        : "") });
  }

  // ---- the picks it is actually sure about -------------------------------
  // The gate used to be 30%, which on this board caught every pick and produced
  // "the simulation keeps landing on the same player at 14 of your picks" — a
  // sentence that says nothing. Only the top few, and only when they are strong.
  var settled = live.filter(function (r) { return r.names[0] && r.names[0].pct >= 40; })
    .sort(function (a, b) { return b.names[0].pct - a.names[0].pct; })
    .slice(0, 3);
  if (settled.length) {
    out.push({ k: "settled", t: "The most settled picks on your board are " +
      settled.map(function (r) {
        return r.names[0].name + " at " + r.pick + " (round " + r.round + ", " +
               r.names[0].pct + "% of drafts)";
      }).join(", ") + ". Where the board and the room agree this often, the value is " +
      "usually real rather than contested — but it also means somebody else may reach " +
      "for him a pick early." });
  }

  // ---- and where it stops being sure ------------------------------------
  var openFrom = null;
  for (var i = 0; i < live.length; i++) {
    if (live[i].names[0] && live[i].names[0].pct < 20) { openFrom = live[i]; break; }
  }
  out.push(openFrom
    ? { k: "open", t: "From round " + openFrom.round + " on, no single name shows up in even " +
        "one draft in five — the pool is wide enough by then that the plan stops being a plan. " +
        "That is where the live suggestions and the survival numbers earn their keep, and it " +
        "is not a flaw in the forecast." }
    : { k: "open", t: "Every one of your picks has a favorite in this simulation, which is " +
        "less reassuring than it sounds — it means the room is modeled as behaving very " +
        "predictably. One early reach by a real manager moves everything after it." });

  // ---- the positions your scoring actually moves ------------------------
  // impactReport() is cached against the rules, so this is nearly free after the
  // first open, and it is the only part of this panel that is about the league
  // rather than about the draft.
  try {
    var rep = impactReport();
    (rep.headlines || []).slice(0, 2).forEach(function (h) { out.push({ k: "scoring", t: h }); });
  } catch (e) { /* the plan is still a plan without it */ }

  return out;
}

function renderDraftPlan() {
  var body = $("#planBody");
  var m = DATA.meta || {};
  var cov = marketCoverage();

  var got = draftPlan();
  var plan = got.plan, res = got.res;
  var fill = planFillRounds(plan);
  var mine = A.mine.length;

  var rows = plan.map(function (r) {
    if (r.keeper) {
      return '<tr class="pl-keeper"><td class="pl-r">R' + r.round + "</td>" +
        '<td class="pl-p">' + r.pick + "</td>" +
        '<td colspan="2"><span class="pl-kept">kept</span> ' +
          esc(r.names[0] ? r.names[0].name : "") + "</td></tr>";
    }
    var names = r.names.map(function (nm) {
      return '<span class="pl-nm">' + esc(nm.name) +
        '<span class="pl-pct">' + nm.pct + "%</span></span>";
    }).join("");
    return "<tr><td class=\"pl-r\">R" + r.round + "</td>" +
      '<td class="pl-p">' + r.pick + "</td>" +
      '<td class="pl-pos"><span class="pos pos-' + r.pos + '">' + r.pos + "</span>" +
        '<span class="pl-pct">' + r.posPct + "%</span>" +
        (r.alt ? '<span class="pl-alt">or <span class="pos pos-' + r.alt + '">' + r.alt +
          "</span> " + r.altPct + "%</span>" : "") + "</td>" +
      '<td class="pl-names">' + (names || '<span class="dimtext">wide open</span>') +
        // The engine's own reason for the pick, kept only when it gave the same
        // reason in most of the simulations. This is the difference between a
        // plan and a list: a manager who knows he is taking a defense in round
        // 7 but not why will talk himself out of it on the night.
        (r.why && r.why.length
          ? '<span class="pl-why-l">' + esc(r.why.join(" · ")) + "</span>"
          : "") +
      "</td></tr>";
  }).join("");

  body.innerHTML =
    '<div class="pl-head">' +
      '<div><span class="pl-k">style</span><b>' + esc(styleName()) + "</b></div>" +
      '<div><span class="pl-k">your slot</span><b>' + S.league.slot + " of " +
        S.league.teams + "</b></div>" +
      '<div><span class="pl-k">rounds</span><b>' + S.league.rounds + "</b></div>" +
      '<div><span class="pl-k">picks left</span><b>' + (A.upcoming || []).length + "</b></div>" +
      ((S.league.keepers || []).length
        ? '<div><span class="pl-k">keeper</span><b>' +
          esc((S.league.keepers || []).map(function (k) {
            return k.name + " (R" + k.round + ")";
          }).join(", ")) + "</b></div>"
        : "") +
    "</div>" +

    // Only when a draft is actually under way. "This draft is already 0 picks
    // old and you hold 1" is what counting the pending keeper as a pick reads
    // like at the moment somebody presses Start.
    (S.picks.length
      ? '<div class="note">This draft is already ' + S.picks.length + " pick" +
        (S.picks.length === 1 ? "" : "s") + " old" +
        (mine ? " and you hold " + mine : "") + ". The plan below starts from where the " +
        "board actually is, not from pick 1.</div>"
      : "") +

    '<div class="panel-head mt"><h3>Why this plan looks like this</h3></div>' +
    '<div class="pl-why">' + planWhy().map(function (w) {
      return '<div class="pl-w pl-' + w.k + '">' +
        '<div class="pl-wh">' + esc(w.head) + "</div>" +
        w.body.map(function (b) { return "<p>" + esc(b) + "</p>"; }).join("") +
      "</div>";
    }).join("") + "</div>" +

    '<div class="panel-head mt"><h3>Round by round</h3>' +
      '<span class="eyebrow">' + res.runs + " simulated drafts</span></div>" +
    '<table class="pl-tbl"><thead><tr>' +
      "<th>rd</th><th>pick</th><th>position</th><th>who is usually there</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table>" +

    '<div class="pl-foot">Every percentage is how often that actually happened across ' +
      res.runs + " drafts — they are odds, not promises. The room is drafted against " +
      (cov.real
        ? "<b>your real Yahoo draft data</b> on " + cov.pct + "% of the board"
        : "<b>mock-draft ADP</b>") +
      ", each player with his own spread, and your picks are made by the same scoring engine " +
      "the live board uses. A simulated draft is not a forecast of this draft — it is what " +
      "this board would do against a room that behaves like the market.</div>" +

    '<div class="panel-head mt"><h3>When each starting slot gets filled</h3></div>' +
    '<div class="pl-fill">' + ["QB", "RB", "WR", "TE", "DEF", "K"].map(function (pos) {
      var f = fill[pos];
      return '<span class="pl-f' + (f ? (f.round === 0 ? " have" : "") : " none") + '">' +
        '<span class="pos pos-' + pos + '">' + pos + "</span>" +
        (!f ? "not in the plan"
            : f.round === 0 ? "you have one"
            : f.keeper ? "kept, R" + f.round
            : "round " + f.round) + "</span>";
    }).join("") + "</div>" +

    '<div class="panel-head mt"><h3>What that means for you</h3></div>' +
    '<div class="pl-notes">' + planNotes(plan, fill).map(function (nt) {
      return '<div class="pl-note pl-' + nt.k + '">' + esc(nt.t) + "</div>";
    }).join("") + "</div>" +

    '<div class="pl-foot">Data pulled ' + esc(m.built || m.baked || "unknown") + ". " +
      "Change your draft style and this plan changes with it — " +
      '<a href="#" id="planStyle">try a different one</a>.</div>';

  if ($("#planStyle")) $("#planStyle").onclick = function (e) {
    e.preventDefault(); closeModal("#planModal"); $("#btnStyle").click();
  };
}

/** Opened from the More menu, and once on the way into a draft. */
function openDraftPlan() {
  $("#planBody").innerHTML =
    '<div class="claude-out"><span class="spinner"></span> Simulating ' + PLAN_RUNS +
    " drafts from your seat…</div>";
  openModal("#planModal");
  // Forty full drafts is a second or so of blocked main thread. Yield once so
  // the modal and its spinner actually paint before that starts, rather than
  // the button appearing to do nothing and then the panel arriving complete.
  setTimeout(renderDraftPlan, 30);
}

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
  var TARGETS = { start: "#btnStart", plan: "#btnPlan", report: "#btnReport", style: "#btnStyle",
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
/**
 * Put a name on a pick that was logged without one, in place.
 *
 * The gap this closes: logging a pick you did not see spends a slot, and until
 * now finding out who it was afterwards had no way home — recording him
 * appended a *second* pick, so one real selection ate two slots and the draft
 * log stopped matching the draft. Every survival number, every VONA and every
 * suggestion downstream is computed against that log.
 *
 * Deliberately does not touch the slot: which team owns pick 27 was decided
 * when it was logged, and this is a correction to the name, not to the owner.
 */
function fillUnknown(name, pickNo) {
  var pk = S.picks.find(function (q) { return q.pick === pickNo && q.unknown; });
  if (!pk || !BY_NAME[name]) return;
  if (draftedNames()[name]) {
    banner(esc(name) + " is already recorded elsewhere in this draft.", true);
    return;
  }
  pk.name = name;
  pk.unknown = false;
  syncKeepers();
  save();
  render();
  banner(esc(name) + " filled in at pick " + pickNo + " for " + esc(teamTitle(pk.slot)) +
    ". No extra pick was spent.");
}

/** Picks logged with no name, newest first — the ones that can still be filled. */
function openUnknowns() {
  return S.picks.filter(function (p) { return p.unknown; })
    .slice().reverse().slice(0, 6);
}

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
/** The pick number whose team is being chosen, when the player is unknown. */
var pickTeamFor = null;
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
    // A player who is not on the board yet, and picks that are on the board with
    // no player: the two halves of the same missing pick. Offering them here is
    // what stops one real selection from eating two slots.
    (!already && openUnknowns().length
      ? '<div class="ap-fill"><div class="ap-filk">or fill in a pick you missed</div>' +
        openUnknowns().map(function (q) {
          return '<button class="ap-t" data-fill="' + q.pick + '">pick ' + q.pick +
            '<span class="ap-hint">' + esc(teamTitle(q.slot)) + "</span></button>";
        }).join("") + "</div>"
      : "") +
    '<div class="ap-foot">' +
      (already
        ? "Recorded at pick " + already.pick + ". Changing this does not move the pick, " +
          "only who is credited with it."
        : "Records the pick and credits that team. The team on the clock is the " +
          "safe bet if you are keeping up." +
          (openUnknowns().length
            ? " If he is the player behind one of the blank picks above, fill that in " +
              "instead — it spends no extra pick."
            : "")) +
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
      var who = assignFor;
      if (b.dataset.fill) { closeAssign(); fillUnknown(who, +b.dataset.fill); return; }
      var sl = +b.dataset.slot;
      if (already) reassign(who, sl); else recordTo(who, sl);
      closeAssign();
    };
  });
}
/**
 * Which team took the pick on the clock, when you did not catch who they took.
 *
 * This replaced a button called "Missed the name", which logged an unnamed pick
 * against whoever the snake said was up. That was wrong twice over: the team on
 * the clock is a guess exactly when you are not watching closely, and a user who
 * then found the player and assigned him recorded a *second* pick — two slots
 * spent on one, and a draft log that no longer matched the draft.
 *
 * One action, and the team is chosen. If you do know who went, the player list
 * is still the way in: tapping him credits the team on the clock, and "who?" on
 * his row assigns a different one without spending an extra pick.
 */
function openPickTeam(anchorEl, ev) {
  if (ev) ev.stopPropagation();
  if (!isLive()) { record(null, false); return; }
  closePlayerPop();
  assignFor = null;
  pickTeamFor = A.cur;
  var pop = $("#assignPop");
  var onClock = A.onClock ? A.onClock.slot : null;
  var rows = [];
  for (var i = 1; i <= S.league.teams; i++) rows.push(i);
  pop.innerHTML =
    '<div class="ap-head">Pick ' + A.cur + "<span>which team took it?</span></div>" +
    '<div class="ap-grid">' + rows.map(function (sl) {
      return '<button class="ap-t' + (sl === onClock ? " suggest" : "") +
        '" data-pt="' + sl + '">' + esc(teamTitle(sl)) +
        (sl === onClock ? '<span class="ap-hint">on the clock</span>' : "") + "</button>";
    }).join("") + "</div>" +
    '<div class="ap-foot">Records pick ' + A.cur + " against that team with <b>no player " +
      "name</b>. The slot is spent and the count moves on; the player himself stays on the " +
      "board, so you can record him properly later if you find out who it was. " +
      "<b>If you know who went, tap him in the player list instead</b> — that credits the " +
      "team in the same action.</div>";
  var r = anchorEl.getBoundingClientRect();
  pop.classList.remove("hidden");
  var w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + "px";
  pop.style.top = (r.bottom + h + 8 > window.innerHeight && r.top - h - 6 > 0
    ? r.top - h - 6 : r.bottom + 6) + "px";
  $$("#assignPop .ap-t").forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var sl = +b.dataset.pt;
      closeAssign();
      // recordTo writes the pick, then corrects the slot the snake assumed.
      // A nameless pick goes through the same path as a named one, so there is
      // exactly one way a pick reaches the log.
      recordTo(null, sl);
      banner("Pick " + (S.picks.length) + " logged to " + teamTitle(sl) +
        " with no name. The player is still on the board.");
    };
  });
}

function closeAssign() {
  assignFor = null; pickTeamFor = null;
  $("#assignPop").classList.add("hidden");
}
document.addEventListener("click", function (e) {
  if ((assignFor || pickTeamFor) && !e.target.closest("#assignPop")) closeAssign();
  // A pinned card is dismissed by clicking away from it — but not by the click
  // on the row that opened it, and not by a click inside the card itself.
  if (popFor && !e.target.closest("#playerPop") && !e.target.closest(".prow")) closePlayerPop();
});
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  closeAssign();
  closePlayerPop();
  closeModal("#detailModal");
});

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
    // Must be the SAME condition renderColumnHeads() uses to decide whether to
    // lay down a rank track — body.norank, which is compact OR touch. Keying
    // this on compact alone meant an iPad in landscape (touch, but 1133px so
    // not compact) emitted a rank cell the template had no track for: every
    // value shifted one column left, the name landed in the 44px points track
    // and read "RB J...", and the last cell wrapped onto a second row. The two
    // sides describe one grid, so they read one flag.
    (document.body.classList.contains("norank") ? "" :
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
              ' took him — off the board">' +
              // On touch this button is the row's armed action and it has a full
              // line to sit on, so it names the team instead of abbreviating it
              // to "T1". Which team is on the clock is the thing the drafter
              // most needs to be sure of before the tap lands.
              esc(IS_TOUCH ? onClockLabel() + " took him" : onClockShort()) + "</button>" +
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
      // Two taps, on the row, and the second one records him to whoever is on
      // the clock — which on your own turn is you. iOS does not fire dblclick
      // reliably, so the desktop double-click below never reached the device,
      // and the only way left to record an opponent's pick was to type his name.
      // A hundred and sixty-five times.
      //
      // The first tap arms it and the row grows its buttons, so the second tap
      // is aimed at something visible that says whose pick it is. Undo is in the
      // appbar and one press deep.
      if (IS_TOUCH && view.selected === name) return record(name, false);
      view.selected = name;
      renderList();
      // renderList replaced every node in the list, this one included, so the
      // card has to be anchored to the row that exists now rather than the one
      // that was clicked.
      showPopFor(name, true);
    };
    if (!taken) el.ondblclick = function () { record(name, false); };

    /* At a desk the card is a hover. There is no hover on a tablet, which is
       why the first tap above does the same job — and why the hover handlers
       are not bound at all on touch, where a stray mouseover from a scroll
       would open a card nobody asked for. */
    if (!IS_TOUCH) {
      el.addEventListener("mouseenter", function () {
        if (popPinned) return;
        clearTimeout(popTimer); clearTimeout(popHideTimer);
        popTimer = setTimeout(function () { openPlayerPop(name, el, false); }, 170);
      });
      el.addEventListener("mouseleave", function () {
        clearTimeout(popTimer);
        if (popPinned) return;
        // Long enough to cross the six-pixel gap between the row and the card
        // and land on a button. 160ms was not: the card closed under the
        // pointer on the way to it, which made every action on it unreachable
        // by the one gesture that opens it.
        popHideTimer = setTimeout(closePlayerPop, 420);
      });
    }
  });
}

/** Anchor the card to whichever row node is currently in the list. */
function showPopFor(name, pinned) {
  var rows = $$("#plist .prow"), el = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].getAttribute("data-name") === name) { el = rows[i]; break; }
  }
  if (el) openPlayerPop(name, el, pinned);
}

/**
 * Runs, in one line rather than one amber block each. Two positions running at
 * once is common and normal — four backs and four receivers inside eight picks
 * is the whole window — and printing it as two stacked warnings made an
 * ordinary board read like an emergency, twice.
 */
function renderRunBanner() {
  var runs = Object.keys(A.runInfo.runs);
  if (!runs.length) { $("#runBanner").innerHTML = ""; return; }
  var w = A.runInfo.window;
  var counts = runs.map(function (pos) {
    return "<b>" + pos + " " + A.runInfo.runs[pos] + "</b>";
  }).join(", ");
  $("#runBanner").innerHTML = '<div class="banner runline">' +
    (runs.length > 1 ? "Runs in progress" : "Run in progress") + " — " + counts +
    " of the last " + w + " picks. " +
    (runs.length > 1 ? "Their urgency is raised." : "Its urgency is raised.") + "</div>";
}

/**
 * Which three players get cards.
 *
 * Three cards headed "take one of these" have to be a choice. Once every
 * startable slot is filled, nothing left improves the lineup, so the ranking
 * among the survivors is thin — first to third is often under a point — and
 * they arrive sorted by a value that clusters hard by position. That is how
 * round 9 offered three quarterbacks behind a kept starter, each one labeled
 * "can't crack your starting lineup". It was one idea printed three times, and
 * the two real alternatives were below the fold.
 *
 * So when nothing on the board can improve the lineup, the cards are the best
 * body at three different positions. The board underneath does not change and
 * neither does the order: the #1 is still the #1. This decides only what the
 * other two cards are for, which is showing the choice actually available.
 * While something CAN improve the lineup the ranking means what it says, and
 * the top three stand.
 *
 * Lives out here rather than inside renderRecs() because trace-suggestions.js
 * reports what the cards would show, and it was reimplementing this as a plain
 * top-three — so the trace disagreed with the app in exactly the states worth
 * tracing.
 */
function recCards(pool) {
  var ranked = pool.slice().sort(function (a, b) { return b.comp - a.comp; });
  var improves = ranked.some(function (p) {
    return ((p.compDetail || {}).marginal || 0) > 0.5;
  });
  if (improves) return ranked.slice(0, 3);
  var seen = {}, out = [];
  ranked.forEach(function (p) {
    if (out.length >= 3 || seen[p.pos]) return;
    seen[p.pos] = true; out.push(p);
  });
  /* Late on there may not be three positions left to offer — the kicker and
     defense are taken, the tight end is capped, a backup quarterback is under
     its floor — and giving up on the whole rule there put three of the same
     back on screen again. Take the distinct ones first, then fill from the top
     of what is left, so the third card is the next best player rather than the
     rule's failure. */
  if (out.length < 3) {
    ranked.forEach(function (p) {
      if (out.length >= 3 || out.indexOf(p) >= 0) return;
      out.push(p);
    });
    out.sort(function (a, b) { return b.comp - a.comp; });
  }
  return out;
}

/**
 * What this pick actually is, in the words a drafter would use.
 *
 * The card used to lead with "+0 · to your lineup", which is a number with no
 * interpretation attached: it does not say whether zero is normal, whether it
 * is bad, or what to do about it. By round 8 every candidate reads +0 and the
 * three cards become indistinguishable. This says the role instead — what job
 * the player would do on THIS roster — and the number goes in the tooltip where
 * anyone who wants it can still find it.
 */
function pickRole(p) {
  var d = p.compDetail || {};
  var starters = startingSlots();

  if ((d.marginal || 0) > 0.5) {
    var slot = null;
    for (var i = 0; i < starters.length; i++) {
      if (!starters[i].player && !starters[i].blocked &&
          (starters[i].pos === p.pos || starters[i].pos === "FLEX")) { slot = starters[i].label; break; }
    }
    // Nothing is empty, so he is better than a body you are already starting.
    if (!slot) {
      var worst = null;
      starters.forEach(function (s) {
        if (s.player && (s.pos === p.pos || s.pos === "FLEX") &&
            (!worst || s.player.pts < worst.player.pts)) worst = s;
      });
      return worst
        ? { k: "upgrade", label: "Upgrades " + worst.label + " over " + worst.player.name,
            tone: "good" }
        : { k: "starter", label: "Starts for you right away", tone: "good" };
    }
    return { k: "fills", label: "Fills your open " + slot, tone: "good" };
  }

  // A bench body. Say the most specific true thing about why he might matter.
  var mine = A.mine || [];
  var sameTeamRb = p.pos === "RB" && mine.some(function (q) {
    return q.pos === "RB" && q.team === p.team && q.name !== p.name;
  });
  if (sameTeamRb) return { k: "handcuff", label: "Handcuff — steps in if your " + p.team + " back goes down", tone: "warn" };

  // Does he cover a week your own starters are away?
  var holes = [];
  starters.forEach(function (s) {
    if (s.player && s.player.pos === p.pos && s.player.bye !== p.bye) holes.push(s.player);
  });
  if (holes.length) {
    return { k: "bye", label: "Covers week " + holes[0].bye + ", when " + holes[0].name + " is on bye",
             tone: "warn" };
  }
  if (p.tierLeft <= 1) {
    return { k: "cliff", label: "Last of tier " + p.tier + " at " + p.pos, tone: "warn" };
  }
  if (p.ceiling >= 85) {
    return { k: "upside", label: "Upside stash — one of the highest ceilings left", tone: "warn" };
  }
  return { k: "depth", label: "Bench depth at " + p.pos + " — nothing more", tone: "dim" };
}

/**
 * The case for and against, from facts the app already holds.
 *
 * Three cards headed "take one of these" are only a choice if the differences
 * between them are on screen. Ranking them and stopping there asks the user to
 * trust a number they cannot interpret; this gives them the two or three things
 * that would actually change their mind, so the preference can be theirs.
 * Every line traces to a number in the app — nothing here is generated prose.
 */
function pickTradeoffs(p) {
  var d = p.compDetail || {}, pros = [], cons = [];
  var surv = Math.round(survShown(p) * 100);
  var mine = A.mine || [];

  if ((d.marginal || 0) > 0.5) pros.push("Adds " + n0(d.marginal) + " points to the lineup you can field today");
  if (surv <= 25 && A.survTarget) pros.push("Almost certainly gone by " + A.survTarget + " — " + surv + "% he lasts");
  else if (surv <= 50 && A.survTarget) pros.push("Only " + surv + "% he lasts to " + A.survTarget);
  if (p.tierLeft <= 1) pros.push("Last one in tier " + p.tier + " at " + p.pos);
  else if (p.tierLeft <= 3) pros.push("Only " + p.tierLeft + " left in tier " + p.tier);
  if (p.adp && A.cur > p.adp + 6) pros.push("Fell " + Math.round(A.cur - p.adp) + " picks past his draft position");
  if (p.ceiling >= 85) pros.push("Ceiling grade " + p.ceiling + " — top of what is left");
  if (p.tag && p.tag !== "AVOID" && p.tag !== "LANDMINE" && p.tag !== "FALLER") {
    pros.push("Research flag: " + (TAGS[p.tag] || p.tag));
  }

  // The single most useful thing the old card never said: you already have one.
  if ((d.marginal || 0) <= 0.5) {
    var ahead = mine.filter(function (q) { return q.pos === p.pos; })
      .sort(function (a, b) { return b.pts - a.pts; })[0];
    if (ahead) {
      cons.push("You already start " + ahead.name + " at " + p.pos +
                " — this one only plays if he is hurt or on bye");
    } else {
      cons.push("Cannot crack your starting lineup as it stands");
    }
  }
  if (d.byePenalty) {
    cons.push((A.byeCounts[p.bye] || 0) + " of your starters are already out in week " + p.bye);
  }
  if (p.injury) cons.push("Injury designation: " + p.injury);
  if (p.risk >= 60) cons.push("Risk grade " + p.risk + " — the projection is a wide one");
  if (p.vor < 0) cons.push("Below replacement — a freely available " + p.pos + " scores about the same");
  if (p.tag === "AVOID" || p.tag === "LANDMINE" || p.tag === "FALLER") {
    cons.push("Research flag: " + (TAGS[p.tag] || p.tag));
  }
  return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
}

function renderRecs() {
  if (!A.myNext) { $("#recs").innerHTML = '<div class="note">Your draft is finished.</div>'; return; }

  // Until you're on the clock, ranking the whole board is noise — the top of it
  // will be gone. Restrict to players who can realistically still be there.
  var waiting = A.myNext > A.cur;
  var pool = A.avail.filter(function (p) { return !p.compDetail.blocked; });
  var realistic = waiting ? pool.filter(function (p) { return p.surv >= 0.15; }) : pool;
  if (!realistic.length) realistic = pool;
  var top = recCards(realistic);

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
  /* Is the order real, or is it inside its own noise?
     Once nothing can improve the lineup the composite collapses toward zero and
     the three survivors sit within a few season points of each other — under
     half a point a week. The confidence bar divides one by the other, so a gap
     of three points on scores of 3 and 0 draws a full bar against an empty one
     and states a 12-to-1 preference that the arithmetic does not support. When
     the call is this close the bar comes off and the panel says so instead. */
  var closeCall = top.length === 3 &&
    !top.some(function (p) { return (p.compDetail.marginal || 0) > 0.5; }) &&
    Math.abs(top[0].comp - top[2].comp) < 5;
  $("#recs").innerHTML = top.map(function (p, i) {
    var d = p.compDetail;
    var conf = Math.max(8, Math.min(100, Math.round(p.comp / Math.max(best, 1) * 100)));
    // The lead reason, not three of them. The others are in Why?.
    var why = d.reasons.length ? d.reasons[0] : "best remaining value";
    var surv = Math.round(survShown(p) * 100);
    var survCls = surv >= 70 ? "good" : surv >= 35 ? "warn" : "bad";
    var stats = [
      { k: A.survTarget ? "reaches " + A.survTarget : "survives", v: surv + "%", cls: survCls,
        t: "Chance he is still on the board the next time you choose" },
      { k: "tier " + p.tier, v: p.tierLeft + " left", cls: p.tierLeft <= 1 ? "warn" : "dim",
        t: p.tierLeft + " players left in tier " + p.tier + " at " + p.pos +
           ". Inside a tier they are close enough to be interchangeable." },
      { k: "your points", v: n0(p.pts), cls: "dim",
        t: "Projected season points under your league's exact scoring rules" }
    ];
    var role = pickRole(p);
    var tr = pickTradeoffs(p);
    return '<div class="rec' + (i === 0 ? " top" : "") + '">' +
      '<div class="rec-head">' +
        '<span class="rec-rank">' + (i + 1) + "</span>" +
        '<span class="pos pos-' + p.pos + '">' + p.pos + "</span>" +
        '<span class="name">' + esc(p.name) + "</span>" +
        '<span class="rec-meta">' + p.team + " \u00b7 bye " + p.bye + "</span>" +
        tagBadge(p.tag) +
      "</div>" +
      '<div class="rec-role rr-' + role.tone + '" title="' +
        esc("Adds " + n0(d.marginal) + " points to the best starting lineup you can field, " +
            "against a freely available " + p.pos) + '">' + esc(role.label) + "</div>" +
      '<div class="rec-stats">' + stats.map(function (st) {
        return '<span class="rs" title="' + esc(st.t) + '">' +
          '<b class="rs-' + st.cls + '">' + st.v + "</b>" +
          '<span class="rs-k">' + esc(st.k) + "</span></span>";
      }).join("") + "</div>" +
      (tr.pros.length || tr.cons.length
        ? '<ul class="rec-tr">' +
          tr.pros.map(function (s) { return '<li class="pro">' + esc(s) + "</li>"; }).join("") +
          tr.cons.map(function (s) { return '<li class="con">' + esc(s) + "</li>"; }).join("") +
          "</ul>"
        : "") +
      '<div class="rec-why">' + esc(why) + "</div>" +
      styleChipHtml(p) +
      '<div class="rec-foot">' +
        (closeCall
          ? '<div class="bar-none" title="' + esc("Board score " + n0(p.comp) +
              ". Too close to the others to draw a preference.") + '">too close to call</div>'
          : '<div class="bar" title="' + esc("Board score " + n0(p.comp) +
              (i ? ", against " + n0(best) + " for the top pick" : ", the top of the board")) +
            '"><span style="width:' + conf + '%"></span></div>') +
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

  /* When the three are inside a point of each other the ranking is not a
     finding, and presenting it as one invites the user to read an order that
     is not there. Say so, and hand the choice back with the thing that should
     actually decide it. */
  if (closeCall) {
    $("#recs").insertAdjacentHTML("afterbegin",
      '<div class="rec-close"><b>This one is yours to call.</b> All three are within ' +
      n0(Math.abs(top[0].comp - top[2].comp)) + " points of each other across a whole season — " +
      "under half a point a week — and none of them changes the lineup you can field today. " +
      "The board cannot separate them, so take the shape you want: the safest week-to-week " +
      "body, the biggest ceiling, or the position you would least like to lose someone at.</div>");
  }

  var chip = $("#styleChip");
  if (chip) chip.onclick = function () { $("#btnStyle").click(); };
  $$("#recs [data-take]").forEach(function (b) { b.onclick = function () { record(b.dataset.take, true); }; });
  $$("#recs [data-assign]").forEach(function (b) {
    b.onclick = function (e) { openAssign(b.dataset.assign, b, e); };
  });
  $$("#recs [data-open]").forEach(function (b) {
    b.onclick = function () { openDetail(b.dataset.open); };
  });
  // This used to end by selecting the top recommendation and rendering its full
  // breakdown into the column, whether or not anybody had asked to see it — two
  // tables of composite arithmetic permanently under the suggestion cards, and
  // on touch sitting above the live draft box. "Why?" opens it now, in a modal,
  // and the column stays about the draft.
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

/* ------------------------------------------------------------ player card

   The one thing worth knowing about a player, where the player already is.

   This used to be a full scoring breakdown rendered into the middle column,
   and it was rendered whether or not anyone asked for it: renderRecs ended by
   selecting the top recommendation and calling renderDetail on it, so the
   column permanently carried a two-table teardown of the composite under the
   suggestion cards. On touch that card also carried `order: -1`, which put it
   *above* the live draft box — so on draft day, tapping any player to look at
   him pushed the box, the brief and the recommendations off the screen.

   Now: a compact card anchored to the row, on hover at a desk and on the first
   tap on a tablet, carrying what makes this player stand out rather than every
   number the engine touched. The full breakdown still exists, one press away,
   in a modal that cannot displace anything.

   It is deliberately not a fixed grid. A card that prints eight labels and six
   em-dashes is worse than a card that prints two facts — every row in here is
   present only when it has something to say. */

var popFor = null;         // name the card is showing, or null
var popPinned = false;     // opened by a click/tap rather than a hover
var popTimer = null, popHideTimer = null;

/** The 320px card, anchored under the row, flipping above it when short. */
function openPlayerPop(name, anchorEl, pinned) {
  var p = A.byName[name] || BY_NAME[name];
  if (!p || !anchorEl) return;
  clearTimeout(popHideTimer);
  popFor = name;
  popPinned = !!pinned;

  var pop = $("#playerPop");
  pop.innerHTML = playerPopHtml(p);
  pop.classList.remove("hidden");

  var r = anchorEl.getBoundingClientRect();
  var w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + "px";
  // Below the row by default, above it when the bottom of the window is closer
  // than the card is tall. Never beside it: the column to the right is where
  // the live draft box lives, and a hover card is not allowed to cover that.
  pop.style.top = (r.bottom + h + 8 > window.innerHeight && r.top - h - 6 > 0
    ? r.top - h - 6 : r.bottom + 6) + "px";

  $$("#playerPop [data-pact]").forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      var act = b.dataset.pact;
      if (act === "full") { closePlayerPop(); openDetail(name); return; }
      if (act === "assign") { closePlayerPop(); openAssign(name, anchorEl, e); return; }
      closePlayerPop();
      record(name, act === "mine");
    };
  });
}

/* The card cancels its own dismissal. Without this the hover card is a
   read-only tooltip: it opens on the row, and the moment the pointer leaves the
   row to reach a button on the card, the timer that closes it is already
   running. Bound once, at load, because #playerPop outlives every render. */
(function () {
  var pop = $("#playerPop");
  if (!pop) return;
  pop.addEventListener("mouseenter", function () { clearTimeout(popHideTimer); });
  pop.addEventListener("mouseleave", function () {
    if (popPinned) return;
    popHideTimer = setTimeout(closePlayerPop, 260);
  });
})();

function closePlayerPop() {
  clearTimeout(popTimer); clearTimeout(popHideTimer);
  popFor = null; popPinned = false;
  var pop = $("#playerPop");
  if (pop) pop.classList.add("hidden");
}

/**
 * What makes him stand out, in at most four lines.
 *
 * The ordering is deliberate: things that change whether you take him at all
 * come before things that change how you feel about it. An injury outranks a
 * market move; running out of a tier outranks a depth chart.
 */
function standoutLines(p) {
  var out = [];
  var std = standardBoard()[p.name];

  if (p.injury) {
    out.push({ cls: "bad", t: p.injury + (p.injuryPart ? " — " + p.injuryPart : "") });
  }
  if (p.tierLeft <= 1) {
    out.push({ cls: "warn", t: "Last of tier " + p.tier + " at " + p.pos +
      " — the next one is a step down." });
  }
  if (std) {
    var swing = Math.round(p.pts - std.pts);
    if (Math.abs(swing) >= 12) {
      out.push({ cls: swing > 0 ? "good" : "dim",
        t: (swing > 0 ? "+" : "") + swing + " points versus plain full PPR — your scoring " +
           (swing > 0 ? "likes him more than the room does." : "likes him less than the room does.") });
    }
  }
  if (p.ytrend != null && Math.abs(p.ytrend) >= 1.5) {
    out.push({ cls: p.ytrend > 0 ? "warn" : "good",
      t: "Yahoo drafters have moved him " + Math.abs(p.ytrend).toFixed(1) + " picks " +
         (p.ytrend > 0 ? "earlier" : "later") + " in the last seven days." });
  }
  if (p.depth >= 3) {
    out.push({ cls: "warn", t: (p.depthPos || p.pos) + p.depth +
      " on his own depth chart — he needs an injury in front of him." });
  } else if (p.depth === 1 && (p.pos === "RB" || p.pos === "WR" || p.pos === "TE")) {
    out.push({ cls: "good", t: (p.depthPos || p.pos) + "1 on his own depth chart." });
  }
  if (p.note) out.push({ cls: "dim", t: p.note + (p.source ? " — " + p.source : "") });
  return out.slice(0, 4);
}

function playerPopHtml(p) {
  var d = p.compDetail || {};
  var t = p.takenBy;
  var lines = standoutLines(p);

  /* Survival, value and the composite are computed for players who are still
     on the board. A drafted one has none of them, and rendering NaN% into a
     card is worse than not having a card — so the whole live half is built
     only on the branch that shows it. */
  var live = "";
  if (!t) {
    var surv = Math.round(survShown(p) * 100);
    var survCls = surv >= 70 ? "good" : surv >= 35 ? "warn" : "bad";
    var rounds = (p.adpDelta || 0) / (S.league.teams || 12);
    var market = ["ADP " + (p.adp || 0).toFixed(0)];
    if (p.yadp != null) market.push("real " + p.yadp.toFixed(0));
    if (p.ytrend != null && Math.abs(p.ytrend) >= 0.3) {
      market.push((p.ytrend > 0 ? "↑" : "↓") + Math.abs(p.ytrend).toFixed(1) + " 7d");
    }
    var val = rounds <= -0.75
        ? { cls: "good", t: "Fell " + Math.abs(rounds).toFixed(1) + " rounds past his ADP" }
      : rounds >= 1
        ? { cls: "bad", t: "A " + rounds.toFixed(1) + "-round reach at pick " + A.cur }
        : { cls: "dim", t: "On schedule at pick " + A.cur };

    /* Three numbers, because three is what decides between two players: what he
       is worth to the lineup you can actually field, whether he will still be
       there next time, and how thin his tier is. Everything else on this card
       is context for those. */
    live =
      '<div class="pp-tiles">' +
        '<div class="pp-tile"><b>' + n0(p.pts) + "</b><span>your points</span></div>" +
        '<div class="pp-tile"><b class="' + (d.marginal > 0 ? "good" : "dim") + '">' +
          (d.marginal > 0 ? "+" : "") + n0(d.marginal || 0) +
          "</b><span>to your lineup</span></div>" +
        '<div class="pp-tile"><b class="' + survCls + '">' + surv + "%</b><span>" +
          (A.survTarget ? "lasts to " + A.survTarget : "survives") + "</span></div>" +
      "</div>" +
      '<div class="pp-market"><span class="pp-k">market</span>' +
        "<span>" + market.join(" · ") + "</span></div>" +
      '<div class="pp-val ' + val.cls + '">' + esc(val.t) + "</div>";
  }

  return '<div class="pp-head">' +
      '<span class="pos pos-' + p.pos + '">' + p.pos + "</span>" +
      '<span class="pp-name">' + esc(p.name) + "</span>" +
      tagBadge(p.tag) +
    "</div>" +
    '<div class="pp-sub">' + p.pos + p.posRank + " · " + esc(p.team) + " · bye " + p.bye +
      " · tier " + p.tier + ", " + p.tierLeft + " left" +
      (p.projSource === "modeled" ? " · modeled projection" : "") + "</div>" +

    (t
      ? '<div class="pp-taken">Off the board — ' +
        (isLive() ? esc(teamLabel(t.slot)) + " has him" : "already drafted") +
        (t.keeper ? ", kept in round " + ownerOfPick(t.pick).round : ", pick " + t.pick) +
        "</div>"
      : live) +

    (lines.length
      ? '<div class="pp-lines">' + lines.map(function (l) {
          return '<div class="pp-line ' + l.cls + '">' + esc(l.t) + "</div>";
        }).join("") + "</div>"
      : "") +

    (!t && d.reasons && d.reasons.length
      ? '<div class="pp-why">' + esc(d.reasons[0]) + "</div>" : "") +

    '<div class="pp-acts">' +
      (t
        ? (isLive() ? '<button class="btn btn-sm" data-pact="assign">Change team</button>' : "")
        : (myTurn()
            ? '<button class="btn btn-sm btn-primary" data-pact="mine">Draft him</button>'
            : '<button class="btn btn-sm" data-pact="gone">' + esc(onClockLabel()) +
              " took him</button>" +
              (isLive() ? '<button class="btn btn-sm" data-pact="assign">who?</button>' : "") +
              '<button class="btn btn-sm btn-teal" data-pact="mine">To me</button>')) +
      '<button class="btn btn-sm btn-ghost" data-pact="full">Full breakdown</button>' +
    "</div>";
}

/** The deep card. A modal, so it cannot displace the draft box behind it. */
function openDetail(name) {
  view.selected = name;
  renderList();
  renderDetail(name);
  openModal("#detailModal");
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

  $$("#detail [data-take2]").forEach(function (b) {
    b.onclick = function () { closeModal("#detailModal"); record(b.dataset.take2, true); };
  });
  $$("#detail [data-gone2]").forEach(function (b) {
    b.onclick = function () { closeModal("#detailModal"); record(b.dataset.gone2, false); };
  });

  // The touch action bar. Same three actions the row carries on desktop, same
  // two functions underneath — only the thing you tapped to get here differs.
  $$("#detail [data-dact]").forEach(function (b) {
    b.onclick = function (e) {
      var act = b.dataset.dact;
      if (act === "close") { closeModal("#detailModal"); return; }
      if (act === "assign") { openAssign(p.name, b, e); return; }
      closeModal("#detailModal");
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

  /* The draft board's three targets, on a keyboard. Digits only when nothing
     has focus — otherwise typing a 2 into the search box drafts somebody. */
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  var el = document.activeElement, tag = el ? el.tagName : "";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      (el && el.isContentEditable)) return;

  if (e.key === "1" || e.key === "2" || e.key === "3") {
    if (IS_TOUCH || !isLive() || !S.draftStarted || S.draftEnded) return;
    if (!A.onClock || A.onClock.slot === S.league.slot) return;
    if (A.cur > S.league.teams * S.league.rounds) return;
    var t = roomTargets().list[+e.key - 1];      // the cache, never a fresh roll
    if (!t) return;
    e.preventDefault();
    takeTarget(t.player.name);
  }

  /* No Escape-to-undo here, though the spec for this band asked for one. Escape
     already closes the assign popover, a pinned player card and the detail
     modal, and the search box holds focus by default on a desktop — so the key
     is either taken or unreachable at every moment it would be pressed, and the
     one way to make it fire from the search box is to make Escape-to-clear-the-
     search delete a pick instead. Ctrl+Z undoes from anywhere already, and the
     Undo on the last-pick line is one press with no keyboard at all. */
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

/* The scoring label map and group order live in impact.js, which needs them to
   name a rule in its own report. Two copies drifted apart the first time one of
   them was corrected, so there is one, and it is owned by the file that has the
   most to say about each key. */
var HUMAN = IMPACT.LABELS;
var GROUPS = IMPACT.GROUPS;

/* ------------------------------------------- what your scoring does to it

   The question this answers is the one every league asks and nothing answers:
   my scoring is not the scoring ADP was drafted under, so what actually changes
   about how I should draft? impact.js does the measuring — six boards, and one
   more for every rule that differs. This renders it.

   Two things it deliberately does not do. It does not read saved state: this
   panel sits in the same modal as the scoring form, and somebody who has just
   typed a number into that form and not yet saved expects the analysis to be
   about the number they can see. And it does not recompute on every open —
   forty boards is not free, so the report is cached against a signature of the
   rules it was built from and rebuilt only when that signature moves. */
var IMPACT_CACHE = { sig: null, report: null };

/** The rules as the form currently shows them, saved or not. */
function pendingRules() {
  var r = JSON.parse(JSON.stringify(S.league.rules || {}));
  $$("#scoringForm input").forEach(function (i) {
    r[i.dataset.grp] = r[i.dataset.grp] || {};
    r[i.dataset.grp][i.dataset.key] = parseFloat(i.value) || 0;
  });
  $$("#rosterForm input").forEach(function (i) {
    r.roster = r.roster || {};
    r.roster[i.dataset.roster] = parseInt(i.value, 10) || 0;
  });
  var teamsBox = $("#cfgTeams");
  r.teams = (teamsBox && parseInt(teamsBox.value, 10)) || S.league.teams;
  return r;
}

function impactReport() {
  var rules = pendingRules();
  var roundsBox = $("#cfgRounds");
  var rounds = (roundsBox && parseInt(roundsBox.value, 10)) || S.league.rounds || 15;
  var sig = JSON.stringify(rules) + "|" + rounds;
  if (IMPACT_CACHE.sig !== sig) {
    IMPACT_CACHE = { sig: sig, report: IMPACT.analyze(DATA.players, rules, { rounds: rounds }) };
  }
  return IMPACT_CACHE.report;
}

function posChip(pos) {
  return '<span class="pos pos-' + esc(pos) + '">' + esc(pos) + "</span>";
}

/** A rank move, written the way the detail panel writes one. */
function moveHtml(delta) {
  if (!delta) return '<span class="dimtext">no move</span>';
  return '<span style="color:var(--' + (delta > 0 ? "green" : "red") + ')">' +
    (delta > 0 ? "up " : "down ") + Math.abs(delta) +
    (Math.abs(delta) === 1 ? " place" : " places") + "</span>";
}

function renderImpact() {
  var out = $("#impactOut");
  if (!out || !IMPACT) return;
  var rep;
  try { rep = impactReport(); }
  catch (err) { out.innerHTML = '<div class="note warn">' + esc(err.message) + "</div>"; return; }

  var html = [];

  // ---- the sentences ----------------------------------------------------
  html.push('<div class="impact-lead">' + rep.headlines.map(function (h, i) {
    return "<p" + (i === 0 ? ' class="impact-first"' : "") + ">" + esc(h) + "</p>";
  }).join("") + "</div>");

  /* ---- what each position is worth --------------------------------------
     Edge, not projected points. A position's projected total says nothing on
     its own — quarterbacks outscore everyone every year and go in the eighth
     round anyway. What decides a draft is the drop from the best one to the
     last one you can start, which is what this column is. */
  var rows = IMPACT.POSITIONS.map(function (pos) {
    var a = rep.scoring.positions.league[pos], b = rep.scoring.positions.base[pos];
    if (!a || !b) return "";
    var rel = (rep.scoring.relative.rel || {})[pos];
    var relCell = rel === undefined || Math.abs(rel) < 0.02
      ? '<span class="dimtext">even</span>'
      : '<span style="color:var(--' + (rel > 0 ? "green" : "red") + ')">' +
        (rel > 0 ? "+" : "−") + Math.round(Math.abs(rel) * 100) + "%</span>";
    return "<tr><td>" + posChip(pos) + "</td>" +
      '<td class="right num">' + n0(a.edge) + "</td>" +
      '<td class="right num dimtext">' + n0(b.edge) + "</td>" +
      '<td class="right num">' + relCell + "</td>" +
      '<td class="right num">#' + (a.bestRank || "—") +
        (a.bestRank && b.bestRank && a.bestRank !== b.bestRank
          ? ' <span class="dimtext">was #' + b.bestRank + "</span>" : "") + "</td>" +
      '<td class="right num">' + a.inPool +
        (a.inPool !== b.inPool ? ' <span class="dimtext">was ' + b.inPool + "</span>" : "") +
      "</td></tr>";
  }).join("");
  html.push('<div class="eyebrow impact-h">What each position is worth here</div>' +
    '<div class="impact-scroll"><table><thead><tr>' +
      "<th>Pos</th>" +
      '<th class="right" title="Points from the best player at the position down to the last ' +
        'one you can start. The number that decides when a position is worth reaching for.">' +
        "Edge</th>" +
      '<th class="right" title="The same figure under full PPR, standard everything else — ' +
        'the scoring consensus ADP was drafted under.">Baseline</th>' +
      '<th class="right" title="Ground gained or lost against the other positions, after ' +
        'dividing out what your scoring does to every position at once. This is the column ' +
        'that changes a draft order.">Ground</th>' +
      '<th class="right" title="Where the best player at the position sits in the overall ' +
        'board order.">Best</th>' +
      '<th class="right" title="How many of the position are inside the ' + rep.poolSize +
        ' players a draft this size actually reaches.">In pool</th>' +
    "</tr></thead><tbody>" + rows + "</tbody></table></div>");

  // ---- the rules that did it --------------------------------------------
  var knobs = rep.scoring.knobs;
  if (!knobs.length) {
    html.push('<div class="note mt">Every scoring rule in your league matches the baseline. ' +
      "There is nothing here to arbitrage — which is itself worth knowing before you " +
      "spend draft night hunting an edge that is not in the rules.</div>");
  } else {
    var shown = knobs.slice(0, 10);
    html.push('<div class="eyebrow impact-h">The rules that did it</div>' +
      '<p class="dimtext impact-note">Each one reverted to the baseline on its own, everything ' +
      "else left at your values, so a rule is credited with what it did rather than with how " +
      "large it looks. Ordered by how much of the draftable board it moved.</p>" +
      '<div class="impact-scroll"><table><thead><tr><th>Rule</th>' +
      '<th class="right">Yours</th><th class="right">Baseline</th>' +
      '<th class="right" title="Players inside the pool whose score this rule changes.">Hits</th>' +
      "<th>Biggest single move</th></tr></thead><tbody>" +
      shown.map(function (k) {
        var m = k.biggestMove;
        return "<tr><td>" + esc(k.label) + "</td>" +
          '<td class="right num">' + k.league + "</td>" +
          '<td class="right num dimtext">' + (k.hasBase ? k.base : "—") + "</td>" +
          '<td class="right num">' + k.touchedCount + "</td>" +
          "<td>" + (m
            ? posChip(m.pos) + " " + esc(m.name) + " " + moveHtml(m.delta)
            : '<span class="dimtext">nobody in the pool moved</span>') + "</td></tr>";
      }).join("") + "</tbody></table></div>");
    if (knobs.length > shown.length) {
      html.push('<details class="mt"><summary class="dimtext impact-note">The other ' +
        (knobs.length - shown.length) + " rules that differ, which moved less</summary>" +
        '<div class="impact-scroll mt"><table><tbody>' +
        knobs.slice(shown.length).map(function (k) {
          return "<tr><td>" + esc(k.label) + '</td><td class="right num">' + k.league +
            '</td><td class="right num dimtext">' + (k.hasBase ? k.base : "—") +
            '</td><td class="right num dimtext">' + k.touchedCount + " hit" +
            (k.touchedCount === 1 ? "" : "s") + "</td></tr>";
        }).join("") + "</tbody></table></div></details>");
    }
  }

  // ---- who moves --------------------------------------------------------
  var c = rep.scoring.churn;
  if (c.up.length || c.down.length) {
    var col = function (title, list, sign) {
      return '<div class="impact-col"><div class="eyebrow">' + title + "</div>" +
        (list.length
          ? '<ul class="knoblist">' + list.slice(0, 6).map(function (m) {
              return '<li class="k-' + sign + '">' + esc(m.name) + " " + posChip(m.pos) +
                ' <span class="dimtext">#' + m.from + " → #" + m.to + "</span></li>";
            }).join("") + "</ul>"
          : '<div class="dimtext impact-note">Nobody.</div>') + "</div>";
    };
    html.push('<div class="eyebrow impact-h">Who your scoring moves</div>' +
      '<p class="dimtext impact-note">Board rank under the baseline against board rank under ' +
      "your rules. Somebody near the top of the left column is a player the rest of your " +
      "league, drafting off consensus, will let slide.</p>" +
      '<div class="impact-cols">' +
        col("Worth more here", c.up, "up") +
        col("Worth less here", c.down, "down") +
      "</div>");
  }

  html.push('<p class="dimtext impact-foot">Baseline: ' + esc(rep.baselineName) +
    ", the scoring the shipped ADP was drafted under — the same baseline the VS STD " +
    "column uses. Compared over the " + rep.poolSize + " players a " + rep.teams + "-team, " +
    rep.rounds + "-round draft actually reaches, because a rule that reorders the bottom of " +
    "the file has changed nobody's draft.</p>");

  out.innerHTML = html.join("");
}

/* Rebuilt lazily. The panel is closed until somebody asks for it, and forty
   boards on every open of League setup would be paid by every user for a panel
   most of them read once. `open` is set before this fires when the parse flow
   opens the panel itself, so the toggle handler covers that route too. */
function wireImpact() {
  var d = $("#dImpact");
  if (!d) return;
  d.addEventListener("toggle", function () { if (d.open) renderImpact(); });
}

/** Show it, and make sure it is showing the rules that were just applied. */
function showImpact() {
  var d = $("#dImpact");
  if (!d) return;
  IMPACT_CACHE.sig = null;
  if (d.open) renderImpact(); else d.open = true;   // the toggle handler renders
  setTimeout(function () { d.scrollIntoView({ block: "start", behavior: "smooth" }); }, 30);
}

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
/* SUPERFLEX is on this form because the rules object already carries it and the
   engine now prices it. Yahoo's Q/W/R/T token has always parsed into
   roster.SUPERFLEX, so a pasted superflex league arrived with the slot set and
   no way to see it, correct it, or type it in from scratch — the form wrote
   back only the keys it listed, so the value survived a save while staying
   invisible. A number that changes every quarterback's replacement rank should
   not be one you can only obtain by pasting. */
function buildRosterForm() {
  var r = S.league.rules.roster;
  $("#rosterForm").innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
    ["QB", "RB", "WR", "TE", "FLEX", "SUPERFLEX", "K", "DEF", "BN", "IR"].map(function (k) {
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
        "live draft box, in the draft log, on the roster switcher and all through the report.",
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
  // Reopening setup after a rules change has to re-measure, not show the last
  // answer: the panel stays open between visits, and a stale one is worse than
  // a closed one.
  if ($("#dImpact") && $("#dImpact").open) { IMPACT_CACHE.sig = null; renderImpact(); }
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
/* Wired once, at load, and not from inside openSetup(). It lived there first,
   which meant anything that threw earlier in that function — a corrupted
   teamNames in saved state was enough — left the panel attached to nothing and
   silently blank, with no error at the point of failure to explain it. */
wireImpact();
$("#setupClose").addEventListener("click", function () { closeModal("#setupModal"); });
$("#presetSel").addEventListener("change", function (e) {
  S.league.preset = e.target.value;
  S.league.rules = JSON.parse(JSON.stringify(PRESETS[e.target.value]));
  S.league.teams = S.league.rules.teams || S.league.teams;
  $("#cfgTeams").value = S.league.teams;
  $("#presetBlurb").textContent = PRESETS[e.target.value].blurb || "";
  buildScoringForm(); buildRosterForm(); buildTeamNames();
  buildKeeperSlots(); buildKeeperList();
  if ($("#dImpact").open) { IMPACT_CACHE.sig = null; renderImpact(); }
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
    /* The moment the settings land is the moment "so what does that do to my
       draft?" is the live question, so answer it here rather than waiting for
       somebody to go looking for a panel they have no reason to know exists. */
    showImpact();
    flash("#parseOut", "Applied — and analyzed below. Review the scoring section, " +
      "then Save league.");
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
  // The token counts were in this line too. Nobody drafting has a use for
  // "137,903 in / 6,669 out" — the two numbers that answer a question anyone
  // actually has are how many times you have asked and what it has cost.
  $("#spendLine").textContent = s.calls + " question" + (s.calls === 1 ? "" : "s") +
    " this draft · about $" + usd.toFixed(2) + (PROXY ? " of the shared budget" : " on your key") +
    (claudeCfg.budget ? " · $" + claudeCfg.budget.spentToday.toFixed(2) + " of $" +
      claudeCfg.budget.dailyBudget.toFixed(0) + " spent across everyone today" : "");
}
$("#btnClaude").addEventListener("click", function () {
  $("#apiKey").value = claudeCfg.key || "";
  $("#modelSel").value = claudeCfg.model || "claude-haiku-4-5";
  claudePanes();
  // The board has moved since the last time this was open, so the questions and
  // the line above them are rebuilt rather than left as they were.
  if (claudeReady()) renderAskQuestions();
  $("#claudeOut").classList.add("hidden");
  $("#claudeQ").value = "";
  openModal("#claudeModal");
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
/**
 * The questions worth asking at this exact pick, in the user's own words.
 *
 * The four that used to sit here were fixed strings — "Compare my top two",
 * "Read my roster" — which read as menu items rather than as anything the
 * drafter was already wondering. They also made the user do the translation:
 * you had to know that "my top two" meant the two names at the top of the board
 * to know whether you wanted the answer.
 *
 * These carry the names, the slots and the pick numbers the board already
 * holds, so the chip says the thing and the payload behind it is a full
 * question. The label is short enough for a chip; `q` is what actually gets
 * asked and what lands in the box, so the user can see what was asked and edit
 * it rather than wondering what the chip did.
 *
 * Everything here degrades: with no roster, no next pick or nothing left on the
 * board, the question that needed that fact is simply not offered.
 */
function askQuestions() {
  var out = [];
  var top = (A.avail || []).slice(0, 3);
  var open = (typeof openStartingSlots === "function" ? openStartingSlots() : [])
    .map(function (s) { return s.label; });
  var onMe = A.onClock && A.onClock.slot === S.league.slot;

  if (A.myNext && top.length) {
    out.push({
      k: "brief",
      label: onMe ? "Who do I take right now?" : "Who do I take at " + A.myNext + "?",
      // Shown in the box so the user can see and edit what was asked. The wire
      // payload is briefQuestion() — see askBrief — which carries the answer
      // shape the Draft button binds against.
      q: "Give me the call for pick " + A.myNext + " before the timer starts: the player, " +
         "why him against my open slots, and one fallback if he is gone."
    });
  }
  if (top.length >= 2) {
    out.push({
      k: "compare",
      label: top[0].name + " or " + top[1].name + "?",
      q: "Take " + top[0].name + " or " + top[1].name + " here? Give me the one you would " +
         "take and the single reason it is not the other, against my open slots."
    });
  }
  // Early on, everything is open and "fill RB1 or WR1 first" is not the question
  // anybody has — the shape of the next few rounds is. Late, with one or two
  // holes left, it is exactly the question.
  if (open.length >= 4) {
    out.push({
      k: "need",
      label: "What should my next three picks be?",
      q: "My starting lineup is still mostly empty — " + open.join(", ") + " open, with " +
         ((A.upcoming || []).length) + " picks left. What do the next three picks have to " +
         "accomplish, in order, and which position gets scarce first?"
    });
  } else if (open.length) {
    out.push({
      k: "need",
      label: open.length > 1 ? "Fill " + open.slice(0, 2).join(" or ") + " first?"
                             : "Do I have to fill " + open[0] + " now?",
      q: "My starting lineup still has " + open.join(", ") + " open and " +
         ((A.upcoming || []).length) + " picks left to fill them. Which of those do I " +
         "solve at this pick and which can wait, and what does it cost me if I wait wrong?"
    });
  }
  if (A.myAfter) {
    out.push({
      k: "survive",
      label: "Who lasts to " + A.myAfter + "?",
      q: "Of the players I would actually want, who is most likely to still be there at " +
         "pick " + A.myAfter + ", and who will certainly not be? I want to know what I can " +
         "afford to wait on."
    });
  }
  if (top.length) {
    out.push({
      k: "reach",
      label: "Is " + top[0].name + " a reach?",
      q: "The board has " + top[0].name + " first. Is taking him here a reach against where " +
         "the room is actually drafting, and is there someone the board is underrating who " +
         "goes ahead of him?"
    });
  }
  out.push({
    k: "risk",
    label: "What am I missing?",
    q: "What is this board's blind spot right now? What would a sharp opponent at this table " +
       "do in the next few picks that I am not seeing — a run, a positional squeeze, a player " +
       "whose situation the numbers have not caught up with?"
  });
  if (S.picks.length) {
    out.push({
      k: "roster",
      label: "How is my team shaping up?",
      q: "Look at the roster I have built so far. What shape is it in, what is its one real " +
         "weakness, and what should I be hunting for over my next two picks?"
    });
  }
  return out;
}

/** The chips, rebuilt every time the panel opens — the board has moved since. */
function renderAskQuestions() {
  var host = $("#askQs"); if (!host) return;
  var qs = askQuestions();
  host.innerHTML = qs.map(function (q, i) {
    return '<button type="button" class="askq" data-i="' + i + '">' + esc(q.label) + "</button>";
  }).join("");
  $$("#askQs .askq").forEach(function (b) {
    b.onclick = function () {
      var pick = qs[+b.dataset.i];
      $("#claudeQ").value = pick.q;
      // The brief is the one question with a purpose-built payload behind it.
      askClaude(pick.label, pick.k === "brief" ? briefQuestion() : null);
    };
  });

  var where = $("#askWhere");
  if (!where) return;
  if (!A.myNext) {
    where.textContent = "Your picks are all in. Ask anything about the board or the rosters.";
  } else {
    var open = openStartingSlots().map(function (s) { return s.label; });
    where.textContent = "Pick " + A.cur + " of " + (S.league.teams * S.league.rounds) +
      ", round " + A.onClock.round + ". You pick at " + A.myNext +
      (A.myAfter ? " and " + A.myAfter : "") + ". " +
      (open.length ? "Still open: " + open.join(", ") + "." : "Your starting lineup is full.");
  }
}

$("#claudeGo").addEventListener("click", function () { askClaude(); });

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
 * The user's roster, slot by slot, and what is still missing from it.
 *
 * This replaces three lines that were between them saying something false. The
 * old block printed "STARTERS FILLED: RB 5/2", which is not a fraction of
 * anything: `have` counts every back owned and `starters` counts the slots, so
 * a healthy bench read as an overflowing starting lineup. Beside it sat a
 * standing instruction to compare every candidate against "the man already in
 * that slot" and to say plainly that a player who cannot start is worth close
 * to nothing — which, with a slot actually empty, produced "he CANNOT crack my
 * starting lineup" attached to the receiver who would have filled the hole,
 * two paragraphs below a line reading WR: EMPTY.
 *
 * So: name the slot, name who is in it, and say what the best man left would
 * add to it. That is the same argument, made out of facts the app holds,
 * without a sentence that can contradict the roster printed above it.
 */
function rosterBlock() {
  var rules = S.league.rules;
  var lines = [], open = [];
  // Best available at a position by projected points, not composite: this line
  // answers "who would go in the hole", and the hole is filled with points.
  var bestLeft = function (pos) {
    var best = null;
    A.avail.forEach(function (p) {
      if (p.pos !== pos) return;
      if (p.compDetail && p.compDetail.blocked) return;
      if (!best || p.pts > best.pts) best = p;
    });
    return best;
  };

  startingSlots().forEach(function (s) {
    var label = s.label;
    if (s.player) {
      var pl = s.player;
      var line = "- " + label + ": " + pl.name + ", " + Math.round(pl.pts) +
        " pts, bye " + pl.bye;
      if (s.pos === "FLEX") line += " (" + pl.pos + ")";
      // What an upgrade here is actually worth, in the only unit that matters.
      var up = bestLeft(s.pos === "FLEX" ? pl.pos : s.pos);
      if (up) {
        var d = Math.round(up.pts - pl.pts);
        line += d > 0
          ? ". Best left at the position is " + up.name + ", " + d + " pts better"
          : ". Nobody left at the position beats him (" + up.name +
            " is the best, " + Math.abs(d) + " pts worse)";
      }
      lines.push(line);
    } else {
      var floor = s.floor, blocked = s.blocked;
      // Nobody's position is "FLEX", so ask the positions that can fill it.
      var b = s.pos === "FLEX"
        ? (rules.roster.flexEligible || ["RB", "WR", "TE"])
            .map(bestLeft).filter(Boolean)
            .sort(function (x, y) { return y.pts - x.pts; })[0]
        : bestLeft(s.pos);
      lines.push("- " + label + ": EMPTY" +
        (blocked ? " (cannot be taken until round " + floor + ")" : "") +
        (b && !blocked ? ". Best left is " + b.name + " (" + b.pos + "), " +
          Math.round(b.pts) + " pts" : ""));
      open.push(label + (blocked ? " (round " + floor + " at the earliest)" : ""));
    }
  });

  var bench = (A.roster.bench || []).map(function (p) {
    return p.name + " (" + p.pos + ", " + Math.round(p.pts) + " pts)";
  });

  var out = ["MY ROSTER, SLOT BY SLOT:\n" + lines.join("\n")];
  out.push("MY BENCH: " + (bench.length ? bench.join("; ") : "empty"));

  /* Depth, said per position rather than as one list.
     "MY BENCH: empty" is true and useless: it does not say where the hole would
     open, how many weeks a body there would actually play, or which of my
     starters has nobody behind him. Those are the facts that decide every pick
     from the round the lineup fills onward, and they were the ones the payload
     did not carry — so the model was left to argue from a candidate list that
     said nothing but "he CANNOT crack my starting lineup" twelve times. */
  var startersBy = {}, benchBy = {};
  startingSlots().forEach(function (s) {
    if (s.player) startersBy[s.player.pos] = (startersBy[s.player.pos] || 0) + 1;
  });
  (A.roster.bench || []).forEach(function (p) {
    (benchBy[p.pos] = benchBy[p.pos] || []).push(p);
  });
  var depth = ["QB", "RB", "WR", "TE"].map(function (pos) {
    var st = startersBy[pos] || 0, bn = (benchBy[pos] || []);
    if (!st && !bn.length) return null;
    // Distinct weeks, not one per starter: two of my backs sharing a bye is one
    // week with a hole in it, not two, and a single backup can only cover it once.
    var weeks = {};
    startingSlots().forEach(function (s) {
      if (s.player && s.player.pos === pos) weeks[s.player.bye] = true;
    });
    var wk = Object.keys(weeks).sort(function (a, b) { return a - b; });
    return "- " + pos + ": I start " + st + ", with " + (bn.length
        ? bn.length + " behind (" + bn.map(function (q) { return q.name; }).join(", ") + ")"
        : "NOBODY behind them") +
      ". A body here plays about " + wk.length + " week" + (wk.length === 1 ? "" : "s") +
      " on byes alone (week" + (wk.length === 1 ? " " : "s ") + wk.join(", ") +
      "), plus whatever injuries cost me.";
  }).filter(Boolean);
  if (depth.length) {
    out.push("HOW DEEP I AM, AND HOW OFTEN A BACKUP HERE WOULD ACTUALLY PLAY:\n" +
      depth.join("\n") +
      "\nThat last number is the honest ceiling on what a backup is worth to me: a body " +
      "behind a one-slot position plays a single week a year unless somebody gets hurt, " +
      "and one behind three started slots plays three. Weigh depth picks by it.");
  }
  out.push(open.length
    ? "STARTING SLOTS STILL EMPTY: " + open.join(", ") + "."
    : "STARTING SLOTS STILL EMPTY: none — every starter is filled, so anything " +
      "from here is depth or an upgrade.");

  // A bye stack is a real cost and it is invisible on a slot-by-slot read.
  var stacked = Object.keys(A.byeCounts || {}).filter(function (w) {
    return A.byeCounts[w] >= (A.ctx.byeTolerance || 3);
  });
  if (stacked.length) {
    out.push("STARTERS SHARING A BYE: " + stacked.map(function (w) {
      return A.byeCounts[w] + " in week " + w;
    }).join(", ") + " (tolerance is " + (A.ctx.byeTolerance || 3) + ").");
  }

  var left = (A.upcoming || []).length;
  out.push("PICKS I HAVE LEFT: " + left +
    (left ? " (" + A.upcoming.slice(0, 4).join(", ") +
      (left > 4 ? ", ..." : "") + ")" : "") + ".");
  return out.join("\n\n");
}

/**
 * The last eight picks as six numbers, and whether they amount to a run.
 *
 * The whole draft log is 180 picks and the payload has never sent it. What the
 * model actually needs from it is the shape of the last two turns, which is six
 * integers, plus whether the engine calls it a run.
 */
function runLine() {
  var c = (A.runInfo && A.runInfo.counts) || {};
  var order = ["QB", "RB", "WR", "TE", "K", "DEF"];
  var mix = order.map(function (p) { return p + " " + (c[p] || 0); }).join(", ");
  var runs = Object.keys((A.runInfo && A.runInfo.runs) || {});
  var unknown = (A.runInfo && A.runInfo.unknown) || 0;
  return "THE LAST " + ((A.runInfo && A.runInfo.window) || 0) + " PICKS, BY POSITION: " +
    mix + "." +
    // Say what we could not see, rather than letting six zeroes imply a quiet
    // board when the truth is that nobody wrote the names down.
    (unknown ? " " + unknown + " of those went unrecorded, so the mix is what is " +
      "known and not the whole window." : "") +
    (runs.length
      ? " The board calls that a run at " + runs.join(" and ") + "."
      : " No run.");
}

/**
 * Who picks between now and my turn, one line per team rather than per pick.
 *
 * A snake turn hands the same team two picks in a row, and printing a line for
 * each made one opponent look like two and inflated the block for no
 * information. Teams are what matter here: a team is short at a position once,
 * however many picks it holds.
 *
 * "Short at" also has to respect the floors. Nobody drafts a kicker before
 * round 14, so listing every team as short at K on every call from round 1 was
 * noise that crowded out the positions that were actually in contention.
 */
function teamsAheadBlock() {
  var ahead = teamsAhead();
  if (!ahead.length) return "TEAMS PICKING BEFORE ME: none, I am on the clock now.";

  var round = A.onClock.round;
  var floors = { K: A.ctx.kFloorRound, DEF: A.ctx.defFloorRound };
  var byTeam = {}, order = [];
  ahead.forEach(function (t) {
    if (!byTeam[t.slot]) { byTeam[t.slot] = { slot: t.slot, picks: [], roster: t.roster, needs: t.needs }; order.push(t.slot); }
    byTeam[t.slot].picks.push(t.pick);
  });

  var lines = order.map(function (slot) {
    var t = byTeam[slot];
    var needs = t.needs === "starters full" ? [] : t.needs.split(", ");
    var live = needs.filter(function (pos) {
      return !(floors[pos] && round < floors[pos]);
    });
    var held = t.picks.length === 1
      ? "pick " + t.picks[0]
      : "picks " + t.picks.join(" and ");
    return "- team " + slot + " (" + held + "): has " + t.roster + ", still needs " +
      (live.length ? live.join(", ") : "nothing it can take yet");
  });

  var picks = ahead.length;
  return "TEAMS PICKING BEFORE ME (" + picks + " pick" + (picks === 1 ? "" : "s") +
    " across " + order.length + " team" + (order.length === 1 ? "" : "s") + "):\n" +
    lines.join("\n");
}

/**
 * The draft style, when there is one, and silence when there is not.
 *
 * The old clause named the style and then asked the model to "say when a pick
 * is only on top because of the style, and say so too when the style is
 * steering me wrong here." On Balanced that is an invitation to invent. Balanced
 * is `knobs: {}` — literally no overrides — so no pick is ever on top because
 * of it, and any sentence claiming one is cannot be checked from outside the
 * app. Asking a model to explain the influence of something with no influence
 * reliably produces an explanation.
 *
 * So on a style with no knobs this block says nothing at all. On a style with
 * knobs it names them as the numbers they are, and the scores below already
 * have them applied.
 *
 * The values are read from `activeKnobs()`, not from the preset. `styleCustom`
 * is a sanitized knob object — the style editor and the Claude-tuning flow both
 * write one — so the block used to describe a Hero RB the user had already
 * edited away from and then append the overrides as prose: "My own notes on it:
 * [object Object]". The model was told the preset and shown scores computed from
 * something else. `activeKnobs()` is the merge the board itself ranks on, so its
 * numbers are the only ones this sentence can honestly quote.
 *
 * The keys, though, are the style's own — the preset's plus the user's. The
 * league's bye tolerance is a league setting that `activeKnobs()` backfills for
 * the engine's benefit, and listing it here would give Balanced a knob to talk
 * about when the whole point above is that it has none.
 */
function styleBlock() {
  var key = S.league.style || "balanced";
  var st = STRATS[key] || STRATS.balanced;
  var custom = S.league.styleCustom;
  var knobs = activeKnobs();
  var names = Object.keys(st.knobs || {});
  Object.keys(custom || {}).forEach(function (k) {
    if (names.indexOf(k) < 0) names.push(k);
  });
  if (!names.length) return "";

  var out = "MY DRAFT STYLE: " + styleName() +
    (st.tagline ? " — " + st.tagline.replace(/\.\s*$/, "") : "") +
    ". The scores below already have it applied.";
  out += " It changes the board by: " + names.map(function (k) {
    var v = knobs[k];
    // A knob the user set themselves outranks the preset's own reasoning, and
    // the model should weigh it that way rather than as one more house number.
    return k + " " + (v && typeof v === "object" ? JSON.stringify(v) : v) +
      (custom && custom[k] !== undefined ? " (my own tweak)" : "");
  }).join("; ") + ".";
  return out;
}

/**
 * How much is left at each position, as counts rather than as a list.
 *
 * The candidate block already spends most of the payload naming individual
 * players. What it cannot show is scarcity: whether the receiver you are
 * looking at is the last one worth starting or the first of nine, and how far
 * the drop is once his tier empties. That is the whole "wait or take him now"
 * question at slot 11, where the gaps alternate three and twenty-one.
 *
 * Counts and one name per position, never a list. Six lines replace what would
 * otherwise be a second copy of the board.
 */
function supplyBlock() {
  var order = ["QB", "RB", "WR", "TE", "K", "DEF"];
  var repl = (A.board && A.board.replacement) || {};
  var lines = order.map(function (pos) {
    var left = A.avail.filter(function (p) { return p.pos === pos; });
    if (!left.length) return "- " + pos + ": nobody left.";
    var replPts = repl[pos] ? repl[pos].points : null;
    var above = replPts == null ? null
      : left.filter(function (p) { return p.pts > replPts; }).length;
    var best = left.slice().sort(function (a, b) { return b.pts - a.pts; })[0];

    var out = "- " + pos + ": " + left.length + " left";
    if (above != null) {
      out += ", " + above + " above replacement (" + Math.round(replPts) + " pts)";
    }
    out += ". Best is " + best.name + " at " + Math.round(best.pts);
    // The cliff: how many of his tier remain, and what the next one costs you.
    var sameTier = left.filter(function (p) { return p.tier === best.tier; });
    var nextTier = left.filter(function (p) { return p.tier > best.tier; })
      .sort(function (a, b) { return b.pts - a.pts; })[0];
    out += ", tier " + best.tier + " with " + sameTier.length + " left in it";
    if (nextTier) {
      out += "; the next tier starts at " + Math.round(nextTier.pts) +
        " (" + Math.round(best.pts - nextTier.pts) + " pts down)";
    }
    return out + ".";
  });
  return "WHAT IS LEFT, BY POSITION:\n" + lines.join("\n");
}

/**
 * Guarantee the list can answer the question, when a starting slot is open.
 *
 * This is a rule about what the model is allowed to SEE, in code. It is not a
 * rule about what to believe and it must never become one. Every candidate
 * still carries its composite, unqualified; nothing in the payload says the
 * ranking may be wrong or that a player who fills a hole should be preferred.
 * That sentence was drafted three times during the review and cut three times.
 * If the board ranks a second tight end over a startable receiver, the fix is
 * the board — which is what the empty-slot pricing, the invariant guard and the
 * flex-door correction were for.
 *
 * What this fixes is narrower and measured: at pick 110 with WR2 empty, the
 * twelve candidates were 5 TE, 4 QB and 3 RB — no receivers at all — under an
 * instruction reading "name a player from this list and nobody else." The model
 * could not have filled the hole if it had wanted to. So: for every starting
 * slot that is open and fillable this round, the best candidate who can
 * actually go into it is on the list. One per open position, not a quota.
 *
 * The report proposed two stronger forms and both are wrong on this board.
 * Reserving half the list for startable bodies floods it with defenses the
 * moment the DEF slot opens in round 7, because every defense "can start" into
 * an empty slot. Leading the list with the best body by projected points does
 * the same and worse: it put Houston Defense at 336 points ahead of Jahmyr
 * Gibbs at 335 in round 8, since raw points are not comparable across positions
 * — which is the entire reason the board computes VOR and a composite at all.
 * Coverage is the part that fixes the measured defect. Ordering is the board's
 * job and stays the board's job.
 *
 * Once the engine ranks correctly this should mostly stop firing, and that is
 * the test of whether the line was drawn in the right place.
 */
function applyReserveRule(ranked, limit) {
  var open = openStartingSlots();
  /* With the lineup full this used to hand back the raw top of the board, and
     the raw top of the board clusters by position once nothing can improve the
     lineup — so the model was handed twelve names, all quarterbacks, under
     "name a player from this list and nobody else", and it did what it was
     told. The answer read as a considered case for a backup quarterback because
     no other kind of answer was available to it. A depth list has to span the
     positions depth can actually be bought at. */
  if (!open.length) {
    var out0 = ranked.slice(0, limit);
    var posSeen = {};
    out0.forEach(function (p) { posSeen[p.pos] = true; });
    if (Object.keys(posSeen).length >= 3) return out0;
    var room0 = Math.floor(limit / 2);
    var added = 0;
    ranked.forEach(function (p) {
      if (added >= room0 || posSeen[p.pos]) return;
      if (p.pos === "K" || p.pos === "DEF") return;   // streamed, never depth
      posSeen[p.pos] = true;
      out0[out0.length - 1 - added] = p;
      added++;
    });
    return out0;
  }

  var rules = S.league.rules;
  var flexEl = rules.roster.flexEligible || ["RB", "WR", "TE"];
  var openPos = {};
  open.forEach(function (sl) {
    if (sl.pos === "FLEX") flexEl.forEach(function (q) { openPos[q] = true; });
    else openPos[sl.pos] = true;
  });

  var out = ranked.slice(0, limit);
  var have = {};
  out.forEach(function (p) { have[p.name] = true; });
  var covered = {};
  out.forEach(function (p) { if (openPos[p.pos]) covered[p.pos] = true; });

  var missing = Object.keys(openPos).filter(function (pos) { return !covered[pos]; });
  if (!missing.length) return out;

  // At most half the list may be given over to coverage. Early in a draft every
  // slot is open, and a list that is all coverage is not a list of candidates.
  var room = Math.floor(limit / 2);
  missing.slice(0, room).forEach(function (pos) {
    var best = null;
    ranked.forEach(function (p) {
      if (p.pos !== pos || have[p.name]) return;
      if (!best || p.comp > best.comp) best = p;
    });
    if (!best) return;
    have[best.name] = true;
    best.briefCoverage = pos;          // he is here because the slot is open
    out.pop();                          // displace the weakest by composite
    out.push(best);
    out.sort(function (a, b) { return b.comp - a.comp; });
  });
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
  if (!waiting) return applyReserveRule(pool, limit);

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
  return applyReserveRule(out, limit);
}

/** Everything Claude sees. Numbers only — it never re-derives the scoring. */
function claudeContext() {
  var rules = S.league.rules;
  var waiting = A.myNext > A.cur;
  // Eight, not twelve. The candidate block was 1,860 tokens of a 2,541-token
  // payload — 73% of everything the model saw was a list of players, against
  // 126 tokens describing the roster it was picking for. The roster block and
  // the supply block are worth more per token than candidates nine through
  // twelve, which were never the answer.
  var top = briefCandidates(waiting, 8);
  briefCandidateNames[A.myNext] = top.map(function (p) { return p.name; });
  // What each candidate would actually add to the lineup the user can field
  // today. This is the number the old prose was gesturing at when it told the
  // model to compare against "the man already in that slot", except it is
  // computed rather than asserted, and it is right when the slot is empty.
  var baseLineup = E.lineupPoints(A.mine, S.league.rules);
  var lineupAdd = function (p) {
    return Math.round(E.lineupPoints(A.mine.concat([p]), S.league.rules) - baseLineup);
  };
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
    var add = lineupAdd(p);
    var slotOpen = openStartingSlots().some(function (sl) {
      return sl.pos === p.pos ||
        (sl.pos === "FLEX" && (rules.roster.flexEligible || ["RB", "WR", "TE"]).indexOf(p.pos) >= 0);
    });
    var effect = add > 0
      ? "+" + add + " to my starting lineup" +
        (slotOpen ? " — he fills an open " + p.pos + " slot" : " — he beats the " + p.pos + " in my slot")
      : "+0 to my starting lineup — depth only" +
        (slotOpen ? ", and my " + p.pos + " slot is still open" : ", my " + p.pos + "s are better");
    return "- " + p.name + " (" + p.pos + " " + p.team + ", bye " + p.bye + "): " +
      effect + ". " + Math.round(p.pts) + " pts in this league, VOR " + Math.round(p.vor) +
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
  return [
    "LEAGUE: " + (S.league.rules.name || "custom") + ", " + S.league.teams +
      " teams, I pick at slot " + S.league.slot + ". Board data baked " + BAKED_ON + ".",
    "SCORING THAT DIFFERS FROM DEFAULT: " + scoringHighlights(),
    "DRAFT STATE: pick " + A.cur + " of " + (S.league.teams * S.league.rounds) +
      ", round " + A.onClock.round + ". My next pick is " + A.myNext +
      (A.myAfter ? ", then " + A.myAfter + " (" + (A.myAfter - A.myNext) + " picks apart)" : "") + ".",
    runLine(),
    rosterBlock(),
    supplyBlock(),
    styleBlock(),
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
  if (r.dst.pa0 > 12) {
    // "Worth roughly a 7th-round pick" was hand-written and, in this league,
    // wrong by five rounds: the board's own VOR puts the best defense at #22,
    // a round 2 pick. impact.js has computed bestRank and bestRound for exactly
    // this sentence all along, and bestRank is the number the impact panel puts
    // on screen — so quoting it is also the only way the payload and the panel
    // can be pinned to each other. If the report cannot be built, the tier
    // numbers still stand on their own; a missing clause beats a made-up one.
    var dst = "boosted D/ST points-allowed tiers (" + r.dst.pa0 + " for a shutout, " +
      r.dst.pa7_13 + " for 7-13)";
    try {
      var def = impactReport().scoring.positions.league.DEF;
      if (def && def.bestRound && def.bestRank) {
        dst += " — this makes an elite defense worth roughly a round " + def.bestRound +
          " pick (#" + def.bestRank + " on this board)";
      }
    } catch (e) { /* the tiers are still worth saying without the rank */ }
    out.push(dst);
  }
  return out.join("; ") || "nothing unusual";
}

/**
 * The date the board was baked. Every projection, ADP, depth-chart slot and
 * injury designation in the app is a snapshot taken that morning — SYSTEM used
 * to tell the model they "are current", which is true on bake day and a lie by
 * draft night. audit.js flags the same gap at three days. Saying the date lets
 * the model discount a designation it has reason to think has moved, which is
 * the judgment it is here for.
 */
var BAKED_ON = (DATA.meta || {}).built || (DATA.meta || {}).baked || "an unknown date";

var SYSTEM =
  "You are a fantasy football draft advisor sitting next to the user during a live draft. " +
  "You will be given the current state of their board, computed by a scoring engine that " +
  "already applies their exact league rules. Trust those numbers — do not recompute them and " +
  "do not substitute generic consensus rankings. Your job is judgment on top of the math: " +
  "where the board's logic is thin, what the research notes actually imply, and what an " +
  "opponent might do next. Depth-chart slots and injury designations come straight from " +
  "the league feed as of " + BAKED_ON + "; if that is more than a couple of days old, a " +
  "designation may have moved since, and saying so is more use than repeating it. " +
  "Where two ADP sources are given and they disagree, that " +
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
      // "Failed to fetch" is what the browser says when the request never left
      // or never landed, and it is no use to somebody on a two-minute clock.
      // Say what it means and what still works, which is everything else.
      if (err instanceof TypeError) {
        throw new Error("Couldn't reach Claude — the connection dropped or the service is " +
                        "down. The board, the scores and every pick you record are unaffected.");
      }
      throw err;
    })
    .then(function (text) { if (timer) clearTimeout(timer); return text; },
          function (err) { if (timer) clearTimeout(timer); throw err; });
}

/**
 * Ask, and answer in the panel the question was asked from.
 *
 * `head` is what the user pressed, printed over the answer — with several
 * chips in play, an answer with no question above it is an orphan by the time
 * it arrives. `payload` lets a chip send a purpose-built prompt (the brief's)
 * while the box still shows the plain-English version of what was asked.
 */
function askClaude(head, payload) {
  var q = $("#claudeQ").value.trim();
  if (!q) return;
  if (!claudeReady()) { claudePanes(); return; }
  var out = $("#claudeOut");
  out.classList.remove("hidden"); out.classList.remove("err");
  $("#claudeOutHead").textContent = head || q;
  out.querySelector(".claude-out").innerHTML = '<span class="spinner"></span> reading the board…';
  $("#claudeGo").disabled = true;
  // The answer can be taller than the panel that was on screen when it was
  // asked, and on a tablet the button is under a thumb at the bottom.
  try { out.scrollIntoView({ block: "nearest" }); } catch (e) {}

  claudeCall(payload || (claudeContext() + "\n\nQUESTION: " + q))
    .then(function (text) { out.querySelector(".claude-out").textContent = text; })
    .catch(function (err) {
      out.classList.add("err");
      out.querySelector(".claude-out").textContent = err.message;
    })
    .then(function () { $("#claudeGo").disabled = false; renderSpend(); });
}

/* ------------------------------------------------------- the on-deck brief */

// Cached against the pick number it was written for, so it is asked once and
// survives re-renders, undo and reload without spending again.
var briefCache = {};   // reassigned wholesale by resetDraft
var briefTries = {};   // re-asks per pick, so a bad answer cannot bill in a loop
// The pick count when each brief was written. A brief is asked two picks out
// and cached against the pick it is FOR, so it stays on screen while the room
// keeps drafting — and a plan written before two other teams picked reads
// exactly like one written for the board in front of you.
var briefWrittenAt = {};
// The names the payload actually carried, per pick, so a change at the top of
// the board can be told apart from a player the brief chose not to name.
var briefCandidateNames = {};

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

/**
 * The fallback the brief named, if it named one.
 *
 * The answer's last line starts with "If gone:" by instruction, and that clause
 * is a plan the user acts on when the first name is taken. It is worth exactly
 * as much as the first name and was never checked.
 */
function briefFallback(text) {
  var lines = (text || "").split("\n");
  for (var i = lines.length - 1; i >= 0; i--) {
    if (/^\s*if gone\s*:/i.test(lines[i])) {
      return playerIn(lines[i].replace(/^\s*if gone\s*:/i, ""));
    }
  }
  return null;
}

/**
 * The player the brief's first line names, and what the Draft button binds to.
 *
 * Measured against thirty real answers from the deployed model, one came back
 * as "Gibbs" rather than "Jahmyr Gibbs". playerIn() refuses a bare surname on
 * purpose — two players can share one, and binding the Draft button to the
 * wrong man is a failure this app has already had once — so that brief arrived
 * with a button that did nothing, on the clock. The prompt now demands the full
 * name, and that is the real fix.
 *
 * This is the backstop behind it. When the head line does not bind, resolve it
 * against the eight names the payload actually carried, and only when exactly
 * one of them matches. That is safe in the way a board-wide surname match is
 * not: the model was told to name a player from that list, the list is short,
 * and an ambiguous surname still binds to nobody rather than to a guess.
 */
function briefPlayer(text) {
  var head = (text || "").split("\n")[0];
  var hit = playerIn(head);
  if (hit) return hit;
  var shown = briefCandidateNames[A.myNext] || [];
  var words = normName(head).split(" ").filter(Boolean);
  if (!words.length || !shown.length) return null;
  var matches = shown.filter(function (n) {
    var parts = normName(n).split(" ");
    return words.every(function (w) { return parts.indexOf(w) >= 0; });
  });
  return matches.length === 1 ? (A.byName[matches[0]] || null) : null;
}

/**
 * Whether the plan on screen has been overtaken by the board.
 *
 * briefStale() re-asked on exactly one condition: the player it named being
 * drafted. A brief written two picks out therefore survived its own fallback
 * being taken, a run starting at the position it argued about, and a startable
 * body falling to the user — and was still on screen, word for word, when the
 * clock started. At slot 11 the long gaps are twenty-one picks. A great deal
 * happens in twenty-one picks.
 *
 * Four tests, all local. No API call is needed to evaluate any of them, which
 * is the point: the expensive thing is asking again, so deciding whether to ask
 * has to be free.
 */
function briefVoid(text) {
  if (!text || text.charAt(0) === "!") return null;

  var named = briefPlayer(text);
  if (named && named.takenBy) return "the player it named has gone";

  var fb = briefFallback(text);
  if (fb && fb.takenBy) return "the fallback it named has gone";

  // Someone now leads the board who was not among the players it was shown. It
  // did not pass him over; it never saw him.
  var pool = A.avail.filter(function (p) { return !(p.compDetail && p.compDetail.blocked); })
                    .sort(function (a, b) { return b.comp - a.comp; });
  if (pool.length && text.indexOf(pool[0].name) < 0) {
    var wasShown = briefCandidateNames[A.myNext];
    if (wasShown && wasShown.indexOf(pool[0].name) < 0) {
      return "the board's top player has changed to one it was not shown";
    }
  }

  // A run at a position the brief actually discussed. A run somewhere it never
  // mentioned is not a reason to spend money re-asking.
  var runs = Object.keys((A.runInfo && A.runInfo.runs) || {});
  for (var i = 0; i < runs.length; i++) {
    if (text.indexOf(runs[i]) >= 0) return "a run has started at " + runs[i];
  }
  return null;
}

/**
 * The question that earns its keep. Everything in here is either computed by the
 * board or known only because we track who drafted what — in particular, what
 * the teams picking between now and your turn still need, which is the part raw
 * ADP cannot tell you.
 */
function briefQuestion() {
  return claudeContext() + "\n\n" + teamsAheadBlock() +
    "\n\nQUESTION: I am about to be on the clock at pick " + A.myNext +
    ". Give me the call before the timer starts.\n" +
    "Answer in exactly this shape, no headings, no bullets:\n" +
    "Line 1 — the player you would take, written as his FULL NAME exactly as " +
    "it appears in the list above, and nothing else on that line. Not a " +
    "surname on its own and not a shortened form: the app binds its Draft " +
    "button by matching that line against the board, and a surname alone " +
    "matches nobody.\n" +
    "Then two or three sentences on why, grounded in my open roster slots, the " +
    "board's numbers and anything the research notes flag.\n" +
    "Then one line starting \"Instead:\" naming ONE alternative with a different " +
    "shape to it — a different position, or the same position bought for a " +
    "different reason — and the single thing that would make me prefer it. This " +
    "is the line that lets me overrule you on my own taste, so make it a real " +
    "alternative and not a near-copy of the first.\n" +
    "Last line — start it with \"If gone:\" and name one fallback in a single clause. " +
    "Do not quote survival percentages on that line; a fallback is by definition " +
    "the player you take when the first one is already gone.\n" +
    "Under 130 words total. If the board's top pick is right, say so plainly and " +
    "spend your words on what it cannot see.\n" +
    "When every starting slot of mine is filled, say so and price the pick as " +
    "what it is: depth. Weigh it by how many weeks that body would actually " +
    "play for me — the depth block above gives that number per position — and " +
    "not by how far he sits above replacement on a board that does not know I " +
    "already own a starter there. A second quarterback behind a healthy starter " +
    "in a one-quarterback league plays one week a year; say that plainly rather " +
    "than dressing it up, and only recommend him if nothing else on the list is " +
    "worth more than one week of a backup.\n" +
    "Every player listed above is ON THE BOARD right now — nobody has taken them. " +
    "A survival percentage is the chance he lasts until my pick, not a report that " +
    "he has gone. Never describe an available player as gone, taken or off the " +
    "board: say he is unlikely to last, which is the thing that is actually true.";
}

/** On deck is a different moment from on the clock, and saying so costs nothing. */
function briefEyebrow() {
  var head = A.myNext <= A.cur
    ? "Claude · on the clock at pick " + A.myNext
    : "Claude · on deck for pick " + A.myNext;
  // Say how old the plan is. Until briefVoid() lands, a brief is re-asked on
  // exactly one condition — the player it named being drafted — so it can
  // outlive its own fallback and a run at the position it argued about and
  // still be on screen when the clock starts. It should not read as a fresh
  // decision while that is true.
  var at = briefWrittenAt[A.myNext];
  var age = at == null ? 0 : A.cur - at;
  return age > 0
    ? head + " · written " + age + " pick" + (age === 1 ? "" : "s") + " ago"
    : head;
}

function renderBrief() {
  var el = $("#brief");
  if (!claudeReady() || !claudeCfg.auto || !A.myNext) { el.innerHTML = ""; return; }

  var gap = A.myNext - A.cur;
  if (gap > (claudeCfg.lead || 2)) { el.innerHTML = ""; return; }

  var cached = briefCache[A.myNext];
  // One re-ask, and only across a gap long enough for the answer to arrive and
  // matter. On a three-pick gap two calls collide inside ninety seconds and the
  // second lands after the clock has started; the plan two picks old is better
  // than a spinner where a recommendation was.
  var gap = A.myNext - A.cur;
  var why = cached ? briefVoid(cached) : null;
  if (why && gap >= 8 && (briefTries[A.myNext] || 0) < 1) {
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
    briefWrittenAt[forPick] = A.cur;
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
render();
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
