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
members: [account-lead, partner-manager]
---
Optional narrative.
```
- `schema/committee.schema.json` has `id`, `type`, `name`, `summary`, `members` (array of strings, `minItems: 1`) and `change`. It is registered in `schemas.js`, so the content reference gains a committee section on build.
- `process.schema.json`: the step `owner` description becomes "The id of the role or committee that owns this step."
- Ids are already unique across the model, so a committee and a role can never share an id in a folder. The name clash rule (committees spec) is a separate check on normalised names, run in validate.js for both forms.

### D3. Swimlane: a dedicated committee lane, not a spanning shape *(resolves the draft's open question 1, for confirmation)*
Each committee that owns a shown step gets its own lane. The committee lanes form one group placed **above** the party groups, headed by the committees label. The member roles also appear as ordinary lanes in their party groups, because membership counts as taking part.

Why not a step that spans its member lanes?
- Lanes are grouped by party. So the members of a cross-party committee, the normal case, are almost never next to each other. The spanning shape would then fall back to dotted ties most of the time, and would sit across non-member lanes in between.
- `flow()` assumes one lane per node. Spanning shapes would add new geometry to slots, rows, connector routing and the phone list.

A dedicated lane keeps all of that unchanged:
- the committee is one more lane key;
- `flow()` adds a group `{ committee: true, lanes: [committeeIds] }` before the party groups;
- every helper that today takes a role id takes a committee id as well.

The lane header shows the committee's name, then its members as "Role · Party" lines with each party's mark. Like a role's lane header, the name links to the committee page.

Placement above the party groups is a choice: the joint decision layer reads as sitting over each party's people, as a steering group does on an org slide. **If the user prefers the spanning shape**, the specs that change are committees › Committee lanes in the swimlane and explorer-views › L2 process swimlane, and tasks 1.4–1.5 grow by a geometry task.

### D4. RACI: the committee is the A, and members are "Member" *(resolves open question 2, for confirmation)*
- In `raciChecks()`, a step whose owner is a committee starts with that committee as accountable. Any role with A adds to the list, so the existing more-than-one-A warning fires and names the committee and the role.
- A member with no letter shows **"Member"** wherever a letter would be shown: the step detail RACI table, "What matters for me" and role profiles. It is not stored as a letter. It is derived at render time from membership, so the one-letter-per-cell rule and the sheet RACI table are untouched.
- R by default was rejected because it claims each member "does the work" separately, inflating R for people who only attend. Authors who mean R can still write it.

### D5. Overview: no committee list *(resolves open question 3, for confirmation)*
Committees are reached from swimlane lane headers, step detail, role profiles and search. An overview list was left out (Ponytail: unrequested surface). If wanted later, it's a small additive change beside the structure list.

### D6. Any step can be committee-owned *(resolves open question 4)*
The engine has no decision node type. Restricting committees to "decisions" would mean inventing one (e.g. "has labelled `next`"), and joint working sessions are a real case. Allowing any step needs no code at all.

### D7. Owner resolution
- **Folder:** `ref()` for `owner` accepts type `role` or `committee`. The "Did you mean" candidates are the ids of both types.
- **Sheet:** `find()` for Owner looks up roles, then committees. `## Committees` is parsed like Personas (a table with `Members` split by semicolons and resolved with `find('role', …)`), with column spec `[['Committee','name',1],['Members','members',1],['Summary','summary'],…CHANGE, ID]`.
- **Name clash:** the sheet's same-derived-id rule (append the type) does **not** apply between role and committee. Instead, `names.role` and `names.committee` are checked against each other and a clash is an error naming both rows.
- The normalised step gets `ownerType: 'role' | 'committee'`, so viewer code branches on a field instead of looking up the type each time.

### D8. Step party and cross-party handoffs
- A committee-owned step has `party: null` and `parties: [...]`: the distinct parties of its members, in model order.
- In `flow()`, `crossParty` for an edge becomes "the two ends' party sets are not the same single party". With a set of one for role steps, this reduces to today's rule.
- The legend is unchanged.

### D9. Viewer integration
- **Badge:** `By ${L.lower('committee')}` on the node (below the step name, using the existing badge pill) and in step detail. "Your committee" uses `Your ${L.lower('committee')}`, the same pattern as "Your role".
- **Accessible name:** `stepLabel()` appends ", by committee: <name>" for committee steps.
- **Phone list:** `flowList()` shows the committee name, badge and "Role (Party)" members in place of "Role · Party".
- **Committee page:** the generic element page (`#/e/<id>`), extended for type `committee` with members by party and owned steps by process. It needs no new route.
- **Role profile:** a "Committees" list. The steps list includes owned-by-my-committee steps, with "Member" or the letter.
- **Persona:** `mine(laneId)` is true for a committee lane when any member is a persona role. A step's `cue()` is true when the persona role is a member of the owning committee.
- **Search:** committees are indexed as elements, so this is automatic once the type has a label.
- **Labels:** add `['committee', 'committees']` to `LABEL_PAIRS`, with the defaults "Committee" and "Committees".

### D10. Sample
- Add `examples/acme-sample/committees/bid-board.md` ("Acme + Globex bid board", members Account lead and Partner manager).
- "Go or no-go" gets `owner: bid-board`, and its RACI becomes `bid-manager: I` only. The members show as "Member".
- The capture sheet gains a matching `## Committees` table, Owner `Acme + Globex bid board` on row 3, and an emptied RACI row 3 apart from Bid manager `I`. Parity and the private-names guard cover it.
- A fictional `tests/skill-packs/joint-decision/` pack drives the skill trial.

## Risks / Trade-offs

- [The committee lane shows the step one lane away from the members' own lanes] → The header lists the members with their parties, the persona cue marks both lanes, and the step detail repeats the members. Nothing relies on adjacency.
- [Member lanes with no steps of their own add height] → They use the existing compact lane height for roles that only take part.
- [A v1.3 engine reports committee owners as unknown roles, which is an error] → The skill bundles its matching engine, and the release notes say that models using committees need 1.4.0.
- [The "Member" text could be mistaken for a fifth RACI letter] → It's shown only for committee members on committee steps, never accepted as input, and the content reference explains it.
- [The by-committee wording relies on `L.lower`, so an acronym label like "SteerCo" reads "By steerco"] → This is the same behaviour as "Your role" today. Accepted.

## Migration Plan

The change is additive. Existing folders and sheets load unchanged, and the capture-sheet format stays at 1. It ships as release 1.4.0, with the skill folder rebuilt and versions bumped together. To roll back, use the 1.3.0 engine. Snapshots already exported are unaffected.

## Open Questions

None that affect the plan. D3–D5 are recommendations awaiting the user's confirmation before apply.
