/* Builds the grounding files for the "Ask the Summit" Worker from the guide's own content.
   Everything written to workers/summit-ai/data/ is already public in the guide (agenda, places, info, the attendee directory).
   Private partner cards (workers/summit-ai/private/partner-cards.json, git-ignored) are matched to companies and only
   cards marked approved:true are included.   node tools/build-ai-data.js            (from the repo root) */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'executive-summit.html'), 'utf8');
const a = page.indexOf('const EVENT = {'), pStart = page.indexOf('const PEOPLE = [');
const pEnd = page.indexOf('\n];', pStart) + 3;
if (a < 0 || pStart < 0) throw new Error('content block not found');
const C = new Function(page.slice(a, pEnd) + '\nreturn { EVENT, GROUPS, TOPICS, AGENDA, INFO, PLACES, PEOPLE };')();
const byId = Object.fromEntries(C.PEOPLE.map((p) => [p.id, p]));
const hm = (m) => { const h = Math.floor(m / 60); return (h % 12 || 12) + ':' + String(m % 60).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM'); };
const t = (s) => (s ? (+s.slice(0, 2) % 12 || 12) + ':' + s.slice(3) + (+s.slice(0, 2) >= 12 ? ' PM' : ' AM') : null);
const hrs = (h) => (h ? h.map(([x, y]) => hm(x) + ' to ' + hm(y)).join(' and ') : null);

const out = {};
out.event = { name: C.EVENT.name, venue: C.EVENT.venue, when: C.EVENT.when, timezone: 'Hawaii time (HST, UTC-10)' };
out.agenda = C.AGENDA.map((d, di) => ({
  day: di, label: d.long, title: d.title, summary: d.blurb, dress: d.dress || null, note: d.note || null,
  sessions: d.sessions.map((s) => ({
    title: s.title, when: s.allDay ? 'All day' : s.time || (t(s.start) + (s.end ? ' to ' + t(s.end) : '')), where: s.where || null, placeId: s.at || null,
    kind: s.kind || null, details: s.desc || null, speakers: (s.speakers || []).map((id) => (byId[id] ? { id, name: byId[id].n } : null)).filter(Boolean).concat(s.by ? [{ name: s.by }] : []),
  })),
}));
out.places = C.PLACES.map((p) => ({ id: p.id, name: p.name, map: p.map === 3 ? 'inside the hotel' : 'resort map', type: p.kind, summary: p.sub, details: p.desc, hours: hrs(p.hrs) || (p.venues ? p.venues.map((v) => v.n + ': ' + hrs(v.hrs) + (v.note ? ' (' + v.note + ')' : '')).join('; ') : null) }));
out.info = C.INFO.map((i) => ({ title: i.title, text: i.body.map((b) => b.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')).join(' ') }));

// Partner cards (private, approved only), matched to attendee companies.
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
let cards = [];
try { cards = JSON.parse(fs.readFileSync(path.join(ROOT, 'workers/summit-ai/private/partner-cards.json'), 'utf8')).filter((c) => c.approved === true); } catch (e) { /* none yet */ }
const cardFor = (company) => { const n = norm(company); return cards.find((c) => { const m = norm(c.company); return n && m && (m.startsWith(n) || n.startsWith(m)); }); };
// The public people file never holds cards (the repo is public). Matched cards go to private/company-cards.json
// (git-ignored), keyed by person id, and the Worker merges them in when it is deployed from this machine.
const used = new Set(), privateCards = {};
out.people = C.PEOPLE.map((p) => {
  const card = cardFor(p.c);
  if (card) { used.add(card.company); privateCards[p.id] = { whatTheyDo: card.whatTheyDo, focusAreas: card.focusAreas, conversationTopics: card.talkingPoints }; }
  return {
    id: p.id, name: p.n, title: p.t, company: p.c, group: C.GROUPS[p.g].short, bio: p.b, askMeAbout: p.ask || [],
    suggestedIntroductions: (p.meet || []).map(([id, why]) => (byId[id] ? { id, name: byId[id].n, why } : null)).filter(Boolean),
  };
});
fs.writeFileSync(path.join(ROOT, 'workers/summit-ai/private/company-cards.json'), JSON.stringify(privateCards));
// Person cards for the Microsoft and TD SYNNEX hosts (private/host-cards.json, git-ignored, approved only): what each
// person owns and wants to talk about, from public sources or from the people themselves. Merged in by the Worker.
let hosts = [];
try { hosts = JSON.parse(fs.readFileSync(path.join(ROOT, 'workers/summit-ai/private/host-cards.json'), 'utf8')).filter((h) => h.approved === true && byId[h.id]); } catch (e) { /* none yet */ }
const personCards = Object.fromEntries(hosts.map((h) => [h.id, {
  whatTheyDo: h.whatTheyDo, owns: h.owns || [], focusAreas: h.focusAreas || [], conversationTopics: h.conversationTopics || [],
  canHelpPartnersWith: h.canHelpPartnersWith || [], publicHighlights: (h.publicHighlights || []).map((x) => (typeof x === 'string' ? x : x.text)).filter(Boolean),
}]));
fs.writeFileSync(path.join(ROOT, 'workers/summit-ai/private/person-cards.json'), JSON.stringify(personCards));
// Resort and area guide: researched from public sources into workers/summit-ai/research/resort-research.json (reviewed by Ken).
// Source URLs are dropped to save tokens; anything not verified is flagged so the assistant tells people to confirm it.
const slim = (v) => {
  if (Array.isArray(v)) return v.map(slim);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { if (k === 'source' || k === 'verified') continue; if (x !== null && x !== '') o[k] = slim(x); }
    if (v.verified === false) o.unverified = true;
    return o;
  }
  return v;
};
try { out.resort = slim(JSON.parse(fs.readFileSync(path.join(ROOT, 'workers/summit-ai/research/resort-research.json'), 'utf8'))); }
catch (e) { out.resort = { note: 'Resort and area guide not loaded.' }; }
for (const [k, v] of Object.entries(out)) fs.writeFileSync(path.join(ROOT, 'workers/summit-ai/data/' + k + '.json'), JSON.stringify(v));
const total = Object.values(out).map((v) => JSON.stringify(v).length).reduce((x, y) => x + y, 0) + JSON.stringify(privateCards).length + JSON.stringify(personCards).length;
console.log('people', out.people.length, '| places', out.places.length, '| agenda days', out.agenda.length, '| info items', out.info.length);
console.log('approved cards loaded:', cards.length, '| matched to companies:', used.size, '| attendees with a card:', Object.keys(privateCards).length, '| unmatched approved:', cards.filter((c) => !used.has(c.company)).map((c) => c.company));
console.log('person cards loaded:', Object.keys(personCards).length, Object.keys(personCards).join(', '));
console.log('grounding size:', total, 'characters (about', Math.round(total / 4), 'tokens)');
