/* tools/test-credit-planner.js
   Suite for copilot-credit-planner.html (specs: the approved plan, Track B).
   Self-extracting: reads the page, normalizes CRLF to LF, lifts
   <script id="planner-engine"> and runs it in a bare vm context with only
   { module, exports, console }. Nothing to keep in sync by hand.

     node tools/test-credit-planner.js          (from the repo root)

   Sections: A anchors · B totality and hostile input · C invariants ·
   D optimizer oracle · E leak · F isolation · G facts · H agent-card helpers.
*/
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'copilot-credit-planner.html');
const src = fs.readFileSync(HTML, 'utf8').replace(/\r\n/g, '\n');
const m = /<script id="planner-engine">([\s\S]*?)<\/script>/.exec(src);
if (!m) { console.error('no <script id="planner-engine"> block in ' + HTML); process.exit(1); }
const engineSrc = m[1];
const sandbox = { module: { exports: {} }, console: console };
sandbox.exports = sandbox.module.exports;
vm.createContext(sandbox);
vm.runInContext(engineSrc, sandbox, { filename: 'planner-engine' });
const E = sandbox.module.exports.PlannerEngine;
if (!E) { console.error('engine did not export PlannerEngine'); process.exit(1); }

let pass = 0, fail = 0, skip = 0;
const section = { name: '' };
function ok(c, msg) { if (c) pass++; else { fail++; console.log('FAIL [' + section.name + ']: ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function near(a, b, msg, tol) { ok(typeof a === 'number' && Math.abs(a - b) <= (tol || 1e-6), msg + ' (got ' + a + ', want ' + b + ')'); }
function SKIP(msg) { skip++; console.log('SKIP [' + section.name + ']: ' + msg); }
function sec(n) { section.name = n; }
const J = (x) => JSON.parse(JSON.stringify(x));
const flat = (v) => ({ lo: Array(12).fill(v), mid: Array(12).fill(v), hi: Array(12).fill(v) });
function stateWith(agents, over) {
  const s = E.defaults();
  s.studio.agents = agents;
  return Object.assign(s, over || {});
}
function presetState(key) { return E.newAgent(E.defaults(), key); }
function firstAgent(st) { return E.agentResult(st.studio.agents[0], st); }
function wids(r) { return r.warnings.map((w) => w.id); }
function assertFinite(v, msg, depth) {
  depth = depth || 0;
  if (v == null || depth > 9) return true;
  if (typeof v === 'number') return isFinite(v) ? true : (ok(false, msg + ' not finite: ' + v), false);
  if (Array.isArray(v)) return v.every((x, i) => assertFinite(x, msg + '[' + i + ']', depth + 1));
  if (typeof v === 'object') return Object.keys(v).every((k) => assertFinite(v[k], msg + '.' + k, depth + 1));
  return true;
}
function copyClean(r) {
  const txt = r.warnings.map((w) => w.msg).join(' ') + ' ' + r.assumptions.map((a) => a.note).join(' ');
  return !/NaN|undefined|Infinity/.test(txt);
}
const PAYLOAD = (over) => Object.assign({
  __type: 'cowork-lane', version: 1, screen: 'results', accountName: 'Contoso', monthlyCredits: 100000, band: 0.3, calibrated: false,
  annualCredits: 1200000, year1Credits: 1200000, rampSeats: Array(12).fill(100), rampCredits: Array(12).fill(100000), basisSeats: 100,
  copilotLicensed: 100, licenses: { cop_biz: 100 }, cspMotion: 'indirectReseller', sellMode: false, creditUsd: 0.01
}, over || {});

/* ══════════════════════════════════════════════════════════════════════════
   A · Anchors (exact)
   ══════════════════════════════════════════════════════════════════════════ */
sec('A');
{
  // 1. Support bot: [(4×1)+(2×2)]×900 = 7,200 a day
  const a = firstAgent(presetState('support'));
  eq(a.perPeriod.billed, 7200, 'A1 support bot credits a day');
  eq(a.perUnit.total, 8, 'A1 support bot credits a conversation');
  // 2. Sales research: 100 unlicensed billed 4,800; 50 licensed zero-rated 2,400
  const b = firstAgent(presetState('sales'));
  eq(b.perPeriod.billed, 4800, 'A2 sales research billed a day');
  eq(b.perPeriod.zeroRated, 2400, 'A2 sales research zero-rated a day');
  eq(b.perUnit.total, E.RC.blueprints.v.salesResearch, 'A2 sales research = Microsoft blueprint 48 per run');
  // 3. Autonomous run, licensed maker: 20 billed, Z-AUTO
  const c = firstAgent(presetState('order'));
  eq(c.perUnit.total, 20, 'A3 order processing credits a run');
  eq(c.perUnit.bySegment.unlicensed.billed, 20, 'A3 order processing billed a run');
  ok(c.codes.indexOf('Z-AUTO') > -1 && c.licensedCovered === 0, 'A3 billed under Z-AUTO');
  // 4. Grounded generative answer = 12
  eq(E.bundleCredits([{ count: 1, rate: E.RC.generative.v }, { count: 1, rate: E.RC.grounding.v }]).credits, 12, 'A4 grounded answer');
  // 5. Enforcement example: remainder 14,500, cutoff 18,125
  const te = E.tenantEnforcement(E.MS_ENFORCEMENT_EXAMPLE.prepaid, E.MS_ENFORCEMENT_EXAMPLE.environments);
  eq(te.remainder, 14500, 'A5 tenant remainder');
  eq(te.agentsCutoff, 18125, 'A5 agents cutoff at 125%');
  eq(te.flowsCutoff, 14500, 'A5 flows cutoff at 100%');
  ok(te.environments[1].exempt === true && te.environments[1].agentsCutoff === null, 'A5 PAYG environment exempt');
  const s5 = stateWith([], {}); s5.combined.purchase.current.packs = 1; s5.combined.enforcement.basis = 'current';
  s5.studio.environments = E.MS_ENFORCEMENT_EXAMPLE.environments.map((x) => Object.assign({}, x));
  s5.studio.agents = [E.agentTemplate()]; s5.studio.agents[0].audience = 'external'; s5.studio.agents[0].traffic = { mode: 'total', count: 100, per: 'month' };
  s5.studio.agents[0].shape.turns = 1;
  const r5 = E.compute(s5);
  eq(r5.enforcement.remainder, 14500, 'A5 compute path: remainder from 1 pack and the example allocations');
  eq(r5.enforcement.agentsCutoff, 18125, 'A5 compute path: agents cutoff');
  // 6. CUA 4 steps: 20 standard / 60 premium
  eq(E.bundleCredits([{ count: 4, rate: E.RC.cuaStandard.v }]).credits, 20, 'A6 CUA standard');
  eq(E.bundleCredits([{ count: 4, rate: E.RC.cuaPremium.v }]).credits, 60, 'A6 CUA premium');
  // 7. P3 Tier 2 $14,100 vs $15,000 PAYG
  eq(E.p3Plan(5).usd, 14100, 'A7 P3 Tier 2 price (derived)');
  eq(E.p3Plan(5).plans.length === 1 && E.p3Plan(5).plans[0].tier, 2, 'A7 5 units = one Tier 2 plan');
  const o7 = E.optimize(flat(125000), { allowPacks: false });
  eq(o7.payg.expected.usd, 15000, 'A7 PAYG for 1.5M credits');
  // 7b. 125,000 flat → 5 packs, $12,000
  const o7b = E.optimize(flat(125000));
  eq(o7b.best.packs.flat, 5, 'A7b five packs');
  eq(o7b.best.expected.usd, 12000, 'A7b $12,000');
  eq(o7b.best.p3.units, 0, 'A7b no P3');
  // 7c. Same, packs off → Tier 2
  eq(o7.best.expected.usd, 14100, 'A7c packs off: $14,100');
  eq(o7.best.p3.plans[0].tier, 2, 'A7c packs off: Tier 2');
  // 7d. 755,000 flat: packs $72,600 (30 packs + $600 PAYG); P3 mix $84,300; PAYG $90,600
  const o7d = E.optimize(flat(755000));
  eq(o7d.families.packs.expected.usd, 72600, 'A7d packs family');
  eq(o7d.families.packs.packs.flat, 30, 'A7d 30 packs (31 would be $74,400)');
  eq(o7d.families.p3.expected.usd, 84300, 'A7d P3 family');
  eq(JSON.stringify(o7d.families.p3.p3.plans.map((p) => [p.tier, p.count])), '[[3,3]]', 'A7d P3 = 3 × Tier 3');
  eq(o7d.payg.expected.usd, 90600, 'A7d PAYG');
  eq(o7d.best.expected.usd, 72600, 'A7d best overall');
  // Track A P3 table (shared engine contract)
  eq(E.p3Plan(26).usd, 72750, 'A7e 78,000 CCCU = 2×T3 + T2 + T1 = $72,750');
  eq(E.p3Plan(500).usd, 1290000, 'A7e 1,500,000 CCCU = Tier 7 $1,290,000');
  eq(E.p3Plan(0).units, 0, 'A7e nothing below Tier 1');
  eq(E.p3Plan(1).usd, 2850, 'A7e Tier 1 $2,850');
  eq(E.p3Cover(99).usd, 270000, 'A7e covering 99 units: Tier 5 is cheaper than the exact 99 (overbuy)');
  ok(E.p3Plan(99).usd > E.p3Cover(99).usd, 'A7e exact 99 costs more than the cover');
  // 8. GitHub harness 10×2×22: low 114,400 (minimum), high 184,800
  const g = E.agentTemplate(); g.harness = 'github'; g.github.users = 10; g.github.perUserPerDay = 2; g.daysActive = 22;
  const gr = E.githubAgent(g);
  eq(gr.lo, 114400, 'A8 GitHub low');
  eq(gr.hi, 184800, 'A8 GitHub high');
  eq(gr.floor, true, 'A8 heavy unobserved = minimum');
  // 9. 100 × 4,000 = 400,000
  const s9 = E.defaults(); s9.studio.account.seats.business = 100; s9.studio.account.cspNewBusiness = 'yes';
  s9.coworkSession = PAYLOAD({ rampCredits: Array(12).fill(1451900), monthlyCredits: 1451900 });
  const r9 = E.compute(s9);
  eq(r9.enforcement.userCap.capTotal, 400000, 'A9 100 users × 4,000');
  eq(r9.enforcement.userCap.source, 'december-default', 'A9 December 1 default applies');
  eq(r9.enforcement.userCap.firstMonth, '2026-12', 'A9 first capped month');
  // per user 14,519 credits over 22 days ≈ 660/day → day ceil(4000/660) = 7 in the middle scenario
  eq(r9.enforcement.userCap.day.mid, Math.ceil(4000 / (14519 / 22)), 'A9 cap day, middle scenario');
  ok(wids(r9).indexOf('P-53') > -1, 'A9 P-53 fires');
  // 12. Seat break-evens
  const be = r9.crossover.breakEvens;
  eq(be.enterprise, 3000, 'A12 Enterprise $30 → 3,000'); eq(be.business, 2100, 'A12 Business $21 → 2,100');
  eq(be.promo, 1800, 'A12 promo $18 → 1,800'); eq(be.monthly, 2520, 'A12 monthly $25.20 → 2,520');
  // 13. Ramp 10% over 6 months
  eq(JSON.stringify(E.rampFactors({ mode: 'linear', startPct: 10, months: 6 }, 12)), JSON.stringify([0.1, 0.28, 0.46, 0.64, 0.82, 1, 1, 1, 1, 1, 1, 1]), 'A13 ramp');
  // Business Central
  eq(firstAgent(presetState('bcSalesOrder')).lo, 1650, 'A-BC Sales Order [2+5+5+2+(5×0.5)]×100');
  eq(firstAgent(presetState('bcPayables')).lo, 6500, 'A-BC Payables (50+5×3)×100');
  eq(firstAgent(presetState('bcExpense')).lo, 5000, 'A-BC Expense 50 × 100 receipts');
  ok(firstAgent(presetState('bcPayables')).codes.join() === 'Z-BC', 'A-BC billed per use');
  // Microsoft blueprints
  eq(firstAgent(presetState('expense')).perUnit.total, 15, 'A-MS expense 15'); eq(firstAgent(presetState('approval')).perUnit.total, 12, 'A-MS approval 12');
  eq(firstAgent(presetState('timesheet')).perUnit.total, 77, 'A-MS timesheet 77');
  // SMB scenarios A/B/C
  eq(firstAgent(presetState('website')).lo, 15000, 'A-SMB A website FAQ 15,000');
  const hd = presetState('helpdesk');
  eq(firstAgent(hd).lo, 9600, 'A-SMB B helpdesk 9,600');
  eq(firstAgent(hd).licensedCovered, 4800, 'A-SMB B helpdesk 20 licensed zero-rated 4,800');
  const hdWeb = J(hd); hdWeb.studio.agents[0].channel = 'website';
  eq(firstAgent(hdWeb).lo, 14400, 'A-SMB B on a non-Microsoft channel 14,400');
  const hdNoAuth = J(hd); hdNoAuth.studio.agents[0].auth = 'none';
  eq(firstAgent(hdNoAuth).lo, 14400, 'A-SMB B without Microsoft sign-in 14,400');
  const inv = presetState('invoice');
  eq(firstAgent(inv).lo, 16000, 'A-SMB C invoice intake 16,000');
  const invT = J(inv); invT.studio.agents[0].autonomous.countTriggerAsAction = true;
  eq(firstAgent(invT).lo, 18000, 'A-SMB C with the trigger counted 18,000');
  const trio = E.applyScenarioPreset(E.defaults(), 'smb-trio');
  const rt = E.compute(trio);
  eq(rt.pool.steady.lo, 40600, 'A-SMB portfolio 40,600 a month');
  const ot = E.optimize(flat(40600));
  eq(ot.best.packs.flat, 1, 'A-SMB best buy: 1 pack');
  eq(ot.best.scen.mid.paygCredits, 15600 * 12, 'A-SMB 15,600 credits a month on PAYG');
  eq(ot.best.scen.mid.months[0].fromPayg * 2 / 100 + 200, 356 + 156, 'A-SMB $356 a month (1 pack + $156 PAYG)');
  eq(ot.best.expected.usd, 4272, 'A-SMB $4,272 a year');
  eq(2 * 2400, 4800, 'A-SMB 2 packs $4,800 (arithmetic check)');
  eq(ot.payg.expected.usd, 4872, 'A-SMB PAYG $4,872');
  eq(ot.families.p3.expected.usd, 4722, 'A-SMB P3 Tier 1 + PAYG $4,722');
  ok(ot.best.expected.usd < 4722 && ot.best.expected.usd < 4800, 'A-SMB best beats 2 packs and Tier 1');
  // Microsoft estimator double subtraction: helpdesk 4,800 shown vs 9,600 rate card
  const me = E.msEstimatorEquivalent(hd.studio.agents[0], hd);
  eq(me.msTool, 4800, 'A-OBJ Microsoft tool shows 4,800'); eq(me.rateCard, 9600, 'A-OBJ rate card 9,600');
  ok(/4,800/.test(E.objections(E.compute(hd))[1].a) && /9,600/.test(E.objections(E.compute(hd))[1].a), 'A-OBJ objection carries both numbers');
  // Dataverse transcript growth: 10,240 sessions × 100 KB × 90/30 days = 3,072,000 KB = 2.9296875 GB
  const dv = E.defaults(); dv.studio.dataverse.kbPerSession = 100;
  const da = E.agentTemplate(); da.audience = 'external'; da.traffic = { mode: 'total', count: 10240, per: 'month' }; da.shape.turns = 1; da.data.retentionDays = 90;
  dv.studio.agents = [da];
  const rdv = E.compute(dv);
  eq(rdv.dataverse.transcriptGb, 2.9296875, 'A-DV transcript growth');
  eq(rdv.dataverse.entitlement.db, 15, 'A-DV Copilot Studio default 15 GB database once a purchase option exists');
  eq(E.dataverse(E.defaults(), [], false).entitlement.db, 3, 'A-DV default environment 3 GB before any purchase');
  const dv2 = J(dv); dv2.studio.dataverse.existingDbGb = 20;
  const rdv2 = E.compute(dv2);
  near(rdv2.dataverse.overageGb.db, 20 + 2.9296875 - 15, 'A-DV database overage');
  near(rdv2.dataverse.addOnUsd, (20 + 2.9296875 - 15) * 40, 'A-DV add-on at $40/GB');
  near(rdv2.dataverse.paygUsd, (20 + 2.9296875 - 15) * 48, 'A-DV PAYG at $48/GB');
  // Agent Assisted Hours: 1,000 sessions × 6 + 500 actions × 2.8 = 7,400 min = 123.33 h; × $72 = $8,880
  const vs = E.defaults(); vs.studio.value.on = true;
  const v1 = E.agentTemplate(); v1.audience = 'external'; v1.traffic = { mode: 'total', count: 1000, per: 'month' }; v1.shape.turns = 1;
  const v2 = E.agentTemplate(); v2.type = 'autonomous'; v2.traffic = { mode: 'total', count: 100, per: 'month' }; v2.bundle.actions = 5;
  vs.studio.agents = [v1, v2];
  const rv = E.compute(vs);
  near(rv.value.aah, 7400 / 60, 'A-VAL Agent Assisted Hours');
  near(rv.value.aavUsd, 8880, 'A-VAL Agent Assisted Value at $72');
  // Cowork payload lane: rampCredits × (1 ∓ band)
  const cw = E.coworkFromPayload(PAYLOAD(), 'auto');
  ok(cw.included && cw.months[0].lo === 70000 && cw.months[0].hi === 130000 && cw.months[0].mid === 100000, 'A-CW payload band');
  eq(E.coworkFromPayload(PAYLOAD({ screen: 'step3' }), 'auto').included, false, 'A-CW auto waits for results');
  eq(E.coworkFromPayload(PAYLOAD({ screen: 'step3' }), 'on').included, true, 'A-CW on includes');
  eq(E.coworkFromPayload(PAYLOAD(), 'off').included, false, 'A-CW off excludes');
  eq(E.coworkFromPayload(PAYLOAD({ band: 30 }), 'on').band, 0.3, 'A-CW band given as a percent');
  const acc = E.accountFromPayload(PAYLOAD({ licenses: { bprem_cop: 60, cop_biz: 20, cop_ent: 5, bstd: 40 } }));
  ok(acc.seats.business === 80 && acc.seats.enterprise === 5 && acc.tenantBase === 'premium' && acc.motion === 'indirectReseller', 'A-CW account defaults from payload');
}

/* ══════════════════════════════════════════════════════════════════════════
   B · Totality and hostile input
   ══════════════════════════════════════════════════════════════════════════ */
sec('B');
const HOSTILE = [1e308, -1e308, NaN, 'x', '12', {}, [], null, true, undefined];
function leafPaths(o, p, out) {
  if (o !== null && typeof o === 'object') {
    Object.keys(o).forEach((k) => leafPaths(o[k], p.concat(k), out));
    if (!Array.isArray(o)) out.push(p.concat('__proto__')); // prototype-key probes
  } else out.push(p);
  return out;
}
function setPath(o, p, v) {
  let x = o;
  for (let i = 0; i < p.length - 1; i++) { if (x[p[i]] === null || typeof x[p[i]] !== 'object') return; x = x[p[i]]; }
  if (p[p.length - 1] === '__proto__') Object.defineProperty(x, '__proto__', { value: { polluted: 1, total: 1e9 }, enumerable: true, configurable: true, writable: true });
  else x[p[p.length - 1]] = v;
}
{
  const bases = [E.defaults(), E.applyScenarioPreset(E.defaults(), 'full-estate')];
  bases[0].coworkSession = PAYLOAD();
  let n = 0, threw = 0, bad = 0;
  bases.forEach((base) => {
    const paths = leafPaths(base, [], []);
    paths.forEach((p) => {
      HOSTILE.forEach((v) => {
        if (p[p.length - 1] === '__proto__' && v !== 1e308) return;
        const s = J(base); setPath(s, p, v); n++;
        let r;
        try { r = E.compute(s); } catch (e) { threw++; console.log('FAIL [B]: compute threw on ' + p.join('.') + '=' + String(v) + ': ' + e.message); return; }
        if (!r || !assertFinite(r.pool, 'pool@' + p.join('.')) || !assertFinite(r.purchase.best.expected, 'best@' + p.join('.')) || !copyClean(r)) bad++;
      });
    });
  });
  ok(threw === 0, 'B hostile paths: compute never throws (' + n + ' cases)');
  ok(bad === 0, 'B hostile paths: finite and clean copy');
  ok(!({}).polluted, 'B no prototype pollution');
  // Whole-object hostility
  [null, undefined, 1e308, 'state', [], { studio: 'x' }, { studio: { agents: 'x' } }, { studio: { agents: [null, 1, 'a', [], { type: 'bc', bc: null }] } },
   { combined: { purchase: { current: { p3: 'x', packs: -1 } } } }, { coworkSession: { __type: 'cowork-lane', version: 1, rampCredits: [1e308, NaN, -5], band: -3 } }]
    .forEach((s, i) => {
      let r; try { r = E.compute(s); } catch (e) { ok(false, 'B whole-object ' + i + ' threw'); return; }
      ok(r && assertFinite(r.pool, 'whole ' + i) && copyClean(r), 'B whole-object hostile ' + i);
    });
  // Mutation: compute never mutates its input
  const s0 = E.applyScenarioPreset(E.defaults(), 'full-estate'), before = JSON.stringify(s0);
  E.compute(s0); E.customerView(E.compute(s0)); E.nextBestAction(E.compute(s0));
  eq(JSON.stringify(s0), before, 'B compute never mutates input');
  // Hostile session files
  const files = ['', 'null', '[]', '{', '"x"', '{"__type":"credit-planner-session"}', '{"__type":"credit-planner-partner-card","partner":{}}',
    '{"__type":"cowork-lane","version":1}', '{"__type":"credit-planner-session","schemaVersion":"abc","studio":{"agents":[{"__proto__":{"x":1}}]}}',
    '{"__type":"credit-planner-session","schemaVersion":99,"rateCardVersion":"2030-01-01","future":{"a":1},"studio":{}}',
    '{"__type":"credit-planner-session","__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}}}',
    JSON.stringify({ __type: 'credit-planner-session', coworkSession: { __type: 'nope' } }), 'x'.repeat(10)];
  files.forEach((f, i) => {
    let p; try { p = E.parseSession(f); } catch (e) { ok(false, 'B session file ' + i + ' threw'); return; }
    ok(p && p.state && typeof p.ok === 'boolean' && Array.isArray(p.warnings), 'B session file ' + i + ' total');
    ok(assertFinite(E.compute(p.state).pool, 'session ' + i), 'B session file ' + i + ' computes');
  });
  ok(!({}).polluted, 'B no prototype pollution from session files');
  const fut = E.parseSession(files[9]);
  ok(fut.ok && fut.state.extra.future && fut.state.extra.future.a === 1, 'B newer schema keeps unknown branches in extra');
  ok(wids(fut).indexOf('P-02') > -1 && wids(fut).indexOf('P-03') > -1, 'B P-02 and P-03 on a newer file');
  eq(E.parseSession('{"__type":"cowork-lane","version":1}').ok, false, 'B a Cowork payload is not a session');
  eq(E.parseSession(files[5]).ok, true, 'B bare envelope loads defaults');
  ok(wids(E.parseSession(files[5])).indexOf('P-03') > -1, 'B missing rate card version reprices (P-03)');
  // Round trip
  const rt0 = E.applyScenarioPreset(E.defaults(), 'full-estate'); rt0.coworkSession = PAYLOAD(); rt0.partner.motion = 'direct';
  const ser = E.serializeSession(rt0, { savedAt: '2026-10-11T10:00:00Z' });
  const back = E.parseSession(ser);
  ok(back.ok && back.warnings.length === 0, 'B session round trip clean');
  eq(JSON.stringify(back.state), JSON.stringify(E.normalize(rt0)), 'B session round trip identical');
  eq(back.savedAt, '2026-10-11T10:00:00Z', 'B savedAt survives');
  const env = JSON.parse(ser);
  ok(['__type', 'schemaVersion', 'rateCardVersion', 'savedAt', 'studio', 'combined', 'partner', 'coworkSession'].every((k) => k in env), 'B envelope has the plan keys');
  const safe = JSON.parse(E.serializeSession(rt0, { customerSafe: true }));
  ok(safe.customerSafe === true && safe.partner.motion === 'unsure' && JSON.stringify(safe.partner.services) === JSON.stringify(E.defaults().partner.services), 'B customer-safe export strips the partner branch');
  // Partner card
  const card = E.serializePartnerCard({ partner: { motion: 'indirectReseller', providerCreditUsd: 0.0085, services: [{ key: 'agentcare', label: 'AgentCare', basis: 'per-agent-month', price: 375, on: true }] } });
  const pc = E.parsePartnerCard(card);
  ok(pc.ok && pc.partner.motion === 'indirectReseller' && pc.partner.providerCreditUsd === 0.0085 && pc.partner.services[0].price === 375, 'B partner card round trip');
  ok(!E.parsePartnerCard(ser).ok && !E.parsePartnerCard('{').ok && !E.parsePartnerCard(null).ok, 'B partner card rejects other files');
  ok(!E.parseSession(card).ok, 'B a partner card is not a session');
  // Payload validation is total
  [null, 1, 'x', [], { __type: 'cowork-lane' }, { __type: 'cowork-lane', version: 2 }, PAYLOAD({ rampCredits: 'x', band: 'x', licenses: { __proto__: 1, 'Bad Key': 3, cop_biz: 1e308 } })]
    .forEach((p, i) => { let r; try { r = E.coworkFromPayload(p, 'on'); } catch (e) { ok(false, 'B payload ' + i + ' threw'); return; } ok(assertFinite(r.months, 'payload ' + i), 'B payload ' + i + ' total'); });
  // Seeded fuzz
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(20261011);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const VALS = [0, 1, 2, 5, 22, 30, 100, 1500, 25000, 1e6, -1, 0.5, 1e308, NaN, 'x', '7', null, true, {}, [], 'website', 'none', 'autonomous', 'bc', 'github', 'chat', 'perUser', 'day', 'tokens', 'payables'];
  let fuzzBad = 0;
  for (let i = 0; i < 500; i++) {
    let s = E.applyScenarioPreset(E.defaults(), pick(E.SCENARIO_ORDER));
    const nAdd = Math.floor(rnd() * 3);
    for (let k = 0; k < nAdd; k++) s = E.newAgent(s, pick(E.AGENT_PRESET_ORDER.concat([''])));
    if (rnd() < 0.5) s.coworkSession = PAYLOAD({ rampCredits: Array(12).fill(Math.floor(rnd() * 3e6)), screen: pick(['results', 'step2']) });
    s = J(s);
    const paths = leafPaths(s, [], []).filter((p) => p[p.length - 1] !== '__proto__');
    for (let k = 0; k < 6; k++) setPath(s, pick(paths), pick(VALS));
    let r;
    try { r = E.compute(s); } catch (e) { fuzzBad++; console.log('FAIL [B]: fuzz ' + i + ' threw ' + e.message); continue; }
    if (!r || !assertFinite(r.pool, 'fuzz' + i) || !assertFinite(r.purchase.best, 'fuzzbest' + i) || !copyClean(r)) { fuzzBad++; continue; }
    if (r.purchase.best.expected.usd > r.purchase.payg.expected.usd + 1e-6) { fuzzBad++; console.log('FAIL [B]: fuzz ' + i + ' best above PAYG'); }
    try { E.customerView(r); E.nextBestAction(r); E.talk(r); E.objections(r); E.ladder(r); } catch (e) { fuzzBad++; console.log('FAIL [B]: fuzz ' + i + ' text builders threw'); }
  }
  ok(fuzzBad === 0, 'B 500-case seeded fuzz');
  // Performance
  const big = E.defaults();
  big.coworkSession = PAYLOAD({ rampCredits: Array(12).fill(1e15), monthlyCredits: 1e15, basisSeats: 1e6 });
  big.studio.account.seats.business = 1e6;
  big.studio.agents = Array.from({ length: 60 }, (_, i) => {
    const a = E.agentTemplate(); a.type = ['conversational', 'autonomous', 'bc'][i % 3]; a.harness = i % 7 === 0 ? 'github' : 'standard';
    a.users = { total: 1e6, licensed: 5e5 }; a.traffic = { mode: 'perUser', count: 1e6, per: 'day' }; a.daysActive = 31;
    Object.keys(a.bundle).forEach((k) => { a.bundle[k] = 1e4; }); a.shape.turns = 1e4; a.reasoning = { on: true, tokens: 1e7 };
    a.github = Object.assign(a.github, { users: 1e5, perUserPerDay: 1e3, buildSessions: 1e5, buildMonths: 12 }); a.startMonth = 11;
    a.bc = { kind: 'payables', volume: 1e7, lines: 1e4 }; return a;
  });
  let t0 = Date.now(); const rb = E.compute(big); const tBig = Date.now() - t0;
  ok(tBig < 2000, 'B performance at MAX < 2 s (' + tBig + ' ms)');
  ok(assertFinite(rb.pool, 'MAX pool') && assertFinite(rb.purchase.best.expected, 'MAX best') && copyClean(rb), 'B MAX finite');
  E.compute(E.defaults());
  const times = []; for (let i = 0; i < 7; i++) { t0 = process.hrtime.bigint(); E.compute(E.defaults()); times.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  times.sort((a, b) => a - b);
  ok(times[3] < 50, 'B defaults compute < 50 ms (median ' + times[3].toFixed(2) + ' ms)');
}

/* ══════════════════════════════════════════════════════════════════════════
   C · Invariants
   ══════════════════════════════════════════════════════════════════════════ */
sec('C');
{
  const scen = E.SCENARIO_ORDER.map((k) => { const s = E.applyScenarioPreset(E.defaults(), k); s.coworkSession = PAYLOAD(); return s; });
  scen.forEach((s, i) => {
    const r = E.compute(s);
    ok(r.purchase.best.expected.usd <= r.purchase.payg.expected.usd + 1e-6, 'C best ≤ PAYG (' + E.SCENARIO_ORDER[i] + ')');
    // pool = sum of lanes
    r.pool.months.forEach((mo) => ['lo', 'mid', 'hi'].forEach((k) => near(mo.total[k], E.POOLED_LANES.reduce((a, l) => a + mo.lanes[l][k], 0), 'C pool month = Σ lanes', 1e-6)));
    // lanes reconcile to trace rows (steady, pre-ramp)
    r.lanes.agents.forEach((a) => {
      const rows = r.trace.filter((t) => t.ref === a.id && t.billed && t.lane !== 'build');
      near(a.lo, rows.filter((t) => t.scen === 'point' || t.scen === 'lo').reduce((x, t) => x + t.credits, 0), 'C ' + a.name + ' low = Σ trace', 1e-6);
      near(a.hi, rows.filter((t) => t.scen === 'point' || t.scen === 'hi').reduce((x, t) => x + t.credits, 0), 'C ' + a.name + ' high = Σ trace', 1e-6);
    });
    ok(r.trace.every((t) => !(t.prov === 'ms-retired' || t.prov === 'what-if') || E.POOLED_LANES.indexOf(t.lane) < 0), 'C retired and what-if rows never pooled');
    ok(r.trace.every((t) => t.zeroReason === null || t.zeroReason in E.ZERO_CODES), 'C every reason code is known');
    ok(r.trace.every((t) => t.billed || t.zeroReason === 'Z-LIC' || t.zeroReason === 'Z-CHAT' || /legacy|whatif/.test(t.lane)), 'C only Z-LIC/Z-CHAT lines are zero-rated');
  });
  // What-if never changes pool, purchase or customer view
  const s1 = scen[3], s2 = J(s1); s2.autopilot.whatIf = { on: true, autopilots: 50, tasksPerDay: 20 };
  const r1 = E.compute(s1), r2 = E.compute(s2);
  ok(r2.autopilot.whatIf && r2.autopilot.whatIf.hi > 0, 'C what-if computed');
  eq(JSON.stringify(r2.pool), JSON.stringify(r1.pool), 'C what-if leaves the pool alone');
  eq(JSON.stringify(r2.purchase), JSON.stringify(r1.purchase), 'C what-if leaves the purchase alone');
  eq(JSON.stringify(E.customerView(r2)), JSON.stringify(E.customerView(r1)), 'C what-if leaves the customer view alone');
  ok(E.serializeSession(s2, { customerSafe: true }).indexOf('"autopilots": 50') < 0, 'C what-if never reaches a customer-safe export');
  // Partner inputs never move the pool, the purchase or the customer view
  const s3 = J(s1); s3.partner = { motion: 'direct', providerCreditUsd: 0.0071, providerPackUsd: 150, providerP3Pct: 9, pecPct: 12, sellCreditUsd: 0.013, sellPackUsd: 260, seatMarginPct: 14,
    services: E.defaults().partner.services.map((x) => Object.assign(x, { on: true, cost: 99 })) };
  const r3 = E.compute(s3);
  eq(JSON.stringify(r3.pool), JSON.stringify(r1.pool), 'C partner inputs leave the pool alone');
  eq(JSON.stringify(r3.purchase), JSON.stringify(r1.purchase), 'C partner inputs leave the purchase alone');
  eq(JSON.stringify(E.customerView(r3)), JSON.stringify(E.customerView(r1)), 'C partner inputs leave the customer view alone');
  // Licensed users never raise billed credits (total mode: shift; perUser: move a user across)
  const hd = presetState('helpdesk');
  for (let L = 0; L <= 60; L += 10) {
    const a = J(hd); a.studio.agents[0].users.licensed = L;
    const b = J(hd); b.studio.agents[0].users.licensed = Math.min(60, L + 10);
    ok(firstAgent(b).lo <= firstAgent(a).lo, 'C moving users to licensed never raises billed (perUser, L=' + L + ')');
    const at = J(a), bt = J(b); [at, bt].forEach((x) => { x.studio.agents[0].traffic = { mode: 'total', count: 500, per: 'month' }; });
    ok(firstAgent(bt).lo <= firstAgent(at).lo + 1e-9, 'C more licensed headcount never raises billed (total, L=' + L + ')');
  }
  // Monotonic in demand
  let prev = null, prevAgg = null;
  [0, 100, 400, 1500, 6000, 25000, 90000].forEach((n) => {
    const s = presetState('website'); s.studio.agents[0].traffic.count = n;
    const r = E.compute(s);
    if (prev) ok(r.pool.year.lo >= prev.pool.year.lo && r.pool.year.hi >= prev.pool.year.hi && r.purchase.payg.expected.usd >= prev.purchase.payg.expected.usd, 'C monotonic pool and PAYG at ' + n);
    const agg = E.optimize({ lo: r.pool.months.map((x) => x.total.lo), mid: r.pool.months.map((x) => x.total.mid), hi: r.pool.months.map((x) => x.total.hi) }, { appetite: 'aggressive' });
    if (prevAgg) ok(agg.best.expected.usd >= prevAgg.best.expected.usd - 1e-6, 'C unconstrained best cost monotonic at ' + n);
    prev = r; prevAgg = agg;
  });
  // Paused agents leave the pool
  const sp = E.applyScenarioPreset(E.defaults(), 'smb-trio'), id = sp.studio.agents[0].id;
  eq(E.compute(E.pauseAgent(sp, id, true)).pool.steady.lo, 40600 - 15000, 'C pausing an agent removes it from the pool');
}

/* ══════════════════════════════════════════════════════════════════════════
   D · Optimizer brute-force oracle
   ══════════════════════════════════════════════════════════════════════════ */
sec('D');
{
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(42);
  const TIERS = E.RC.p3Tiers.v.map((t) => ({ tier: t.tier, units: t.cccu / 3000, usd: t.cccu * (100 - t.pct) / 100 }));
  // Independent exact-plan search by enumerating tier counts (small units only).
  const exactMemo = {};
  function bruteExact(u) {
    if (u in exactMemo) return exactMemo[u];
    let best = u === 0 ? { usd: 0, n: 0 } : null;
    (function rec(i, left, usd, n) {
      if (left === 0) { if (!best || usd < best.usd - 1e-9 || (Math.abs(usd - best.usd) < 1e-9 && n < best.n)) best = { usd: usd, n: n }; return; }
      if (i < 0) return;
      const t = TIERS[i];
      for (let c = Math.floor(left / t.units); c >= 0; c--) rec(i - 1, left - c * t.units, usd + c * t.usd, n + c);
    })(TIERS.length - 1, u, 0, 0);
    return (exactMemo[u] = best);
  }
  function bruteCover(u) { let b = null, bu = 0; for (let v = u; v <= u + 120; v++) { const e = bruteExact(v); if (!b || e.usd < b.usd - 1e-9) { b = e; bu = v; } } return { usd: b.usd, units: bu }; }
  const W = { lo: 0.25, mid: 0.5, hi: 0.25 }, CAP = { conservative: 0.05, balanced: 0.15, aggressive: null };
  function oracle(D, appetite) {
    const kmax = Math.ceil(Math.max(...D.lo, ...D.mid, ...D.hi) / 25000);
    const scheds = [];
    for (let k = 0; k <= kmax; k++) scheds.push(Array(12).fill(k));
    ['lo', 'mid', 'hi'].forEach((s) => { let mx = 0; const sc = D[s].map((d) => (mx = Math.max(mx, Math.floor(d / 25000)))); if (!scheds.some((x) => x.join() === sc.join())) scheds.push(sc); });
    let best = null; const fam = {};
    scheds.forEach((sc) => {
      const packUsd = sc.reduce((a, k) => a + 200 * k, 0);
      const resid = {}, unused = {};
      ['lo', 'mid', 'hi'].forEach((s) => { resid[s] = 0; unused[s] = 0; D[s].forEach((d, m) => { resid[s] += Math.max(0, d - 25000 * sc[m]); unused[s] += Math.max(0, 25000 * sc[m] - d); }); });
      const nmax = Math.ceil(Math.max(resid.lo, resid.mid, resid.hi) / 300000);
      const plans = [];
      for (let u = 0; u <= nmax; u++) { plans.push({ units: u, usd: bruteExact(u).usd }); const c = bruteCover(u); plans.push({ units: c.units, usd: c.usd }); }
      plans.forEach((p) => {
        const C = p.units * 300000, cost = {}, strand = {};
        let exp = 0;
        ['lo', 'mid', 'hi'].forEach((s) => { cost[s] = packUsd + p.usd + Math.max(0, resid[s] - C) / 100; strand[s] = unused[s] * 0.008 + (C > 0 ? Math.max(0, C - resid[s]) * p.usd / C : 0); exp += W[s] * cost[s]; });
        const cap = CAP[appetite];
        if (cap !== null && strand.lo > cap * cost.lo + 1e-9) return;
        const family = packUsd > 0 ? (p.units > 0 ? 'mix' : 'packs') : (p.units > 0 ? 'p3' : 'payg');
        const rec = { exp: exp, family: family };
        if (!best || exp < best.exp - 1e-6) best = rec;
        if (!fam[family] || exp < fam[family].exp - 1e-6) fam[family] = rec;
      });
    });
    return { best: best, fam: fam };
  }
  let agree = 0;
  for (let i = 0; i < 30; i++) {
    const base = 5000 + rnd() * 120000, ramp = rnd() < 0.5, spread = 0.05 + rnd() * 0.4;
    const mid = Array.from({ length: 12 }, (_, m) => Math.round(base * (ramp ? Math.min(1, 0.2 + m * 0.15) : 1) * (0.9 + rnd() * 0.2)));
    const D = { lo: mid.map((x) => Math.round(x * (1 - spread))), mid: mid, hi: mid.map((x) => Math.round(x * (1 + spread))) };
    const appetite = ['conservative', 'balanced', 'aggressive'][i % 3];
    const o = E.optimize(D, { appetite: appetite }), b = oracle(D, appetite);
    const same = Math.abs(o.best.expected.usd - b.best.exp) < 1e-6 &&
      ['payg', 'packs', 'p3', 'mix'].every((f) => (!o.families[f] && !b.fam[f]) || (o.families[f] && b.fam[f] && Math.abs(o.families[f].expected.usd - b.fam[f].exp) < 1e-6));
    if (same) agree++; else console.log('FAIL [D]: oracle case ' + i + ' optimizer ' + o.best.expected.usd + ' oracle ' + b.best.exp);
  }
  eq(agree, 30, 'D optimizer matches the brute-force oracle on 30 seeded cases');
  // Drawdown order: packs (no rollover) → P3 → PAYG
  const D = { lo: [30000, 10000, 60000, 0, 0, 0, 0, 0, 0, 0, 0, 0], mid: null, hi: null };
  D.mid = D.lo.slice(); D.hi = D.lo.slice();
  const o = E.optimize(D, { current: { packs: 1, p3: [1, 0, 0, 0, 0, 0, 0, 0, 0] } });
  const mo = o.current.scen.mid.months;
  ok(mo[0].fromPacks === 25000 && mo[0].fromP3 === 5000 && mo[0].fromPayg === 0, 'D month 1: packs first, then P3');
  ok(mo[1].fromPacks === 10000 && mo[1].packUnused === 15000 && mo[1].fromP3 === 0, 'D month 2: unused pack credits are lost, not carried');
  ok(mo[2].fromPacks === 25000 && mo[2].fromP3 === 35000 && mo[2].p3Balance === 300000 - 40000, 'D month 3: P3 balance draws down across months');
  const D2 = { lo: Array(12).fill(0), mid: Array(12).fill(0), hi: Array(12).fill(0) }; D2.lo[0] = D2.mid[0] = D2.hi[0] = 400000;
  const o2 = E.optimize(D2, { current: { packs: 0, p3: [1, 0, 0, 0, 0, 0, 0, 0, 0] } });
  ok(o2.current.scen.mid.months[0].fromP3 === 300000 && o2.current.scen.mid.months[0].fromPayg === 100000 && o2.current.scen.mid.exhaustMonth === 1, 'D P3 exhausted, then PAYG');
  ok(o.best.regret.max >= 0 && o.current.regret.max >= 0, 'D regret non-negative');
}

/* ══════════════════════════════════════════════════════════════════════════
   E · Leak: the customer view carries no partner keys or figures
   ══════════════════════════════════════════════════════════════════════════ */
sec('E');
{
  const BANNED_KEY = /margin|provider|pec|p3|tier|cccu|discount|cost|services|special/i;
  function keysOf(o, out) { if (o && typeof o === 'object') Object.keys(o).forEach((k) => { out.push(k); keysOf(o[k], out); }); return out; }
  const configs = E.SCENARIO_ORDER.map((k) => {
    const s = E.applyScenarioPreset(E.defaults(), k); s.coworkSession = PAYLOAD();
    s.partner = { motion: 'indirectReseller', providerCreditUsd: 0.00731, providerPackUsd: 173.37, providerP3Pct: 7.77, pecPct: 3.33, sellCreditUsd: 0.0123, sellPackUsd: 251.11, seatMarginPct: 17.77,
      services: E.defaults().partner.services.map((x) => Object.assign(x, { on: true, price: 4321.98, cost: 1234.56 })) };
    s.combined.purchase.allowPacks = k !== 'business-central';
    return s;
  });
  configs.forEach((s, i) => {
    const r = E.compute(s), cv = E.customerView(r), txt = JSON.stringify(cv);
    const bad = keysOf(cv, []).filter((k) => BANNED_KEY.test(k));
    ok(bad.length === 0, 'E no banned keys in the customer view (' + i + '): ' + bad.join(','));
    ['0.00731', '173.37', '7.77', '3.33', '0.0123', '251.11', '17.77', '4321.98', '1234.56', '4,321.98', '1,234.56'].forEach((f) => ok(txt.indexOf(f) < 0, 'E partner figure ' + f + ' absent (' + i + ')'));
    ok(!/CCCU|commit unit|Tier \d|margin|partner-earned|\bPEC\b|AgentCare|Credit Wrap|specialization/i.test(txt), 'E no partner phrases in the customer view (' + i + ')');
    if (r.partner.margin !== null) ok(txt.indexOf(String(Math.round(r.partner.margin))) < 0 || Math.round(r.partner.margin) < 1000, 'E margin value absent (' + i + ')');
    ok(cv.value === null, 'E value hidden until switched on (' + i + ')');
    ok(cv.warnings.every((w) => r.warnings.some((x) => x.id === w.id && x.aud === 'customer')), 'E only customer-audience warnings (' + i + ')');
  });
  const s = configs[0]; s.studio.value.on = true;
  ok(E.customerView(E.compute(s)).value !== null, 'E value appears once switched on');
  ok(E.customerView(null) && E.customerView({ junk: 1 }).warnings, 'E customer view is total');
  // renderCustomer (UI) reads only cv.
  const ui = /\/\* @ui:begin renderCustomer \*\/([\s\S]*?)\/\* @ui:end renderCustomer \*\//.exec(src);
  if (!ui) SKIP('renderCustomer not built yet (UI phase)');
  else ok(!/\br\.(partner|purchase|specialization|state)\b/.test(ui[1]), 'E renderCustomer reads only the customer view');
}

/* ══════════════════════════════════════════════════════════════════════════
   F · Isolation
   ══════════════════════════════════════════════════════════════════════════ */
sec('F');
{
  ['CoworkEngine', '<script src', 'fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'sendBeacon']
    .forEach((t) => ok(src.indexOf(t) < 0, 'F page has no ' + t));
  ok(!/<link[^>]+rel=["']?stylesheet/i.test(src), 'F no external stylesheet');
  ok(!/https?:\/\/[^"'\s<>]*\bppe\b/i.test(src) && !/ppe\.microsoft|\.ppe\./i.test(src), 'F never links a "ppe" host');
  ok(!/\bDate\b/.test(engineSrc), 'F engine has no Date');
  ok(!/Math\.random/.test(engineSrc), 'F engine has no Math.random');
  ok(!/\bdocument\.|\bwindow\.|\bnavigator\.|\blocation\./.test(engineSrc), 'F engine has no DOM or browser access');
  const scripts = src.match(/<script\b[^>]*>/g) || [];
  eq(scripts.length, 2, 'F exactly two inline scripts');
  ok(scripts[0] === '<script id="planner-engine">' && scripts[1] === '<script id="planner-ui">', 'F scripts carry the expected ids');
  const frames = src.match(/<iframe\b[^>]*>/g) || [];
  ok(frames.length <= 1 && frames.every((f) => /src="cowork-calculator\.html\?embed=1"/.test(f)), 'F at most one iframe, pointing at the Cowork page');
  ok(/<div class="mh-bar">/.test(src) && src.indexOf('<div class="mh-bar">') < src.indexOf('<div class="wrap">'), 'F C14 masthead present');
  const body = src.slice(src.indexOf('<body>'));
  ok(/^<body>\s*<div class="mh-bar">/.test(body), 'F .mh-bar is a direct child of body');
  ok(/<footer class="pagefoot/.test(src), 'F footer.pagefoot present');
  ok(!/\b(licence|colour|optimis|behaviour|catalogue|artefact|modelled|cancelled)\b/i.test(src.replace(/<script[\s\S]*?<\/script>/g, '')) && !/\b(licence|colour|optimis|behaviour|catalogue|artefact|modelled|cancelled)/i.test(engineSrc), 'F US English');
  // git: no planner commit also touches the Cowork page or its suites (the hooks commit is allowed to)
  let log = null;
  try { log = cp.execSync('git log --format=__C__%H%n%s --name-only -- copilot-credit-planner.html tools/test-credit-planner.js specs/copilot-credit-planner.spec.md', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { log = null; }
  if (log === null) SKIP('git unavailable');
  else {
    const commits = log.split('__C__').filter(Boolean);
    let badC = [];
    commits.forEach((c) => {
      const lines = c.split('\n').filter(Boolean), sha = lines[0];
      let files = [];
      try { files = cp.execSync('git show --name-only --format= ' + sha, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean); } catch (e) { files = []; }
      if (files.some((f) => f === 'cowork-calculator.html' || /^tools\/test-cowork-.*\.js$/.test(f))) badC.push(sha.slice(0, 7));
    });
    ok(badC.length === 0, 'F no planner commit touches cowork-calculator.html or tools/test-cowork-*.js (' + commits.length + ' commits checked)' + (badC.length ? ': ' + badC.join(',') : ''));
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   G · Facts cross-check against data/facts.json
   ══════════════════════════════════════════════════════════════════════════ */
sec('G');
{
  const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'facts.json'), 'utf8')).facts;
  const byId = {}; facts.forEach((f) => { byId[f.id] = f; });
  ok(/^\d{4}-\d{2}-\d{2}$/.test(E.RATECARD_VERSION), 'G RATECARD_VERSION is an ISO date');
  Object.keys(E.RC).forEach((k) => {
    const row = E.RC[k];
    ok(row.fact && byId[row.fact], 'G RC.' + k + ' fact ' + row.fact + ' exists');
    ok(row.src && row.src in E.SRC, 'G RC.' + k + ' source ' + row.src + ' is listed');
    ok(!(row.prov === 'ms-verified' && byId[row.fact] && byId[row.fact].status === 'NEEDS-SOURCE'), 'G RC.' + k + ' ms-verified never points at NEEDS-SOURCE');
    ok(row.prov in E.RANK, 'G RC.' + k + ' provenance is ranked');
  });
  Object.keys(E.SRC).forEach((k) => ok(/^\d{4}-\d{2}-\d{2}$/.test(E.SRC[k].date) && E.SRC[k].url && E.SRC[k].title, 'G SRC.' + k + ' dated'));
  E.SERVICE_PREFILLS.forEach((x) => ok(byId[x.fact], 'G service prefill ' + x.key + ' fact ' + x.fact + ' exists'));
  E.INCENTIVES.forEach((x) => ok(x.fact === null || byId[x.fact], 'G incentive ' + x.key + ' fact exists'));
  const val = (id) => byId[id] ? byId[id].value : null;
  eq(val('F-161'), '1', 'G classic answer'); eq(val('F-162'), '2', 'G generative'); eq(val('F-163'), '5', 'G action');
  eq(val('F-164'), '10', 'G grounding'); eq(val('F-168'), '8', 'G content'); eq(val('F-157'), '4,000', 'G cap');
  eq(val('F-178'), '$10,000', 'G specialization'); eq(val('F-176'), '$21', 'G Business list'); eq(val('F-147'), '$18', 'G promo');
  eq(val('F-090'), '$30', 'G Enterprise'); eq(val('F-149'), '$0.01', 'G PAYG'); eq(val('F-013'), '$200', 'G pack price');
  ok(/25,000/.test(byId['F-013'].notes + byId['F-013'].label), 'G pack credits 25,000');
  E.RC.p3Tiers.v.forEach((t) => {
    const usd = '$' + E.fmtInt(E.p3TierUsd(t));
    ok(byId['F-155'].notes.indexOf(E.fmtInt(t.cccu)) > -1 && byId['F-155'].notes.indexOf(t.pct + '%') > -1 && byId['F-155'].notes.indexOf(usd) > -1, 'G F-155 carries Tier ' + t.tier + ' ' + usd);
  });
  ok(/2 .*5 .*5 .*2/.test(val('F-185') || '') || /1,650/.test((byId['F-185'] || {}).notes || ''), 'G F-185 Sales Order rates');
  ok(/50/.test(val('F-186') || '') && /6,500/.test((byId['F-186'] || {}).notes || ''), 'G F-186 Payables');
  eq(val('F-187'), '50', 'G F-187 Expense receipt');
  ok(/15/.test(val('F-190') || '') && /20/.test(val('F-190') || ''), 'G F-190 Dataverse 15/20/2');
  ok(/\$40/.test(val('F-191') || ''), 'G F-191 add-on $40'); ok(/\$48/.test(val('F-192') || ''), 'G F-192 PAYG $48');
  ok(/2\.8/.test(val('F-193') || ''), 'G F-193 2.8 minutes'); eq(val('F-199'), '$350', 'G F-199 AgentCare'); eq(val('F-200'), '$400', 'G F-200 AgentCare Tier 3');
  ok(byId['F-199'] && byId['F-199'].type === 'our-price', 'G Playbook prices are our-price');
  // Every $ in static prose sits inside data-fact
  const prose = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<([a-z0-9]+)[^>]*\bdata-fact="F-\d{3}"[^>]*>[\s\S]*?<\/\1>/g, '');
  ok(prose.indexOf('$') < 0, 'G every $ in static prose sits inside data-fact');
  ok(/fact_count/.test(fs.readFileSync(path.join(ROOT, 'data', 'facts.json'), 'utf8')), 'G facts.json readable');
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'facts.json'), 'utf8'));
  eq(d.fact_count, d.facts.length, 'G fact_count matches');
  eq(d.occurrence_count, d.facts.reduce((a, f) => a + f.occurrences.length, 0), 'G occurrence_count matches');
}

/* ══════════════════════════════════════════════════════════════════════════
   H · Agent-card helpers and the audience matrix
   ══════════════════════════════════════════════════════════════════════════ */
sec('H');
{
  let s = E.defaults();
  const before = JSON.stringify(s);
  s = E.newAgent(s, 'helpdesk');
  eq(JSON.stringify(E.defaults()), before, 'H defaults untouched');
  eq(s.studio.agents.length, 1, 'H newAgent adds');
  eq(s.studio.agents[0].archetype, 'helpdesk', 'H newAgent archetype');
  s = E.newAgent(s);
  eq(s.studio.agents[1].name, 'New agent', 'H blank agent');
  const ids = s.studio.agents.map((a) => a.id);
  ok(new Set(ids).size === 2, 'H unique ids');
  const snap = JSON.stringify(s);
  const s2 = E.duplicateAgent(s, ids[0]);
  eq(JSON.stringify(s), snap, 'H duplicate does not mutate');
  eq(s2.studio.agents.length, 3, 'H duplicate adds');
  eq(s2.studio.agents[1].name, 'HR and IT helpdesk (copy)', 'H duplicate sits after the original');
  ok(new Set(s2.studio.agents.map((a) => a.id)).size === 3, 'H duplicate gets a new id');
  eq(firstAgent(s2).lo, E.agentResult(s2.studio.agents[1], s2).lo, 'H duplicate prices the same');
  const s3 = E.renameAgent(s2, ids[0], '  Helpdesk\u0007 v2  ');
  eq(s3.studio.agents[0].name, 'Helpdesk  v2', 'H rename trims and strips control characters');
  eq(E.renameAgent(s2, ids[0], '').studio.agents[0].name, 'HR and IT helpdesk', 'H empty rename ignored');
  const s4 = E.deleteAgent(s3, ids[1]);
  eq(s4.studio.agents.length, 2, 'H delete removes');
  ok(s4.studio.agents.every((a) => a.id !== ids[1]), 'H delete removes the right card');
  eq(JSON.stringify(E.deleteAgent(s4, 'nope')), JSON.stringify(s4), 'H unknown id is a no-op');
  const s5 = E.pauseAgent(s4, ids[0], true);
  eq(s5.studio.agents[0].paused, true, 'H pause');
  const s6 = E.applyAgentPreset(s5, ids[0], 'website');
  eq(s6.studio.agents[0].id, ids[0], 'H preset keeps the id');
  eq(firstAgent(s6).lo, 15000, 'H preset reproduces the example');
  eq(JSON.stringify(E.applyAgentPreset(s5, ids[0], 'toString')), JSON.stringify(s5), 'H unknown preset ignored');
  let full = E.defaults(); for (let i = 0; i < 55; i++) full = E.newAgent(full, 'website');
  eq(full.studio.agents.length, E.MAX.agents, 'H agent count capped');
  eq(E.duplicateAgent(full, full.studio.agents[0].id).studio.agents.length, E.MAX.agents, 'H duplicate respects the cap');
  E.SCENARIO_ORDER.forEach((k) => ok(E.applyScenarioPreset(E.defaults(), k).studio.agents.length > 0, 'H scenario preset ' + k));
  ok(E.AGENT_PRESET_ORDER.every((k) => E.AGENT_PRESETS[k] && E.AGENT_PRESETS[k].example && E.AGENT_PRESETS[k].fact), 'H every archetype carries its example and fact');
  // patch / applyFix
  const pf = E.applyFix(E.defaults(), { path: 'studio.account.cspNewBusiness', value: 'yes' });
  eq(pf.studio.account.cspNewBusiness, 'yes', 'H applyFix sets a path');
  eq(JSON.stringify(E.patch(E.defaults(), '__proto__.x', 1)), JSON.stringify(E.defaults()), 'H patch refuses prototype keys');
  eq(JSON.stringify(E.patch(E.defaults(), 'nope.x', 1)), JSON.stringify(E.defaults()), 'H patch ignores unknown paths');
  const dd = E.defaultsDelta(E.defaults());
  ok(dd.total > 20 && dd.atDefault === dd.total, 'H defaultsDelta at defaults');
  ok(E.defaultsDelta(pf).changed.indexOf('studio.account.cspNewBusiness') > -1, 'H defaultsDelta sees a change');
  // Every warning fix applies cleanly
  E.SCENARIO_ORDER.forEach((k) => {
    const r = E.compute(E.applyScenarioPreset(E.defaults(), k));
    r.warnings.forEach((w) => w.fixes.forEach((f) => { let x; try { x = E.applyFix(r.state, f); } catch (e) { x = null; } ok(x && E.compute(x), 'H fix "' + f.label + '" applies'); }));
  });
  // Audience × channel × auth × harness × kind × origin cross-product
  const HARN = ['standard', 'chat', 'github'], CH = Object.keys(E.CHANNELS), AU = ['microsoft', 'none', 'manual'], SEG = ['licensed', 'unlicensed', 'external'],
        KIND = ['standard', 'flow', 'voice', 'cua', 'workiq'], ORG = ['conversation', 'autonomous', 'bc'], KEYS = ['classic', 'generative', 'grounded', 'actions', 'flowActions'], FT = ['agent', 'other'];
  let n = 0, badZ = 0;
  HARN.forEach((h) => CH.forEach((c) => AU.forEach((au) => FT.forEach((ft) => SEG.forEach((sg) => KIND.forEach((k) => ORG.forEach((o) => KEYS.forEach((key) => {
    n++;
    const z = E.zeroRating({ harness: h, channel: c, auth: au, flowTrigger: ft }, sg, k, o, key);
    const msCh = E.MS_CHANNELS.indexOf(c) > -1;
    if (!(z.code in E.ZERO_CODES)) badZ++;
    if (!z.billed) {
      const okFree = o === 'conversation' && h !== 'github' && msCh && au === 'microsoft' && ['cua', 'workiq', 'voice'].indexOf(k) < 0 && sg !== 'external' &&
        (sg === 'licensed' || (h === 'chat' && ['classic', 'greetings', 'generative'].indexOf(key) > -1)) && !(k === 'flow' && ft === 'other' && z.code !== 'Z-CHAT');
      if (!okFree) { badZ++; if (badZ < 5) console.log('FAIL [H]: zero-rated wrongly', h, c, au, ft, sg, k, o, key, z.code); }
    }
    if (h === 'github' && !(o === 'bc') && z.code !== 'Z-GH') badZ++;
    if (o === 'bc' && z.code !== 'Z-BC') badZ++;
    if ((k === 'cua' || k === 'workiq') && !z.billed) badZ++;
    if (o === 'autonomous' && !z.billed) badZ++;
    if (z.code === 'Z-AUTO' && !z.likely) badZ++;
  }))))))));
  eq(badZ, 0, 'H zero-rating cross-product (' + n + ' combinations)');
  ok(E.zeroRating({}, 'licensed', 'standard', 'conversation', 'generative').code === 'Z-LIC', 'H licensed + Microsoft defaults are zero-rated');
  ok(E.zeroRating({ harness: 'chat' }, 'unlicensed', 'standard', 'conversation', 'generative').code === 'Z-CHAT', 'H Agent Builder answer without grounding is free');
  ok(E.zeroRating({ harness: 'chat' }, 'unlicensed', 'standard', 'conversation', 'grounded').billed, 'H Agent Builder grounding bills for unlicensed users');
  ok(E.zeroRating({ flowTrigger: 'other' }, 'licensed', 'flow', 'conversation', 'flowActions').code === 'Z-FLOW', 'H non-agent flow trigger bills');
  // Prompt pricing per 1K tokens rounds up started units
  const pt = E.agentTemplate(); pt.type = 'autonomous'; pt.traffic = { mode: 'total', count: 1, per: 'month' }; pt.bundle.aiPremium = 1; pt.aiPricing = 'tokens'; pt.aiTokensPerCall = 1001;
  eq(E.studioAgent(pt).lo, 20, 'H 1,001 tokens bill as 2 started 1K units');
  pt.autonomous.countPromptAsAction = true;
  eq(E.studioAgent(pt).lo, 25, 'H prompt counted as an action adds 5');
  const rs = E.agentTemplate(); rs.audience = 'external'; rs.traffic = { mode: 'total', count: 1, per: 'month' }; rs.shape.turns = 1; rs.reasoning = { on: true, tokens: 2500 };
  eq(E.studioAgent(rs).lo, 2 + 30, 'H reasoning bills twice: feature 2 + 3 started 1K units × 10');
  // Text builders
  const rr = E.compute(E.applyScenarioPreset(E.defaults(), 'full-estate'));
  const nba = E.nextBestAction(rr);
  ok(nba.primary && nba.matches.length >= 2 && nba.matches[nba.matches.length - 1].id === 'NBA-14', 'H next best action ends with the default rule');
  ok(nba.matches.every((x) => x.eyebrow && x.name && Array.isArray(x.why) && x.opener && x.then && x.link), 'H rules carry every field');
  ok(E.objections(rr).length === 9 && E.objections(rr).every((o) => o.q && o.a && !/NaN|undefined|Infinity/.test(o.a)), 'H nine objection cards, clean');
  ok(E.talk(rr).length > 2 && E.talk(rr).every((l) => !/NaN|undefined|Infinity/.test(l)), 'H talk track clean');
  eq(E.ladder(rr).filter((x) => x.recommended).length, 1, 'H ladder recommends one rung');
  ok(E.nextBestAction(null).primary.id && E.objections('x').length >= 0 && Array.isArray(E.talk(undefined)), 'H text builders are total');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
process.exit(fail ? 1 : 0);
