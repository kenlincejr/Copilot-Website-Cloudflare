/* Parser for Yahoo's "Draft Analysis" page.
   https://football.fantasysports.yahoo.com/f1/<league>/draftanalysis

   Worth having because it is the one free source of ADP from *real completed
   drafts* on the platform this league actually runs on, and because it carries a
   "Last 7 Days" column beside the all-time one — which is live market movement,
   the thing no static ADP file can give you.

   Two caveats, both stated in the UI. Yahoo's page says "ADP based on standard
   scoring settings", so these numbers are not your league's PPR; use them for
   *movement* and for where the room actually takes people, not as a ranking. And
   the page paginates thirty at a time, so a paste covers whatever the user
   bothered to page through.

   The rows arrive as a repeating block:

       Jahmyr Gibbs
       Det - RB
       [Q]            <- optional injury flag
       1              <- overall rank
       100%           <- % drafted
       1.4            <- ADP, all drafts
       1.3            <- ADP, last 7 days
*/
(function (root) {
  "use strict";

  var TEAM_POS = /^([A-Za-z.]{2,4})\s*-\s*(QB|RB|WR|TE|K|DEF|D\/ST)$/;
  var PCT = /^(\d{1,3})%$/;
  var NUM = /^\d{1,3}(\.\d)?$/;
  var NOISE = /^(Draft Analysis|Standard|Salary Cap|Fantasy|Basic ADP|Plus ADP|ALL|QB|RB|WR|TE|K|DEF|W\/R\/T|Player Rank.*|\*ADP.*|\d+-\d+)$/i;

  function parse(text) {
    var lines = String(text || "").split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l && !NOISE.test(l); });

    var rows = [], skipped = 0;
    for (var i = 0; i < lines.length - 1; i++) {
      var m = lines[i + 1].match(TEAM_POS);
      if (!m) continue;

      var name = lines[i];
      // A name line should look like a name, not a number or a stray token.
      if (!/[A-Za-z]{2}/.test(name) || NUM.test(name) || PCT.test(name)) { skipped++; continue; }

      // Walk the numeric tail: optional injury flag, rank, %drafted, then ADPs.
      var nums = [], pct = null, j = i + 2, guard = 0;
      while (j < lines.length && guard++ < 8) {
        var l = lines[j];
        if (TEAM_POS.test(l)) break;
        var pm = l.match(PCT);
        if (pm) { pct = +pm[1]; j++; continue; }
        if (NUM.test(l)) { nums.push(parseFloat(l)); j++; continue; }
        if (/^[A-Z]{1,3}$/.test(l)) { j++; continue; }   // Q, IR, SUS…
        break;
      }

      // nums is [overallRank, adpAll, adpLast7] once the percentage is pulled out.
      if (nums.length >= 3) {
        rows.push({ name: name, team: m[1].toUpperCase(), pos: m[2].replace("D/ST", "DEF"),
                    rank: nums[0], pctDrafted: pct,
                    adpAll: nums[nums.length - 2], adpRecent: nums[nums.length - 1] });
      } else if (nums.length === 2) {
        rows.push({ name: name, team: m[1].toUpperCase(), pos: m[2].replace("D/ST", "DEF"),
                    rank: nums[0], pctDrafted: pct,
                    adpAll: nums[1], adpRecent: null });
      } else { skipped++; }
      i = j - 1;
    }

    return { rows: rows, skipped: skipped };
  }

  root.DRAFTLINE_YAHOO = { parse: parse };
  if (typeof module !== "undefined") module.exports = root.DRAFTLINE_YAHOO;
})(globalThis);
