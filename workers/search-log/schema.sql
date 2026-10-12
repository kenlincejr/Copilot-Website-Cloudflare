-- D1 database playbook_search, used by workers/search-log.
-- Event kinds: search, zero (no results), click (url + rank), answer (AI answer
-- requested), vote (n = 1 helpful, 0 not helpful), ask_page (page-scoped chat).
CREATE TABLE IF NOT EXISTS events (
  ts     INTEGER NOT NULL,  -- epoch milliseconds
  kind   TEXT    NOT NULL,
  q      TEXT,              -- query text, max 200 characters
  filter TEXT,              -- page_type chip, or all
  n      INTEGER,           -- result count; for vote, 1 or 0
  url    TEXT,              -- clicked or cited page
  rank   INTEGER,           -- clicked result position, 1-based
  page   TEXT               -- page the search ran on
);
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS events_kind_ts ON events (kind, ts);
