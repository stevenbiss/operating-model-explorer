# Operating Model Explorer

An engine that turns an operating model, written as one capture sheet or a folder of Markdown files, into one interactive HTML file. Viewers can start from their own persona and explore at their own pace: the model overview, workstreams, process swimlanes and step detail. Everyone sees the same model and the same key messages.

The engine is a single file, `dist/operating-model-explorer.html`. Opened on its own it runs in **author mode**. A snapshot you export from it runs in **viewer mode**. Both work offline, from disk or an email attachment, with nothing to install.

**Status:** v1.1.0 released ([release notes](https://github.com/stevenbiss/operating-model-explorer/releases/tag/v1.1.0)). It adds the capture sheet, `npm run validate`, and the operating-model-author skill and plugin to the v1 engine. Built, tested (142 end-to-end and 134 unit tests), verified and QA-approved; the skill was checked in simulated trials. Reports are in `openspec/changes/archive/2026-09-30-add-capture-sheet-authoring/reports/`.

## For authors

You need a current Chrome or Edge (Safari and Firefox work too, but can only load a `.zip` or a single capture sheet). No other software is needed.

### The easy route: a capture sheet

A **capture sheet** is one Markdown file with fixed headings and a table for each list of things (parties, roles, steps, a RACI matrix), referring to everything by name. Clients and colleagues can review and comment on it as one document before anything is built. Copy `templates/capture-sheet.md`, see `examples/acme-capture-sheet/capture-sheet.md` for a complete fictional example, and `docs/capture-sheet.md` for the format. In the engine, choose **Load capture sheet** (or **Load folder** on a folder holding the sheet and its `assets/`).

### Let an AI assistant draft it: the operating-model-author skill

The skill turns your decks, notes, RACI tables and org charts into a capture sheet. It drafts first when there's enough material and interviews you when there isn't, lists gaps, assumptions and contradictions as open questions instead of guessing, checks the sheet, and hands it over with the matching engine next to it.

- **Claude Code:** run `/plugin marketplace add stevenbiss/operating-model-explorer`, then `/plugin install operating-model-author@operating-model-explorer`. Updates arrive through the marketplace.
- **claude.ai:** download `operating-model-author.zip` from the latest release, then upload it in Settings → Capabilities → Skills.
- **Without the marketplace:** unzip `operating-model-author.zip` into `~/.claude/skills/` or a project's `.claude/skills/`.

Then ask in your own words, e.g. "Turn these workshop notes into an operating model", and tell it where to save. Don't save capture sheets in this repo: it is public.

### Using the engine

1. **Open the engine.** Double-click `operating-model-explorer.html`. It opens in author mode.
2. **Load your content.** Use **Load capture sheet** for a single sheet, or drag your folder onto the page, or use **Load folder** (for a content folder, or a sheet with its `assets/`). You can also use **Load .zip** with a zip of the folder. To see how it works first, choose **Try the sample**. Files are read in your browser and never uploaded.
3. **Fix any problems.** The validation report lists each error and warning with its file and how to fix it. Errors block the export. Warnings don't. Edit your files, then choose **Reload** (Chrome and Edge, after Load folder or a folder drop), or load the folder or zip again.
4. **Check the preview.** It shows exactly what viewers will see, including the persona prompt and every view.
5. **Export.** Choose **Export snapshot** to download `<model-id>.html`. Send that file to your viewers. It contains only the files your model uses, not other files in the folder, your file paths or the validation report.

To write a content folder instead of a capture sheet, start from a copy of `examples/acme-sample/` (a fictional model) and see:
- `docs/authoring-guide.md`: how to write a model.
- `docs/content-reference.md`: every field of every file type. It is also available in the engine under **Content reference**.

## For developers

Requirements: Node 22 or later. Playwright's Chromium is needed for `npm test` (`npx playwright install chromium`).

```bash
npm install          # dependencies stay in this folder
npm run build        # -> dist/operating-model-explorer.html, dist/operating-model-author.zip, dist/SHA256SUMS;
                     #    regenerates docs/content-reference.md and the generated files in skills/operating-model-author/
npm run test:unit    # Node unit tests: loader, sheet parser, validator, parity, theme, layout, routes, CLI, skill package
npm run validate -- examples/acme-capture-sheet/capture-sheet.md   # check a sheet, a folder or a .zip without a browser
npm test             # builds, then runs the Playwright end-to-end tests in tests/e2e/ against the built file via file://
```

`npm test` runs every scenario at 1280×800, and the small-screen scenarios and key flows (tagged `@mobile`) again at 375×812. Results are also written to `test-results/results.json`. `npm run test:unit` needs no browser.

The build bundles `src/main.js` with esbuild and inlines the CSS, the JS and the sample folder into `src/index.html`. It fails if the bundle contains `eval` or `new Function`. It writes files only when they change, so a second build changes nothing.

- **`npm run validate -- <path>`** runs the engine's own loader and checks on a capture sheet, a content folder or a `.zip`, prints each message with its location and a fix, and exits 1 on errors.
- **Parity test:** `tests/unit/sheet.test.js` proves `examples/acme-capture-sheet/capture-sheet.md` and `examples/acme-sample/` produce exactly the same model. Change both together.
- **The skill folder is partly generated and committed**, because Claude Code installs the plugin from the repo's files. `SKILL.md` is hand-written (the build stamps its `Version:` line); `references/`, `scripts/validate.mjs` (one self-contained bundle) and `engine/` are generated from `docs/`, `templates/`, `examples/` and the built engine. Edit the sources, run `npm run build` and commit the result: a unit test fails if the committed folder differs from a fresh build.
- **One version:** `package.json` is the source for the engine, both validators, `SKILL.md` and `.claude-plugin/plugin.json`. A unit test checks they match.
- **Skill trials:** the skill's behaviour is checked by scripted conversations on the fictional packs in `tests/skill-packs/`. See `tests/skill-packs/README.md`.
- **Releases:** follow `docs/release-notes-template.md` (`gh release create` with the zip, the engine and the demo snapshot, plus the checksums from `dist/SHA256SUMS`).

### Repo layout

```
src/
  index.html        page template: #om-style, #om-sample, #om-engine are filled by the build
  main.js           entry: viewer mode if #om-content is embedded, otherwise author mode
  styles.css        all styles, from theme tokens (CSS custom properties)
  model/            pure code shared with the unit tests: read (folder, zip), parse, validate,
                    theme checks, layout ranking, snapshot, Markdown, content reference
  viewer/           the explorer: app.js (render), swimlane, routes, theme
  author/           author mode: load, validation report, preview, reload, export
schema/             JSON Schemas for each content file type (the single source of truth)
examples/acme-sample/  fictional sample model, bundled for "Try the sample"
examples/acme-capture-sheet/  the same model as one capture sheet (the parity test compares them)
templates/          the blank capture sheet
docs/               authoring guide, capture sheet format, interview guide, release notes template;
                    content-reference.md is generated by the build
skills/operating-model-author/  the skill: SKILL.md, plus generated references/, scripts/ and engine/
.claude-plugin/     marketplace.json and plugin.json: this repo is a Claude Code plugin marketplace
scripts/build.mjs   the build
scripts/validate.mjs  the command-line validator (npm run validate)
tests/unit/         Node unit tests (node --test)
tests/e2e/          Playwright end-to-end tests, one per spec scenario
tests/fixtures/     content folders the tests load, including one per validation error case
tests/skill-packs/  fictional context packs and the scripted skill trial checklist
openspec/           specs and changes for this project (OpenSpec)
```

Requirements and changes are managed with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in `openspec/`. This project is built from the [my-work-ai-builds](https://github.com/stevenbiss/my-work-ai-builds) workspace: open Claude Code at the workspace root and use `/opsx:propose` and `/opsx:apply`.
