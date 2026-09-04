# -*- coding: utf-8 -*-
import io

p = "assets/app.js"
s = io.open(p, encoding="utf-8").read()


def sub(old, new):
    global s
    assert old in s, "NOT FOUND:\n" + old[:170]
    s = s.replace(old, new)


# The two orphaned inputs move into the tracker, where their context is, and get
# inputmode="numeric" so iOS opens a number pad rather than a full keyboard.
sub("""      '<div class="tk-entry">' +
        '<input type="text" id="tkWho" list="availList" autocomplete="off" ' +
          'autocorrect="off" autocapitalize="off" spellcheck="false" ' +
          'data-1p-ignore data-lpignore="true" ' +
          'placeholder="Who just went at pick ' + A.cur + '? — goes to ' +
          esc(teamLabel(A.onClock.slot)) + '">' +
        '<button class="btn btn-sm" id="tkRec">Record</button>' +
        '<button class="btn btn-sm btn-ghost" id="tkUnknown" ' +
          'title="The pick happened but you did not catch the name">Didn’t catch it</button>' +
      "</div>" +""",
"""      '<div class="tk-entry">' +
        '<input type="text" id="tkWho" autocomplete="off" enterkeyhint="done" ' +
          'autocorrect="off" autocapitalize="words" spellcheck="false" ' +
          'data-1p-ignore data-lpignore="true" ' +
          'placeholder="Who just went at pick ' + A.cur + '? — goes to ' +
          esc(teamLabel(A.onClock.slot)) + '">' +
        '<button class="btn btn-sm" id="tkRec">Record</button>' +
      "</div>" +
      '<div id="tkSuggest" class="tk-suggest hidden"></div>' +
      '<div class="tk-mini">' +
        '<button class="btn btn-sm btn-ghost" id="tkUnknown">Didn’t catch the name</button>' +
        '<span class="tk-field"><label for="tkLive">live pick</label>' +
          '<input type="number" id="tkLive" inputmode="numeric" pattern="[0-9]*" min="1" ' +
            'autocomplete="off" placeholder="' + A.cur + '" value="' +
            esc($("#livePick").value) + '"></span>' +
        '<span class="tk-field"><label for="tkSecs">clock (s)</label>' +
          '<input type="number" id="tkSecs" inputmode="numeric" pattern="[0-9]*" min="10" ' +
            'max="600" step="5" autocomplete="off" placeholder="120" value="' +
            esc($("#pickSecs").value) + '"></span>' +
      "</div>" +""")

# Wire the moved inputs back to the originals the rest of the app reads.
sub("""  $("#tkPause").onclick = togglePause;""",
"""  var live = $("#tkLive");
  live.addEventListener("input", function () {
    $("#livePick").value = live.value;
    renderStatus();
    renderTracker();
    var again = $("#tkLive");
    if (again && again !== live) { again.focus(); again.setSelectionRange(999, 999); }
  });
  var secsIn = $("#tkSecs");
  secsIn.addEventListener("input", function () {
    $("#pickSecs").value = secsIn.value;
    S.league.pickSeconds = pickSeconds();
    if (!S.pickStartedAt) S.pickStartedAt = Date.now();
    save(); tickClock();
  });

  $("#tkPause").onclick = togglePause;""")

# A tap-friendly suggestion list. <datalist> is unreliable on iOS Safari and
# invisible on touch until you type exactly the right thing; this is a plain list
# of buttons that records on tap.
sub("""  var who = $("#tkWho");
  var commit = function () {""",
"""  var who = $("#tkWho");
  var sugg = $("#tkSuggest");

  function matchesFor(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) return [];
    return A.avail.filter(function (pl) {
      return pl.name.toLowerCase().indexOf(q) >= 0 ||
             (pl.team || "").toLowerCase() === q;
    }).slice(0, 6);
  }
  function paintSuggestions() {
    var hits = matchesFor(who.value);
    if (!hits.length) { sugg.classList.add("hidden"); sugg.innerHTML = ""; return; }
    sugg.classList.remove("hidden");
    sugg.innerHTML = hits.map(function (pl) {
      return '<button type="button" data-pick="' + esc(pl.name) + '">' +
        '<span class="pos pos-' + pl.pos + '">' + pl.pos + "</span>" +
        "<span>" + esc(pl.name) + '</span><span class="dimtext">' + pl.team +
        " · " + n0(pl.pts) + "</span></button>";
    }).join("");
    $$("#tkSuggest button").forEach(function (b) {
      b.onclick = function () { who.value = ""; sugg.classList.add("hidden"); record(b.dataset.pick, false); };
    });
  }
  who.addEventListener("input", paintSuggestions);

  var commit = function () {""")

sub("""    who.value = "";
    record(nm, false);
  };""",
"""    who.value = "";
    sugg.classList.add("hidden");
    record(nm, false);
  };""")

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("tracker inputs patched")
