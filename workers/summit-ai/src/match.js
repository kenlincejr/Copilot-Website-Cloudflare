/* Evidence scoring for "who should I meet / who can help with X" and for the common-ground brief.

   Every attendee is scored against what the asker needs (the subject of the question, and the topics the asker typed
   into their own profile). Each piece of evidence is weighted by where it came from, so what people say about
   themselves in the app outranks what we researched about them:

     5    topics they typed into their own profile in the app        (their own words, live)
     4    what a TD SYNNEX or Microsoft host owns                    (host card)
     3    what a host can help partners with, host conversation topics, their "ask me about" list
     2.5  a session they give at the summit, host focus areas
     2    their company's focus areas and conversation topics        (public research, partner cards)
     1.5  what their company does, industries, host role summary
     1    bio
   plus  +4 when TD SYNNEX suggested the two meet, +1.5 same state, +1 same customer segment.

   The model gets the ranked shortlist with the evidence and the rule that self-typed topics win ties. */

const STOP = new Set(('a an the and or but for with about that this what who whom which your you our ours are is was be can could would should will '
  + 'how want wants need needs help talk meet someone anyone people person here there into from have has where when them they their his her its '
  + 'more most best like know get find looking look also than then just very much many some any all one two three day days week summit event '
  + 'work works working team teams company companies partner partners business businesses customer customers do does did my me i we us it to of in on at by as '
  + 'same similar thing things first talk should focus focused interest interested topic topics question questions right good great new next go top whose '
  + 'microsoft td synnex tdsynnex msft').split(' '));
const PHRASES = [[/customer[\s-]+zero/g, 'customerzero'], [/zero[\s-]+trust/g, 'zerotrust'], [/power[\s-]+platform/g, 'powerplatform'],
  [/co[\s-]+sell/g, 'cosell'], [/modern[\s-]+work(place)?/g, 'modernwork'], [/microsoft[\s-]+365|\bm365\b|office[\s-]+365/g, 'm365'],
  [/small[\s-]+and[\s-]+mid[\s-]*(size|sized)?/g, 'smb'], [/mid[\s-]*market/g, 'midmarket'], [/ai[\s-]+pcs?/g, 'aipc']];
const GROUPS = [
  ['security', 'cybersecurity', 'secure', 'defender', 'sentinel', 'purview', 'zerotrust', 'identity', 'compliance', 'soc', 'threat', 'xdr', 'siem'],
  ['copilot', 'cowork'],
  ['ai', 'agent', 'agentic', 'genai', 'llm', 'automation'],
  ['azure', 'migration', 'migrate', 'modernization', 'modernize', 'hybrid', 'infrastructure', 'datacenter'],
  ['licensing', 'license', 'audit', 'spla'],
  ['csp', 'indirect', 'distribution', 'channel'],
  ['msp', 'managed', 'helpdesk', 'noc'],
  ['dynamic', 'powerplatform', 'crm', 'erp', 'bizapp'],
  ['device', 'pc', 'endpoint', 'windows', 'print', 'hardware', 'aipc'],
  ['data', 'analytic', 'fabric', 'bi', 'warehouse'],
  ['smb', 'small', 'midsize', 'midmarket'],
  ['governance', 'risk', 'policy'],
  ['training', 'enablement', 'skill', 'learning', 'workshop', 'lab'],
  ['funding', 'incentive', 'program', 'cosell', 'investment'],
  ['adoption', 'change', 'rollout', 'readiness'],
  ['practice', 'service', 'professional', 'delivery'],
  ['m365', 'modernwork', 'teams', 'sharepoint', 'exchange'],
];
const CONCEPT = new Map(); GROUPS.forEach((g, i) => g.forEach((w) => CONCEPT.set(w, 'g' + i)));
const stem = (w) => (w.length > 6 && w.endsWith('ing') ? w.slice(0, -3) : w.length > 5 && w.endsWith('ed') ? w.slice(0, -2) : w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w);

export function terms(text) {
  let t = String(text || '').toLowerCase();
  for (const [re, rep] of PHRASES) t = t.replace(re, ' ' + rep + ' ');
  const out = new Set();
  for (const raw of t.split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOP.has(raw)) continue;
    const w = stem(raw);
    if (w.length < 3 && !CONCEPT.has(w)) continue;
    out.add(CONCEPT.get(w) || CONCEPT.get(raw) || w);
  }
  return out;
}

const STATE = /,\s*([A-Z]{2})\b/;
const stateOf = (s) => { const m = STATE.exec(String(s || '')); return m ? m[1] : null; };

// The weighted fields of one person, each as {w, source, items:[text]}.
export function fields(p, ownTopics, speaking) {
  const pc = p.personCard || {}, cc = p.companyCard || {}, f = [];
  const add = (w, source, items) => { const list = (Array.isArray(items) ? items : [items]).filter(Boolean); if (list.length) f.push({ w, source, items: list }); };
  add(5, 'topics they typed into their own profile', ownTopics);
  add(4, 'what they own at ' + p.company, pc.owns);
  add(3, 'how they can help partners', pc.canHelpPartnersWith);
  add(3, 'their conversation topics', pc.conversationTopics);
  add(3, 'their "ask me about" list', p.askMeAbout);
  add(2.5, 'their summit session', speaking);
  add(2.5, 'their focus areas', pc.focusAreas);
  add(2, p.company + ' focus areas (public research)', cc.focusAreas);
  add(2, p.company + ' conversation topics (public research)', cc.conversationTopics);
  add(1.5, 'what ' + p.company + ' does (public research)', [cc.whatTheyDo, ...(cc.industries || [])]);
  add(1.5, 'their role', pc.whatTheyDo);
  add(1, 'their bio', p.bio);
  return f.map((x) => ({ ...x, terms: x.items.map(terms) }));
}

function scoreAgainst(need, fl, mult, ev) {
  // Only a person's three strongest fields count, so a long card cannot win on volume alone.
  const per = [];
  if (!need.size) return 0;
  for (const fd of fl) {
    let hits = 0;
    fd.items.forEach((item, i) => {
      const shared = [...fd.terms[i]].filter((t) => need.has(t));
      if (!shared.length) return;
      hits += shared.length;
      ev.push({ source: fd.source, text: String(item).slice(0, 110), w: fd.w * mult });
    });
    per.push(fd.w * Math.min(3, hits) * mult);
  }
  return per.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
}

/* rank({people, agenda, topicsMap, askerId, question}) -> [{id, name, company, group, score, evidence:[{source,text}]}] */
export function rank({ people, agenda, topicsMap, askerId, question, limit = 8 }) {
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const speakingOf = speakingIndex(agenda);
  const asker = askerId ? byId[askerId] : null;
  const needQ = terms(question);
  const needSelf = asker ? terms((topicsMap[asker.id] || []).join(' ')) : new Set();
  const needAsker = asker ? terms([...(asker.askMeAbout || []), ...((asker.companyCard || {}).focusAreas || []), ...((asker.personCard || {}).focusAreas || [])].join(' ')) : new Set();
  const out = [];
  for (const p of people) {
    if (asker && (p.id === asker.id || (p.company === asker.company && asker.group === 'Partners'))) continue;
    const fl = fields(p, topicsMap[p.id], speakingOf[p.id]);
    const ev = [];
    let s = scoreAgainst(needQ, fl, 1, ev);
    s += scoreAgainst(needSelf, fl, needQ.size ? 0.6 : 1.2, ev);          // what the asker typed about themselves
    if (!needQ.size) s += scoreAgainst(needAsker, fl, 0.8, ev);
    if (asker) {
      if ((asker.suggestedIntroductions || []).some((x) => x.id === p.id)) { s += 4; ev.push({ source: 'TD SYNNEX suggested you meet', text: (asker.suggestedIntroductions.find((x) => x.id === p.id) || {}).why || '', w: 4 }); }
      else if ((p.suggestedIntroductions || []).some((x) => x.id === asker.id)) { s += 2; ev.push({ source: 'TD SYNNEX suggested they meet you', text: '', w: 2 }); }
      const ac = asker.companyCard || {}, pcc = p.companyCard || {};
      const st = stateOf(ac.hq), st2 = stateOf(pcc.hq);
      if (st && st2 && st === st2) { s += 1.5; ev.push({ source: 'same state', text: `${ac.hq} and ${pcc.hq}`, w: 1.5 }); }
      const seg = (x) => terms([x.customerSize].flat().join(' '));
      const shared = [...seg(ac)].filter((t) => seg(pcc).has(t));
      if (shared.length) { s += 1; ev.push({ source: 'same customer segment', text: [pcc.customerSize].flat().join(', '), w: 1 }); }
    }
    // Open networking questions from a partner lead with peers; hosts still lead when the question names a need.
    if (!needQ.size && asker && asker.group === 'Partners' && p.group !== 'Partners') s *= 0.5;
    if (s > 0) {
      const seen = new Set();
      const evidence = ev.sort((a, b) => b.w - a.w).filter((e) => { const k = e.source + e.text; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4).map(({ source, text }) => ({ source, text }));
      out.push({ id: p.id, name: p.name, company: p.company, group: p.group, score: Math.round(s * 10) / 10, evidence });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function speakingIndex(agenda) {
  const idx = {};
  (agenda || []).forEach((d) => (d.sessions || []).forEach((s) => (s.speakers || []).forEach((x) => {
    if (x.id) (idx[x.id] = idx[x.id] || []).push(`${s.title}${s.details ? ': ' + s.details : ''}`);
  })));
  return idx;
}

/* overlap(a, b, ...) -> strongest shared evidence between two people, weighted by both sources, plus a match strength. */
export function overlap({ people, agenda, topicsMap, aId, bId, limit = 8 }) {
  const byId = Object.fromEntries(people.map((p) => [p.id, p])), sp = speakingIndex(agenda);
  const A = byId[aId], B = byId[bId];
  const fa = fields(A, topicsMap[aId], sp[aId]), fb = fields(B, topicsMap[bId], sp[bId]);
  const pairs = [];
  for (const x of fa) x.items.forEach((ia, i) => {
    for (const y of fb) y.items.forEach((ib, j) => {
      const shared = [...x.terms[i]].filter((t) => y.terms[j].has(t));
      if (shared.length) pairs.push({ w: (x.w + y.w) / 2 * Math.min(2, shared.length), you: { source: x.source.replace('their ', 'your '), text: String(ia).slice(0, 110) }, them: { source: y.source, text: String(ib).slice(0, 110) } });
    });
  });
  const seen = new Set();
  const top = pairs.sort((p, q) => q.w - p.w).filter((p) => { const k = p.you.text + '|' + p.them.text; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit);
  let bonus = 0;
  if ((A.suggestedIntroductions || []).some((x) => x.id === bId) || (B.suggestedIntroductions || []).some((x) => x.id === aId)) bonus += 3;
  const total = top.slice(0, 5).reduce((s, p) => s + p.w, 0) + bonus;
  const strength = total >= 18 ? 'Strong match' : total >= 9 ? 'Good match' : 'Worth a conversation';
  return { pairs: top.map((p) => ({ ...p, w: Math.round(p.w * 10) / 10 })), strength, score: Math.round(total * 10) / 10 };
}
