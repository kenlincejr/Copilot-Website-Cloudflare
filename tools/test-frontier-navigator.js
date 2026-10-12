/* tools/test-frontier-navigator.js
   Suite for frontier-navigator/ (the partner readiness assessment).
   Self-extracting: loads frontier-navigator/assets/js/scoring.js into a bare vm
   context and reads the data files directly. Nothing to keep in sync by hand.

     node tools/test-frontier-navigator.js          (from the repo root)

   Ground truth: research/partner-program-journey/13-frontier-navigator-fact-audit.md
   (Microsoft Learn, checked 2026-10-12). The oracle in section B is written
   from that file's section 2.2 tables, not from the engine.

   Sections: A facts · B oracle · C invariants and hostile input ·
   D branching and wiring · E personas · F copy rules.
*/
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'frontier-navigator');
const read = (p) => fs.readFileSync(path.join(APP, p), 'utf8').replace(/\r\n/g, '\n');

const sandbox = { console, Math, Number, String, Object, Array, JSON };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(read('assets/js/scoring.js'), sandbox, { filename: 'scoring.js' });
const F = sandbox.FrontierNavigator;
if (!F) { console.error('scoring.js did not export FrontierNavigator'); process.exit(1); }
const QUESTIONS = JSON.parse(read('data/questions.json'));
const RESOURCES = JSON.parse(read('data/resources.json'));

let pass = 0, fail = 0;
const section = { name: '' };
function ok(c, msg) { if (c) pass++; else { fail++; console.log('FAIL [' + section.name + ']: ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function near(a, b, msg) { ok(Math.abs(a - b) < 1e-6, msg + ' (got ' + a + ', want ' + b + ')'); }
const plain = (x) => JSON.parse(JSON.stringify(x));

// ── A. Facts ────────────────────────────────────────────────────────────────
section.name = 'A facts';
const MAXES = { // audit §2.1, in engine metric order
  modern_work: [20, 10, 15, 30, 25],
  security: [20, 40, 20, 20],
  data_ai: [30, 40, 20, 10],
  digital_app: [30, 20, 20, 20, 10],
  infrastructure: [30, 20, 20, 20, 10],
  business_apps: [15, 20, 15, 30, 20]
};
Object.keys(MAXES).forEach((area) => {
  const m = F.AREAS[area];
  ok(!!m, 'area exists: ' + area);
  if (!m) return;
  eq(JSON.stringify(m.metrics.map((x) => x.max)), JSON.stringify(MAXES[area]), area + ' metric maxes');
  eq(m.metrics.reduce((s, x) => s + x.max, 0), 100, area + ' maxes total 100');
});
eq(Object.keys(F.AREAS).length, 6, 'six solution areas');
eq(F.THRESHOLD, 70, 'qualifying threshold');
eq(F.stageDefinitions.length, 6, 'six ladder nodes');
const stageText = JSON.stringify(plain(F.stageDefinitions));
ok(/"cost":"\$0"/.test(stageText), 'enrollment costs $0');
ok(stageText.includes('$350 Launch') && stageText.includes('$925 Core') && stageText.includes('$4,125 Expanded'), 'package prices 350/925/4,125');
ok(stageText.includes('$4,875/yr, covers every designation'), 'one designation fee covers all');
ok(!/Second Designation|\+\$4,875|Action Pack|\$475/.test(stageText), 'no second-designation rung, Action Pack, or $475');
ok(stageText.includes('about $2,700') && stageText.includes('about $4,000'), 'audit prices on Copilot and Frontier');
ok(/Modern Work, Business Applications, or Security designation/.test(stageText), 'Copilot spec needs any one of three designations');
ok(/5 Frontier Transformation Engineer Titan badges; 3 DP-600/.test(stageText), 'Frontier people requirements');
// Every metric's per-unit value reaches exactly its max at unitsForMax.
Object.keys(F.AREAS).forEach((area) => {
  F.AREAS[area].metrics.forEach((m) => {
    ['csp', 'cpor'].forEach((assoc) => {
      const a = { targetArea: area, mw_association: assoc };
      const per = typeof m.perUnit === 'function' ? m.perUnit(a) : m.perUnit;
      const units = typeof m.unitsForMax === 'function' ? m.unitsForMax(a) : m.unitsForMax;
      near((m.gatePoints || 0) + per * units, m.max, area + '.' + m.id + ' gate + perUnit x unitsForMax = max (' + assoc + ')');
    });
  });
});
// Resources: audited URLs only; no soft-404 incentives link; all six focus ids valid.
const AUDITED = /^https:\/\/(learn\.microsoft\.com\/en-us\/(partner-center|credentials)\/|partner\.microsoft\.com\/en-us\/partnership|www\.tdsynnex\.com\/na\/us\/microsoft\/|assetsprod\.microsoft\.com\/en-us\/(copilot|frontier-partner)-specialization-audit-checklist\.pdf|copilotplaybook\.com\/copilot-specialization\.html)/;
RESOURCES.forEach((r) => {
  ok(AUDITED.test(r.url), 'resource URL is on the audited list: ' + r.url);
  ok(r.focus.every((f) => F.AREAS[f]), 'resource focus ids valid: ' + r.title);
  ok(r.stage.every((s) => /^[0-5]$/.test(s)), 'resource stage ids valid: ' + r.title);
});
ok(!RESOURCES.some((r) => /membership\/incentives/.test(r.url)), 'soft-404 incentives URL removed');
// Every stage and area combination finds at least one resource.
for (let st = 0; st <= 5; st++) Object.keys(F.AREAS).forEach((area) => {
  ok(RESOURCES.some((r) => r.stage.includes(String(st)) && r.focus.includes(area)), 'resources exist for stage ' + st + ' / ' + area);
});

// ── B. Oracle ───────────────────────────────────────────────────────────────
section.name = 'B oracle';
// Independent re-implementation from the audit table.
function lin(units, per, max) { return Math.min(max, Math.max(0, units) * per); }
function oracle(a) {
  const g = (k) => Number(a[k]) || 0;
  switch (a.targetArea) {
    case 'modern_work': {
      const cpor = a.mw_association === 'cpor';
      return [lin(g('mw_netAdds'), 2, 20), lin(g('mw_intPeople'), 5, 10), lin(g('mw_advPeople'), 15, 15),
        Math.min(30, g('mw_mauGrowth') / (cpor ? 500 : 2000) * 30), lin(g('mw_deployments'), cpor ? 5 : 2.5, 25)];
    }
    case 'security': {
      const s1 = g('sec_sc500') >= 1 ? 4 : 0, s2 = g('sec_sc200') >= 1 ? 4 : 0;
      return [lin(g('sec_netAdds'), 4, 20), s1 + s2 + (s1 && s2 ? lin(g('sec_step3'), 8, 32) : 0),
        Math.min(20, g('sec_userGrowth') / 50), Math.min(20, g('sec_deployments') * 20 / 6)];
    }
    case 'data_ai': {
      const ga = g('dai_az104') >= 1 ? 4 : 0, gb = g('dai_az305') >= 1 ? 4 : 0;
      return [lin(g('dai_netAdds'), 10, 30), ga + gb + (ga && gb ? lin(g('dai_people'), 4, 32) : 0),
        lin(g('dai_acrGrowth'), 1, 20), lin(g('dai_services'), 2, 10)];
    }
    case 'digital_app': case 'infrastructure': {
      const p = a.targetArea === 'digital_app' ? 'dapp' : 'infra';
      return [lin(g(p + '_netAdds'), 10, 30),
        g(p + '_az104') >= 1 ? 4 + lin(g(p + '_intPeople'), 4, 16) : 0,
        g(p + '_az305') >= 1 ? 4 + lin(g(p + '_advPeople'), 4, 16) : 0,
        lin(g(p + '_acrGrowth'), 1, 20), lin(g(p + '_services'), 2, 10)];
    }
    case 'business_apps':
      return [lin(g('ba_netAdds'), 3, 15), lin(g('ba_intPeople'), 4, 20), lin(g('ba_advPeople'), 7.5, 15),
        lin(g('ba_mcvGrowth'), 1, 30), lin(g('ba_deployments'), 4, 20)];
  }
  return null;
}
// Microsoft's own worked examples (Modern Work page, fetched 2026-10-12).
near(F.calculatePCS({ targetArea: 'modern_work', mw_association: 'csp', mw_mauGrowth: '1000' }).metrics[3].points, 15, 'MS example: 1,000 CSP MAU growth = 15');
near(F.calculatePCS({ targetArea: 'modern_work', mw_association: 'csp', mw_deployments: '4' }).metrics[4].points, 10, 'MS example: 4 CSP deployments = 10');
near(F.calculatePCS({ targetArea: 'modern_work', mw_association: 'cpor', mw_deployments: '4' }).metrics[4].points, 20, 'MS example: 4 CPOR deployments = 20');
near(F.calculatePCS({ targetArea: 'modern_work', mw_association: 'cpor', mw_mauGrowth: '1000' }).metrics[3].points, 30, 'MS example: CPOR growth caps at 30');
// Security gate: step 3 scores nothing without both gates.
eq(F.calculatePCS({ targetArea: 'security', sec_sc500: '0', sec_sc200: '1', sec_step3: '4' }).metrics[1].points, 4, 'Security step 3 blocked without SC-500');
eq(F.calculatePCS({ targetArea: 'security', sec_sc500: '1', sec_sc200: '1', sec_step3: '4' }).metrics[1].points, 40, 'Security skilling max 40 at 1+1+4');
eq(F.calculatePCS({ targetArea: 'data_ai', dai_az104: '1', dai_az305: '0', dai_people: '8' }).metrics[1].points, 4, 'Data & AI people blocked without AZ-305');
eq(F.calculatePCS({ targetArea: 'infrastructure', infra_az104: '0', infra_intPeople: '4' }).metrics[1].points, 0, 'Infra intermediate blocked without AZ-104');
eq(F.calculatePCS({ targetArea: 'data_ai', dai_netAdds: '3' }).metrics[0].points, 30, 'Azure net adds max at 3 customers');
// Randomized oracle comparison.
let seed = 20261012;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const areas = Object.keys(F.AREAS);
for (let i = 0; i < 6000; i++) {
  const a = { targetArea: areas[i % 6], mw_association: rnd() < 0.5 ? 'cpor' : 'csp' };
  QUESTIONS.filter((q) => q.type === 'number').forEach((q) => { if (rnd() < 0.85) a[q.id] = String(Math.floor(rnd() * (rnd() < 0.2 ? 3000 : 12))); });
  const want = oracle(a);
  const got = F.calculatePCS(a);
  const exact = want.reduce((s, x) => s + x, 0);
  ok(Math.abs(got.exact - exact) < 1e-6, 'oracle total ' + JSON.stringify(a) + ' got ' + got.exact + ' want ' + exact);
  ok(got.qualified === (exact >= 70 - 1e-9 && want.every((x) => x > 0)), 'oracle qualified ' + JSON.stringify(a));
  if (fail > 20) break;
}

// ── C. Invariants and hostile input ─────────────────────────────────────────
section.name = 'C invariants';
const hostile = ['', 'abc', '-5', '5.5', '1e9', ' 7 ', null, undefined, NaN, Infinity, -Infinity, [], {}, '0x10', '٣', '9'.repeat(40), true];
for (let i = 0; i < 4000; i++) {
  const a = { targetArea: rnd() < 0.1 ? 'bogus' : areas[i % 6], programStatus: ['not_enrolled', 'member', 'package', 'designated', 'x'][i % 5],
    designationsHeld: rnd() < 0.5 ? ['modern_work'] : 'oops', specializationsHeld: rnd() < 0.5 ? ['copilot', 'iam'] : null,
    goal12Mo: ['copilot_spec', 'frontier_spec', 'unsure', undefined][i % 4] };
  QUESTIONS.filter((q) => q.type === 'number').forEach((q) => { a[q.id] = rnd() < 0.5 ? hostile[Math.floor(rnd() * hostile.length)] : String(Math.floor(rnd() * 50)); });
  let s;
  try { s = F.summarize(a); } catch (e) { ok(false, 'summarize threw: ' + e.message + ' on ' + JSON.stringify(a)); continue; }
  ok(Number.isInteger(s.pcs.total) && s.pcs.total >= 0 && s.pcs.total <= 100, 'total integer 0-100: ' + s.pcs.total);
  ok(s.pcs.total <= s.pcs.exact + 1e-9 && s.pcs.exact - s.pcs.total < 1, 'headline is floor of exact');
  ok(s.pcs.metrics.every((m) => m.points >= 0 && m.points <= m.max && Number.isFinite(m.points)), 'metrics within 0..max');
  ok(!s.pcs.qualified || s.pcs.total >= 70, 'qualified never shows under 70');
  ok(s.stage >= 0 && s.stage <= 5 && s.stageDefinition, 'stage in range');
  ok(s.gap.actions.length === 3 && s.gap.actions.every((x) => typeof x === 'string' && x.length > 10), 'three actions');
  ok(s.roadmap.length === 3 && s.roadmap.every((b) => b.actions.length === 3), 'roadmap 3x3');
  const text = JSON.stringify([s.gap, s.roadmap, s.priority]);
  ok(!/undefined|NaN|null|\[object/.test(text), 'no undefined/NaN in copy: ' + text.slice(0, 200));
  if (fail > 40) break;
}
// 20 + 16 + 17 + 16.67 = 69.67: shown as 69 and not qualified, never rounded up to 70.
const edge = F.calculatePCS({ targetArea: 'security', sec_netAdds: '5', sec_sc500: '1', sec_sc200: '1', sec_step3: '1', sec_userGrowth: '850', sec_deployments: '5' });
near(edge.exact, 20 + 16 + 17 + 100 / 6, 'exact keeps the fraction');
eq(edge.total, 69, 'headline floors 69.67 to 69');
eq(edge.qualified, false, '69.67 does not qualify');
eq(edge.pointsTo70, 1, '69.67 is 1 point short');
// Storage: legacy answers are ignored; storage failures do not throw.
const store = {};
sandbox.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
store[F.STORAGE_KEY] = JSON.stringify({ currentTier: 'action_pack', designation: 'multiple' });
eq(JSON.stringify(plain(F.loadAssessment())), '{}', 'legacy v1 answers are not scored');
ok(F.hasLegacyAssessment(), 'legacy answers are detected for the retake notice');
F.saveAssessment({ programStatus: 'member', targetArea: 'security' });
eq(F.loadAssessment().targetArea, 'security', 'v2 round-trip');
ok(!('_v' in F.loadAssessment()), 'schema marker stripped on load');
store[F.STORAGE_KEY] = '{not json';
eq(JSON.stringify(plain(F.loadAssessment())), '{}', 'corrupt storage reads as empty');
sandbox.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
let threw = false;
try { F.saveAssessment({ a: 1 }); F.loadAssessment(); F.clearAssessment(); F.hasLegacyAssessment(); } catch (e) { threw = true; }
ok(!threw, 'blocked storage never throws');
delete sandbox.localStorage;

// ── D. Branching and wiring ─────────────────────────────────────────────────
section.name = 'D wiring';
const ids = new Set();
QUESTIONS.forEach((q) => { ok(!ids.has(q.id), 'unique id ' + q.id); ids.add(q.id); });
QUESTIONS.forEach((q) => {
  ['showIf', 'hideIf'].forEach((k) => q[k] && Object.keys(q[k]).forEach((dep) => ok(ids.has(dep), q.id + ' ' + k + ' refers to a real question: ' + dep)));
  if (q.type === 'select' || q.type === 'checkbox') ok(q.options.length >= 2 && q.options.every((o) => o.value && o.label), q.id + ' options valid');
  if (q.type === 'number') ok(q.min === 0 && q.max > 0, q.id + ' has 0..max');
});
// Every engine input is asked, visible exactly when its area is selected, and every number question feeds something.
const engineKeys = new Set();
Object.keys(F.AREAS).forEach((area) => {
  const asked = QUESTIONS.filter((q) => F.isVisible(q, { targetArea: area }));
  F.AREAS[area].metrics.forEach((m) => {
    engineKeys.add(m.key);
    ok(asked.some((q) => q.id === m.key), area + ': metric input asked: ' + m.key);
  });
  const prefix = { modern_work: 'mw_', security: 'sec_', data_ai: 'dai_', digital_app: 'dapp_', infrastructure: 'infra_', business_apps: 'ba_' }[area];
  ok(asked.filter((q) => /^(mw|sec|dai|dapp|infra|ba)_/.test(q.id)).every((q) => q.id.startsWith(prefix)), area + ': no other area\'s metric questions leak in');
});
const engineSrc = read('assets/js/scoring.js');
QUESTIONS.filter((q) => q.type === 'number').forEach((q) => {
  ok(engineKeys.has(q.id) || engineSrc.includes('a.' + q.id) || engineSrc.includes('_' + q.id.split('_')[1] + '`]') , 'number question reaches the engine: ' + q.id);
});
['programStatus', 'designationsHeld', 'specializationsHeld', 'targetArea', 'goal12Mo', 'mw_association'].forEach((k) => ok(engineSrc.includes(k), 'select/checkbox answer read by engine: ' + k));
ok(read('assets/js/export.js').includes('hasBdm'), 'hasBdm answer reaches the export');
// Each input changes the score in the direction expected (wiring, not just presence).
Object.keys(F.AREAS).forEach((area) => {
  F.AREAS[area].metrics.forEach((m) => {
    const base = { targetArea: area, mw_association: 'csp', sec_sc500: '1', sec_sc200: '1', dai_az104: '1', dai_az305: '1', dapp_az104: '1', dapp_az305: '1', infra_az104: '1', infra_az305: '1' };
    const lo = F.calculatePCS(base).exact;
    const hi = F.calculatePCS(Object.assign({}, base, { [m.key]: '1' })).exact;
    ok(hi > lo, area + ': one more ' + m.key + ' raises the score');
  });
});
// Path lengths: the five-minute claim holds (no path over 21 questions).
function walk(answers) { return QUESTIONS.filter((q) => F.isVisible(q, answers)).length; }
Object.keys(F.AREAS).forEach((area) => {
  const short = walk({ programStatus: 'member', targetArea: area, goal12Mo: 'first_designation' });
  const long = walk({ programStatus: 'designated', targetArea: area, goal12Mo: 'frontier_spec', specializationsHeld: [] });
  ok(short >= 9 && short <= 13, area + ' short path ' + short + ' questions');
  ok(long <= 21, area + ' longest path ' + long + ' questions');
});
// Pruning cascades: switching area drops the old area's answers; holding Copilot hides the Copilot questions.
const pruned = plain(F.pruneAnswers(QUESTIONS, { programStatus: 'member', targetArea: 'security', mw_netAdds: '9', sec_netAdds: '2', goal12Mo: 'copilot_spec', cop_sc401: '5' }));
ok(!('mw_netAdds' in pruned) && pruned.sec_netAdds === '2', 'switching area drops stale answers');
ok(pruned.cop_sc401 === '5', 'Copilot readiness kept when goal asks for it');
const pruned2 = plain(F.pruneAnswers(QUESTIONS, { programStatus: 'member', designationsHeld: ['security'], specializationsHeld: ['copilot'], targetArea: 'security', goal12Mo: 'copilot_spec', cop_sc401: '5' }));
ok(!('designationsHeld' in pruned2) && !('specializationsHeld' in pruned2), 'non-designated partner drops designation answers');
const pruned3 = plain(F.pruneAnswers(QUESTIONS, { programStatus: 'designated', designationsHeld: ['security'], specializationsHeld: ['copilot'], targetArea: 'security', goal12Mo: 'copilot_spec', cop_sc401: '5' }));
ok(!('cop_sc401' in pruned3), 'Copilot holders are not asked Copilot readiness');

// ── E. Personas ─────────────────────────────────────────────────────────────
section.name = 'E personas';
const PERSONAS = require('./fixtures/frontier-navigator-personas.json');
PERSONAS.forEach((p) => {
  const s = F.summarize(plain(F.pruneAnswers(QUESTIONS, p.answers)));
  const e = p.expect;
  const tag = p.id + ' ' + p.name;
  if ('total' in e) eq(s.pcs.total, e.total, tag + ' total');
  if ('qualified' in e) eq(s.pcs.qualified, e.qualified, tag + ' qualified');
  if ('stage' in e) eq(s.stage, e.stage, tag + ' stage');
  if ('nextStage' in e) eq(s.nextStage.name, e.nextStage, tag + ' next stage');
  if ('priority' in e) eq(s.priority.label, e.priority, tag + ' priority');
  if ('zeroMetrics' in e) eq(JSON.stringify(s.pcs.metrics.filter((m) => m.zero).map((m) => m.id)), JSON.stringify(e.zeroMetrics), tag + ' zero metrics');
  if ('copilotReady' in e) eq(s.copilot.ready, e.copilotReady, tag + ' Copilot ready');
  if ('frontierMet' in e) eq(s.frontier.metCount, e.frontierMet, tag + ' Frontier checks met');
  const all = [].concat(s.gap.gaps, s.gap.actions, ...s.roadmap.map((b) => b.actions.concat(b.outcome)), s.priority.detail).join(' | ');
  (e.mentions || []).forEach((t) => ok(all.includes(t), tag + ' mentions "' + t + '"'));
  (e.never || []).forEach((t) => ok(!all.includes(t), tag + ' never says "' + t + '"'));
  ok(!/undefined|NaN/.test(all), tag + ' no undefined or NaN in copy');
});
ok(PERSONAS.length >= 12, 'at least 12 personas (' + PERSONAS.length + ')');

// ── F. Copy rules ───────────────────────────────────────────────────────────
section.name = 'F copy';
const files = ['index.html', 'pages/assessment.html', 'pages/results.html', 'pages/roadmap.html', 'pages/compare.html', 'pages/resources.html', 'pages/export.html',
  'assets/js/scoring.js', 'assets/js/app.js', 'assets/js/assessment.js', 'assets/js/results.js', 'assets/js/roadmap.js', 'assets/js/compare.js', 'assets/js/resources.js', 'assets/js/export.js',
  'data/questions.json', 'data/resources.json', 'README.md'];
const corpus = files.map((f) => [f, read(f)]);
const STALE = [/Action Pack/, /Copilot for Microsoft 365/, /\$500 per month/, /Second Designation/, /\+\$4,875/, /\$475/, /Elite path/, /MAICPP tier/i, /peerAverage|SMB peer average/, /benchmarks\.json/, /AZ-500\b(?![^"]*retired)/];
const UK = /\b(colour|organisation|organise|prioritise|optimise|recognise|analyse|behaviour|favour|licence|centre|catalogue|enrol(?!l)|programme|whilst|utilise|customise|minimise|maximise)\b/i;
const RIVALS = /\b(Pax8|Ingram Micro|Arrow Electronics|Crayon|Sherweb|rhipe|Dicker Data|Also Holding|Climb Global|Giacom)\b/i;
corpus.forEach(([f, txt]) => {
  STALE.forEach((re) => ok(!re.test(txt), f + ' has no stale claim ' + re));
  ok(!UK.test(txt), f + ' US English (' + (txt.match(UK) || [''])[0] + ')');
  ok(!RIVALS.test(txt), f + ' names no competitor');
});
ok(/MODEL_DATE = "October 12, 2026"/.test(engineSrc), 'model date recorded');

console.log(`\nfrontier-navigator: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
