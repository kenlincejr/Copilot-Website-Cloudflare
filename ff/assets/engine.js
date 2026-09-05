/* DRAFTLINE engine — scoring + draft math. Pure functions, no DOM, no network.
   Loaded by the browser as a plain script; also require()-able for tests. */
(function (root) {
  "use strict";

  // ------------------------------------------------------------------ math

  function erf(x) {
    // Abramowitz & Stegun 7.1.26. Max error ~1.5e-7, far tighter than anything
    // downstream of it here needs.
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
                  - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function normCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

  /** Expected number of games in which a per-game total clears `threshold`. */
  function gamesOver(seasonTotal, games, sd, threshold) {
    if (!seasonTotal || !games || threshold <= 0) return 0;
    var mean = seasonTotal / games;
    return games * (1 - normCdf((threshold - mean) / sd));
  }

  var GAME_SD = { pass: 78, rush: 34, rec: 32 };

  // --------------------------------------------------------------- scoring

  var PA_KEYS = ["pa0", "pa1_6", "pa7_13", "pa14_20", "pa21_27", "pa28_34", "pa35plus"];

  /* Research flags in the reader's language rather than the industry's. The
     data keys are the vocabulary the sources use; "flag plant" is what an
     analyst calls staking their name on a player, and it means nothing at all
     to somebody reading a draft board on a two-minute clock. One map, here,
     because both the engine's reason strings and the app's badges need it. */
  var TAG_LABEL = {
    FLAG_PLANT: "CONVICTION", BREAKOUT: "BREAKOUT", SLEEPER: "SLEEPER",
    RISER: "RISING", FALLER: "SLIDING", LANDMINE: "LANDMINE",
    AVOID: "AVOID", INJURY: "INJURY"
  };

  /**
   * customPoints(player, rules) -> { total, byCategory, perGame, games, estimated }
   * The single place scoring rules are applied. Everything downstream — VOR,
   * VONA, the recommendation, the board — reads this and nothing else.
   */
  function customPoints(player, rules) {
    var p = player.proj || {}, cat = {}, est = false;
    var games = p.gp || 17;
    var add = function (k, v) { if (v) cat[k] = (cat[k] || 0) + v; };

    if (player.pos === "DEF") {
      var d = rules.dst || {};
      add("Sacks", (p.sack || 0) * (d.sack || 0));
      add("Interceptions", (p.int || 0) * (d.int || 0));
      add("Fumble recoveries", (p.fum_rec || 0) * (d.fumRec || 0));
      add("Defensive TDs", (p.def_td || 0) * (d.td || 0));
      add("Safeties", (p.safety || 0) * (d.safety || 0));
      add("Blocked kicks", (p.blk_kick || 0) * (d.blockKick || 0));
      var dist = p.pa_dist || [], pa = 0;
      for (var i = 0; i < PA_KEYS.length; i++) pa += (dist[i] || 0) * (d[PA_KEYS[i]] || 0);
      add("Points allowed", pa * games);
      if (d.returnYardsPerPoint && p.ret_yd) add("Return yards", p.ret_yd / d.returnYardsPerPoint);
      est = true; // the PA distribution is modeled, always
    } else if (player.pos === "K") {
      var k = rules.kicking || {};
      add("FG 0-19", (p.fgm_0_19 || 0) * (k.fg0_19 || 0));
      add("FG 20-29", (p.fgm_20_29 || 0) * (k.fg20_29 || 0));
      add("FG 30-39", (p.fgm_30_39 || 0) * (k.fg30_39 || 0));
      add("FG 40-49", (p.fgm_40_49 || 0) * (k.fg40_49 || 0));
      add("FG 50+", (p.fgm_50p || 0) * (k.fg50plus || 0));
      add("Missed FG", (p.fgmiss_0_19 || 0) * (k.miss0_19 || 0)
                     + (p.fgmiss_20_29 || 0) * (k.miss20_29 || 0)
                     + (p.fgmiss_30_39 || 0) * (k.miss30_39 || 0)
                     + (p.fgmiss_40_49 || 0) * (k.miss40_49 || 0)
                     + (p.fgmiss_50p || 0) * (k.miss50plus || 0));
      add("Extra points", (p.xpm || 0) * (k.pat || 0) + (p.xp_miss || 0) * (k.patMiss || 0));
      est = true; // kicker lines are modeled off rank
    } else {
      var pa_ = rules.passing || {}, ru = rules.rushing || {},
          re = rules.receiving || {}, mi = rules.misc || {};

      if (p.pass_yd) add("Passing yards", p.pass_yd / (pa_.yardsPerPoint || 25));
      add("Passing TDs", (p.pass_td || 0) * (pa_.td || 0));
      add("Interceptions", (p.pass_int || 0) * (pa_.int || 0));
      add("2-pt conversions", (p.pass_2pt || 0) * (pa_.twoPt || 0)
                            + (p.rush_2pt || 0) * (ru.twoPt || pa_.twoPt || 0)
                            + (p.rec_2pt || 0) * (re.twoPt || pa_.twoPt || 0));
      if (pa_.bonus400) add("Passing yardage bonus",
        gamesOver(p.pass_yd, games, GAME_SD.pass, 400) * pa_.bonus400);
      if (pa_.bonus500) add("Passing yardage bonus",
        gamesOver(p.pass_yd, games, GAME_SD.pass, 500) * pa_.bonus500);
      if (pa_.comp40plus && p.comp40) { add("40+ yard plays", p.comp40 * pa_.comp40plus); est = true; }
      if (pa_.td40plus && p.pass_td40) { add("40+ yard TDs", p.pass_td40 * pa_.td40plus); est = true; }

      if (p.rush_yd) add("Rushing yards", p.rush_yd / (ru.yardsPerPoint || 10));
      add("Rushing TDs", (p.rush_td || 0) * (ru.td || 0));
      if (ru.bonus150) add("Rushing yardage bonus",
        gamesOver(p.rush_yd, games, GAME_SD.rush, 150) * ru.bonus150);
      if (ru.bonus200) add("Rushing yardage bonus",
        gamesOver(p.rush_yd, games, GAME_SD.rush, 200) * ru.bonus200);
      if (ru.run40plus && p.run40) { add("40+ yard plays", p.run40 * ru.run40plus); est = true; }
      if (ru.td40plus && p.rush_td40) { add("40+ yard TDs", p.rush_td40 * ru.td40plus); est = true; }

      add("Receptions", (p.rec || 0) * (re.perReception || 0));
      if (p.rec_yd) add("Receiving yards", p.rec_yd / (re.yardsPerPoint || 10));
      add("Receiving TDs", (p.rec_td || 0) * (re.td || 0));
      if (re.bonus150) add("Receiving yardage bonus",
        gamesOver(p.rec_yd, games, GAME_SD.rec, 150) * re.bonus150);
      if (re.bonus200) add("Receiving yardage bonus",
        gamesOver(p.rec_yd, games, GAME_SD.rec, 200) * re.bonus200);
      if (re.rec40plus && p.rec40) { add("40+ yard plays", p.rec40 * re.rec40plus); est = true; }
      if (re.td40plus && p.rec_td40) { add("40+ yard TDs", p.rec_td40 * re.td40plus); est = true; }

      add("Fumbles lost", (p.fum_lost || 0) * (mi.fumbleLost || 0));
      if (mi.returnYardsPerPoint && p.ret_yd) {
        add("Return yards", p.ret_yd / mi.returnYardsPerPoint);
        add("Return TDs", (p.ret_td || 0) * (mi.returnTd || 0));
      }
    }

    var total = 0;
    for (var key in cat) total += cat[key];
    if (rules.fractional === false) total = Math.round(total);
    return { total: total, byCategory: cat, games: games,
             perGame: games ? total / games : 0, estimated: est };
  }

  // ------------------------------------------------- replacement level / VOR

  var FLEX_SPLIT = { RB: 0.55, WR: 0.40, TE: 0.05 };

  /** Weeks a season's projection is spread across, for reading a gain per week. */
  var SEASON_WEEKS = 17;

  /**
   * Who actually occupies a superflex slot.
   *
   * The flex split is a statement about taste — a receiver and a back are close
   * enough in a flex that which one starts is a matter of roster shape. The
   * superflex split is not: it is a statement about points, and the points are
   * one-sided. Filling every base slot on this board (12 QB, 24 RB, 24 WR,
   * 12 TE) and then a round of flexes, the worst quarterback still in the pool
   * beats the twelfth flex-type body left over by 3.3 pts/week in full PPR,
   * 3.6 in Ken's scoring, 5.6 in Yahoo default and 6.4 in non-PPR. There is no
   * scoring here in which a manager who owns a startable second quarterback
   * plays somebody else in the slot.
   *
   * So the residual is not preference, it is supply. Twenty-four slots want a
   * quarterback every week; the board carries about twenty-seven who project a
   * real season (QB28 falls off to 170 points), so the league's spare arms are
   * three deep. Every started quarterback is gone for exactly one week in
   * SEASON_WEEKS — his bye — and three spares cannot cover all of that, let
   * alone cover it alongside an injury. One bye in seventeen is therefore a
   * deliberately conservative ceiling on how often the slot is *not* a
   * quarterback; the true figure is lower, and erring this way underprices
   * quarterbacks slightly rather than overpricing them.
   *
   * What covers the slot in that week is an ordinary flex body, so the residual
   * is split by FLEX_SPLIT rather than by a second set of invented weights.
   */
  var SUPERFLEX_QB_SHARE = 1 - 1 / SEASON_WEEKS;          // 0.941
  var SUPERFLEX_SPLIT = { QB: SUPERFLEX_QB_SHARE };
  Object.keys(FLEX_SPLIT).forEach(function (pos) {
    SUPERFLEX_SPLIT[pos] = FLEX_SPLIT[pos] * (1 - SUPERFLEX_QB_SHARE);
  });

  /**
   * How much of the wait-cost rides on top of value. Value already says what a
   * player is worth to this roster; VONA says how much of that worth you keep by
   * taking him now rather than at your next pick. Adding it whole counted the
   * same worth twice — before any other term was reached, a scarce player's
   * score was close to double a plentiful one's — so it enters as a tilt on a
   * number that already stands on its own.
   */
  var VONA_WEIGHT = 0.5;

  /**
   * Fisher's optimal 1-D clustering. Partitions `list` (already sorted by points,
   * descending) into `k` contiguous tiers that minimize total within-tier
   * variance, then writes `tier` onto each player.
   *
   * O(k·n²), which for a 92-deep receiver board is about 68k operations — small
   * enough to run inside buildBoard, and buildBoard does not run per keystroke.
   */
  function assignTiers(list) {
    var n = list.length;
    if (!n) return;
    var k = Math.max(4, Math.min(12, Math.round(n / 5)));
    if (n <= k) { list.forEach(function (p, i) { p.tier = i + 1; }); return; }

    var sum = [0], sq = [0];
    for (var i = 0; i < n; i++) {
      sum.push(sum[i] + list[i].pts);
      sq.push(sq[i] + list[i].pts * list[i].pts);
    }
    // Within-group sum of squared deviations for players a..b inclusive.
    function cost(a, b) {
      var cnt = b - a + 1;
      var s2 = sum[b + 1] - sum[a];
      return (sq[b + 1] - sq[a]) - (s2 * s2) / cnt;
    }

    var dp = [], back = [];
    for (var g = 0; g <= k; g++) { dp.push(new Array(n).fill(Infinity)); back.push(new Array(n).fill(0)); }
    for (var e = 0; e < n; e++) dp[1][e] = cost(0, e);
    for (var g2 = 2; g2 <= k; g2++) {
      for (var e2 = g2 - 1; e2 < n; e2++) {
        for (var m = g2 - 2; m < e2; m++) {
          var c = dp[g2 - 1][m] + cost(m + 1, e2);
          if (c < dp[g2][e2]) { dp[g2][e2] = c; back[g2][e2] = m; }
        }
      }
    }

    var bounds = [], end = n - 1;
    for (var g3 = k; g3 >= 1; g3--) { bounds.unshift(end); end = back[g3][end]; }
    var tier = 1, at = 0;
    bounds.forEach(function (b) {
      for (; at <= b; at++) list[at].tier = tier;
      tier++;
    });
  }

  /** Replacement rank per position, derived from roster + team count. */
  function replacementRanks(rules) {
    var r = rules.roster || {}, teams = rules.teams || 12, out = {};
    var flexEl = r.flexEligible || ["RB", "WR", "TE"];
    // A superflex slot is a flex that a quarterback may also fill. Its eligible
    // list is therefore the flex's plus QB unless the league says otherwise —
    // reading r.SUPERFLEX but not r.superflexEligible would have quietly
    // hardcoded the one thing a league is most likely to vary here.
    var sflexEl = r.superflexEligible || ["QB"].concat(flexEl);
    ["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
      var starters = teams * (r[pos] || 0);
      var flex = (r.FLEX || 0) * teams * (flexEl.indexOf(pos) >= 0 ? (FLEX_SPLIT[pos] || 0) : 0);
      var sflex = (r.SUPERFLEX || 0) * teams *
        (sflexEl.indexOf(pos) >= 0 ? (SUPERFLEX_SPLIT[pos] || 0) : 0);
      out[pos] = Math.max(1, Math.round(starters + flex + sflex));
    });
    return out;
  }


  // --------------------------------------------------- ceiling and risk

  /* Ceiling and risk arrive from the research layer, which covers the players
     analysts write about — 74 of 267 here, and only 3 of the top 24. Every
     other player carried no grade at all, and a missing grade is not a neutral
     one: `player.ceiling ? ... : 0` made the whole ceiling/risk term vanish.
     Styles built on positional bias worked; Upside hunter and Floor first,
     which are nothing but a ceiling weight and a risk weight, moved nobody in
     the part of the board that decides a draft. Both were decoration.

     So every ungraded player gets a modeled grade, from data the board already
     carries. None of it is a substitute for someone having watched the tape —
     which is why a research grade always wins where one exists, and why the
     modeled ones sit in a deliberately narrower band around neutral than the
     annotated ones do. They are a tilt, not a verdict.

     The five signals, and why each is one:

       spread       How much the drafting public disagrees about where he goes,
                    measured against the disagreement normal at his cost — the
                    raw spread widens with ADP for structural reasons, so it is
                    read against a fitted norm. Genuine disagreement is upside
                    and risk at once.
       markets      Sleeper's price against this board's, drift removed. One
                    market reaching earlier than the other is a real opinion;
                    the size of the gap either way is uncertainty.
       role         Depth-chart slot. An entrenched starter is the safe kind of
                    boring. A player behind someone is contingent: his good
                    outcome is better than his price and his likely one is
                    worse. Skipped for kickers and defenses, who have no depth
                    chart worth reading.
       availability Injury designation and projected games. This is risk and
                    nothing else — a player on IR has no ceiling in September.
       td share     What fraction of his projection is touchdowns. Touchdowns
                    are the least repeatable thing a player does, so a
                    projection leaning on them is a wider distribution than the
                    same total built out of catches and yards.

     Neutral is ceiling 70 and risk 50 because those are the composite's own
     zero points — a player with nothing to say for himself gets no push in
     either direction, so filling the board in does not shift the board. */

  var GRADE_BOUNDS = { ceiling: [45, 93], risk: [30, 95] };

  function median(list) {
    if (!list.length) return 0;
    var a = list.slice().sort(function (x, y) { return x - y; });
    return a[Math.floor(a.length / 2)];
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /** Share of a scored player's projection that comes from touchdowns. */
  function tdShare(p) {
    var c = p.byCategory || {}, total = 0, td = 0;
    Object.keys(c).forEach(function (k) {
      total += Math.abs(c[k]);
      if (/TDs?$/.test(k)) td += c[k];
    });
    return total > 0 ? td / total : 0;
  }

  /**
   * How far a market signal is allowed to move a grade, by where the grade came
   * from. A modeled grade is this file's own guess and the market is entitled to
   * argue with it at full volume; a researched one was reasoned about by a
   * person, so the market gets half a vote rather than none.
   */
  var MARKET_TRUST = { research: 0.5, modeled: 1 };

  /**
   * What the market is saying about a player, as a nudge to his ceiling and risk.
   *
   * Two signals, and they are different in kind, which is why they are not
   * summed into one number.
   *
   * `adpResid` is cross-market *disagreement*: Sleeper's price for him against
   * what a player at this board's price normally costs there. A negative
   * residual is Sleeper reaching earlier — one room is higher on him than the
   * other. Disagreement in either direction is uncertainty, so it raises risk by
   * its magnitude while only the direction moves the ceiling.
   *
   * `ytrend` is *movement*: picks earlier (positive) or later (negative) in real
   * Yahoo drafts over the last seven days, on the platform this league runs on.
   * That is not disagreement, it is news arriving — a starter named, a competitor
   * hurt, a camp report — and it arrives in draft rooms well before it reaches a
   * season projection. So it is directional on both terms: a player the market is
   * moving toward gets a higher ceiling and, because the usual cause is role
   * security, a slightly lower risk. Falling is the same statement inverted, and
   * the asymmetry is deliberate — the ceiling moves more than the risk, because
   * movement is better evidence about upside than about floor.
   *
   * Both are clamped before they are scaled, so one loud outlier cannot dominate
   * a grade, and both are silent when their data is absent. `ytrend` is null
   * until the user pastes Yahoo's draftanalysis page, which means this term does
   * nothing at all on a board with no telemetry — the honest behavior, rather
   * than inventing a trend from the static ADP that is already priced elsewhere.
   */
  function marketSignals(p) {
    var dCeiling = 0, dRisk = 0;

    if (p.adpResid != null) {
      var z = clamp(p.adpResid / 14, -1.5, 1.5);
      dCeiling += -5 * z;
      dRisk += 4 * Math.abs(z);
    }

    // Scaled by 3 picks: the board calls movement under 0.3 picks "flat" and
    // flags a full pick as worth mentioning, so three picks in a week is a
    // decisive move and lands at the cap.
    if (p.ytrend != null) {
      var t = clamp(p.ytrend / 3, -1.5, 1.5);
      dCeiling += 5 * t;
      dRisk += -3 * t;
    }

    return { ceiling: dCeiling, risk: dRisk };
  }

  /**
   * Recompute `ceiling` and `risk` from the stored base plus whatever the market
   * currently says. Idempotent by construction: it always reads `ceilingBase`
   * and never its own output, so it can be re-run every time the user pastes
   * fresher draft data without the adjustment compounding on itself.
   */
  function applyMarketSignals(players) {
    players.forEach(function (p) {
      if (p.ceilingBase == null || p.riskBase == null) return;
      var d = marketSignals(p);
      var w = MARKET_TRUST[p.gradeSource] != null ? MARKET_TRUST[p.gradeSource] : 1;
      p.marketCeilingAdj = d.ceiling * w;
      p.marketRiskAdj = d.risk * w;
      p.ceiling = Math.round(clamp(p.ceilingBase + p.marketCeilingAdj,
                                   GRADE_BOUNDS.ceiling[0], GRADE_BOUNDS.ceiling[1]));
      p.risk = Math.round(clamp(p.riskBase + p.marketRiskAdj,
                                GRADE_BOUNDS.risk[0], GRADE_BOUNDS.risk[1]));
    });
    return players;
  }

  /**
   * Write `ceiling`, `risk` and `gradeSource` onto every scored player.
   * Research grades pass through untouched; everything else is modeled.
   */
  function modelGrades(scored) {
    // The spread the market normally shows at a given cost. A fixed threshold
    // cannot work here — an adp_sd of 6 is enormous at pick 3 and unremarkable
    // at pick 120 — so what matters is a player's spread against the spread
    // normal at his price.
    //
    // That norm is a power law and is fitted as one: on this board
    // log(sd) = -1.26 + 0.81·log(adp) leaves a residual whose 10th and 90th
    // percentiles sit at ±0.33 in log terms, which is a tight fit for one
    // straight line through 267 players. A rolling median over each player's
    // ADP neighborhood was the first attempt and it fails at the ends of the
    // board, where a symmetric window has nothing on one side: at the top it
    // could only look forward, into spread that rises fast, so the whole first
    // round read as unusually agreed-upon. A fitted law extrapolates instead of
    // running out of neighbors.
    var n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    scored.forEach(function (p) {
      if (!(p.adp > 0) || !(p.adp_sd > 0)) return;
      var x = Math.log(p.adp), y = Math.log(p.adp_sd);
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
    });
    var slope = 0, intercept = 0;
    if (n > 2 && n * sxx - sx * sx !== 0) {
      slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      intercept = (sy - slope * sx) / n;
    }
    var expectedSd = function (p) {
      return n > 2 && p.adp > 0 ? Math.exp(intercept + slope * Math.log(p.adp)) : 0;
    };

    // Touchdown reliance is only meaningful against the position's own norm:
    // a running back's share is structurally higher than a receiver's.
    var shares = {}, posMedian = {};
    scored.forEach(function (p) { (shares[p.pos] = shares[p.pos] || []).push(tdShare(p)); });
    Object.keys(shares).forEach(function (pos) { posMedian[pos] = median(shares[pos]); });

    scored.forEach(function (p) {
      // A researched grade is a prior, not a verdict. It used to return here,
      // which meant the 84 annotated players — the ones a manager actually
      // agonizes over in rounds 3 through 10 — were the only players on the
      // board that no market signal could ever reach. A hand grade written
      // before camp cannot know that the market has moved forty picks on
      // somebody since; refusing to look is not respect for the research, it is
      // just a stale number defended. So research sets the base and the market
      // updates it, at half the weight it gets on a modeled player, because a
      // grade somebody actually reasoned about should not be shoved around by
      // cross-market noise as easily as one this file invented.
      var researched = p.ceiling != null && p.risk != null;
      if (researched) {
        p.gradeSource = "research";
        p.ceilingBase = p.ceiling;
        p.riskBase = p.risk;
        return;
      }

      var ceiling = 70, risk = 50;

      // Spread, on a log scale so twice the normal disagreement and half of it
      // are the same distance from neutral in opposite directions.
      var exp = expectedSd(p);
      if (exp > 0 && p.adp_sd > 0) {
        // Divided by 0.5 rather than by the residual's own spread: the fit's
        // 10th and 90th percentiles land near ±0.33, so this puts a genuinely
        // contested player around two-thirds of the way to the cap without
        // letting one loud outlier reach it.
        var u = clamp(Math.log(p.adp_sd / exp) / 0.5, -1, 1);
        ceiling += 9 * u; risk += 7 * u;
      }

      // Role security.
      if (p.pos !== "K" && p.pos !== "DEF" && p.depth) {
        if (p.depth <= 1) risk -= 4;
        else if (p.depth === 2) { ceiling += 5; risk += 6; }
        else { ceiling += 7; risk += 10; }
      }

      // Availability. A designation is risk; the serious ones take the ceiling
      // with them, because a player who is not on the field has no good week.
      var inj = p.injury || "";
      if (inj === "Questionable") risk += 4;
      else if (inj === "NA" || inj === "PUP") { risk += 10; ceiling -= 5; }
      else if (inj === "IR") { risk += 16; ceiling -= 9; }
      var gp = (p.proj && p.proj.gp) || 17;
      if (gp < 17) risk += Math.min(9, (17 - gp) * 1.2);

      // Touchdown dependence.
      var s = tdShare(p) - (posMedian[p.pos] || 0);
      ceiling += clamp(40 * s, -8, 8);
      risk += clamp(34 * s, -8, 8);

      p.ceilingBase = clamp(ceiling, GRADE_BOUNDS.ceiling[0], GRADE_BOUNDS.ceiling[1]);
      p.riskBase = clamp(risk, GRADE_BOUNDS.risk[0], GRADE_BOUNDS.risk[1]);
      p.gradeSource = "modeled";
    });

    applyMarketSignals(scored);
  }

  /**
   * Score every player, attach `pts`, `vor`, `posRank`, and the replacement
   * baseline used. Returns { players, replacement:{pos:{rank,points,name}} }.
   */
  function buildBoard(players, rules) {
    var scored = players.map(function (pl) {
      var s = customPoints(pl, rules);
      return Object.assign({}, pl, {
        pts: s.total, ptsPerGame: s.perGame, byCategory: s.byCategory,
        estimated: s.estimated
      });
    });
    var byPos = {};
    scored.forEach(function (p) { (byPos[p.pos] = byPos[p.pos] || []).push(p); });
    var ranks = replacementRanks(rules), repl = {};
    Object.keys(byPos).forEach(function (pos) {
      byPos[pos].sort(function (a, b) { return b.pts - a.pts; });
      byPos[pos].forEach(function (p, i) { p.posRank = i + 1; });
      var idx = Math.min(byPos[pos].length - 1, (ranks[pos] || 12) - 1);
      var r = byPos[pos][idx];
      repl[pos] = { rank: ranks[pos] || 12, points: r ? r.pts : 0, name: r ? r.name : null };
    });
    scored.forEach(function (p) { p.vor = p.pts - (repl[p.pos] ? repl[p.pos].points : 0); });
    modelGrades(scored);

    // Tiers.
    //
    // The first attempt broke a tier wherever the gap to the next player beat a
    // multiple of the median gap. That fails badly at the top of a board: the
    // median is dragged down by the long compressed tail — dozens of players
    // within a point or two of each other — so the threshold came out around six
    // points, and six points across a whole season is noise. The top three backs
    // landed in three different tiers, which is both useless and looks broken.
    //
    // This instead partitions each position optimally, minimizing the variance
    // inside each tier (Fisher's exact 1-D clustering, by dynamic programming).
    // It reads the shape of the whole position at once rather than reacting to
    // one local gap, so genuinely similar players stay together and the breaks
    // land where the position actually steps down.
    Object.keys(byPos).forEach(function (pos) {
      assignTiers(byPos[pos]);
    });

    scored.sort(function (a, b) { return b.vor - a.vor; });
    scored.forEach(function (p, i) { p.vorRank = i + 1; });
    return { players: scored, replacement: repl, byPos: byPos };
  }

  // ------------------------------------------------------------- draft flow

  /** Snake pick numbers for a slot. `slot` is 1-based. */
  function pickSchedule(teams, slot, rounds) {
    var out = [];
    for (var r = 1; r <= rounds; r++) {
      var inRound = (r % 2 === 1) ? slot : (teams - slot + 1);
      out.push((r - 1) * teams + inRound);
    }
    return out;
  }

  /** Remove rounds consumed by keepers. keepers: [{name, round}] (user's own). */
  function scheduleWithKeepers(teams, slot, rounds, keepers) {
    var used = {}; (keepers || []).forEach(function (k) { if (k.round) used[k.round] = true; });
    return pickSchedule(teams, slot, rounds).map(function (pick, i) {
      return { round: i + 1, pick: pick, keeper: !!used[i + 1] };
    });
  }

  /** P(player is still on the board when pick N comes around). */
  function survival(player, pickNumber) {
    var sd = Math.max(player.adp_sd || 6, 1.5);
    return 1 - normCdf((pickNumber - (player.adp || 200)) / sd);
  }

  /**
   * Expected best-available points at `nextPick` for each position, and the
   * per-player probability of being that best-available. This is the pair-aware
   * core: at a 3-pick gap almost everyone survives and VONA collapses toward
   * zero; at a 21-pick gap it dominates.
   */
  function expectedBestAvailable(available, nextPick, positions) {
    var out = {};
    (positions || ["QB", "RB", "WR", "TE", "K", "DEF"]).forEach(function (pos) {
      var pool = available.filter(function (p) { return p.pos === pos; })
                          .sort(function (a, b) { return b.pts - a.pts; })
                          .slice(0, 40);
      var carry = 1, exp = 0, top = [];
      for (var i = 0; i < pool.length; i++) {
        var s = survival(pool[i], nextPick);
        var pBest = carry * s;
        exp += pBest * pool[i].pts;
        top.push({ name: pool[i].name, p: pBest, pts: pool[i].pts });
        carry *= (1 - s);
        if (carry < 0.001) break;
      }
      // Anything left over: assume the worst survivor in the pool.
      if (carry > 0.001 && pool.length) exp += carry * pool[pool.length - 1].pts;
      out[pos] = { expected: exp, contenders: top.slice(0, 6) };
    });
    return out;
  }

  // ------------------------------------------------------ roster + need

  var POS_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF"];

  /** Fill starting slots greedily by points; leftovers go to the bench. */
  function assignRoster(myPlayers, rules) {
    var r = rules.roster || {}, flexEl = r.flexEligible || ["RB", "WR", "TE"];
    var slots = [], bench = [];
    POS_ORDER.forEach(function (pos) {
      for (var i = 0; i < (r[pos] || 0); i++) slots.push({ pos: pos, player: null });
    });
    var pool = myPlayers.slice().sort(function (a, b) { return b.pts - a.pts; });
    pool.forEach(function (p) {
      var slot = slots.find(function (s) { return !s.player && s.pos === p.pos; });
      if (!slot && flexEl.indexOf(p.pos) >= 0)
        slot = slots.find(function (s) { return !s.player && s.pos === "FLEX"; });
      if (slot) slot.player = p; else bench.push(p);
    });
    return { slots: slots, bench: bench, benchMax: r.BN || 6 };
  }

  /** Points scored by the best starting lineup this set of players can field. */
  function lineupPoints(players, rules) {
    return assignRoster(players, rules).slots.reduce(function (sum, s) {
      return sum + (s.player ? s.player.pts : 0);
    }, 0);
  }

  /**
   * What drafting this player adds to the lineup you can actually field, over
   * simply taking a freely available body at his position.
   *
   * This is value over replacement rewritten to know about your roster, and it
   * is the number the board is built on. Against an empty slot it reproduces
   * classic VOR almost exactly. Against a filled one it collapses: a third
   * tight end in a one-tight-end league is worth zero however good he is,
   * because he cannot enter the lineup and neither could the free body he is
   * being measured against. Classic VOR cannot see that — it compares every
   * player to a stranger at his position rather than to the player you already
   * own — which is how a board ends up recommending the same position twice in
   * a row to a manager who is already full there.
   */
  function marginalVor(player, myPlayers, rules, replacementPts, cache) {
    var pos = player.pos;
    var withRepl = cache && cache._replLineup ? cache._replLineup[pos] : null;
    if (withRepl == null) {
      withRepl = lineupPoints(myPlayers.concat([
        { name: "replacement " + pos, pos: pos, pts: replacementPts || 0 }]), rules);
      if (cache) (cache._replLineup = cache._replLineup || {})[pos] = withRepl;
    }
    return lineupPoints(myPlayers.concat([player]), rules) - withRepl;
  }

  /** Flex slots still open once your current players are placed optimally. */
  function openFlexSlots(myPlayers, rules) {
    return assignRoster(myPlayers, rules).slots.filter(function (s) {
      return s.pos === "FLEX" && !s.player;
    }).length;
  }

  /** Positional need, 0 (full) to 1 (nothing at all), plus hard caps. */
  function positionalNeed(myPlayers, rules, roundsLeft) {
    var r = rules.roster || {}, flexEl = r.flexEligible || ["RB", "WR", "TE"];
    var have = {}; myPlayers.forEach(function (p) { have[p.pos] = (have[p.pos] || 0) + 1; });
    // Ask the actual assignment how many flex slots are still empty rather than
    // subtracting surpluses position by position. The old arithmetic let three
    // positions each claim the same flex slot that one running back was already
    // sitting in.
    var need = {}, flexOpen = openFlexSlots(myPlayers, rules);
    ["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
      var want = r[pos] || 0, got = have[pos] || 0;
      var short = Math.max(0, want - got);
      var flexClaim = flexEl.indexOf(pos) >= 0 ? flexOpen * (FLEX_SPLIT[pos] || 0) : 0;
      need[pos] = { have: got, starters: want, short: short + flexClaim };
    });
    return need;
  }

  /**
   * The knobs, all in one place so the UI can explain any number it shows.
   * Score = (Value + VONA) × Bias + CeilingAdj − RiskAdj − ByePenalty
   *
   * "Value" is marginal value over replacement — what the player adds to the
   * lineup *you* can field, not to an average team's. Need used to live in a
   * multiplier applied on top of a roster-blind VOR, and that multiplier had a
   * dead zone: it counted bodies against starting slots, so the moment your
   * slots were full every position collapsed to the same flat discount and the
   * board reverted to pure best-available for the whole back half of the draft.
   * Need now lives inside the value term, where it cannot be flattened away.
   */
  function composite(player, ctx) {
    var round = ctx.round || 1, rounds = ctx.rounds || 15;
    var st = ctx.strategy || {};
    var need = ctx.need[player.pos] || { short: 0, have: 0, starters: 0 };
    var reasons = [];
    var replPts = ((ctx.replacement && ctx.replacement[player.pos]) || {}).points || 0;

    // Filling an empty starting slot is not the same decision as adding another
    // body, and one replacement number cannot tell the two apart.
    //
    // The rank replacementRanks() derives is a draft-start constant. By round 8 a
    // deep position has been picked down *to* it, so `marginal` for the very
    // player who would fill your empty slot comes out at zero. At pick 86 of a
    // real draft the WR2 slot was empty, replacement WR was fixed at WR29 before
    // pick 1, and the best receiver left on the board *was* WR29 — so filling the
    // hole scored 0.0 while a second tight end, behind a rostered tier-1 tight
    // end, kept 28% of a real open-market surplus and took the top of the board.
    // Across 200 seeded drafts that was every board in round 8, 200 times out of
    // 200.
    //
    // Against an empty slot the honest baseline is not a body from a table
    // computed before the draft began — it is the body you expect to be there at
    // your next pick, which expectedBestAvailable already computes. Taking the
    // lower of the two keeps this a strict correction: early, while the pool is
    // still well above the replacement rank, nothing moves at all.
    var slotBaseline = false;
    var slotEmpty = (ctx.rules.roster[player.pos] || 0) > (need.have || 0);
    if (slotEmpty && ctx.vona && ctx.vona[player.pos] &&
        ctx.vona[player.pos].expected < replPts) {
      replPts = ctx.vona[player.pos].expected;
      slotBaseline = true;
    }

    // How roster-aware the value term is. needWeight 0 is best-player-available:
    // classic value over replacement, which knows nothing about who you own. At
    // 1 it is what the player adds to the lineup you can actually field.
    var aware = Math.max(0, Math.min(1, st.needWeight != null ? st.needWeight : 1));
    var marginal = ctx.myPlayers
      ? marginalVor(player, ctx.myPlayers, ctx.rules, replPts, ctx) : player.vor;

    // A player who cannot start for you today is not worthless — he is one
    // injury from starting, he covers a bye, and the late rounds are where
    // upside is bought. So the open-market value he carries beyond his value to
    // your lineup is kept, at a fraction, and the fraction shrinks with every
    // body you already hold at the position. Value below replacement is kept
    // whole: on a picked-over board that is the only thing separating the
    // remaining players from each other, and discounting it would rank the tail
    // of the draft by noise.
    // How much a body who cannot start today is worth depends on how likely he
    // is to ever start, and that is a property of the position: a backup runs
    // into the lineup through injury, bye or the flex, and there are three such
    // doors at running back and one at quarterback. A second kicker or defense
    // has none worth counting — you stream those — which is why a backup D/ST
    // was being priced like a real pick.
    var flexEl2 = (ctx.rules.roster.flexEligible || ["RB", "WR", "TE"]);
    // The flex is a door only while it is still open. positionalNeed() was
    // fixed to ask openFlexSlots(); this line kept the old arithmetic and added
    // roster.FLEX for every flex-eligible position unconditionally, so a second
    // tight end sitting behind a filled flex was priced as though he had two
    // ways into the lineup when he has one. That is 0.280 where 0.077 is earned,
    // 3.6 times too high, and 2.7 times too high for a third receiver and a
    // fourth back. A player cannot walk through a door somebody is standing in.
    var lineupSpots = (ctx.rules.roster[player.pos] || 0) +
      (flexEl2.indexOf(player.pos) >= 0 && ctx.myPlayers
        ? openFlexSlots(ctx.myPlayers, ctx.rules)
        : (flexEl2.indexOf(player.pos) >= 0 ? (ctx.rules.roster.FLEX || 0) : 0));
    // Depth is counted against doors into the lineup, not against starting
    // slots. A backup reaches the field through injury, bye or the flex, and the
    // number of those doors is roster[pos] plus the flex if he is eligible for
    // it. Counting starters instead put the *first* unstartable body at every
    // position — the second quarterback in a one-QB league — at the same weight
    // as a starter, and only began discounting at the third.
    var benchDepth = Math.max(0, need.have - lineupSpots + 1);
    var benchWeight = (player.pos === "K" || player.pos === "DEF"
      ? 0.04 : Math.min(0.45, 0.14 * lineupSpots)) * Math.pow(0.55, benchDepth);
    var valueOf = function (pts, marg) {
      var open = pts - replPts;                       // what he is worth to anyone
      var lineup = open * (1 - aware) + marg * aware; // what he is worth to you
      var beyond = open - lineup;
      return lineup + (beyond > 0 ? benchWeight : 1) * beyond;
    };
    var value = valueOf(player.pts, marginal);


    // Value over next available, on the same footing. Scarcity at a position you
    // cannot start is worth nothing. The old VONA was per-position and therefore
    // identical for every tight end however many you already had, so taking one
    // never made the next one cheaper — which is why the same recommendation
    // kept coming back.
    var vona = 0;
    // With the empty-slot baseline in play, `value` is already measured against
    // what you would get at your next pick, so VONA here would be a second copy
    // of the same difference — exactly the double count the two clamps below
    // exist to prevent. The receiver who should have been the pick at 86 scored
    // 27.2 of value and another 27.2 of VONA before this guard.
    if (!slotBaseline && ctx.vona && ctx.vona[player.pos]) {
      var vkey = player.pos + ":" + aware;
      var vcache = (ctx._laterValue = ctx._laterValue || {});
      if (vcache[vkey] == null) {
        var laterPts = ctx.vona[player.pos].expected;
        var laterMarg = ctx.myPlayers
          ? marginalVor({ name: "later " + player.pos, pos: player.pos, pts: laterPts },
                        ctx.myPlayers, ctx.rules, replPts, ctx)
          : laterPts - replPts;
        vcache[vkey] = valueOf(laterPts, laterMarg);
      }
      // What waiting actually costs, and nothing more. Two clamps make it that.
      // The later body's value is floored at zero first: when everything left at
      // the position is below what your own lineup already fields, waiting costs
      // you nothing, and a negative later-value turned "there is nothing left
      // worth having" into an urgency bonus. Capping at `value` then keeps the
      // term a difference between two players rather than a second copy of the
      // first — the failure that let a quarterback outscore the whole board one
      // pick after a quarterback was drafted.
      vona = Math.max(0, Math.min(value, value - Math.max(0, vcache[vkey])));
    }

    // Need is carried by the value term now, so all that is left in the
    // multiplier is strategy bias and run pressure. Nothing about roster fit
    // can hide in here any more, which is the point: this is where it used to
    // flatten to one number for every position and stop discriminating.
    var mult = 1;
    if (ctx.runs && ctx.runs[player.pos]) { mult += 0.12; reasons.push(player.pos + " run in progress"); }

    // Positional bias. The early-round variant is what separates Hero RB (one
    // back, then pivot) from Zero RB (none until the pivot is forced).
    var early = round <= (st.earlyRounds || 5);
    var bias = 1;
    if (early && st.earlyPosBias && st.earlyPosBias[player.pos] != null) bias = st.earlyPosBias[player.pos];
    else if (st.posBias && st.posBias[player.pos] != null) bias = st.posBias[player.pos];
    if (bias !== 1) {
      mult *= bias;
      if (bias < 0.85) reasons.push(player.pos + " de-emphasized by your strategy");
      else if (bias > 1.15) reasons.push(player.pos + " prioritized by your strategy");
    }

    // Hard caps. A player who can never enter your lineup is not a pick, however
    // much surplus value he carries — the discount alone doesn't stop the board
    // stacking a position with a steep cliff (tight end, most years).
    var have = need.have;
    var blocked = null;
    var cap = depthCap(player.pos, ctx.rules.roster);
    if (have >= cap) blocked = "you already have " + have + " at " + player.pos;
    if (player.pos === "K" && have >= 1) blocked = "already have a kicker";
    if (player.pos === "DEF" && have >= (ctx.rules.roster.DEF || 1)) blocked = "already have a defense";
    if (player.pos === "QB" && have >= 2) blocked = "already have two quarterbacks";
    var floors = st.posFloorRound || {};
    var floor = floors[player.pos] != null ? floors[player.pos]
              : player.pos === "K" ? (ctx.kFloorRound || rounds - 1)
              : player.pos === "DEF" ? (ctx.defFloorRound || 7)
              : 1;
    if (round < floor) blocked = "no " + player.pos + " before round " + floor;
    /* A backup quarterback is a last-rounds pick, and the board has to know it.
       In a league that starts one, a second quarterback can never enter the
       lineup except on a bye or an injury — one week a year — and the waiver
       wire carries startable quarterbacks all season. The board kept
       recommending one in rounds 9 to 11 anyway, for a reason that has nothing
       to do with quarterbacks: twelve go in a twelve-team league, so the QB
       replacement line sits at rank 12 and there are still bodies above it late,
       while the receiver pool has been drafted forty deep and everyone left
       scores below its line. Sitting near your own position's replacement is
       not a virtue; it is a fact about how deeply the position is drafted.
       This is the same instrument as the kicker and defense floors, pointed at
       the same problem, and it moves with the roster: a superflex league can
       start two, so there the second one is a starter and nothing is blocked.
       The player stays on the board and stays draftable by hand — a floor makes
       him not-recommended, not forbidden. */
    var qbSlots = (ctx.rules.roster.QB || 0) +
      ((ctx.rules.roster.SUPERFLEX || 0) &&
       (ctx.rules.roster.superflexEligible || ["QB"]).indexOf("QB") >= 0
        ? (ctx.rules.roster.SUPERFLEX || 0) : 0);
    var qbFloor = floors.QB != null ? floors.QB : Math.max(1, rounds - 2);
    if (player.pos === "QB" && qbSlots <= 1 && have >= qbSlots && round < qbFloor) {
      blocked = "a backup QB is a round " + qbFloor + "+ pick — he plays one week a year";
    }

    // Ceiling/risk weighting shifts across the draft: buy floor early, buy
    // variance late. Six of twelve make the playoffs — late picks should swing.
    var t = Math.min(1, Math.max(0, (round - 3) / (rounds - 5)));
    var cw = st.ceilingWeight != null ? st.ceilingWeight : 1;
    var rw = st.riskWeight != null ? st.riskWeight : 1;
    // "Buy floor early" is Balanced's opinion, and a style is entitled to
    // disagree with it. The style weight only scaled the schedule's output,
    // which could never lift round one far above the 0.20 the schedule starts
    // at — so Upside hunter, whose entire content is a ceiling weight, was
    // nearly inert exactly where a draft is decided. Asking for more ceiling
    // now moves the schedule forward as well as scaling it, so the style is
    // heard in round one and not only in round twelve. At weight 1 both terms
    // vanish and the arithmetic is what it always was, so Balanced does not
    // move.
    var tc = cw >= 1 ? t + (Math.min(cw, 2) - 1) * (1 - t) : t;
    var wCeiling = (0.20 + 0.80 * tc) * cw;
    var wRisk = (1.00 - 0.70 * t) * rw;
    // Both grades are point adjustments — the 26 is a points scale — so they
    // have to stand on the same footing as the points they adjust. They did
    // not. `value` above discounts a body who cannot start for you down to
    // benchWeight, which is about 8% for a second quarterback or tight end;
    // these two were applied at full strength to the same player. The units
    // stopped matching, and in the rounds where every starting slot is filled
    // the consequence is the whole ranking: real surplus over replacement
    // arrives as ±1 while ceiling minus risk swings ±3, so the board sorts the
    // middle rounds by two hand-weighted grades and not by value at all. That
    // is how a backup quarterback behind a kept starter comes out first.
    //
    // A backup's upside reaches your team on exactly the weeks he does — an
    // injury, a bye, the flex — so it is discounted by the same fraction his
    // points are. `reaches` is that fraction, read off what actually survived
    // into `value` rather than recomputed, so the two can never drift apart.
    // For a player who improves the lineup today it is 1 and this is a no-op,
    // which is every pick of the early draft.
    var open0 = player.pts - replPts;
    var reaches = open0 > 0 ? Math.min(1, Math.max(benchWeight, value / open0))
                : marginal > 0.5 ? 1 : benchWeight;
    var ceilingAdj = player.ceiling ? ((player.ceiling - 70) / 100) * 26 * wCeiling * reaches : 0;
    var riskAdj = player.risk ? ((player.risk - 50) / 100) * 26 * wRisk * reaches : 0;

    // Bye penalty: only counts starters already parked on that week.
    var conflicts = ctx.byeCounts[player.bye] || 0;
    var byePenalty = conflicts >= (ctx.byeTolerance || 3) ? 5 * (conflicts - (ctx.byeTolerance || 3) + 1) : 0;

    // Extra penalty for the research layer's own flags, for managers who would
    // rather leave value on the table than roster a known problem.
    var tagPenalty = (st.tagPenalty && player.tag && st.tagPenalty[player.tag]) || 0;
    if (tagPenalty) reasons.push("flagged " + (TAG_LABEL[player.tag] || player.tag).toLowerCase());

    // An empty starting slot is a hole, and a hole scores nothing every Sunday.
    // Late in the draft that outweighs any value argument, so filling one pays a
    // bonus rather than a multiplier: by the end of a draft the only kickers and
    // defenses left are below replacement by construction, and multiplying a
    // negative number by 1.25 makes the pick look worse rather than more urgent.
    var bonus = 0;
    if (need.short > 0) {
      var pressure = Math.max(0, Math.min(1, 1 - (rounds - round) / 5));
      var urgency = 45 * pressure * Math.min(1, need.short);
      if (urgency > 1) {
        bonus += urgency;
        reasons.push("picks are running out to fill " + player.pos);
      }
    }

    // Stacking your quarterback's receivers, and handcuffing your own backs.
    if (st.stackBonus && ctx.stackTeams && ctx.stackTeams[player.team] &&
        ["WR", "TE"].indexOf(player.pos) >= 0) {
      bonus += st.stackBonus;
      reasons.push("stacks your " + player.team + " quarterback");
    }
    if (st.handcuffBonus && ctx.handcuffTeams && ctx.handcuffTeams[player.team] &&
        player.pos === "RB") {
      bonus += st.handcuffBonus;
      reasons.push("handcuffs your " + player.team + " back");
    }

    // Bias has to move a player in the direction the style intends whatever the
    // sign of his value. Multiplying does that only while the value is positive
    // and silently inverts the moment it is not — which is most of the back half
    // of a draft, where everyone left is below replacement. RB-heavy was pushing
    // late running backs *down* and Zero RB was pulling them *up*. Applying the
    // multiplier as a signed shift against the magnitude is identical arithmetic
    // wherever the old form was right, and correct where it was not.
    var raw = value + VONA_WEIGHT * vona;
    var base = raw + (mult - 1) * Math.abs(raw);
    var score = base + ceilingAdj - riskAdj - byePenalty - tagPenalty + bonus;
    if (blocked) score -= 1000;

    // While a starting slot is empty, a body that adds nothing to the lineup you
    // can field is never the pick, however much open-market surplus he carries.
    //
    // This is a guard on the ranking, not a valuation. It is applied uniformly to
    // every zero-marginal player, so on a board where nobody left can help it
    // reorders nothing — and it is a backstop on a correct value term rather than
    // a substitute for one. That distinction is load-bearing: measured before the
    // empty-slot pricing landed, this guard closed 930 invariant violations down
    // to 920 and moved the headline rate three tenths of a point, because in 925
    // of those 930 states no unblocked player anywhere on the board added a
    // single point to the starting lineup. It had nobody to promote. Do not ever
    // ship it as the fix for that; it is the fix for what is left after it.
    //
    // Behind the shipped pricing, over 200 seeded drafts, rounds 5-15: the
    // residual violation rate goes 5.5% -> 0.0% and the headline rate 2.45% ->
    // 0.0%, on every seed tried, while the median startable lineup does not move.
    // It changes the top of the board on 2.3% of picks.
    //
    // The 100 is a magic number and its safety comes from the top of the range,
    // not the bottom: unblocked scores at the states where this fires run about
    // -200 to +77, so a zero-marginal player at the very top lands near -23 and
    // still sits below any real positive-marginal alternative. Re-check it if the
    // scoring rules ever widen the *upper* end of that range.
    //
    // "Empty" has to mean empty and fillable. It used to count every slot with
    // nobody in it, and the kicker's slot is empty from pick 1 until round 14
    // because the floor rule forbids filling it — so from the round the rest of
    // the lineup came together until the round a kicker became legal, this
    // subtracted 100 from every player on the board at every pick. Uniformly,
    // so it reordered nothing, but it put the whole board at -98 to -101 and
    // made a score that reads as catastrophic the normal state of the middle
    // rounds. A slot you are not allowed to fill is not an argument against
    // taking somebody else.
    if (ctx.myPlayers && aware > 0.5 && marginal <= 0.5) {
      if (ctx._openStarters == null) {
        var fl = st.posFloorRound || {};
        ctx._openStarters = assignRoster(ctx.myPlayers, ctx.rules).slots
          .filter(function (s) {
            if (s.player) return false;
            var f = fl[s.pos] != null ? fl[s.pos]
                  : s.pos === "K" ? (ctx.kFloorRound || rounds - 1)
                  : s.pos === "DEF" ? (ctx.defFloorRound || 7) : 1;
            return round >= f;
          }).length;
      }
      if (ctx._openStarters > 0) score -= 100;
    }

    // The lead reason is the honest one: whether he can play for you at all.
    if (ctx.myPlayers && aware > 0.5 && marginal <= 0.5)
      reasons.push("can't crack your starting lineup — depth only");
    else if (need.short > 0.9) reasons.push("fills an empty " + player.pos + " slot");
    else if (marginal > 0.5 && need.have >= (need.starters || 0) && need.starters > 0) {
      // Season totals flatter a narrow upgrade. Eight points reads like a
      // headline and is half a point a Sunday, so say it in the unit that
      // decides the pick — and when it is that small, say what it costs too.
      var perWeek = Math.round(marginal / SEASON_WEEKS * 10) / 10;
      reasons.push(perWeek >= 1.5
        ? "upgrades your starting " + player.pos + " by " + perWeek + " pts a week"
        : "upgrades your starting " + player.pos + " by only " + perWeek +
          " pts a week, and benches the " + player.pos + " you have");
    }
    if (vona > 8) reasons.push("+" + Math.round(vona) + " over what's likely left at pick " + ctx.nextPick);
    // A player who cannot start is not adding anything "to your lineup", and
    // saying so directly under "can't crack your starting lineup" was the board
    // contradicting itself on the same card.
    if (value > 0.5 && ctx.replacement[player.pos]) {
      reasons.push(marginal > 0.5
        // Name the thing the number was actually measured against. Against an
        // empty slot that is no longer the static replacement rank, and printing
        // "over a free WR (WR29)" beside a figure computed from what is left at
        // the next pick is the card explaining itself with the wrong baseline.
        ? "+" + Math.round(value) + " to your lineup over " + (slotBaseline
            ? "what is likely left at pick " + ctx.nextPick
            : "a free " + player.pos +
              " (" + player.pos + String(ctx.replacement[player.pos].rank) + ")")
        : "best bench " + player.pos + " left — " + Math.round(player.vor) +
          " over a free one if you ever need him");
    }
    if (ceilingAdj > 6) reasons.push("ceiling grade " + player.ceiling);
    if (riskAdj > 6) reasons.push("risk grade " + player.risk);
    if (byePenalty) reasons.push(conflicts + " starters already on bye " + player.bye);
    if (player.adp && ctx.currentPick && player.adp - ctx.currentPick > 12)
      reasons.push(Math.round((player.adp - ctx.currentPick) / (ctx.rules.teams || 12) * 10) / 10 +
                   " rounds ahead of ADP");

    return { score: score, base: base, value: value, marginal: marginal, aware: aware,
             vona: vona, mult: mult, ceilingAdj: ceilingAdj,
             riskAdj: riskAdj, byePenalty: byePenalty, tagPenalty: tagPenalty,
             bonus: bonus, bias: bias, blocked: blocked, reasons: reasons };
  }

  /** Most bodies worth carrying at a position: starters, plus bench you can use. */
  function depthCap(pos, roster) {
    if (pos === "K") return 1;
    if (pos === "DEF") return roster.DEF || 1;
    if (pos === "QB") return 2;
    var flexEl = roster.flexEligible || ["RB", "WR", "TE"];
    var flexable = flexEl.indexOf(pos) >= 0;
    // +1, not +2. A one-TE league can justify a backup; the third body was
    // never startable and only existed because the old surplus discount had a
    // dead zone that let him through at full weight.
    if (pos === "TE") return (roster.TE || 1) + 1;
    return (roster[pos] || 0) + (flexable ? 4 : 2);
  }

  /** A standard normal draw from a uniform generator. Box-Muller. */
  function gauss(rnd) {
    var u = 1 - (rnd ? rnd() : Math.random()), v = (rnd ? rnd() : Math.random());
    return Math.sqrt(-2 * Math.log(u || 1e-9)) * Math.cos(2 * Math.PI * v);
  }

  /**
   * One pick by a team that is not you.
   *
   * A room does not take the top of a list. It takes *near* it, with a spread
   * that is a property of the player rather than a constant \u2014 a consensus
   * first-rounder goes within a pick or two of his ADP every time, a
   * late-round dart lands anywhere across two rounds \u2014 and it stops taking a
   * position once its own roster is full. Modeling those three things is the
   * difference between a rehearsal and a slideshow, and it is the same
   * per-player standard deviation the survival column already reads.
   *
   * `candidates` are { player, adp, sd, pct }: `adp` is the best number
   * available for that player, which is real completed-draft ADP where the user
   * has pasted it and mock-draft ADP otherwise.
   */
  function roomPick(candidates, rnd, opts) {
    opts = opts || {};
    var counts = opts.counts || {}, roster = opts.roster || {}, runs = opts.runs || {};
    var best = null, bestDraw = Infinity, fallback = null, fbDraw = Infinity;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i], pl = c.player;
      var sd = Math.max(c.sd || 6, 1.5);
      var draw = c.adp + sd * gauss(rnd);
      // A run pulls a room toward the position it is already taking. Half a
      // standard deviation is enough to be visible without stampeding.
      if (runs[pl.pos]) draw -= sd * 0.5;
      // Someone taken in only half of drafts is not reliably taken at his ADP.
      if (c.pct != null && c.pct < 100) draw += (100 - c.pct) * 0.12;
      if (draw < fbDraw) { fbDraw = draw; fallback = pl; }
      // Nobody drafts a third kicker. Opponents obey the same caps you do.
      if ((counts[pl.pos] || 0) >= depthCap(pl.pos, roster)) continue;
      if (draw < bestDraw) { bestDraw = draw; best = pl; }
    }
    return best || fallback;
  }

  /** \u22654 of the last 8 picks at one position. */
  function detectRuns(recentPicks) {
    var last = recentPicks.slice(-8), counts = {}, runs = {}, unknown = 0;
    last.forEach(function (p) {
      // A pick recorded as "didn't catch the name" has no position. Counting
      // those together made four of them in eight picks a run at "?", which put
      // a banner on screen announcing a run at a position that does not exist
      // — on the one flow the draft-day runbook tells the user to reach for when
      // they fall behind. An unknown pick is a gap in what we know, not evidence.
      if (!p.pos || p.pos === "?") { unknown++; return; }
      counts[p.pos] = (counts[p.pos] || 0) + 1;
    });
    Object.keys(counts).forEach(function (pos) {
      if (counts[pos] >= 4) runs[pos] = counts[pos];
    });
    return { runs: runs, counts: counts, window: last.length, unknown: unknown };
  }

  var API = {
    erf: erf, normCdf: normCdf, gamesOver: gamesOver, GAME_SD: GAME_SD,
    customPoints: customPoints, replacementRanks: replacementRanks, buildBoard: buildBoard,
    pickSchedule: pickSchedule, scheduleWithKeepers: scheduleWithKeepers,
    survival: survival, expectedBestAvailable: expectedBestAvailable,
    assignRoster: assignRoster, positionalNeed: positionalNeed,
    composite: composite, modelGrades: modelGrades,
    applyMarketSignals: applyMarketSignals, marketSignals: marketSignals, tdShare: tdShare, detectRuns: detectRuns, depthCap: depthCap, assignTiers: assignTiers,
    gauss: gauss, roomPick: roomPick, TAG_LABEL: TAG_LABEL,
    lineupPoints: lineupPoints, marginalVor: marginalVor, openFlexSlots: openFlexSlots,
    FLEX_SPLIT: FLEX_SPLIT, SUPERFLEX_SPLIT: SUPERFLEX_SPLIT
  };
  root.DRAFTLINE_ENGINE = API;
  if (typeof module !== "undefined") module.exports = API;
})(globalThis);
