# Tasks

## 1. Build

- [ ] 1.1 Scaffold `package.json` (scripts `build`, `test`, `test:unit`), `scripts/build.mjs` (esbuild bundle → inline CSS/JS into `dist/operating-model-explorer.html`) and `src/index.html`; verify `npm run build` produces the file and it opens from `file://` with no console errors
- [ ] 1.2 Spike: check folder drag-and-drop, `showDirectoryPicker` reload and `.zip` loading from `file://` in current Chrome and Edge; record the results in design.md D9, and verify the fallback path (zip) works in both
- [ ] 1.3 Write `schema/*.schema.json` for model, party, team, role, persona, workstream, process (with steps) and theme, including `x-edgy` mappings; verify each file parses and the unit test confirms only supported keywords are used
- [ ] 1.4 Write the fictional sample `examples/acme-sample/` (Acme + Globex: 2 parties, teams, 6+ roles, 3 personas with different entry points, 2 workstreams (one detailed with 2 processes, one outline), a decision step, a rework loop, change data, `theme.md` with logo and label overrides); verify it covers every element type
- [ ] 1.5 Implement loading: parse the YAML header and Markdown body per file (js-yaml, markdown-it with `html: false`), read folders and `.zip` (fflate); verify unit tests load the sample into a normalised model (D4)
- [ ] 1.6 Implement the validator: schema-subset interpreter, cross-file references with "Did you mean", duplicates, YAML line errors, unknown-field warnings, plain-English messages; verify unit tests cover each message type
- [ ] 1.7 Generate the content reference from the schemas at build time (fields, required, examples, EDGY concept) and write `docs/authoring-guide.md` for colleagues; verify the reference lists every type
- [ ] 1.8 Implement theming: CSS custom properties, default light and dark theme, label lookup, asset embedding, contrast check, URL rejection; verify with the sample theme and with no theme
- [ ] 1.9 Implement routing (hash routes plus persona), breadcrumb, Back/Forward and deep links; verify by navigating the sample and reloading on a deep link
- [ ] 1.10 Implement the L0 overview, the key-messages panel (reachable from every view) and the L1 workstream view, including outline workstreams; verify against the sample
- [ ] 1.11 Implement the L2 swimlane: lane grouping by party, rank layout, back-edges, decision labels, cross-party connector style and legend, the list layout below 768px, and keyboard flow; verify unit tests for ranking and a manual check of the sample processes
- [ ] 1.12 Implement the L3 step detail (with Previous/Next along the flow), role profiles, search and exploration progress; verify against the sample
- [ ] 1.13 Implement the current vs future control, badges and "Today" text, shown only when change data exists; verify with the sample and with a copy that has no change data
- [ ] 1.14 Implement the persona lens: arrival prompt, entry points, highlighting with a "Your lane" text cue, "What matters for me" and "Only changes", persona in the URL, live-region announcement; verify against all 3 sample personas
- [ ] 1.15 Implement author mode: start screen, load folder/zip/sample, validation report, live preview, reload, export snapshot (D5) containing only used files, viewer mode when content is embedded; verify an exported sample opens offline in viewer mode
- [ ] 1.16 Write `README.md` (what it is, for authors, for developers, and how to build and test); verify the documented commands run as written

## 2. Test

Playwright tests in `tests/`, run against `dist/operating-model-explorer.html` and against an exported sample snapshot, both via `file://`.

### content-schema
- [ ] 2.1 Minimal valid model
- [ ] 2.2 Missing model file
- [ ] 2.3 Narrative rendered
- [ ] 2.4 Script in content is not executed
- [ ] 2.5 Malformed header
- [ ] 2.6 Sample exercises every type
- [ ] 2.7 Missing required field
- [ ] 2.8 Duplicate id
- [ ] 2.9 Unknown owner
- [ ] 2.10 Model without change data
- [ ] 2.11 Invalid change status
- [ ] 2.12 Unknown field
- [ ] 2.13 Reference reachable from author mode
- [ ] 2.14 Message format

### theming
- [ ] 2.15 Custom colours applied
- [ ] 2.16 Logo shown
- [ ] 2.17 No theme file
- [ ] 2.18 Dark mode
- [ ] 2.19 Rename workstream
- [ ] 2.20 Low-contrast theme
- [ ] 2.21 Remote font rejected
- [ ] 2.22 Missing asset

### explorer-views
- [ ] 2.23 Overview content
- [ ] 2.24 Key messages from a step detail
- [ ] 2.25 Outline workstream
- [ ] 2.26 Lanes and steps
- [ ] 2.27 Decision branches
- [ ] 2.28 Cross-party handoff
- [ ] 2.29 Open and move along the flow
- [ ] 2.30 Role across processes
- [ ] 2.31 Deep link
- [ ] 2.32 Back button
- [ ] 2.33 Find a step
- [ ] 2.34 Progress updates
- [ ] 2.35 Change markers
- [ ] 2.36 Keyboard through a swimlane
- [ ] 2.37 Mobile swimlane

### persona-lens
- [ ] 2.38 Arrival
- [ ] 2.39 Change persona later
- [ ] 2.40 Enter at a process
- [ ] 2.41 Highlighted lanes
- [ ] 2.42 Nothing hidden
- [ ] 2.43 Summary contents
- [ ] 2.44 What changes for me
- [ ] 2.45 Link as persona
- [ ] 2.46 Keyboard switch

### author-mode
- [ ] 2.47 First open
- [ ] 2.48 Load a zip
- [ ] 2.49 Load the bundled sample
- [ ] 2.50 Clean model
- [ ] 2.51 Reload after an edit (Chrome/Edge)
- [ ] 2.52 Export and open
- [ ] 2.53 Export blocked by errors
- [ ] 2.54 Unused file excluded
- [ ] 2.55 Keyboard load

### shared/html-deliverable (engine and exported snapshot)
- [ ] 2.56 Opens offline from disk
- [ ] 2.57 Clean console
- [ ] 2.58 Keyboard-only use
- [ ] 2.59 Automated accessibility scan (axe-core, zero serious or critical)
- [ ] 2.60 Small screen
- [ ] 2.61 Content check (no keys, tokens or internal hostnames)

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement across the five specs against the engine and an exported sample snapshot, with screenshot evidence, and returns VERIFIED; report saved to `openspec/changes/add-engine-v1/reports/html-verifier.md`
- [ ] 3.2 Confirm no real client or partner content exists anywhere in the repo (search the repo); verify zero matches outside docs that mention the first use case in general terms

## 4. QA

- [ ] 4.1 html-qa final gate (accessibility, console/network, performance, security including no `eval`/`new Function`, responsiveness, visual polish, `/code-review`, Ponytail audit) returns SHIP; report saved to `openspec/changes/add-engine-v1/reports/html-qa.md`

## 5. Package

- [ ] 5.1 Export `examples/acme-sample/` to `dist/acme-sample.html` as the demo snapshot, and verify it opens offline in viewer mode
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
