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

-- Announcements shown as a banner in the guide. Posted by tools/summit-announce.py (no public write endpoint).
CREATE TABLE IF NOT EXISTS summit_alerts (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     INTEGER NOT NULL,             -- epoch milliseconds
  level  TEXT    NOT NULL DEFAULT 'info',   -- info or urgent
  body   TEXT    NOT NULL,
  until  INTEGER,                       -- epoch milliseconds, or NULL to stay until cleared
  active INTEGER NOT NULL DEFAULT 1
);

-- Session feedback. Ratings and comments are anonymous (random device id). Name, company and contact are stored only
-- when the person ticks the follow-up box. One row per device per session; sending again updates it.
CREATE TABLE IF NOT EXISTS summit_feedback (
  ts       INTEGER NOT NULL,
  did      TEXT    NOT NULL,
  session  TEXT    NOT NULL,
  title    TEXT,
  rating   INTEGER NOT NULL,
  a1       TEXT,
  a2       TEXT,
  followup INTEGER NOT NULL DEFAULT 0,
  note     TEXT,
  name     TEXT,
  company  TEXT,
  contact  TEXT,
  PRIMARY KEY (did, session)
);
CREATE INDEX IF NOT EXISTS summit_feedback_session ON summit_feedback (session);

-- Wrong-PIN tracking for in-app announcements. Keys are a hash of the connection or the device id; no raw IPs.
-- ('global' rows from before 2026-10-21 are no longer read.) The same table holds the daily per-connection caps:
-- key 'cap:<claim|u|f>:<Hawaii date>:<salted hash>', fails = requests counted that day. No schema change.
CREATE TABLE IF NOT EXISTS summit_lockout (
  key      TEXT    PRIMARY KEY,
  fails    INTEGER NOT NULL DEFAULT 0,
  first_ts INTEGER NOT NULL,
  until    INTEGER NOT NULL DEFAULT 0
);

-- Attendee conversation profiles: up to three topics each person wants to talk about, plus an optional LinkedIn link.
-- Written by the attendee about themselves. token_hash is a hash of a secret the claiming phone keeps (first save claims the id).
-- Read by the guide (GET /p) and by the summit-ai Worker. No sales, account or contact details belong here.
CREATE TABLE IF NOT EXISTS summit_profiles (
  pid        TEXT    PRIMARY KEY,   -- attendee id from the guide, such as jacob-sanders
  token_hash TEXT    NOT NULL,
  ts         INTEGER NOT NULL,
  t1         TEXT,
  t2         TEXT,
  t3         TEXT,
  linkedin   TEXT
);
