/* DRAFTLINE scoring-impact analysis.

   What it answers: "my league's scoring is not the scoring ADP was built on —
   so what actually changes about how I should draft?"

   Everything the board does downstream of scoring — VOR, tiers, the composite,
   the recommendation — reads customPoints() and nothing else. So the honest way
   to answer that question is not to write down opinions about PPR and six-point
   passing touchdowns, it is to *build the board twice* and measure the
   difference. That is all this file does. Every sentence it emits is a
   measurement, and the measurement is shown beside it.

   Three comparisons, kept separate on purpose, because conflating them produces
   nonsense in exactly the leagues that most need the answer — a 14-team
   superflex league would otherwise report its superflex slot as a scoring
   effect:

     scoring   league scoring against the baseline's, roster and team count held
               at the league's own. Isolates what the numbers do.
     shape     league roster and team count against a plain 12-team lineup,
               scoring held at the league's own. Isolates what the lineup does.
     knobs     one rule at a time reverted to the baseline, everything else left
               at the league's values, so each rule's contribution is measured
               rather than attributed. A rule that moves nobody says so.

   The baseline is full PPR with standard everything else — the ppr_standard
   preset — because that is the scoring the consensus ADP this board ships with
   was actually drafted under. It is the same baseline the VS STD column uses,
   so the two can never disagree.

   Ranks are compared over the *draftable* pool (teams x rounds), not the whole
   267-player file. A rule that reorders players 240 and 250 has changed nothing
   about anyone's draft, and counting it as churn would drown out the rules that
   did. */
(function (root) {
  "use strict";

  var GROUPS = [["passing", "Passing"], ["rushing", "Rushing"], ["receiving", "Receiving"],
                ["misc", "Miscellaneous"], ["kicking", "Kicking"],
                ["dst", "Defense / special teams"]];

  /* The one label map. app.js's scoring form reads it from here rather than
     keeping a second copy, because a scoring key named two different things in
     two places is a bug waiting to be filed as a typo. */
  var LABELS = {
    yardsPerPoint: "Yards per point", td: "Touchdown", int: "Interception",
    twoPt: "2-pt conversion",
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

  /* What customPoints() reads when a key is absent. Only the three
     yards-per-point divisors have a non-zero fallback; every other term is
     written `(x || 0)`, so a missing key is genuinely worth nothing. Getting
     this wrong would report "Passing yards per point: 25 to not set" as a rule
     change when nothing had changed at all. */
  var DEFAULTS = {
    "passing.yardsPerPoint": 25, "rushing.yardsPerPoint": 10, "receiving.yardsPerPoint": 10
  };

  var POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];
  var SEASON_WEEKS = 17;

  /* A plain lineup to measure roster shape against: one of each, two backs and
     two receivers, one flex, twelve teams. Not an opinion about how a league
     should be built — just the shape the consensus board assumes when it ranks
     a quarterback below six receivers. */
  var BASE_SHAPE = { teams: 12,
    roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BN: 6, IR: 1,
              flexEligible: ["RB", "WR", "TE"] } };

  function engine() { return root.DRAFTLINE_ENGINE; }

  /** The value customPoints() would actually use for one scoring key. */
  function value(rules, grp, key) {
    var g = rules[grp];
    var v = g ? g[key] : undefined;
    if (v === undefined || v === null || v === "") {
      var d = DEFAULTS[grp + "." + key];
      return d === undefined ? 0 : d;
    }
    return +v;
  }

  /** A copy of `rules` with one scoring key set — or removed, for `undefined`. */
  function withKnob(rules, grp, key, v) {
    var out = {}, k;
    for (k in rules) out[k] = rules[k];
    var g = {}, src = rules[grp] || {};
    for (k in src) g[k] = src[k];
    if (v === undefined) delete g[key]; else g[key] = v;
    out[grp] = g;
    return out;
  }

  /** A copy of `rules` carrying another object's scoring but this league's shape. */
  function withScoring(rules, scoring) {
    var out = {}, k;
    for (k in rules) out[k] = rules[k];
    GROUPS.forEach(function (g) { out[g[0]] = scoring[g[0]] || {}; });
    // Fractional rounding is a scoring rule, not league admin: a league that
    // rounds every score to a whole number really does compress the board.
    out.fractional = scoring.fractional;
    return out;
  }

  /** A copy of `rules` carrying another object's lineup but this league's scoring. */
  function withShape(rules, shape) {
    var out = {}, k;
    for (k in rules) out[k] = rules[k];
    out.roster = shape.roster;
    out.teams = shape.teams;
    return out;
  }

  function board(players, rules) { return engine().buildBoard(players, rules); }

  function ranksOf(b) {
    var m = {};
    b.players.forEach(function (p) { m[p.name] = p.vorRank; });
    return m;
  }
  function ptsOf(b) {
    var m = {};
    b.players.forEach(function (p) { m[p.name] = p.pts; });
    return m;
  }

  /**
   * Rank churn between two boards, over the players either board puts inside
   * the draftable pool. The union, not one board's top N: a player this scoring
   * lifts into the draft is exactly as much news as one it drops out of it.
   *
   * `delta` is positive when the league board likes him better than the board
   * being compared against — the direction a reader expects from an up arrow.
   */
  function churn(a, b, poolN, byName) {
    var ra = ranksOf(a), rb = ranksOf(b), seen = {}, names = [];
    function collect(bd) {
      bd.players.slice(0, poolN).forEach(function (p) {
        if (!seen[p.name]) { seen[p.name] = 1; names.push(p.name); }
      });
    }
    collect(a); collect(b);

    var moves = [], sum = 0, byPos = {}, posCount = {};
    names.forEach(function (n) {
      var from = rb[n], to = ra[n];
      if (from === undefined || to === undefined) return;
      var delta = from - to;
      sum += Math.abs(delta);
      var pos = (byName[n] || {}).pos || "?";
      byPos[pos] = (byPos[pos] || 0) + Math.abs(delta);
      posCount[pos] = (posCount[pos] || 0) + 1;
      moves.push({ name: n, pos: pos, from: from, to: to, delta: delta });
    });
    moves.sort(function (x, y) { return Math.abs(y.delta) - Math.abs(x.delta); });

    /* Which position moved most, per player rather than in total. Summed
       movement always names WR, because there are more receivers in a draftable
       pool than anything else — it reports the shape of the player file rather
       than the shape of the league, and it named WR for a change that was
       entirely about quarterbacks. */
    var topPos = null, topPosMove = 0, posAvg = {};
    Object.keys(byPos).forEach(function (p) {
      posAvg[p] = byPos[p] / posCount[p];
      if (posCount[p] >= 3 && posAvg[p] > topPosMove) { topPosMove = posAvg[p]; topPos = p; }
    });

    return {
      counted: names.length,
      total: sum,
      avgMove: names.length ? sum / names.length : 0,
      maxMove: moves.length ? Math.abs(moves[0].delta) : 0,
      byPos: byPos, posCount: posCount, posAvg: posAvg, topPos: topPos,
      moves: moves,
      up: moves.filter(function (m) { return m.delta > 0; })
               .sort(function (x, y) { return y.delta - x.delta; }),
      down: moves.filter(function (m) { return m.delta < 0; })
                 .sort(function (x, y) { return x.delta - y.delta; })
    };
  }

  /**
   * What a position is worth, on one board.
   *
   *   starters     how many of them the league starts, flex share included —
   *                the replacement rank the engine itself uses.
   *   edge         points from the best player at the position down to that
   *                replacement level. This is the number that decides when a
   *                position is worth reaching for: a position whose best player
   *                is barely better than its twelfth is a position you can wait
   *                on, whatever his projected total says.
   *   bestRank     where the position's best player sits in the overall board
   *                order, and the round that lands in. This is the scarcity
   *                number a drafter can act on — "the best QB is the 14th
   *                player on this board" is a round-one instruction.
   *   inPool       how many of the position are inside the draftable pool.
   *
   * Deliberately not here: where the *last* starter at a position sits. It
   * looks like the natural companion to bestRank and it is worthless, because
   * VOR is zero at replacement level by construction — every position's last
   * starter lands in the same handful of board slots no matter what the scoring
   * says. It moved by one place across every league tried, which is a metric
   * reporting on its own definition rather than on the league.
   */
  function positionStats(b, teams, poolN) {
    var ranks = ranksOf(b), out = {};
    POSITIONS.forEach(function (pos) {
      var list = b.byPos[pos] || [], repl = b.replacement[pos];
      if (!list.length || !repl) { out[pos] = null; return; }
      var bestRank = ranks[list[0].name] || null;
      var inPool = 0;
      b.players.slice(0, poolN).forEach(function (p) { if (p.pos === pos) inPool++; });
      out[pos] = {
        starters: repl.rank,
        replacementName: repl.name,
        replacementPts: repl.points,
        bestName: list[0].name,
        bestPts: list[0].pts,
        edge: list[0].pts - repl.points,
        edgePerWeek: (list[0].pts - repl.points) / SEASON_WEEKS,
        bestRank: bestRank,
        bestRound: bestRank ? Math.ceil(bestRank / teams) : null,
        inPool: inPool
      };
    });
    return out;
  }

  function n1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function n0(v) { return String(Math.round(v)); }

  /**
   * Which positions gained ground on the others.
   *
   * The first version of this compared each position's edge against its own
   * baseline edge and reported the raw change, and in a no-PPR league it told
   * the reader to take running backs later, receivers later and tight ends
   * later. All three were true in absolute points — stripping receptions out
   * shrinks every position's edge — and the advice was useless, because a draft
   * is nothing but positions in an order and you cannot take all of them later.
   *
   * What decides a draft is which position lost *least*. So each position's
   * edge ratio is measured against the median ratio across positions: the
   * league-wide inflation or deflation divides out, and what is left is the
   * reordering. In that no-PPR league the same numbers now say receivers and
   * tight ends come down the board and quarterbacks come up, which is both the
   * correct read and one a drafter can act on.
   */
  function relativeEdge(leaguePos, basePos) {
    var ratios = {}, list = [];
    POSITIONS.forEach(function (pos) {
      var a = leaguePos[pos], b = basePos[pos];
      if (!a || !b || b.edge <= 0) return;
      ratios[pos] = a.edge / b.edge;
      list.push(ratios[pos]);
    });
    if (!list.length) return { ratios: ratios, median: 1, rel: {} };
    list.sort(function (x, y) { return x - y; });
    var mid = list.length >> 1;
    var median = list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
    var rel = {};
    Object.keys(ratios).forEach(function (pos) {
      rel[pos] = median ? ratios[pos] / median - 1 : 0;
    });
    return { ratios: ratios, median: median, rel: rel };
  }

  /**
   * The sentences. Generated here rather than in the renderer because the
   * Claude brief wants the same text the panel shows, and two generators drift.
   *
   * Every one is gated on a measured threshold, and a league whose scoring
   * genuinely is the consensus gets told that instead of being handed
   * manufactured significance. A tool that always finds an edge is not
   * measuring anything.
   */
  function headlines(rep) {
    var out = [], teams = rep.teams;

    // ---- is there anything here at all ------------------------------------
    var c = rep.scoring.churn;
    var material = c.moves.filter(function (m) { return Math.abs(m.delta) >= teams; }).length;
    if (c.avgMove < 1.5 && material === 0) {
      out.push("Your scoring is close enough to the consensus baseline that this board and a " +
        "full-PPR one rank the draftable pool almost identically. There is no scoring arbitrage " +
        "here to speak of — your edge in this league comes from roster shape, keepers and " +
        "who is actually on the board, not from the rules.");
    } else {
      out.push("Against the baseline — " + rep.baselineName + " — your scoring moves the " +
        rep.poolSize + " players who matter by " + n1(c.avgMove) + " places on average, and " +
        "moves " + material + " of them by a full round or more. The board you are drafting " +
        "off is not the board the rest of your league is reading.");
    }

    // ---- which positions gained ground on the others ----------------------
    var rel = rep.scoring.relative.rel;
    POSITIONS.forEach(function (pos) {
      var a = rep.scoring.positions.league[pos], b = rep.scoring.positions.base[pos];
      if (!a || !b || rel[pos] === undefined) return;
      /* Two gates, and both are needed. The proportion keeps noise out; the
         floor keeps kickers out, where a position worth twenty points a season
         can swing 15% without any of it mattering to a draft. */
      if (Math.abs(rel[pos]) < 0.10 || b.edge < 30) return;
      var up = rel[pos] > 0;
      // Where the position's best player actually lands is the part a drafter
      // can act on, so it goes in the same sentence as the reason — but only
      // when it moved, since quoting an unchanged rank as evidence is padding.
      var rankNote = (a.bestRank && b.bestRank && Math.abs(a.bestRank - b.bestRank) >= 2)
        ? " The best " + pos + " is the #" + a.bestRank + " player on this board, against #" +
          b.bestRank + " on the baseline."
        : "";
      /* When the position's own edge is untouched and it still gains ground,
         quoting "67 points against 67" as the evidence reads like a
         contradiction. It is not one — the position gained because everything
         around it lost — but the sentence has to say that, not leave a reader
         to reconcile two identical numbers. */
      var evidence = Math.abs(a.edge - b.edge) < 2
        ? "Its own edge is unchanged at " + n0(a.edge) + " points, and it gained the ground " +
          "by standing still while your scoring moved every other position"
        : "From the best " + pos + " down to the last one you can start is " + n0(a.edge) +
          " points here against " + n0(b.edge) + " on the baseline, and once you allow for " +
          "what your scoring does to every position, that is " +
          n0(Math.abs(rel[pos]) * 100) + "% " + (up ? "more" : "less") + " positional edge";
      out.push(pos + " " + (up ? "gains" : "loses") + " ground in your league. " + evidence +
        ". Expect the board to take " + pos + "s " + (up ? "earlier" : "later") +
        " than ADP does." + rankNote);
    });

    // ---- who is in the draft at all ---------------------------------------
    POSITIONS.forEach(function (pos) {
      var a = rep.scoring.positions.league[pos], b = rep.scoring.positions.base[pos];
      if (!a || !b) return;
      var d = a.inPool - b.inPool;
      if (Math.abs(d) < 2) return;
      out.push("Your scoring puts " + Math.abs(d) + " " + (d > 0 ? "more" : "fewer") + " " +
        pos + (Math.abs(d) === 1 ? "" : "s") + " inside the top " + rep.poolSize +
        " than the baseline does — " + a.inPool + " against " + b.inPool + ".");
    });

    // ---- roster shape, kept separate from scoring on purpose --------------
    if (rep.shape) {
      var s = rep.shape.churn;
      if (s.avgMove >= 1.5) {
        out.push("Separately from scoring, your lineup — " + rep.rosterLine + " in a " +
          teams + "-team league — moves the pool another " + n1(s.avgMove) +
          " places against a plain 12-team lineup, most of it at " +
          (s.topPos || "no one position") + ". Roster shape is doing as much work here as the " +
          "scoring is.");
      }
      /* Per team, not league-wide. A 14-team league starts more of everything,
         and reporting "14 QBs started against 12" as a finding is reporting the
         team count back at the reader six times over — once per position, which
         is how this first read. What is worth saying is where the *lineup*
         differs, and that only shows once the team count divides out. */
      var deeper = [];
      POSITIONS.forEach(function (pos) {
        var a = rep.shape.positions.league[pos], b = rep.shape.positions.base[pos];
        if (!a || !b) return;
        var mine = a.starters / teams, base = b.starters / BASE_SHAPE.teams;
        if (Math.abs(mine - base) < 0.15) return;
        deeper.push(pos + " " + n1(mine) + " a team against " + n1(base));
      });
      if (deeper.length) {
        out.push("Per team, your lineup starts a different mix than the standard one — " +
          deeper.join(", ") + ". Replacement level moves with it, and so does every player's " +
          "value at those positions.");
      }
    }

    return out;
  }

  function rosterLine(roster) {
    if (!roster) return "a standard lineup";
    return ["QB", "RB", "WR", "TE", "FLEX", "SUPERFLEX", "K", "DEF"]
      .filter(function (k) { return roster[k]; })
      .map(function (k) { return roster[k] + k; })
      .join("/") || "a standard lineup";
  }

  /**
   * analyze(players, rules, opts) -> report
   *
   *   opts.baseline  scoring to compare against (default: the ppr_standard preset)
   *   opts.rounds    draft length, which sizes the pool (default 15)
   */
  function analyze(players, rules, opts) {
    opts = opts || {};
    var E = engine();
    if (!E) throw new Error("DRAFTLINE_IMPACT needs DRAFTLINE_ENGINE loaded first.");
    var baseline = opts.baseline || (root.DRAFTLINE_PRESETS || {}).ppr_standard;
    if (!baseline) throw new Error("DRAFTLINE_IMPACT needs a baseline scoring object.");

    var teams = rules.teams || opts.teams || 12;
    var rounds = opts.rounds || 15;
    var poolN = Math.min(players.length, Math.max(teams, teams * rounds));

    var byName = {};
    players.forEach(function (p) { byName[p.name] = p; });

    var league = board(players, rules);
    var scoringBase = board(players, withScoring(rules, baseline));

    var rep = {
      baselineName: baseline.name || "Full PPR",
      teams: teams, rounds: rounds, poolSize: poolN,
      roster: rules.roster || {},
      rosterLine: rosterLine(rules.roster),
      scoring: {
        churn: churn(league, scoringBase, poolN, byName),
        positions: { league: positionStats(league, teams, poolN),
                     base: positionStats(scoringBase, teams, poolN) },
        relative: null,
        knobs: []
      },
      shape: null,
      headlines: []
    };

    rep.scoring.relative =
      relativeEdge(rep.scoring.positions.league, rep.scoring.positions.base);

    // ---- one rule at a time ------------------------------------------------
    var leaguePts = ptsOf(league);
    GROUPS.forEach(function (g) {
      var grp = g[0], seen = {}, keys = [];
      [rules[grp] || {}, baseline[grp] || {}].forEach(function (o) {
        Object.keys(o).forEach(function (k) { if (!seen[k]) { seen[k] = 1; keys.push(k); } });
      });
      keys.forEach(function (key) {
        var mine = value(rules, grp, key), theirs = value(baseline, grp, key);
        if (mine === theirs) return;

        /* Revert this one rule and nothing else. Removing the key rather than
           writing a zero matters for the yards-per-point divisors, where zero
           is not "off" — it is a division that would send the whole board to
           Infinity. */
        var hasBase = (baseline[grp] || {})[key] !== undefined;
        var reverted = board(players, withKnob(rules, grp, key, hasBase ? theirs : undefined));
        var ch = churn(league, reverted, poolN, byName);
        var revPts = ptsOf(reverted);

        /* Whose score this rule actually changed, and by how much. The
           distinction matters for the example the panel quotes: reverting a
           passing bonus shuffles kickers too, because everyone below the
           quarterbacks slides up a place, and naming a kicker as what a passing
           rule did to the board is worse than naming nobody. So the example is
           drawn from players the rule touched, and the count of them is
           reported beside it — a rule that touches four players and a rule that
           touches ninety are different kinds of rule. */
        var touched = {}, touchedCount = 0, swing = null;
        league.players.slice(0, poolN).forEach(function (p) {
          var d = leaguePts[p.name] - (revPts[p.name] || 0);
          if (Math.abs(d) < 0.05) return;
          touched[p.name] = d;
          touchedCount++;
          if (!swing || Math.abs(d) > Math.abs(swing.pts)) {
            swing = { name: p.name, pos: p.pos, pts: d };
          }
        });
        var moved = ch.moves.filter(function (m) { return touched[m.name] !== undefined; });

        rep.scoring.knobs.push({
          group: grp, groupLabel: g[1], key: key,
          label: g[1] + " · " + (LABELS[key] || key),
          league: mine, base: theirs, hasBase: hasBase,
          churn: ch.total, avgMove: ch.avgMove, maxMove: ch.maxMove,
          topPos: ch.topPos, byPos: ch.byPos,
          touchedCount: touchedCount,
          biggestMove: moved[0] || null,
          biggestSwing: swing
        });
      });
    });
    // Ranked by what each rule actually did to the draftable board, not by how
    // large the number on the settings page looks.
    rep.scoring.knobs.sort(function (a, b) { return b.churn - a.churn; });

    // ---- roster shape ------------------------------------------------------
    var sameShape = teams === BASE_SHAPE.teams &&
      POSITIONS.concat(["FLEX", "SUPERFLEX"]).every(function (k) {
        return ((rules.roster || {})[k] || 0) === (BASE_SHAPE.roster[k] || 0);
      });
    if (!sameShape) {
      var shapeBase = board(players, withShape(rules, BASE_SHAPE));
      rep.shape = {
        churn: churn(league, shapeBase, poolN, byName),
        positions: { league: rep.scoring.positions.league,
                     base: positionStats(shapeBase, BASE_SHAPE.teams, poolN) }
      };
    }

    rep.headlines = headlines(rep);
    return rep;
  }

  root.DRAFTLINE_IMPACT = {
    analyze: analyze, headlines: headlines, rosterLine: rosterLine,
    LABELS: LABELS, GROUPS: GROUPS, DEFAULTS: DEFAULTS, POSITIONS: POSITIONS,
    BASE_SHAPE: BASE_SHAPE, SEASON_WEEKS: SEASON_WEEKS,
    value: value, withKnob: withKnob, withScoring: withScoring, withShape: withShape,
    churn: churn, positionStats: positionStats, relativeEdge: relativeEdge
  };
  if (typeof module !== "undefined") module.exports = root.DRAFTLINE_IMPACT;
})(globalThis);
