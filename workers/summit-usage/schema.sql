-- Added to the existing D1 database playbook_search (shared with workers/search-log).
-- Anonymous usage counts for the Executive Summit guide. No names, no contact details,
-- no IP or user agent. `did` is a random id the phone makes for itself so we can count
-- unique devices; it is not linked to who the person is.
CREATE TABLE IF NOT EXISTS summit_events (
  ts    INTEGER NOT NULL,  -- epoch milliseconds
  did   TEXT    NOT NULL,  -- random per-phone id
  kind  TEXT    NOT NULL,  -- open, view, pin, day, map_tab, card_made, card_shown, call, mail, refresh
  label TEXT,              -- tab name, place id, day label, and so on
  n     INTEGER,           -- optional number
  mode  TEXT               -- app (installed) or browser
);
CREATE INDEX IF NOT EXISTS summit_events_ts ON summit_events (ts);
CREATE INDEX IF NOT EXISTS summit_events_kind_ts ON summit_events (kind, ts);
