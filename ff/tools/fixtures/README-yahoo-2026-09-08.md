# Yahoo Draft Analysis captures, 2026-09-08

Pasted out of the live page on draft day. These cannot be re-fetched: the page is
league-scoped and needs a logged-in Yahoo session, and Yahoo publishes no
historical view of it. Committed for the same reason `tools/snapshots/` is.

- `yahoo-draftanalysis-2026-09-08.txt` — the first page as it came, 60 rows,
  parses clean with 0 skipped.
- `yahoo-draftanalysis-2026-09-08-oddrows.txt` — a hand-picked selection of the
  later pages, kept because it holds the row shapes the original Sep 4 fixture
  does not: hyphenated status tokens (`IR-R`, `PUP-R`), the exempt-list token
  (`CEL`), a four-digit overall rank, team defenses, kickers, and undrafted
  players whose columns are all `-`. Not a contiguous page — a selection.
  27 rows, 3 skipped, and the 3 are the `-` rows, which is correct.

Two things these captures established, both now asserted in `test-parser.js`:

1. `IR-R` / `PUP-R` rows and four-digit ranks were being **dropped silently** —
   not counted as skipped, just absent. Fixed in `assets/draftanalysis.js`.
2. On a free account the **Last 7 Days column is padlocked**, along with Pos
   Rank, CER and every Plus ADP column. A locked cell pastes as nothing, so each
   row carries two numbers and they are **Preseason and All Drafts**. The parser
   had read them as All Drafts and Last 7 Days. See that file's docstring.
