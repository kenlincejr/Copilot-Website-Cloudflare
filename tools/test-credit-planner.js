/* tools/test-credit-planner.js — smoke stage.
   Proves the hub shell loads a working engine and stays isolated. The full
   A–H suite replaces this file once the planner facts are registered.

     node tools/test-credit-planner.js          (from the repo root)
*/
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const HTML = path.join(__dirname, '..', 'copilot-credit-planner.html');
const src = fs.readFileSync(HTML, 'utf8').replace(/\r\n/g, '\n');
const m = /<script id="planner-engine">([\s\S]*?)<\/script>/.exec(src);
if (!m) { console.error('no <script id="planner-engine"> block'); process.exit(1); }
const sandbox = { module: { exports: {} }, console: console };
sandbox.exports = sandbox.module.exports;
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: 'planner-engine' });
const E = sandbox.module.exports.PlannerEngine;
let pass = 0, fail = 0;
function ok(c, msg) { if (c) pass++; else { fail++; console.log('FAIL: ' + msg); } }
ok(!!E, 'engine exports PlannerEngine');
if (E) {
  const r = E.compute(E.defaults());
  ok(r && r.pool && r.purchase && r.purchase.best, 'compute(defaults()) returns a full result');
  ok(E.optimize({ lo: Array(12).fill(755000), mid: Array(12).fill(755000), hi: Array(12).fill(755000) }).best.expected.usd === 72600, '755,000 flat: packs $72,600');
  ok(E.tenantEnforcement(25000, E.MS_ENFORCEMENT_EXAMPLE.environments).agentsCutoff === 18125, 'enforcement example 18,125');
  ok(E.compute(E.applyScenarioPreset(E.defaults(), 'smb-trio')).pool.steady.lo === 40600, 'three SMB agents: 40,600 a month');
}
['CoworkEngine', '<script src', 'fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'sendBeacon']
  .forEach((t) => ok(src.indexOf(t) < 0, 'page has no ' + t));
ok(!/\bDate\b/.test(m[1]) && !/Math\.random/.test(m[1]), 'engine has no Date or Math.random');
ok((src.match(/<script\b[^>]*>/g) || []).length === 2, 'exactly two inline scripts');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
