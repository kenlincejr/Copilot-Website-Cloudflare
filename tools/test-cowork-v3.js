/* tools/test-cowork-v3.js
   Remediation suite for cowork-calculator.html —
   specs/cowork-calculator-v3-remediation.spec.md. Self-extracting: it reads
   the engine straight out of the page, so there is nothing to keep in sync.
   Raw-source regex checks cover the UI-side invariants node cannot execute.

   Structured one section per remediation slice. Later slices (R3–R8) append
   their own sections before the final tally — keep the section banners.

     node tools/test-cowork-v3.js          (from the repo root)
*/
const fs = require('fs'), path = require('path'), vm = require('vm');
const HTML = path.join(__dirname, '..', 'cowork-calculator.html');
const src = fs.readFileSync(HTML, 'utf8');
const OPEN = '<scr' + 'ipt>', CLOSE = '</scr' + 'ipt>';
const a = src.indexOf(OPEN), b = src.indexOf(CLOSE, a);
if (a < 0 || b < 0) { console.error('no script block found in ' + HTML); process.exit(1); }
const engineSrc = src.slice(a + OPEN.length, b);
const sandbox = { module: { exports: {} }, console: console };
sandbox.exports = sandbox.module.exports;
vm.createContext(sandbox);
vm.runInContext(engineSrc, sandbox, { filename: 'cowork-engine' });
const E = sandbox.module.exports.CoworkEngine;
if (!E) { console.error('engine did not export CoworkEngine'); process.exit(1); }

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }
function eq(a, b, m) { ok(a === b, m + ' (got ' + a + ', want ' + b + ')'); }
function wids(r) { return r.warnings.map(function (w) { return w.id; }); }
function aids(r) { return r.assumptions.map(function (x) { return x.id; }); }
function row(r, id) { return r.trace.filter(function (t) { return t.id === id; })[0]; }
function st(over) { return Object.assign(E.defaults(), over || {}); }

/* Every number reachable through ctx must be finite; null is an answer. */
function assertFinite(v, m, depth) {
  if (v == null) return;
  if (typeof v === 'number') { ok(isFinite(v), m + ' finite (got ' + v + ')'); return; }
  if ((depth || 0) > 3) return;
  if (Array.isArray(v)) { v.forEach(function (x, i) { assertFinite(x, m + '[' + i + ']', (depth || 0) + 1); }); return; }
  if (typeof v === 'object') Object.keys(v).forEach(function (k) { assertFinite(v[k], m + '.' + k, (depth || 0) + 1); });
}
function assertCtxSane(c, m) {
  assertFinite(c, m + ' ctx');
  ['monthlyCowork','coworkLo','coworkHi','licenseMonthly','allInMonthly','allInAnnual',
   'allInThreeYear','paygoAnnual','p3Annual','perActive','p3Exposure'].forEach(function (k) {
    ok(isFinite(c[k]) && c[k] >= 0, m + ' ' + k + ' finite and non-negative (got ' + c[k] + ')');
  });
}
function assertCopyClean(r, m) {
  const txt = r.warnings.map(w => w.message).join(' ') + ' ' + r.assumptions.map(x => x.note).join(' ');
  ok(!/NaN|undefined|Infinity|\$∞/.test(txt), m + ' no NaN/undefined/Infinity in copy');
}

/* ══════════════════════════════════════════════════════════════════════════
   Regression anchor — every slice re-proves it (spec §0.1)
   ══════════════════════════════════════════════════════════════════════════ */
{
  const r = E.compute(E.defaults());
  eq(Math.round(r.ctx.monthlyCredits), 755000, 'anchor: stock credits');
  eq(Math.round(r.ctx.monthlyCowork), 7550, 'anchor: stock monthly');
  ['V-05','V-27','V-28','V-29'].forEach(function (id) {
    ok(wids(r).indexOf(id) === -1, 'anchor: ' + id + ' silent on stock defaults');
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   R1 — Engine totality and loader hardening
   ══════════════════════════════════════════════════════════════════════════ */

/* ── R1.1 · SKU map prototype hole (#3) ─────────────────────────────────── */
{
  const KEYS = ['toString','valueOf','hasOwnProperty','__proto__','constructor',
                'isPrototypeOf','propertyIsEnumerable','toLocaleString'];
  KEYS.forEach(function (k) {
    ok(E.SKU_BY_ID[k] === undefined, 'SKU_BY_ID does not resolve prototype key ' + k);
    let r;
    try { r = E.compute(st({ licenseInventory: [{ skuId: k, seats: 60 }] })); }
    catch (e) { fail++; console.log('FAIL: compute threw on skuId ' + k + ': ' + e.message); return; }
    ok(wids(r).indexOf('V-27') >= 0, 'V-27 fires for skuId ' + k);
    const w = r.warnings.filter(function (x) { return x.id === 'V-27'; })[0];
    ok(w && w.message.indexOf(k) >= 0, 'V-27 names the id ' + k);
    assertCtxSane(r.ctx, 'skuId ' + k);
  });
  // multiple unknown ids in one file, all named
  const r = E.compute(st({ licenseInventory: [{ skuId:'toString', seats:5 }, { skuId:'zzz', seats:5 },
                                              { skuId:'bprem_cop', seats:60 }] }));
  const w = r.warnings.filter(function (x) { return x.id === 'V-27'; })[0];
  ok(w && w.message.indexOf('toString') >= 0 && w.message.indexOf('zzz') >= 0, 'V-27 names every dropped id');
  eq(r.ctx.copilotLicensed, 60, 'known lines still price after unknown ones drop');
}

/* ── R1.2 · Crash-proof pipeline: normalize → compute never throws ──────── */
{
  const HOSTILE = [
    { licenseInventory: [{ skuId:'toString', seats:60 }] },
    { org: { totalEmployees: 50 } },
    { personas: [null, 5, 'x', { seats:'a', light:{}, name:7 }] },
    { licenseInventory: 'junk' },
    { pricing: 5, channel: 'x', billing: [] },
    { billing: { capacityPacksCccu: -1000000 } },
    { effort: { level: 'max' } },
    { effort: { step: 1e-320 } },
    { channel: { motion:'indirectReseller', providerCreditUsd: 1e308 } },
    { calibrated: true }, { calibrated: 'no' },
    { tierCredits: { light: 1e308, medium: -5, heavy: 'x' } },
    { activation: { mode:'count', count: 1e308 } },
    { priceOverrides: { bprem_cop: 1e308, e7: 'x' } }
  ];
  HOSTILE.forEach(function (h, i) {
    let candidate, r;
    try { candidate = E.normalize(h); r = E.compute(candidate); }
    catch (e) { fail++; console.log('FAIL: loader path threw on hostile ' + i + ': ' + e.message); return; }
    assertCtxSane(r.ctx, 'hostile ' + i);
    assertCopyClean(r, 'hostile ' + i);
  });
}

/* ── R1.3 · Magnitude caps (#4a) ────────────────────────────────────────── */
{
  eq(E.CONST.MAX.employees, 1e6, 'CONST.MAX.employees');
  eq(E.CONST.MAX.seats, 1e6, 'CONST.MAX.seats');
  eq(E.CONST.MAX.tasksPerMonth, 1e4, 'CONST.MAX.tasksPerMonth');
  eq(E.CONST.MAX.tierCredits, 1e7, 'CONST.MAX.tierCredits');

  const r1 = E.compute(st({ licenseInventory: [{ skuId:'bprem_cop', seats: 1e308 }] }));
  assertCtxSane(r1.ctx, '1e308 seats');
  eq(r1.ctx.copilotLicensed, 1e6, '1e308 seats clamps to MAX.seats');

  const r2 = E.compute(st({ org: Object.assign(E.defaults().org, { totalEmployees: 1e308 }) }));
  eq(r2.ctx.employees, 1e6, '1e308 employees clamps to MAX.employees');

  const r3 = E.compute(st({ tierCredits: { light:1e308, medium:1e308, heavy:1e308 } }));
  assertCtxSane(r3.ctx, '1e308 tiers');
  eq(E.normalize({ tierCredits: { light:1e308, medium:500, heavy:1200 } }).tierCredits.light, 1e7,
     '1e308 tier credit clamps to MAX.tierCredits');

  const s4 = E.defaults(); s4.personas[0].heavy = 1e308;
  assertCtxSane(E.compute(s4).ctx, '1e308 persona tasks');
  eq(E.normalize(s4).personas[0].heavy, 1e4, '1e308 tasks clamp to MAX.tasksPerMonth');

  const s5 = E.defaults(); s5.activation = { mode:'count', count: 1e308 };
  assertCtxSane(E.compute(s5).ctx, '1e308 active count');

  const s6 = E.defaults(); s6.priceOverrides = { bprem_cop: 1e308 };
  assertCtxSane(E.compute(s6).ctx, '1e308 price override');
}

/* ── R1.4 · Rate-card validation (#4b/c, #12, #13) ──────────────────────── */
{
  eq(E.normalize({ effort: { step: 1e-320 } }).effort.step, 1, 'effortStep 1e-320 clamps to 1');
  eq(E.normalize({ effort: { step: 1e308 } }).effort.step, 3, 'effortStep 1e308 clamps to 3');
  ok(Math.abs(E.normalize({ effort: { step: 'x' } }).effort.step - E.EFFORT_STEP_DEFAULT) < 1e-9,
     'garbage effortStep lands on the default');
  assertCtxSane(E.compute(E.normalize({ effort: { step: 1e-320 } })).ctx, 'effortStep 1e-320');

  // negative / zero sell rate is unanswered, not a price
  const neg = E.compute(st({ pricing: Object.assign(E.defaults().pricing,
    { mode:'sell', creditSellUsd: -0.05 }) }));
  eq(neg.ctx.creditUsd, 0.01, 'negative creditSellUsd falls back to $0.01');
  ok(neg.ctx.monthlyCowork > 0, 'negative rate cannot print a negative meter');
  const zero = E.compute(st({ pricing: Object.assign(E.defaults().pricing,
    { mode:'sell', creditSellUsd: 0 }) }));
  eq(zero.ctx.creditUsd, 0.01, 'zero creditSellUsd falls back to $0.01');
  assertCtxSane(E.compute(st({ pricing: Object.assign(E.defaults().pricing,
    { mode:'sell', creditSellUsd: 1e308 }) })).ctx, '1e308 creditSellUsd');

  // capacity packs clamp at zero: no invented saving, no suppressed exposure
  eq(E.normalize({ billing: { capacityPacksCccu: -1000000 } }).billing.capacityPacksCccu, 0,
     'negative capacity packs clamp to 0');
  const base = E.compute(st({ billing: Object.assign(E.defaults().billing, { model:'p3' }) })).ctx;
  const att = E.compute(st({ billing: Object.assign(E.defaults().billing,
    { model:'p3', capacityPacksCccu: -1000000 }) }));
  eq(att.ctx.commitCccu, base.commitCccu, 'negative packs do not inflate the commit');
  eq(att.ctx.p3Saving, base.p3Saving, 'negative packs do not invent a saving');
  ok(wids(att).indexOf('V-23') >= 0, 'exposure notice not suppressed by negative packs');
  assertCtxSane(E.compute(st({ billing: Object.assign(E.defaults().billing,
    { capacityPacksCccu: -1e308 }) })).ctx, '-1e308 packs');
}

/* ── R1.5 · Deep normalize on load (#19) ────────────────────────────────── */
{
  const s = E.normalize({ org: { totalEmployees: 50 } });
  eq(s.org.totalEmployees, 50, 'loaded employees kept');
  eq(s.org.vertical, 'none', 'org.vertical survives a partial org branch');
  eq(s.org.azureCspPlan, 'unsure', 'org.azureCspPlan survives');
  eq(s.org.competingAi, 'no', 'org.competingAi survives');
  eq(s.personas.length, 4, 'personas restored on partial load');
  ok(s.channel && s.channel.motion === 'unsure', 'channel branch restored');

  // retired effort levels flow through to compute() so V-19 fires
  const legacy = E.normalize({ effort: { level: 'max' } });
  eq(legacy.effort.level, 'max', 'normalize does not pre-rewrite retired levels');
  const r = E.compute(legacy);
  ok(wids(r).indexOf('V-19') >= 0, 'V-19 fires for a legacy max-effort session');
  eq(r.ctx.effortLabel, 'High', 'legacy max session reprices at High');
  const r2 = E.compute(E.normalize({ effort: { level: 'xhigh' } }));
  ok(wids(r2).indexOf('V-19') >= 0, 'V-19 fires for xhigh');
}

/* ── R1.6 · Manual P3 discount (#13) ────────────────────────────────────── */
{
  function withManual(p) {
    return st({ billing: Object.assign(E.defaults().billing, { model:'p3', manualP3Pct: p }) });
  }
  const r25 = E.compute(withManual(25));
  eq(r25.ctx.discount.pct, 25, 'manual 25% survives');
  ok(wids(r25).indexOf('V-28') >= 0, 'V-28 fires above the 20% anchor');
  const r500 = E.compute(withManual(500));
  eq(r500.ctx.discount.pct, 30, 'manual 500% clamps to the input max of 30');
  ok(wids(r500).indexOf('V-28') >= 0, 'V-28 fires on the clamped 30%');
  ok(r500.ctx.p3Annual > 0, 'no free year of credits at any manual discount');
  const r15 = E.compute(withManual(15));
  ok(wids(r15).indexOf('V-28') === -1, 'V-28 silent at 15%');
  const rg = E.compute(withManual('abc'));
  ok(rg.ctx.discount.tier !== 'manual', 'garbage manual % falls back to the modeled tier');
}

/* ── R1.7 · Reseller margin honesty (#12) ───────────────────────────────── */
{
  function reseller(rate, sell) {
    const s = E.defaults();
    s.channel = { motion:'indirectReseller', providerCreditUsd: rate };
    if (sell != null) s.pricing = Object.assign(E.defaults().pricing, { mode:'sell', creditSellUsd: sell });
    return s;
  }
  // (a) provider rate above the sell rate: inverted margin must warn
  const inv = E.compute(reseller(0.02, 0.005));
  ok(inv.ctx.meterMarginAnnual < 0, 'inverted reseller margin computes negative');
  ok(wids(inv).indexOf('V-29') >= 0, 'V-29 fires on a negative reseller margin');
  // ...and on the PEC branch too
  const pecInv = E.compute(st({
    channel: { motion:'direct', providerCreditUsd:null },
    pricing: Object.assign(E.defaults().pricing,
      { mode:'sell', creditSellUsd: 0.005, pec: { status:'yes', pct:15 } }) }));
  ok(pecInv.ctx.meterMarginAnnual < 0 && wids(pecInv).indexOf('V-29') >= 0,
     'V-29 fires on a negative PEC-branch margin');
  const fine = E.compute(reseller(0.008, null));
  ok(wids(fine).indexOf('V-29') === -1, 'V-29 silent on a positive margin');

  // (b) a provider rate of zero is the question unanswered, not a cost basis
  const z = E.compute(reseller(0, null));
  eq(z.ctx.providerKnown, false, 'providerCreditUsd 0 is not a known rate');
  eq(z.ctx.paygoPartnerCost, null, 'providerCreditUsd 0 withholds the cost basis');
  eq(z.ctx.meterMarginAnnual, null, 'providerCreditUsd 0 withholds the margin');
  ok(aids(z).indexOf('provider-rate-unknown') >= 0, 'provider-rate prompt still asks at 0');
}

/* ── R1.8 · 300-seat cap summed per SKU (#14) ───────────────────────────── */
{
  const two = E.compute(st({ licenseInventory: [
    { skuId:'bprem_cop', seats:200 }, { skuId:'bprem_cop', seats:200 }] }));
  ok(wids(two).indexOf('V-05') >= 0, 'V-05 fires for two 200-seat lines of a capped SKU');
  const w = two.warnings.filter(function (x) { return x.id === 'V-05'; });
  eq(w.length, 1, 'V-05 fires once per SKU, not per line');
  ok(w[0].message.indexOf('400') >= 0, 'V-05 names the summed 400 seats');
  const one = E.compute(st({ licenseInventory: [{ skuId:'bprem_cop', seats:350 }] }));
  ok(wids(one).indexOf('V-05') >= 0, 'V-05 still fires for a single over-cap line');
  const under = E.compute(st({ licenseInventory: [
    { skuId:'bprem_cop', seats:200 }, { skuId:'bprem_cop', seats:90 }] }));
  ok(wids(under).indexOf('V-05') === -1, 'V-05 silent at a summed 290');
}

/* ── R1.9 · Small correctness (#29, #30, #19 fallback, #27) ─────────────── */
{
  // PEC 'yes' with a missing or garbage pct withholds instead of assuming 15%
  [undefined, null, 'abc', {}].forEach(function (pct, i) {
    const r = E.compute(st({
      channel: { motion:'direct', providerCreditUsd:null },
      pricing: Object.assign(E.defaults().pricing, { pec: { status:'yes', pct: pct } }) }));
    eq(r.ctx.pecKnown, false, 'PEC yes + garbage pct ' + i + ' is not known');
    eq(r.ctx.pecPct, 0, 'PEC yes + garbage pct ' + i + ' contributes no rate');
    eq(r.ctx.paygoPartnerCost, null, 'PEC yes + garbage pct ' + i + ' withholds cost');
  });
  const real = E.compute(st({
    channel: { motion:'direct', providerCreditUsd:null },
    pricing: Object.assign(E.defaults().pricing, { pec: { status:'yes', pct: 10 } }) }));
  eq(real.ctx.pecPct, 10, 'a real PEC rate still applies');

  // indirectProvider is a first-class motion on the picker row
  ok(E.MOTION_ORDER.indexOf('indirectProvider') >= 0, 'MOTION_ORDER carries indirectProvider');
  const ip = E.compute(st({ channel: { motion:'indirectProvider', providerCreditUsd:null } }));
  eq(ip.ctx.cspMotion, 'indirectProvider', 'indirectProvider no longer misfiles');
  eq(ip.ctx.motionLabel, 'Indirect provider', 'indirectProvider prints its own label');
  eq(ip.ctx.holdsBillingAccount, true, 'indirectProvider holds the billing account');

  // unknown effort level labels as Medium instead of undefined
  const unk = E.compute(st({ effort: { level:'zzz', step:E.EFFORT_STEP_DEFAULT } }));
  eq(unk.ctx.effortLabel, 'Medium', 'unknown effort level labels as Medium');
  eq(unk.ctx.effortMult, 1, 'unknown effort level multiplies at Medium');
  assertCopyClean(unk, 'unknown effort level');

  // malformed persona entries never render "0 undefined"
  const mp = E.compute(E.normalize({ personas: [{ seats: 5 }] }));
  assertCopyClean(mp, 'malformed persona');
  ok(typeof E.normalize({ personas: [{ seats: 5 }] }).personas[0].name === 'string',
     'persona with no name is renamed');
}

/* ── R1 · UI-side invariants, asserted against the raw source ───────────── */
{
  ok(/var candidate = E\.normalize\(loaded\);/.test(src), 'session loader deep-normalizes the file');
  ok(src.indexOf('E.compute(candidate);') >= 0 &&
     src.indexOf('E.compute(candidate);') < src.indexOf('state = candidate;'),
     'session loader test-computes before assigning state');
  ok(!/state = Object\.assign\(E\.defaults\(\), loaded\)/.test(src), 'shallow session assign is gone');
  ok(/function refresh\(\) \{\s*try \{/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')),
     'refresh() is wrapped in try/catch');
  ok(src.indexOf('errStrip') >= 0, 'refresh() renders an error strip instead of dying');
  ok(/Math\.min\(30, \+e\.target\.value/.test(src), 'manual discount input clamps at 30');
  ok(/if \(c\.effortStep != null\) state\.effort\.step = Math\.max\(1, Math\.min\(3,/.test(src),
     'rate-card loader clamps effortStep to the slider range');
  ok(!/if \(state\.effort && E\.EFFORT_RETIRED\[state\.effort\.level\]\)/.test(src),
     'session loader no longer pre-rewrites retired effort levels');
}

/* ══════════════════════════════════════════════════════════════════════════
   (R3–R8 sections append here)
   ══════════════════════════════════════════════════════════════════════════ */

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
