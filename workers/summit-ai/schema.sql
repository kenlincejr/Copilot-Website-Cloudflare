-- Daily question counts for the Ask the Summit assistant. Counts only: question text is never stored.
CREATE TABLE IF NOT EXISTS summit_ai_usage (
  did TEXT NOT NULL,   -- random per-phone id (the same one the usage counts use)
  day TEXT NOT NULL,   -- YYYY-MM-DD, Hawaii date
  n   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (did, day)
);
