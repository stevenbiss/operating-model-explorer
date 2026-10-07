# Design: Joint steps

## Context

- **Ownership.** `step.owner` is one role or committee id. Lanes come from owners and participants in `flow()` (`src/model/layout.js`, which is pure and unit-tested). Each node has one lane, rank and slot.
- **Connectors.** They are drawn in `swimlane.js` with the label and routing rules from 1.7.1: the bend just before the target's column, entry points and lane-boundary detours.
- **Multi-party steps.** Committees introduced `parties` on steps and the party-set rule for cross-party handoffs; joint steps reuse both.

## Goals / Non-Goals

**Goals:**
- One step in the model with several drawn boxes, keeping `flow()` pure and the rest of the viewer treating it as one step.

**Non-Goals:**
- Parallel separate steps, committee co-ownership, or RACI changes.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies.

### D2. Normalised `owners`
- At load, every step gets `owners: [id…]`: `[owner]` for a single owner, or the list for a joint step. `owner` stays as the primary owner (`owners[0]`), so existing code that reads `owner` keeps working.
- `ownerType` stays `role` or `committee`; `joint` is true when there is more than one owner.
- `parties` is the distinct parties of the owners, in model order, as for committees.
- **Sheet:** the Owner cell is split on `;` and each name resolved as a role. A single name can still resolve to a committee, as today.
- **Validation:** for a list, every entry must be a role (error otherwise), there must be no duplicates, and each gets the existing reference check with suggestions.

### D3. Layout: twin nodes in one rank
- In `flow()`, a joint step gets one placement per owner lane. Its node keeps the primary lane and adds `twins: [{ lane, slot }…]`. Slots are allocated per lane at the step's rank, so a twin never overlaps another step in its lane.
- Rank is unchanged: one rank per step.
- Tab order (`order`) lists the step once.

### D4. Rendering
- **Boxes:** each twin draws the step box with a "Joint" pill (the existing pill style, like "By committee").
  - The primary twin is the focusable button, with the accessible name "<step>, joint step: <owner>, <owner>…".
  - The other twins are `aria-hidden` with `tabindex="-1"` and the same `data-step`, so a click opens the same detail and screen readers hear the step once.
- **Dotted tie:** a vertical dotted line in the gap just left of the column, from the top twin's centre to the bottom twin's centre, with short horizontal stubs into each twin's left edge. Gaps never hold step boxes, so the tie can't pass through one.
- **Connectors:** a forward connector into a joint step targets the twin whose lane is nearest the source's lane (ties go to the primary). A connector out of it starts from the twin nearest the target's lane. Entry points, labels and detours from 1.7.1 apply to the chosen twin.
- **Cross-party:** the party-set rule, as for committees.

### D5. Viewer pages
- **Step detail:** an owner row per owner with party tags and a "Joint" badge.
- **Role profile:** includes steps where the role is in `owners`.
- **Persona:** cues and emphasis apply when any owner is a persona role. Every twin gets the emphasis class.
- **Search:** indexes the step once.
- **Phone step list:** "Owner A (Party) · Owner B (Party)" plus a "Joint" badge.

### D6. Sample, skill, docs
- **Sample:** "Kick off the bid" gets `owner: [bid-manager, solution-architect]` in both forms. Its RACI keeps `bid-manager: A`, and the Solution architect's letter changes from C to R, since it now shares the work.
- **Skill:** when the material describes one activity done together by two roles, draft one joint step, not two duplicates.
- **Docs:** the capture-sheet format, the authoring guide and template comments.

### D7. Version 1.9.0
A new content capability. The format stays 1.

## Risks / Trade-offs

- **[Twin boxes add height to lanes that otherwise hold nothing at that rank.]** → One box per owner lane, using normal slot allocation.
- **[An older engine shows an "unknown role" error for "A; B".]** → The skill bundles its matching engine, and the release notes say 1.9.0 is needed.
- **[A dotted tie between far-apart lanes is long.]** → It sits in the gap, behind nothing, and each twin also carries the "Joint" badge.

## Migration Plan

Additive. Authors can replace a pair of duplicated "Joint" steps with one joint step. To roll back, use 1.8.0.

## Open Questions

None.
