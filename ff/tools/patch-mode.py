import io

p = "assets/app.js"
s = io.open(p, encoding="utf-8").read()


def sub(old, new):
    global s
    assert old in s, "NOT FOUND:\n" + old[:170]
    s = s.replace(old, new)


# ------------------------------------------------------------------ mode
sub("""function defaultLeague() {""",
"""/**
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

function defaultLeague() {""")

sub("""    teams: 12, slot: 11, rounds: 15,""",
    """    mode: "live",
    teams: 12, slot: 11, rounds: 15,""")

sub("""function openSetup() {""",
"""function renderModePicker() {
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

function openSetup() {""")

sub("""  buildScoringForm(); buildRosterForm(); buildKeeperList(); buildTeamNames();
  openModal("#setupModal");""",
    """  buildScoringForm(); buildRosterForm(); buildKeeperList(); buildTeamNames();
  renderModePicker();
  openModal("#setupModal");""")

# -------------------------------------------------- what the mode switches off
sub("""function renderTracker() {
  var el = $("#tracker"), total = S.league.teams * S.league.rounds;
  if (!S.draftStarted && !S.picks.length) { el.innerHTML = ""; return; }""",
"""function renderTracker() {
  var el = $("#tracker"), total = S.league.teams * S.league.rounds;
  if (!isLive()) { el.innerHTML = ""; return; }
  if (!S.draftStarted && !S.picks.length) { el.innerHTML = ""; return; }""")

sub("""  $("#btnStart").classList.toggle("hidden", !!S.draftStarted || S.picks.length > 0);""",
    """  $("#btnStart").classList.toggle("hidden", !isLive() || !!S.draftStarted || S.picks.length > 0);
  $("#btnLeague").classList.toggle("hidden", !isLive());""")

# Ticker drops the team columns when nobody else is being tracked.
sub("""  el.className = "ticker";
  el.innerHTML =
    seg("round", A.onClock.round + " of " + S.league.rounds) +
    '<span class="sep"></span>' +
    seg("on the clock", teamLabel(A.onClock.slot, true),
        A.onClock.slot === S.league.slot) +
    (onDeck ? seg("on deck", teamLabel(onDeck, true),
                  onDeck === S.league.slot) : "") +
    '<span class="sep"></span>' +""",
"""  el.className = "ticker";
  el.innerHTML =
    seg("round", A.onClock.round + " of " + S.league.rounds) +
    '<span class="sep"></span>' +
    (isLive()
      ? seg("on the clock", teamLabel(A.onClock.slot, true), A.onClock.slot === S.league.slot) +
        (onDeck ? seg("on deck", teamLabel(onDeck, true), onDeck === S.league.slot) : "")
      : seg("pick", String(A.cur))) +
    '<span class="sep"></span>' +""")

sub("""            return '<span class="rp"><span class="mono">' + pk.pick + "</span> " +
              (pk.unknown ? "<i>unknown</i>"
                : '<span class="pos pos-' + (pl.pos || "K") + '">' + (pl.pos || "") + "</span> " +
                  esc(pk.name)) + "</span>";""",
"""            return '<span class="rp"><span class="mono">' + pk.pick + "</span> " +
              (pk.unknown ? "<i>unknown</i>"
                : '<span class="pos pos-' + (pl.pos || "K") + '">' + (pl.pos || "") + "</span> " +
                  esc(pk.name)) + "</span>";""")

# Row buttons and placeholder stop naming a team nobody is tracking.
sub("""function onClockShort() {
  if (!A || !A.onClock) return "GONE";
  if (A.onClock.slot === S.league.slot) return "GONE";""",
"""function onClockShort() {
  if (!A || !A.onClock || !isLive()) return "GONE";
  if (A.onClock.slot === S.league.slot) return "GONE";""")

sub("""  $("#search").placeholder = A.cur > total
    ? "Draft complete"
    : onMe
      ? "Search \\u2014 Enter drafts to YOU (you're on the clock)"
      : "Search \\u2014 Enter puts him on " + teamLabel(A.onClock.slot) + ", Shift+Enter on yours";""",
"""  $("#search").placeholder = A.cur > total
    ? "Draft complete"
    : !isLive()
      ? "Search \\u2014 Enter marks him gone, Shift+Enter drafts him to you"
      : onMe
        ? "Search \\u2014 Enter drafts to YOU (you're on the clock)"
        : "Search \\u2014 Enter puts him on " + teamLabel(A.onClock.slot) + ", Shift+Enter on yours";""")

# The draft log: in solo there is no team to name.
sub("""      (p.mine ? "you" : "t" + p.slot) + " \\u00b7 " +""",
    """      (isLive() || p.mine ? teamLabel(p.slot, true) + " \\u00b7 " : "") +""")

sub("""  var who = t ? '<span class="sub">' + teamLabel(t.slot, true) + " \\u00b7 " + t.pick + "</span>" : "";""",
    """  var who = t ? '<span class="sub">' +
        (isLive() || t.mine ? teamLabel(t.slot, true) + " \\u00b7 " : "") + t.pick + "</span>" : "";""")

# Claude only hears about opponents when they are actually being tracked.
sub("""function teamsAhead() {
  if (!A.myNext) return [];""",
    """function teamsAhead() {
  if (!A.myNext || !isLive()) return [];""")

# The report grades the league in live mode and your own roster in solo.
sub("""  var mine = rows.find(function (r) { return r.slot === S.league.slot; });
  $("#reportSub").textContent = S.picks.length + " of " + total + " picks recorded" +
    (S.picks.length < total ? " — grades will move as the rest come in." : ".");""",
"""  var mine = rows.find(function (r) { return r.slot === S.league.slot; });
  $("#reportSub").textContent = S.picks.length + " of " + total + " picks recorded" +
    (S.picks.length < total ? " — grades will move as the rest come in." : ".");

  if (!isLive()) {
    // Nothing was tracked but this roster, so there is no league to rank against.
    // Grading it anyway would be inventing a field of twelve.
    var r2 = E.assignRoster(A.mine, S.league.rules);
    var starters = r2.slots.filter(function (x) { return x.player; });
    $("#reportBody").innerHTML =
      '<div class="note">You ran this in <b>board-only</b> mode, so no opponent rosters ' +
      "exist to rank against — there is no league table here, and inventing one would be " +
      "worse than leaving it out. What follows is your roster measured against replacement " +
      "level in your own scoring.</div>" +
      '<div class="mt"><table><tr><th>Slot</th><th>Player</th>' +
        "<th class='right'>Pts</th><th class='right'>Over repl.</th><th class='right'>Bye</th></tr>" +
      r2.slots.map(function (x) {
        return "<tr><td>" + x.pos + "</td><td>" +
          (x.player ? '<span class="pos pos-' + x.player.pos + '">' + x.player.pos + "</span> " +
            esc(x.player.name) : '<span class="dimtext">empty</span>') + "</td>" +
          '<td class="right num">' + (x.player ? n0(x.player.pts) : "\\u2014") + "</td>" +
          '<td class="right num">' + (x.player ? n0(x.player.vor) : "\\u2014") + "</td>" +
          '<td class="right num">' + (x.player ? x.player.bye : "\\u2014") + "</td></tr>";
      }).join("") +
      "<tr><td colspan='2'><b>Starting lineup</b></td>" +
        '<td class="right num"><b>' +
          n0(starters.reduce(function (a, x) { return a + x.player.pts; }, 0)) + "</b></td>" +
        "<td colspan='2'></td></tr>" +
      "</table></div>";
    return rows;
  }""")

sub("""var REPORT_SYSTEM =""",
    """var REPORT_SOLO_SYSTEM =
  "You are reading one fantasy manager's completed draft. Only their own roster was " +
  "tracked — there are no opponent rosters, so do NOT speculate about what rivals have or " +
  "invent a league context. The points were computed by a scoring engine using this " +
  "league's exact rules; trust them. Write three short paragraphs, no headings, no bullets, " +
  "under 220 words: what this roster actually is; its single biggest weakness and what it " +
  "will cost; and two concrete waiver or trade moves for the first fortnight. Be direct.";

var REPORT_SYSTEM =""")

sub("""    REPORT_SYSTEM, 1800)""",
    """    isLive() ? REPORT_SYSTEM : REPORT_SOLO_SYSTEM, 1800)""")

sub("""  var table = rows.map(function (r) {""",
    """  var table = !isLive() ? "(board-only mode \\u2014 no opponent rosters were tracked)"
    : rows.map(function (r) {""")

sub("""      (r.worstBye && r.worstBye.n >= 3 ? ", " + r.worstBye.n + " starters on the week " +
        r.worstBye.week + " bye" : "");
  }).join("\\n");""",
    """      (r.worstBye && r.worstBye.n >= 3 ? ", " + r.worstBye.n + " starters on the week " +
        r.worstBye.week + " bye" : "");
  }).join("\\n");""")

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("mode patched")
