# Draftline on iPad: the portrait freeze, and an audit of the rest

Status: **spec only** — root causes below are confirmed by live reproduction
against the running app, not guessed from reading the code. Nothing in this
file has been fixed yet.

## What happened

Screenshot from the user: iPad mini, Chrome, portrait, mid-draft. A team-credit
popover is open near the top, several board rows are stuck mid-strikethrough,
and the roster panel at the bottom has expanded to fill most of the screen.
Nothing above the roster responds to touch any more — no scroll, no tap, no way
to close the popover or get back to the board. The only way out was opening a
new tab and logging in again.

The user's read was right: this followed the work to make the board/queue/roster
column widths draggable, and something in that change (or exposed by it) can
strand the whole app. This spec covers that bug plus a wider pass over the iPad
experience, since a draft-night freeze is the worst possible failure mode for
this app and it's worth checking what else is sitting next to it.

## Root cause 1 (P0): the column-drag handle can lock the board forever

`ff/assets/app.js` wires the drag handle between columns (`.colgrip`) like this
(`app.js:85-147`):

- `pointerdown` on the grip sets `dragging = true`, adds `dragging-col` to
  `<body>`, and calls `grip.setPointerCapture(e.pointerId)`.
- `pointermove`, `pointerup` and `pointercancel` are all listened for **only on
  the grip element itself** — the code relies entirely on pointer capture to
  keep receiving them no matter where the finger goes.
- `ff.css:315` — `body.dragging-col .col { pointer-events: none; }` — every
  board/queue/roster column stops accepting input for the duration of the drag,
  so pointer events don't leak through to a column mid-resize.

That combination is fine *as long as pointerup or pointercancel always reaches
the grip*. It doesn't always:

```
grip.dispatchEvent(pointerdown)              // simulates a real touch starting on the handle
→ body.classList.contains('dragging-col')     === true
→ getComputedStyle(colBoard).pointerEvents    === "none"

grip.hasPointerCapture(pointerId)             === false   // capture did not take
document.body.dispatchEvent(pointerup)        // the up event lands elsewhere instead of on the grip
→ body.classList.contains('dragging-col')     === true    // still stuck
→ getComputedStyle(colBoard).pointerEvents    === "none"  // still stuck
```

I reproduced this against the live app in an iPad-mini-portrait viewport
(744×1133, `.colgrip[data-grip="1"]` is visible and hit-testable in that
layout — it isn't hidden until 700px). Once the up/cancel event fails to land
on the grip, `dragging-col` never gets removed, `pointer-events: none` never
gets removed, and every `.col` — board, queue, roster — is permanently inert.
Nothing in the UI can recover from that state; there is no timeout, no
document-level fallback, no Escape handler. A reload is the only way out, which
on iOS often means a fresh tab because the app is a login-gated SPA.

Why capture can fail or the up/cancel can miss the grip, on iPad specifically:
a touch that starts on a 9px-wide vertical strip immediately beside two
scrollable columns is exactly the gesture iOS's own scroll/rubber-band
recognizer competes for. `touch-action: none` on `.colgrip` (`ff.css:307`) is
supposed to tell the browser "don't hijack this for scrolling," but a 9px
target is thin enough that a finger landing a pixel or two off it, or a
diagonal drag, is a well-known way for WebKit to award the gesture to page
scroll instead — which is exactly the situation that can leave a `pointerdown`
without a matching `pointerup` on the same element. Desktop mice don't have
this failure mode, which is why this is invisible everywhere the feature was
probably tested.

### Fix

1. Add a **document-level** fallback for `pointerup`/`pointercancel` that ends
   the drag regardless of which element the event lands on, and stop relying on
   capture for correctness (use it only as the mechanism that makes `pointermove`
   keep firing while the finger is on the glass). This is the actual fix — it
   makes the failure mode above structurally impossible instead of rarer.
2. Belt-and-suspenders: a `visibilitychange`/`blur` listener that also calls
   `endDrag()`, so backgrounding the tab mid-drag (an iPad app-switch gesture
   starting from near the top edge) can't leave it stuck either.
3. Consider raising the hit target on touch devices — a 9px visual hairline can
   still have a wider invisible hit area (e.g. `::before`/`::after` padding, or
   a larger `touch-action: none` zone) without changing what's drawn, which
   reduces how often the edge case above gets triggered at all.
4. Given the blast radius (a full app freeze), this needs a regression test
   that isn't "try it on a real iPad and hope" — see Verification, below.

## Root cause 2 (P0, contributing): two input fields still trigger iOS zoom-lock

Separately, and possibly compounding the same incident: Safari/Chrome on iOS
auto-zooms the page when a focused text input renders below 16px, and — unlike
Android — that zoom can persist after the keyboard closes, especially with a
resizing viewport under it. The codebase already knows this and has a guard for
it (`ff.css:938-945`):

```css
@media (hover: none) {
  input[type=text], input[type=search], input[type=number], select, textarea { font-size: 16px; }
}
@supports (-webkit-touch-callout: none) {
  input, select, textarea { font-size: 16px; }
}
```

— explicit comment: *"a device that reports no hover but somehow never ran the
boot line still must not zoom the page on focus."* Good instinct, but CSS
specificity undoes it in two places. A bare `input` selector (specificity
0-0-1) loses to any class-scoped rule (0-1-1), so these two survive the
catch-all and still ship a sub-16px input on touch:

- `ff.css:285` — `.catchup-row input { font-size: 13px; }` (catch-up entry, the
  same "record a pick you missed" flow the popover in the screenshot belongs
  to)
- `ff.css:1236` — `.tk-field input { font-size: 14px; }` (a queue/tracker field)

Either one, focused on an iPad, zooms the viewport in on tap. If that happens
around the same moment the column drag above is misfiring — plausible, since
catch-up/assign is exactly the flow in the screenshot — the user is looking at
a zoomed, pointer-locked page at once, which matches "stuck" far better than
either bug alone.

### Fix

Raise both to `16px`, or better: delete the two overrides and let the existing
`@supports` catch-all apply everywhere, then re-add layout-specific padding/width
without touching `font-size`. Then grep the whole stylesheet for every
class-scoped `input`/`select`/`textarea` font-size rule under 16px so this
doesn't have a third instance sitting somewhere else — the two above were found
by hand; a full grep pass belongs in the fix, not this audit.

## Wider iPad pass

Requested scope was broader than the one freeze: an audit of the whole iPad
experience so draft night doesn't strand anyone else. Findings, roughly ordered
by how likely they are to bite:

### The drag handle probably shouldn't exist in the cramped portrait layout at all
At ≤1039px the grid is `minmax(360px,1.25fr) 9px minmax(300px,1fr)` — on a
744px iPad-mini-portrait screen that's two ~360px columns with almost no slack
to actually trade. The feature that caused root cause 1 has close to zero
value in the exact layout where it's riskiest. Recommendation: hide
`.colgrip[data-grip="1"]` below some width (say, 900px, matching the spirit of
the existing `data-grip="2"` cutoff at 1039px) rather than only fixing the
crash — one less untested gesture surface on the screens most likely to be
mid-draft on a couch.

### Popover positioning doesn't account for on-screen keyboard or scroll-while-open
`openAssign`/`openPickTeam`/the player-detail popover all position with
`getBoundingClientRect()` + `position: fixed` once, at open time
(`app.js:3184-3189`, similar at 3236-3241). Fixed positioning is scroll-safe,
but not keyboard-safe: `.app` uses `100dvh` specifically because the visual
viewport shrinks when the keyboard shows (`ff.css:225-229`), and a popover
anchored before the keyboard opens (e.g. tapping a row, then typing in the
catch-up field it revealed) won't reflow when the visible area changes under
it. Worth a real-device check rather than a guess: does any popover on this
app open a field that can raise a keyboard while the popover is still up?

### Appbar overflow has no visual affordance
`ff.css:230-237` — the toolbar (`Undo`, `Start/practice`, `Rosters`, `Ask
Claude`, `More`) scrolls horizontally on narrow screens with the scrollbar
hidden. On an iPad in portrait this is already at the edge of fitting (visible
in the audit screenshot: five items across ~700px). Nothing hints there's more
to scroll to if a sixth item is ever added, or if a team/user name pushes
`#whoami` wide. Low priority today, worth a fade-edge or chevron if the bar
ever gets fuller.

### Orientation-change re-layout is untested
The breakpoints (`ff.css:328-346`) split on both max-width and
`orientation: portrait`, which means rotating an iPad mid-draft crosses a
different CSS path, not just a reflow. Nothing currently listens for
`orientationchange` to re-run anything JS-driven (the persisted column widths,
for one — `applySavedColWidths()` only ever runs once at load). Confirm a
rotation mid-draft doesn't leave a saved three-column width ratio wedged into a
now-two-column layout, or vice versa.

### What's already solid (verified, not just assumed)
- `100dvh` on `.app` — correct choice, already reasoned through in the CSS
  comment at `ff.css:225`.
- `overscroll-behavior: contain` on `.col` — correct, stops iOS rubber-band
  from leaking the whole-page scroll gap the user described in an unrelated
  incident that's already fixed.
- Touch target sizing — `body.touch` rules consistently raise buttons to
  44px+ (`ff.css:934`, `870`, `898-899`, etc.), which is the right number for
  a finger.
- `IS_TOUCH` correctly gates the `1`/`2`/`3` keyboard-shortcut draft picks off
  on touch devices (`app.js:4802`) — no accidental drafts from a stray digit
  key on a connected keyboard case.
- The search-input readonly-until-touched guard against Chrome's autofill
  heuristics (`app.js:4765-4777`) is iPad-relevant and already working as
  intended.

## Fix plan, in order

1. **P0** — document-level pointer-capture fallback for the column drag (Root
   cause 1). This is the freeze; nothing else matters if this isn't fixed.
2. **P0** — the two sub-16px inputs (Root cause 2). Small, mechanical, and a
   full grep for any others like them.
3. **P1** — hide the drag handle below ~900px so the riskiest layout doesn't
   carry the riskiest gesture.
4. **P2** — keyboard-aware popover repositioning, appbar overflow affordance,
   orientation-change re-layout check. These are polish/robustness, not
   incident-shaped; worth doing in the same pass since we're already here, but
   none of them explain what happened in the screenshot.

## Verification plan

The bug in Root cause 1 is a race that a manual tap may or may not trigger —
"tried it on an iPad and it seemed fine" is not evidence it's fixed. Before
calling this done:

1. Automated repro (already built for this audit): dispatch a `pointerdown` on
   `.colgrip`, then a `pointerup` on `document.body` instead of the grip, and
   assert `document.body.classList.contains('dragging-col')` is `false` and
   `.col` elements have `pointer-events` other than `none`, both immediately
   after. This is a five-line check that would have caught the shipped bug and
   should live in `ff/tools/` alongside the other test scripts
   (`test-app.js`).
2. Real-device pass on an actual iPad in Chrome and Safari, portrait and
   landscape: drag the handle to its width limits, drag it off the edge of the
   screen, start a drag and immediately try to scroll a column with a second
   finger, background the app mid-drag (Cmd/edge-swipe), and rotate mid-drag.
3. Confirm the two fixed inputs no longer zoom the viewport on focus, on a real
   iPad — the Browser-pane emulator does not reproduce iOS's zoom-on-focus
   behavior, so this step can't be done from this environment.
