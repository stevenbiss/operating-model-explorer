# Tasks

## 1. Build

- [ ] 1.1 Add `schema/committee.schema.json` (D2): id, type, name, summary, members (array of role ids, `minItems: 1`) and change. Register it in `src/model/schemas.js`, and change the step `owner` description in `process.schema.json` to "role or committee". Verify that `docs/content-reference.md` gains a committee section after `npm run build`, and that the schema unit tests pass
- [ ] 1.2 Committee checks in `src/model/validate.js` (D2, D7): owner resolved against roles and committees with "Did you mean" from both, member references, the fewer-than-two-members warning, the one-party warning, the owns-no-step warning, the role/committee same-name error, and the removed-committee-owner warning. Verify with a unit test per message in `tests/unit/validate.test.js`
- [ ] 1.3 RACI rule (D4): `raciChecks()` counts an owning committee as the accountable, so any role A adds a second accountable and the warning names the committee and the role. Verify with unit tests for no-letters, member C, and role A on a committee step
- [ ] 1.4 Normalise committees at load (D7, D8) in `load.js` and `snapshot.js`: `ownerType`, `parties` on committee steps, a `committeesOf[roleId]` map and a `stepsOf[committeeId]` map. Verify with unit tests on a fixture model
- [ ] 1.5 Committee lanes in `src/model/layout.js` `flow()` (D3, D8): members count as taking part, a committee group before the party groups, committee-owned nodes in their committee's lane, and `crossParty` by party sets. Verify with unit tests in `tests/unit/layout.test.js`, including a process with no committees, whose layout must be unchanged
- [ ] 1.6 Capture sheet (D7) in `src/model/sheet.js`: the `## Committees` section and table (Committee, Members, Summary, Change, Today, ID), Owner cells resolved across roles and committees, the role/committee name clash error naming both rows, and messages pointing into the sheet. Verify with unit tests in `tests/unit/sheet.test.js`
- [ ] 1.7 Swimlane rendering in `src/viewer/swimlane.js` (D3, D9): the committees group heading, a committee lane header with name, link and members as "Role · Party" with marks, and the "By committee" badge on nodes. Verify manually at 1280 in light and dark with the sample
- [ ] 1.8 Viewer pages in `src/viewer/app.js` (D9): the committee owner in step detail, "Member" in the RACI table, the committee element page (members by party, owned steps by process, change badge), the Committees list and member steps on role profiles, `stepLabel()` with "by committee", and the phone `flowList()` label. Verify by clicking through the sample at 1280 and 375
- [ ] 1.9 Persona and labels (D9): "Your committee" on committee lanes, the step cue for members, "Member" in "What matters for me", and `['committee', 'committees']` in `LABEL_PAIRS`, used by the heading, badge, cue and search group. Verify with the sample persona "Acme account lead" and the theme unit tests
- [ ] 1.10 Fictional sample (D10): `examples/acme-sample/committees/bid-board.md`, "Go or no-go" owned by the bid board with RACI `bid-manager: I`, and the same in `examples/acme-capture-sheet/capture-sheet.md` (Committees table, Owner, RACI row 3). Verify that both load with 0 errors and 0 warnings, and that the parity test and the private-names guard pass
- [ ] 1.11 Test fixtures: `committee-basic`, `committee-unknown-member`, `committee-one-member`, `committee-one-party`, `committee-unused`, `committee-name-clash`, `committee-removed`, `committee-role-a`, `committee-labels` and `sheet-committees`, all with fictional names. Verify that each produces exactly its intended messages with `npm run validate`
- [ ] 1.12 Docs: `docs/capture-sheet.md` (the Committees section and Owner naming a committee), `docs/authoring-guide.md` (when to use a committee and when to use a single owner with RACI, and what "Member" means), and `templates/capture-sheet.md` (a commented Committees section). Verify that the doc examples parse with `npm run validate`
- [ ] 1.13 Authoring skill: a "Committees" step in SKILL.md (draft from joint-decision material, confirm the members, `(gap)` for unplaced members, keep one owner when others are only consulted) and a note in `docs/interview-guide.md` under processes. Add a fictional `tests/skill-packs/joint-decision/` pack and trial checklist entries in `tests/skill-packs/README.md`, then rebuild the skill folder. Verify with `npm run build` and the skill-folder-current unit test
- [ ] 1.14 Version 1.4.0 in `package.json`, and the plugin manifest and skill through the build. Verify with the version unit test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at 1280×800, with `@mobile` scenarios also run at 375×812. Node tests cover the model, sheet and layout logic. Skill trials follow `tests/skill-packs/README.md`, and their results go in `reports/skill-trials.md`.

### committees
- [ ] 2.1 Committee loads from a folder
- [ ] 2.2 Committee with no members
- [ ] 2.3 Unknown member
- [ ] 2.4 One member
- [ ] 2.5 Members from one party
- [ ] 2.6 Committee that owns nothing
- [ ] 2.7 Same name as a role
- [ ] 2.8 Committee owns a decision
- [ ] 2.9 Committee owns a working step
- [ ] 2.10 Committee lane and badge
- [ ] 2.11 Lane header opens the committee
- [ ] 2.12 Handoff into a committee
- [ ] 2.13 Committee is accountable
- [ ] 2.14 Member with a letter
- [ ] 2.15 A on a role as well
- [ ] 2.16 Committee page content
- [ ] 2.17 Deep link to a committee
- [ ] 2.18 Keyboard into a committee step
- [ ] 2.19 Accessible name
- [ ] 2.20 Mobile committee step (@mobile)
- [ ] 2.21 Sample committee loads

### content-schema
- [ ] 2.22 Minimal valid model
- [ ] 2.23 Missing model file
- [ ] 2.24 Brand packs are not elements
- [ ] 2.25 Structure found by type, not folder
- [ ] 2.26 Committee found by type, not folder
- [ ] 2.27 Sample exercises every type
- [ ] 2.28 Missing required field
- [ ] 2.29 Duplicate id
- [ ] 2.30 Structure and workstream cannot share an id
- [ ] 2.31 Unknown owner
- [ ] 2.32 Unknown owner close to a committee
- [ ] 2.33 Unknown party on a line
- [ ] 2.34 Live step with a removed owner
- [ ] 2.35 Live step with a removed committee
- [ ] 2.36 No accountable role
- [ ] 2.37 Two accountable roles
- [ ] 2.38 Committee counts as accountable
- [ ] 2.39 Sample stays clean

### capture-sheet
- [ ] 2.40 Acme capture sheet loads cleanly
- [ ] 2.41 Missing required section
- [ ] 2.42 Structure section recognised
- [ ] 2.43 Committees section recognised
- [ ] 2.44 Owner written with different case
- [ ] 2.45 Unknown name with a suggestion
- [ ] 2.46 Same name for a workstream and a process
- [ ] 2.47 Same name for a role and a committee
- [ ] 2.48 Committee owns a step in a sheet
- [ ] 2.49 Unknown member in a sheet
- [ ] 2.50 Missing Members column

### explorer-views
- [ ] 2.51 Lanes and steps
- [ ] 2.52 Decision branches
- [ ] 2.53 Cross-party handoff
- [ ] 2.54 Process without committees
- [ ] 2.55 Open and move along the flow
- [ ] 2.56 Committee owner in the detail
- [ ] 2.57 Role across processes
- [ ] 2.58 Role in diagrams
- [ ] 2.59 Role on a committee
- [ ] 2.60 Find a step
- [ ] 2.61 Find a person on a diagram
- [ ] 2.62 Find a committee
- [ ] 2.63 Mobile swimlane (@mobile)
- [ ] 2.64 Open a party from search

### persona-lens
- [ ] 2.65 Highlighted lanes
- [ ] 2.66 Your committee
- [ ] 2.67 Nothing hidden
- [ ] 2.68 Summary contents
- [ ] 2.69 Committee step in the summary
- [ ] 2.70 What changes for me

### theming
- [ ] 2.71 Rename workstream
- [ ] 2.72 Rename structure
- [ ] 2.73 Rename committee

### authoring-skill
- [ ] 2.74 Joint decision becomes a committee (skill trial)
- [ ] 2.75 Unplaced member (skill trial)

- [ ] 2.76 The full existing suite (`npm run test:unit` and `npm test`) still passes, with no regressions in the swimlane, persona, brand, structure or labels tests

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement across the seven delta specs, plus a regression pass over the existing main specs, against the engine and an exported snapshot, with evidence. It reviews the skill-trial report and returns VERIFIED. The report is saved to `openspec/changes/add-committee-decisions/reports/html-verifier.md`
- [ ] 3.2 Confirm there are no real names, clients or org data anywhere in the repo (private-names guard plus a repo search over `examples/`, `tests/` and `docs/`), and verify zero matches

## 4. QA

- [ ] 4.1 html-qa final gate:
  - security: markup and script in committee names, summaries and member names, all shown as text;
  - accessibility: axe on a swimlane with a committee lane at 1280 and 375, focus order, the committee step's accessible name, and the lane header's member text;
  - visual polish of the committee lane in light and dark, and with long committee names and 4+ members;
  - console and network, performance on a process with 3 committees and 30 steps;
  - `/code-review` and a Ponytail audit.

  It returns SHIP. The report is saved to `openspec/changes/add-committee-decisions/reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, then publish release 1.4.0 with the three standard assets and checksums, with release notes saying that models using committees need engine 1.4.0
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
