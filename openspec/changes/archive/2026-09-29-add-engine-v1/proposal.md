# Proposal: Operating Model Explorer engine v1

## Why

Operating models (teams, roles, personas and, above all, processes) are usually presented in decks and spreadsheets. These are linear: everyone gets the same path, whatever their role, and anyone who skips ahead loses the thread. We want a **reusable engine** that turns an operating model, written as structured Markdown content, into a single interactive HTML file. Each persona can enter from their own perspective and explore freely, while everyone sees the same model and the same conclusions. The first real use is a partnership operating model with a deep dive into its Presales workstream. That content is an *input* to the engine, not part of it.

## Who uses it and how it's shared

- **Authors (colleagues):** open the engine (one HTML file, nothing to install), load a content folder and a theme, fix any validation problems, preview, and export a snapshot. In future (out of scope here) a Claude skill will guide them through writing the content.
- **Viewers (colleagues and clients):** receive the exported snapshot, one self-contained HTML file sent by email, Teams or file share, and open it in a browser, offline. They see viewer mode only.

## What Changes

- New **content format**: an operating model is a folder of Markdown files, each with a YAML header checked against a published schema (one file per model, party, role, persona, workstream and process; steps are listed inside their process file), plus a `theme.md`.
- New **engine** (`dist/operating-model-explorer.html`) with two modes:
  - **Author mode:** load a content folder or `.zip` → plain-English validation → live preview → export snapshot.
  - **Viewer mode:** the explorer itself. It opens straight into the model, with authoring controls hidden.
- New **explorer views** across four zoom levels: L0 model overview → L1 workstreams → L2 process swimlane → L3 step detail.
- New **persona lens**: each persona has an entry point ("door") and highlighting for their own lanes, handoffs and RACI. Nothing is ever hidden from any persona.
- New **theming**: colours, fonts, logo and **terminology labels** (e.g. "workstream" vs "value stream") come from the theme file, and the engine ships a neutral default theme.
- Optional **current vs future state** on any element. The engine shows change badges and a "what changes for me" view only when the content provides that data.
- A **fictional sample model** (`examples/acme-sample/`) that drives the automated tests and doubles as the colleague starter kit. No real client or partner content is stored in this repo.

## Capabilities

### New Capabilities
- `content-schema`: the operating-model meta-model (aligned with EDGY concepts), the Markdown + YAML header file format, the folder layout, the published schema, and validation with plain-English errors.
- `theming`: the theme file, the default theme, brand colours, fonts and logo, and configurable terminology labels.
- `explorer-views`: L0–L3 zoom levels, the process swimlane, the step detail panel, navigation, search, and current vs future display.
- `persona-lens`: persona entry points, highlighting of relevant lanes, handoffs and RACI, and switching persona without losing your place.
- `author-mode`: loading content and theme, the validation report, live preview, and exporting a self-contained viewer snapshot.

### Modified Capabilities
- None. The shared `html-deliverable` standard (from the `ai-builds-shared` store) applies unchanged to both the engine and every exported snapshot.

## Non-goals

- Capturing feedback from viewers (a later change; the content model will not block it).
- "Play the process" animation, an Excel import, or a form-based content editor.
- The Claude authoring skill (option D). The schema is designed so it can be added later.
- Detailing more than one workstream in the sample. The engine supports any number of workstreams, and the samples detail one.
- Hosting, logins, live data or shared state. Snapshots are static files.
- Enterprise-wide views from vision to use cases (Project 2). The schema should be extendable toward that, but Project 2 is not built here.
- Storing any real client or partner content in this repo.

## Impact

- New repo contents: `src/` (engine), `schema/` (content schema), `examples/acme-sample/`, `tests/` (Playwright), `dist/operating-model-explorer.html` (build output).
- Dependencies (bundled into the file, no network access at runtime): a YAML parser and a Markdown renderer, plus a zip reader for `.zip` content. Dev only: Playwright and axe-core for tests.
- The engine and all exported snapshots must meet `shared/html-deliverable`: offline, a single file, keyboard accessible, a clean console, responsive, and no sensitive data.
