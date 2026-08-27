# specs/landing-urlfix.spec.md

**Target file:** `landing.html`
**Branch:** `refresh/copilot-ib` (merges in the same window as `specs/CopilotIB-urlfix.spec.md`)
**Authored:** 2026-08-27, correctness pass
**Depends on:** [`DESIGN.md`](../DESIGN.md), [`CopilotIB-urlfix.spec.md`](CopilotIB-urlfix.spec.md)

---

## Why this spec exists

`landing.html` does not merely link to `CopilotIB.html` — it **restates that document's false claim as a selling point**. The "What's inside" list for the Personal Agent Knowledge Reference advertises:

> Why URLs appear in the UI even though the agent can't read them

The agent *can* read them. `CopilotIB-urlfix.spec.md` retracts this claim inside the document; leaving it on the landing page means a visitor who never opens the reference still absorbs the wrong model, and the site contradicts itself.

**These two specs must merge together.** Applying either alone produces exactly the half-applied cascade `specs/README.md` says the refresh exists to prevent.

`landing.html` is a **pure-class file** (`DESIGN.md` §5: 1 inline style / 140 classes). Prohibition §8.2 makes adding *any* inline `style=` attribute a violation. This change is text-only inside existing markup.

---

## Execution prompt

> You are applying `specs/landing-urlfix.spec.md` to `landing.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report**.
> - Locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim.
> - This is a pure-class file. **Do not add an inline `style=` attribute for any reason.**
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **1** |
| LOW risk | 1 |
| **Diff budget** | **+1 / −1 lines** |
| New CSS classes | **0** |
| New tokens / colours | **0** |

Any diff beyond one line changed is a stop signal.

---

### LP-01 · Retract the "agent can't read them" bullet
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** LOW
**Rationale:** The claim is false as of August 2026. The replacement keeps the bullet's job — signalling that this document explains a commonly-misunderstood behaviour — while stating the correct one. Character count is close to the original so the card's visual rhythm is unchanged.
**Design:** Bare `<li>` inside the existing `.res-covers` list. No class, no style.

```html before:LP-01
          <li>Why URLs appear in the UI even though the agent can&rsquo;t read them</li>
```
```html after:LP-01
          <li>How website URLs are really used, and the narrow rules that silently break them</li>
```

---

## Out of scope — flagged, not changed

| Item | Why it is not in this spec |
|---|---|
| `<li>The three-tier knowledge priority stack and conflict resolution</li>` | Still accurately describes what `CopilotIB.html` currently contains. That section is slated for **deletion** in the follow-on spec; this bullet is retired in the same change, not before it. |
| `res-summary` copy — "especially around URL handling and retrieval" | Still true and still the document's draw. No change needed. |
| The `CopilotApp.html` card and its "Execution (Teams) vs. Orientation (M365 App)" framing | Retired by the Field Guide re-architecture, not by this correctness pass. Follow-on spec. |
| `index.html` resource cards and `sitemap.xml` lastmod | Different files, separate specs, same merge window. |
