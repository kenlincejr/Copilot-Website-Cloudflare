/* node ff/tools/test-config.js — the loopback guard from workstream A, plus the
   build-stamp check, as a test rather than something a human has to remember to
   eyeball before every deploy.

   Two ways this ships broken:

   1. `claudeProxy` pointing at a developer's own machine. `config.js` is meant
      to be edited only to point at the deployed Worker; a dev override
      (`http://127.0.0.1:8787`, `http://localhost:8787`, `[::1]`) left in the
      working tree means every visitor's Claude call and every account call
      goes to their own loopback and fails outright — this was caught once
      already during this engagement, which is exactly the kind of mistake a
      one-time human check does not reliably catch a second time.
   2. `build` in config.js not matching every `?v=` stamp on the two HTML
      pages. `checkForUpdate()` in app.js compares config.js's stamp (fetched
      fresh, past the cache) against the one baked into the currently running
      page; if a deploy updates one and not the other, most visitors get a
      "reload" banner forever, or worse, silently keep running stale code
      that config.js claims is current. */
"use strict";

var fs = require("fs");
var path = require("path");

var pass = 0, fail = 0;
function ok(label, cond, detail) {
  (cond ? pass++ : fail++);
  console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  — " + detail : ""));
}

var ROOT = path.join(__dirname, "..");
var CONFIG_PATH = path.join(ROOT, "assets/config.js");
var HTML_PATHS = [path.join(ROOT, "app.html"), path.join(ROOT, "index.html")];

var configSrc = fs.readFileSync(CONFIG_PATH, "utf8");

/* ------------------------------------------------------- 1. loopback guard */

var proxyMatch = configSrc.match(/claudeProxy\s*:\s*"([^"]*)"/);
ok("config.js declares a claudeProxy string", !!proxyMatch, configSrc.slice(0, 120));
var proxy = proxyMatch ? proxyMatch[1] : "";

// Matches http/https loopback in any of its usual spellings, with or without
// a port: 127.0.0.1, ::1 (bracketed, as a URL host must write it), and
// "localhost" itself. This is deliberately broader than exactly what has been
// seen in the working tree — a guard that only catches yesterday's typo is
// not a guard.
var LOOPBACK = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/?$/i;
ok("claudeProxy is not pointed at a loopback address", proxy === "" || !LOOPBACK.test(proxy),
   "claudeProxy: \"" + proxy + "\"");
ok("claudeProxy is non-empty (a blank value silently falls back to per-user keys, " +
   "which is a real mode, not a mistake — but this deployment is not meant to run that way)",
   proxy.length > 0, proxy);
ok("claudeProxy is served over https (a plain http proxy would also fail the " +
   "GitHub Pages mixed-content policy, not just be insecure)",
   /^https:\/\//i.test(proxy), proxy);

// Prove this can fail: run the same regex against the exact string this
// engagement found in the working tree, and against a couple of variants it
// would be easy to reintroduce by mistake (a stray port, IPv6, no protocol
// typo'd as "http:/").
[
  "http://127.0.0.1:8787",
  "http://localhost:8787",
  "https://localhost",
  "http://[::1]:8787"
].forEach(function (bad) {
  ok("(self-check) the guard actually rejects " + bad, LOOPBACK.test(bad));
});
ok("(self-check) the guard does not reject the real production URL",
   !LOOPBACK.test("https://draftline-api.ken-lince.workers.dev"));

/* ---------------------------------------------------------- 2. build stamp */

var buildMatch = configSrc.match(/build\s*:\s*"([^"]+)"/);
ok("config.js declares a build stamp", !!buildMatch);
var build = buildMatch ? buildMatch[1] : null;

HTML_PATHS.forEach(function (htmlPath) {
  var name = path.basename(htmlPath);
  var html = fs.readFileSync(htmlPath, "utf8");
  var stamps = (html.match(/\?v=([A-Za-z0-9_-]+)/g) || []).map(function (s) { return s.slice(3); });
  ok(name + " has at least one ?v= stamp to check", stamps.length > 0, "found " + stamps.length);
  var mismatched = stamps.filter(function (s) { return s !== build; });
  var distinct = Array.from(new Set(stamps));
  ok(name + ": every ?v= stamp matches config.js's build (" + build + ")",
     mismatched.length === 0,
     mismatched.length ? (distinct.length + " distinct stamp(s) found: " + distinct.join(", ")) : "");
});

/* Prove the stamp check can fail: a build string that only appears in one of
   the two files (a half-finished deploy) must not slip past silently. */
(function selfCheckStampMismatch() {
  var html = fs.readFileSync(HTML_PATHS[0], "utf8");
  var withOneStaleTag = html.replace(/\?v=[A-Za-z0-9_-]+/, "?v=some-other-stamp");
  var stamps = (withOneStaleTag.match(/\?v=([A-Za-z0-9_-]+)/g) || []).map(function (s) { return s.slice(3); });
  var mismatched = stamps.filter(function (s) { return s !== build; });
  ok("(self-check) a single stale ?v= tag is caught, not averaged away",
     mismatched.length > 0);
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail > 0 ? 1 : 0);
