/* node ff/tools/test-parser.js
   Runs the settings parser against a verbatim capture of a real Yahoo
   "Scoring & Settings" page (tools/fixtures/yahoo-settings.txt).

   The assertions that matter are the ones about settings that DIFFER from
   Yahoo's defaults. Yahoo renders those as three lines — label, the words
   "Yahoo Default", then "<league value> <yahoo value>" — and they are exactly
   the settings a custom-scoring tool exists to handle. Reading the second
   number, or skipping the row because the label line has no number on it,
   would load somebody else's league quietly and confidently. */

var fs = require("fs"), path = require("path");
var P = require("../assets/parser.js");

var text = fs.readFileSync(path.join(__dirname, "fixtures", "yahoo-settings.txt"), "utf8");
var r = P.parse(text);
var S = r.scoring;

var pass = 0, fail = 0;
function is(label, actual, expected) {
  var okv = actual === expected;
  (okv ? pass++ : fail++);
  console.log((okv ? "  ok   " : "  FAIL ") + label.padEnd(46) + " got " + JSON.stringify(actual) +
              (okv ? "" : "   EXPECTED " + JSON.stringify(expected)));
}

console.log("\nconfidence " + (r.confidence * 100).toFixed(0) + "%, " +
            r.hits.length + " recognized, " + r.missed.length + " unrecognized");

console.log("\n== Changed from Yahoo default (the three-line form) ==");
is("interceptions -2, not -1",        S.passing.int, -2);
is("receptions 1, not 0.5",           S.receiving.perReception, 1);
is("40+ yard completion 1, not 0",    S.passing.comp40plus, 1);
is("40+ yard passing TD 1, not 0",    S.passing.td40plus, 1);
is("40+ yard run 1, not 0",           S.rushing.run40plus, 1);
is("40+ yard rushing TD 1, not 0",    S.rushing.td40plus, 1);
is("40+ yard reception 1, not 0",     S.receiving.rec40plus, 1);
is("40+ yard receiving TD 1, not 0",  S.receiving.td40plus, 1);
is("missed FG 0-19 is -1, not 0",     S.kicking.miss0_19, -1);
is("missed FG 20-29 is -1, not 0",    S.kicking.miss20_29, -1);
is("missed FG 30-39 is -1, not 0",    S.kicking.miss30_39, -1);
is("missed PAT -1, not 0",            S.kicking.patMiss, -1);

console.log("\n== Points allowed: the tier number is in the LABEL ==");
is("0 points allowed = 25, not 0",    S.dst.pa0, 25);
is("1-6 = 20, not 1",                 S.dst.pa1_6, 20);
is("7-13 = 14, not 7",                S.dst.pa7_13, 14);
is("14-20 = 10, not 14",              S.dst.pa14_20, 10);
is("21-27 = 5, not 21",               S.dst.pa21_27, 5);
is("28-34 = -1",                      S.dst.pa28_34, -1);
is("35+ = -4",                        S.dst.pa35plus, -4);

console.log("\n== Same label, different section ==");
is("offense interceptions -2",        S.passing.int, -2);
is("D/ST interception 2",             S.dst.int, 2);
is("offense return yards per pt 20",  S.misc.returnYardsPerPoint, 20);
is("D/ST return yards per pt 20",     S.dst.returnYardsPerPoint, 20);
is("D/ST touchdown 6",                S.dst.td, 6);
is("D/ST return TD 6",                S.dst.returnTd, 6);

console.log("\n== Compound yardage strings ==");
is("passing yards per point 25",      S.passing.yardsPerPoint, 25);
is("passing bonus at 400",            S.passing.bonus400, 1);
is("passing bonus at 500",            S.passing.bonus500, 2);
is("rushing yards per point 10",      S.rushing.yardsPerPoint, 10);
is("rushing bonus at 150",            S.rushing.bonus150, 1);
is("rushing bonus at 200",            S.rushing.bonus200, 2);
is("receiving bonus at 150",          S.receiving.bonus150, 1);
is("receiving bonus at 200",          S.receiving.bonus200, 2);

console.log("\n== Straightforward rows ==");
is("passing TD 4",                    S.passing.td, 4);
is("rushing TD 6",                    S.rushing.td, 6);
is("receiving TD 6",                  S.receiving.td, 6);
is("fumbles lost -2",                 S.misc.fumbleLost, -2);
is("offensive fumble return TD 6",    S.misc.offFumbleRetTd, 6);
is("2-point conversion 2",            S.passing.twoPt, 2);
is("FG 0-19 stays 3 despite the miss row", S.kicking.fg0_19, 3);
is("FG 50+ 5",                        S.kicking.fg50plus, 5);
is("PAT made 1",                      S.kicking.pat, 1);
is("sack 1",                          S.dst.sack, 1);
is("safety 2",                        S.dst.safety, 2);
is("block kick 2",                    S.dst.blockKick, 2);
is("extra point returned 2",          S.dst.extraPointReturned, 2);

console.log("\n== League shape ==");
is("teams 12",                        r.draft.teams, 12);
is("QB 1",                            r.draft.roster.QB, 1);
is("RB 2",                            r.draft.roster.RB, 2);
is("WR 2",                            r.draft.roster.WR, 2);
is("TE 1",                            r.draft.roster.TE, 1);
is("W/R/T becomes FLEX",              r.draft.roster.FLEX, 1);
is("K 1",                             r.draft.roster.K, 1);
is("DEF 1",                           r.draft.roster.DEF, 1);
is("bench 6",                         r.draft.roster.BN, 6);
is("IR 2",                            r.draft.roster.IR, 2);
is("fractional points",               r.draft.fractional, true);
is("playoff weeks",                   JSON.stringify(r.draft.playoffWeeks), "[15,16,17]");
is("acquisitions per week 4",         r.draft.maxAcqPerWeek, 4);

console.log("\n== It matches the preset built by hand from the same league ==");
var preset = require("../assets/presets.js").kinda_highlanders;
["passing", "rushing", "receiving", "misc", "kicking", "dst"].forEach(function (grp) {
  Object.keys(preset[grp]).forEach(function (k) {
    if (S[grp] && S[grp][k] !== undefined) is(grp + "." + k, S[grp][k], preset[grp][k]);
  });
});

if (r.missed.length) {
  console.log("\nUnrecognised lines (shown to the user, never silently dropped):");
  r.missed.forEach(function (m) { console.log("   " + m); });
}

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
