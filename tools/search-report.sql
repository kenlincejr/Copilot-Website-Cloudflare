-- Site search report, last 30 days (specs/site-search-v2.spec.md F11).
-- Run from the repo root in PowerShell:
--   npx wrangler d1 execute playbook_search --remote --file tools/search-report.sql

-- 1. Top queries
SELECT lower(q) AS query, count(*) AS searches
FROM events WHERE kind = 'search' AND ts > (strftime('%s','now') - 30*86400) * 1000
GROUP BY lower(q) ORDER BY searches DESC LIMIT 25;

-- 2. Queries that found nothing: write these pages next
SELECT lower(q) AS query, count(*) AS times
FROM events WHERE kind = 'zero' AND ts > (strftime('%s','now') - 30*86400) * 1000
GROUP BY lower(q) ORDER BY times DESC LIMIT 25;

-- 3. Searched often, rarely clicked: results that are not answering
SELECT s.query, s.searches, coalesce(c.clicks, 0) AS clicks
FROM (SELECT lower(q) AS query, count(*) AS searches FROM events
      WHERE kind = 'search' AND ts > (strftime('%s','now') - 30*86400) * 1000 GROUP BY lower(q)) s
LEFT JOIN (SELECT lower(q) AS query, count(*) AS clicks FROM events
      WHERE kind = 'click' AND ts > (strftime('%s','now') - 30*86400) * 1000 GROUP BY lower(q)) c
  ON c.query = s.query
WHERE s.searches >= 3 ORDER BY (coalesce(c.clicks, 0) * 1.0 / s.searches) ASC, s.searches DESC LIMIT 25;

-- 4. Most clicked pages and their average rank
SELECT url, count(*) AS clicks, round(avg(rank), 1) AS avg_rank
FROM events WHERE kind = 'click' AND ts > (strftime('%s','now') - 30*86400) * 1000
GROUP BY url ORDER BY clicks DESC LIMIT 25;

-- 5. AI answers: requests and helpfulness votes
SELECT
  (SELECT count(*) FROM events WHERE kind = 'answer' AND ts > (strftime('%s','now') - 30*86400) * 1000) AS answers,
  (SELECT count(*) FROM events WHERE kind = 'vote' AND n = 1 AND ts > (strftime('%s','now') - 30*86400) * 1000) AS helpful,
  (SELECT count(*) FROM events WHERE kind = 'vote' AND n = 0 AND ts > (strftime('%s','now') - 30*86400) * 1000) AS not_helpful,
  (SELECT count(*) FROM events WHERE kind = 'ask_page' AND ts > (strftime('%s','now') - 30*86400) * 1000) AS page_questions;

-- 6. Filter chip use
SELECT coalesce(filter, 'all') AS chip, count(*) AS searches
FROM events WHERE kind = 'search' AND ts > (strftime('%s','now') - 30*86400) * 1000
GROUP BY chip ORDER BY searches DESC;
