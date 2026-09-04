# -*- coding: utf-8 -*-
import io

p = "assets/app.js"
s = io.open(p, encoding="utf-8").read()


def sub(old, new):
    global s
    assert old in s, "NOT FOUND:\n" + old[:170]
    s = s.replace(old, new)


# ---------------------------------------------------- clearer row buttons
sub("""           '<button data-act="gone" title="Goes to ' + esc(onClockLabel()) + '">' +
             esc(onClockShort()) + "</button>" +
           '<button class="mine" data-act="mine" title="I drafted him">MINE</button>' +""",
"""           '<button data-act="gone" title="' + esc(onClockLabel()) +
             ' took him \\u2014 off the board">' + esc(onClockShort()) + "</button>" +
           '<button class="mine" data-act="mine" title="I took him \\u2014 onto my roster">' +
             "TO ME</button>" +""")

# A legend, said once, rather than two initialisms nobody can decode.
sub("""  $("#survHead").textContent = A.myNext && A.myNext > A.cur ? "\\u2192" + A.myNext : "Survives";""",
"""  $("#survHead").textContent = A.myNext && A.myNext > A.cur ? "\\u2192" + A.myNext : "Survives";

  var lg = $("#rowLegend");
  if (lg) {
    lg.innerHTML = A.cur > S.league.teams * S.league.rounds ? ""
      : "Each row: <b>" + esc(onClockShort()) + "</b> = " + esc(onClockLabel()) +
        " took him \\u00b7 <b>TO ME</b> = he's on your roster";
  }""")

# --------------------------------------------------- pause / resume / end
sub("""function tickClock() {
  var out = $("#clockRead"), secs = pickSeconds();
  if (!secs || !A || !S.pickStartedAt) { out.textContent = ""; return; }""",
"""function tickClock() {
  var out = $("#clockRead"), secs = pickSeconds();
  if (S.paused) { out.innerHTML = '<b style="color:var(--amber)">paused</b>'; return; }
  if (!secs || !A || !S.pickStartedAt) { out.textContent = ""; return; }""")

sub("""$("#pickSecs").addEventListener("input", function () {""",
"""/** Pausing stops the clock only; the board and every pick stay exactly as they are. */
function togglePause() {
  if (S.paused) {
    // Give back the time that elapsed while paused, so the countdown resumes
    // where it stopped rather than jumping.
    if (S.pausedAt && S.pickStartedAt) S.pickStartedAt += Date.now() - S.pausedAt;
    S.paused = false; S.pausedAt = null;
  } else {
    S.paused = true; S.pausedAt = Date.now();
  }
  save(); render(); tickClock();
}

$("#pickSecs").addEventListener("input", function () {""")

sub("""      draftStarted: S.draftStarted, startedAt: S.startedAt, pickStartedAt: S.pickStartedAt""",
    """      draftStarted: S.draftStarted, startedAt: S.startedAt, pickStartedAt: S.pickStartedAt,
      paused: S.paused, pausedAt: S.pausedAt, draftEnded: S.draftEnded, simulated: S.simulated""")

# ------------------------------------------------------------- simulation
sub("""/* ------------------------------------------------------- league rosters */""",
"""/**
 * Fills in opponent picks so the flow can be practised before it matters. Takes
 * roughly the best available by ADP with a little noise, which is close enough to
 * how a room actually drafts to be worth rehearsing against. Everything it
 * records is a normal pick — undo works, and Reset draft in League clears it.
 */
function simulateToMyPick() {
  if (!A.myNext) return;
  var target = A.myNext, taken = draftedNames(), added = 0;
  var pool = A.avail.slice().sort(function (a, b) { return a.adp - b.adp; });
  var guard = 0;
  while (currentPick() < target && guard++ < 80) {
    var choices = pool.filter(function (p) { return !taken[p.name]; }).slice(0, 3);
    if (!choices.length) break;
    var chosen = choices[Math.floor(Math.random() * choices.length)];
    taken[chosen.name] = true;
    record(chosen.name, false, true);
    added++;
  }
  S.simulated = true;
  S.pickStartedAt = Date.now();
  save(); render();
  banner("Simulated " + added + " opponent pick" + (added === 1 ? "" : "s") +
    " up to pick " + target + ". These are guesses from ADP, not real picks \\u2014 " +
    "use Reset draft in League before the real thing.", true);
}

/* ------------------------------------------------------- league rosters */""")

# ------------------------------------------- tracker gets the new controls
sub("""  if (A.cur > total) {
    el.innerHTML = '<div class="tracker done"><div class="tk-head"><b>Draft complete</b>' +
      '<span class="dimtext">' + total + " picks</span></div>" +
      '<div class="dimtext" style="font-size:12.5px">Open Report for grades and a read on ' +
      "every roster.</div></div>";
    return;
  }""",
"""  if (A.cur > total || S.draftEnded) {
    el.innerHTML = '<div class="tracker done"><div class="tk-head"><b>' +
      (S.draftEnded && A.cur <= total ? "Draft stopped" : "Draft complete") + "</b>" +
      '<span class="dimtext">' + S.picks.length + " picks</span></div>" +
      '<div class="dimtext" style="font-size:12.5px;margin-bottom:9px">' +
        (S.draftEnded && A.cur <= total
          ? "Nothing has been lost \\u2014 every pick is still recorded."
          : "Open Report for grades and a read on every roster.") + "</div>" +
      '<div class="tk-entry">' +
        (S.draftEnded && A.cur <= total
          ? '<button class="btn btn-sm btn-primary" id="tkResume">Resume draft</button>' : "") +
        '<button class="btn btn-sm" id="tkReport">Open report</button>' +
      "</div></div>";
    if ($("#tkResume")) $("#tkResume").onclick = function () {
      S.draftEnded = false; S.pickStartedAt = Date.now(); save(); render();
    };
    $("#tkReport").onclick = function () { $("#btnReport").click(); };
    return;
  }""")

sub("""      '<div class="tk-head">' +
        "<b>" + (onMe ? "You're on the clock" : "Round " + A.onClock.round + " \\u00b7 pick " + A.cur) + "</b>" +
        '<span class="dimtext">' + S.picks.length + " of " + total + " recorded</span>" +
      "</div>" +""",
"""      '<div class="tk-head">' +
        "<b>" + (S.paused ? "Paused" :
          onMe ? "You're on the clock" : "Round " + A.onClock.round + " \\u00b7 pick " + A.cur) + "</b>" +
        '<span class="tk-ctl">' +
          '<button class="btn btn-sm btn-ghost" id="tkPause">' +
            (S.paused ? "Resume" : "Pause") + "</button>" +
          '<button class="btn btn-sm btn-ghost" id="tkSim" title="Fill in opponent picks so you ' +
            'can practise the flow">Simulate</button>' +
          '<button class="btn btn-sm btn-ghost btn-danger" id="tkStop">Stop</button>' +
        "</span>" +
      "</div>" +
      '<div class="tk-count dimtext">' + S.picks.length + " of " + total + " recorded" +
        (S.simulated ? " \\u00b7 <span style=\\"color:var(--amber)\\">includes simulated picks</span>" : "") +
      "</div>" +""")

sub("""  $("#tkRec").onclick = commit;""",
"""  $("#tkPause").onclick = togglePause;
  $("#tkSim").onclick = simulateToMyPick;
  $("#tkStop").onclick = function () {
    if (!confirm("Stop the draft tracker? Every pick is kept and you can resume.")) return;
    S.draftEnded = true; S.paused = false; save(); render();
  };
  $("#tkRec").onclick = commit;""")

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("controls patched")
