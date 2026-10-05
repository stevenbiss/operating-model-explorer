# Tasks

## 1. Build

- [x] 1.1 Add `schema/committee.schema.json` (D2): id, type, name, summary, members (role id → R/A/C/I, `minProperties: 1`) and change. Register it in `src/model/schemas.js`, and change the step `owner` description in `process.schema.json` to "role or committee". Verify that `docs/content-reference.md` gains a committee section after `npm run build`, and that the schema unit tests pass
- [x] 1.2 Committee checks in `src/model/validate.js` (D2, D4, D7):
  - owner resolved against roles and committees, with "Did you mean" from both;
  - member references, and member letters with the one-letter wording;
  - the no-A, one-A and A-from-one-party warnings;
  - the owns-no-step warning, the role/committee same-name error and the removed-committee-owner warning.

  Verify with a unit test per message in `tests/unit/validate.test.js`
- [x] 1.3 Effective RACI and joint accountability (D4):
  - an `effectiveRaci(step)` helper that merges the committee's members with the step's non-member RACI;
  - `raciChecks()` treats a committee step's A members as one joint accountable;
  - warnings for a non-member A and for a member given a letter on the step.

  Verify with unit tests for joint A, a non-member I, a non-member A and a member letter on the step
- [x] 1.4 Normalise committees at load (D7, D8) in `load.js` and `snapshot.js`: `ownerType`, `parties` on committee steps, a `committeesOf[roleId]` map (with letters) and a `stepsOf[committeeId]` map. Verify with unit tests on a fixture model
- [x] 1.5 Committee lanes in `src/model/layout.js` `flow()` (D3, D8): members count as taking part, one committee group directly after the first party group with lanes in first-step order, committee-owned nodes in their committee's lane, and `crossParty` by party sets. Verify with unit tests in `tests/unit/layout.test.js`, including a process with no committees, whose layout must be unchanged
- [x] 1.6 Capture sheet (D7) in `src/model/sheet.js`:
  - the `## Committees` section and table (Committee, Members, Summary, Change, Today, ID);
  - `Members` items read as `<role> (<letter>)`, with errors for a missing or combined letter;
  - Owner cells resolved across roles and committees;
  - the role/committee name clash error naming both rows;
  - messages pointing into the sheet.

  Verify with unit tests in `tests/unit/sheet.test.js`
- [x] 1.7 Swimlane rendering in `src/viewer/swimlane.js` (D3, D9):
  - the committees group heading;
  - a committee lane header with its name and a link only (members only in the step panel, per the user's 2026-10-05 change);
  - a "<Committee> member · <letter>" line on each member's own lane header;
  - the "By committee" badge on nodes.

  Verify manually at 1280 in light and dark with the sample
- [x] 1.8 Viewer pages in `src/viewer/app.js` (D4, D9):
  - the step detail for committee steps leads with the committee name, the badge and the members block split by organisation (party heading with mark, member, letter word, "Accountable, jointly"), then the non-member RACI;
  - the committee element page (members by party with letters, owned steps by process, change badge);
  - the Committees list with letters and the committee steps on role profiles;
  - `stepLabel()` with "by committee", and the phone `flowList()` label.

  Verify by clicking through the sample at 1280 and 375
- [x] 1.9 Persona and labels (D9): "Your committee" on committee lanes, the step cue for members, the committee letter and committee name in "What matters for me", and `['committee', 'committees']` in `LABEL_PAIRS`, used by the heading, badge, cue, member line and search group. Verify with the sample persona "Acme account lead" and the theme unit tests
- [x] 1.10 Fictional sample (D10): `examples/acme-sample/committees/bid-board.md` (Account lead A, Partner manager A, Solution architect C, Bid manager I), "Go or no-go" owned by the bid board with no RACI of its own, and the same in `examples/acme-capture-sheet/capture-sheet.md` (Committees table, Owner, empty RACI row 3). Verify that both load with 0 errors and 0 warnings, and that the parity test and the private-names guard pass
- [x] 1.11 Test fixtures, all with fictional names: `committee-basic`, `committee-unknown-member`, `committee-member-letter`, `committee-no-a`, `committee-one-a`, `committee-one-party`, `committee-unused`, `committee-name-clash`, `committee-removed`, `committee-nonmember-a`, `committee-member-on-step`, `committee-labels`, `committee-two` and `sheet-committees`. Verify that each produces exactly its intended messages with `npm run validate`
- [x] 1.12 Docs:
  - `docs/capture-sheet.md`: the Committees section, member letters, and Owner naming a committee;
  - `docs/authoring-guide.md`: when to use a committee and when to use a single owner with RACI, and what joint accountability means;
  - `templates/capture-sheet.md`: a commented Committees section.

  Verify that the doc examples parse with `npm run validate`
- [x] 1.13 Authoring skill:
  - add a "Committees" step to SKILL.md: draft from joint-decision material, confirm the members and their letters, `(gap)` for unplaced members or unclear letters, and keep one owner when others are only consulted;
  - add a note under processes in `docs/interview-guide.md`;
  - add a fictional `tests/skill-packs/joint-decision/` pack and trial checklist entries in `tests/skill-packs/README.md`, then rebuild the skill folder.

  Verify with `npm run build` and the skill-folder-current unit test
- [x] 1.14 Version 1.4.0 in `package.json`, and the plugin manifest and skill through the build. Verify with the version unit test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at 1280×800, with `@mobile` scenarios also run at 375×812. Node tests cover the model, sheet and layout logic. Skill trials follow `tests/skill-packs/README.md`, and their results go in `reports/skill-trials.md`.

### committees
- [x] 2.1 Committee loads from a folder
- [x] 2.2 Committee with no members
- [x] 2.3 Member without a valid letter
- [x] 2.4 Unknown member
- [x] 2.5 No accountable member
- [x] 2.6 One accountable member
- [x] 2.7 Accountable members from one party
- [x] 2.8 Committee that owns nothing
- [x] 2.9 Same name as a role
- [x] 2.10 Committee owns a decision
- [x] 2.11 Committee owns a working step
- [x] 2.12 Joint accountability
- [x] 2.13 Others informed on the step
- [x] 2.14 A non-member marked A
- [x] 2.15 A member given a letter on the step
- [x] 2.16 Committee lane and badge
- [x] 2.17 Membership shown in the member's own lane
- [x] 2.18 Two committees in one process
- [x] 2.19 Lane header opens the committee
- [x] 2.20 Open the committee decision
- [x] 2.21 Handoff into a committee
- [x] 2.22 Committee page content
- [x] 2.23 Deep link to a committee
- [x] 2.24 Keyboard into a committee step
- [x] 2.25 Accessible name
- [x] 2.26 Mobile committee step (@mobile)
- [x] 2.27 Sample committee loads

### content-schema
- [x] 2.28 Minimal valid model
- [x] 2.29 Missing model file
- [x] 2.30 Brand packs are not elements
- [x] 2.31 Structure found by type, not folder
- [x] 2.32 Committee found by type, not folder
- [x] 2.33 Sample exercises every type
- [x] 2.34 Missing required field
- [x] 2.35 Duplicate id
- [x] 2.36 Structure and workstream cannot share an id
- [x] 2.37 Unknown owner
- [x] 2.38 Unknown owner close to a committee
- [x] 2.39 Unknown party on a line
- [x] 2.40 Live step with a removed owner
- [x] 2.41 Live step with a removed committee
- [x] 2.42 No accountable role
- [x] 2.43 Two accountable roles
- [x] 2.44 Committee counts as accountable
- [x] 2.45 Sample stays clean

### capture-sheet
- [x] 2.46 Acme capture sheet loads cleanly
- [x] 2.47 Missing required section
- [x] 2.48 Structure section recognised
- [x] 2.49 Committees section recognised
- [x] 2.50 Owner written with different case
- [x] 2.51 Unknown name with a suggestion
- [x] 2.52 Same name for a workstream and a process
- [x] 2.53 Same name for a role and a committee
- [x] 2.54 Committee owns a step in a sheet
- [x] 2.55 Unknown member in a sheet
- [x] 2.56 Member without a letter in a sheet
- [x] 2.57 Missing Members column

### explorer-views
- [x] 2.58 Lanes and steps
- [x] 2.59 Decision branches
- [x] 2.60 Cross-party handoff
- [x] 2.61 Process without committees
- [x] 2.62 Open and move along the flow
- [x] 2.63 Committee owner in the detail
- [x] 2.64 Role across processes
- [x] 2.65 Role in diagrams
- [x] 2.66 Role on a committee
- [x] 2.67 Find a step
- [x] 2.68 Find a person on a diagram
- [x] 2.69 Find a committee
- [x] 2.70 Mobile swimlane (@mobile)
- [x] 2.71 Open a party from search

### persona-lens
- [x] 2.72 Highlighted lanes
- [x] 2.73 Your committee
- [x] 2.74 Nothing hidden
- [x] 2.75 Summary contents
- [x] 2.76 Committee step in the summary
- [x] 2.77 What changes for me

### theming
- [x] 2.78 Rename workstream
- [x] 2.79 Rename structure
- [x] 2.80 Rename committee

### authoring-skill
- [x] 2.81 Joint decision becomes a committee (skill trial): walk-through, see reports/skill-trials.md
- [x] 2.82 Unplaced member (skill trial): walk-through, see reports/skill-trials.md

- [x] 2.83 The full existing suite (`npm run test:unit` and `npm test`) still passes, with no regressions in the swimlane, persona, brand, structure or labels tests

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement across the seven delta specs, plus a regression pass over the existing main specs, against the engine and an exported snapshot, with evidence. It reviews the skill-trial report and returns VERIFIED. The report is saved to `openspec/changes/add-committee-decisions/reports/html-verifier.md`
- [x] 3.2 Confirm there are no real names, clients or org data anywhere in the repo (private-names guard plus a repo search over `examples/`, `tests/` and `docs/`), and verify zero matches

## 4. QA

- [ ] 4.1 html-qa final gate:
  - security: markup and script in committee names, summaries and member names, all shown as text;
  - accessibility: axe on a swimlane with committee lanes at 1280 and 375, focus order, the committee step's accessible name, the members block and the lane-header membership text;
  - visual polish of the committee lanes and the members block in light and dark, with long committee names, 6+ members and two committees;
  - console and network, performance on a process with 3 committees and 30 steps;
  - `/code-review` and a Ponytail audit.

  It returns SHIP. The report is saved to `openspec/changes/add-committee-decisions/reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, then publish release 1.4.0 with the three standard assets and checksums, with release notes saying that models using committees need engine 1.4.0
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
