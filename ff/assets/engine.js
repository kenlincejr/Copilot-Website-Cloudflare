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

  /** Positional need, 0 (full) to 1 (nothing at all), plus hard caps. */
  function positionalNeed(myPlayers, rules, roundsLeft) {
    var r = rules.roster || {}, flexEl = r.flexEligible || ["RB", "WR", "TE"];
    var have = {}; myPlayers.forEach(function (p) { have[p.pos] = (have[p.pos] || 0) + 1; });
    var need = {}, flexOpen = r.FLEX || 0;
    flexEl.forEach(function (pos) {
      flexOpen -= Math.max(0, (have[pos] || 0) - (r[pos] || 0));
    });
    flexOpen = Math.max(0, flexOpen);
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
   * Score = (VOR + VONA) × NeedMultiplier + CeilingAdj − RiskAdj − ByePenalty
   */
  function composite(player, ctx) {
    var round = ctx.round || 1, rounds = ctx.rounds || 15;
    var need = ctx.need[player.pos] || { short: 0, have: 0, starters: 0 };
    var reasons = [];

    var vona = ctx.vona && ctx.vona[player.pos]
      ? player.pts - ctx.vona[player.pos].expected : 0;

    // Need multiplier. An empty starting slot is worth real weight — a player who
    // can't get into your lineup is worth less than one who can, however good he
    // is. Depth at a position you only start one of is discounted hardest.
    var mult;
    if (need.short > 0) {
      mult = 1 + 0.50 * Math.min(1, need.short / 2);
      if (rounds - round <= 3 && need.short >= 1) mult += 0.15;   // running out of picks
    } else {
      // Surplus beyond starters plus one flex-able backup. Each extra body at a
      // position compounds the discount, which is what stops a late-round board
      // from stacking a fifth tight end it can never start.
      var flexEl = (ctx.rules.roster.flexEligible || ["RB", "WR", "TE"]);
      var room = (ctx.rules.roster[player.pos] || 0) + (flexEl.indexOf(player.pos) >= 0 ? 1 : 0);
      var surplus = Math.max(0, need.have - room);
      mult = 0.75 * Math.pow(0.60, surplus);
    }
    if (ctx.runs && ctx.runs[player.pos]) { mult += 0.12; reasons.push(player.pos + " run in progress"); }

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
    if ((player.pos === "K") && round < (ctx.kFloorRound || rounds - 1))
      blocked = "kickers wait until round " + (ctx.kFloorRound || rounds - 1);
    if (player.pos === "DEF" && round < (ctx.defFloorRound || 7))
      blocked = "no defenses before round " + (ctx.defFloorRound || 7);

    // Ceiling/risk weighting shifts across the draft: buy floor early, buy
    // variance late. Six of twelve make the playoffs — late picks should swing.
    var t = Math.min(1, Math.max(0, (round - 3) / (rounds - 5)));
    var wCeiling = 0.20 + 0.80 * t, wRisk = 1.00 - 0.70 * t;
    var ceilingAdj = player.ceiling ? ((player.ceiling - 70) / 100) * 26 * wCeiling : 0;
    var riskAdj = player.risk ? ((player.risk - 50) / 100) * 26 * wRisk : 0;

    // Bye penalty: only counts starters already parked on that week.
    var conflicts = ctx.byeCounts[player.bye] || 0;
    var byePenalty = conflicts >= (ctx.byeTolerance || 3) ? 5 * (conflicts - (ctx.byeTolerance || 3) + 1) : 0;

    var base = (player.vor + vona) * mult;
    var score = base + ceilingAdj - riskAdj - byePenalty;
    if (blocked) score -= 1000;

    if (need.short > 0.9) reasons.push("fills an empty " + player.pos + " slot");
    else if (mult < 0.7) reasons.push("depth only — your " + player.pos + " slots are full");
    if (vona > 8) reasons.push("+" + Math.round(vona) + " over what's likely left at pick " + ctx.nextPick);
    if (player.vor > 0 && ctx.replacement[player.pos])
      reasons.push("+" + Math.round(player.vor) + " over replacement (" +
                   player.pos + String(ctx.replacement[player.pos].rank) + ")");
    if (ceilingAdj > 6) reasons.push("ceiling grade " + player.ceiling);
    if (riskAdj > 6) reasons.push("risk grade " + player.risk);
    if (byePenalty) reasons.push(conflicts + " starters already on bye " + player.bye);
    if (player.adp && ctx.currentPick && player.adp - ctx.currentPick > 12)
      reasons.push(Math.round((player.adp - ctx.currentPick) / (ctx.rules.teams || 12) * 10) / 10 +
                   " rounds ahead of ADP");

    return { score: score, vona: vona, mult: mult, ceilingAdj: ceilingAdj,
             riskAdj: riskAdj, byePenalty: byePenalty, blocked: blocked, reasons: reasons };
  }

  /** Most bodies worth carrying at a position: starters, plus bench you can use. */
  function depthCap(pos, roster) {
    if (pos === "K") return 1;
    if (pos === "DEF") return roster.DEF || 1;
    if (pos === "QB") return 2;
    var flexEl = roster.flexEligible || ["RB", "WR", "TE"];
    var flexable = flexEl.indexOf(pos) >= 0;
    if (pos === "TE") return (roster.TE || 1) + (flexable ? 2 : 1);
    return (roster[pos] || 0) + (flexable ? 4 : 2);
  }

  /** ≥4 of the last 8 picks at one position. */
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
    composite: composite, detectRuns: detectRuns, depthCap: depthCap, FLEX_SPLIT: FLEX_SPLIT
  };
  root.DRAFTLINE_ENGINE = API;
  if (typeof module !== "undefined") module.exports = API;
})(globalThis);
