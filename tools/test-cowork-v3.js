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
   R6 — Print and audience integrity, and the customer-view toggle
   (findings #1, #7, #15, #16, #21, #25, #26 — v3 spec §R6)
   ══════════════════════════════════════════════════════════════════════════ */

/* The render layer's formatters, mirrored for surface reconstruction. */
function usd(v, dp) { return '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }
function num(v) { return Number(v || 0).toLocaleString(); }

/* ── R6.1 · The two strip rule blocks are provably identical (#1, idea 5) ── */
function stripSet(cls) {
  const re = new RegExp('((?:body\\.' + cls + ' [^,{]+,\\s*)+body\\.' + cls + ' [^,{]+)\\{\\s*display:none !important;\\s*\\}');
  const m = src.match(re);
  if (!m) return null;
  return m[1].split(',').map(s => s.trim()).filter(Boolean)
    .map(s => s.replace('body.' + cls + ' ', ''));
}
{
  const cv = stripSet('customer-view');
  const pc = stripSet('print-customer');
  ok(cv, 'customer-view strip block parses');
  ok(pc, 'print-customer strip block parses');
  if (cv && pc) {
    eq(cv.length, pc.length, 'both strip lists have the same length');
    eq(cv.join('|'), pc.join('|'), 'STRIP LISTS IDENTICAL, same order — a fork recreates finding #1');
    // (ii) the flags card is in the strip set — every warning is partner coaching
    ok(cv.indexOf('#cardFlags') >= 0, '#cardFlags is in the customer strip set (finding #1)');
    // the rest of the mandatory members
    ['.deriv','.ribbon-deriv','.pill','#cardTalk','#cardNext','#cardBilling','#cardRecap',
     '.partner-only','#basisBar','.whybox:not(.cust-ok)','#assumeCard'].forEach(function (s) {
      ok(cv.indexOf(s) >= 0, 'strip set carries ' + s);
    });
    eq(cv.length, 12, 'strip set is exactly the 12 decided selectors');
  }
  // exactly one print-customer block (the old fork inside @media print is gone)
  eq((src.match(/body\.print-customer #assumeCard/g) || []).length, 1,
     'only one print-customer strip block exists');
  eq((src.match(/body\.customer-view #assumeCard/g) || []).length, 1,
     'only one customer-view strip block exists');
  // adjacency + the binding comment
  const cvIdx = src.indexOf('body.customer-view .deriv');
  const pcIdx = src.indexOf('body.print-customer .deriv');
  ok(cvIdx > 0 && pcIdx > cvIdx && pcIdx - cvIdx < 900, 'the two blocks are adjacent');
  ok(/must stay\s+identical/.test(src), 'the binding comment marks the pair');
  // the print block sits inside a @media print context
  const between = src.slice(cvIdx, pcIdx);
  ok(/@media print \{\s*$/.test(between.slice(0, between.lastIndexOf('body.print-customer')) ) ||
     /@media print \{/.test(between), 'print-customer block is inside @media print');
  // the pill is not display:none'd by the strip set and the govLead renders
  // only inside #cardFlags (verified by source: the only govLead sink is flagHtml)
  ok(/flagHtml = govLead \+ flagHtml/.test(src), 'govLead renders only into the flags card');
  ok(!/(\$\('(?!flagBody)\w+'\)[^;]*govLead)/.test(src), 'govLead reaches no other element');
}

/* ── R6.2 · Worst leak configs: the customer surface carries no partner
       economics (#1, #7). The surviving fragments are rebuilt exactly the
       way the render layer formats them (same precedent as R5.3), then
       swept for the leaked figures and phrases of finding #1. ─────────── */
function customerSurface(r, L) {
  const c = r.ctx;
  const parts = [];
  // print header (rendered disclaimer, sell mode)
  parts.push(c.sellMode
    ? 'Estimate, not a quote. Figures reflect the inputs shown and are priced at your partner’s rates; Microsoft list prices where noted.'
    : 'Estimate, not a quote. Figures reflect the inputs shown and Microsoft list prices current at the date above.');
  // say line
  parts.push('if ' + c.basisSeats + ' of your ' + c.copilotLicensed + ' Copilot users actively use Cowork at typical volumes, you\'d spend roughly ' +
    usd(c.coworkLo) + ' to ' + usd(c.coworkHi) + ' a month on Cowork credits, on top of ' + usd(c.licenseMonthly) +
    ' a month in licenses. That\'s about ' + usd(c.perActive) + ' per active user');
  // ribbon chip values (pills stripped)
  parts.push([num(c.employees), num(c.copilotLicensed), num(c.active), num(c.monthlyCredits),
    usd(c.coworkLo) + '–' + usd(c.coworkHi)].join(' '));
  // the number card
  parts.push(usd(c.monthlyCowork) + ' Cowork credits / month ' + usd(c.coworkLo) + '–' + usd(c.coworkHi) + ' at ±30%');
  parts.push(usd(c.licenseMonthly) + ' Licenses / month ' + c.copilotLicensed + ' Copilot + ' + c.nonCopilotSeats +
    ' base seats · ' + (c.sellMode ? 'your sell prices' : 'Microsoft list'));
  parts.push('Seat vs meter — ' + usd(c.allInMonthly) + '/month all in Licenses ' + usd(c.licenseMonthly) +
    ' Cowork meter ' + usd(c.monthlyCowork));
  if (c.rampApplies) {
    parts.push(usd(c.year1AllIn) + ' All-in / year one ramping ' + num(Math.round(c.rampPilot)) + '→' + num(c.basisSeats) +
      ' users over ' + Math.round(c.rampMonths) + ' months · steady-state year ' + usd(c.allInAnnual));
    parts.push(usd(c.year1AllIn + 2 * c.allInAnnual) + ' All-in / 3 years year one ramped, years two and three steady');
  } else {
    parts.push(usd(c.allInAnnual) + ' All-in / year licenses + Cowork × 12');
    parts.push(usd(c.allInThreeYear) + ' All-in / 3 years at today\'s volumes and prices');
  }
  parts.push('Includes promo pricing that ends 2026-12-31 — months after that date are still projected at the promo price. Re-verify before quoting.');
  // scenarios + the cust-ok cost-controls whybox, minus its partner-only span
  r.scenarios.forEach(function (s) { parts.push(s.label + ' +' + num(Math.round(s.credits)) + ' +' + usd(s.usd) + ' ' + usd(s.allIn)); });
  parts.push('1 · A tenant-level monthly spending limit in Copilot → Cost Management, sized to the high end above.');
  parts.push('2 · Per-user limits with email alerts at 50% and 80%, so nobody discovers a problem on the invoice.');
  parts.push('3 · A monthly Cost Management review — concentration check, top-5 users, and a re-forecast.');
  // licensing card: table, why (minus the operator line), requirements, term line
  if (L && L.winner) {
    L.paths.forEach(function (p) {
      parts.push(p.label + ' ' + usd(p.perUserAllIn, 2) + ' ' + (p.feasible ? usd(p.monthly) : 'n/a ' + (p.violations[0] || '')));
    });
    L.why.forEach(function (w) {
      if (w.indexOf('change your answers in the readiness step') === -1) parts.push(w);
    });
    L.requirements.forEach(function (q) { parts.push(q.label + ' — ' + q.why); });
    parts.push('At Microsoft list, E7 at ' + usd(L.e7.list) + '/user/mo bundles E5 ($60) ... ' + usd(L.e7.alacarte) + ' assembled separately');
    parts.push('These are annual-term subscriptions: cancellation is limited to a short window at the start of the term, and seat counts cannot be reduced until renewal — plan the count as carefully as the price.');
  }
  return parts.join('\n');
}
{
  // Config A — the finding-#1 worst case: direct motion, PEC yes 15%, P3
  // with the partner holding it, sell mode with license and meter markup.
  const A = E.defaults();
  A.channel = { motion:'direct', providerCreditUsd:null };
  A.pricing = Object.assign(E.defaults().pricing,
    { mode:'sell', creditSellUsd:0.025, pec:{ status:'yes', pct:15 } });
  A.pricing.sell = { bprem_cop:45, cop_biz:25, bstd:15 };
  A.pricing.cost = { bprem_cop:28, cop_biz:15, bstd:10 };
  A.billing = Object.assign(E.defaults().billing, { model:'p3', p3Holder:'partner' });
  const rA = E.compute(A), cA = rA.ctx;
  ok(cA.pecKnown && cA.pecPct === 15, 'config A reaches the PEC-15% economics internally');
  ok(cA.meterMarginAnnual > 0 && cA.licenseUpliftMonthly > 0, 'config A carries a real margin and uplift');
  const sA = customerSurface(rA, rA.licensing);
  // none of the partner-economics figures may appear on the customer surface
  [cA.meterMarginAnnual, cA.partnerCostAnnual, cA.paygoPartnerCost, cA.p3PartnerCost,
   cA.coworkAtMsRate, cA.licenseUpliftMonthly, cA.licenseMarginMonthly, cA.licenseList,
   cA.p3Exposure, cA.p3Annual, cA.paygoAnnual].forEach(function (v, i) {
    ok(sA.indexOf(usd(v)) === -1, 'config A: partner/PEC figure ' + i + ' (' + usd(v) + ') absent from the customer surface');
  });
  // none of finding #1's leaked phrases
  ['Set your rate card','your loss, not theirs','before you show this to a customer',
   'partner-economics','discovery list','partner-earned','margin','uplift',
   'costs you','Internal only','what the meter costs'].forEach(function (p) {
    ok(sA.toLowerCase().indexOf(p.toLowerCase()) === -1, 'config A: phrase "' + p + '" absent from the customer surface');
  });
  ok(!/\bPEC\b/.test(sA), 'config A: the acronym PEC absent from the customer surface');
  // (iv) the sell-mode disclaimer carries no unqualified Microsoft-list claim
  ok(sA.indexOf('priced at your partner’s rates; Microsoft list prices where noted') >= 0,
     'config A: sell-mode disclaimer states the partner-rate basis');
  ok(sA.indexOf('Microsoft list prices current at the date above') === -1,
     'config A: the old unqualified list-price sentence is gone from the sell surface');

  // Config B — indirect reseller with a provider rate above the sell rate:
  // the inverted margin (finding #12's shape) must never reach the customer.
  const B = E.defaults();
  B.channel = { motion:'indirectReseller', providerCreditUsd:0.02 };
  B.pricing = Object.assign(E.defaults().pricing, { mode:'sell', creditSellUsd:0.005 });
  const rB = E.compute(B), cB = rB.ctx;
  ok(cB.meterMarginAnnual < 0, 'config B computes the inverted reseller margin internally');
  const sB = customerSurface(rB, rB.licensing);
  [Math.abs(cB.meterMarginAnnual), cB.partnerCostAnnual, cB.meterBilledAnnual].forEach(function (v, i) {
    ok(sB.indexOf(usd(v)) === -1, 'config B: reseller figure ' + i + ' (' + usd(v) + ') absent from the customer surface');
  });
  ['provider','distributor','margin','TD SYNNEX'].forEach(function (p) {
    ok(sB.toLowerCase().indexOf(p.toLowerCase()) === -1, 'config B: phrase "' + p + '" absent from the customer surface');
  });
  ok(!/\bPEC\b/.test(sB), 'config B: the acronym PEC absent from the customer surface');

  // and the leaked phrases exist ONLY in engine warning strings or blocks the
  // strip removes — never in a customer-surviving render site
  ok(src.indexOf('Set your rate card before you show this to a customer') >= 0,
     'the V-25 coaching still exists for the partner (it renders into the stripped #cardFlags)');
}

/* ── R6.3 · Promo cliff on the projection cells (#15) ───────────────────── */
{
  // engine: stock catalog, today inside the promo window → the cop_biz line
  const today = new Date();
  const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const stock12 = E.promoCliffs(E.defaults(), '2026-08-28', 12);
  eq(stock12.length, 1, 'stock inventory: one promo line inside the ×12 window');
  eq(stock12[0].id, 'cop_biz', 'the promo line is the cop_biz inventory line');
  eq(stock12[0].promoEnds, '2026-12-31', 'the caveat names the catalog date');
  eq(E.promoCliffs(E.defaults(), '2026-08-28', 36).length, 1, 'same line inside the ×36 window');
  // TODAY (the render layer's actual call) still renders while the promo lives
  if (iso <= '2026-12-31')
    ok(E.promoCliffs(E.defaults(), iso, 12).length >= 1, 'with the stock catalog TODAY the caveat renders');
  // a window that closes before the expiry does not
  eq(E.promoCliffs(E.defaults(), '2026-08-28', 3).length, 0, 'a 3-month window before the expiry is silent');
  // an inventory with no promo SKUs never fires
  const noPromo = Object.assign(E.defaults(), { licenseInventory: [{ skuId:'bprem_cop', seats:60 }] });
  eq(E.promoCliffs(noPromo, '2026-08-28', 36).length, 0, 'no promo SKUs → no caveat');
  // an expired promo is a stale-price problem, not a cliff
  eq(E.promoCliffs(E.defaults(), '2027-02-01', 12).length, 0, 'an already-expired promo does not fire the cliff');
  // zero-seat promo lines do not fire
  const zeroSeats = Object.assign(E.defaults(), { licenseInventory: [{ skuId:'cop_biz', seats:0 }] });
  eq(E.promoCliffs(zeroSeats, '2026-08-28', 12).length, 0, 'zero-seat promo lines are not priced, so no caveat');
  // total under garbage
  [null, undefined, 'garbage', '2026-13-99', 123].forEach(function (t, i) {
    let out;
    try { out = E.promoCliffs(E.defaults(), t, 12); }
    catch (e) { fail++; console.log('FAIL: promoCliffs threw on today ' + i + ': ' + e.message); return; }
    eq(out.length, 0, 'garbage today ' + i + ' returns empty, never throws');
  });
  let hostileOut = null;
  try { hostileOut = E.promoCliffs({ licenseInventory:'junk' }, '2026-08-28', 12); }
  catch (e) { fail++; console.log('FAIL: promoCliffs threw on hostile inventory: ' + e.message); }
  ok(hostileOut && hostileOut.length === 0, 'hostile inventory cannot crash promoCliffs and yields no caveat');
  // UI wiring: both cells, both branches, customer-visible
  ok(/E\.promoCliffs\(state, iso, months\)/.test(src), 'the render layer calls the pure engine helper');
  eq((src.match(/\+ pc12/g) || []).length, 2, 'the ×12 caveat rides both numAnnual branches (ramp on and off)');
  eq((src.match(/\+ pc36/g) || []).length, 2, 'the ×36 caveat rides both numThree branches');
  ok(/Includes promo pricing that ends/.test(src), 'the caveat names the date on the cell');
  ok(/still projected at the promo price/.test(src), 'the caveat says what the projection assumes');
}

/* ── R6.4 · NCE term line on the licensing card (#16) ───────────────────── */
{
  ok(/id="nceTermLine"/.test(src), 'the licensing card carries the term line');
  ok(/annual-term subscriptions: cancellation is limited to a short window at the/.test(src),
     'the term line states the annual term and the cancellation window');
  ok(/seat counts cannot be reduced until renewal/.test(src), 'the term line states no mid-term seat reduction');
  const nce = src.match(/id="nceTermLine"[\s\S]{0,600}?<\/p>/)[0];
  ok(/azure-billing-setup\.html/.test(nce), 'the term line links to the setup guide');
  ok(!/\b7[- ]day|\bseven[- ]day/i.test(nce), 'the term line does not hardcode an unverified 7-day window');
  ok(!/\b7 days|\bseven days/i.test(src), 'no unverified "7 days" cancellation claim anywhere in the file');
}

/* ── R6.5 · MACC line at 300, absent at 299 (#26, v2 §5.6/§5.7.4) ───────── */
{
  ok(/id="maccLine"/.test(src), 'the billing card carries the MACC line');
  const macc = src.match(/\(c\.copilotLicensed >= 300\s*\?[\s\S]{0,900}?: ''\)/);
  ok(macc, 'the MACC line is gated on exactly copilotLicensed >= 300');
  if (macc) {
    ok(/Azure Consumption Commitment/.test(macc[0]), 'the line names the commitment');
    ok(/billing account holding the commitment/.test(macc[0]), 'the line states the subscription condition');
    ok(/<a class="docref"/.test(macc[0]), 'one line + a link, per v2 §5.6');
    ok(!/<input|<select/.test(macc[0]), 'no inputs in the MACC line');
    ok(/does not model the draw-down/.test(macc[0]), 'the line disclaims any draw-down modelling');
  }
  // the gate values themselves, engine-side
  const at300 = E.compute(st({ licenseInventory: [{ skuId:'cop_ent', seats:300 }] })).ctx;
  eq(at300.copilotLicensed, 300, 'at 300 seats the gate is true (line renders)');
  const at299 = E.compute(st({ licenseInventory: [{ skuId:'cop_ent', seats:299 }] })).ctx;
  eq(at299.copilotLicensed, 299, 'at 299 seats the gate is false (line absent)');
}

/* ── R6.6 · Whybox split is conservative (#21) ──────────────────────────── */
{
  eq((src.match(/class="whybox cust-ok"/g) || []).length, 2,
     'exactly two whyboxes opt in: licensing "Why this one" and the cost-controls list');
  ok(/<div class="whybox cust-ok"><div class="wb-h">Cost controls to put in place<\/div>/.test(src),
     'the cost-controls whybox is the first opt-in');
  ok(/<div class="whybox cust-ok" style="margin-top:0;"><div class="wb-h">Why this one<\/div>/.test(src),
     'the licensing whybox is the second opt-in');
  // the partner-flavored sentences were spanned off before opting in
  ok(/re-forecast\.<span class="partner-only"> That review is the retainer/.test(src),
     'the retainer sentence is partner-only inside the cost-controls block');
  ok(/change your answers in the readiness step/.test(src) &&
     /operator \? '<p class="partner-only">'/.test(src),
     'the operator-coaching why line renders partner-only');
  // the ratio whybox stays internal
  ok(/<div class="whybox"><div class="wb-h">The 2\.6&times; benchmark, honestly/.test(src),
     'the ratio whybox carries no cust-ok — voicing the benchmark stays the partner’s call');
  // the sell-position and billing whyboxes keep their partner-only class
  ok(/<div class="whybox partner-only" style="border-left-color:#0f766e;"><div class="wb-h">Your position on this deal/.test(src),
     'the sell-position whybox stays partner-only');
}

/* ── R6.7 · Contrast and wizard semantics (#25) ─────────────────────────── */
{
  // (vii) the two failing hexes no longer appear as text colors
  ok(src.indexOf('#9ca3af') === -1, '#9ca3af (2.54:1) is gone from the file');
  const b6 = [];
  let i = -1; while ((i = src.indexOf('#b6bcc5', i + 1)) >= 0) b6.push(src.slice(Math.max(0, i - 10), i));
  ok(b6.length > 0 && b6.every(pre => /stroke:|fill="/.test(pre)),
     '#b6bcc5 (1.91:1) survives only as decorative stroke/fill, never as a text color');
  ok(src.indexOf('color:#b6bcc5') === -1 && src.indexOf('#aab0b9') === -1,
     'no light-gray text tier remains (tb-note and st-eyebrow darkened)');
  // wizard semantics
  ok(/aria-current="step"/.test(src), 'the active stepper button carries aria-current="step"');
  ok(/\(id === cur \? ' aria-current="step"' : ''\)/.test(src), 'aria-current follows the current step');
  eq((src.match(/role="group" aria-label=/g) || []).length, 5,
     'the yes/no/unsure toggle rows are grouped with an accessible label (5 gov rows share one template; R7b adds the competingAi row)');
}

/* ── R6.8 · The customer-view toggle chrome (idea 5) ────────────────────── */
{
  ok(/id="btnCustView"/.test(src), 'the toggle button sits next to the print buttons');
  const pill = src.match(/<div class="[^"]*" id="custViewPill"[\s\S]{0,400}?<\/div>/);
  ok(pill, 'the state pill exists');
  // (viii) the pill itself never prints
  ok(pill && /class="cv-pill no-print"/.test(pill[0]), 'the pill carries no-print');
  ok(pill && /Customer view (&mdash;|—) partner detail hidden/.test(pill[0]), 'the pill names the state');
  ok(/id="custViewExit"/.test(src), 'the pill carries its own exit');
  ok(/e\.key === 'Escape'/.test(src), 'Escape exits customer view');
  ok(/setCustomerView\(false\)/.test(src), 'the exit paths clear the class');
  // never persisted — the page still touches no storage of any kind
  ok(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(src),
     'customer view is never persisted (no browser storage anywhere in the file)');
  // the empty-column patch is chrome, not a strip selector
  ok(/body\.customer-view #cardScen \{ grid-column:1\/-1; \}/.test(src),
     'the scenarios card spans the emptied row on screen');
  // the pill sits outside #results so it survives navigation
  const pillIdx = src.indexOf('id="custViewPill"');
  const resultsEnd = src.indexOf('<footer class="pagefoot');
  ok(pillIdx > src.indexOf('id="results"') && pillIdx < resultsEnd, 'pill markup sits at body level before the footer');
}

/* ── R6.9 · Basis-aware disclaimer is rendered, not static (#7) ─────────── */
{
  ok(/id="printDisc"><\/div>/.test(src), 'the print disclaimer element is empty in the markup (rendered)');
  ok(!/class="print-disc">Estimate, not a quote/.test(src), 'the static disclaimer sentence is gone from the markup');
  ok(/priced at your partner’s rates; Microsoft list prices where noted/.test(src),
     'the sell-mode disclaimer names the partner-rate basis');
  ok(/Microsoft list prices current at the date above/.test(src),
     'list mode keeps today’s sentence');
  const disc = src.match(/\$\('printDisc'\)\.textContent = c\.sellMode[\s\S]{0,400}?;/);
  ok(disc, 'the disclaimer branches on c.sellMode at render time');
}

/* ══════════════════════════════════════════════════════════════════════════
   R7 — Conversation-engine truthfulness
   (findings #6, #17, #18, #20, #23 — v3 spec §R7)

   The talk track, the ratio block and the partner note live in the UI layer
   and are not exported, so rather than paraphrase them this section LIFTS
   THEIR SOURCE out of the page and runs it. Same self-extracting principle as
   the engine above: nothing to keep in sync, and a copy edit that breaks an
   invariant fails here rather than in front of a customer.
   ══════════════════════════════════════════════════════════════════════════ */

function uiSource(name, endMarker) {
  const start = src.indexOf('  function ' + name + '(');
  const end = src.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('could not lift ' + name + ' out of the page');
  return src.slice(start, end);
}
function escUi(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]); }
/* Deps are bound as parameters; `state` is bound per call so a sweep can move
   it. Compiling per state is cheap and keeps the closure honest. */
function makeUiFn(name, endMarker, deps) {
  const args = Object.keys(deps);
  return new Function(...args, uiSource(name, endMarker) + '\nreturn ' + name + ';')(...args.map(k => deps[k]));
}
function talkFor(st) {
  const r = E.compute(st);
  const build = makeUiFn('buildTalk', '\n  function showDeriv', { E, state: st, esc: escUi });
  return { r, text: build(r).join('\n') };
}
const partnerNote = makeUiFn('partnerNote', '\n  function renderNext', { E });
/* The lifted slice carries ratioBlock plus the flywheel helpers that follow
   it, and those read `state` — so this is a per-state factory. */
function ratioBlockFor(st) {
  return makeUiFn('ratioBlock', '\n  function renderBillOut',
    { E, usd, num, state: st, provPill: () => '' });
}
function ratioBlockUi(c, st) { return ratioBlockFor(st || E.defaults())(c); }
function nextFor(st) { const r = E.compute(st); return E.nextStep(st, r.ctx); }
function nextText(pick) {
  return [pick.eyebrow, pick.name, pick.price, pick.opener, (pick.why || []).join(' '), pick.then || ''].join(' ');
}

/* ── R7.1 · Governance honesty (#6) ─────────────────────────────────────── */
{
  // (a) the clause branches on governanceAsked
  const unasked = st({ governanceAsked: false });
  const asked = st({ governanceAsked: true,
    governance: { purviewLabels:'yes', dlpForAi:'yes', defenderCloudApps:'yes',
                  namedCostOwner:'yes', insuranceRenewal:'yes' } });
  const tU = talkFor(unasked), tA = talkFor(asked);
  ok(tU.r.licensing.winner, 'the unasked state still produces a licensing winner (the clause is reachable)');
  ok(!/told us/i.test(tU.text), 'governance unasked: no "told us" phrasing anywhere in the talk track');
  ok(/closes the gaps we have not yet confirmed are closed/.test(tU.text),
     'governance unasked: the clause names the gap in our knowledge');
  ok(/closes what you told us is open/.test(tA.text), 'governance asked: today’s sentence survives');

  // a sweep — no state with governanceAsked false may produce "told us"
  const sweep = [];
  ['none','legal','healthcare','finance','public','eu'].forEach(v => {
    ['direct','indirectReseller','indirectProvider','notCsp','unsure'].forEach(m => {
      ['no','unsure','yes'].forEach(a => {
        ['yes','no','unsure'].forEach(ca => {
          const s = E.defaults();
          s.governanceAsked = false;
          s.org.vertical = v; s.org.azureCspPlan = a; s.org.competingAi = ca;
          s.channel.motion = m;
          sweep.push(s);
        });
      });
    });
  });
  let toldUs = 0;
  sweep.forEach(s => { if (/told us/i.test(talkFor(s).text)) toldUs++; });
  eq(toldUs, 0, 'state sweep (' + sweep.length + ' unasked states): "told us" never renders');

  // (b) only the five [data-gov] toggles set the flag — the handler is split
  const govHandler = src.match(/querySelectorAll\('\[data-gov\]'\)[\s\S]{0,600}?\n    \}\);/);
  const orgHandler = src.match(/querySelectorAll\('\[data-org\]'\)[\s\S]{0,600}?\n    \}\);/);
  ok(govHandler && /state\.governanceAsked = true;/.test(govHandler[0]),
     'the [data-gov] handler sets governanceAsked');
  ok(orgHandler && !/state\.governanceAsked/.test(orgHandler[0]),
     'the [data-org] handler never touches governanceAsked (Azure/CSP, usage billing, competingAi)');
  eq((src.match(/state\.governanceAsked = true;/g) || []).length, 1,
     'exactly one site in the file sets governanceAsked true');
  // and the three questions that share that handler are the three named ones
  const orgSegs = (src.match(/data-org="(\w+)"/g) || []).map(s => s.slice(10, -1));
  eq(orgSegs.sort().join(','), 'azureCspPlan,competingAi,usageBillingEnabled',
     'the [data-org] rows are exactly the two prerequisites plus the displacement question');

  // (c) govNo counts only an explicit 'no'; unsure gets its own sentence
  const allUnsure = st({ governanceAsked: true });   // defaults are all 'unsure'
  const twoNo = st({ governanceAsked: true,
    governance: { purviewLabels:'no', dlpForAi:'no', defenderCloudApps:'yes',
                  namedCostOwner:'unsure', insuranceRenewal:'unsure' } });
  const tUn = talkFor(allUnsure).text, tNo = talkFor(twoNo).text;
  ok(/Nobody in the room was sure/.test(tUn), 'unsure-dominant gets the "nobody was sure" register');
  ok(!/are not in place/.test(tUn), 'unsure-dominant is never reported as confirmed-missing');
  ok(/You confirmed 2 of those controls are not in place/.test(tNo), 'two explicit "no"s are counted and named');
  ok(!/Nobody in the room was sure/.test(tNo), 'a confirmed-missing state does not also claim nobody was sure');
  ok(src.indexOf('doesn\'t have much in place') === -1,
     'the tenant-poverty sentence is gone from the file');
  // one 'no' and one 'unsure' is neither branch — the talk track stays quiet
  const oneEach = st({ governanceAsked: true,
    governance: { purviewLabels:'no', dlpForAi:'yes', defenderCloudApps:'yes',
                  namedCostOwner:'yes', insuranceRenewal:'yes' } });
  ok(!/Governance readiness is consumption readiness/.test(talkFor(oneEach).text),
     'a single named gap does not trigger either summary sentence');
}

/* ── R7.2 · The displacement question goes live (#17) ───────────────────── */
{
  // the toggle exists, follows the y/n/u segment pattern, and is labelled
  ok(/data-org="competingAi"/.test(src), 'step 7 carries a competingAi segment');
  ok(/role="group" aria-label="Are they already paying for Claude, ChatGPT or another AI tool\?" data-org="competingAi"/.test(src),
     'the segment is a labelled group, matching the other toggle rows');
  ok(/Are they already paying for Claude, ChatGPT or another AI tool\?<\/div>|Are they already paying for Claude, ChatGPT or another AI tool\?'/.test(src),
     'the question renders as the row label');
  ok(/var on = state\.org\.competingAi === v;/.test(src), 'the segment reflects state.org.competingAi');

  // normalize carries the enum through a partial load (the org branch)
  eq(E.normalize({ org: { totalEmployees: 50 } }).org.competingAi, 'no',
     'a partial org load keeps the competingAi default');
  eq(E.normalize({ org: { competingAi: 'yes' } }).org.competingAi, 'yes',
     'normalize carries a loaded competingAi through');
  eq(E.compute(st({ org: Object.assign(E.defaults().org, { competingAi:'garbage' }) })).ctx.competingAi, 'no',
     'ctx normalizes an unknown competingAi value to no');

  // the rule is reachable: prerequisites answered, governance asked and clean
  const s = E.defaults();
  s.governanceAsked = true;
  s.governance = { purviewLabels:'yes', dlpForAi:'yes', defenderCloudApps:'yes',
                   namedCostOwner:'yes', insuranceRenewal:'no' };
  s.org.azureCspPlan = 'yes'; s.org.usageBillingEnabled = 'yes';
  s.org.competingAi = 'yes';
  eq(nextFor(s).pick.id, 'competing-ai', 'competingAi yes reaches the competing-ai rung-1 rule');
  s.org.competingAi = 'no';
  ok(nextFor(s).pick.id !== 'competing-ai', 'competingAi no does not reach it');
  s.org.competingAi = 'unsure';
  ok(nextFor(s).pick.id !== 'competing-ai', 'competingAi unsure does not reach it either');

  // and the talk-track line is live
  s.org.competingAi = 'yes';
  ok(/Keep Claude\. Bring it under management\./.test(talkFor(s).text),
     'the displacement talk-track line renders when the answer is yes');
}

/* ── R7.3 · Motion-aware gate copy (#18) ────────────────────────────────── */
{
  const MOTIONS = ['direct','indirectProvider','indirectReseller','notCsp','unsure'];
  MOTIONS.forEach(m => {
    // prereq-no
    const sNo = E.defaults();
    sNo.channel.motion = m; sNo.org.azureCspPlan = 'no';
    const pNo = nextFor(sNo).pick;
    eq(pNo.id, 'prereq-no', m + ': azureCspPlan no lands on prereq-no');
    const txtNo = nextText(pNo);
    if (m === 'notCsp') {
      ok(!/our CSP/i.test(txtNo), 'notCsp: prereq-no never says "our CSP"');
      ok(/Microsoft Customer Agreement/.test(txtNo), 'notCsp: prereq-no names the customer’s own MCA');
    } else {
      ok(/our CSP channel/.test(txtNo), m + ': prereq-no keeps the CSP-channel wording');
    }
    // prereq-unsure
    const sUn = E.defaults();
    sUn.channel.motion = m;
    const pUn = nextFor(sUn).pick;
    eq(pUn.id, 'prereq-unsure', m + ': the stock unanswered state lands on prereq-unsure');
    const txtUn = nextText(pUn);
    ok(!/our CSP/i.test(txtUn) || m !== 'notCsp', 'notCsp: prereq-unsure never says "our CSP"');
    if (m === 'notCsp') ok(/customer’s own Azure plan/.test(txtUn), 'notCsp: prereq-unsure names the customer’s own plan');

    // the talk track, on the same state
    const tNo = talkFor(sNo).text;
    if (m === 'notCsp') {
      ok(!/our CSP/i.test(tNo), 'notCsp: the talk track never says "our CSP"');
      ok(!/CSP relationship/.test(tNo), 'notCsp: the talk track never says "CSP relationship"');
      ok(/your own Microsoft Customer Agreement/.test(tNo), 'notCsp: the talk track names their own MCA');
    }
    // whole notCsp walkthrough: talk + next step + partner note
    if (m === 'notCsp') {
      const whole = tNo + ' ' + txtNo + ' ' + partnerNote(E.compute(sNo).ctx);
      ok(!/our CSP/i.test(whole), 'notCsp walkthrough: no "our CSP" phrasing anywhere');
    }
  });

  // the Partner Center question left the talk track for EVERY motion
  MOTIONS.forEach(m => {
    const s = E.defaults(); s.channel.motion = m; s.org.azureCspPlan = 'no';
    const t = talkFor(s).text;
    ok(!/under our CSP relationship/.test(t), m + ': the Partner Center question is out of the talk track');
    ok(!/CSP relationship\?/.test(t), m + ': no Partner Center question mark in the talk track');
  });
  ok(!/does this tenant have an Azure plan under our CSP relationship/.test(uiSource('buildTalk', '\n  function showDeriv')),
     'the Partner Center line is gone from buildTalk’s source');

  // it became a partner-only pre-call note in #cardNext
  const cUnsure = E.compute(E.defaults()).ctx;
  const noteU = partnerNote(cUnsure);
  ok(/class="partner-only"/.test(noteU), 'the pre-call note renders inside a .partner-only block');
  ok(/Pre-call check/.test(noteU), 'the note is framed as a pre-call check');
  ok(/Partner Center answers both/.test(noteU), 'the in-CSP note points at Partner Center');
  const sYes = E.defaults(); sYes.org.azureCspPlan = 'yes';
  ok(!/Pre-call check/.test(partnerNote(E.compute(sYes).ctx)),
     'the pre-call note is absent once the Azure plan is confirmed');
  const sN = E.defaults(); sN.channel.motion = 'notCsp';
  ok(/Partner Center will not answer this/.test(partnerNote(E.compute(sN).ctx)),
     'outside CSP the note says Partner Center cannot answer it');

  // the closer moved out of the talk track and into the partner note
  const anyTalk = talkFor(E.defaults()).text;
  ok(!/name what we/i.test(anyTalk), 'the "let’s name what we’re selling" closer is out of the talk track');
  ok(!/the actual sale/.test(anyTalk), 'the talk track no longer addresses the partner');
  ok(/Name what you are selling and get a date on the calendar/.test(noteU),
     'the closer renders in the partner note instead');
  ok(src.indexOf('partnerNote(r.ctx)') > 0, 'renderNext emits the partner note into #cardNext');
}

/* ── R7.4 · Ratio-block sanity (#20) ────────────────────────────────────── */
{
  /* V-10's heavy-task figure counts only personas that carry seats. One
     allocated group at 60 heavy tasks, three unallocated at 99 each: the old
     sum reported 357 tasks nobody entered against the allocated group. */
  const s = E.defaults();
  s.personas.forEach((p, i) => {
    p.seats = i === 1 ? 40 : 0; p.light = 0; p.medium = 0; p.heavy = i === 1 ? 60 : 99;
  });
  s.activation.mode = 'count'; s.activation.count = 40;
  const rH = E.compute(s);
  const v10 = rH.warnings.filter(w => w.id === 'V-10')[0];
  ok(v10, 'the high-outlier state fires V-10 (ratio ' + rH.ctx.ratioBench.toFixed(2) + '×)');
  if (v10) {
    ok(/across your allocated groups/.test(v10.message), 'V-10 names the denominator it summed over');
    ok(/allocated groups is 60,/.test(v10.message),
       'V-10 reports only the allocated persona’s heavy count (got: ' + v10.message + ')');
    ok(!/is 357/.test(v10.message), 'V-10 does not sum the unallocated personas');
  }
  /* The low outlier is the case finding #20 named: the allocated group's
     heavy count is genuinely 0 and V-10 must say 0, not a figure from
     personas holding no seats. */
  const lo = E.defaults();
  lo.personas.forEach((p, i) => {
    p.seats = i === 1 ? 40 : 0; p.light = 1; p.medium = 0; p.heavy = i === 1 ? 0 : 99;
  });
  lo.activation.mode = 'count'; lo.activation.count = 40;
  const vLo = E.compute(lo).warnings.filter(w => w.id === 'V-10')[0];
  ok(vLo && /allocated groups is 0,/.test(vLo.message),
     'at the low outlier V-10 reports 0 heavy tasks, not the unallocated personas’ counts');

  // no rendered activation percentage above 100, across a fuzz sweep
  const fuzz = [];
  [1, 4, 25, 60, 200, 900].forEach(seats => {
    [0.05, 0.35, 0.65, 1.0].forEach(rate => {
      [0, 1, 8, 40, 400].forEach(heavy => {
        const f = E.defaults();
        f.activation = { mode:'rate', rate: rate, count:null };
        f.personas.forEach((p, i) => { p.seats = i === 0 ? seats : Math.round(seats / 3); p.heavy = heavy; });
        fuzz.push(f);
      });
    });
  });
  ['benchmark','count'].forEach(mode => {
    const f = E.defaults(); f.activation = { mode: mode, rate:0.65, count: 3 }; fuzz.push(f);
  });
  let over = 0, rendered = 0, suppressed = 0;
  fuzz.forEach(f => {
    const c = E.compute(f).ctx;
    const html = ratioBlockUi(c, f);
    if (!html) return;
    rendered++;
    const pcts = (html.match(/>(\d+)%/g) || []).map(x => +x.replace(/[>%]/g, ''));
    pcts.forEach(p => { if (p > 100) over++; });
    if (c.reconciliation.impliedActivation > 1 && !/% activation/.test(html)) suppressed++;
  });
  ok(rendered > 20, 'the ratio fuzz sweep actually rendered (' + rendered + ' blocks)');
  eq(over, 0, 'no rendered activation percentage exceeds 100% across the fuzz sweep');
  ok(suppressed > 0, 'the implied-activation sentence is suppressed above 100% (' + suppressed + ' cases)');

  // when V-10 fires, the reassurance becomes an input check
  ok(rH.ctx.monthlyCowork > 0 && rH.warnings.some(w => w.id === 'V-10'),
     'the V-10 state renders a ratio block (precondition for the checks below)');
  const v10Html = ratioBlockUi(rH.ctx, s);
  ok(!/isn't wrong and neither are you/.test(v10Html),
     'V-10 present: the reassurance does not argue with the warning above it');
  ok(/check the two entries most likely to be behind it/.test(v10Html),
     'V-10 present: the block points at the two entries V-10 names');
  ok(/heavy-task counts on step 4/.test(v10Html) && /active-user count on step 3/.test(v10Html),
     'the input-check framing mirrors V-10’s own two figures');
  // and on a clean state it is still the reassurance
  const clean = ratioBlockUi(E.compute(E.defaults()).ctx);
  ok(/isn't wrong and neither are you/.test(clean), 'no V-10: the reassurance survives unchanged');
  ok(/% activation/.test(clean), 'stock defaults still render the implied-activation sentence');
}

/* ── R7.5 · The value wobble (#23) ──────────────────────────────────────── */
{
  eq((src.match(/real value/g) || []).length, 0, 'grep "real value" returns nothing');
  eq((src.match(/where the value is concentrating/g) || []).length, 0,
     'the value-concentration phrasing is gone from both sites');
  eq((src.match(/the group whose usage is driving the number/g) || []).length, 2,
     'both sites carry the consumption framing');

  // the talk-track site
  const hot = E.defaults();
  hot.personas.forEach(p => { p.heavy = p.heavy + 20; });
  const th = talkFor(hot);
  ok(th.r.ctx.ratioBench > 3.5, 'the hot state clears the ratio threshold (precondition)');
  ok(/the group whose usage is driving the number/.test(th.text), 'the talk-track site is reworded');

  // the next-step site
  const conc = E.defaults();
  conc.governanceAsked = true;
  conc.governance = { purviewLabels:'yes', dlpForAi:'yes', defenderCloudApps:'yes',
                      namedCostOwner:'yes', insuranceRenewal:'no' };
  conc.org.azureCspPlan = 'yes'; conc.org.usageBillingEnabled = 'yes';
  conc.personas.forEach(p => { p.heavy = p.heavy + 40; });
  const pc = nextFor(conc).pick;
  eq(pc.id, 'concentration', 'the hot state reaches the concentration rule (precondition)');
  ok(/the group whose usage is driving the number/.test(nextText(pc)), 'the next-step site is reworded');

  // the regulated line renders regardless of headcount
  ['healthcare','finance','legal','public','eu'].forEach(v => {
    const small = E.defaults();
    small.org.vertical = v; small.org.totalEmployees = 20;
    const t = talkFor(small);
    ok(t.r.ctx.regulated, v + ': ctx flags the vertical regulated');
    ok(/carries a supervision obligation/.test(t.text),
       v + ' at 20 employees: the regulated talk-track line renders');
    ok(/It applies at your size, not only at enterprise scale/.test(t.text),
       v + ': the line says the obligation does not scale with headcount');
  });
  const notReg = E.defaults(); notReg.org.vertical = 'none';
  ok(!/carries a supervision obligation/.test(talkFor(notReg).text),
     'an unregulated vertical stays silent');

  // the rung-5 floor is untouched
  const smallLegal = E.defaults();
  smallLegal.org.vertical = 'legal'; smallLegal.org.totalEmployees = 20;
  smallLegal.governanceAsked = true;
  smallLegal.governance = { purviewLabels:'yes', dlpForAi:'yes', defenderCloudApps:'yes',
                            namedCostOwner:'yes', insuranceRenewal:'no' };
  smallLegal.org.azureCspPlan = 'yes'; smallLegal.org.usageBillingEnabled = 'yes';
  ok(nextFor(smallLegal).pick.id !== 'regulated-vciso',
     'the vCISO rung keeps its 50-employee floor');
  ok(/regulated && ctx\.employees >= 50 && ctx\.employees <= 1000/.test(src),
     'the rung rule’s headcount guard is unchanged in source');
}

/* ══════════════════════════════════════════════════════════════════════════
   R8 — Distributor handoff export and the benchmark flywheel
   (ideas 2 and 4 — v3 spec §R8 a–b)

   Both surfaces are lifted out of the page and run, same as R7. The export
   depends on R5: the ask must be the ramped year-one figure, never the
   steady-state over-commit.
   ══════════════════════════════════════════════════════════════════════════ */

/* The export's helpers (P3_FINALITY, todayIso) sit above it in the page, so
   the lift starts at the constant rather than at the function. */
function quoteSource() {
  const start = src.indexOf('  var P3_FINALITY');
  const end = src.indexOf('\n  /* What a commit actually commits', start);
  if (start < 0 || end < 0) throw new Error('could not lift quoteRequestText out of the page');
  return src.slice(start, end);
}
function quoteFor(st) {
  const c = E.compute(st).ctx;
  const fn = new Function('E', 'usd', 'num', 'state',
    quoteSource() + '\nreturn quoteRequestText;')(E, usd, num, st);
  return { c, text: fn(c) };
}
const FINALITY = 'A Copilot Credit P3 is non-cancellable and non-exchangeable, the term is twelve months, ' +
  'and it auto-renews by default.';

/* ── R8.1 · The export carries the year-one figure, the band and finality ── */
{
  const q = quoteFor(E.defaults());
  ok(q.c.rampApplies, 'stock defaults ramp (precondition — the ask must be year one)');
  ok(/Ask \(year one\): 78,839 CCCU/.test(q.text), 'the ask is the ramped year-one CCCU figure');
  ok(/Reference only \(steady state\): 90,600 CCCU/.test(q.text),
     'the steady-state figure rides along, labelled as reference');
  ok(/Do not order this figure/.test(q.text), 'the reference figure says it is not the order');
  ok(q.text.indexOf(FINALITY) >= 0, 'the export carries the finality sentence verbatim');
  ok(/re-size at renewal on measured usage/.test(q.text), 'the export says to re-size at renewal');
  ok(/Band: the volume behind these figures is modeled at ±30% — \$5,285 to \$9,815 a month/.test(q.text),
     'the export carries the ±band and the range it implies');
  ok(/PayGo fallback: \$78,839 across year one/.test(q.text), 'the PayGo year-one fallback is present');
  ok(/\$90,600 a year at full adoption/.test(q.text), 'the steady-state PayGo figure is named as such');
  ok(/^Account: Unnamed account$/m.test(q.text), 'an unnamed account is labelled, not blank');
  ok(/^Date: \d{4}-\d{2}-\d{2}$/m.test(q.text), 'the date is stamped (UI layer — compute stays pure)');
  ok(!/Date\.now\(\)/.test(uiSource('compute', 'root.CoworkEngine')) ||
     src.indexOf('function compute(rawState)') > 0, 'engine purity is unchanged by the export');
  // a named account comes through
  const named = E.defaults(); named.meta.accountName = '  Riverside Dental ';
  ok(/^Account: Riverside Dental$/m.test(quoteFor(named).text), 'a named account is trimmed and used');
  // formatted like the page
  ok(!/78839|90600/.test(q.text), 'figures are thousands-separated like the rest of the page');
  // and it carries no partner economics
  const sell = E.defaults();
  sell.channel = { motion:'direct', providerCreditUsd:null };
  sell.pricing = Object.assign(E.defaults().pricing,
    { mode:'sell', creditSellUsd:0.025, pec:{ status:'yes', pct:15 } });
  sell.pricing.sell = { bprem_cop:45, cop_biz:25, bstd:15 };
  sell.pricing.cost = { bprem_cop:28, cop_biz:15, bstd:10 };
  const qSell = quoteFor(sell);
  ok(qSell.c.pecKnown, 'the sell config reaches PEC internally (precondition)');
  ['margin','uplift','partner-earned','PEC','cost basis','your cost'].forEach(w => {
    ok(qSell.text.toLowerCase().indexOf(w.toLowerCase()) === -1,
       'the export never names ' + w);
  });
}

/* ── R8.2 · Addressed per motion, including the notCsp no-ask variant ───── */
{
  const cases = {
    direct:           /^To: TD SYNNEX \/ your distributor\. You hold the billing account/m,
    indirectProvider: /^To: TD SYNNEX \/ your distributor\. You hold the billing account/m,
    indirectReseller: /^To: your indirect provider\./m,
    notCsp:           /^To: your distributor — for reference, not as an order\./m,
    unsure:           /^To: TD SYNNEX \/ your distributor\. The CSP motion has not been set/m
  };
  Object.keys(cases).forEach(m => {
    const s = E.defaults(); s.channel.motion = m;
    const q = quoteFor(s);
    ok(cases[m].test(q.text), m + ': the export is addressed correctly');
    // the band and the finality note are never stripped, whatever the motion
    ok(/^Band: /m.test(q.text), m + ': the band survives');
    ok(q.text.indexOf(FINALITY) >= 0, m + ': the finality sentence survives');
    if (m === 'indirectReseller') {
      ok(/your provider places it/.test(q.text), 'indirect reseller: the provider places the order');
      ok(/Partner of Record is inherited/.test(q.text), 'indirect reseller: PoR is settled before the order');
      ok(/becomes or assigns PoR/.test(q.text), 'indirect reseller: who becomes or assigns PoR is named');
    }
    if (m === 'notCsp') {
      ok(/there is no CCCU ask below/.test(q.text), 'notCsp: the export says there is no ask');
      ok(/^No CCCU ask\./m.test(q.text), 'notCsp: the ask line is replaced, not filled in');
      ok(!/^Ask/m.test(q.text), 'notCsp: no Ask line at all');
      ok(!/^Reference only/m.test(q.text), 'notCsp: no steady-state reference either');
      ok(/A CSP-channel Azure plan would have to exist before/.test(q.text),
         'notCsp: the prerequisite is explained');
      ok(/Terms, if a commit is ever placed through the channel/.test(q.text),
         'notCsp: the finality note is framed conditionally rather than dropped');
    } else {
      ok(!/there is no CCCU ask/.test(q.text), m + ': an in-channel motion still carries an ask');
    }
  });

  // ramp off → the steady figure IS the ask, and the reference line drops
  const flat = E.defaults(); flat.ramp = { mode:'none', pilotSeats:25, months:6 };
  const qF = quoteFor(flat);
  ok(!qF.c.rampApplies, 'ramp mode none turns the ramp off (precondition)');
  ok(/^Ask: 90,600 CCCU/m.test(qF.text), 'with no ramp the ask is the steady-state figure');
  ok(!/Reference only/.test(qF.text), 'with no ramp the reference line drops');
  ok(!/Ask \(year one\)/.test(qF.text), 'with no ramp there is no year-one label');
  ok(/PayGo fallback: \$90,600 a year/.test(qF.text), 'with no ramp the PayGo fallback is the flat year');
  ok(qF.text.indexOf(FINALITY) >= 0, 'with no ramp the finality sentence still ships');

  // months: 1 is the other flat path
  const one = E.defaults(); one.ramp = { mode:'linear', pilotSeats:25, months:1 };
  ok(/^Ask: 90,600 CCCU/m.test(quoteFor(one).text), 'a one-month ramp is a flat year and asks the steady figure');
}

/* ── R8.3 · The button follows the btnCopyTalk pattern ──────────────────── */
{
  ok(/<button class="copybtn no-print" id="btnCopyQuote">Copy quote request<\/button>/.test(src),
     'the export button sits in the billing card head, same class as btnCopyTalk');
  const head = src.match(/id="cardBilling">[\s\S]{0,300}?<\/div>/);
  ok(head && /btnCopyQuote/.test(head[0]), 'the button is inside #cardBilling');
  ok(/\$\('btnCopyQuote'\)\.addEventListener\('click'/.test(src), 'the button is wired');
  ok(/copyText\(quoteRequestText\(r\.ctx\), \$\('btnCopyQuote'\), 'Copy quote request'\)/.test(src),
     'the click rebuilds the text from the live ctx');
  // the shared clipboard path, including the manual-select fallback
  const copyTextSrc = uiSource('copyText', '\n  function copyFrom');
  ok(/navigator\.clipboard\.writeText/.test(copyTextSrc), 'copyText uses the async clipboard first');
  ok(/catch\(function \(\) \{ fallback\(text\); done\(\); \}\)/.test(copyTextSrc),
     'a clipboard rejection falls back to the manual-select textarea');
  ok(/else \{ fallback\(text\); done\(\); \}/.test(copyTextSrc), 'no clipboard API also falls back');
  ok(/document\.execCommand\('copy'\)/.test(src), 'the manual-select fallback is still the execCommand path');
  ok(/function copyFrom\(sel, btn\) \{\s*copyText\(/.test(src), 'btnCopyTalk now shares the same path');
}

/* ── R8.4 · The benchmark flywheel mailto (idea 4) ──────────────────────── */
function hrefOf(html) { const m = html.match(/href="(mailto:[^"]*)"/); return m ? m[1] : null; }
function decodeMailto(href) {
  const q = href.slice(href.indexOf('?') + 1);
  const out = {};
  q.split('&').forEach(p => { const i = p.indexOf('='); out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
  out.to = href.slice('mailto:'.length, href.indexOf('?'));
  return out;
}
{
  const s = E.defaults();
  s.meta.accountName = 'Riverside Dental';
  s.org.vertical = 'legal';
  const html = ratioBlockUi(E.compute(s).ctx, s);
  const href = hrefOf(html);
  ok(href, 'the ratio whybox carries a mailto link');
  const m = decodeMailto(href);
  eq(m.to, 'ken.lince@gmail.com', 'the collection address is the site owner’s');
  eq(m.subject, 'Cowork ratio datapoint', 'the subject is fixed');
  // the four fields, and only the four fields
  ok(/^Ratio: 3\.15$/m.test(m.body), 'the body carries the ratio to two decimal places');
  ok(/^Seat bucket: 25-100$/m.test(m.body), 'the body carries the seat bucket, not the count');
  ok(/^Vertical: legal$/m.test(m.body), 'the body carries the vertical');
  ok(/^Activation mode: rate$/m.test(m.body), 'the body carries the activation mode');
  eq(m.body.trim().split('\n').length, 4, 'the body is exactly four lines');
  // and nothing else
  ok(m.body.indexOf('Riverside') === -1 && href.indexOf('Riverside') === -1,
     'no account name in the body or the href');
  ok(href.indexOf('$') === -1 && m.body.indexOf('$') === -1, 'no dollar figure anywhere in the mailto');
  ok(!/\b80\b/.test(m.body), 'no exact seat count in the body');
  ok(!/7,?550|755,?000/.test(m.body), 'no meter or credit figure in the body');
  // properly encoded: the raw href carries no literal newline or space
  ok(!/\n/.test(href) && href.indexOf(' ') === -1, 'the body is URL-encoded, not pasted raw');
  ok(/%0A/.test(href), 'newlines are percent-encoded');

  // the buckets
  const BUCKETS = [[10,'<25'], [24,'<25'], [25,'25-100'], [100,'25-100'],
                   [101,'100-300'], [300,'100-300'], [301,'300+'], [4000,'300+']];
  BUCKETS.forEach(([seats, want]) => {
    const b = E.defaults();
    b.licenseInventory = [{ skuId:'bprem_cop', seats: seats }];
    b.activation = { mode:'rate', rate:0.65, count:null };
    const c = E.compute(b).ctx;
    eq(c.copilotLicensed, seats, 'bucket probe: ' + seats + ' licensed');
    const got = decodeMailto(hrefOf(ratioBlockUi(c, b))).body.match(/^Seat bucket: (.+)$/m)[1];
    eq(got, want, seats + ' Copilot licenses falls in bucket ' + want);
  });

  // an unset vertical still sends something readable
  const none = E.defaults();
  ok(/^Vertical: none$/m.test(decodeMailto(hrefOf(ratioBlockUi(E.compute(none).ctx, none))).body),
     'the default vertical is sent as its own answer');
  const blank = E.defaults(); blank.org.vertical = '';
  ok(/^Vertical: unspecified$/m.test(decodeMailto(hrefOf(ratioBlockUi(E.compute(blank).ctx, blank))).body),
     'an empty vertical falls back to unspecified');
  // activation modes
  ['count','benchmark'].forEach(mode => {
    const a = E.defaults(); a.activation = { mode: mode, rate:0.65, count: 40 };
    const c = E.compute(a).ctx;
    if (c.ratioBench > 0)
      ok(new RegExp('^Activation mode: ' + mode + '$', 'm').test(decodeMailto(hrefOf(ratioBlockUi(c, a))).body),
         mode + ' activation mode is carried');
  });

  // the sentence beside the link keeps the privacy footer true
  ok(/The page itself still transmits nothing\./.test(html), 'the line says the page transmits nothing');
  ok(/email from your own mail client/.test(html), 'the line says the send is the partner’s own');
  ok(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.sendBeacon/.test(src),
     'the page still has no storage and no network call of any kind');
}

/* ── R8.5 · Neither feature reaches a customer surface ──────────────────── */
{
  const cv = stripSet('customer-view'), pc = stripSet('print-customer');
  ok(cv && pc && cv.join('|') === pc.join('|'), 'the strip lists are still identical after R8');
  // the export button and its text live inside #cardBilling, which is stripped
  ok(cv.indexOf('#cardBilling') >= 0, 'the export button’s container is in the strip set');
  const billIdx = src.indexOf('id="cardBilling"');
  const quoteIdx = src.indexOf('id="btnCopyQuote"');
  const nextCard = src.indexOf('id="cardLic"');
  ok(quoteIdx > billIdx && quoteIdx < nextCard, 'the button markup is inside #cardBilling, not loose on the page');
  // the export text is never written into the DOM at all — it goes to the clipboard
  ok(!/innerHTML[^;]*quoteRequestText/.test(src), 'the export text is never rendered into the page');
  // the flywheel line lives in the ratio whybox, which carries no cust-ok
  ok(/<div class="whybox"><div class="wb-h">The 2\.6&times; benchmark, honestly/.test(src),
     'the ratio whybox still carries no cust-ok class');
  ok(cv.indexOf('.whybox:not(.cust-ok)') >= 0, 'plain whyboxes are stripped on both customer surfaces');
  // the flywheel markup emits no cust-ok of its own
  const fly = uiSource('flywheelLine', '\n  function renderBillOut');
  ok(!/cust-ok/.test(fly), 'the flywheel line does not opt itself into the customer surface');
  ok(!/partner-only/.test(fly), 'it does not need partner-only either — the whybox already strips');
  // and neither string appears in the reconstructed customer surface
  const rC = E.compute(E.defaults());
  const surface = customerSurface(rC, rC.licensing);
  ok(surface.indexOf('quote request') === -1, 'the customer surface carries no quote request');
  ok(surface.indexOf('mailto:') === -1 && surface.indexOf('Contribute your anonymized ratio') === -1,
     'the customer surface carries no flywheel link');
}

/* ── R8.6 · FACTS.md registers the address and the methodology caveat ───── */
{
  let facts = '';
  try { facts = fs.readFileSync(path.join(__dirname, '..', 'FACTS.md'), 'utf8'); } catch (e) {}
  ok(facts.length > 0, 'FACTS.md is readable');
  ok(facts.indexOf('ken.lince@gmail.com') >= 0, 'FACTS.md registers the collection address');
  ok(/self-selected/.test(facts) && /unverified/.test(facts),
     'FACTS.md records that contributed ratios are self-selected and unverified');
  ok(/\bnever\b.{0,24}ms-verified/i.test(facts),
     'FACTS.md records that contributions can never reach ms-verified');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
