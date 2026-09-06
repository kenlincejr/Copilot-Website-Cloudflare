# Catch-up fixes — spec

Draft: Tuesday 2026-09-08, 19:00 CDT.
Scope: `assets/app.js` `openCatchup()` and `openUnknowns()`, plus markup in
`app.html` for the catch-up modal footer. Nothing else is touched.

---

## 0. What this is, and what changed on inspection

The catch-up sheet is the way back when you have stepped away and the board has
fallen behind the room. It is the only place in the app that deliberately writes
data it knows may be wrong — the ADP guess — and it is therefore the only place
where a bad write silently degrades every suggestion that follows.

Four fixes were proposed before reading the code closely. **One of them was
already built, and better than the proposal.** It is documented in §3 so nobody
proposes it a third time. A fifth problem surfaced while confirming that, and is
specced in §5.

The governing principle for all of this: an unknown pick is not an error, it is
an honest record of something you did not see. The goal is not to eliminate
unknowns — it is to stop creating the ones that were *avoidable*, and to make
sure the unavoidable ones stay repairable.

---

## 1. Your own pick must never go unknown

### The problem

`openCatchup()` applies every row through one path:

```js
record(ok ? nm : null, r.mine, true);
```

A blank or invalid row becomes `unknown: true`. When the row was **yours**
(`r.mine`), that unknown lands on your own roster as `{name:"unknown", pos:"?",
pts:0}` (`app.js:1611`).

Every strategy with `needWeight > 0` scores candidates against your roster
shape. An unknown is a `?` — a slot the engine reads as still empty. So for the
rest of the draft it will push you toward a position you have already filled,
and it will do it quietly, as a slightly-wrong weighting rather than a visible
error.

An unknown on another team's slot costs you one player's availability. An
unknown on your own slot corrupts the model's picture of the only roster it is
optimizing.

### Why this one is worth a hard block rather than a warning

Every other row on the sheet is a genuine question — you did not see that pick,
and a guess is the best anyone can do. Your own row is not a question. You know
who you took. There is no legitimate reason for that field to be empty, so the
sheet should refuse to proceed rather than record a guess about your own team.

### The change

- Compute `mineBlank` = any row where `r.mine` is true and the field is empty or
  invalid.
- While `mineBlank` is non-empty, `#catchupApply` is `disabled`.
- The row gets a `.needs-you` class — left border in the warning color and the
  label text "your pick — required".
- The footer states the reason: *"Your own pick can't be a guess — the board
  scores your roster against it."*

### Acceptance

- A catch-up containing one of your own slots cannot be applied until that row
  holds a valid, undrafted player.
- A catch-up containing none of your own slots is unaffected.
- Filling the row re-enables Apply immediately, without a re-render of the sheet.

---

## 2. Validation moves inside the sheet

### The problem

Validation runs at apply time, inside the `forEach`:

```js
var ok = nm && BY_NAME[nm] && !draftedNames()[nm];
if (nm && !ok) bad.push(nm);
```

and the user is told about it by `banner()` **after `closeModal()` has already
fired**. So a typo, or a name that was already drafted, silently becomes an
unknown and you learn about it from a message that appears once the sheet you
would fix it in is gone.

The information is already computed. It is delivered at the one moment it cannot
be acted on.

### The change

Validate on `input`, per field, against the same three conditions:

| Condition | Message under the field |
|---|---|
| empty | *(none — blank is legitimate, except §1)* |
| not in `BY_NAME` | "not on the board" |
| in `draftedNames()` | "already drafted" |
| duplicate of another row in this sheet | "already used above" |

Invalid fields get `.cu-bad` (red border). The fourth condition is new and is
what §4 depends on.

The Apply button states what it is about to do rather than being a bare verb:

    Record 6 picks — 4 by name, 2 unknown

recomputed on every input event. `banner()` on apply stays, minus the `bad`
list, which no longer has anything to report because invalid names can no longer
survive to apply time.

### Acceptance

- Typing a misspelled name shows "not on the board" under the field, live.
- Typing a drafted player's name shows "already drafted", live.
- The Apply label's named/unknown counts track the fields on every keystroke.
- Applying the sheet produces no `bad` list, because no invalid name reaches it.

---

## 3. Retroactive repair — ALREADY BUILT, do not rebuild

This was proposed as a fix. It exists, and the existing design is better than
the proposal.

Tapping an available player opens `openAssign()`, which — when there are blank
picks on the board — renders an **"or fill in a pick you missed"** section from
`openUnknowns()` and routes the tap to `fillUnknown(name, pick)`
(`app.js:3128`). That sets `pk.name`, clears `pk.unknown`, and spends no extra
pick. The footer copy already explains it.

The proposal was a "mark gone" action that would consume the oldest unknown.
`fillUnknown` is strictly better: it lets you name *which* pick the player
belongs to rather than assuming the oldest, so the draft log stays truthful about
team attribution.

**The only change here is §5.** The mechanism is sound; its reach is capped too
low.

---

## 4. ADP guesses must not collide with what you have typed

### The problem

Guesses are computed once, when the sheet opens:

```js
var guess = pool.find(function (p) { return !used[p.name]; });
if (guess) used[guess.name] = true;
```

`used` dedupes guesses **against each other**. It knows nothing about what you
type. So:

1. Row 1 — you type "Bijan Robinson" from memory.
2. Row 3 — its precomputed guess is also Bijan. You click the ADP button.
3. Apply — row 1 records him. Row 3 fails `!draftedNames()[nm]`, records as
   **unknown**, and Bijan lands in the confusing "already drafted" banner.

Using the button exactly as intended costs you a slot to an avoidable unknown.

### The change

Compute the guess **at click time**, not at open time. Both the per-row ADP
button and "Fill from ADP" resolve against the live state:

```js
function guessFor(i, rows) {
  var taken = currentSheetNames();      // every non-empty field except row i
  var drafted = draftedNames();
  return A.avail.find(function (p) {
    return !taken[p.name] && !drafted[p.name];
  });
}
```

"Fill from ADP" fills **only empty rows**, top to bottom, marking each name taken
as it goes — so it can no longer overwrite something you typed, which it
currently does unconditionally:

```js
rows.forEach(function (r, i) { $(...).value = r.guess; });   // clobbers your work
```

That clobber is a second, independent bug in the same handler and this fix
closes it.

### Acceptance

- Typing a name in row 1 removes him from every other row's ADP suggestion.
- "Fill from ADP" leaves populated fields untouched.
- No two rows can be ADP-filled with the same player.
- Applying a fully ADP-filled sheet produces zero "already drafted" rejections.

---

## 5. The repair cap is lower than the damage a catch-up can do

### The problem

```js
function openUnknowns() {
  return S.picks.filter(function (p) { return p.unknown; })
    .slice().reverse().slice(0, 6);
}
```

Six. A catch-up of eight blank rows creates eight unknowns, of which **only the
six newest are ever offered for repair**. The remaining two cannot be fixed
through the UI at all — `fillUnknown` is only reachable from this list.

The cap is inverted against the risk: the bigger the catch-up, the more unknowns
it creates, and the larger the share of them that fall off the end of the only
mechanism that repairs them. A cap of six is a sensible *popover* size and a
poor *data* limit.

### The change

Separate the two concerns. `openUnknowns()` returns all of them; the popover
decides how many to draw.

```js
/** Every pick logged with no name, newest first. */
function openUnknowns() {
  return S.picks.filter(function (p) { return p.unknown; }).slice().reverse();
}
```

In `openAssign()`, render the first 8 and, when there are more, a trailing line:
*"+3 older blanks — pick the player, then use ⋯ to place him."* The list stays
scrollable rather than growing the popover past the viewport, which is the
constraint the 6 was really protecting.

### Acceptance

- Ten unknowns are all reachable; none is permanently unfillable.
- The popover does not exceed its current maximum height on a phone or iPad.

---

## 6. Footer copy

The sheet should say that blanks are recoverable, because they are (§3) and
because knowing it changes how hard you try to guess:

> Blank rows record as unknown — the slot is spent, the player stays on the
> board. You can fill one in later by tapping the player.

Replaces nothing; this is an addition to the existing footer.

---

## 7. Out of scope

- **The guess algorithm itself.** Top-N-by-ADP is a defensible baseline and there
  is no better signal in the app — nothing models opponent roster needs, so
  nothing can predict a positional run. It is labeled a guess and should stay one.
- **Team attribution of guesses.** Assigning guesses in pick order implies
  precision the data does not have, but it only affects the Rosters view, never a
  suggestion. Leave it.
- **Anything touching `record()`, `save()` or the engine.** These fixes are
  confined to the sheet that produces the input.

---

## 8. Test

`tools/test-app.js` covers the board. Add to it:

1. Own-slot row blank → Apply disabled; filled → enabled.
2. Typed name in row 1 → absent from row 3's guess; "Fill from ADP" leaves row 1
   alone.
3. Ten unknowns → `openUnknowns()` returns ten.
4. Apply a valid sheet → `bad` is empty, `named` equals the row count.

Run `tools/test-all.sh` before deploy, and bump `build` in `assets/config.js`
with the `?v=` stamps to match.
