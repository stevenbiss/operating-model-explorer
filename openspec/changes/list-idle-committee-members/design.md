# Design: List idle committee members in the committee lane

## Context

See proposal.md (Why) and the delta specs. The engine today:

- **`flow()`** (`src/model/layout.js`, pure and unit-tested) collects lane roles from every role that owns a shown step or appears in its effective RACI. For a committee-owned step, the effective RACI (`effectiveRaci`) includes every member, so every member becomes a lane. Committee lanes form one group after the first party group that has a member.
- **Lane headers** (`swimlane.js`) are SVG text built with `wrap()` and a height calculation. Member lanes carry "<Committee> member · <letter>" lines. Committee lane headers show only the committee name, as a link in the "Committees" group.
- **The shared tooltip** in `people.js`, added in 1.6.0, already handles hover (with a delay), keyboard focus, Escape, window clamping and `aria-describedby`.

## Goals / Non-Goals

**Goals:**
- Work out idleness once, in `flow()`, so the renderer only draws what it's given and the rule is unit-tested.
- Reuse the lane-header wrap and height logic and the shared tooltip, with no new mechanism.

**Non-Goals:**
- Changing the effective-RACI rules, validation, the committee page or the step detail.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies.

### D2. Idleness is computed in `flow()`
For each committee shown in the process, a member is **active** if, among the shown steps, it:
- owns a step, or
- has a letter in the `raci` of a step that isn't owned by one of its committees. The step's own `raci` is used, not `effectiveRaci`, so committee membership never counts.

Every other member is **idle**.

- `flow()` leaves idle members out of the lane roles, unless they take part some other way.
- It returns `f.idle = { [committeeId]: [roleId…] }`, ordered by the model's party order, then role order.
- A role that sits on two committees in the process and is idle in both is listed in both committee lanes.
- A member given a letter on its own committee's step (already a validation warning, where the committee's letter wins) counts as committee participation, so it stays idle.
- Rejected: computing idleness in the renderer, because it would spread the rule across `swimlane.js` and make it untestable in Node.

### D3. Header list in the lane header, growing to four lines *(answers the draft's open questions 1 and 2)*
- **Where:** in the lane header (the left column), under the committee name. The header is sticky when panning, so the list stays visible while the steps scroll. It also keeps the diagram's shape: a strip across the top of the lane would need a new row type and would compete with the steps for space.
- **Growth:** the header grows to fit up to **four member lines**. A member line wraps to two lines at most, and each wrapped line counts toward the four. If more entries are left, the last line becomes "+ N more". The lane height is `max(step rows, header need)`, the same as for other lane headers today.
- **Content of an entry:** a small party mark (or the party colour swatch when the party has no brand), then "Role · Letter", with the person line from `peopleLine()` in the muted style after it.
  - Parties are separated by order, not by headings, to save lines. Screen readers still hear the party, because each entry's accessible name includes it: "Legal counsel, Acme, consulted".
  - Each entry is a link to the role page, so idle members stay reachable by keyboard even without a lane link.
- **"+ N more":** a link to the committee page. It carries `data-members` for the shared tooltip, which shows the full idle list in the same format, and an `aria-label` of "N more members: …" listing them all.
- **Order of links:** header links stay in the lane-header group order. The committee name comes first, then the member entries, then "+ N more".

### D4. Persona "You" in the list
- When an idle member is one of the persona's roles, its entry gets the existing `cue` text "You", and the committee lane gets "Your committee" (unchanged).
- If that entry is hidden behind "+ N more", the overflow entry gets the "You" cue instead. It is never shown by colour alone.

### D5. No role-page note for always-idle members *(answers open question 3)*
The role page already lists the committees a role sits on (with its letter) and every step it takes part in through them. A separate "takes part only through…" note was left out for Ponytail reasons. If wanted later, it's additive.

### D6. Sample
- Add `legal-counsel: C` to the bid board's members in `examples/acme-sample/committees/bid-board.md`.
- Add `Legal counsel (C)` to the capture sheet's Committees row.
- Legal counsel has no other part in "Qualify an opportunity", so it's idle there. It still appears in "Build the proposal" (it's consulted there), which demonstrates per-process idleness without any extra content.
- Update the step detail scenario's member list (spec delta) and the committee page tests to match.

### D7. Version 1.7.0
A visible change to swimlanes, with no content or format change.

## Risks / Trade-offs

- **[Viewers may miss that a listed member is "really" in the process.]** → The entry shows the role, its party and its letter, links to the role page, and opening the committee step lists every member as before.
- **[Very long member lists make the committee lane tall.]** → Capped at four lines plus "+ N more", with the full list in the tooltip, the accessible name and the committee page.
- **[Existing tests and snapshots count the sample's lanes.]** → The sample changes deliberately (Legal counsel added, and idle in Qualify). Tests that count lanes are updated only where this rule changes the count.
- **[Rule surprise: a member with an R on a role-owned step keeps its lane even though it owns nothing.]** → That's intended. It does work outside the committee, so its lane shows where (its RACI marker on that step).

## Migration Plan

Viewer-only. Existing models render with fewer lanes when re-exported with 1.7.0, and need no edits. To roll back, use 1.6.0.

## Open Questions

None. D3 and D5 answer the draft's open questions and are flagged for the user's confirmation with the spec.
