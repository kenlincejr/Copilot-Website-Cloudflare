# specs/CopilotIB-urlfix.spec.md

**Target file:** `CopilotIB.html` (1,113 lines, 68 KB)
**Branch:** `refresh/copilot-ib`
**Authored:** 2026-08-27, correctness pass
**Depends on:** [`DESIGN.md`](../DESIGN.md)

---

## Why this spec exists, and why it is narrow

`CopilotIB.html` is built on a premise that is now **false**.

Section 2 — *"The URL Problem: Why It's There and Why It Doesn't Work"* — asserts that a URL added to an agent's Knowledge section is *"never fetched, never parsed, and never embedded"* and *"ignored entirely."* Microsoft now documents public website URLs as a supported knowledge source in Agent Builder: **up to four per agent**, grounded live through **Grounding with Bing Search**.

The document's nuance was always right — URLs are not *pre-indexed*. Its conclusion is wrong. As written, the page tells practitioners not to configure a capability that works.

**This spec is a correctness pass only.** It does not re-architect the document, add the missing limits/security/governance sections, or restructure the source table — that is the follow-on spec. It removes the false claim from all six places it is asserted and replaces it with the documented rules. Nothing else.

**Scope note.** The same claim is restated on `landing.html:1251`. That is a separate file and therefore a separate spec (`DESIGN.md` §8.9). Both must merge together or the site contradicts itself.

`CopilotIB.html` is a **class-first file** (34 inline styles / 335 classes). Every change below reuses a class the file already defines. **No new class, token, colour, size, radius or shadow is introduced.**

---

## Execution prompt

> You are applying `specs/CopilotIB-urlfix.spec.md` to `CopilotIB.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report**.
> - For each change: locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim. Do not improve, reword, reformat, or restyle anything.
> - If a `BEFORE` string does not match, or matches more than once: **skip and report.**
> - Do not introduce any colour, font, size, radius, or shadow not in `DESIGN.md`. This is a class-first file — do not add inline styles.
> - Commit per change, message = change ID + one line.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **8** |
| LOW risk | 2 |
| MED risk | 5 |
| HIGH risk | **1** (IB-02) |
| Sections replaced | 0 (§2 is corrected in place, not re-spined) |
| New CSS classes | **0** |
| New tokens / colours | **0** |
| Files written | **1** |

**Invariant budget.** Section count stays at 8. `id="section-N"` anchors are untouched — **no renumbering in this spec**. TOC is untouched. If `git diff --stat` shows any change to a `<h2 id=` line or to `<nav id="toc">`, **stop**.

**Read these two properly:** IB-02 (the toggle table — the load-bearing correction) and IB-04 (the Practitioner's Trap, which is re-aimed rather than deleted). The other six follow from them.

---

### IB-01 · Retitle Section 2 and reframe its premise
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** MED
**Rationale:** The title states the false conclusion. "It Doesn't Work" is the claim being retracted.
**Design:** `<h2>` text only; `id="section-2"` preserved byte-for-byte so no anchor moves.

```html before:IB-01
<h2 id="section-2">The URL Problem: Why It's There and Why It Doesn't Work</h2>

<p>The URL input field in the Knowledge section is one of the most misunderstood elements of the personal agent builder. It looks like it should allow the agent to draw on web content. It does not — at least not in the way practitioners expect.</p>
```
```html after:IB-01
<h2 id="section-2">Website URLs: A Real Source, With Narrow Rules</h2>

<p>The URL input field in the Knowledge section is one of the most misunderstood elements of the agent builder — and the most commonly written-off. Public website URLs <em>are</em> a supported knowledge source. What trips practitioners up is that they behave nothing like an uploaded file: the content is never pre-indexed, it is fetched live at query time through Bing, and almost every way it fails, it fails silently.</p>
```

---

### IB-02 · Replace the toggle table with the documented rules
**Type:** text-rewrite · **Claim IDs:** `B-014`, `B-015` · **Risk:** **HIGH**
**Rationale:** This table is the false claim in its most quotable form — *"completely inaccessible to the agent at query time."* It is the single most consequential correction in the revision.
**Design:** Same `<table>` element, same `td-navy` cells. `DESIGN.md` C9 — the element selectors handle styling; nothing is restyled.

```html before:IB-02
    <tr><td class="td-navy">Search all websites: OFF</td><td>The URL is stored as a text string reference only. The agent does not fetch the URL, does not parse the page content, and does not index anything from it. The URL may surface as a citation hint, but the content at that address is <strong>completely inaccessible</strong> to the agent at query time.</td></tr>
    <tr><td class="td-navy">Search all websites: ON</td><td>The URL <em>may</em> be used to scope or bias web search results — functioning closer to a domain filter than a content source. The content at that specific URL is still not pre-indexed. The agent retrieves it live during a search, not from a stored index.</td></tr>
```
```html after:IB-02
    <tr><td class="td-navy">Added as a public website source</td><td>A supported knowledge source. At query time the agent issues a Bing search scoped to that site and grounds its answer in what comes back. The content is <strong>never pre-indexed</strong> — there is no stored copy, so an answer is only as good as what Bing currently holds for that page.</td></tr>
    <tr><td class="td-navy">"Search all websites" ON</td><td>Widens retrieval to the open web rather than your named sites. Use it with instruction block rules that name the sources you trust, or the agent may ground in whatever ranks well that day.</td></tr>
```

---

### IB-03 · Replace "Why the Field Exists Despite These Limitations" with the actual constraints
**Type:** text-rewrite · **Claim IDs:** `B-015` · **Risk:** MED
**Rationale:** All four bullets rationalise a limitation that does not exist. The "future capability surface" bullet in particular is now simply wrong — the capability shipped.
**Design:** Same `<h3>` + `<ul>` structure.

```html before:IB-03
<h3>Why the Field Exists Despite These Limitations</h3>
<ul>
  <li><strong>Domain scoping for web search:</strong> When "Search all websites" is enabled, a URL entered here tells the search to prefer results from that domain. It functions as a hint, not a guarantee.</li>
  <li><strong>Explicit source limiting:</strong> The "Only use specified sources" toggle, combined with URLs and the web search toggle, attempts to restrict web search to those specific sites — but requires both toggles active and is less reliable than instruction block control.</li>
  <li><strong>Future capability surface:</strong> The field exists in anticipation of deeper URL crawling features. The UI component is there; the full indexing pipeline for arbitrary URLs is not yet generally available in the personal agent builder.</li>
  <li><strong>Reference metadata:</strong> For audit and transparency purposes, connected URLs appear in the knowledge panel so builders can see what sources are referenced — even if the content isn't indexed.</li>
</ul>
```
```html after:IB-03
<h3>The Rules a URL Must Satisfy</h3>
<p>A URL that breaks any of the following is not rejected at configuration time. It is accepted, displayed in the knowledge panel, and silently returns nothing.</p>
<ul>
  <li><strong>Four URLs maximum</strong> per agent.</li>
  <li><strong>Two path levels, maximum.</strong> <code>example.org/a/b</code> is valid; <code>example.org/a/b/c</code> is not. A trailing slash is allowed.</li>
  <li><strong>No query parameters.</strong> <code>example.org?id=1</code> is invalid.</li>
  <li><strong>Must be public and indexed by Bing.</strong> Anything behind authentication is out — which rules out SharePoint sites and internal wikis. Use the SharePoint source for those instead.</li>
  <li><strong>Redirects to another top-level site break it.</strong> If <code>fabrikam.com</code> redirects to <code>contoso.fabrikam.com</code>, the agent grounds in neither.</li>
  <li><strong>Subdomain scope is not what most people expect.</strong> <code>fabrikam.com</code> covers <code>www.</code> and <code>news.</code>; <code>www.fabrikam.com</code> covers neither. Entering the bare domain is almost always what you want.</li>
</ul>
```

---

### IB-04 · Re-aim the Practitioner's Trap at the real failure mode
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** MED
**Rationale:** The trap described is now the retracted myth. The *real* trap is better and more useful: the failures are silent, so a misconfigured URL and a working one look identical in the builder.
**Design:** `callout warn` preserved. `DESIGN.md` §4 — amber is for caution and risk, which this remains.

```html before:IB-04
  <div class="callout-body">A builder adds a URL for their product documentation site, tests the agent, and gets accurate answers. They assume the agent is reading the site. It isn't. It's drawing on its <strong>training knowledge</strong> about the product. When the documentation changes, the agent continues returning the old answer — confidently and with no indication that its source is stale.<br><br>
  This is the most dangerous failure mode: an agent that <em>appears</em> correct but is grounded in training data rather than current documentation. The fix is not more URLs — it is uploaded documents, a connected SharePoint library, or explicit web search triggered by the instruction block.</div>
```
```html after:IB-04
  <div class="callout-body">A builder adds a documentation URL three levels deep, tests the agent, and gets a confident, accurate-sounding answer. They conclude the source is working. It is not — the URL exceeded the two-level limit and was never queried. The answer came from the model's <strong>training knowledge</strong>, and it will keep coming from there after the documentation changes.<br><br>
  This is the failure mode to design against: <em>a correctly-rejected source and a working source produce identical-looking output.</em> Nothing in the builder flags the difference. The only reliable check is to ask the agent something that is answerable <strong>only</strong> from that page and nowhere in general knowledge — see Section 8 on forcing citations, which makes this visible in every response.</div>
```

---

### IB-05 · Correct the "Does Not Work" example
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** MED
**Rationale:** `learn.microsoft.com/azure/pricing` is now a *valid* two-level public URL. The example teaches the opposite of the truth.
**Design:** `callout red` / `callout green` pair preserved; only the red body changes.

```html before:IB-05
    <div class="callout-body">Adding a URL expecting the agent to "know" its content.<br><br>
    <em>Example: Pasting <code>https://learn.microsoft.com/azure/pricing</code> into Knowledge expecting current Azure pricing.</em><br><br>
    <strong>What happens:</strong> The agent uses training knowledge, which may be months old. The URL is ignored entirely.</div>
```
```html after:IB-05
    <div class="callout-body">Adding a deep link and expecting it to be read.<br><br>
    <em>Example: Pasting <code>https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/overview</code> — four levels deep — into Knowledge.</em><br><br>
    <strong>What happens:</strong> The URL is accepted and displayed, but exceeds the two-level limit, so it is never queried. The agent answers from training knowledge with no indication the source was skipped.</div>
```

---

### IB-06 · Correct the Section 1 "Critical" assertion
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** MED
**Rationale:** Section 1 states the false claim before the reader reaches Section 2. Correcting §2 alone leaves the page contradicting itself.

```html before:IB-06
  <strong>Critical:</strong> A URL string added to the Knowledge section is <em>never fetched, never parsed, and never embedded</em>. The URL text itself may be stored as metadata, but the content at that address does not enter the index.</div>
```
```html after:IB-06
  <strong>Critical:</strong> A URL added to the Knowledge section is <em>never embedded into this index</em>. It is a live retrieval instruction, not stored content — at query time the agent searches that site through Bing. Everything in this section about chunking and embedding applies to uploaded files and SharePoint content; it does not apply to website sources.</div>
```

---

### IB-07 · Correct the two URL rows in the master source table
**Type:** value-swap · **Claim IDs:** `B-014` · **Risk:** LOW
**Rationale:** The table grades URL sources `None` reliability and `no content retrieved`. Both are now wrong.
**Design:** Existing `.badge` classes reused exactly — `badge-n`, `badge-m`, `badge-y` all already defined at `CopilotIB.html:554-557`.

```html before:IB-07
    <tr><td class="td-navy">URL (web search OFF)</td><td><span class="badge badge-n">No</span></td><td><span class="badge badge-n">No</span></td><td><span class="badge badge-n">None</span></td><td>Reference metadata only — no content retrieved</td><td>N/A</td></tr>
    <tr><td class="td-navy">URL (web search ON)</td><td><span class="badge badge-n">No</span></td><td><span class="badge badge-m">Partial</span></td><td><span class="badge badge-m">Medium</span></td><td>Domain-scoped live search; not pre-indexed</td><td><span class="td-teal">YES — required</span></td></tr>
```
```html after:IB-07
    <tr><td class="td-navy">Public website URL</td><td><span class="badge badge-n">No</span></td><td><span class="badge badge-y">Yes — live</span></td><td><span class="badge badge-m">Medium</span></td><td>Live Bing-grounded retrieval from a named site; max 4, two path levels, public only</td><td>Recommended</td></tr>
    <tr><td class="td-navy">Open web ("Search all websites")</td><td><span class="badge badge-n">No</span></td><td><span class="badge badge-y">Yes — live</span></td><td><span class="badge badge-m">Variable</span></td><td>Unscoped Bing search; quality depends on what ranks that day</td><td><span class="td-teal">YES — required</span></td></tr>
```

---

### IB-08 · Correct the decision-tree entry
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** LOW
**Rationale:** *"That URL does nothing"* is the false claim in its shortest form, and it sits in the summary a hurried reader is most likely to read.

```html before:IB-08
<div class="callout warn" style="margin:8px 0"><div class="callout-body"><strong>Did you paste a URL into the Knowledge section?</strong><br>→ That URL does nothing unless the web search toggle is ON and you have instruction block trigger rules. Consider uploading the content as a document instead.</div></div>
```
```html after:IB-08
<div class="callout warn" style="margin:8px 0"><div class="callout-body"><strong>Did you paste a URL into the Knowledge section?</strong><br>→ It works, but only if it is public, Bing-indexed, no more than two path levels deep, and free of query parameters. If any of those fail it is accepted and silently ignored — see Section 2. For anything behind authentication, upload the document or connect SharePoint instead.</div></div>
```

---

## Out of scope — flagged, not changed

| Item | Why it is not in this spec |
|---|---|
| Section 3, the three-tier priority stack | Invented, and slated for **deletion** in the follow-on spec. Deleting it here would leave a hole in a document that is otherwise only being corrected. |
| The "Sanctioned Source List" table (§5) | Unsourceable ★/◑ reliability ratings. Follow-on spec. |
| Instruction block patterns 3 and 4 (§6) | To be cut in the follow-on spec. Still correct as written, just off-topic. |
| The 2,048-character Bing query cap | A Copilot Studio behaviour. Belongs in the rewritten §2 with a product-boundary marker, not bolted onto a correction pass. |
| Hard limits, security/sharing, governance, billing, testing sections | The four net-new sections. Follow-on spec. |
| `Classification: TD SYNNEX Internal — Confidential` in the header | Removed in the follow-on spec alongside the last-updated stamp, so the header is edited once rather than twice. |
| `landing.html:1251` | Different file. Separate spec, merged in the same window. |
