# Design: Committee decisions

## Context

See proposal.md (Why) and `specs/committees/spec.md` for the behaviour. The relevant parts of the engine today:

- **Ownership.** `step.owner` is a role id. `validate.js` checks it with `ref(…, 'owner', s.owner, 'role')`, and the sheet reader resolves the Owner cell with `find('role', …)`.
- **RACI.** `raciChecks()` in `validate.js` warns when a step has no A or more than one A.
- **Swimlane.** `src/model/layout.js` `flow()` is a pure, unit-tested function. It builds lanes from the roles that own or take part in shown steps, grouped by `m.order.party`. Each node has a single lane index. `swimlane.js` draws fixed-size SVG nodes from that layout, and `app.js` `flowList()` is the phone list.
- **There is no decision shape.** A "decision" is any step whose `next` has labels. So there is nothing to restrict committees to, which is why D6 allows any step.
- **Element pages and labels.** Parties, teams and personas share the generic `#/e/<id>` element page. Labels come from `LABEL_PAIRS` in `theme-check.js` and are used through `L()` and `L.lower()` (e.g. "Your role").
- **Constraints.** One offline HTML file, Ponytail minimal-code mode, a public repo with fictional data only.

## Goals / Non-Goals

**Goals:**
- Committees ride the existing element paths (schema, load, snapshot, search, change markers, labels, element page), so most features come for free.
- Keep `flow()` single-lane per node. A committee is drawn as one more lane, not as a new kind of geometry.

**Non-Goals:**
- Steps drawn spanning several lanes, dotted membership ties, or any re-ordering of role lanes.
- Committee nesting, teams as members, or committees on structure diagrams.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies. The change is one more element type and one more lane group in the existing SVG swimlane.

### D2. Element shape
```yaml
---
id: bid-board
type: committee
name: Acme + Globex bid board
summary: Decides together whether to bid.
members:
  account-lead: A
  partner-manager: A
  solution-architect: C
  bid-manager: I
---
Optional narrative.
```
- `schema/committee.schema.json` has `id`, `type`, `name`, `summary`, `members` (an object mapping role id to `R | A | C | I`, `minProperties: 1`, the same value shape as a step's `raci`) and `change`. It is registered in `schemas.js`, so the content reference gains a committee section on build.
- `process.schema.json`: the step `owner` description becomes "The id of the role or committee that owns this step."
- `members` reuses the RACI shape on purpose. Authors already know it, and the one-letter-per-cell check (including the combined-letter wording) runs on it unchanged.
- Ids are already unique across the model, so a committee and a role can never share an id in a folder. The name clash rule (committees spec) is a separate check on normalised names, run in validate.js for both forms.

### D3. Swimlane: a dedicated committee lane, not a spanning shape *(resolves the draft's open question 1; confirmed)*
Each committee that owns a shown step gets its own lane. A process can have several committees. All their lanes form **one group in the middle of the swimlane**, directly after the first party group shown, so the two main parties sit on either side. The group has one heading with the committees label, and its lanes are stacked in the order their first steps appear in the flow. The member roles also appear as ordinary lanes in their party groups, because membership counts as taking part.

Why not a step that spans its member lanes?
- Lanes are grouped by party. So the members of a cross-party committee, the normal case, are almost never next to each other. The spanning shape would then fall back to dotted ties most of the time, and would sit across non-member lanes in between.
- `flow()` assumes one lane per node. Spanning shapes would add new geometry to slots, rows, connector routing and the phone list.

A dedicated lane keeps all of that unchanged:
- the committee is one more lane key;
- `flow()` adds a group `{ committee: true, lanes: [committeeIds] }` directly after the first party group;
- every helper that today takes a role id takes a committee id as well.

The committee lane header shows only the committee's name (user decision, 2026-10-05: the members are shown only in the step's members panel and on the committee page, which keeps the swimlane uncluttered). Each member's own role lane header gains one line per committee in this process, e.g. "Bid board member · A". These are the existing lane-header cues, so the lane grows to fit like any other cue, and it is never compact. Like a role's lane header, the name links to the committee page.

**Confirmed by the user (2026-10-05):** dedicated lanes, all together in the middle, with the two main parties on either side. A process can have two or more committees. Placing them in the middle keeps the joint decisions visually between the two sides they join, and the connectors from each side stay short. A spanning shape and a block above all the parties were both considered and set aside.

All committees go in one block rather than each sitting next to its own member parties, because the user wants the committees together between the two main parties. With three or more parties, the block still sits after the first party group. That case is rare in partnership models, and each member's own lane header names its committee.

### D4. RACI lives on the committee, with joint accountability *(resolves open question 2; confirmed with changes)*
The user's direction: a committee has its own RACI. Key members are held accountable for the decision together, there is no single overall owner, and others may be consulted or informed.
- **The committee's `members` map is its RACI.** A committee-owned step's effective RACI is the committee's members merged with the step's own `raci` for non-members. A shared helper, `effectiveRaci(step)`, is used by validation, step detail, role profiles and "What matters for me", so all of them agree.
- **Joint accountability.** In `raciChecks()`, a committee step's accountable set is its A members. Several A members are accepted as one joint accountable, and none triggers the more-than-one-A warning. A non-member with A on the step does. A step `raci` entry for a member is a warning, and the committee's letter wins, so a member's part is stated in one place.
- **Committee-level checks** carry the "joint" meaning: no A member is a warning (who decides?), one A member is a warning (that's a single owner, so use a role owner with RACI), and A members from only one party is a warning (a team?).
- **Display.** Members are written out with the existing letter words (Accountable, Consulted and so on). When there are several A members, each reads "Accountable, jointly".
- Considered and rejected:
  - the committee as a single A with members as "Member" (the earlier recommendation), because it hides who is actually accountable;
  - per-step member letters, because nothing asks for them yet. They can be added later by relaxing the member-on-step warning.

### D5. Overview: no committee list *(resolves open question 3; confirmed)*
Committees are reached from swimlane lane headers, step detail, role profiles and search. An overview list was left out (Ponytail: unrequested surface). If wanted later, it's a small additive change beside the structure list.

### D6. Any step can be committee-owned *(resolves open question 4)*
The engine has no decision node type. Restricting committees to "decisions" would mean inventing one (e.g. "has labelled `next`"), and joint working sessions are a real case. Allowing any step needs no code at all.

### D7. Owner resolution
- **Folder:** `ref()` for `owner` accepts type `role` or `committee`. The "Did you mean" candidates are the ids of both types.
- **Sheet:** `find()` for Owner looks up roles, then committees. `## Committees` is parsed like Personas: a table whose `Members` cell is split by semicolons, each item read as `<role name> (<letter>)`, the name resolved with `find('role', …)` and the letter checked like a RACI cell, with column spec `[['Committee','name',1],['Members','members',1],['Summary','summary'],…CHANGE, ID]`.
- **Name clash:** the sheet's same-derived-id rule (append the type) does **not** apply between role and committee. Instead, `names.role` and `names.committee` are checked against each other and a clash is an error naming both rows.
- The normalised step gets `ownerType: 'role' | 'committee'`, so viewer code branches on a field instead of looking up the type each time.

### D8. Step party and cross-party handoffs
- A committee-owned step has `party: null` and `parties: [...]`: the distinct parties of its members, in model order.
- In `flow()`, `crossParty` for an edge becomes "the two ends' party sets are not the same single party". With a set of one for role steps, this reduces to today's rule.
- The legend is unchanged.

### D9. Viewer integration
- **Members panel (the user's "window"):** clicking or pressing Enter on a committee step opens the existing step detail side panel, as for every step. For committee steps it leads with the committee name, the badge, and a members block with one heading per party (mark and name) listing each member and their letter. Reusing the detail panel keeps the URL, Back, Escape and focus behaviour that the keyboard and deep-link specs already cover. A separate pop-up would duplicate it.
- **Badge:** `By ${L.lower('committee')}` on the node (below the step name, using the existing badge pill) and in step detail. "Your committee" uses `Your ${L.lower('committee')}`, the same pattern as "Your role".
- **Accessible name:** `stepLabel()` appends ", by committee: <name>" for committee steps.
- **Phone list:** `flowList()` shows the committee name and badge in place of "Role · Party", without members, following the same rule as the lane header.
- **Committee page:** the generic element page (`#/e/<id>`), extended for type `committee` with members by party and owned steps by process. It needs no new route.
- **Role profile:** a "Committees" list with the role's letter in each. The steps list includes the committee's steps, with that letter.
- **Persona:** `mine(laneId)` is true for a committee lane when any member is a persona role. A step's `cue()` is true when the persona role is a member of the owning committee.
- **Search:** committees are indexed as elements, so this is automatic once the type has a label.
- **Labels:** add `['committee', 'committees']` to `LABEL_PAIRS`, with the defaults "Committee" and "Committees".

### D10. Sample
- Add `examples/acme-sample/committees/bid-board.md` ("Acme + Globex bid board": Account lead A, Partner manager A, Solution architect C, Bid manager I).
- "Go or no-go" gets `owner: bid-board`, and its own RACI is removed, because all four roles are now committee members. The step detail therefore reads the same as today's RACI, plus the joint A.
- The capture sheet gains a matching `## Committees` table, Owner `Acme + Globex bid board` on row 3, and an empty RACI row 3. Parity and the private-names guard cover it.
- A fictional `tests/skill-packs/joint-decision/` pack drives the skill trial.

## Risks / Trade-offs

- [The committee lane shows the step one lane away from the members' own lanes] → Each member's own lane carries a "<Committee> member · <letter>" tag, the persona cue marks both lanes, and opening the step lists the members by organisation. Nothing relies on adjacency.
- [Member lanes now carry a membership line, so they aren't compact] → This is the requested behaviour, and the line only appears in processes where that committee owns a step.
- [A v1.3 engine reports committee owners as unknown roles, which is an error] → The skill bundles its matching engine, and the release notes say that models using committees need 1.4.0.
- [Several A members could be read as "nobody's accountable"] → "Accountable, jointly" is written out. The one-A-member warning catches committees that aren't really joint, and the authoring guide explains when to use a committee and when to use one owner.
- [The by-committee wording relies on `L.lower`, so an acronym label like "SteerCo" reads "By steerco"] → This is the same behaviour as "Your role" today. Accepted.

## Migration Plan

The change is additive. Existing folders and sheets load unchanged, and the capture-sheet format stays at 1. It ships as release 1.4.0, with the skill folder rebuilt and versions bumped together. To roll back, use the 1.3.0 engine. Snapshots already exported are unaffected.

## Open Questions

None. D3–D6 are confirmed with the user (2026-10-05).
