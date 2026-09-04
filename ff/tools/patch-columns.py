# -*- coding: utf-8 -*-
import io

p = "assets/app.js"
s = io.open(p, encoding="utf-8").read()


def sub(old, new):
    global s
    assert old in s, "NOT FOUND:\n" + old[:170]
    s = s.replace(old, new)


# How many of his tier are still on the board — the number that decides waiting.
sub("""    p.takenBy = pickOf[p.name] || null;
  });""",
"""    p.takenBy = pickOf[p.name] || null;
  });

  var tierLeft = {};
  avail.forEach(function (p) {
    var k = p.pos + ":" + p.tier;
    tierLeft[k] = (tierLeft[k] || 0) + 1;
  });
  board.players.forEach(function (p) { p.tierLeft = tierLeft[p.pos + ":" + p.tier] || 0; });""")

sub("""function matches(p) {""",
"""/* ------------------------------------------------------------- columns
   Raw numbers make you do the interpreting. A percentage is a fact; "NOW" is a
   decision. Columns that can be read as a decision say so in words, and the
   numeric versions stay available for anyone who prefers them. */

var COLUMNS = {
  pts: {
    short: "PTS", label: "Projected points", w: "46px",
    desc: "Season points in YOUR scoring — bonuses, return yards and your D/ST tiers " +
          "included. The number every other column is derived from.",
    render: function (p) { return { v: n0(p.pts) }; }
  },
  posrank: {
    short: "RANK", label: "Rank at his position", w: "50px",
    desc: "RB5 means the fifth-best back left on this board in your scoring. Often several " +
          "places from where consensus has him, which is the whole point of the tool.",
    render: function (p) { return { v: p.pos + p.posRank, cls: "pos-" + p.pos }; }
  },
  tier: {
    short: "TIER", label: "Tier, and how many are left in it", w: "62px",
    desc: "Players grouped by scoring cliffs at their position. Inside a tier they are close " +
          "enough to be interchangeable, so the question stops being who is best and becomes " +
          "how many are left. The bracketed number is exactly that: at (1) he is the last of " +
          "his group and waiting means dropping a whole tier.",
    render: function (p) {
      var last = p.tierLeft <= 1;
      return { v: "T" + p.tier + " <small>(" + p.tierLeft + ")</small>",
               style: last ? "color:var(--amber);font-weight:700" : "" };
    }
  },
  wait: {
    short: "WAIT?", label: "Can you wait for him?", w: "62px",
    desc: "Reads his survival odds as a decision. WAIT means better than a 70% chance he is " +
          "still there at your next pick, so spend this one elsewhere. RISKY is a coin flip. " +
          "NOW means under 35% — if you want him it has to be this pick.",
    render: function (p) {
      var s2 = p.surv;
      if (s2 >= 0.7) return { v: "wait", style: "color:var(--green)" };
      if (s2 >= 0.35) return { v: "risky", style: "color:var(--amber)" };
      return { v: "NOW", style: "color:var(--red);font-weight:700" };
    }
  },
  survives: {
    short: "SURV", label: "Survival odds, as a percentage", w: "50px",
    desc: "The raw number behind WAIT? — the chance he is still on the board at your next " +
          "pick, from his own ADP standard deviation across ~7,800 mock drafts.",
    render: function (p) {
      var pct = Math.round(p.surv * 100);
      return { v: pct + "%",
               style: "color:" + (pct > 70 ? "var(--green)" : pct > 35 ? "var(--amber)" : "var(--red)") };
    }
  },
  value: {
    short: "VALUE", label: "Bargain or reach, right now", w: "62px",
    desc: "Compares his ADP with the pick on the clock, in rounds. FELL means the room has " +
          "let him slide at least most of a round past where he usually goes — that is the " +
          "free money. REACH means you would be taking him a round or more early. FAIR is " +
          "roughly on schedule.",
    render: function (p) {
      var rounds = p.adpDelta / (S.league.teams || 12);
      if (rounds <= -0.75) return { v: "fell " + Math.abs(rounds).toFixed(1), style: "color:var(--green);font-weight:700" };
      if (rounds >= 1) return { v: "reach " + rounds.toFixed(1), style: "color:var(--red)" };
      return { v: "fair", style: "color:var(--dim)" };
    }
  },
  vor: {
    short: "VOR", label: "Points over replacement", w: "48px",
    desc: "Points above a player you could have for nothing at that position. It is what " +
          "makes a tight end and a running back comparable — 250 points means very different " +
          "things at the two.",
    render: function (p) { return { v: n0(p.vor) }; }
  },
  adp: {
    short: "ADP", label: "Average draft position", w: "44px",
    desc: "Where the market takes him across ~7,800 mock drafts. Where he goes, not where " +
          "he should go.",
    render: function (p) { return { v: (p.adp || 0).toFixed(0), cls: "dimtext" }; }
  },
  delta: {
    short: "\\u0394", label: "Picks early or late (raw)", w: "44px",
    desc: "The raw number behind VALUE: his ADP minus the pick on the clock. Negative means " +
          "he is overdue.",
    render: function (p) {
      var d = p.adpDelta;
      return { v: (d > 0 ? "+" : "") + n0(d),
               style: "color:" + (d > 0 ? "var(--green)" : "var(--red)") };
    }
  },
  bye: {
    short: "BYE", label: "Bye week, and clashes", w: "38px",
    desc: "His bye week. Amber when another of your starters at that position is already out " +
          "that week; red when the position would have nobody left to start.",
    render: function (p) {
      var br = byeRisk(p);
      return { v: String(p.bye), cls: br ? "bye-" + br.level : "dimtext", title: br ? br.why : "" };
    }
  },
  vsstd: {
    short: "VS STD", label: "What your scoring does to him", w: "56px",
    desc: "Points your league's rules add or remove versus plain full PPR. This is the " +
          "arbitrage the whole tool exists for: a big positive number means the rest of your " +
          "league, drafting off consensus, is undervaluing him.",
    render: function (p) {
      var std = standardBoard()[p.name];
      if (!std) return { v: "\\u2014", cls: "dimtext" };
      var d = p.pts - std.pts;
      return { v: (d > 0 ? "+" : "") + n0(d),
               style: "color:" + (d > 20 ? "var(--green)" : d < -20 ? "var(--red)" : "var(--dim)") };
    }
  },
  risk: {
    short: "RISK", label: "Risk grade from the research layer", w: "44px",
    desc: "0-100 from the annotation layer, where high means the analysts flagged him: age, " +
          "injury history, a role that might not hold. Blank when nobody wrote him up.",
    render: function (p) {
      if (!p.risk) return { v: "\\u2014", cls: "dimtext" };
      return { v: String(p.risk),
               style: "color:" + (p.risk >= 70 ? "var(--red)" : p.risk >= 55 ? "var(--amber)" : "var(--dim)") };
    }
  },
  ceiling: {
    short: "CEIL", label: "Ceiling grade from the research layer", w: "44px",
    desc: "0-100 for upside. High means somebody has made a case he finishes far above his " +
          "price. Blank when nobody wrote him up.",
    render: function (p) {
      if (!p.ceiling) return { v: "\\u2014", cls: "dimtext" };
      return { v: String(p.ceiling),
               style: "color:" + (p.ceiling >= 85 ? "var(--green)" : "var(--muted)") };
    }
  }
};

var DEFAULT_COLS = ["pts", "bye", "tier", "wait"];

function activeCols() {
  var c = S.league.columns;
  if (!c || !c.length) return DEFAULT_COLS.slice();
  return c.filter(function (k) { return COLUMNS[k]; }).slice(0, 4);
}

function renderColumnHeads() {
  var cols = activeCols();
  var tpl = "22px minmax(0,1fr) " + cols.map(function (k) { return COLUMNS[k].w; }).join(" ");
  var head = $(".phead");
  head.style.gridTemplateColumns = tpl;
  head.innerHTML = '<span class="c-rank"></span><span>Player</span>' +
    cols.map(function (k) {
      var c = COLUMNS[k];
      var label = k === "wait" && A.myNext && A.myNext > A.cur ? "WAIT \\u2192" + A.myNext
                : k === "survives" && A.myNext && A.myNext > A.cur ? "\\u2192" + A.myNext
                : c.short;
      return '<span class="num" title="' + esc(c.label) + '">' + label + "</span>";
    }).join("");
  var st = document.getElementById("colStyle") || (function () {
    var e = document.createElement("style"); e.id = "colStyle";
    document.head.appendChild(e); return e;
  })();
  st.textContent = ".prow{grid-template-columns:" + tpl + " !important}";
}

function renderColumnPicker() {
  var cur = activeCols();
  $("#colBody").innerHTML =
    '<div class="note">Pick up to four. Every one says what it is for, not just what it is ' +
    "\\u2014 and this list is the explanation, so there is nothing to hover over on a " +
    "tablet.</div>" +
    '<div class="mt">' + Object.keys(COLUMNS).map(function (k) {
      var c = COLUMNS[k], on = cur.indexOf(k) >= 0;
      return '<label class="colopt' + (on ? " on" : "") + '">' +
        '<input type="checkbox" data-col="' + k + '"' + (on ? " checked" : "") + ">" +
        "<span><b>" + esc(c.label) + '</b> <span class="colshort">' + esc(c.short) + "</span>" +
        '<span class="coldesc">' + esc(c.desc) + "</span></span></label>";
    }).join("") + "</div>" +
    '<div class="mt"><button class="btn btn-ghost btn-sm" id="colReset">Back to the defaults</button>' +
    ' <span class="dimtext" id="colMsg"></span></div>';

  $$("#colBody input[data-col]").forEach(function (cb) {
    cb.onchange = function () {
      var picked = $$("#colBody input[data-col]").filter(function (x) { return x.checked; })
                     .map(function (x) { return x.dataset.col; });
      if (picked.length > 4) {
        cb.checked = false;
        $("#colMsg").textContent = "Four at a time — untick one first.";
        return;
      }
      $("#colMsg").textContent = "";
      S.league.columns = picked;
      save(); render(); renderColumnPicker();
    };
  });
  $("#colReset").onclick = function () {
    S.league.columns = DEFAULT_COLS.slice(); save(); render(); renderColumnPicker();
  };
}

$("#btnCols").addEventListener("click", function () { renderColumnPicker(); openModal("#colModal"); });
$("#colClose").addEventListener("click", function () { closeModal("#colModal"); });

function matches(p) {""")

# Row markup now builds from the chosen columns.
sub("""    '<span class="num">' + n0(p.pts) + est + "</span>" +
    '<span class="num dimtext c-bye ' + (br ? "bye-" + br.level : "dimtext") + '"' +
      (br ? ' title="' + esc(br.why) + '"' : "") + ">" + p.bye + "</span>" +
    '<span class="num c-vor">' + n0(p.vor) + "</span>" +
    '<span class="num dimtext">' + (p.adp || "").toFixed(0) + "</span>" +
    '<span class="num delta ' + (d > 0 ? "pos-val" : "neg-val") + '">' + (d > 0 ? "+" : "") + n0(d) + "</span>" +
    '<span class="num" style="color:' + survColor + '">' + (t ? "\\u2014" : surv + "%") + "</span>" +""",
"""    activeCols().map(function (k) {
      var c = COLUMNS[k].render(p);
      var extra = (k === "pts" ? est : "");
      return '<span class="num ' + (c.cls || "") + '"' +
        (c.style && !t ? ' style="' + c.style + '"' : "") +
        (c.title ? ' title="' + esc(c.title) + '"' : "") + ">" +
        (t && (k === "wait" || k === "survives" || k === "value") ? "\\u2014" : c.v) + extra + "</span>";
    }).join("") +""")

sub("""  renderFilters(); renderList();""",
    """  renderColumnHeads();
  renderFilters(); renderList();""")

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("columns patched")
