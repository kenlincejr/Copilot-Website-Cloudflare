/* Scoring presets. Scoring is data, not code — every calculation reads one of
   these objects. Add a league by adding an object here (or in the app's
   Settings → Scoring form, which writes the same shape). */
globalThis.DRAFTLINE_PRESETS = {

  kinda_highlanders: {
    name: "Kinda Highlanders (Yahoo #257015)",
    blurb: "Ken's league. Full PPR, 4pt pass TD, 40+ yard bonuses, return yards, boosted D/ST tiers.",
    teams: 12,
    roster: { QB:1, RB:2, WR:2, TE:1, FLEX:1, K:1, DEF:1, BN:6, IR:2,
              flexEligible: ["RB","WR","TE"] },
    passing:   { yardsPerPoint:25, td:4, int:-2, twoPt:2,
                 bonus400:1, bonus500:2, comp40plus:1, td40plus:1 },
    rushing:   { yardsPerPoint:10, td:6, bonus150:1, bonus200:2,
                 run40plus:1, td40plus:1 },
    receiving: { perReception:1, yardsPerPoint:10, td:6, bonus150:1, bonus200:2,
                 rec40plus:1, td40plus:1 },
    misc:      { fumbleLost:-2, offFumbleRetTd:6, returnYardsPerPoint:20, returnTd:6 },
    kicking:   { fg0_19:3, fg20_29:3, fg30_39:3, fg40_49:4, fg50plus:5,
                 miss0_19:-1, miss20_29:-1, miss30_39:-1, miss40_49:0, miss50plus:0,
                 pat:1, patMiss:-1 },
    dst:       { sack:1, int:2, fumRec:2, td:6, safety:2, blockKick:2,
                 returnYardsPerPoint:20, returnTd:6, extraPointReturned:2,
                 pa0:25, pa1_6:20, pa7_13:14, pa14_20:10,
                 pa21_27:5, pa28_34:-1, pa35plus:-4 },
    fractional: true,
    bonusCumulative: true,
    playoffWeeks: [15,16,17]
  },

  yahoo_default: {
    name: "Yahoo default (half PPR)",
    blurb: "Yahoo's out-of-the-box public league. Used as the comparison baseline.",
    teams: 12,
    roster: { QB:1, RB:2, WR:2, TE:1, FLEX:1, K:1, DEF:1, BN:6, IR:1,
              flexEligible: ["RB","WR","TE"] },
    passing:   { yardsPerPoint:25, td:4, int:-1, twoPt:2 },
    rushing:   { yardsPerPoint:10, td:6 },
    receiving: { perReception:0.5, yardsPerPoint:10, td:6 },
    misc:      { fumbleLost:-2, offFumbleRetTd:6, returnYardsPerPoint:0, returnTd:6 },
    kicking:   { fg0_19:3, fg20_29:3, fg30_39:3, fg40_49:4, fg50plus:5,
                 miss0_19:0, miss20_29:0, miss30_39:0, miss40_49:0, miss50plus:0,
                 pat:1, patMiss:0 },
    dst:       { sack:1, int:2, fumRec:2, td:6, safety:2, blockKick:2,
                 returnYardsPerPoint:0, returnTd:6, extraPointReturned:2,
                 pa0:10, pa1_6:7, pa7_13:4, pa14_20:1,
                 pa21_27:0, pa28_34:-1, pa35plus:-4 },
    fractional: true,
    bonusCumulative: true,
    playoffWeeks: [15,16,17]
  },

  ppr_standard: {
    name: "Full PPR, standard everything else",
    blurb: "The scoring consensus ADP is actually built on. No bonuses.",
    teams: 12,
    roster: { QB:1, RB:2, WR:2, TE:1, FLEX:1, K:1, DEF:1, BN:6, IR:1,
              flexEligible: ["RB","WR","TE"] },
    passing:   { yardsPerPoint:25, td:4, int:-2, twoPt:2 },
    rushing:   { yardsPerPoint:10, td:6 },
    receiving: { perReception:1, yardsPerPoint:10, td:6 },
    misc:      { fumbleLost:-2, offFumbleRetTd:6, returnYardsPerPoint:0, returnTd:6 },
    kicking:   { fg0_19:3, fg20_29:3, fg30_39:3, fg40_49:4, fg50plus:5,
                 miss0_19:0, miss20_29:0, miss30_39:0, miss40_49:0, miss50plus:0,
                 pat:1, patMiss:0 },
    dst:       { sack:1, int:2, fumRec:2, td:6, safety:2, blockKick:2,
                 returnYardsPerPoint:0, returnTd:6, extraPointReturned:2,
                 pa0:10, pa1_6:7, pa7_13:4, pa14_20:1,
                 pa21_27:0, pa28_34:-1, pa35plus:-4 },
    fractional: true,
    bonusCumulative: true,
    playoffWeeks: [15,16,17]
  },

  standard_non_ppr: {
    name: "Standard (no PPR)",
    blurb: "Old-school scoring. Receptions worth nothing.",
    teams: 12,
    roster: { QB:1, RB:2, WR:2, TE:1, FLEX:1, K:1, DEF:1, BN:6, IR:1,
              flexEligible: ["RB","WR","TE"] },
    passing:   { yardsPerPoint:25, td:4, int:-2, twoPt:2 },
    rushing:   { yardsPerPoint:10, td:6 },
    receiving: { perReception:0, yardsPerPoint:10, td:6 },
    misc:      { fumbleLost:-2, offFumbleRetTd:6, returnYardsPerPoint:0, returnTd:6 },
    kicking:   { fg0_19:3, fg20_29:3, fg30_39:3, fg40_49:4, fg50plus:5,
                 miss0_19:0, miss20_29:0, miss30_39:0, miss40_49:0, miss50plus:0,
                 pat:1, patMiss:0 },
    dst:       { sack:1, int:2, fumRec:2, td:6, safety:2, blockKick:2,
                 returnYardsPerPoint:0, returnTd:6, extraPointReturned:2,
                 pa0:10, pa1_6:7, pa7_13:4, pa14_20:1,
                 pa21_27:0, pa28_34:-1, pa35plus:-4 },
    fractional: true,
    bonusCumulative: true,
    playoffWeeks: [15,16,17]
  }
};

if (typeof module !== "undefined") module.exports = globalThis.DRAFTLINE_PRESETS;
