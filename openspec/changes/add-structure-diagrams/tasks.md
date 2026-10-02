# Tasks

## 1. Build

- [x] 1.1 Add `schema/structure.schema.json` (D2): id, type, name, kind, summary, main, related, workstreams, recursive bands (id, name, opens, bands), boxes (band, role, team, name, note, change), lines (from and to as `{ band, party }`, label) and change. Register it in `src/model/schemas.js`. Verify that the generated `docs/content-reference.md` gains a structure section after `npm run build`, and that the schema unit tests pass
- [x] 1.2 Structure checks in `src/model/validate.js` (D3): band ids unique and nesting one level deep, no boxes in a parent band, exactly one of role or team, every reference resolved with "Did you mean", same-cell line error, repeated-line warning, self-relation warning, and the exactly-one-main rule across structures. Verify with a unit test per message in `tests/unit/validate.test.js`
- [x] 1.3 Normalise structures at load (D8): flatten the bands with their parents, work out each diagram's party columns, and build the `relatedOf`, `structuresOf` (per workstream) and `structuresOfRole` maps. Verify with unit tests on a fixture model
- [x] 1.4 Capture sheet `## Structure: <name>` section in `src/model/sheet.js` (D4): the Kind, Summary, Main, Related, Workstreams, Change, Today and ID lines, the Bands, Boxes, Lines and Notes subsections, band-name resolution within the section, and messages that point into the sheet. Verify with unit tests in `tests/unit/sheet.test.js`
- [x] 1.5 Pure `lineGeometry(cellRects, lines)` (D5), giving horizontal, vertical and edge-midpoint segments plus label positions, with parent-band cells as unions. Verify with unit tests in a new `tests/unit/structure-layout.test.js`
- [x] 1.6 Diagram renderer `src/viewer/structure.js` (D5): CSS grid, band labels with spanning parent bands and band "Open" links, party column headers with brand marks, boxes as buttons with name, note and team role lists, the visually hidden cell heading and "Related to" list, the SVG line overlay re-measured with ResizeObserver, and labels as pills. Verify manually at 1280 in light and dark, and with the sample
- [x] 1.7 Small screens and wide diagrams (D6): a CSS-only stacked layout below 768px, an `overflow-x: auto` container with a minimum column width at 768px and wider, and focused boxes scrolled into view. Verify manually at 375 and 1024
- [x] 1.8 Route and views (D7, D9): the `#/d/<id>` route and breadcrumb, the diagram page with its kind, summary, narrative and Related panel, the overview's structure list with the main one first, related diagrams on workstream pages, diagrams on role profiles, and box clicks opening the role or team. Verify by clicking through the sample
- [x] 1.9 Search, persona and change markers (D9): index box name and note text under the structure with a matched-text line, the "Your role" emphasis on boxes and team boxes, badges and Today text on structures and boxes, and removed boxes hidden while markers are off. Verify manually with the sample personas and change markers
- [x] 1.10 Labels (D9): add `structure`/`structures` to `LABEL_PAIRS` with the defaults "Structure" and "Structures", and use them in every structure UI string. Verify with the theme unit tests
- [x] 1.11 Fictional samples (D10): a main "Acme + Globex partnership" diagram and a "Harbour account" diagram, in `examples/acme-sample/structures/` and in `examples/acme-capture-sheet/capture-sheet.md`. Together they cover sub-bands, opens, a team box, name and note text, a labelled line, a related workstream and one `change` box. Verify that both load with 0 errors and 0 warnings, that the parity test passes and that the private-names guard passes
- [x] 1.12 Docs: `docs/capture-sheet.md` (the Structure section, its lines and tables, with an example), `docs/authoring-guide.md` (designing diagrams: bands, boxes, lines between neighbouring cells, main and related) and `templates/capture-sheet.md` (a commented Structure section). Verify that the doc examples parse with `npm run validate`
- [x] 1.13 Authoring skill: add a "Structure diagrams" step to SKILL.md (draft from org slides, the author's own band names, Name and Note columns, undirected lines, ask about main when unclear, open questions for anything unplaced) and to the interview order in `docs/interview-guide.md`. Add a fictional `tests/skill-packs/org-chart/` pack and trial checklist entries in `tests/skill-packs/README.md`, and rebuild the skill folder. Verify with `npm run build` and the skill-folder-current unit test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at 1280×800, with `@mobile` scenarios also run at 375×812. Node tests cover the model, sheet and geometry logic. Skill trials follow `tests/skill-packs/README.md`, and their results go in `reports/skill-trials.md`.

### structure-diagrams
- [x] 2.1 Diagram with author's own vocabulary
- [x] 2.2 Missing bands
- [x] 2.3 Sub-bands drawn inside their band
- [x] 2.4 Nesting too deep
- [x] 2.5 Box in a band with sub-bands
- [x] 2.6 Duplicate band id
- [x] 2.7 Box content
- [x] 2.8 Team box lists its roles
- [x] 2.9 Box names both a role and a team
- [x] 2.10 Same role in two bands
- [x] 2.11 Unused party has no column
- [x] 2.12 Line across parties
- [x] 2.13 Line down a column
- [x] 2.14 Line to the same cell
- [x] 2.15 Unknown role in a box
- [x] 2.16 Unknown related structure
- [x] 2.17 No main diagram
- [x] 2.18 Two main diagrams
- [x] 2.19 Model without diagrams
- [x] 2.20 Relation shown from both sides
- [x] 2.21 Drill down from a band
- [x] 2.22 Related workstream
- [x] 2.23 Deep link to a diagram
- [x] 2.24 Back from a drill-down
- [x] 2.25 Role box opens the role
- [x] 2.26 Your role marked
- [x] 2.27 Nothing hidden
- [x] 2.28 Removed box hidden by default
- [x] 2.29 Removed box with markers on
- [x] 2.30 Tab through a diagram
- [x] 2.31 Lines described as text
- [x] 2.32 Mobile diagram (@mobile)
- [x] 2.33 Many parties
- [x] 2.34 Sample diagrams load

### content-schema
- [x] 2.35 Minimal valid model
- [x] 2.36 Missing model file
- [x] 2.37 Structure found by type, not folder
- [x] 2.38 Sample exercises every type
- [x] 2.39 Missing required field
- [x] 2.40 Duplicate id
- [x] 2.41 Structure and workstream cannot share an id
- [x] 2.42 Unknown owner
- [x] 2.43 Unknown party on a line

### capture-sheet
- [x] 2.44 Acme capture sheet loads cleanly
- [x] 2.45 Missing required section
- [x] 2.46 Structure section recognised
- [x] 2.47 Missing required column
- [x] 2.48 Columns in a different order
- [x] 2.49 Lines table missing a column
- [x] 2.50 Structure written in a sheet
- [x] 2.51 Unknown band name in a box
- [x] 2.52 Role and team both filled
- [x] 2.53 Missing Bands subsection
- [x] 2.54 Sample parity

### explorer-views
- [x] 2.55 Overview content
- [x] 2.56 Main diagram first
- [x] 2.57 Outline workstream
- [x] 2.58 Related diagrams on a workstream
- [x] 2.59 Role across processes
- [x] 2.60 Role in diagrams
- [x] 2.61 Find a step
- [x] 2.62 Find a person on a diagram

### theming
- [x] 2.63 Rename workstream
- [x] 2.64 Rename structure

### authoring-skill
- [x] 2.65 Rich context gives a draft first
- [x] 2.66 Thin context starts an interview
- [x] 2.67 Org slides become structure sections
- [x] 2.68 Unclear main diagram

- [x] 2.69 The full existing suite (`npm run test:unit` and `npm test`) still passes, with no regressions in the swimlane, persona, brand or labels tests

## 3. Verify

- [x] 3.1 html-verifier checks every requirement across the six delta specs, plus a regression pass over the existing main specs, against the engine and an exported snapshot, with evidence. It reviews the skill-trial report and returns VERIFIED. The report is saved to `openspec/changes/add-structure-diagrams/reports/html-verifier.md`
- [x] 3.2 Confirm there are no real names, clients or org data anywhere in the repo (private-names guard plus a repo search over `examples/`, `tests/` and `docs/`), and verify zero matches

## 4. QA

- [x] 4.1 html-qa final gate:
  - security: markup and script in band names, box name and note text, line labels and kinds, all shown as text;
  - accessibility: axe on the diagram at 1280 and 375, focus order, the screen-reader cell text;
  - line geometry after resize and in dark mode;
  - console and network, performance on a diagram with 8 parties, 12 bands and 100 boxes, responsiveness, visual polish;
  - `/code-review` and a Ponytail audit.

  It returns SHIP. The report is saved to `openspec/changes/add-structure-diagrams/reports/html-qa.md`

## 5. Package

- [ ] 5.1 Build, export the Acme demo from its capture-sheet folder, rebuild the checksums, run the full tests, commit and push
- [ ] 5.2 Bump the version to 1.3.0 across the bundle, tag it, and publish the release with `gh` (skill zip, engine, demo; notes from the template, mentioning that v1.2 engines ignore Structure sections; checksums). Verify by downloading and checking the checksums
- [ ] 5.3 dist/operating-model-explorer.html built, self-contained, and README updated
