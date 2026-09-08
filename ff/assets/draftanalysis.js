/* Parser for Yahoo's "Draft Analysis" page.
   https://football.fantasysports.yahoo.com/f1/<league>/draftanalysis

   Worth having because it is the one free source of ADP from *real completed
   drafts* on the platform this league actually runs on.

   It was also built believing the page hands over a "Last 7 Days" column of live
   market movement. On a free account it does not — see the third caveat.

   Three caveats. Yahoo's page says "ADP based on standard scoring settings", so
   these numbers are not your league's PPR; use them for where the room actually
   takes people, not as a ranking. The page paginates thirty at a time, so a paste
   covers whatever the user bothered to page through.

   And the third, confirmed against the real header on 2026-09-08: the columns are
   Rank | Pos Rank | CER | %Drafted | Preseason | All Drafts | Last 7 Days, then
   the same three again under "Plus ADP" — and on a free account **Pos Rank, CER,
   Last 7 Days and every Plus column are padlocked**. A locked cell pastes as
   nothing at all, so a free-tier row yields exactly two numbers after the
   percentage, and they are **Preseason and All Drafts** — not All Drafts and Last
   7 Days, which is what this parser originally assumed.

   That is why the fields below read the way they do: adpAll is the Preseason
   baseline and adpRecent is the All Drafts average, the broader and more current
   of the two. app.js derives ytrend as adpAll - adpRecent, so a positive ytrend
   still means "taken earlier now than in the preseason" and the sign is right.
   But it is **preseason drift, not weekly movement**: across 87 rows of a real
   paste its median is 0.10 picks and its maximum 1.6, so on a free account the
   signal is nearly inert and must not be sold as live market movement. The column
   that would carry that is the locked one.

   If a Yahoo Plus account ever pastes this page there will be more than two
   numbers per row, and the tail-relative indexing below would silently mix the
   free and Plus tiers. Pin the columns by count before trusting a Plus paste.

   Verified against the QB, RB, WR and TE pages. Team defenses and kickers are
   reachable only by clicking the position chip (?pos=DEF returns an empty table),
   and their row shape has not been confirmed — the parser accepts a D/ST token
   and maps it to DEF, but treat a defense paste as unproven and check what the
   confirmation screen reports before applying it.

   The rows arrive as a repeating block:

       Jahmyr Gibbs
       Det - RB
       [Q]            <- optional injury flag
       1              <- overall rank
       100%           <- % drafted
       1.4            <- ADP, preseason    (adpAll)
       1.3            <- ADP, all drafts   (adpRecent; "Last 7 Days" is locked)
*/
(function (root) {
  "use strict";

  var TEAM_POS = /^([A-Za-z.]{2,4})\s*-\s*(QB|RB|WR|TE|K|DEF|D\/ST)$/;
  var PCT = /^(\d{1,3})%$/;
  // Rank runs to four and five digits deep in the pool (a barely-drafted kicker
  // came back as 2529), so this cannot be capped at three the way an ADP can.
  var NUM = /^\d{1,5}(\.\d)?$/;
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
        // Status tokens: Q, O, IR, NA, CEL, and the hyphenated ones Yahoo uses for
      // players who can come back -- IR-R, PUP-R. Before the hyphen was allowed
      // these broke the walk, and the row was dropped silently rather than
      // counted, so a player landing on IR-R vanished from the paste entirely.
      if (/^[A-Z]{1,4}(-[A-Z]{1,3})?$/.test(l)) { j++; continue; }
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
