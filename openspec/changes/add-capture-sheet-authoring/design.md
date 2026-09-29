# Design: Capture sheet and AI-assisted authoring

## Context

See proposal.md for the motivation and the specs for the requirements. What the engine does today, and what shapes this design:

- **The loader works on a list of documents.** `loadModel(files)` turns each `.md` file into a document `{ file, header, body }`. `validate(docs)`, `checkTheme` and `buildModel(docs, assets)` then work only on that list, and `src/model/` is pure JavaScript that runs in both Node and the browser.
- **The validator assumes a folder in one place:** it checks for a document at `file === 'model.md'`.
- **RACI letters are checked only by schema enum (R, A, C or I),** so `A/R` gets the generic "not one of" message.
- **markdown-it is already bundled,** with GFM tables enabled by default. There's no command-line entry point; only `scripts/build.mjs` exists.
- **The sample uses short ids** (`acme`, `qualify-opportunity`) that differ from name-derived ones (`acme-corp`, `qualify-an-opportunity`). Several of its steps have no role marked A.
- **Constraints carried over:** single offline file, no `eval` or `new Function`, a hash-based CSP, Ponytail minimal code, and the shared html-deliverable standard.

## Goals / Non-Goals

**Goals:**
- The capture sheet is a **second front end to the same model**. After conversion, everything downstream (validation, the viewer, export) is unchanged.
- One set of format rules serves the engine, the command-line validator and the skill.
- The skill stays thin. The portable core carries the knowledge.

**Non-Goals:**
- Converting a content folder into a sheet (see proposal).
- Supporting more than one capture sheet per model.

## Decisions

### D1. Stack: vanilla, no new runtime dependencies
The engine stays vanilla JS bundled by esbuild into one file. The capture-sheet parser uses the **markdown-it token stream**, which is already bundled and supports GFM tables, to read headings, tables, lists and paragraphs. React is not justified, since this is a parser plus one new author-mode control. The engine grows by an estimated 10–15 KB.
*Alternatives:* a dedicated Markdown AST library such as remark (a second parser, about 100 KB); regular expressions over the raw text (fragile with pipes, escapes and code spans).

### D2. The sheet becomes documents, so the rest of the engine is untouched
A new `src/model/sheet.js` exports `sheetToDocs(text) -> { docs, messages, meta }`. The docs have exactly the shape the folder reader produces:
- a model document, plus one document per party, team, role, workstream, process and persona, plus a theme document;
- each document carries `file: 'capture-sheet.md'` and a `where` label such as `Process: Build the proposal › step 3`.

`loadModel` detects a sheet and routes it through `sheetToDocs`. Everything after that is shared. The validator's hard-coded `model.md` check becomes "exactly one model document", and message formatting prints `where` when present, otherwise `file`.
*Alternative:* write a converted folder to disk or memory and load that. Rejected: it loses the sheet locations needed for good messages.

### D3. Detecting a sheet
- A loaded `.md` file whose first heading starts with `# Operating model:` is a capture sheet.
- In a folder or zip, a file matching that rule (conventionally `capture-sheet.md`) switches to sheet mode, with `assets/` read alongside it.
- A sheet together with element files is an error.
- "Load capture sheet" is a single-file picker. Dropping one `.md` file onto author mode also works.

### D4. Names, ids and matching
- **Ids** are derived as lowercase, with non-alphanumeric runs turned into `-` and trimmed. An `ID` column, or an `ID:` line for the model, overrides this.
- **Matching** looks names up by a key that is lowercased, with whitespace collapsed and punctuation stripped. A miss uses the existing `closest()` helper for "Did you mean …?".
- **Step references** in `Next` and in RACI rows can be a `#` number or a step name, matched within the same process.
- **Duplicates** of the same type are an error.
- The sample sheet uses name-derived ids. The parity test (D9) compares models **by name**, so the folder's shorter ids don't matter.

### D5. Open questions, Sources and comments never reach a snapshot
`sheetToDocs` returns `meta: { openQuestions, sources }` next to the docs. Author mode shows open questions as their own report group. `toSnapshot` builds only from `buildModel` output, so meta is never embedded. HTML comments are dropped at parse time, because markdown-it returns them as `html_block` tokens and the parser skips them. A test searches the exported snapshot for known question, source and comment text.

### D6. RACI rules live in the shared validator
`validate()` gains three checks, which apply to folders and sheets alike:
- **Combined letters** (`/^[RACI]{2,}$|[\/,+&]/i` after trimming) produce the specific R-or-A message. The generic enum message is suppressed for that value.
- **No A** on a step produces a warning.
- **More than one A** on a step produces a warning.

The owner still counts as R when it has no letter, which is existing behaviour.

**The sample is updated so every step has exactly one A,** usually the owner or the signing-off role. Tests that assert specific letters for the sample are updated. This keeps the "0 warnings" scenarios meaningful.
*Alternative:* treat the owner as A by default. Rejected, because it changes the meaning of the existing persona-lens "What matters for me" letters.

### D7. Command-line validator
`scripts/validate.mjs <path>`:
- reads a sheet file, a folder (Node `fs`, walked recursively) or a `.zip` (fflate) into `[{ path, data }]`;
- calls `loadModel`, prints the messages grouped by level, then the counts;
- exits 1 on errors.

It is exposed as `npm run validate -- <path>`. For the skill, esbuild bundles it into **one self-contained file** (`skill/scripts/validate.mjs`, with js-yaml, markdown-it and fflate inlined) that needs only Node.

### D8. Skill package: a thin SKILL.md over a portable core
The single sources live in the repo:
- `docs/capture-sheet.md` (the format spec)
- `templates/capture-sheet.md` (the blank template)
- `examples/acme-capture-sheet/capture-sheet.md` (the example)
- `docs/interview-guide.md` (question order, gap, assumption and contradiction checks, RACI coaching, handover)

`skills/operating-model-author/SKILL.md` holds only the Claude workflow:
- when to draft and when to interview;
- the rule that human decisions win;
- the output-location rule;
- when to run the validator;
- handover.

It points at `references/`. The build generates the rest of the skill folder **in place**:
- it copies the four core files into `skills/operating-model-author/references/`;
- it writes the bundled validator to `skills/operating-model-author/scripts/validate.mjs`;
- it copies the freshly built engine to `skills/operating-model-author/engine/operating-model-explorer.html`;
- it zips the folder to `dist/operating-model-author.zip`.

The generated files are **committed**, because Claude Code installs plugins from the repo's files (D11). Each generated file starts with a "generated by npm run build, do not edit" note where the format allows. A test rebuilds and fails if anything under `skills/operating-model-author/` would change, so the committed copies can't drift from the sources. Another test checks that the core files are free of Claude-specific terms.

Install:
- **Claude Code:** unzip into `~/.claude/skills/` or a project's `.claude/skills/`.
- **claude.ai:** Settings → Capabilities → Skills → upload the zip.

### D9. Parity test: one sample, two formats
The sheet form of the sample lives in its own folder, `examples/acme-capture-sheet/`, with `capture-sheet.md` and a copy of `assets/logo.svg`. It isn't placed in `examples/acme-sample/`, because a folder holding both a sheet and element files is rejected as mixed formats (author-mode › Load content). The sheet declares `ID: acme-sample`, so both forms export as `acme-sample.html`.

A unit test loads `examples/acme-sample/` and `examples/acme-capture-sheet/capture-sheet.md` and normalises both models, replacing every id with its element's name and sorting. It asserts they are deeply equal, covering elements, fields, steps, `next`, RACI, change data, personas, entry points, theme and narrative. An e2e test exports both and compares the rendered overview, swimlane and step-detail text.

### D10. Testing the skill (an exception to the "testable in a browser" rule)
Skill behaviour is a conversation, so it can't be a Playwright test. It is verified by **skill trials**:
- **Fictional context packs** live in `tests/skill-packs/`:
  - `rich/`: deck-style notes, a RACI table and an org list;
  - `thin/`: one paragraph;
  - `contradictions/`: conflicting owners and an `A/R` cell;
  - `revision/`: new material against the Acme sheet.
- **Each trial** runs the skill in Claude Code on one pack, following a scripted checklist in `tests/skill-packs/README.md`.
- **The outcome is checked mechanically where possible:** the output passes `npm run validate`, it loads in the engine, and the expected Open questions and Sources are present. The rest is judged against the scenario, and recorded in `reports/skill-trials.md`.

This is the only departure from the project rule that scenarios be browser-testable. Every other scenario is covered by Playwright or unit tests. The command-line validator scenarios are exercised by Node tests.

### D11. One bundle, one version, installable from GitHub
- **One version.** `package.json` is the single source. The build stamps the version into:
  - the engine (shown in author mode and in the snapshot footer, e.g. "Engine 1.1.0");
  - the validator's output header;
  - `SKILL.md` (a generated version line);
  - `.claude-plugin/plugin.json`.

  A unit test compares all of them.
- **Format versions.** The capture sheet format has its own integer version (`Format: 1`), separate from the release version. The engine declares the highest format it supports. A sheet with a newer format is an error saying "this engine reads formats up to N; use a newer engine". An older engine can't know which future release introduced a format, so there's no minimum-release table. The format version only goes up when an older engine would misread a sheet. Adding optional columns doesn't need a bump, because unknown columns are already only a warning.
- **Claude Code marketplace.** The repo root gets `.claude-plugin/marketplace.json`, which lists one plugin whose source is the repo root, and `.claude-plugin/plugin.json`, which holds the name, version and description. Skills are found automatically in `skills/`. The layout follows an existing working plugin (Ponytail): a root plugin with `skills/<name>/SKILL.md`. Colleagues run `/plugin marketplace add stevenbiss/operating-model-explorer` followed by `/plugin install operating-model-author@operating-model-explorer`. They get updates through the marketplace when `main` moves on, so releases are always cut from `main` after a build.
- **claude.ai.** There's no install from a repo, so colleagues download `operating-model-author.zip` from the release and upload it once. The zip's contents are identical to the committed skill folder.
- **Release.** `gh release create vX.Y.Z` attaches the zip, the standalone engine and a demo snapshot exported from the Acme capture sheet, with notes explaining which file to use and SHA-256 checksums. A check confirms that the engine inside the zip is byte-identical to the standalone engine.
- **Alternatives.**
  - Keep the skill zip only as a release download, with nothing committed: this rules out the marketplace install, because Claude Code reads repo files.
  - A separate repo for the skill: two repos would drift apart, which is exactly what "working in harmony" is meant to avoid.
  - Having the skill download the engine from GitHub at run time: this needs network access, and would break offline use and pinning the engine to one version.

## Risks / Trade-offs

- **[Risk] Hand-edited tables break easily** (a missing pipe, a merged cell) → the parser reports the table and row it couldn't read, rather than failing silently. The format spec shows the patterns to copy. The skill does most of the writing.
- **[Risk] Name-based references break when something is renamed** → the matching is forgiving, the errors come with suggestions, and the skill renames everywhere at once when asked.
- **[Risk] claude.ai's code environment may not run Node** → the skill checks whether it can run the validator. If it can't, it says so and tells the colleague to validate by loading the sheet in the engine (spec: Validated before handover).
- **[Risk] Skill output quality varies between runs** → the portable core is explicit, the trials cover the main behaviours, and the engine is the final check.
- **[Risk] A committed build output goes stale** (someone edits a source file and doesn't rebuild) → the "skill folder is current" test fails, and releases are only cut after `npm test` passes.
- **[Trade-off] Committed build files add about 300 KB per engine change to git history.** That's acceptable for the one-command install, and it's limited to one engine file.
- **[Risk] The Claude Code plugin format changes** → the layout matches a working plugin today. The marketplace trial (authoring-skill › Marketplace install works) re-checks it at each release.
- **[Trade-off] Wide step tables are awkward to read in plain text,** but they render well on GitHub and in Markdown viewers. Optional columns can be left out.
- **[Trade-off] Updating the sample to one A per step** changes some displayed letters (e.g. "What matters for me"), and a few existing tests need updating.

## Migration Plan

Additive. Existing content folders load exactly as before. The only behaviour change for them is the new RACI warnings: a step with no A, or two As, now warns without blocking export, and a combined letter was already an error and now gets a clearer message. Snapshots exported earlier are unaffected. Rollback means shipping the previous engine file.

## Open Questions

- The skill's final name and description wording, which affect how Claude triggers it. This can be tuned during the trials.
- The final plugin and marketplace names, which appear in the install commands. For now: the plugin is `operating-model-author` and the marketplace is `operating-model-explorer`.
