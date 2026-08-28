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
  ['V-05','V-27','V-28','V-29','V-30'].forEach(function (id) {
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
   R2 — Calibration integrity (v2 §6.1 + finding #2)
   ══════════════════════════════════════════════════════════════════════════ */
{
  // The constant exists and everything agrees on it
  eq(E.CONST.TIER_DEFAULT.light, 125, 'TIER_DEFAULT.light');
  eq(E.CONST.TIER_DEFAULT.medium, 500, 'TIER_DEFAULT.medium');
  eq(E.CONST.TIER_DEFAULT.heavy, 1200, 'TIER_DEFAULT.heavy');
  const d = E.defaults();
  eq(d.tierCredits.light, 125, 'defaults() reads TIER_DEFAULT');
  ok(d.tierCredits !== E.CONST.TIER_DEFAULT, 'defaults() copies TIER_DEFAULT, never aliases it');

  // v2 §6.4.1 — the flag alone can never buy measured status, by any path
  const forged = E.compute(st({ calibrated: true }));
  eq(forged.ctx.calibrated, false, '{"calibrated":true} session stays uncalibrated');
  eq(forged.ctx.band, E.CONST.BAND.modeled, 'forged flag keeps the ±30% band');
  ok(wids(forged).indexOf('V-30') >= 0, 'forged flag raises V-30 naming the disagreement');
  ['F10','F11','B1','B2'].forEach(function (id) {
    eq(row(forged, id).prov, 'ms-modeled', 'forged flag: ' + id + ' stays ms-modeled');
  });
  ok(row(forged, 'F10').note != null, 'forged flag: F10 disclosure still present');

  // strict boolean: a truthy non-boolean is not a calibration
  const noStr = E.compute(st({ calibrated: 'no' }));
  eq(noStr.ctx.calibrated, false, '{"calibrated":"no"} is uncalibrated (strict boolean)');
  ok(wids(noStr).indexOf('V-30') === -1, 'V-30 silent when the flag is not strictly true');
  eq(E.compute(st({ calibrated: 1 })).ctx.calibrated, false, 'calibrated:1 is uncalibrated');

  // v2 §6.4.2 — genuine calibration flips band and provenance together
  const genuine = E.compute(st({ calibrated: true, tierCredits: { light:130, medium:500, heavy:1200 } }));
  eq(genuine.ctx.calibrated, true, 'a real tier edit + flag is calibrated');
  eq(genuine.ctx.band, E.CONST.BAND.measured, 'genuine calibration tightens to ±15%');
  ['F10','F11','B1','B2'].forEach(function (id) {
    eq(row(genuine, id).prov, 'measured', 'genuine: ' + id + ' carries measured');
  });
  ok(wids(genuine).indexOf('V-30') === -1, 'V-30 silent on genuine calibration');

  // finding #2 C3 — the F10 disclosure SWAPS, it never disappears
  const note = row(genuine, 'F10').note;
  ok(note != null && note.indexOf('/cost') >= 0 && note.indexOf('measured') >= 0,
     'genuine calibration swaps the F10 note to the partner attribution');
  ok(note.indexOf('not Microsoft') >= 0, 'swapped note says whose model it is not');
  ok(aids(genuine).indexOf('F10') >= 0, 'F10 assumption entry survives calibration');
  ok(aids(forged).indexOf('F10') >= 0, 'F10 assumption entry present uncalibrated');

  // no third state: tiers differ but flag false stays modeled
  const editedOnly = E.compute(st({ tierCredits: { light:130, medium:500, heavy:1200 } }));
  eq(editedOnly.ctx.calibrated, false, 'a tier edit without the flag is not calibrated');
  eq(editedOnly.ctx.band, E.CONST.BAND.modeled, 'edit-only keeps ±30%');
  eq(row(editedOnly, 'F10').prov, 'ms-modeled', 'edit-only F10 stays ms-modeled');

  // sell-mode precedence on F11 is untouched by calibration
  const sellCal = E.compute(st({ calibrated: true,
    tierCredits: { light:130, medium:500, heavy:1200 },
    pricing: Object.assign(E.defaults().pricing, { mode:'sell', creditSellUsd: 0.02 }) }));
  eq(row(sellCal, 'F11').prov, 'partner', 'F11 partner provenance outranks measured at a resold rate');

  // zeroed tiers with the flag: measured (they differ), but the envelope warns
  const zeroed = E.compute(st({ calibrated: true, tierCredits: { light:0, medium:0, heavy:0 } }));
  ok(wids(zeroed).indexOf('V-08') >= 0, 'zeroed measured tiers cannot pass silently');
}

/* ── R2 · UI-side invariants, asserted against the raw source ───────────── */
{
  ok(src.indexOf('Nothing here has changed from the modelled defaults, so there is nothing to calibrate yet') >= 0,
     'calApply refuses with the specced sentence');
  ok(/state\.tierCredits = \{ light:E\.CONST\.TIER_DEFAULT\.light/.test(src),
     'calReset reads CONST.TIER_DEFAULT instead of hardcoding');
  ok(!/state\.tierCredits = \{ light:125/.test(src), 'no second hardcoded tier-default literal');
  ok(/tierCredits: \{ light:CONST\.TIER_DEFAULT\.light/.test(src),
     'defaults() reads CONST.TIER_DEFAULT');
}

/* ══════════════════════════════════════════════════════════════════════════
   R3 — Provenance honesty (findings #9, #10, #11, #24)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── R3.0 · The anchor does not move: '' preset, same seats, same number ── */
{
  const d = E.defaults();
  eq(d.personaPreset, '', 'defaults ship no persona preset (finding #10)');
  eq(d.personaTasksTouched, false, 'defaults ship personaTasksTouched false');
  eq(d.personas.map(p => p.seats).join(','), '26,13,6,7', 'stock seats stay 26/13/6/7');
  const r = E.compute(d);
  eq(Math.round(r.ctx.monthlyCredits), 755000, 'R3 anchor: stock credits unchanged');
  eq(Math.round(r.ctx.monthlyCowork), 7550, 'R3 anchor: stock monthly unchanged');
  ok(aids(r).indexOf('preset') === -1, 'no preset assumption for the shipped default');
  eq(row(r, 'F6').prov, 'partner', 'stock F6 stays partner-asked');
  eq(row(r, 'F10').prov, 'ms-modeled', 'stock F10 stays ms-modeled');
  eq(row(r, 'R1').prov, 'ms-modeled', 'stock R1 computes to ms-modeled from its inputs');
}

/* ── R3.1 · weakest() is live and no longer seed-poisoned ───────────────── */
{
  eq(E.weakest([]), 'ms-verified', 'weakest of nothing is ms-verified');
  eq(E.weakest(['measured']), 'measured', 'weakest([measured]) is measured — the old seed made this unreachable');
  eq(E.weakest(['measured','ms-verified']), 'measured', 'rank-4 tie keeps the first-listed tag');
  eq(E.weakest(['ms-modeled','ms-verified']), 'ms-modeled', 'modeled beats verified downward');
  eq(E.weakest(['ms-verified','editorial','partner']), 'editorial', 'editorial is the floor');
  eq(E.weakest([null,'partner',undefined]), 'partner', 'falsy entries are ignored');
}

/* ── R3.2 · Benchmark mode stops laundering the 2.6× (finding #9) ───────── */
{
  const s = E.defaults(); s.activation.mode = 'benchmark';
  const r = E.compute(s);
  eq(row(r, 'F6').prov, 'editorial', 'benchmark-mode F6 is editorial via weakest()');
  ok(aids(r).indexOf('F6') >= 0, 'benchmark mode pushes an F6 assumption');
  const note = r.assumptions.filter(a => a.id === 'F6')[0].note;
  ok(note.indexOf('TD SYNNEX') >= 0, 'the F6 assumption names TD SYNNEX');
  ok(note.indexOf('not Microsoft') >= 0, 'the F6 assumption says whose data it is not');
  // and the provenance change moved no numbers
  eq(r.ctx.active, 43, 'benchmark-mode active count unchanged (43)');
  eq(r.ctx.monthlyCredits, 623475, 'benchmark-mode credits unchanged (623,475)');
  // non-benchmark modes carry no F6 assumption
  ok(aids(E.compute(E.defaults())).indexOf('F6') === -1, 'rate mode pushes no F6 assumption');
}

/* ── R3.3 · The R2 ratio row wears the benchmark's provenance in all modes ─ */
{
  ['rate','count','benchmark'].forEach(function (m) {
    const s = E.defaults(); s.activation.mode = m;
    if (m === 'count') s.activation.count = 52;
    const r = E.compute(s);
    eq(row(r, 'R2').prov, 'editorial', 'R2 row is editorial in ' + m + ' mode');
    ok(aids(r).indexOf('R2') >= 0, 'R2 assumption present in ' + m + ' mode');
    ok(r.assumptions.filter(a => a.id === 'R2')[0].note.indexOf('TD SYNNEX') >= 0,
       'R2 assumption names TD SYNNEX in ' + m + ' mode');
  });
}

/* ── R3.4 · R2 calibration semantics survive the weakest() rewire ────────── */
{
  // (the R2 section above already re-proves F10/F11/B1/B2; this pins the two
  //  new interactions)
  const calTouched = E.compute(st({ calibrated: true, personaTasksTouched: true,
    tierCredits: { light:130, medium:500, heavy:1200 } }));
  eq(row(calTouched, 'F10').prov, 'partner',
     'edited counts under a genuine calibration read partner — every input is the partner’s');
  const touchedOnly = E.compute(st({ personaTasksTouched: true }));
  eq(row(touchedOnly, 'F10').prov, 'ms-modeled',
     'edited counts under the modeled tiers stay ms-modeled — the model is still the weakest link');
}

/* ── R3.5 · personaTasksTouched: state, attribution, assumptions (#11) ───── */
{
  // strict boolean through the loader pipeline
  eq(E.normalize({ personaTasksTouched: 'yes' }).personaTasksTouched, false,
     'a truthy string is not an edit trail (strict boolean)');
  eq(E.normalize({ personaTasksTouched: true }).personaTasksTouched, true,
     'the real flag survives normalize');
  eq(E.normalize({}).personaTasksTouched, false, 'absent flag lands false');

  // the flag survives a session save/load round-trip
  const saved = E.defaults(); saved.personas[2].heavy = 60; saved.personaTasksTouched = true;
  eq(E.normalize(JSON.parse(JSON.stringify(saved))).personaTasksTouched, true,
     'flag survives JSON round-trip');

  // edited counts push a partner-attributed assumption
  const r = E.compute(saved);
  ok(aids(r).indexOf('persona-tasks') >= 0, 'edited counts push the persona-tasks assumption');
  const a = r.assumptions.filter(x => x.id === 'persona-tasks')[0];
  eq(a.prov, 'partner', 'persona-tasks assumption is partner provenance');
  ok(a.note.indexOf('not Microsoft') >= 0, 'the note says the counts are not Microsoft’s');

  // no engine-rendered string attributes edited counts to Microsoft
  const claims = r.assumptions.map(x => x.note).join(' ');
  ok(claims.indexOf('task mix inside each persona is Microsoft') === -1,
     'no assumption claims Microsoft authorship of edited counts');

  // a preset loaded alongside edited counts discloses both
  const both = E.defaults(); both.personaPreset = 'prof';
  both.personas[0].light = 99; both.personaTasksTouched = true;
  const rb = E.compute(both);
  const pn = rb.assumptions.filter(x => x.id === 'preset')[0];
  ok(pn && pn.note.indexOf('edited by hand') >= 0,
     'preset note discloses the hand-edited counts');
  // untouched preset keeps the Microsoft sentence
  const clean = E.applyPreset(Object.assign(E.defaults(), { personaPreset:'prof' }), 'prof');
  const rc = E.compute(clean);
  const pc = rc.assumptions.filter(x => x.id === 'preset')[0];
  ok(pc && pc.note.indexOf('task mix inside each persona is Microsoft') >= 0,
     'untouched preset still credits Microsoft for the counts');
}

/* ── R3.6 · Preset click restores Microsoft's counts and clears the flag ── */
{
  const s = E.defaults();
  s.personas.forEach(function (p) { p.light = 999; p.medium = 999; p.heavy = 999; });
  s.personaTasksTouched = true; s.personaPreset = '';
  E.applyPreset(s, 'prof');
  s.personas.forEach(function (p, i) {
    const d = E.PERSONA_DEFAULTS[i];
    eq(p.light, d.light, 'preset restores light for ' + d.key);
    eq(p.medium, d.medium, 'preset restores medium for ' + d.key);
    eq(p.heavy, d.heavy, 'preset restores heavy for ' + d.key);
  });
  eq(s.personaTasksTouched, false, 'preset click clears personaTasksTouched');
  // and the restored state carries no partner-counts assumption
  s.personaPreset = 'prof';
  ok(aids(E.compute(s)).indexOf('persona-tasks') === -1,
     'restored counts drop the persona-tasks assumption');
}

/* ── R3.7 · Computed literals and the wrong retail sentence (#24, #22) ───── */
{
  eq(E.PRESETS.retail.w.join(','), '0.35,0.2,0.1,0.35', 'retail weights untouched');
  ok(E.PRESETS.retail.why.indexOf('shorter, more frequent') === -1,
     'the false retail frequency claim is gone');
  ok(E.PRESETS.retail.why.indexOf('lightest task mix') >= 0,
     'retail rationale now states what the data supports');
  // the divisors are catalog reads, so this stays true if the price moves
  eq(E.SKU_BY_ID['cop_biz'].usd, 18, 'cop_biz catalog price (ratio-explainer divisor)');
  eq(E.SKU_BY_ID['cop_ent'].usd, 30, 'cop_ent catalog price (ratio-explainer divisor)');
}

/* ── R3 · UI-side invariants, asserted against the raw source ───────────── */
{
  ok(!/personaPreset: 'even'/.test(src), 'defaults() no longer claims the even preset');
  ok(!/You have edited the split by hand, so no preset applies/.test(src),
     'the false custom-mix copy is gone');
  ok(/perActiveMs \/ E\.SKU_BY_ID\['cop_biz'\]\.usd/.test(src),
     'ratio explainer divides by the cop_biz catalog price');
  ok(/perActiveMs \/ E\.SKU_BY_ID\['cop_ent'\]\.usd/.test(src),
     'ratio explainer divides by the cop_ent catalog price');
  ok(!/perActiveMs \/ 18/.test(src) && !/perActiveMs \/ 30/.test(src),
     'no bare price literal left in the ratio-explainer math');
  ok(/implied by this E7 a-la-carte arithmetic, not read from a price list/.test(src),
     'the E5 srcline matches its ms-modeled tag');
  ok(/The 2\.6&times; benchmark, honestly ' \+ provPill\('editorial'\)/.test(src),
     'ratio whybox header carries the editorial pill');
  ok(/TD SYNNEX editorial observation<\/b>/.test(src),
     'step 3 chip group carries a TD SYNNEX srcline');
  ok(/data-psrc/.test(src), 'persona srcline is patchable in place');
  ok(/Task counts were reset<\/b>/.test(src), 'preset click announces the count reset');
  ok(/edited by hand<\/b>/.test(src), 'srcline has a partner-attribution branch');
  ok(/if \(pf !== 'seats'\) state\.personaTasksTouched = true;/.test(src),
     'task-cell edits set the flag; seat edits do not');
}

/* ══════════════════════════════════════════════════════════════════════════
   R4 — Licensing correctness (finding #8, both halves)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── R4.0 · SMB shapes unchanged: stock licensing output pinned ─────────── */
{
  // Captured from the pre-R4 engine under node (git 078cc35 lineage). The
  // base-qualification rework must not move a single stock number: the 40
  // owned Business Standard seats qualify for BOTH add-ons, exactly as the
  // old aggregate count happened to credit them.
  const L = E.compute(E.defaults()).licensing;
  eq(L.winner.id, 'bprem_cop_suites', 'stock winner unchanged');
  eq(L.needed, 80, 'stock needed unchanged');
  eq(L.baseSeatsNeeded, 40, 'stock baseSeatsNeeded unchanged');
  const EXPECT = {
    bbasic_cop:       { perUserAllIn: 21,   monthly: 1680, baseSeats: 0,  baseUsd: 0,    feasible: true },
    cop_biz:          { perUserAllIn: 21,   monthly: 1680, baseSeats: 40, baseUsd: 240,  feasible: true },
    bstd_cop:         { perUserAllIn: 23.5, monthly: 1880, baseSeats: 0,  baseUsd: 0,    feasible: true },
    bprem_cop:        { perUserAllIn: 32,   monthly: 2560, baseSeats: 0,  baseUsd: 0,    feasible: true },
    bprem_cop_suites: { perUserAllIn: 47,   monthly: 3760, baseSeats: 0,  baseUsd: 0,    feasible: true },
    cop_ent:          { perUserAllIn: 48,   monthly: 3840, baseSeats: 40, baseUsd: 1440, feasible: true },
    e7:               { perUserAllIn: 99,   monthly: 7920, baseSeats: 0,  baseUsd: 0,    feasible: true }
  };
  L.paths.forEach(function (p) {
    const x = EXPECT[p.id];
    ok(x, 'stock path list unchanged: ' + p.id);
    if (!x) return;
    eq(+p.perUserAllIn.toFixed(4), x.perUserAllIn, 'stock ' + p.id + ' $/user unchanged');
    eq(p.monthly, x.monthly, 'stock ' + p.id + ' monthly unchanged');
    eq(p.baseSeats, x.baseSeats, 'stock ' + p.id + ' base seats unchanged');
    eq(p.baseUsd, x.baseUsd, 'stock ' + p.id + ' base dollars unchanged');
    eq(p.feasible, x.feasible, 'stock ' + p.id + ' feasibility unchanged');
  });
  eq(L.paths.length, 7, 'stock path count unchanged');
}

/* ── R4.1 · Repro (a): the 250-seat E3 estate resolves enterprise (#8) ──── */
{
  function e3Estate() {
    const s = E.defaults();
    s.org.totalEmployees = 250;
    s.licenseInventory = [{ skuId:'e3', seats:250 }, { skuId:'cop_ent', seats:120 }];
    s.governanceAsked = true;
    Object.keys(s.governance).forEach(k => s.governance[k] = 'yes');
    return s;
  }
  const r = E.compute(e3Estate());
  const L = r.licensing;
  eq(L.winner.id, 'cop_ent', 'E3 estate + governance confirmed resolves to the enterprise add-on');
  ok(L.winner.id !== 'cop_biz', 'never cop_biz on an E3 estate');
  const biz = L.paths.filter(p => p.id === 'cop_biz')[0];
  eq(biz.feasible, false, 'cop_biz is infeasible against an all-enterprise base estate');
  ok(biz.violations[0].indexOf('attach') >= 0, 'the cop_biz violation says why (cannot attach)');
  // the SMB bundles cannot sneak in on price either — they would replace E3
  ['bbasic_cop','bstd_cop','bprem_cop','bprem_cop_suites'].forEach(function (id) {
    const p = L.paths.filter(x => x.id === id)[0];
    eq(p.feasible, false, id + ' is not offered as a base replacement for an E3 estate');
    ok(p.violations[0].indexOf('replace') >= 0, id + ' violation names the base replacement');
  });
  const ent = L.paths.filter(p => p.id === 'cop_ent')[0];
  eq(ent.baseSeats, 0, 'the enterprise add-on credits the owned E3 bases');
  eq(ent.monthly, 120 * 30, 'enterprise add-on priced with no invented base cost');
}

/* ── R4.2 · Repro (b): the same estate fires no headcount alarm (#8) ────── */
{
  const s = E.defaults();
  s.org.totalEmployees = 250;
  s.licenseInventory = [{ skuId:'e3', seats:250 }, { skuId:'cop_ent', seats:120 }];
  const r = E.compute(s);
  ok(wids(r).indexOf('V-01') === -1, '250 emp + 250×E3 + 120×cop_ent fires no V-01');
  eq(r.ctx.unlicensed, 0, 'add-on seats do not count as extra people');

  // the exclusion is only for add-ons — a genuinely over-licensed estate still alarms
  const over = E.compute(st({ org: Object.assign(E.defaults().org, { totalEmployees: 40 }),
    licenseInventory: [{ skuId:'bprem_cop', seats:60 }] }));
  ok(wids(over).indexOf('V-01') >= 0, '60 bundle seats against 40 employees still fires V-01');

  // an add-on with no base under it is still a person, not a blind spot
  const bare = E.compute(st({ org: Object.assign(E.defaults().org, { totalEmployees: 40 }),
    licenseInventory: [{ skuId:'cop_biz', seats:50 }] }));
  ok(wids(bare).indexOf('V-01') >= 0, '50 baseless add-on seats against 40 employees still fires V-01');

  // stacking shape that the old per-SKU sum falsely alarmed on
  const stack = E.compute(st({ org: Object.assign(E.defaults().org, { totalEmployees: 100 }),
    licenseInventory: [{ skuId:'bstd', seats:40 }, { skuId:'bprem_cop', seats:60 }, { skuId:'cop_biz', seats:20 }] }));
  ok(wids(stack).indexOf('V-01') === -1, '100 people on 120 stacked seats fires no V-01');
}

/* ── R4.3 · Base qualification is per-family, mixed estates stay quiet ──── */
{
  const s = st({ org: Object.assign(E.defaults().org, { totalEmployees: 300 }),
    licenseInventory: [{ skuId:'bstd', seats:30 }, { skuId:'e3', seats:100 }, { skuId:'bprem_cop', seats:50 }] });
  const L = E.compute(s).licensing;
  eq(L.needed, 50, 'mixed estate: 50 Copilot users to cover');
  const biz = L.paths.filter(p => p.id === 'cop_biz')[0];
  eq(biz.feasible, true, 'mixed estate: cop_biz stays on the table (SMB bases exist)');
  eq(biz.baseSeats, 20, 'cop_biz credits only the 30 Business bases, not the 100 E3');
  const ent = L.paths.filter(p => p.id === 'cop_ent')[0];
  eq(ent.baseSeats, 0, 'cop_ent credits Business and E3 bases alike (130 owned ≥ 50 needed)');

  // an enterprise-based greenfield gets the enterprise pilot, not a Business
  // bundle (governance confirmed so gap-closure cannot steer the winner)
  const gf = st({ org: Object.assign(E.defaults().org, { totalEmployees: 100 }),
    licenseInventory: [{ skuId:'e3', seats:100 }],
    governanceAsked: true,
    governance: { purviewLabels:'yes', dlpForAi:'yes', defenderCloudApps:'yes',
                  namedCostOwner:'yes', insuranceRenewal:'yes' } });
  const GL = E.compute(gf).licensing;
  eq(GL.needed, 25, 'enterprise greenfield sizes to the 25-user pilot');
  eq(GL.winner.id, 'cop_ent', 'enterprise greenfield is pointed at the enterprise add-on');
  eq(GL.winner.baseSeats, 0, 'pilot seats sit on owned E3 bases');
}

/* ── R4 · UI-side invariants, asserted against the raw source ───────────── */
{
  ok(/var people = Math\.max\(baseSeats, copSeats\);/.test(src),
     'patchLic reconciles people, not summed SKUs');
  ok(/if \(people > emp\)/.test(src), 'the licNote alarm runs on the people count');
  ok(!/if \(seats > emp\)/.test(src), 'the raw seat-sum alarm is gone');
  ok(/BASE_FAMILY = \{/.test(src), 'the solver carries the base-family map');
}

/* ══════════════════════════════════════════════════════════════════════════
   R5 — F1, the adoption ramp (v2 §1, finding #5)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── R5.0 · Stock ramp: exact year-one arithmetic, computed by hand ─────── */
{
  const r = E.compute(E.defaults());
  const c = r.ctx;
  eq(c.rampMode, 'linear', 'stock ramp mode is linear (v2 §10.1 stands)');
  eq(c.rampPilot, 25, 'stock pilot 25');
  eq(c.rampMonths, 6, 'stock months 6');
  // Hand-built: seats(m) = min(52, 25 + 27·(m−1)/5)
  const expect = [25, 30.4, 35.8, 41.2, 46.6, 52, 52, 52, 52, 52, 52, 52];
  eq(c.rampSeats.length, 12, 'rampSeats has 12 elements');
  expect.forEach(function (v, i) {
    ok(Math.abs(c.rampSeats[i] - v) < 1e-9, 'stock rampSeats[' + i + '] = ' + v + ' (got ' + c.rampSeats[i] + ')');
  });
  // 543 seat-months against 624 steady
  ok(Math.abs(c.rampFactor - 543 / 624) < 1e-12, 'stock rampFactor = 543/624');
  eq(c.annualCredits, 9060000, 'stock annual credits 9,060,000');
  // round(9,060,000 × 543 ÷ 624) = round(7,883,942.3077) = 7,883,942 exactly
  eq(c.year1Credits, 7883942, 'stock year-one credits = 7,883,942');
  ok(Math.abs(c.cccuYear1 - 78839.42) < 1e-9, 'stock year-one CCCU = 78,839.42');
  eq(c.cccuRequired, 90600, 'steady CCCU still 90,600');
  ok(Math.abs(c.year1Cowork - 78839.42) < 1e-6, 'year1Cowork = year-one credits at $0.01');
  ok(Math.abs(c.year1PaygoAnnual - 78839.42) < 1e-6, 'year1PaygoAnnual at Microsoft rate');
  ok(Math.abs(c.year1AllIn - (c.year1Cowork + c.licenseMonthly * 12)) < 1e-9,
     'year1AllIn = ramped Cowork + licenses × 12 — licenses do not ramp (v2 §1.4)');
  eq(c.rampApplies, true, 'stock ramp applies');
  ok(aids(r).indexOf('ramp') >= 0, 'ramp assumption pushed when the ramp applies');
  const a = r.assumptions.filter(x => x.id === 'ramp')[0];
  eq(a.prov, 'editorial', 'ramp assumption carries editorial provenance');
  ok(a.note.indexOf('editorial') >= 0, 'the note says the shape is editorial');
  ok(a.note.indexOf('partner') >= 0, 'the note says pilot and length are the partner’s inputs');
  ok(a.note.indexOf('projection') >= 0, 'the note says year one is a projection');
}

/* ── R5.1 · Invariants 1–3: the flat shapes are exact, not approximate ──── */
{
  function withRamp(mode, pilot, months) {
    const s = E.defaults();
    s.ramp = { mode: mode, pilotSeats: pilot, months: months };
    return s;
  }
  const rNone = E.compute(withRamp('none', 25, 6));
  const none = rNone.ctx;
  eq(none.rampFactor, 1, 'invariant 1: mode none ⟹ rampFactor === 1 exactly');
  eq(none.year1Credits, none.annualCredits, 'invariant 1: year1Credits === annualCredits exactly');
  eq(none.rampApplies, false, 'mode none gates the ramp copy off');
  ok(aids(rNone).indexOf('ramp') === -1, 'mode none pushes no ramp assumption');
  none.rampSeats.forEach(function (v, i) { eq(v, none.basisSeats, 'mode none rampSeats[' + i + '] = basisSeats'); });

  const m1 = E.compute(withRamp('linear', 25, 1)).ctx;
  eq(m1.rampFactor, 1, 'invariant 2: months 1 ⟹ factor exactly 1');
  ['rampFactor','year1Credits','year1Cowork','year1PaygoAnnual','year1AllIn','cccuYear1','rampApplies']
    .forEach(function (k) { eq(m1[k], none[k], 'invariant 2: months 1 identical to mode none on ' + k); });

  const big = E.compute(withRamp('linear', 500, 6)).ctx;
  eq(big.rampFactor, 1, 'invariant 3: pilot ≥ basisSeats ⟹ factor 1');
  eq(big.rampApplies, false, 'pilot ≥ basisSeats shows no ramp copy');
  eq(big.rampPilot, big.basisSeats, 'pilot clamps to basisSeats at compute time');
  const exact = E.compute(withRamp('linear', 52, 6)).ctx;
  eq(exact.rampFactor, 1, 'invariant 3: pilot === basisSeats ⟹ factor 1');
}

/* ── R5.2 · Invariant 4: 0 < factor ≤ 1 under garbage, incl. basis 0 ────── */
{
  const shapes = [
    { mode:'linear', pilotSeats:-10, months:6 },
    { mode:'linear', pilotSeats:0, months:0 },
    { mode:'linear', pilotSeats:0, months:24.5 },
    { mode:'linear', pilotSeats:'abc', months:'abc' },
    { mode:'garbage', pilotSeats:null, months:{} },
    { mode:'linear', pilotSeats:1e308, months:-5 },
    { mode:'linear', pilotSeats:0, months:24 },
    5, null, 'x', [], true
  ];
  shapes.forEach(function (ramp, i) {
    const s = E.defaults(); s.ramp = ramp;
    let r;
    try { r = E.compute(s); }
    catch (e) { fail++; console.log('FAIL: ramp garbage ' + i + ' threw: ' + e.message); return; }
    const c = r.ctx;
    ok(c.rampFactor > 0 && c.rampFactor <= 1, 'garbage ramp ' + i + ' factor in (0,1] (got ' + c.rampFactor + ')');
    ok(c.year1Credits <= c.annualCredits, 'garbage ramp ' + i + ' year1 ≤ annual (invariant 5)');
    ok(c.cccuYear1 <= c.cccuRequired, 'garbage ramp ' + i + ' cccuYear1 ≤ cccuRequired (invariant 6)');
    eq(c.rampSeats.length, 12, 'garbage ramp ' + i + ' keeps the 12-element vector');
    assertCtxSane(c, 'garbage ramp ' + i);
    assertCopyClean(r, 'garbage ramp ' + i);
  });
  // basisSeats === 0 by zero activation
  const z = E.defaults(); z.activation = { mode:'count', count: 0 };
  const zc = E.compute(z).ctx;
  eq(zc.rampFactor, 1, 'basisSeats 0 (zero active) ⟹ factor 1, no division blow-up');
  eq(zc.year1Credits, 0, 'basisSeats 0 year-one credits 0');
}

/* ── R5.3 · Invariants 4–8: 520-state adversarial ramp fuzz ─────────────── */
{
  // Deterministic LCG so a failure reproduces.
  let seed = 20260828;
  function rand() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  function pick(a) { return a[Math.floor(rand() * a.length)]; }
  const GARBAGE = [0, 1, -1, 0.5, 24, 25, 1e308, -1e308, NaN, Infinity, -Infinity, 'abc', null, undefined, {}, [], true];
  for (let i = 0; i < 520; i++) {
    const s = E.defaults();
    s.ramp = rand() < 0.1 ? pick(GARBAGE)
      : { mode: pick(['linear','none','x', null, 7]),
          pilotSeats: rand() < 0.3 ? pick(GARBAGE) : Math.floor(rand() * 200) - 20,
          months: rand() < 0.3 ? pick(GARBAGE) : rand() * 30 - 2 };
    if (rand() < 0.4) s.licenseInventory = [{ skuId: pick(['bprem_cop','cop_biz','e3','zzz','toString']),
                                              seats: pick([0, 1, 60, 400, 1e308, -5, 'x']) }];
    if (rand() < 0.4) s.activation = { mode: pick(['rate','count','benchmark']), rate: rand() * 2,
                                       count: pick([0, 5, 1e308, -3, 'x', null]) };
    if (rand() < 0.3) s.personas.forEach(function (p) { p.seats = pick([0, 10, 1e308, -1, 'x']); });
    if (rand() < 0.3) s.billing = { model: pick(['p3','paygo']), capacityPacksCccu: pick([0, 500, -100, 'x']),
                                    commitCoveragePct: pick([0, 1, 1.5, 'x']), manualP3Pct: pick([null, 10, 500, 'x']),
                                    p3Holder: pick(['partner','customer','unasked']) };
    let r;
    try { r = E.compute(s); }
    catch (e) { fail++; console.log('FAIL: ramp fuzz ' + i + ' threw: ' + e.message); continue; }
    const c = r.ctx;
    ok(c.rampFactor > 0 && c.rampFactor <= 1, 'fuzz ' + i + ' factor in (0,1] (got ' + c.rampFactor + ')');
    ok(c.year1Credits <= c.annualCredits, 'fuzz ' + i + ' year1Credits ≤ annualCredits');
    ok(c.cccuYear1 <= c.cccuRequired, 'fuzz ' + i + ' cccuYear1 ≤ cccuRequired');
    eq(c.rampSeats.length, 12, 'fuzz ' + i + ' rampSeats length 12');
    let mono = true, capped = true, finite = true;
    for (let m = 0; m < 12; m++) {
      if (!isFinite(c.rampSeats[m])) finite = false;
      if (m && c.rampSeats[m] < c.rampSeats[m - 1] - 1e-9) mono = false;
      if (c.rampSeats[m] > c.basisSeats + 1e-9) capped = false;
    }
    ok(finite, 'fuzz ' + i + ' rampSeats all finite');
    ok(mono, 'fuzz ' + i + ' rampSeats non-decreasing');
    ok(capped, 'fuzz ' + i + ' rampSeats ≤ basisSeats');
    ['rampFactor','year1Credits','year1Cowork','year1PaygoAnnual','year1AllIn','cccuYear1']
      .forEach(function (k) { ok(isFinite(c[k]) && c[k] >= 0, 'fuzz ' + i + ' ' + k + ' finite ≥ 0'); });
    assertCopyClean(r, 'fuzz ' + i);
    // Rebuild the year-one strings the way the render layer formats them and
    // sweep for NaN/undefined (invariant 8 for the surfaces node can reach).
    const built = [Math.round(c.rampMonths), Math.round(c.rampPilot), c.basisSeats,
      Math.round(c.cccuYear1).toLocaleString(), Math.round(c.cccuRequired).toLocaleString(),
      Math.round(c.cccuRequired - c.cccuYear1).toLocaleString(),
      c.year1AllIn.toLocaleString(), (c.year1AllIn + 2 * c.allInAnnual).toLocaleString(),
      c.year1PaygoAnnual.toLocaleString(), (c.year1Cowork * c.band).toLocaleString()].join(' ');
    ok(!/NaN|undefined|Infinity/.test(built), 'fuzz ' + i + ' no NaN/undefined in the year-one strings');
  }
}

/* ── R5.4 · Invariant 9: greenfield stays $0 with no ramp copy ──────────── */
{
  const r = E.compute(st({ licenseInventory: [{ skuId:'bstd', seats:40 }] }));
  eq(r.ctx.greenfield, true, 'greenfield shape recognized');
  eq(r.ctx.monthlyCowork, 0, 'greenfield meter $0');
  eq(r.ctx.year1Credits, 0, 'greenfield year-one credits 0');
  eq(r.ctx.rampFactor, 1, 'greenfield factor 1');
  eq(r.ctx.year1AllIn, r.ctx.allInAnnual, 'greenfield year1AllIn equals the steady year');
  eq(r.ctx.rampApplies, false, 'greenfield shows no ramp copy');
  ok(aids(r).indexOf('ramp') === -1, 'greenfield pushes no ramp assumption');
}

/* ── R5.5 · normalize() repairs a hostile ramp branch ───────────────────── */
{
  eq(E.normalize({ ramp: { mode:'evil', pilotSeats:-10, months:99 } }).ramp.mode, 'linear',
     'unknown mode lands on linear');
  eq(E.normalize({ ramp: { pilotSeats:-10 } }).ramp.pilotSeats, 0, 'negative pilot clamps to 0');
  eq(E.normalize({ ramp: { pilotSeats: 1e308 } }).ramp.pilotSeats, 1e6, 'pilot clamps to MAX.seats');
  eq(E.normalize({ ramp: { months: 99 } }).ramp.months, 24, 'months clamps to 24');
  eq(E.normalize({ ramp: { months: 0 } }).ramp.months, 1, 'months clamps to 1');
  eq(E.normalize({ ramp: { months: 'abc' } }).ramp.months, 6, 'garbage months lands on the default');
  eq(E.normalize({ ramp: 5 }).ramp.months, 6, 'non-object ramp branch rebuilt from defaults');
  eq(E.normalize({}).ramp.mode, 'linear', 'absent ramp branch lands on defaults');
  eq(E.normalize({ ramp: { mode:'none' } }).ramp.mode, 'none', 'a real none survives normalize');
}

/* ── R5.6 · Steady figures untouched; mode 'none' reproduces pre-R5 ─────── */
{
  const d = E.defaults(); d.ramp.mode = 'none';
  const r = E.compute(d);
  const c = r.ctx;
  eq(c.annualCredits, 9060000, 'none: annual credits 9,060,000 (pre-R5 figure)');
  eq(c.cccuRequired, 90600, 'none: steady CCCU 90,600 (pre-R5 figure)');
  ok(Math.abs(c.paygoAnnual - 90600) < 1e-6, 'none: PayGo/year $90,600 (pre-R5 figure)');
  eq(c.year1Credits, 9060000, 'none: year1Credits === annualCredits exactly');
  ok(Math.abs(c.year1AllIn - c.allInAnnual) < 1e-6, 'none: year1AllIn reproduces allInAnnual');
  ok(Math.abs((c.year1AllIn + 2 * c.allInAnnual) - c.allInThreeYear) < 1e-6,
     'none: the 3-year total reproduces × 36');
  eq(Math.round(c.monthlyCredits), 755000, 'none: the 755,000 anchor stands');
  eq(Math.round(c.monthlyCowork), 7550, 'none: the $7,550 anchor stands');
}

/* ── R5 · UI-side invariants, asserted against the raw source ───────────── */
{
  ok(src.indexOf('with certainty') === -1, 'the string "with certainty" occurs nowhere in the file');
  ok(!/\(c\.monthlyCowork - c\.coworkLo\) \* 12/.test(src),
     'the inline ×12 annualization in p3RiskBlock is gone (v2 §0.6)');
  ok(/if \(focusIn\('billBlock'\)\) patchBill\(r\); else renderBill\(r\);/.test(src),
     'refresh() patches the billing block in place while focused');
  ok(/function patchBill\(/.test(src), 'patchBill exists');
  ok(/id="rampPilot"/.test(src) && /id="rampMonths"/.test(src), 'step 6 carries the two ramp inputs');
  ok(/state\.ramp\.months = Math\.max\(1, Math\.min\(24,/.test(src), 'months input clamps to [1, 24]');
  ok(/state\.ramp\.pilotSeats = Math\.max\(0, Math\.min\(E\.CONST\.MAX\.seats,/.test(src),
     'pilot input clamps to [0, MAX.seats]');
  ok(/data-rseat/.test(src) && /data-rbar/.test(src), 'the 12-cell seat strip renders rampSeats');
  ok(/All-in \/ year one/.test(src), 'numAnnual wears the year-one label when the ramp applies');
  ok(/year one ramped, years two and three steady/.test(src), 'numThree names the mixed basis');
  ok(/steady-state year ' \+ usd\(c\.allInAnnual\)/.test(src), 'numAnnual sub-line gives the steady-state year');
  ok(/year1AllIn \+ 2 \* c\.allInAnnual/.test(src), 'numThree computes year one + 2 × steady');
  ok(/Size the commit to year one, not to steady state/.test(src),
     'billOut carries the year-one sizing paragraph');
  ok(/in year one on this ramp/.test(src), 'ECHO.step6 says year one');
  ok(/usd\(c\.year1Cowork \* c\.band\)/.test(src), 'the risk-block shortfall is the ramped year vs the ramped low band');
}

/* ══════════════════════════════════════════════════════════════════════════
   (R6–R8 sections append here)
   ══════════════════════════════════════════════════════════════════════════ */

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
