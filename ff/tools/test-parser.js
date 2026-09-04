/* node ff/tools/test-parser.js — exercises the league-settings paste parser the
   way a Yahoo settings page actually arrives on the clipboard:
       Label <tab> League Value <tab> Yahoo Default Value
   The league value is the first one. Getting that backwards would silently load
   somebody else's scoring, so it is the thing this test cares most about. */

var fs = require("fs"), path = require("path");
var src = fs.readFileSync(path.join(__dirname, "..", "assets", "app.js"), "utf8");
// Lift the parser out of the app's IIFE so it can run headless.
var slice = src.slice(src.indexOf("var SYN = ["), src.indexOf('$("#parseBtn")'));
eval(slice);

var paste = [
  "Max Teams\t12\t10",
  "Roster Positions\tQB, WR, WR, RB, RB, TE, W/R/T, K, DEF, BN, BN, BN, BN, BN, BN, IR, IR",
  "Fractional Points\tYes\tNo",
  "Playoff Weeks\t15, 16, 17\t15, 16, 17",
  "Passing Yards\t25 yards per point; 1 points at 400 yards; 2 points at 500 yards\t25 yards per point",
  "Passing Touchdowns\t4\t4",
  "Interceptions\t-2\t-1",
  "40+ Yard Completion Bonus\t1\t0",
  "40+ Yard Passing Touchdown Bonus\t1\t0",
  "Rushing Yards\t10 yards per point; 1 points at 150 yards; 2 points at 200 yards\t10 yards per point",
  "Rushing Touchdowns\t6\t6",
  "40+ Yard Rush Bonus\t1\t0",
  "40+ Yard Rushing Touchdown Bonus\t1\t0",
  "Receptions\t1\t0.5",
  "Receiving Yards\t10 yards per point; 1 points at 150 yards; 2 points at 200 yards\t10 yards per point",
  "Receiving Touchdowns\t6\t6",
  "40+ Yard Reception Bonus\t1\t0",
  "40+ Yard Receiving Touchdown Bonus\t1\t0",
  "Return Yards\t20\t0",
  "Return Touchdowns\t6\t6",
  "Fumbles Lost\t-2\t-2",
  "Sacks\t1\t1",
  "Fumble Recovery\t2\t2",
  "Safety\t2\t2",
  "Blocked Kick\t2\t2",
  "Points Allowed 0 points\t25\t10",
  "Points Allowed 1-6 points\t20\t7",
  "Points Allowed 7-13 points\t14\t4",
  "Points Allowed 14-20 points\t10\t1",
  "Points Allowed 21-27 points\t5\t0",
  "Points Allowed 28-34 points\t-1\t-1",
  "Points Allowed 35+ points\t-4\t-4",
  "Field Goals 0-19 Yards\t3\t3",
  "Field Goals 20-29 Yards\t3\t3",
  "Field Goals 30-39 Yards\t3\t3",
  "Field Goals 40-49 Yards\t4\t4",
  "Field Goals 50+ Yards\t5\t5",
  "Missed Field Goal 0-19 Yards\t-1\t0",
  "Point After Attempt Made\t1\t1",
  "Point After Attempt Missed\t-1\t0"
].join("\n");

var r = parseSettings(paste);
var map = {};
r.hits.forEach(function (h) { if (h[2]) map[h[2].join(".")] = h[1]; });

var pass = 0, fail = 0;
function is(label, actual, expected) {
  var okv = actual === expected;
  (okv ? pass++ : fail++);
  console.log((okv ? "  ok   " : "  FAIL ") + label + "  — got " + JSON.stringify(actual) +
              (okv ? "" : ", expected " + JSON.stringify(expected)));
}

console.log("\nconfidence " + (r.confidence * 100).toFixed(0) + "%, " +
            r.hits.length + " recognised, " + r.missed.length + " skipped");

console.log("\n== Takes the league value, never Yahoo's default ==");
is("interception is -2, not -1",      map["passing.int"], -2);
is("reception is 1, not 0.5",         map["receiving.perReception"], 1);
is("shutout is 25, not 10",           map["dst.pa0"], 25);
is("7-13 allowed is 14, not 4",       map["dst.pa7_13"], 14);
is("return yards 20, not 0",          map["misc.returnYardsPerPoint"], 20);
is("missed FG 0-19 is -1, not 0",     map["kicking.miss0_19"], -1);
is("made FG 0-19 survives the miss line", map["kicking.fg0_19"], 3);
is("missed PAT is -1, not 0",         map["kicking.patMiss"], -1);

console.log("\n== Compound strings split into yardage plus bonuses ==");
is("passing yards per point",  map["passing.yardsPerPoint"], 25);
is("bonus at 400",             map["passing.bonus400"], 1);
is("bonus at 500",             map["passing.bonus500"], 2);
is("rushing bonus at 150",     map["rushing.bonus150"], 1);
is("receiving bonus at 200",   map["receiving.bonus200"], 2);

console.log("\n== 40+ yard rules land in the right category ==");
is("40+ completion",       map["passing.comp40plus"], 1);
is("40+ passing TD",       map["passing.td40plus"], 1);
is("40+ rush",             map["rushing.run40plus"], 1);
is("40+ rushing TD",       map["rushing.td40plus"], 1);
is("40+ reception",        map["receiving.rec40plus"], 1);
is("40+ receiving TD",     map["receiving.td40plus"], 1);

console.log("\n== Roster and league shape ==");
is("teams",     r.draft.teams, 12);
is("QB slots",  r.draft.roster.QB, 1);
is("RB slots",  r.draft.roster.RB, 2);
is("WR slots",  r.draft.roster.WR, 2);
is("W/R/T becomes FLEX", r.draft.roster.FLEX, 1);
is("bench",     r.draft.roster.BN, 6);
is("IR",        r.draft.roster.IR, 2);
is("fractional points", r.draft.fractional, true);
is("playoff weeks deduped", JSON.stringify(r.draft.playoffWeeks), "[15,16,17]");

console.log("\n== Nothing silently dropped ==");
is("no unrecognised lines", r.missed.length, 0);

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
