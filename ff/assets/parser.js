/* DRAFTLINE league-settings parser.
   Turns a copy-pasted league settings page into the §2.1 rules object.

   Written against a real Yahoo settings page, which has three traps a
   reasonable-looking parser walks straight into:

   1. Anything you have changed from Yahoo's default renders as THREE lines —
      the label, the literal words "Yahoo Default", then "<yours> <theirs>":

          Interceptions
          Yahoo Default
          -2 -1

      Skip lines without a number and you silently drop every setting that
      isn't stock, which is exactly the set that made you open this tool.

   2. The same label means different things in different sections.
      "Interception" is 2 in Defense/Special Teams and -2 in Offense;
      "Return Yards" and "Touchdown" appear in both. Rules are therefore scoped
      to the section heading they appear under.

   3. The label itself can contain a number: "Points Allowed 0 points" is worth
      25. Grabbing the first number on the line reads the tier as the value, so
      values are read from the text *after* the matched label, never before.

   Depending on how the page is copied, the "Yahoo Default" block arrives either
   as its own line or inline on the label's line. Both are handled. */
(function (root) {
  "use strict";

  var SECTIONS = [
    [/^offense\b/i, "offense"],
    [/^kickers?\b/i, "kicking"],
    [/^defense\s*\/\s*special\s*teams\b/i, "dst"],
    [/^(setting|league id)/i, "general"]
  ];

  // Order matters: first match wins, so the specific rule must precede the
  // general one it would otherwise be swallowed by.
  var RULES = [
    // ---- offense -------------------------------------------------------
    ["offense", /40\+?\s*yard\s*completions?/i,                 ["passing", "comp40plus"]],
    ["offense", /40\+?\s*yard\s*passing\s*touchdowns?/i,        ["passing", "td40plus"]],
    ["offense", /40\+?\s*yard\s*rushing\s*touchdowns?/i,        ["rushing", "td40plus"]],
    ["offense", /40\+?\s*yard\s*runs?/i,                        ["rushing", "run40plus"]],
    ["offense", /40\+?\s*yard\s*receiving\s*touchdowns?/i,      ["receiving", "td40plus"]],
    ["offense", /40\+?\s*yard\s*receptions?/i,                  ["receiving", "rec40plus"]],
    ["offense", /passing\s*yards?/i,                            ["passing", "yardsPerPoint"]],
    ["offense", /passing\s*touchdowns?/i,                       ["passing", "td"]],
    ["offense", /interceptions?/i,                              ["passing", "int"]],
    ["offense", /rushing\s*yards?/i,                            ["rushing", "yardsPerPoint"]],
    ["offense", /rushing\s*touchdowns?/i,                       ["rushing", "td"]],
    ["offense", /receptions?/i,                                 ["receiving", "perReception"]],
    ["offense", /receiving\s*yards?/i,                          ["receiving", "yardsPerPoint"]],
    ["offense", /receiving\s*touchdowns?/i,                     ["receiving", "td"]],
    ["offense", /offensive\s*fumble\s*return\s*(td|touchdown)/i, ["misc", "offFumbleRetTd"]],
    ["offense", /return\s*yards?/i,                             ["misc", "returnYardsPerPoint"]],
    ["offense", /return\s*touchdowns?/i,                        ["misc", "returnTd"]],
    ["offense", /2[-\s]?point\s*conversions?|two[-\s]?point/i,  ["passing", "twoPt"]],
    ["offense", /fumbles?\s*lost/i,                             ["misc", "fumbleLost"]],

    // ---- kickers -------------------------------------------------------
    ["kicking", /field\s*goals?\s*missed\s*0\s*[-–]\s*19/i,     ["kicking", "miss0_19"]],
    ["kicking", /field\s*goals?\s*missed\s*20\s*[-–]\s*29/i,    ["kicking", "miss20_29"]],
    ["kicking", /field\s*goals?\s*missed\s*30\s*[-–]\s*39/i,    ["kicking", "miss30_39"]],
    ["kicking", /field\s*goals?\s*missed\s*40\s*[-–]\s*49/i,    ["kicking", "miss40_49"]],
    ["kicking", /field\s*goals?\s*missed\s*50\+/i,              ["kicking", "miss50plus"]],
    ["kicking", /field\s*goals?\s*0\s*[-–]\s*19/i,              ["kicking", "fg0_19"]],
    ["kicking", /field\s*goals?\s*20\s*[-–]\s*29/i,             ["kicking", "fg20_29"]],
    ["kicking", /field\s*goals?\s*30\s*[-–]\s*39/i,             ["kicking", "fg30_39"]],
    ["kicking", /field\s*goals?\s*40\s*[-–]\s*49/i,             ["kicking", "fg40_49"]],
    ["kicking", /field\s*goals?\s*50\+/i,                       ["kicking", "fg50plus"]],
    ["kicking", /point\s*after\s*attempt\s*missed|missed\s*(extra\s*point|point\s*after)/i,
                                                                ["kicking", "patMiss"]],
    ["kicking", /point\s*after|extra\s*point/i,                 ["kicking", "pat"]],

    // ---- defense / special teams ---------------------------------------
    ["dst", /points?\s*allowed\s*0\s*points?/i,                 ["dst", "pa0"]],
    ["dst", /points?\s*allowed\s*1\s*[-–]\s*6/i,                ["dst", "pa1_6"]],
    ["dst", /points?\s*allowed\s*7\s*[-–]\s*13/i,               ["dst", "pa7_13"]],
    ["dst", /points?\s*allowed\s*14\s*[-–]\s*20/i,              ["dst", "pa14_20"]],
    ["dst", /points?\s*allowed\s*21\s*[-–]\s*27/i,              ["dst", "pa21_27"]],
    ["dst", /points?\s*allowed\s*28\s*[-–]\s*34/i,              ["dst", "pa28_34"]],
    ["dst", /points?\s*allowed\s*35\+/i,                        ["dst", "pa35plus"]],
    ["dst", /extra\s*point\s*returned/i,                        ["dst", "extraPointReturned"]],
    ["dst", /(kickoff|punt).*return\s*touchdowns?|return\s*touchdowns?/i, ["dst", "returnTd"]],
    ["dst", /return\s*yards?/i,                                 ["dst", "returnYardsPerPoint"]],
    ["dst", /sacks?/i,                                          ["dst", "sack"]],
    ["dst", /interceptions?/i,                                  ["dst", "int"]],
    ["dst", /fumble\s*recover/i,                                ["dst", "fumRec"]],
    ["dst", /safet(y|ies)/i,                                    ["dst", "safety"]],
    ["dst", /block(ed)?\s*kick/i,                               ["dst", "blockKick"]],
    ["dst", /touchdowns?/i,                                     ["dst", "td"]]
  ];

  var NUM = /-?\d+(?:\.\d+)?/;
  var ONLY_NUMBERS = /^[-\d.\s\t]+$/;

  var ROSTER_MAP = {
    "W/R/T": "FLEX", "W/R": "FLEX", "W/T": "FLEX", "Q/W/R/T": "SUPERFLEX",
    "WRT": "FLEX", "FLEX": "FLEX", "D/ST": "DEF", "DST": "DEF", "DEF": "DEF",
    "BN": "BN", "BE": "BN", "IR": "IR"
  };

  function parse(text) {
    var raw = String(text || "").split(/\r?\n/);

    // Strip Yahoo's "Yahoo Default" marker wherever it lands — its own line in
    // some copies, inline in others — then drop lines it emptied.
    var lines = [];
    raw.forEach(function (l) {
      var s = l.replace(/yahoo\s+default(\s+value)?/gi, " ").replace(/\s+/g, " ").trim();
      if (s) lines.push(s);
    });

    var section = "general", hits = [], missed = [];
    var draft = { roster: null, teams: null };
    var out = {};

    function set(path, value) {
      out[path[0]] = out[path[0]] || {};
      out[path[0]][path[1]] = value;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      var sec = SECTIONS.find(function (s) { return s[0].test(line); });
      if (sec) { section = sec[1]; continue; }

      // ---- league shape, which lives above the scoring tables -----------
      if (/roster\s*positions/i.test(line)) {
        var counts = {};
        line.split(/[:,]/).slice(1).join(",").split(/[,\s]+/).forEach(function (tok) {
          tok = tok.trim().toUpperCase().replace(/[^A-Z/]/g, "");
          if (!tok) return;
          var key = ROSTER_MAP[tok] || tok;
          if (["QB","RB","WR","TE","FLEX","SUPERFLEX","K","DEF","BN","IR"].indexOf(key) >= 0)
            counts[key] = (counts[key] || 0) + 1;
        });
        if (Object.keys(counts).length) {
          draft.roster = counts;
          hits.push(["Roster positions", JSON.stringify(counts)]);
        }
        continue;
      }
      if (/^max(imum)?\s*teams/i.test(line)) {
        var t = line.match(/\d+/);
        if (t) { draft.teams = +t[0]; hits.push(["Teams", draft.teams]); }
        continue;
      }
      if (/^fractional\s*points/i.test(line)) {
        draft.fractional = /\b(yes|true|on)\b/i.test(line.replace(/^[^:]*:?/, ""));
        hits.push(["Fractional points", draft.fractional ? "yes" : "no"]);
        continue;
      }
      if (/^playoffs?\b/i.test(line)) {
        var wk = [], seen = {};
        (line.match(/\d+/g) || []).map(Number).forEach(function (w) {
          if (w >= 10 && w <= 22 && !seen[w]) { seen[w] = 1; wk.push(w); }
        });
        if (wk.length) { draft.playoffWeeks = wk; hits.push(["Playoff weeks", wk.join(", ")]); }
        continue;
      }
      if (/^max(imum)?\s*acquisitions\s*per\s*week/i.test(line)) {
        var a = line.match(/\d+/);
        if (a) { draft.maxAcqPerWeek = +a[0]; hits.push(["Acquisitions per week", +a[0]]); }
        continue;
      }
      // Everything else above the scoring tables is league admin we don't score.
      if (section === "general") continue;

      // ---- a scoring row ------------------------------------------------
      var rule = null, m = null;
      for (var r = 0; r < RULES.length; r++) {
        if (RULES[r][0] !== section) continue;
        var hit = line.match(RULES[r][1]);
        if (hit) { rule = RULES[r]; m = hit; break; }
      }
      if (!rule) { missed.push(line.slice(0, 70)); continue; }

      // The value is whatever follows the label. Reading from the start of the
      // line would turn "Points Allowed 0 points ... 25" into a 0.
      var after = line.slice(m.index + m[0].length);
      var numMatch = after.match(NUM);

      // Changed-from-default rows put the numbers on the following line.
      if (!numMatch && i + 1 < lines.length && ONLY_NUMBERS.test(lines[i + 1])) {
        numMatch = lines[i + 1].match(NUM);
        after = lines[i + 1];
        i++;
      }
      if (!numMatch) { missed.push(line.slice(0, 70)); continue; }

      var value = parseFloat(numMatch[0]);
      set(rule[2], value);
      hits.push([line.replace(/\s+\S*\d.*$/, "").trim() || line, value, rule[2]]);

      // "25 yards per point; 1 points at 400 yards; 2 points at 500 yards"
      if (rule[2][1] === "yardsPerPoint") {
        [[400, "bonus400"], [500, "bonus500"], [150, "bonus150"], [200, "bonus200"]]
          .forEach(function (b) {
            var bm = after.match(new RegExp("(-?\\d+(?:\\.\\d+)?)\\s*points?\\s*at\\s*" + b[0], "i"));
            if (bm) {
              set([rule[2][0], b[1]], parseFloat(bm[1]));
              hits.push(["  bonus at " + b[0], parseFloat(bm[1]), [rule[2][0], b[1]]]);
            }
          });
      }
    }

    return {
      hits: hits, missed: missed, draft: draft, scoring: out,
      confidence: hits.length / Math.max(1, hits.length + missed.length)
    };
  }

  root.DRAFTLINE_PARSER = { parse: parse, RULES: RULES };
  if (typeof module !== "undefined") module.exports = root.DRAFTLINE_PARSER;
})(globalThis);
