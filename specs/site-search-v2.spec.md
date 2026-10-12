# specs/site-search-v2.spec.md: Site search v2, AI answers and the playbook as a tool

**Status:** Draft 2026-10-12. Decisions in §2 are **proposed, not approved**. Each row carries a recommendation; Ken confirms or overrides before Phase A starts.

**Target (by phase, §4):**
- New shared files: `assets/site-search.js` (replaces `assets/site-search-jump.js`), `data/site-search-config.json`, `data/related.json`.
- New pages: `use-with-your-ai.html`, `ask.html`.
- `index.html`: the inline search script moves into the shared file; the search card gains the AI answer, suggested questions and filter chips.
- Every page in `sitemap.xml`: two new `<meta>` tags, and one script tag swapped (mechanical sweep, §2 D2).
- New Worker: `playbook-search-log`, with a D1 database `playbook_search`.
- Tooling: `tools/search-eval.py`, `tools/search-eval.json`, `tools/build-related.py`.
- Cloudflare dashboard: instance `copilotplaybook-site` settings (§5).

**Depends on:**
- The v1 build, live as of commit `dd1c7b8`: custom search box in `index.html`, `assets/site-search-jump.js?v=2` on every sitemap page, the meta title and description tags, and the DESIGN §8b.5 rule.
- [`DESIGN.md`](../DESIGN.md): §1 to §4, prohibitions §8, the §8b rules.
- The AI Search instance (memory: `ai-search-site-search`): public endpoint `https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/`, generation model `@cf/meta/llama-4-scout-17b-16e-instruct`, rate limit 30 requests per 60 seconds, authorized hosts `copilotplaybook.com` and `www.copilotplaybook.com`.

---

## 1. What v2 adds, and why

v1 finds pages. v2 answers questions, and lets the partner's own AI use the playbook.

| # | Feature | What the partner gets | Phase |
|---|---|---|---|
| F1 | AI answer on demand | A short answer with numbered sources above the results, from one click | B |
| F2 | Suggested questions | Four one-click starters under the search box | B |
| F3 | Filter chips | "Engagements only", "Calculators and tools", and so on | B |
| F4 | Relevance boosting | The main playbook pages outrank demos and app screens | B |
| F5 | Query rewriting and reranking | Vague, conversational questions find the right page | B, eval-gated |
| F6 | Search from every page | Ctrl+K (Cmd+K on Mac) or a launcher button opens search anywhere on the site | C |
| F7 | Ask about this page | A chat scoped to the one page the partner is reading | C |
| F8 | Related pages | "Read this next" at the foot of each page, picked by topic | C |
| F9 | The playbook in your AI | A page with copy-paste setup for connecting a partner's AI assistant to the playbook's MCP server | D |
| F10 | Full-page assistant | `ask.html`, a dedicated chat with history | D |
| F11 | Search analytics | Which questions partners ask, which find nothing, which results get clicked | D |

---

## 2. Decisions, proposed

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | Billing plan | (a) Stay on Workers Free; (b) Workers Paid, $5 a month | **(b), before November 1.** v2 multiplies queries per visit. On Free, Workers AI fails with an error once the 10,000-neuron daily allowance is used up. Whether AI Search queries also hard-stop on Free past 1,000 a month is unconfirmed (V1). Paid turns a broken feature into a small bill. Set a billing notification at $10 a month. |
| **D2** | Prohibition 9 ("one file per execution chat") | (a) One spec per file, about 40 specs; (b) mechanical sweeps run as one scripted change with a verifier | **(b), for the two sweeps only** (the meta tags in Phase A and the script-tag swap in Phase A). Each is a single regex-driven edit, verified by a script that asserts exactly one occurrence per page and a diff of exactly the expected lines. Every other change in this spec stays one file per execution. |
| **D3** | UI injected into other pages (F6 to F8) | (a) Plain DOM with site CSS; (b) Shadow DOM, self-contained styles | **(b).** Prohibition 6 forbids §1 to §4 leaking into `customer-zero-starter-kit/*` and `frontier-navigator/*`, and prohibition 2 forbids new classes in files that do not define them. A shadow root isolates the UI in both directions. Its stylesheet uses literal values copied from §1 tokens, recorded in §6 as the sign-off prohibition 7 requires. |
| **D4** | Where the launcher sits on pages other than home | (a) Bottom-right floating button; (b) inside each page's masthead | **(a).** Mastheads differ by system (C14 and the two separate systems), so (b) is a per-page edit. One floating button, bottom-right, 16px from the edges, labeled "Search" with a magnifier, opening a panel with two tabs: **Search the playbook** and **Ask about this page**. |
| **D5** | Ask about this page: which pages | (a) Every sitemap page; (b) a list | **(a), except** `index.html` (it has the site-wide chat bubble) and `frontier-navigator/pages/*` (tool screens, little prose). The exclusions live in `data/site-search-config.json`. |
| **D6** | AI answer trigger | (a) Automatic on every search; (b) a button | **(b).** An answer uses about 136 neurons and one semantic query (measured 2026-10-12: 4,841 prompt tokens, 227 completion tokens). On the free allowance that is about 70 answers a day across the whole site. A button keeps cost proportional to intent. |
| **D7** | Search analytics | (a) Skip; (b) log anonymous query text | **(b), with disclosure.** Partners may type customer names into search, so: no IP, user agent or cookies stored; query text truncated to 200 characters; 90-day retention enforced by a daily cron; a one-line note under the search box. |
| **D8** | Full-page assistant (F10) | (a) Cloudflare's `chat-page-snippet`; (b) build on the shared module | **(a) first.** It ships in an hour with conversation history. Move to (b) only if its source display has the same metadata problem v1 hit. |
| **D9** | Should `ask.html` and `use-with-your-ai.html` be in the sitemap | Sitemap or not | **`use-with-your-ai.html`: yes**, it is real content. **`ask.html`: no.** It is an empty chat shell that would pollute results. It also gets an exclude rule in the instance (§5) and an exception line in DESIGN §8b.5. |
| **D10** | Taxonomy for filters and boosting | Field values, §3.2 | **Approve the table in §3.2** or edit it. It drives F3 and F4. |

---

## 3. Shared architecture

### 3.1 One script, one config

`assets/site-search.js?v=3` replaces `assets/site-search-jump.js` on every sitemap page. It is one IIFE with no dependencies and no build step, in modules by function:

| Module | Job | Used by |
|---|---|---|
| `api` | `search(query, opts)` against `/search`; `chat(messages, opts)` streaming from `/chat/completions` | everything |
| `render` | results list, excerpt and highlight, AI answer, sources list | F1, F6, F7 |
| `jump` | the v1 `?hl=` scroll-and-highlight, unchanged in behavior | every page |
| `launcher` | the floating button, the Ctrl+K and Cmd+K shortcut, the panel and its two tabs (shadow DOM) | F6, F7 |
| `related` | reads `data/related.json` and renders "Read this next" (shadow DOM) | F8 |
| `log` | fire-and-forget `navigator.sendBeacon` to the log Worker | F11 |

`index.html` keeps its markup (the `site-search` card) and drops its inline script. The module mounts the inline UI into `#site-search` when that element exists, and the floating launcher everywhere else. On the home page, Ctrl+K focuses the inline box instead of opening a panel.

`data/site-search-config.json` holds everything editable without code:

```json
{
  "endpoint": "https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/",
  "logEndpoint": "https://playbook-search-log.<account>.workers.dev/",
  "suggested": [
    "What changes on December 1 for Copilot Business?",
    "How do I price a managed Copilot service?",
    "What does a Copilot Studio agent engagement include?",
    "How do I run Customer Zero in my own tenant?"
  ],
  "chips": ["all", "playbook", "engagement", "tool", "customer-zero", "program"],
  "pageAskExclude": ["/", "/index.html", "/frontier-navigator/pages/"],
  "maxPages": 6
}
```

The suggested questions are placeholders. Ken edits them; after Phase D they should come from the analytics top-queries report.

### 3.2 Custom metadata (Phase A)

AI Search allows five custom fields per instance (types `text`, `number`, `boolean`, `datetime`). Changing the schema triggers a full re-index. Two fields are used, leaving three spare:

| Field | Type | Meta tag | Used for |
|---|---|---|---|
| `page_type` | text | `<meta name="page_type" content="...">` | F3 filter chips (`$eq` / `$in`) |
| `priority` | number | `<meta name="priority" content="1">` to `3` | F4 boosting, `boost_by: [{ "field": "priority", "direction": "desc" }]` |

`priority` must be a number. Boosting on a `text` field only supports `exists` and `not_exists`.

Proposed values (D10):

| Page | page_type | priority |
|---|---|---|
| `cpb.html`, `cpb-build-belief.html`, `cpb-model-the-practice.html`, `cpb-run-the-engagement.html`, `cpb-earn-the-badge.html`, `copilot-token-economics.html` | playbook | 3 |
| `copilot-readiness-engagement.html`, `copilot-readiness-governance.html`, `copilot-studio-agent-engagement.html`, `copilot-adoption-audit.html`, `shadowai.html`, `agent-never-done.html`, `cpbops.html` | engagement | 3 |
| `copilot-credit-planner.html`, `cowork-calculator.html`, `azure-billing-setup.html` | tool | 2 |
| `customer-zero-starter-kit/*` (3 pages) | customer-zero | 2 |
| `frontier.html`, `copilot-specialization.html` | program | 2 |
| `cowork.html`, `CopilotApp.html`, `CopilotIB.html`, `coworksession40.html` | playbook | 2 |
| `frontier-navigator/index.html` | tool | 2 |
| `coworkdemo.html`, `frontier-navigator/pages/*` (6 pages), `index.html` | tool | 1 |
| `use-with-your-ai.html` (new, Phase D) | tool | 2 |

Chip labels on screen: All, Playbook, Engagements, Calculators and tools, Customer Zero, Partner program.

### 3.3 The API contract the module relies on

Verified against the live endpoint on 2026-10-12 unless marked V.

- **Search:** `POST /search`, body `{ "messages": [{ "role": "user", "content": q }], "ai_search_options": { "retrieval": { "max_num_results": 20, "filters": {...}, "boost_by": [...] } } }`. Response `result.chunks[]`, each with `text`, `score`, `item.key` (URL), `item.metadata.title` and `.description`.
- **Chat:** `POST /chat/completions`, body `{ "messages": [...], "stream": true, "ai_search_options": {...} }`. The SSE stream sends `event: chunks` first (the retrieved sources, same shape as search chunks), then OpenAI-format `chat.completion.chunk` deltas, then a final chunk whose `usage` carries `neurons`, then `data: [DONE]`.
- **Query rewrite (per request):** `ai_search_options.query_rewrite: { "enabled": true, "model": "...", "rewrite_prompt": "..." }`. This is the shape Cloudflare's own snippet sends.
- **Filters:** `ai_search_options.retrieval.filters`, Mongo-style operators `$eq $ne $in $nin $lt $lte $gt $gte`; multiple keys are ANDed. Only the first 64 bytes of a string field are filterable.
- **Boosting:** `ai_search_options.retrieval.boost_by`, up to three `{ field, direction }`. A per-request value fully replaces the instance default.
- **V2:** per-request reranking field name, and whether filters and boosting apply on `/chat/completions` as they do on `/search`.
- **V3:** whether a request can choose keyword-only mode, which would bill against the separate 1,000 full-text allowance at $0.10 per 1,000 instead of the semantic one at $0.75 per 1,000.

---

## 4. Build phases

Each phase ships on its own, is verified live, and can be reverted alone. A sweep (D2) is one commit with its verifier output in the commit message.

### Phase A: Foundation (no visible change)

1. **Eval harness.** `tools/search-eval.json` holds 25 queries, each with the page a partner should land on, written from the site's real content: five per page_type, plus five conversational ones. `tools/search-eval.py` runs them against `/search` and reports hit@1, hit@3 and mean reciprocal rank as a table. Record the baseline in this spec, §7. Cost: 25 semantic queries per run.
2. **Metadata sweep (D2).** Add `page_type` and `priority` meta tags per §3.2 to every sitemap page, right after the existing `og:description`. Verifier: exactly one of each per page, values match the table.
3. **Schema.** In the dashboard, add the two custom metadata fields. This triggers a full re-index, which should also clear the stale-title problem from v1 (verify: every result returns `metadata.title`).
4. **Module refactor.** Create `assets/site-search.js?v=3` containing the `api`, `render` and `jump` modules, moving the v1 inline code out of `index.html` unchanged in behavior. Swap the script tag on every sitemap page (sweep, D2). Delete `assets/site-search-jump.js` in the same commit.
5. **Gate:** the live home search behaves exactly as v1; the eval matches the baseline; every page still jumps on `?hl=`.

### Phase B: Better results on the home page

1. **F2 Suggested questions.** Four chips under the search box from config. Clicking one fills the box and runs the search.
2. **F3 Filter chips.** A chip row between the box and the results, "All" selected. Choosing a chip re-runs the current query with `filters: { "page_type": value }`. The chip state stays in the URL hash (`#search=...&type=...`) so a filtered search can be shared.
3. **F4 Boosting.** Send `boost_by: [{ "field": "priority", "direction": "desc" }]` on every search. Gate: eval hit@3 must not drop.
4. **F5 Query rewrite and reranking.** Run the eval three ways: as is, with rewrite, with reranking. Keep each only if hit@3 improves by at least two queries out of 25. Rewrite applies only when the query is four or more words (a model call per search is wasted on "cowork calculator"). Record results in §7.
5. **F1 AI answer.** After results render, a button: **Get an AI answer**. On click:
   - Stream `/chat/completions` with the same query and filter into a panel above the results.
   - Render a strict Markdown subset: paragraphs, `**bold**`, bullet lists, and links. Escape everything else. Allow a link only if it points to `copilotplaybook.com` or is relative. Never use `innerHTML` on model text before escaping.
   - Build the sources list from the `event: chunks` payload: deduplicated by page, numbered, each linked with `?hl=` exactly as the results are.
   - Footer line: "AI-generated from the pages listed. Confirm pricing and licensing with Microsoft before quoting a customer."
   - A **Copy answer** button, and thumbs up or down, which log to F11 once Phase D lands.
   - One answer per query; the button hides until the query changes.
   - On error or rate limit: "The assistant is busy right now. The results below are still current."
6. **Gate:** all eval runs recorded; the AI answer tested with the 25 eval queries for groundedness. Every claim must trace to a listed source. Any answer quoting a competitor name or a Customer Zero raw count is a fail that blocks release.

### Phase C: Search and ask everywhere

1. **F6 Launcher and Ctrl+K.** The floating button (D4), the shortcut (Ctrl+K and Cmd+K; also `/` when focus is not in a text field), and a panel in a shadow root. The Search tab is the same UI as the home page: box, chips, results, AI answer. Esc closes it, as do a click on the backdrop or the close button. Focus is trapped while it is open and returns to the trigger when it closes.
2. **F7 Ask about this page.** The second tab, on pages not excluded by D5. Chat via `/chat/completions` with `filters: { "filename": "<this file>", "folder": "<this folder>" }`. Built-in fields, so no schema change (gated on V2). The header names the page: "Questions about *The Meter Conversation*". Three suggested questions generated from the page's own H2 headings, for example "Explain: The Customer's New Problem". History lives in memory only and is not stored.
3. **F8 Related pages.**
   - `tools/build-related.py` queries `/search` once per sitemap page, using that page's title and description with `metadata_only`, drops the page itself, and keeps the top three distinct pages, preferring a different `page_type` for at least one.
   - It writes `data/related.json`. That is 34 queries per run; run it when the sitemap changes, not on every deploy.
   - The module renders "Read this next" as a three-card row (DESIGN §8b.3: three, never four) in a shadow root. It is inserted before the page's last `<footer>`, or at the end of `<main>` if there is no footer.
4. **Gate:** checked at 375px and desktop on one page from each system (a C14 page, `customer-zero-starter-kit/index.html`, `frontier-navigator/index.html`). No style leaks in either direction, verified by computed-style checks on host elements before and after the panel opens.

### Phase D: The playbook as a tool, and learning from use

1. **F9 `use-with-your-ai.html`.** Built from §3 catalog snippets. Content:
   - What MCP is, in two sentences.
   - The MCP server URL with a copy button.
   - Setup blocks for Claude Desktop and claude.ai connectors, VS Code with GitHub Copilot, Cursor, and Copilot Studio. Each is verified against its vendor's current docs at build time; do not ship a block that was not tested.
   - The one tool exposed (`search`).
   - A "try asking your assistant" list.
   - A note that the server is public and read-only.

   Add the page to the sitemap with meta tags (DESIGN §8b.5), and link it from the search card ("Use the playbook in your own AI assistant"). In the dashboard, make the MCP tool description name the page types and the Copilot practice topics.
2. **F10 `ask.html`.** `chat-page-snippet` (D8), themed with the v1 `--search-snippet-*` variables, page masthead C14. It is kept out of the sitemap and the instance gets exclude rule `/ask.html` (D9). Link it from the search card and the launcher panel ("Open the full assistant").
3. **F11 Analytics Worker.**
   - `playbook-search-log`, with D1 `playbook_search`, a single table `events(ts, kind, q, filter, n_results, url, rank, page)`.
   - Endpoints: `POST /e` (batched events from `sendBeacon`).
   - Origin must be `copilotplaybook.com` or `www`. Workers rate-limit binding at 60 events per minute per client, keyed in memory only. Nothing about the client is stored (D7). A daily cron deletes rows older than 90 days.
   - Event kinds: `search`, `zero` (no results), `click` (with rank), `answer`, `vote`, `ask_page`.
   - Disclosure under the search box: "Searches are logged without any personal details to improve the playbook."
   - **Report:** `tools/search-report.sql` with top queries, zero-result queries, low click-through queries and pages never clicked, run with:

     ```powershell
     npx wrangler d1 execute playbook_search --remote --file tools/search-report.sql
     ```

---

## 5. Dashboard changes (instance `copilotplaybook-site`)

| When | Setting | Change |
|---|---|---|
| A3 | Custom metadata | Add `page_type` (text), `priority` (number). Full re-index follows. |
| B4 | Query rewrite, reranking | Leave the instance defaults off; v2 applies them per request, gated by eval (§4 B4). |
| D1 | Public endpoint, MCP tool description | Rewrite to name the page types and topics. |
| D2 | Path filters | Add exclude `/ask.html`. |
| D3 | Rate limit | Revisit after two weeks of analytics; 30 per minute may be too low once every page has search. |
| D1 (billing) | Account billing | Workers Paid and a $10 a month billing notification, if D1 is approved. |

---

## 6. Design sign-offs required by prohibition 7

| Element | Not in the §3 catalog because | Built from |
|---|---|---|
| Launcher button and panel | No floating UI exists on the site | Shadow-DOM stylesheet using literal §1 values: `--teal`, `--teal-light`, `--navy`, `--line`, `--soft`, `--radius`, `--shadow-sm`, `--shadow-md`, and the §2 font stack. No new colors (prohibition 1). |
| AI answer panel | New component | The C1 callout's border and background treatment; C8b for the sources line. |
| Filter and suggestion chips | New component | The v1 `.site-search` button styling at chip size, on the §2.2 type scale. |
| Related pages row | Close to C5 grid cards | C5 in a shadow root, three across, stacked at 640px. |

---

## 7. Verification log (filled in during execution)

| Run | hit@1 | hit@3 | MRR | Notes |
|---|---|---|---|---|
| Baseline (A1) | | | | |
| + boosting (B3) | | | | |
| + rewrite (B4) | | | | |
| + rerank (B4) | | | | |

Verification items to close before the phase that needs them:

| ID | Question | Needed by |
|---|---|---|
| V1 | On Workers Free after November 1, does AI Search stop or bill past the included queries? | D1, before Phase B |
| V2 | Per-request reranking field; do filters and boosting apply on `/chat/completions`? | B4, C2 |
| V3 | Can a request force keyword-only mode? | Phase B cost plan |
| V4 | Does the schema re-index refresh stale titles from v1? | A3 |
| V5 | Current MCP setup steps for each client in F9 | D1 |

---

## 8. Cost model

Per action, measured or from Cloudflare's published rates:

| Action | Semantic queries | Neurons |
|---|---|---|
| A search (home or launcher) | 1 | 0, or a small amount with rewrite |
| An AI answer | 1 | about 136 |
| An Ask-about-this-page turn | 1 | about 136 |
| Related pages rebuild | 34 per run | 0 |
| Eval run | 25 per run | 0, or small with rewrite |

Included each month: 1,000 semantic queries, 1,000 full-text queries, and 10,000 neurons a day (about 300,000 a month). Past that, on Paid: $0.75 per 1,000 semantic queries and $0.011 per 1,000 neurons. At 3,000 searches and 1,000 AI answers in a month, the overage is about $1.50 in queries plus about $1 in neurons. The real risk is a hard stop on Free (D1), not the bill.

---

## 9. Out of scope, flagged

| Item | Why |
|---|---|
| Proxying search through our own Worker | Would hide the endpoint and allow per-user quotas. Revisit if the rate limit or abuse becomes a problem. |
| Authenticated or partner-only content | Needs Cloudflare Access and a second instance. A separate decision. |
| Multi-language answers | No demand signal yet; F11 will show it. |
| Image search over diagrams | Supported by AI Search, but the site's diagrams are SVG and text, already indexed as text. |
| Replacing the home-page chat bubble with the launcher | Keep both until analytics show which partners use. |
