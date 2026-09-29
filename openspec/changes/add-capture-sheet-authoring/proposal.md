# Proposal: Capture sheet and AI-assisted authoring

## Why

Engine v1 can turn an operating model into an explorable snapshot, but the model has to be written as a folder of about 25 Markdown files with YAML headers. That is fine for technical authors, and a real barrier for most colleagues. It is also impossible for clients and stakeholders to review before anything is built. Colleagues already hold the raw material (decks, notes, RACI spreadsheets, org charts, process slides). What they lack is a way to turn it into a clean, complete, valid model without learning the file format. That is the step that decides whether the engine gets used beyond its author.

## Who uses it and how it's shared

- **Authors (colleagues):** bring their background material to Claude. Claude drafts a **capture sheet**, a single readable Markdown document, and then discusses gaps, guesses and contradictions with them. They load the capture sheet into the engine, check the preview, and export a snapshot as today.
- **Reviewers (clients and stakeholders):** review and comment on the capture sheet itself, as one document with a table per process, before a snapshot is produced.
- **Viewers:** unchanged. They receive the exported snapshot HTML by email, Teams or file share.

## What Changes

- New **capture sheet format:** one Markdown file per model with fixed section headings and tables. It covers purpose, key messages, parties, teams, roles, workstreams, one section per process with a step table and a **RACI matrix** (steps × roles, one letter per cell), personas, an optional theme, and **Open questions** and **Sources** sections. Elements are referred to **by name**, not by id; the engine derives ids and matches names forgivingly.
- The engine **loads a capture sheet directly** ("Load capture sheet"), alongside folders and `.zip` files. Validation messages point to capture-sheet sections and table rows.
- **Open questions** in a capture sheet appear as warnings in author mode, and they are never included in exported snapshots. **Sources** are kept for provenance and are also excluded from snapshots.
- New **RACI checks** apply to both formats. A combined letter in a cell (e.g. "A/R") is an error that asks the author to choose. A step with no A, or more than one A, produces a warning.
- A **command-line validator** (`npm run validate -- <sheet-or-folder>`) reuses the engine's own loader and validator, so tools and people can check content without a browser.
- A **Claude skill** (`skills/operating-model-author/`) that:
  - reads whatever context the colleague provides;
  - **drafts first** when there is enough material, and switches to an **interview** when there isn't;
  - asks only about gaps, assumptions and contradictions, and records unresolved ones in Open questions;
  - never silently overwrites decisions a person has made; it proposes changes instead;
  - validates its output before handing over;
  - writes only to a location the colleague chooses.
- A **portable core** that the skill wraps: the capture sheet format spec, a blank commented template, the Acme sample as a capture sheet, and an interview guide. All of these are plain files, so other assistants can use them later.
- `examples/acme-sample/capture-sheet.md` is added, and it produces **exactly the same model** as the existing sample folder. A test enforces this.

## Capabilities

### New Capabilities
- `capture-sheet`: the capture sheet format (sections, tables, name matching, RACI matrix, Open questions, Sources, optional theme), how it converts into the engine's model, sheet-specific validation messages, the published format spec and the blank template.
- `authoring-skill`: the Claude skill and its portable core. It covers ingesting context, draft-first with an interview fallback, gap and contradiction checks, the rule that human decisions win, self-validation, the output location rule, and how the skill is installed in Claude Code and claude.ai.

### Modified Capabilities
- `author-mode`: loading a capture sheet; Open questions shown as warnings; validation messages that reference sheet sections; snapshots that exclude Open questions and Sources.
- `content-schema`: RACI rules (one letter per cell; warnings for no A or two As); command-line validation of a folder, zip or capture sheet.

## Non-goals

- A pack for other assistants (Copilot, ChatGPT). The portable core makes this straightforward later.
- A form-based or visual editor for capture sheets.
- Importing Excel files directly. The AI reads pasted or attached tables instead.
- Converting an existing content folder back into a capture sheet.
- Hosting, sharing or collaborating on capture sheets. They are ordinary files that colleagues share their usual way.
- Storing any real client or partner content in this repo, including in skill examples.

## Impact

- **Engine code:** a new capture-sheet loader in `src/model/`, sitting next to the folder and zip readers; author-mode UI for loading sheets and showing Open questions; RACI checks in the validator.
- **New files:** `skills/operating-model-author/` (SKILL.md plus references), `docs/capture-sheet.md` (the format spec), `templates/capture-sheet.md`, `examples/acme-sample/capture-sheet.md`, and `scripts/validate.mjs` with an npm script.
- **Tests:** a parity test proving the sheet and the folder produce the same model; unit tests for sheet parsing and name matching; e2e tests for "Load capture sheet"; and a way to test the skill against sample inputs (approach to be settled in the design).
- **No new runtime dependencies expected**, since Markdown tables can be parsed with the existing markdown-it. The engine and every snapshot must still meet `shared/html-deliverable`.
