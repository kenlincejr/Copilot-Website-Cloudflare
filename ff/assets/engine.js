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
    ["QB", "RB", "WR", "TE", "K", "DEF"].forEach(function (pos) {
      var starters = teams * (r[pos] || 0);
      var flex = (r.FLEX || 0) * teams * (flexEl.indexOf(pos) >= 0 ? (FLEX_SPLIT[pos] || 0) : 0);
      out[pos] = Math.max(1, Math.round(starters + flex));
    });
    return out;
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
    var lineupSpots = (ctx.rules.roster[player.pos] || 0) +
      (flexEl2.indexOf(player.pos) >= 0 ? (ctx.rules.roster.FLEX || 0) : 0);
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
    if (ctx.vona && ctx.vona[player.pos]) {
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

    // Ceiling/risk weighting shifts across the draft: buy floor early, buy
    // variance late. Six of twelve make the playoffs — late picks should swing.
    var t = Math.min(1, Math.max(0, (round - 3) / (rounds - 5)));
    var wCeiling = 0.20 + 0.80 * t, wRisk = 1.00 - 0.70 * t;
    var ceilingAdj = player.ceiling ? ((player.ceiling - 70) / 100) * 26 * wCeiling : 0;
    var riskAdj = player.risk ? ((player.risk - 50) / 100) * 26 * wRisk : 0;
    ceilingAdj *= (st.ceilingWeight != null ? st.ceilingWeight : 1);
    riskAdj *= (st.riskWeight != null ? st.riskWeight : 1);

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
        ? "+" + Math.round(value) + " to your lineup over a free " + player.pos +
          " (" + player.pos + String(ctx.replacement[player.pos].rank) + ")"
        : "best bench " + player.pos + " left — " + Math.round(player.vor) +
          " over a free one if you ever need him");
    }
    if (ceilingAdj > 6) reasons.push("ceiling grade " + player.ceiling);
    if (riskAdj > 6) reasons.push("risk grade " + player.risk);
    if (byePenalty) reasons.push(conflicts + " starters already on bye " + player.bye);
    if (player.adp && ctx.currentPick && player.adp - ctx.currentPick > 12)
      reasons.push(Math.round((player.adp - ctx.currentPick) / (ctx.rules.teams || 12) * 10) / 10 +
                   " rounds ahead of ADP");

    return { score: score, value: value, marginal: marginal, aware: aware,
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
    var last = recentPicks.slice(-8), counts = {}, runs = {};
    last.forEach(function (p) { counts[p.pos] = (counts[p.pos] || 0) + 1; });
    Object.keys(counts).forEach(function (pos) {
      if (counts[pos] >= 4) runs[pos] = counts[pos];
    });
    return { runs: runs, counts: counts, window: last.length };
  }

  var API = {
    erf: erf, normCdf: normCdf, gamesOver: gamesOver, GAME_SD: GAME_SD,
    customPoints: customPoints, replacementRanks: replacementRanks, buildBoard: buildBoard,
    pickSchedule: pickSchedule, scheduleWithKeepers: scheduleWithKeepers,
    survival: survival, expectedBestAvailable: expectedBestAvailable,
    assignRoster: assignRoster, positionalNeed: positionalNeed,
    composite: composite, detectRuns: detectRuns, depthCap: depthCap, assignTiers: assignTiers,
    gauss: gauss, roomPick: roomPick, TAG_LABEL: TAG_LABEL,
    lineupPoints: lineupPoints, marginalVor: marginalVor, openFlexSlots: openFlexSlots,
    FLEX_SPLIT: FLEX_SPLIT
  };
  root.DRAFTLINE_ENGINE = API;
  if (typeof module !== "undefined") module.exports = API;
})(globalThis);
