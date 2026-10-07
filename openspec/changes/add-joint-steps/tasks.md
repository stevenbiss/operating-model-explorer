# Tasks

## 1. Build

- [x] 1.1 Schema and load (D2): `owner` as a string or a list of role ids in `process.schema.json`; normalise `owners`, `owner` (primary), `joint` and `parties` in `load.js` and `snapshot.js`. Verify with unit tests
- [x] 1.2 Validation and sheet (D2): every owner in a list is a role (committee → error), no duplicates, reference checks with suggestions; the sheet Owner cell split on `;`; folder/sheet parity. Verify with unit tests in `validate.test.js` and `sheet.test.js`
- [x] 1.3 Layout (D3): twin placements per owner lane at one rank with per-lane slots; the step once in `order`. Verify with unit tests in `layout.test.js` (adjacent and non-adjacent owner lanes, a step already in an owner lane at that rank)
- [x] 1.4 Rendering (D4): twin boxes with "Joint" pills; a focusable primary and `aria-hidden` click-through twins; the dotted tie in the gap left of the column; connectors attached to the nearest twin; cross-party by party set. Verify manually at 1280, light and dark, and with a unit render test that the tie crosses no box
- [x] 1.5 Viewer pages (D5): step detail owners plus "Joint", role profiles, persona emphasis on all twins, search once, phone list label. Verify manually at 1280 and 375
- [x] 1.6 Fixtures (fictional): `joint-basic` (adjacent owner lanes), `joint-far` (non-adjacent owner lanes with a step in between in the same column), `joint-invalid` (a committee among owners; a duplicate role), `sheet-joint`. Verify each gives exactly its intended messages
- [x] 1.7 Sample, skill, docs (D6): "Kick off the bid" joint in both forms (parity); a SKILL.md note; the capture-sheet format, the authoring guide and the template. Verify that both forms give 0 errors and 0 warnings, and that the parity, skill-folder-current and doc-example tests pass
- [x] 1.8 Version 1.9.0 in `package.json` and `package-lock.json`. Verify with the version test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://` at 1280×800; `@mobile` scenarios also run at 375×812. Node tests cover the schema, sheet, validation and layout.

### joint-steps
- [ ] 2.1 Joint step loads
- [ ] 2.2 Committee among joint owners
- [ ] 2.3 Same role twice
- [ ] 2.4 Parallel boxes with a dotted tie
- [ ] 2.5 Connectors attach to the nearest box
- [ ] 2.6 Owners in non-adjacent lanes
- [ ] 2.7 Step detail lists the owners
- [ ] 2.8 Role pages
- [ ] 2.9 Persona emphasis
- [ ] 2.10 Phone list (@mobile)
- [ ] 2.11 One Tab stop
- [ ] 2.12 Accessible name
- [ ] 2.13 Sample joint step loads

### content-schema
- [ ] 2.14 Owner list in a file
- [ ] 2.15 Unknown role in an owner list

### capture-sheet
- [ ] 2.16 Joint owners in a sheet
- [ ] 2.17 Unknown name in the Owner list

- [ ] 2.18 The full existing suite (`npm run test:unit` and `npm test`) still passes

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement against the running engine and a snapshot at 1920, 1280 and 375, light and dark, plus a regression pass over the swimlane (labels, committees, idle members, drag to pan, keyboard). It returns VERIFIED. The report is saved to `reports/html-verifier.md`
- [ ] 3.2 Confirm there are no real names in the repo

## 4. QA

- [ ] 4.1 html-qa final gate: axe at 1920, 1280 and 375; twin-box and tie polish, light and dark; connector attachment and label interplay; security (markup in role names on twins); `/code-review` and a Ponytail audit. It returns SHIP. The report is saved to `reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, export the Acme demo snapshot, and publish release 1.9.0 with the three standard assets and checksums
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
