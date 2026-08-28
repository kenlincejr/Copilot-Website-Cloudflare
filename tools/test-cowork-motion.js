/* tools/test-cowork-motion.js
   CSP-motion suite for cowork-calculator.html — F5a/F5b of
   specs/cowork-calculator-v2-time-and-value.spec.md, plus the V-24 Partner of
   Record trap. Self-extracting: it reads the engine straight out of the page,
   so there is nothing to keep in sync.

     node tools/test-cowork-motion.js          (from the repo root)
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

function st(over) {
  const s = E.defaults();
  return Object.assign(s, over || {});
}
function withMotion(m, extra) {
  const s = E.defaults();
  s.channel = Object.assign({ motion: m, providerCreditUsd: null }, (extra && extra.channel) || {});
  if (extra && extra.pec) s.pricing.pec = extra.pec;
  if (extra && extra.billing) Object.assign(s.billing, extra.billing);
  if (extra && extra.pricing) Object.assign(s.pricing, extra.pricing);
  return s;
}

/* ── Regression anchor ─────────────────────────────────────────────────── */
const base = E.compute(E.defaults()).ctx;
eq(Math.round(base.monthlyCredits), 755000, 'stock defaults credits');
eq(Math.round(base.monthlyCowork), 7550, 'stock defaults monthly');

/* ── 1. indirectReseller can never reach a PEC or margin figure ─────────── */
['yes', 'no', 'unsure', 'bogus', null].forEach(function (status) {
  const s = withMotion('indirectReseller', { pec: { status: status, pct: 15 } });
  const c = E.compute(s).ctx;
  eq(c.pecKnown, false, 'reseller pecKnown false for status ' + status);
  eq(c.pecPct, 0, 'reseller pecPct 0 for status ' + status);
  eq(c.pecStatus, 'n/a', 'reseller pecStatus n/a for status ' + status);
  eq(c.p3PartnerCost, null, 'reseller p3PartnerCost null for status ' + status);
  // paygo cost basis stays null while the provider rate is unset
  eq(c.paygoPartnerCost, null, 'reseller paygo cost null w/o provider rate, status ' + status);
  eq(c.meterMarginAnnual, null, 'reseller meter margin null for status ' + status);
});
// ...including on the P3 path, where the provider rate is set
{
  const s = withMotion('indirectReseller',
    { pec: { status: 'yes', pct: 15 }, channel: { providerCreditUsd: 0.009 }, billing: { model: 'p3' } });
  const c = E.compute(s).ctx;
  eq(c.p3PartnerCost, null, 'reseller P3 cost basis withheld even with provider rate');
  eq(c.partnerCostAnnual, null, 'reseller P3 partnerCostAnnual null');
  eq(c.meterMarginAnnual, null, 'reseller P3 margin null');
}
// notCsp likewise
['direct', 'indirectProvider'].forEach(function (m) {
  const c = E.compute(withMotion(m, { pec: { status: 'yes', pct: 15 } })).ctx;
  ok(c.pecKnown === true, m + ' pecKnown true');
  ok(c.paygoPartnerCost != null, m + ' has a paygo cost basis');
});
['indirectReseller', 'notCsp', 'unsure'].forEach(function (m) {
  const c = E.compute(withMotion(m, { pec: { status: 'yes', pct: 15 } })).ctx;
  eq(c.holdsBillingAccount, false, m + ' does not hold billing account');
  eq(c.pecKnown, false, m + ' pecKnown false');
});
{
  const c = E.compute(withMotion('notCsp', { channel: { providerCreditUsd: 0.005 } })).ctx;
  eq(c.providerCreditUsd, null, 'provider rate ignored outside the reseller motion');
  eq(c.paygoPartnerCost, null, 'notCsp has no meter cost basis');
}

/* ── 2. cspMotion never moves a customer-facing figure ──────────────────── */
{
  const keys = ['monthlyCredits', 'monthlyCowork', 'coworkLo', 'coworkHi', 'licenseMonthly',
    'annualCredits', 'paygoAnnual', 'cccuRequired', 'p3Annual', 'p3Saving', 'allInMonthly',
    'allInAnnual', 'allInThreeYear', 'meterBilledAnnual', 'perActive', 'commitCccu', 'p3Exposure'];
  const ref = E.compute(withMotion('unsure')).ctx;
  ['direct', 'indirectProvider', 'indirectReseller', 'notCsp', 'garbage'].forEach(function (m) {
    const c = E.compute(withMotion(m, { pec: { status: 'yes', pct: 15 }, channel: { providerCreditUsd: 0.007 } })).ctx;
    keys.forEach(function (k) { eq(c[k], ref[k], 'motion ' + m + ' invariant on ' + k); });
  });
}

/* ── 3. V-21 inversion cannot fire without the billing account ──────────── */
['indirectReseller', 'notCsp', 'unsure'].forEach(function (m) {
  const s = withMotion(m, { pec: { status: 'yes', pct: 15 }, billing: { model: 'p3' } });
  const w = E.compute(s).warnings.map(function (x) { return x.id; });
  ok(w.indexOf('V-21') === -1, 'V-21 absent for ' + m);
});

/* ── 4. V-24 Partner of Record trap ─────────────────────────────────────── */
{
  const w = E.compute(withMotion('indirectReseller', { billing: { model: 'p3' } })).warnings.map(x => x.id);
  ok(w.indexOf('V-24') >= 0, 'V-24 fires for reseller on P3');
  const w2 = E.compute(withMotion('indirectReseller', { billing: { model: 'paygo' } })).warnings.map(x => x.id);
  ok(w2.indexOf('V-24') === -1, 'V-24 silent on PayGo');
  const w3 = E.compute(withMotion('direct', { billing: { model: 'p3' } })).warnings.map(x => x.id);
  ok(w3.indexOf('V-24') === -1, 'V-24 silent for direct bill');
}

/* ── 5. V-25 / V-26 ─────────────────────────────────────────────────────── */
{
  const s = withMotion('notCsp', { pricing: { mode: 'sell', creditSellUsd: 0.014 } });
  ok(E.compute(s).warnings.map(x => x.id).indexOf('V-25') >= 0, 'V-25 fires outside CSP at an uplifted rate');
  const s2 = withMotion('notCsp', { pricing: { mode: 'sell', creditSellUsd: 0.01 } });
  ok(E.compute(s2).warnings.map(x => x.id).indexOf('V-25') === -1, 'V-25 silent at $0.01');
  ok(E.compute(withMotion('unsure')).warnings.map(x => x.id).indexOf('V-26') >= 0, 'V-26 fires when unsure');
  ok(E.compute(withMotion('direct')).warnings.map(x => x.id).indexOf('V-26') === -1, 'V-26 silent once set');
}

/* ── 6. Reseller with a provider rate gets a real PayGo cost basis ──────── */
{
  const s = withMotion('indirectReseller', { channel: { providerCreditUsd: 0.008 } });
  const c = E.compute(s).ctx;
  eq(c.providerKnown, true, 'providerKnown true');
  ok(Math.abs(c.paygoPartnerCost - c.annualCredits * 0.008) < 1e-6, 'paygo cost = credits x provider rate');
  ok(Math.abs(c.meterMarginAnnual - (c.meterBilledAnnual - c.paygoPartnerCost)) < 1e-6, 'margin identity');
}

/* ── 7. Totality under garbage ──────────────────────────────────────────── */
[undefined, null, {}, { channel: null }, { channel: { motion: 42, providerCreditUsd: 'x' } },
 { channel: { motion: 'indirectReseller', providerCreditUsd: -5 } },
 { channel: { motion: 'indirectReseller', providerCreditUsd: NaN } },
 { channel: { motion: 'indirectReseller', providerCreditUsd: Infinity } }].forEach(function (raw, i) {
  let r;
  try { r = E.compute(raw); } catch (e) { fail++; console.log('FAIL: threw on garbage ' + i + ': ' + e.message); return; }
  const c = r.ctx;
  ok(['direct', 'indirectProvider', 'indirectReseller', 'notCsp', 'unsure'].indexOf(c.cspMotion) >= 0, 'garbage ' + i + ' motion valid');
  ok(c.paygoPartnerCost === null || isFinite(c.paygoPartnerCost), 'garbage ' + i + ' cost finite or null');
  ok(c.meterMarginAnnual === null || isFinite(c.meterMarginAnnual), 'garbage ' + i + ' margin finite or null');
  const txt = r.warnings.map(w => w.message).join(' ') + r.assumptions.map(a => a.note).join(' ');
  ok(txt.indexOf('NaN') === -1 && txt.indexOf('undefined') === -1, 'garbage ' + i + ' no NaN/undefined in copy');
});

/* ── 8. Assumption routing ──────────────────────────────────────────────── */
{
  const ids = r => E.compute(r).assumptions.map(a => a.id);
  ok(ids(withMotion('unsure')).indexOf('motion-unknown') >= 0, 'motion-unknown assumption present');
  ok(ids(withMotion('direct')).indexOf('motion-unknown') === -1, 'motion-unknown gone once set');
  ok(ids(withMotion('direct')).indexOf('pec-unknown') >= 0, 'pec-unknown for direct bill');
  ok(ids(withMotion('indirectReseller')).indexOf('pec-unknown') === -1, 'pec-unknown suppressed for reseller');
  ok(ids(withMotion('indirectReseller')).indexOf('provider-rate-unknown') >= 0, 'provider-rate prompt for reseller');
  ok(ids(withMotion('indirectReseller', { channel: { providerCreditUsd: 0.009 } })).indexOf('provider-rate-unknown') === -1,
     'provider-rate prompt clears once set');
  ok(ids(withMotion('direct', { pec: { status: 'yes', pct: 15 } })).indexOf('pec-contingent') >= 0, 'pec-contingent present');
  ok(ids(withMotion('direct', { pec: { status: 'no', pct: 0 } })).indexOf('pec-contingent') === -1, 'pec-contingent absent at 0%');
}

/* ── 9. Fuzz ────────────────────────────────────────────────────────────── */
{
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const motions = ['direct', 'indirectProvider', 'indirectReseller', 'notCsp', 'unsure', 'zzz', null, 7];
  const rates = [null, 0, 0.005, 0.01, 0.014, -1, 'abc', NaN];
  for (let i = 0; i < 3000; i++) {
    const s = E.defaults();
    s.channel = { motion: motions[Math.floor(rnd() * motions.length)],
                  providerCreditUsd: rates[Math.floor(rnd() * rates.length)] };
    s.pricing.mode = rnd() < 0.5 ? 'sell' : 'list';
    s.pricing.creditSellUsd = [0.01, 0.012, 0.02, 0][Math.floor(rnd() * 4)];
    s.pricing.pec = { status: ['yes', 'no', 'unsure', 'x'][Math.floor(rnd() * 4)], pct: rnd() * 30 - 5 };
    s.billing.model = rnd() < 0.5 ? 'p3' : 'paygo';
    s.billing.p3Holder = ['partner', 'customer', 'unasked'][Math.floor(rnd() * 3)];
    s.org.totalEmployees = Math.floor(rnd() * 800);
    s.licenseInventory[0].seats = Math.floor(rnd() * 300);
    let r;
    try { r = E.compute(s); } catch (e) { fail++; console.log('FUZZ threw: ' + e.message); break; }
    const c = r.ctx;
    if (!c.holdsBillingAccount && c.pecKnown) { fail++; console.log('FUZZ: pecKnown without billing account'); break; }
    if (c.cspMotion === 'indirectReseller' && c.billingModel === 'p3' && c.meterMarginAnnual !== null) {
      fail++; console.log('FUZZ: reseller P3 margin leaked'); break;
    }
    if (c.meterMarginAnnual !== null && !isFinite(c.meterMarginAnnual)) { fail++; console.log('FUZZ: non-finite margin'); break; }
    const txt = r.warnings.map(w => w.message).join(' ') + r.assumptions.map(a => a.note).join(' ');
    if (/NaN|undefined/.test(txt)) { fail++; console.log('FUZZ: NaN/undefined in copy'); break; }
    pass += 5;
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
