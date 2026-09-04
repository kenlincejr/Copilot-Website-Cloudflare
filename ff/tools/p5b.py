# -*- coding: utf-8 -*-
import io

p = "assets/app.js"
s = io.open(p, encoding="utf-8").read()


def sub(old, new):
    global s
    assert old in s, "NOT FOUND:\n" + old[:170]
    s = s.replace(old, new)


sub("  renderStatus(); renderTicker();", "  renderStatus();")

sub("""$("#btnStyle").addEventListener("click", function () {""",
"""/* ------------------------------------------------------------- app bar */

$("#btnRosters").addEventListener("click", function () { $("#btnLeague").click(); });

// The visible bar carries identity and actions; everything situational lives in
// the tracker or the status strip now. Secondary actions go behind one menu so
// the bar does not overflow on a tablet.
(function moreMenu() {
  var TARGETS = { report: "#btnReport", style: "#btnStyle", cols: "#btnCols",
                  setup: "#btnSetup", data: "#btnData", out: "#btnOut" };
  var wrap = $("#moreMenu"), btn = $("#btnMore");
  function close() { wrap.classList.add("hidden"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var nowHidden = wrap.classList.toggle("hidden");
    btn.setAttribute("aria-expanded", nowHidden ? "false" : "true");
  });
  document.addEventListener("click", close);
  wrap.addEventListener("click", function (e) { e.stopPropagation(); });
  $$("#moreMenu button[data-more]").forEach(function (b) {
    b.onclick = function () { close(); var t = TARGETS[b.dataset.more]; if (t) $(t).click(); };
  });
})();

$("#btnStyle").addEventListener("click", function () {""")

sub("""  var gap = A.myNext ? A.myNext - A.cur : null;
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
}""",
"""  var gap = A.myNext ? A.myNext - A.cur : null;
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
}""")

sub("""function tickClock() {
  var out = $("#clockRead"), secs = pickSeconds();
  if (S.paused) { out.innerHTML = '<b style="color:var(--amber)">paused</b>'; return; }
  if (!secs || !A || !S.pickStartedAt) { out.textContent = ""; return; }""",
"""function tickClock() {
  var out = $("#sbClock"), secs = pickSeconds();
  if (!out) return;
  if (S.paused) { out.innerHTML = '<b class="amber">paused</b>'; return; }
  if (!secs || !A || !S.pickStartedAt) { out.textContent = ""; return; }""")

sub("""  if (gap === 0) {
    out.innerHTML = '<b style="color:' + (left < 30 ? "var(--red)" : "var(--teal)") + '">' +
      mmss(left) + "</b>";
  } else if (gap) {
    // Time left on this pick, plus a full clock for each pick between.
    var eta = Math.max(0, left) + (gap - 1) * secs;
    out.innerHTML = '<span class="dimtext">you’re up in ~</span> <b>' + mmss(eta) + "</b>";
  } else {
    out.textContent = "";
  }""",
"""  if (gap === 0) {
    out.innerHTML = '<b class="' + (left < 30 ? "red" : "") + '">' + mmss(left) + "</b>" +
      '<span class="sb-lbl">left on this pick</span>';
  } else if (gap) {
    // Time left on this pick, plus a full clock for each pick between.
    var eta = Math.max(0, left) + (gap - 1) * secs;
    out.innerHTML = "<b>" + mmss(eta) + '</b><span class="sb-lbl">until you’re up</span>';
  } else {
    out.textContent = "";
  }""")

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("bar/status patched")
