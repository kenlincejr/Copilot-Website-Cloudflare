# iPad check — 15 minutes, real device, before draft night

Run this on the actual iPad, in Safari, signed in to the real account, against the
**deployed** site. No keyboard attached. Portrait first, as you'll actually be
sitting Monday night.

**Any fail in rows 1–4 stops the draft plan.** Row 10 needs a second person and
is run with Claude driving a browser; do it in the same sitting. Those four are the taps that happen
on the clock — if they don't work, the paper fallback (`draft-day.md` §7) is the
plan, not this app, and you need to know that tonight, not at 19:00.

Mark each row pass or fail. Note a screenshot file name where you take one — every
BLOCKER row should get one either way, pass or fail, so there's a record.

---

## 1. 0:00 — Load, portrait — BLOCKER

Open the deployed site fresh (not a tab you already had open). Land on the board.

Check, without tapping anything:
- Nothing is focused — no keyboard is up, no autofill accessory bar (key / card /
  location icons) is floating over anything.
- **At least 9 player rows are visible** below the sticky column header.
- The longest names on the board are not clipped: look for "Marvin Harrison Jr.",
  "Amon-Ra St. Brown", "Kenneth Walker III" and confirm each shows in full with its
  team code.

Pass = all three true on load, no taps needed. Screenshot: ______________

## 2. 0:02 — Row buttons — BLOCKER

Tap a row in the middle of the visible list, then one at the very top, then one at
the very bottom (scroll to it first).

Check:
- Each tap lands on the row you meant, not its neighbor above or below.
- The row's action buttons (team-initials button, `who?`, `TO ME`) are each at
  least 44px tall and tappable without zooming in.
- Tap `who?` on any row — the team-assign picker opens fully inside the screen,
  not clipped off an edge.
- With the picker open, tap somewhere outside it — it closes. (There is no Escape
  key on an iPad; outside-tap is the only way this can close.)

Pass = all four true, at top, middle and bottom of the list. Screenshot: ______

## 3. 0:05 — Search — BLOCKER

Tap the search field.

Check:
- The page does not zoom in when the field gets focus.
- Safari does not offer a saved password or email to autofill into it.
- Type a partial name that includes an accent or special character — e.g. "St.
  Brown" or "Dobbins" — and confirm the list filters live and diacritics don't
  break the match.
- With a result showing, press the keyboard's Go/Enter key: it records the top
  match to whichever team is on the clock, not to "yourself" by default.
- After recording, focus returns to the search field on its own.
- Check whether the keyboard covers the row you'd need to see next — if it does,
  say so here, don't just note pass/fail: ______________________________

Pass = all of the above except the last, which is informational either way.
Screenshot: ______________

## 3b. 0:06 — Draft plan — not a blocker

Open **More › Draft plan**. It runs forty simulations, which is about half a
second of blocked main thread on a desktop and will be slower here.

- The spinner appears first — the button must not look dead while it computes.
- Time it roughly: ______ seconds. Anything over four is worth knowing about
  before Monday, though it is not a blocker; nothing about drafting needs it.
- Scroll to the bottom. The chips row and the notes must both be reachable — on
  a short screen the modal scrolls inside its own backdrop.

Pass = it opens, it finishes, and you can read all of it.
Screenshot: ______________

## 4. 0:07 — Tracker — BLOCKER

Open the live tracker (start or resume a practice draft if one isn't running).

Check, all at once:
- The **⋯**, the "last pick recorded" line, and whatever button the "do" band is
  showing (Simulate / Missed the name) are all comfortably tappable — each at
  least 44px.
- All four bands — the state line, the one instruction, the pick order, the
  step-away line — are on screen at once without scrolling the middle column.
- The pick order reads correctly: your own upcoming pick is called out, the pick
  on the clock is the highlighted row, and the picks under it are the ones that
  have actually happened, newest first.
- The state line ("You're up in 4 picks") is legible held at arm's length, not
  squinting distance. So is the roster-gap strip above it.
- Tap the "last pick recorded" line to open the step-away band. The **Yahoo is on
  pick** field opens a number pad, not a full keyboard, and typing a number two or
  three ahead of the board's own pick immediately reads back "N picks to record"
  with the Catch up button enabling itself.
- Open the **⋯**, then tap "Start over" once: it turns red and says "Sure?" — do
  **not** tap it again. Wait and confirm it disarms back to its normal label
  after about 4 seconds on its own, with no second tap.

Pass = all of the above true, and the disarm actually happens without a second
tap.

**And the thing this row exists to catch:** tap a player in the list. The card
opens anchored to his row — and the live draft box must not move. If the box,
the brief or the suggestions scroll out from under you when you tap a name, stop
and say so; that is the failure this layout was rebuilt to remove.
Screenshot: ______________

---

## 5. 0:09 — Two taps to record, timed

With the tracker or board in front of you, time this: from an idle screen, record
one pick for the team currently on the clock.

- Count taps: should be **2 or fewer** (e.g. tap search result, tap nothing else —
  Go/Enter counts as the second "tap").
- Time it: should take **5 seconds or less**, unhurried.
- Now undo that pick (Ctrl+Z has no iPad equivalent — use the undo button) and
  confirm the player is back in the pool, available to record again.

Pass = 2 taps, 5 seconds, and undo genuinely restores the pool.

## 6. 0:11 — Rotate to landscape

Rotate the iPad.

- Confirm the board is now three columns, not two.
- Confirm the row layout visibly changes (compact mode drops) — row height and
  button placement should look different from portrait, not identical.
- Open a modal (any one — League setup is fine), then rotate again with it open:
  it should still fit on screen, not run off an edge.
- Open the team-assign popover (`who?` on any row), then rotate with it open: it
  should re-clamp to the new width, not get stranded partway off screen.

Pass = three columns in landscape, and both open-while-rotating cases stay on
screen.

## 7. 0:13 — Split View beside Yahoo — BLOCKER for draft-night plan

This is the actual Monday-night arrangement: Draftline and the Yahoo draft client
open side by side.

- Open Split View with the Yahoo client, at **50/50**. Try recording one pick —
  is it still 2 taps? Note which layout (2-column / 3-column / 1-column) Draftline
  renders at this width.
- Change the split to **30/70** (Draftline the narrow side). Try recording one
  pick again — is it still 2 taps, or does the narrow width push it to 3+ or make
  a button too small to hit reliably?

**If only one of the two splits works cleanly, that is the answer** — write down
which one, and that becomes the arrangement in `draft-day.md`. Note it here:

Split that works: ______________________

## 8. 0:14 — Shell

- Scroll each column (board, middle, roster) — confirm only the columns scroll,
  never the page itself sideways or as a whole.
- With Safari's toolbar showing (not hidden), scroll the board to its last row —
  confirm it's actually reachable and not hidden behind the toolbar.

Pass = no page-level horizontal scroll anywhere, and the last board row is
reachable with the toolbar up.

---

## What this deliberately does not cover, and why that's safe to cut

This is the 15-minute cut of §E2's ~19-row, 90+ minute matrix. Cut, and why each is
lower risk than the rows above:

- **All eight modals** (League setup, Draft style, Columns, Save/load, Claude,
  Report, Start/practice, Catch-up) beyond the one touched in row 6 — these open
  between picks, not on the clock, so a rough edge here costs seconds, not a pick.
- **Rosters view** — viewed between picks, not needed to record one.
- **Columns picker** — a display preference; the default columns are already
  known to fit (row 1 covers that).
- **Performance timing** (`analyze()` + render under 250ms) — the emulated pass
  already measured this; a real-device regression would show up as visible lag in
  row 5's timed test, which is covered.
- **Contrast** (teal/amber-on-dark) — a legibility nuisance, not a blocker; row 4
  already checks the state line and the roster-gap strip are readable at arm's
  length, which is the contrast case that matters live.
- **Background tab behavior** (switching to Yahoo's tab and back) — Split View
  (row 7) is the actual plan for Monday, which makes this scenario moot; if Split
  View works, nothing switches tabs.
- **The 1024-wide overflow probe** — no iPad in this house is 1024 wide in
  landscape; every current model clears 1040px. Not a live risk for this device.

## Flagged: the one cut we're least comfortable with

**Row 9 (not run here): sleep and return.** Lock the iPad for five minutes
mid-draft, unlock, and confirm the board picks the thread back up. This is cut for
time, but it's a real Monday-night scenario — someone will lock the screen to check
a phone at some point in three hours, and it is the exact case the step-away band
exists for. If there's a spare five minutes before 19:00, run this one too:

- Mid-practice-draft, lock the iPad. Wait 5 minutes. Unlock.
- Check: is the pick count still right? Does the "last pick recorded" line show a
  sensible elapsed time rather than "just now"? If Safari reloaded the page, is the
  draft state intact and the sync status accurate rather than stuck on "syncing"?

Pass/fail if run: ______________________

---

## Row 10: two devices — run this with me, once, on Saturday

**This one needs both of us and it is the only test on the list where failing
means a draft is *destroyed* rather than degraded.** Everything else on this page
is recoverable at the table. This is not.

The mechanism: `PUT /api/state` reads the current revision, compares it, and
writes revision + 1. KV is eventually consistent, so two devices saving inside the
propagation window can each read the same revision, each pass the check, and each
write — and the second physical write wins silently, with no conflict shown to
either device. That is finding **F5**, it is a known and deliberate non-fix (the
proper answer is a Durable Object, which is not a four-days-out change), and
`test-accounts.sh` **cannot** exercise it: the local emulator is a single
in-process store with strict read-after-write consistency, so it only ever proves
the optimistic logic is right when reads are consistent.

So the point of this test is not to prove the race is fixed. It is to find out
what it looks like on your screen if it happens, so you recognize it at 19:40
instead of discovering it afterwards.

**Setup.** iPad signed in, on the deployed site. I drive a browser signed in to the
same account. Neither reloads until told.

1. On the **iPad**, record five picks. Do not reload.
2. On the **browser**, without reloading it first, record three *different* picks.
3. Reload the **iPad**.

**What must happen.** A conflict banner appears naming both devices, with two
buttons — "Use that one" and "Keep this one".

Check, and write down what you see:

- Does the banner name **both** devices in a way you can tell apart at a glance?
  "iPad" vs "Chrome on Windows" is usable; two identical labels is not.
- Press one. Does it do **exactly** what the label says?
- **Then confirm the losing draft is really gone** — not recoverable, not hiding
  in Save/load. It is destroyed, and the app should have made that clear *before*
  you pressed, not after.
- If **no banner appears at all** and one device's picks have simply vanished,
  that is F5 firing. Write down which device won, and how many picks were lost.

Pass/fail: ______________________  Banner appeared: Y / N

**Whatever the result, the mitigation is the same and it goes in `draft-day.md`
§6: draft from one device.** If the laptop is open on Monday, do not record on it.
This test tells you what a mistake looks like; it does not make the mistake safe.
