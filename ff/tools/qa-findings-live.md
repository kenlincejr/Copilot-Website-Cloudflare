# Live AI measurement — the first time this layer met a real model

**Run 2026-09-04, against the deployed Worker.** Sixty calls, $0.62 of the owner's
Anthropic credit, one second apart, never looped. Approved in advance with a stated call
count. The Worker's ceiling is 90/IP/minute and the daily stop is $50; neither was
approached and nothing was retried.

Everything in `qa-findings-D.md` and `qa-findings-I2.md` was static analysis. This is what
actually happens.

## Method

Thirty payloads from `briefQuestion()` — the real thing, not a reduction — built at ten
draft states (rounds 1, 2, 3, 6, 8, 9, 10, 11, 14, 15) across three different rosters, so
the roster block, the supply block and the reserve rule all vary. Sent through the
deployed proxy at `claude-sonnet-5` with `max_tokens: 2500`, the same path the app uses.

Run twice: once against the prompt as it stood, once after the fix in §3.

## 1. Latency — under the timeout, and the tail is thinking

| | run 1 | run 2 |
|---|---|---|
| p50 | 4,739 ms | 3,943 ms |
| p95 | 9,572 ms | 12,265 ms |
| max | 13,282 ms | 20,472 ms |
| over 12 s | 1 of 30 | 2 of 30 |
| over the 30 s client timeout | **0** | **0** |

D set the bar at "p95 above 12 seconds is HIGH, because the brief is written two picks
ahead and in a fast room it will arrive after the pick." The two runs straddle it: 9.6 s
and 12.3 s. Call it borderline rather than clear, and note that no call in sixty came near
the 30-second client timeout, so the failure mode is a late brief, never a lost one.

**The tail is entirely adaptive thinking**, and this is the finding worth acting on:

```
calls that used thinking tokens   8 of 30   mean latency 8,507 ms
calls that used none             22 of 30   mean latency 3,797 ms
the two slowest calls            20,472 ms (1,129 thinking)   12,265 ms (536 thinking)
```

Mean thinking across all thirty was 81 tokens against 243 output tokens. So D's framing
needs correcting in one direction and sharpening in the other. Thinking is **not** a large
token cost — it is a rounding error against `max_tokens` and does not threaten a truncated
answer. But it is **the whole latency distribution above the median**, and latency is what
decides whether the brief arrives before the clock.

**Recommendation: set `output_config.effort` to `low` in the Worker.** It is a one-line
change in `ff/worker/src/index.js`, it is where D said it belonged, and on this evidence it
would pull p95 toward the 3.8 s no-thinking mean rather than saving tokens. **Not applied
here**: it changes the deployed API for every client, and a Worker deploy is a separate
decision from a static-asset deploy. It is the highest-value item left in the AI layer.

## 2. Advice quality — it agrees with the board almost always

| | run 1 | run 2 |
|---|---|---|
| named the board's #1 | 26 of 30 | 29 of 30 |
| disagreed with #1 | 3 | 1 |
| named somebody not on the list | 1 | **0** |
| gave a fallback line | 30 of 30 | 30 of 30 |
| mean answer length | 80 words | 73 words |

The format instruction holds completely: every one of sixty answers produced a first line
with a player and a closing `If gone:` clause, under the 110-word ceiling.

The agreement rate is the number to sit with. D's own framing: "a brief that always agrees
is not earning its cost; one that disagrees for reasons already in the composite is arguing
with itself." At 29 of 30 it is close to the first. That is not necessarily wrong — the
board is now considerably better than it was, and agreeing with a correct board is the
right answer — but it does mean the brief's value is in its *reasoning*, not its *pick*,
and it should be read that way on the night.

Both disagreements were defensible rather than random: at rounds 9 and 10 with the D/ST
slot open it took Houston Defense over the board's #1, which is exactly the boosted-tier
argument the research notes carry.

## 3. One HIGH, found and fixed

**Twenty-nine of thirty answers wrote the full name. One wrote "Gibbs".**

`playerIn()` refuses a bare surname deliberately — two players can share one, and binding
the Draft button to the wrong man is the failure fixed in `4a02c62`. So that brief reached
the screen with a Draft button that did nothing, on the clock, and the only recovery was to
type the name by hand.

One in thirty is roughly once a draft.

Fixed in two places, in `fd69bf3`. The prompt now demands the full name exactly as listed
and says why. The backstop resolves an unbound head line against the eight names the
payload actually carried, and only when exactly one matches — safe in the way a board-wide
surname match is not, because the model was told to pick from that list.

**Re-measured after the fix: 30 of 30 full names, 30 of 30 binding through `playerIn()`
alone.**

This is the finding that justifies the whole exercise. It was invisible to static analysis:
the prompt said "the player you would take, and nothing else on that line", which is
correct, unambiguous, and was followed 97% of the time.

## 4. Token shape

Mean input 3,322 tokens, mean output 243. The input is larger than the payload alone
(~1,800) because `briefQuestion()` adds the teams-ahead block, the answer-shape
instructions and `SYSTEM`.

Note for the record: `SYSTEM` remains well under Sonnet 5's 1,024-token minimum cacheable
prefix, so prompt caching stays as pointless as D concluded. Do not spend time on it.

Cost is **$0.0104 a call**. A full draft is fourteen briefs plus at most seven re-asks,
about **22 cents**. The $50 daily stop is not a constraint on ordinary use; it is a
constraint on a runaway loop, which is what it is for.

## 5. What this did not measure

- **`output_config.effort` head to head.** The Worker sends none and the client cannot
  inject it, so testing `low` and `medium` requires deploying a Worker change. §1 makes the
  case; the comparison is still unmade.
- **Real draft-night latency.** These ran from one machine against a warm Worker. A cold
  start, a phone tethered in a basement, or twelve league members on one connection are all
  slower.
- **Whether the advice is *good*.** Agreement with the board is measurable; being right is
  not, until the season is played. That is what post-draft outcome tracking is for, and it
  remains the only item in the roadmap that produces a measurement rather than another
  input.
