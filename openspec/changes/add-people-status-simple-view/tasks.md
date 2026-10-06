# Tasks

## 1. Build

- [x] 1.1 Schemas (D2): `people` (array of strings) on `role.schema.json`, `status` (`under-review` | `agreed`) on `process.schema.json` and `structure.schema.json`, and `view` (`simple` | `detailed`) on `model.schema.json`. Apply the defaults at load in `load.js` and carry the fields through `snapshot.js`. Verify that the content reference gains the fields after `npm run build`, and that the schema and validate unit tests cover each invalid value
- [x] 1.2 Capture sheet (D2) in `src/model/sheet.js`:
  - a `People` column on Roles, split by `;`;
  - a `Status:` line in Process and Structure sections, with normalised values and an error for others;
  - a `View:` line in the title block, with an error for others.

  Verify with unit tests in `tests/unit/sheet.test.js`, including folder/sheet parity
- [x] 1.3 People line (D3): a `peopleLine(role)` helper, used in:
  - swimlane lane headers (`swimlane.js`, using the existing wrap and height logic);
  - `roleChip`, the step-detail owner, RACI rows and committee member lists;
  - structure role boxes and team-box role lists (box `name` wins);
  - the phone `flowList()`.

  Verify manually at 1280 and 375 in light and dark with a fixture that has roles with 0, 1 and 2 people
- [x] 1.4 People pop-up (D4): one delegated `#om-people-tip` tooltip.
  - Triggers: hover with a 150ms delay, and keyboard focus with no delay.
  - Closes on pointer-out, focus-out, Escape, scroll and `pointerdown`.
  - Positioned next to the element and kept inside the window.
  - Each role element with people gets `data-people` and `aria-describedby` pointing to a hidden people span.
  - The role page gets a "People" section.

  Verify manually by hovering and tabbing in the swimlane, chips and structure boxes, near window edges, and with a screen reader name check in Playwright
- [x] 1.5 Status (D5): a `statusBadge()` helper used on:
  - the process and structure page headers;
  - process and structure cards, related-diagram entries, role, committee and "What matters for me" process groupings;
  - search results.

  Add the under-review notice above the swimlane and the diagram, and the styles (AA in both themes, distinct from change badges). Verify manually and with an axe contrast check
- [x] 1.6 Home page (D6): `overview()` with the new section order, a new processes section (workstream order, workstream eyebrow, status), and the Simple and Detailed views from `M.model.view` or the author preview override. Verify manually with the sample (Simple) and a Detailed variant at 1280 and 375
- [x] 1.7 Author-mode toggle (D7): the "Published home page: … view" line and a "Preview … view" toggle (`aria-pressed`) in the preview head. It re-renders the preview only, and export is unaffected. Verify manually: toggle, then export, then open the snapshot and see Simple
- [x] 1.8 Fixtures, fictional names only:
  - `people-mix`: roles with 0, 1 and 2 people, a structure box with its own name, and one role near the right edge of a wide swimlane;
  - `status-mix`: one agreed and one under-review process, and agreed and under-review structures;
  - `status-invalid`;
  - `view-detailed`;
  - `view-invalid`;
  - `people-not-list`;
  - `sheet-people-status-view`.

  Verify that each gives exactly its intended messages with `npm run validate`
- [x] 1.9 Acme sample (D8), in both forms and in parity: people on Account lead (1), Partner manager (1) and Solution architect (2), "Qualify an opportunity" marked `Status: Agreed`, and no `View:` line. Verify that both load with 0 errors and 0 warnings, and that the parity test and the private-names guard pass
- [x] 1.10 Docs and skill (D8):
  - `docs/capture-sheet.md`: People, Status and View;
  - `docs/authoring-guide.md`: people, when to mark agreed, Simple vs Detailed;
  - `templates/capture-sheet.md`: commented People column, Status and View lines;
  - SKILL.md: a "People and status" step;
  - a trial checklist entry in `tests/skill-packs/README.md`, then rebuild the skill folder.

  Verify that the doc examples parse with `npm run validate`, and that the skill-folder-current test passes
- [x] 1.11 Version 1.6.0 in `package.json` and `package-lock.json`, with the plugin and skill updated through the build. Verify with the version unit test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at 1280×800 unless a scenario says otherwise. `@mobile` scenarios also run at 375×812. Node tests cover schema, sheet and model logic. Skill trials follow `tests/skill-packs/README.md`, run in a fresh context with only the skill and the pack, with results in `reports/skill-trials.md`.

### role-people
- [x] 2.1 Role with people loads
- [x] 2.2 Markup in a name
- [x] 2.3 One person
- [x] 2.4 Several people
- [x] 2.5 Box with its own name text
- [x] 2.6 No people
- [x] 2.7 Hover shows the names
- [x] 2.8 Keyboard shows the names
- [x] 2.9 Screen-reader description
- [x] 2.10 Pop-up stays on screen
- [ ] 2.44 No pop-up on a box with its own name (role-people; added after QA)
- [x] 2.11 Role page lists people
- [x] 2.12 Mobile people line (@mobile)
- [x] 2.13 Sample people load

### review-status
- [x] 2.14 Default is under review
- [x] 2.15 Agreed in a sheet
- [x] 2.16 Invalid status
- [x] 2.17 Badges on the home page
- [x] 2.18 Badge on the page
- [x] 2.19 Badge in search
- [x] 2.20 Notice on an under-review process
- [x] 2.21 No notice when agreed
- [x] 2.22 Mobile status (@mobile)
- [x] 2.23 Sample statuses

### explorer-views
- [x] 2.24 Overview content
- [x] 2.25 Detailed view
- [x] 2.26 Key messages still reachable in Simple view
- [x] 2.27 Processes listed on the home page
- [x] 2.28 Main diagram first
- [x] 2.29 Home page on a phone (@mobile)

### content-schema
- [x] 2.30 Invalid view
- [x] 2.31 People must be a list
- [x] 2.32 Reference lists the fields

### capture-sheet
- [x] 2.33 People from the sheet
- [x] 2.34 Unknown status value
- [x] 2.35 Detailed from the sheet
- [x] 2.36 Unknown view value

### author-mode
- [x] 2.37 Reload after an edit
- [x] 2.38 Preview the other view
- [x] 2.39 Export ignores the preview toggle
- [x] 2.40 Keyboard toggle

### authoring-skill
- [x] 2.41 People drafted, status left as review (skill trial)
- [x] 2.42 Agreed when told (skill trial)

- [x] 2.43 The full existing suite (`npm run test:unit` and `npm test`) still passes. Existing overview tests are updated only where the new Simple default changes what the home page shows

## 3. Verify

- [x] 3.1 html-verifier checks every requirement in the seven delta specs against the running engine and an exported snapshot at 1920, 1280 and 375, reviews the skill-trial report, and does a regression pass over the main specs. It returns VERIFIED. The report is saved to `openspec/changes/add-people-status-simple-view/reports/html-verifier.md`
- [x] 3.2 Confirm there are no real names anywhere in the repo (private-names guard plus `git grep -iw` for common real company names)

## 4. QA

- [x] 4.1 html-qa final gate:
  - security: markup and script in people names, status values and view values, all shown as text;
  - accessibility: axe at 1920, 1280 and 375, tooltip behaviour (WCAG 1.4.13: dismissable, hoverable, persistent), badge contrast, focus order with the preview toggle;
  - visual polish of people lines, pop-ups, badges and the two home views, in light and dark;
  - performance on a 30-step process where every role has people;
  - `/code-review` and a Ponytail audit.

  It returns SHIP. The report is saved to `openspec/changes/add-people-status-simple-view/reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, export the Acme demo snapshot from the capture sheet, and publish release 1.6.0 with the three standard assets and checksums. The release notes explain the new Under review and Simple defaults and the one-line opt-outs
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
