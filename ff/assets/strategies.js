/* Draft styles.
   Each one is a set of overrides on the composite score in engine.js — nothing
   here is opinion the engine can't act on, and the app shows the user exactly
   which knobs moved and which players moved with them.

   The taxonomy is the one the 2026 coverage actually uses. Two notes on that:
   Hero RB is the prevalent middle ground this year rather than Zero RB, and the
   market has swung back toward taking backs early after a couple of seasons of
   the reverse — so Zero RB is genuinely contrarian in 2026, not the default
   smart-money play it was billed as. "Robust RB" barely appears in current
   writing; it is included as RB-heavy because people still draft that way, not
   because analysts are recommending it.

   Knobs, all optional:
     posBias         {pos: 0.5-1.5}  multiplies the need multiplier
     earlyPosBias    {pos: 0.5-1.5}  same, but only through `earlyRounds`
     earlyRounds     int             where "early" stops (default 5)
     needWeight      0-2             0 = pure best-player-available
     ceilingWeight   0-2             scales the upside adjustment
     riskWeight      0-2             scales the risk penalty
     byeTolerance    2-6             starters on one bye before it costs points
     posFloorRound   {pos: round}    earliest round the position is allowed
     tagPenalty      {TAG: points}   extra penalty on research flags
     stackBonus      points          WR/TE sharing a team with your QB
     handcuffBonus   points          RB sharing a team with an RB you own
*/
globalThis.DRAFTLINE_STRATEGIES = {

  balanced: {
    name: "Balanced",
    tagline: "Value over replacement, need as a tiebreaker.",
    detail: "The default. Takes the best value on the board, leans toward positions " +
            "you still need to start, and buys floor early and ceiling late.",
    knobs: {}
  },

  hero_rb: {
    name: "Hero RB",
    tagline: "One anchor back, then pivot to receivers.",
    detail: "The prevalent 2026 approach. Take one high-end running back early as an " +
            "anchor, then largely ignore the position while everyone else is paying up, " +
            "and come back for volume later. Hedges against running-back volatility " +
            "without punting the position entirely.",
    knobs: {
      earlyRounds: 5,
      earlyPosBias: { RB: 0.78, WR: 1.18, TE: 1.05 },
      posBias: { RB: 1.05, WR: 1.0 },
      handcuffBonus: 5
    }
  },

  zero_rb: {
    name: "Zero RB",
    tagline: "No backs until the middle rounds. Contrarian in 2026.",
    detail: "Avoid running backs through roughly the first five rounds, loading up on " +
            "receivers and a tight end, then attack the position late where the hit rate " +
            "is better than the price. Worth knowing that the 2026 market has moved back " +
            "toward RB-early, so this is a genuinely contrarian position this season " +
            "rather than the consensus edge it was billed as.",
    knobs: {
      earlyRounds: 5,
      earlyPosBias: { RB: 0.45, WR: 1.3, TE: 1.15 },
      posBias: { RB: 1.15 },
      ceilingWeight: 1.25,
      handcuffBonus: 8
    }
  },

  rb_heavy: {
    name: "RB-heavy",
    tagline: "Backs with the first two or three picks.",
    detail: "Corner the scarcest position early and live with thinner receivers. The " +
            "2026 running-back renaissance has more RBs going in the first two rounds " +
            "than receivers, so this is closer to the market than it has been in years.",
    knobs: {
      earlyRounds: 4,
      earlyPosBias: { RB: 1.35, WR: 0.88 },
      posBias: { RB: 1.05 },
      riskWeight: 1.15
    }
  },

  elite_te: {
    name: "Elite tight end",
    tagline: "Pay for the position where the gap is widest.",
    detail: "Take one of the top tight ends early and hold a weekly advantage at the " +
            "position with the steepest cliff. Costs you a mid-round starter elsewhere, " +
            "and only pays if the elite ones stay healthy.",
    knobs: {
      earlyRounds: 5,
      earlyPosBias: { TE: 1.45 },
      posFloorRound: { TE: 1 }
    }
  },

  upside: {
    name: "Upside hunter",
    tagline: "Buy variance. Second place pays nothing.",
    detail: "Weight ceiling hard and stop penalising risk. Right when only a few teams " +
            "make the playoffs and you need league-winners rather than a steady 8-6.",
    knobs: { ceilingWeight: 1.9, riskWeight: 0.45 }
  },

  floor: {
    name: "Floor first",
    tagline: "Avoid the landmines, take the boring points.",
    detail: "Weight consistency and availability, and pay extra attention to the " +
            "research layer's injury and landmine flags. Right in a league where over " +
            "half the teams make the playoffs and simply not losing is enough.",
    knobs: {
      ceilingWeight: 0.55, riskWeight: 1.7,
      tagPenalty: { LANDMINE: 18, INJURY: 14, AVOID: 16 }
    }
  },

  bpa: {
    name: "Best player available",
    tagline: "Ignore need entirely. Sort it out later.",
    detail: "Turns the need multiplier off completely and drafts pure value over " +
            "replacement. Produces lopsided rosters on purpose, on the theory that you " +
            "can trade or stream your way out of an imbalance but not out of a bad pick.",
    knobs: { needWeight: 0 }
  },

  stack: {
    name: "Stack the quarterback",
    tagline: "Correlate your scoring with your own passer.",
    detail: "Bonus for receivers and tight ends who share a team with a quarterback you " +
            "already roster. Raises your ceiling in the weeks that offense goes off, at " +
            "the cost of a worse floor when it doesn't.",
    knobs: { stackBonus: 10, ceilingWeight: 1.2 }
  }
};

/* Every knob the app will accept from a model, with hard bounds. Anything not
   on this list is discarded, and anything on it is clamped — a language model
   proposing values is a suggestion, not an instruction. */
globalThis.DRAFTLINE_KNOB_SPEC = {
  earlyRounds:   { type: "int",  min: 1,   max: 10 },
  needWeight:    { type: "num",  min: 0,   max: 2 },
  ceilingWeight: { type: "num",  min: 0,   max: 2 },
  riskWeight:    { type: "num",  min: 0,   max: 2 },
  byeTolerance:  { type: "int",  min: 2,   max: 6 },
  stackBonus:    { type: "num",  min: 0,   max: 25 },
  handcuffBonus: { type: "num",  min: 0,   max: 25 },
  posBias:       { type: "map",  min: 0.4, max: 1.6, keys: ["QB","RB","WR","TE","K","DEF"] },
  earlyPosBias:  { type: "map",  min: 0.3, max: 1.6, keys: ["QB","RB","WR","TE","K","DEF"] },
  posFloorRound: { type: "map",  min: 1,   max: 20,  keys: ["QB","RB","WR","TE","K","DEF"], int: true },
  tagPenalty:    { type: "map",  min: 0,   max: 40,
                   keys: ["LANDMINE","INJURY","AVOID","FALLER","SLEEPER","BREAKOUT","RISER","FLAG_PLANT"] }
};

if (typeof module !== "undefined") module.exports = globalThis.DRAFTLINE_STRATEGIES;
