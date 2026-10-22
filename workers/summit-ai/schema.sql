-- Daily question counts for the Ask the Summit assistant. Counts only: question text is never stored.
CREATE TABLE IF NOT EXISTS summit_ai_usage (
  did TEXT NOT NULL,   -- random per-phone id (the same one the usage counts use), or 'ip:<hash>' for the per-connection count
                       -- (truncated SHA-256 of the address salted with the Hawaii date; never the raw IP). No schema change for it.
  day TEXT NOT NULL,   -- YYYY-MM-DD, Hawaii date
  n   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (did, day)
);
