# specs/site-search-v2.1-hero-pill.spec.md: Home search becomes a hero pill

**Status:** Approved 2026-10-12. Ken: the home search card "takes up a lot of real estate"; the chat explanation repeats what the corner chat icon already says; the AI-assistant link reads as plain text and looks like a promise the site does not keep. Option chosen: replace the card with a one-row search pill in the hero that opens the site-wide search panel.

**Target:**
- [`index.html`](../index.html): remove the `#site-search` card and its CSS; add the pill to the hero; add two footer links.
- [`assets/site-search.js`](../assets/site-search.js): the home page uses the same launcher panel as every other page; the inline-card mount is retired; panel footer links.
- [`tools/test-site-search.js`](../tools/test-site-search.js): tests follow the behavior.
- `?v=` bump on every page via `tools/bump-search-version.py`.

**Depends on:** [`site-search-v2.spec.md`](./site-search-v2.spec.md) (Phases A to D, live at `60a4bed`); DESIGN §1 to §4, §8, §8b.

---

## 1. What changes

| Before | After |
|---|---|
| A card under the hero: kicker, heading, explanation, input and button, a "Try:" line, a chat paragraph, a logging note. About 250px tall. | One search pill inside the hero, right above the "Start here" strip. Text "Search the playbook…" and a `Ctrl K` hint (`⌘K` on Mac). About 44px tall, inside space the hero already uses. |
| Results render inline and push the page down. | The pill opens the site-wide panel (the same dialog, shadow DOM, tabs, AI answer as every other page). The home page layout never moves. |
| "Try:" line always visible. | Shown inside the panel's Search tab only while the box is empty. |
| Chat explanation paragraph. | Removed. The corner chat bubble stays as it is. |
| "Use the playbook in your own AI assistant" styled as body text. | A real link in the panel footer, next to "Open the full assistant", and in the home page footer. |
| Logging notice under the box. | Panel footer only (already there). |

## 2. Behavior

1. **The pill** is a `<button>` styled as an input (`aria-haspopup="dialog"`, accessible name "Search the playbook"). Clicking it, pressing Enter or Space on it, Ctrl+K, Cmd+K, or `/` opens the panel on the Search tab with focus in the box. Closing returns focus to the pill.
2. **Home page tabs:** the home page has no "Ask about this page" tab (D5 still excludes it); the panel shows the Search tab alone, without a tab strip.
3. **No floating Search button on the home page.** The pill replaces it there; every other page keeps the bottom-right button. The chat bubble stays on the home page.
4. **Deep links:** `#search=<query>` on the home URL opens the panel with that query run, so v2 shared links keep working. A legacy `&type=` is ignored.
5. **Panel footer, every page:** "Open the full assistant" (to `/ask.html`) · "Use the playbook in your AI assistant" (to `/use-with-your-ai.html`), then the logging notice.
6. **Logging** is unchanged; the `page` field for home-page searches is still the home URL.

## 3. Design

- **The pill sits on the dark hero** (C11 shell). It uses a light field on the dark background: white at about 10% for the background, a 1px border at about 22%, `--radius`, text in the hero's pale-cyan secondary color, and a magnifier icon in `--cyan`, the hero's accent (changed from `--teal-light`, which was barely visible on the dark hero). On hover and focus the border and text brighten, with a focus ring visible on the dark background. All values come from tokens already used in the hero; no new colors (prohibition 1).
- **Width:** it spans the hero's text column on desktop and the full hero width minus gutters on mobile. It must not push the hero's right-hand badge art or wrap the hero headline.
- **The keyboard hint** is right-aligned inside the pill: `Ctrl K` on Windows and Linux, `⌘K` on Mac, hidden at or below 640px.
- **Footer links** use the footer's existing link style.
- **Classes:** new classes in `index.html` (`hero-search` and so on) are recorded in §5 below; prohibition 2 sign-off.

## 4. Gate

- `node tools/test-site-search.js` and `node tools/site-gate.js` both at 100%.
- **Browser check:** home at desktop and 375px.
  - The pill fits on one row and the hero does not grow by more than the pill's height.
  - The panel opens from a click, Ctrl+K and `/`; Esc closes it and focus returns to the pill; a `#search=` link opens with results.
  - No floating Search button on home; the chat bubble is still there.
  - No horizontal scroll.
- **Other pages are unchanged**, checked on `cpb.html` and `customer-zero-starter-kit/index.html`; the panel footer shows both links.

## 5. Sign-offs (prohibition 7)

| Element | Built from |
|---|---|
| `.hero-search` pill and its icon and hint | C11 hero palette at reduced opacity; `--radius`; §2 type scale |
| Footer links | Existing footer link style |
| `.hero-search` (`index.html`) | `rgba(255,255,255,.1)` ground (as `.hero-pill`), 1px `rgba(168,236,245,.25)` border (as `.hero-presenter`, `.hero-pill`), `--radius`, text `rgba(168,236,245,.88)` (as `.hero .sub`) at `.9rem`; hover and focus: `--cyan` border, `#fff` text; focus ring `2px solid var(--cyan)`, offset 3px (the jump highlight's ring). About 43px tall, full width of `.hero-left`. |
| `.hero-search-icon` | Inline magnifier SVG (the panel's `ICON_SEARCH` paths), 16px, `--cyan` |
| `.hero-search-text` | One line, ellipsis if it ever runs out of room |
| `.hero-search-key` (`<kbd>`) | `.68rem` bold, `letter-spacing: .06em`, text `rgba(168,236,245,.62)` (as `.journey-label`), `.25` ice border, `--radius`; hidden at 640px and below; text set by the module (`Ctrl K`, or `⌘K` on Mac) |
| Hero spacing | To keep the hero's growth to the pill's own height: `.hero` bottom padding 20px to 16px (12px at 640px and below), `.hero-presenter` margin-top 16px to 12px and padding-top 14px to 10px. The pill's 12px top margin is paid for by those 12px. |
| `.footer-links`, `.footer-links-sep` (`index.html`) | Page link style (`a`: `--teal`, underline on hover) at `.82rem`, centered between the footer card and `.sig`; `·` separator in `#9ca3af` |
| `.foot-links`, `.foot-sep` (panel shadow root) | Existing `.foot a` link style at `.78rem` on their own line above the logging notice; `·` in `#9ca3af` |
