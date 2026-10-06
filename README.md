# Operating Model Explorer

An engine that turns an operating model, written as one capture sheet or a folder of Markdown files, into one interactive HTML file. Viewers can start from their own persona and explore at their own pace: the model overview, structure diagrams, workstreams, process swimlanes and step detail. Everyone sees the same model and the same key messages.

The engine is a single file, `dist/operating-model-explorer.html`. Opened on its own it runs in **author mode**. A snapshot you export from it runs in **viewer mode**. Both work offline, from disk or an email attachment, with nothing to install.

**Status:** v1.8.0 released ([release notes](https://github.com/stevenbiss/operating-model-explorer/releases/tag/v1.8.0)). Viewers can now switch the home page between Simple and Detailed themselves (the author's `View:` sets where it starts), and the header lines up with full-width process and structure pages on wide screens. Built, tested (397 end-to-end and 280 unit tests), verified and QA-approved. Reports are in `openspec/changes/home-view-toggle-wide-header/reports/`.


## For authors

You need a current Chrome or Edge (Safari and Firefox work too, but can only load a `.zip` or a single capture sheet). No other software is needed.

### The easy route: a capture sheet

A **capture sheet** is one Markdown file with fixed headings and a table for each list of things (parties, roles, steps, a RACI matrix), referring to everything by name. Clients and colleagues can review and comment on it as one document before anything is built. Copy `templates/capture-sheet.md`, see `examples/acme-capture-sheet/capture-sheet.md` for a complete fictional example, and `docs/capture-sheet.md` for the format. In the engine, choose **Load capture sheet** (or **Load folder** on a folder holding the sheet and its `brands/` or `assets/`).

### Structure diagrams: who sits where, and who works with whom

From v1.3.0, a model can hold relationship diagrams that you design from scratch, the same way you design processes. Use them for a partnership's collaboration model, a sub-programme's team, a market or a division.

- **Columns are the parties.** Each box sits in the column of its role's or team's party, in that party's brand colour.
- **Bands are rows you name yourself**, top to bottom (for example "Leadership", "Programme management"), with one optional level of sub-bands.
- **Boxes** place an existing role or team in a band. They can carry a name (who holds it, or TBA) and a note (for example a grade).
- **Lines** join two cells (a band and a party) to show a relationship. They are plain, with no direction, and can have a short label.
- **Diagrams link to each other** and to workstreams, in any combination, and a band can open another diagram so viewers can drill down. If a model has any diagrams, exactly one is the **main** diagram, covering the whole company or partnership.
- In a capture sheet, write one `## Structure: <name>` section per diagram, with `Bands`, `Boxes` and `Lines` tables. In a content folder, use one `type: structure` file per diagram in `structures/`. See `docs/capture-sheet.md` (Structures) and `docs/authoring-guide.md` (Structure diagrams).
- Viewers can open a box's role or team, search for a name on a box, and see their own roles marked "Your role". On a phone, each diagram becomes a stacked list.

### Committees: decisions taken together

From v1.4.0, a step can be owned by a **committee** instead of one role, for a decision or a piece of work done jointly by people from more than one party (a go/no-go, a readiness check, a steering decision).

- **A committee has its own RACI.** Each member role, from any party, has one letter. Members marked **A** share the decision and are jointly accountable; there is no single owner. Others can be consulted (C), informed (I) or do the work (R).
- In a capture sheet, add a `## Committees` table (`Committee`, `Members` such as `Account lead (A); Partner manager (A); Solution architect (C)`, `Summary`) and name the committee in a step's `Owner` cell. In a content folder, use a `type: committee` file in `committees/`. See `docs/capture-sheet.md` (Committees) and `docs/authoring-guide.md` (Committees).
- **In the swimlane**, committees get their own lanes, together in the middle between the parties, and their steps are marked "By committee". Each member's own lane says which committee it sits on, with its letter. Opening a committee step lists all its members, split by organisation.
- **Members with nothing else to do in a process get no lane** (from v1.7.0). A member keeps its own lane only if it owns a step, or has a RACI letter on a step owned by a role. The others are listed in the committee's lane, accountable members first, with "+ N more" when there are many.
- The engine warns when a committee isn't really joint: no A member, only one, or A members from only one party. Rename "committee" per model if you prefer (for example "Steering group").

### People, review status and the home page

From v1.6.0:

- **Who holds a role.** Add a `People` column to the Roles table (names separated by semicolons), or `people:` in a role file. Wherever the role appears, viewers see the person's name under it, or "Multiple people", and can hover or tab to it to see everyone. The role's page lists them all. A structure box with its own Name text keeps showing that text.
- **Under review or Agreed.** Every process and structure diagram is **Under review** unless you add `Status: Agreed` to its section (or `status: agreed` in its file). The status shows as a badge wherever it's listed, and an under-review item has a notice above its diagram saying it may still change.
- **Simple or Detailed home page.** The home page is **Simple** by default: the model name, then the parties, workstreams, every process and the structure diagrams. **Detailed** also shows the purpose, narrative, key messages and persona doors. Viewers can switch between the two with the toggle under the home page heading, and their choice is kept in the link. `View: Detailed` under the sheet's title (or `view: detailed` in `model.md`) sets the view the home page opens in. Other pages are the same either way, and the Key messages button is always there. In author mode, the preview says which view the snapshot opens in and has the same toggle; using it there doesn't change the export.

### Brands: each party in its own colour and mark

From v1.2.0, each party can be shown in its own brand colour, with its mark, wherever it appears: party cards, swimlane bands and lanes, owner chips, the legend and the header, where the model's name sits next to every party's mark. The rest of the page stays in the engine's neutral frame, and the colours that carry meaning ("Your lane", the New, Changed and Removed badges, errors) are always the engine's own.

- **Brand packs** come from your organisation's **brand library**: a folder with one pack per brand, each holding `brand.md` (name, version, colours) and a square SVG mark. Copy the whole pack folder, unchanged, into a `brands/` folder in your model: `my-model/brands/acme/`. Never edit the copy. The engine reads only your model's folder, never the library, so a model keeps the brand versions it was built with; to take up a new version, copy the pack again and export again.
- **Name each party's brand** by the pack's id: the `Brand` column of the capture sheet's Parties table, or `brand: acme` in a party file. A party without a brand gets a neutral colour and its initials.
- **Load the folder**, not the sheet on its own, so the engine can see `brands/`.
- The engine may **adjust a brand colour** so that text on it is readable, parties can be told apart (also with common colour-blindness) and no party looks like a colour with a meaning. The report tells you each time, as a warning.
- An exported snapshot records which brand and version each party used. Brand usage notes, and packs no party uses, are never included.
- The operating-model-author skill (below) can do this for you: tell it where the library is and which brands to use. It copies the packs, fills in the Brand column and lists each pack's version under Sources, and asks if a brand isn't in the library.

Curators of a brand library: see `docs/brand-packs.md` for the pack format, versions, marks and the colour adjustments the engine may make. The fictional packs in `examples/` and `tests/skill-packs/brand-library/` are examples.

**Retired theme settings (v1.2.0).** The theme is now only your own words for terms (`labels`, or `Label …` lines in a sheet), which work as before. Theme colours, fonts, the theme logo and the palette are retired: `colors`, `fonts`, `logo` and `palette` in `theme.md`, and the sheet's `Primary colour`, `Accent colour`, `Background colour`, `Surface colour`, `Text colour`, `Palette`, `Body font`, `Heading font` and `Logo` lines. A model that still sets them loads and exports, with a warning for each one saying it's ignored, and is shown in the neutral frame. Brand packs replace colours, the palette and the logo; the engine always uses its own fonts. The capture sheet format stays 1, and snapshots exported with an earlier version are unaffected.

### Let an AI assistant draft it: the operating-model-author skill

The skill turns your decks, notes, RACI tables and org charts into a capture sheet. It drafts first when there's enough material and interviews you when there isn't, lists gaps, assumptions and contradictions as open questions instead of guessing, checks the sheet, and hands it over with the matching engine next to it.

- **Claude Code:** run `/plugin marketplace add stevenbiss/operating-model-explorer`, then `/plugin install operating-model-author@operating-model-explorer`. Updates arrive through the marketplace.
- **claude.ai:** download `operating-model-author.zip` from the latest release, then upload it in Settings → Capabilities → Skills.
- **Without the marketplace:** unzip `operating-model-author.zip` into `~/.claude/skills/` or a project's `.claude/skills/`.

Then ask in your own words, e.g. "Turn these workshop notes into an operating model", and tell it where to save. Don't save capture sheets in this repo: it is public.

### Using the engine

1. **Open the engine.** Double-click `operating-model-explorer.html`. It opens in author mode.
2. **Load your content.** Use **Load capture sheet** for a single sheet, or drag your folder onto the page, or use **Load folder** (for a content folder, or a sheet with its `brands/` or `assets/`). You can also use **Load .zip** with a zip of the folder. To see how it works first, choose **Try the sample**. Files are read in your browser and never uploaded.
3. **Fix any problems.** The validation report lists each error and warning with its file and how to fix it. Errors block the export. Warnings don't. Edit your files, then choose **Reload** (Chrome and Edge, after Load folder or a folder drop), or load the folder or zip again.
4. **Check the preview.** It shows exactly what viewers will see, including the persona prompt and every view.
5. **Export.** Choose **Export snapshot** to download `<model-id>.html`. Send that file to your viewers. It contains only the files your model uses, not other files in the folder, your file paths or the validation report.

**Moving around big diagrams.** Process swimlanes and structure diagrams use the full width of the window, in the snapshot and the preview. A diagram bigger than the window scrolls inside its own area, which is never taller than the window, so both scrollbars stay on screen. Hold the left mouse button anywhere on it and drag to move it in any direction; a click without moving still opens a step or box. The scrollbars, mouse wheel, trackpad, touch and keyboard (Tab and the arrow keys) work too. On a phone, diagrams become lists.

To write a content folder instead of a capture sheet, start from a copy of `examples/acme-sample/` (a fictional model) and see:
- `docs/authoring-guide.md`: how to write a model.
- `docs/content-reference.md`: every field of every file type, and of brand packs. It is also available in the engine under **Content reference**.

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
examples/acme-sample/  fictional sample model with fictional brand packs, bundled for "Try the sample"
examples/acme-capture-sheet/  the same model as one capture sheet (the parity test compares them)
templates/          the blank capture sheet
docs/               authoring guide, capture sheet format, brand packs, interview guide, release notes template;
                    content-reference.md is generated by the build
skills/operating-model-author/  the skill: SKILL.md, plus generated references/, scripts/ and engine/
.claude-plugin/     marketplace.json and plugin.json: this repo is a Claude Code plugin marketplace
scripts/build.mjs   the build
scripts/validate.mjs  the command-line validator (npm run validate)
tests/unit/         Node unit tests (node --test)
tests/e2e/          Playwright end-to-end tests, one per spec scenario
tests/fixtures/     content folders the tests load, including one per validation error case
tests/skill-packs/  fictional context packs, a fictional brand library and the scripted skill trial checklist
openspec/           specs and changes for this project (OpenSpec)
```

Requirements and changes are managed with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in `openspec/`. This project is built from the [my-work-ai-builds](https://github.com/stevenbiss/my-work-ai-builds) workspace: open Claude Code at the workspace root and use `/opsx:propose` and `/opsx:apply`.
