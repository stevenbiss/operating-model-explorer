# Tasks

## 1. Build

- [x] 1.1 Update `examples/acme-sample/` so every step has exactly one role marked A (design D6), update any existing tests that assert sample RACI letters, and verify `npm test` and `npm run test:unit` stay green
- [x] 1.2 Add the RACI checks to `src/model/validate.js`: combined letters give the specific R-or-A error (no generic enum message), and no-A / two-A give warnings (D6). Verify with unit tests for each case, on folder content
- [x] 1.3 Generalise the validator for non-folder sources: "exactly one model document" instead of a `model.md` path check, and messages that print `where` when present (D2). Verify that all existing unit and e2e tests still pass unchanged
- [x] 1.4 Write `docs/capture-sheet.md`, the format spec: every section, table and column (required or optional), name matching, `Next` syntax, RACI matrix, theme keys, Notes, Open questions, Sources, with examples. Verify each example block parses once 1.5 exists (checked in 1.8)
- [x] 1.5 Implement `src/model/sheet.js` `sheetToDocs(text)` using the markdown-it token stream (D1, D2, D4): sections, tables by column name, id derivation, name matching with `closest()`, steps with `Next`, RACI matrix, personas and `Starts at`, theme lines, Notes, narrative, HTML comments dropped, and `meta.openQuestions` / `meta.sources`. Every message carries a `where`. Verify with unit tests per section type
- [x] 1.6 Route sheets through `loadModel` (D3): detect a sheet as a single file or inside a folder/zip, read `assets/` alongside, and report mixed formats as an error. Verify with unit tests loading a sheet file, a folder containing a sheet, and a mixed folder
- [x] 1.7 Write `examples/acme-capture-sheet/capture-sheet.md` describing exactly the sample model (no ids, names only), and the parity unit test (D9) that normalises both models by name and asserts deep equality. Verify the parity test passes
- [x] 1.8 Write `templates/capture-sheet.md`, the blank template with guidance as HTML comments. Add unit checks that the template loads without crashing and that the format spec's examples parse. Verify both
- [x] 1.9 Author mode: add "Load capture sheet" (single-file picker, keyboard operable), accept a dropped single `.md` file, add an "Open questions (N)" report group, and link to `docs/capture-sheet.md` content from the content reference (bundled at build time, offline). Verify manually against the sample sheet at 1280 and 768
- [x] 1.10 Make sure snapshots exclude sheet meta and comments (D5). Verify an exported sample sheet snapshot contains no Open questions, Sources or comment text
- [x] 1.11 Add `scripts/validate.mjs` and `npm run validate -- <path>` for a sheet, folder or zip (D7): grouped output, counts, exit code 1 on errors. Verify on the sample sheet, the sample folder and an error fixture
- [ ] 1.12 Write `docs/interview-guide.md`: question order, draft vs interview, gap/assumption/contradiction checks and tags, RACI coaching (one letter; R vs A), revision rules (propose, don't overwrite), and handover. Keep it free of Claude-specific terms. Verify by review against the authoring-skill spec
- [ ] 1.13 Write `skills/operating-model-author/SKILL.md` (D8): a trigger description, the workflow (read context, decide draft vs interview, draft, ask, record open questions and sources, validate, hand over), the output-location rule including the public-repo warning, and pointers to `references/`. Verify by review against every authoring-skill requirement
- [ ] 1.14 Extend `scripts/build.mjs` to generate the skill folder in place (D8, D11): copy the four references to `skills/operating-model-author/references/`, write the bundled self-contained validator to `scripts/validate.mjs`, copy the built engine to `engine/operating-model-explorer.html`, add "generated" notes, then zip the folder to `dist/operating-model-author.zip`. Verify the zip's contents, that the bundled validator runs from an empty folder, and that a second build changes nothing
- [ ] 1.15 Create the fictional skill trial packs in `tests/skill-packs/` (`rich/`, `thin/`, `contradictions/` with conflicting owners and an `A/R` cell, `revision/`) and `tests/skill-packs/README.md` with the scripted trial checklist per pack (D10). Verify the packs contain no real company names (private-names guard)
- [ ] 1.16 Version stamping (D11): take the version from `package.json` and stamp it into the engine (shown in author mode and the snapshot footer), the validator's output, a generated line in `SKILL.md` and `.claude-plugin/plugin.json`. Verify with a unit test that all of them match
- [x] 1.17 Capture sheet format version (D11): parse `Format: <n>` in `sheet.js`; a newer format is an error naming the minimum engine, and a missing line is a warning. Add `Format: 1` to the template, the Acme sheet and the format spec. Verify with unit tests
- [ ] 1.18 Add `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` at the repo root, following the Ponytail layout (D11), and make SKILL.md tell the colleague to copy the bundled engine next to their sheet at handover. Verify both JSON files parse and name `skills/operating-model-author`
- [ ] 1.19 Add a release notes template (`docs/release-notes-template.md`: which file to use when, install steps for Claude Code and claude.ai, and a checksums placeholder) and a small checksum step in the build that writes `dist/SHA256SUMS`. Verify the checksum of the engine inside the zip equals that of the standalone engine
- [ ] 1.20 Update `README.md` (for authors: the capture sheet route, and installing the skill from GitHub via `/plugin marketplace add stevenbiss/operating-model-explorer` or by uploading the zip to claude.ai; for developers: `npm run validate`, the parity test, skill trials) and `docs/authoring-guide.md` (point to the capture sheet as the easy route). Verify the documented commands run as written

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`. Node tests cover the command-line validator and the package. Skill trials follow `tests/skill-packs/README.md`, and their results are recorded in `openspec/changes/add-capture-sheet-authoring/reports/skill-trials.md`.

### capture-sheet
- [ ] 2.1 Acme capture sheet loads cleanly
- [ ] 2.2 Missing required section
- [ ] 2.3 Missing required column
- [ ] 2.4 Columns in a different order
- [ ] 2.5 Owner written with different case
- [ ] 2.6 Unknown name with a suggestion
- [ ] 2.7 Decision with labelled branches
- [ ] 2.8 Next points at a missing step
- [ ] 2.9 Matrix becomes RACI
- [ ] 2.10 Combined letters rejected
- [ ] 2.11 Persona starts at a process
- [ ] 2.12 Theme from the sheet
- [ ] 2.13 Notes for a workstream
- [ ] 2.14 Open questions become warnings
- [ ] 2.15 Not in the snapshot
- [ ] 2.16 Location in the message
- [ ] 2.17 Snapshots match (folder export vs sheet export)
- [ ] 2.18 Blank template loads

### authoring-skill
- [ ] 2.19 Package contents (Node test)
- [ ] 2.20 Bundled validator runs on its own (Node test)
- [ ] 2.21 Core has no Claude-specific content (Node test)
- [ ] 2.22 Rich context gives a draft first (skill trial: `rich`)
- [ ] 2.23 Thin context starts an interview (skill trial: `thin`)
- [ ] 2.24 Contradiction recorded (skill trial: `contradictions`)
- [ ] 2.25 A/R in the source (skill trial: `contradictions`)
- [ ] 2.26 New material proposes, not overwrites (skill trial: `revision`)
- [ ] 2.27 Handover sheet validates (skill trial: `rich`, then `npm run validate`)
- [ ] 2.28 Sources listed (skill trial: `rich`)
- [ ] 2.29 Refuses the public repo by default (skill trial)
- [ ] 2.30 Handover message (skill trial: `rich`)

### author-mode
- [ ] 2.31 First open (updated: includes "Load capture sheet")
- [ ] 2.32 Load a zip (existing test still passes)
- [ ] 2.33 Load the bundled sample (existing test still passes)
- [ ] 2.34 Load a capture sheet
- [ ] 2.35 Keyboard load of a capture sheet
- [ ] 2.36 Mixed formats rejected
- [ ] 2.37 Unused file excluded (existing test still passes)
- [ ] 2.38 Capture-sheet working notes excluded
- [ ] 2.39 Open questions group
- [ ] 2.40 Report at 768px

### content-schema
- [ ] 2.41 Combined letter in a folder
- [ ] 2.42 No accountable role
- [ ] 2.43 Two accountable roles
- [ ] 2.44 Sample stays clean
- [ ] 2.45 Clean sheet (Node test of `npm run validate`)
- [ ] 2.46 Errors fail the command (Node test of `npm run validate`)

### bundle, versions and release
- [ ] 2.47 Engine handed over with the sheet (skill trial: `rich`)
- [ ] 2.48 Versions match (unit test)
- [ ] 2.49 Engine shows its version
- [ ] 2.50 Committed skill folder is current (Node test: rebuild, no diff under `skills/`)
- [ ] 2.51 Marketplace install works (skill trial: add the marketplace from GitHub after pushing, install, validate the Acme sheet)
- [ ] 2.52 Release assets (checked after publishing, in 5.2)
- [ ] 2.53 Newer format
- [ ] 2.54 Missing format line

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement across the four specs against the engine, a sheet-exported snapshot and the skill package, with evidence, reviews the skill-trial report, and returns VERIFIED. Report saved to `openspec/changes/add-capture-sheet-authoring/reports/html-verifier.md`
- [ ] 3.2 Confirm no real client or partner content in the repo, including the skill packs and references (private-names guard plus a repo search); verify zero matches

## 4. QA

- [ ] 4.1 html-qa final gate: accessibility, console/network, performance, security (a capture sheet is untrusted input, so test escaping through every sheet field and table cell, and check for no `eval`/`new Function`), responsiveness, visual polish, `/code-review`, Ponytail audit. It returns SHIP. Report saved to `openspec/changes/add-capture-sheet-authoring/reports/html-qa.md`

## 5. Package

- [ ] 5.1 Build `dist/operating-model-author.zip` and export `examples/acme-capture-sheet/capture-sheet.md` to a demo snapshot. Verify both, commit the generated skill folder, push, then install the skill from GitHub through the Claude Code marketplace and run one smoke trial
- [ ] 5.2 Bump the version to 1.1.0 across the bundle, tag it, and publish the release with `gh release create`: attach `operating-model-author.zip`, `operating-model-explorer.html` and the demo snapshot, with notes from the template and checksums. Verify by downloading the assets and checking their checksums (2.52)
- [ ] 5.3 dist/operating-model-explorer.html built, self-contained, and README updated
