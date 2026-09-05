/* Exercise the new playerIn() against the real 267-name board, out of app.js. */
const fs = require("fs");
const path = "C:/Copilot Website Cloudflare/ff/";

// the board's names, straight from the baked data
const dataSrc = fs.readFileSync(path + "data/players.js", "utf8");
const g = {};
new Function("globalThis", dataSrc).call(g, g);
const players = (g.DRAFTLINE_DATA || {}).players;
if (!players) { console.error("no players"); process.exit(1); }

// lift normName() and playerIn() out of app.js verbatim
const appSrc = fs.readFileSync(path + "assets/app.js", "utf8");
const grab = (name) => {
  const i = appSrc.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let d = 0, j = appSrc.indexOf("{", i);
  for (let k = j; k < appSrc.length; k++) {
    if (appSrc[k] === "{") d++;
    else if (appSrc[k] === "}") { d--; if (d === 0) return appSrc.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
};

const A = { all: players, byName: {} };
players.forEach((p) => { A.byName[p.name] = p; });
const ctx = { A };
new Function("A", grab("normName") + "\n" + grab("playerIn") + "\nreturn playerIn;")
  .call(null, A);
const playerIn = new Function("A",
  grab("normName") + "\n" + grab("playerIn") + "\nreturn playerIn;")(A);

let pass = 0, fail = 0;
const t = (label, line, expect) => {
  const got = playerIn(line);
  const name = got ? got.name : null;
  const ok = name === expect;
  ok ? pass++ : fail++;
  console.log((ok ? "  ok  " : "  FAIL") + " " + label.padEnd(46) +
    JSON.stringify(line).slice(0, 44).padEnd(46) + "-> " + name +
    (ok ? "" : "   EXPECTED " + expect));
};

console.log("=== D1: a line naming two players must not bind the wrong one ===");
t("take X over Y", "Take Chase Brown over Ja'Marr Chase", null);
t("take X over Y, reversed", "Take Ja'Marr Chase over Chase Brown", null);
t("substring trap", "Take Bucky Irving over Bhayshul Tuten", null);
t("fallback clause naming a contrast", "If gone: Bucky Irving over Bhayshul Tuten", null);

console.log("\n=== D4: apostrophes and suffixes must still bind ===");
t("curly apostrophe", "Ja\u2019Marr Chase", "Ja'Marr Chase");
t("curly apostrophe 2", "De\u2019Von Achane", "De'Von Achane");
t("straight apostrophe", "Ja'Marr Chase", "Ja'Marr Chase");
t("suffix dropped (III)", "James Cook", "James Cook III");
t("suffix dropped (Jr.)", "Marvin Harrison", "Marvin Harrison Jr.");
t("suffix dropped, in a sentence", "Take Marvin Harrison here.", "Marvin Harrison Jr.");
t("suffix present", "James Cook III", "James Cook III");

console.log("\n=== the ordinary cases must not regress ===");
t("bare name", "Bijan Robinson", "Bijan Robinson");
t("trailing period", "Bijan Robinson.", "Bijan Robinson");
t("in a sentence", "Take Bijan Robinson, he is the best back left.", "Bijan Robinson");
t("nobody on the board", "Take the best available receiver", null);
t("empty", "", null);
t("defense", "Houston Defense", "Houston Defense");

console.log("\n=== no board name is a substring of another (D1's premise) ===");
let collisions = 0;
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[.']/g, " ").replace(/-/g, " ").split(/\s+/)
  .filter((w) => w && ["jr", "sr", "ii", "iii", "iv", "v"].indexOf(w) < 0).join(" ");
for (const a of players) for (const b of players) {
  if (a.name === b.name) continue;
  if ((" " + norm(a.name) + " ").indexOf(" " + norm(b.name) + " ") >= 0) {
    collisions++; console.log("  collision: " + b.name + " inside " + a.name);
  }
}
console.log("  normalized substring collisions: " + collisions);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
