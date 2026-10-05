# Proposal: Committee decisions ("By committee")

## Why

Some steps in a joint operating model are not owned by one role. They are **decided by a group of people drawn from more than one party**: a go/no-go on a joint pursuit, a readiness check before a pitch, a steering decision. Authors meet this as soon as they map real partnership processes.

Today every step needs exactly one `Owner` role, and every role belongs to one party. So authors either pick one member as the owner (which misstates who decides), split the step into one half per party joined by a labelled connector (which turns one decision into two steps), or invent a fake "joint" party to hold a committee role (which pollutes the party list and the structure diagrams). None of these show the real relationship: one decision, made together, by named roles on both sides.

A first-class **committee** gives authors a semantic for "By committee" decisions, and gives viewers a clear picture of who decides together.

## Who uses it and how it's shared

- **Authors (colleagues):** define committees in the capture sheet (a `## Committees` table) or as `committee` files in a content folder, and name a committee as a step's owner. The operating-model-author skill drafts committees from material that shows joint decisions. They export as today.
- **Viewers (colleagues and clients):** receive the exported snapshot HTML as before (email, Teams, file share). In the process view they see committee-owned steps in a committee lane whose header names the committee and its members from each party, marked "By committee". Nothing changes about how the file is opened or shared.

## What Changes

- **A new element type, `committee`:** a name, an optional summary and a list of **member roles**, which may come from any parties. A committee is not a party and has no brand.
- **Steps can be owned by a committee.** A step's `Owner` may name a committee instead of a role. Names are resolved across roles and committees, so a role and a committee can't share a name. Any step may be committee-owned, not only decisions.
- **Process view** (design D3; the draft's open question 1, for confirmation):
  - each committee that owns a shown step gets **its own lane**, placed **in the middle, between the two parties**. A process can have several committees; their lanes sit together in that middle block under one "Committees" heading. The lane header shows the committee's name and its members, grouped by party with each party's mark;
  - a committee-owned step sits in that lane with a "By committee" badge;
  - the member roles still get their own lanes, as roles that take part, so each party's people stay visible;
  - decision branches (`Next` labels) leave the committee step as from any other step. A handoff into or out of a committee step is cross-party when the committee has a member from a party other than the other step's party.
- **RACI** (design D4; open question 2, for confirmation): a committee-owned step counts the **committee as accountable (A)**, so the one-A rule is met without a role column. Members with an empty cell are shown as **"Member"**, not given a letter. Authors can still set R, C or I for a member. An A on any role is a second accountable.
- **Viewer pages:** a committee page lists its members by party and the steps it owns. A role's profile lists the committees it sits on and their steps. The step detail shows the committee as owner with its members. Search covers committee names and summaries. Committees aren't listed on the overview (open question 3, for confirmation).
- **Personas:** with a persona selected, a committee that includes one of the persona's roles has its lane marked "Your committee" and its steps emphasised. Those steps appear in "What matters for me" as "Member", or with the member's own letter.
- **Validation:**
  - a member that isn't a known role is an error, with "Did you mean";
  - a committee with fewer than two members is a warning;
  - a committee whose members all belong to one party is a warning (it may be meant as a team);
  - a committee that owns no step is a warning;
  - a name shared by a role and a committee is an error;
  - a live step owned by a removed committee is a warning, as it is for removed roles.
- **Labels:** the terms `committee`/`committees` can be renamed per model, like the other terms (for example "Steering group"). The badge text follows the label ("By steering group").
- **Capture sheet:** a new optional `## Committees` table with `Committee`, `Members` (role names separated by semicolons) and `Summary` columns, plus the usual optional `Change`, `Today` and `ID` columns. `Owner` cells may name a committee. The format stays at 1, because the change is additive.
- **Authoring skill:** when material shows a decision taken jointly by people on both sides (a shared decision diamond, "steering group decides", "by committee"), the skill drafts a committee and asks the author to confirm its members, instead of picking one owner. Members it can't place are open questions.
- **Samples:** the Acme sample (folder and capture sheet, kept in parity) gains one committee, the "Acme + Globex bid board" (Account lead and Partner manager), which owns "Go or no-go" in "Qualify an opportunity". Fictional names only.

## Capabilities

### New Capabilities
- `committees`: the committee element, its validation rules, the committee lane and "By committee" step in the process view, the committee page, the RACI rule for committee-owned steps, persona highlight, keyboard and screen-reader access, and the small-screen layout.

### Modified Capabilities
- `content-schema`: `committee` added to the element types and folder layout; `owner` on a step may reference a committee; member references added to reference checking; the one-A rule counts the owning committee; removed committees as owners.
- `capture-sheet`: the `## Committees` table added to the recognised sections; `Owner` resolution across roles and committees.
- `explorer-views`: the swimlane's committee lanes, committee owners in step detail, committees on role profiles, committee names in search, committee pages.
- `persona-lens`: "Your committee" highlight, and committee steps in "What matters for me".
- `theming`: `committee`/`committees` added to the renameable terms.
- `authoring-skill`: drafting committees from joint-decision material.

## Non-goals

- Voting rules, quorum, chairs or decision thresholds.
- Meeting cadence or scheduling (meetings stay free text in step descriptions).
- People as members. Members are roles; names stay text on structure boxes.
- Committees made of other committees, or teams as members.
- Committee boxes on structure diagrams. This could come later, as a box that spans party columns.
- A committee list on the overview (committees are reached from lanes, steps, role profiles and search).
- Drawing a step as one shape spanning several member lanes (considered and set aside in design D3).
- Any real names, brands or org data in this public repo, including examples and tests.

## Impact

- **Schema and docs:** new `schema/committee.schema.json`; the step `owner` description in `process.schema.json`; the generated `docs/content-reference.md`; `docs/capture-sheet.md`, `docs/authoring-guide.md`, `templates/capture-sheet.md`.
- **Model:** `src/model/validate.js` (references, owner resolution, committee checks, RACI rule), `src/model/sheet.js` (Committees section, Owner resolution), `src/model/layout.js` (committee lanes), `src/model/load.js` / `snapshot.js` (committees in the normalised model), `src/model/theme-check.js` (labels).
- **Viewer:** `src/viewer/swimlane.js` (committee lane and badge), `src/viewer/app.js` (step detail, committee page, role profile, search, persona, mobile flow list).
- **Samples and tests:** both Acme forms, new fixtures, unit and e2e tests, a fictional skill pack, and the skill folder rebuilt.
- **Compatibility:** additive. Existing models and sheets load unchanged. A v1.3 engine warns about an unknown `## Committees` section and reports a committee owner as an unknown role, so models that use committees need this engine (the skill bundles it). Release 1.4.0.
