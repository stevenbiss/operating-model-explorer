# authoring-skill Specification

## Purpose
A Claude skill that turns a colleague's own background material into a clean, valid capture sheet through conversation. It drafts from what it's given, asks only about gaps and contradictions, and never overrides decisions a person has made. It is built on a portable core that other assistants can use later.

## Requirements

### Requirement: Installable skill package
The build SHALL produce `dist/operating-model-author.zip`, containing:
- `SKILL.md`;
- the reference files: the capture sheet format spec, the blank template, the Acme capture sheet (with its `assets/`) and the interview guide;
- a single-file validator script that needs no `node_modules`;
- the **matching engine**, `engine/operating-model-explorer.html`, from the same build.

The same folder SHALL be usable as a Claude Code skill (copied into a `.claude/skills/` folder) and uploadable as a skill in claude.ai. At handover, the skill SHALL give the colleague the bundled engine, for example by copying it next to the capture sheet, so they don't need to find it separately.

#### Scenario: Package contents
- **WHEN** `npm run build` completes
- **THEN** `dist/operating-model-author.zip` exists and contains `SKILL.md`, the four reference files, the validator script and `engine/operating-model-explorer.html`

#### Scenario: Engine handed over with the sheet
- **WHEN** a skill trial on the "rich" pack finishes
- **THEN** the chosen output folder contains the capture sheet and `operating-model-explorer.html`, and opening that engine and loading the sheet shows 0 errors

#### Scenario: Bundled validator runs on its own
- **WHEN** the validator script is copied out of the unzipped package into an empty folder and run against the Acme capture sheet
- **THEN** it reports 0 errors and 0 warnings and exits successfully

### Requirement: Portable core
The format spec, template, example and interview guide SHALL be plain Markdown with no Claude-specific instructions or tool names, so they can be given to another AI assistant unchanged. Only `SKILL.md` SHALL contain Claude-specific workflow.

#### Scenario: Core has no Claude-specific content
- **WHEN** the four reference files are searched for Claude tool names or Claude-only instructions
- **THEN** there are no matches

### Requirement: Draft first, interview when context is thin
When the colleague provides substantial material (for example a deck, notes or tables covering parties, roles and at least one process or org diagram), the skill SHALL produce a complete draft capture sheet before asking questions. When the material is too thin to draft from, it SHALL interview the colleague, one question at a time, in this order: purpose and key messages, parties, roles, workstreams, processes, structure diagrams, personas.

#### Scenario: Rich context gives a draft first
- **WHEN** the skill is given the fictional "rich" context pack in `tests/skill-packs/rich/`
- **THEN** its first deliverable is a full capture sheet that loads in the engine, before it asks any question

#### Scenario: Thin context starts an interview
- **WHEN** the skill is given only the one-paragraph "thin" pack in `tests/skill-packs/thin/`
- **THEN** it asks about the model's purpose first and does not produce a sheet of guesses

### Requirement: Gaps, assumptions and contradictions are recorded
The skill SHALL ask about, or record under `## Open questions`, every gap (e.g. a step with no owner), every assumption it made (e.g. a party inferred from an email signature) and every contradiction between sources (e.g. two documents naming different owners). Each item SHALL be marked `(gap)`, `(assumption)` or `(contradiction)`. The skill SHALL NOT silently pick one side of a contradiction.

#### Scenario: Contradiction recorded
- **WHEN** the skill drafts from the "contradictions" pack, where the deck and the RACI table name different owners for "Price the solution"
- **THEN** the sheet's Open questions contains an item marked `(contradiction)` naming that step and both owners, unless the colleague resolved it in the conversation

### Requirement: RACI decisions are the colleague's
When the source material has combined RACI letters (e.g. `A/R`), the skill SHALL ask the colleague to choose one letter, explaining the difference. It SHALL NOT choose for them. If the colleague defers, the cell SHALL be left empty and an `(gap)` open question added.

#### Scenario: A/R in the source
- **WHEN** the "contradictions" pack's RACI table has `A/R` for Account lead on "Capture the lead"
- **THEN** the skill asks which single letter applies, and the resulting sheet has either the chosen letter or an empty cell plus an open question, never `A/R`

### Requirement: Human decisions win on revision
When revising an existing capture sheet with new material, the skill SHALL list the changes it proposes (additions, changes and removals) and wait for the colleague's agreement before writing them. It SHALL NOT change values the colleague has set or confirmed unless they agree.

#### Scenario: New material proposes, not overwrites
- **WHEN** the skill is given the Acme capture sheet plus the "revision" pack, which adds a legal review step and names a different owner for an existing step
- **THEN** it lists both as proposed changes, and the sheet on disk is unchanged until the colleague agrees

### Requirement: Validated before handover
Before handing a sheet over, the skill SHALL run the validator on it. It SHALL either hand over a sheet with 0 errors, or state each remaining error and why it couldn't be resolved. If the validator can't run in the environment, the skill SHALL say so and tell the colleague to load the sheet in the engine to check it.

#### Scenario: Handover sheet validates
- **WHEN** a skill trial on the "rich" pack finishes
- **THEN** running `npm run validate -- <sheet>` on the result reports 0 errors

### Requirement: Sources recorded
The skill SHALL list the material it drafted from under `## Sources`, by the names the colleague gave it (file names or descriptions).

#### Scenario: Sources listed
- **WHEN** a skill trial on the "rich" pack finishes
- **THEN** the sheet's Sources section lists each file in the pack

### Requirement: Output only where the colleague chooses
The skill SHALL write the capture sheet only to a location the colleague chooses. If that location is inside the operating-model-explorer repo, it SHALL warn that the repo is public and ask for another location.

#### Scenario: Refuses the public repo by default
- **WHEN** the colleague asks the skill to save the sheet to `examples/` in the engine repo
- **THEN** the skill warns that the repo is public, asks for another location, and doesn't write there unless the colleague confirms

### Requirement: Handover instructions
When it hands over, the skill SHALL tell the colleague how to load the sheet in the engine (Load capture sheet, or Load folder if there are assets), review the open questions, and export a snapshot.

#### Scenario: Handover message
- **WHEN** a skill trial finishes with a valid sheet
- **THEN** the final message names the sheet's location, the number of open questions, and the steps to load and export it in the engine

### Requirement: One version across the bundle
The engine, the validator, the skill and the plugin manifest SHALL carry the same version, taken from `package.json`. The engine SHALL show its version in author mode and in the snapshot footer, and the skill SHALL state its version in `SKILL.md`. A build or test SHALL fail if any of them disagree.

#### Scenario: Versions match
- **WHEN** `npm test` runs after a build
- **THEN** the versions in `package.json`, `.claude-plugin/plugin.json`, the bundled engine, the validator and `SKILL.md` are all identical

#### Scenario: Engine shows its version
- **WHEN** the engine is opened in author mode
- **THEN** its version number is shown, matching `package.json`

### Requirement: Install from GitHub in Claude Code
The repo SHALL be a Claude Code plugin marketplace. Its root SHALL hold `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json`, and the skill SHALL be in `skills/operating-model-author/`. Adding the marketplace (`/plugin marketplace add stevenbiss/operating-model-explorer`) and installing the plugin SHALL give a working skill with its engine, validator and references. Because the plugin is installed from the repo's files, the built engine, validator and reference copies inside the skill folder SHALL be committed, and a test SHALL fail if they differ from a fresh build.

#### Scenario: Committed skill folder is current
- **WHEN** `npm run build` is run on a clean checkout
- **THEN** it produces no changes to any file under `skills/operating-model-author/`

#### Scenario: Marketplace install works
- **WHEN** the marketplace is added from GitHub in Claude Code and the plugin is installed (skill trial)
- **THEN** the operating-model-author skill is available, and its bundled validator reports 0 errors on the Acme capture sheet

### Requirement: Release contents
Each release SHALL attach, from one build: `operating-model-author.zip` (the main download for AI-assisted authoring and for claude.ai upload), `operating-model-explorer.html` (the standalone engine for authors who don't use AI) and a demo snapshot exported from the Acme capture sheet. The release notes SHALL say which file to use for which purpose, and SHALL list SHA-256 checksums.

#### Scenario: Release assets
- **WHEN** a release is published
- **THEN** it has exactly those three files, and the engine inside the zip has the same checksum as the standalone engine attached to the release

### Requirement: Brands from the library
When the colleague asks to use brands from a brand library and gives its location, the skill SHALL:
- copy each chosen brand pack folder, unchanged, into `brands/<id>/` next to the capture sheet;
- fill in the Parties table's `Brand` column;
- list each pack's id and version under `## Sources`.

The skill SHALL NOT edit a pack's contents. If a named brand isn't in the library, it SHALL ask rather than invent colours or marks. The output-location rules, including the public-repo warning, apply to the copied packs too.

#### Scenario: Packs copied, not altered
- **WHEN** the skill is given the fictional brand library in `tests/skill-packs/brand-library/` and asked to use Acme and Globex (skill trial)
- **THEN** the output folder has `brands/acme/` and `brands/globex/`, byte-identical to the library copies, the Brand column names both, Sources lists both ids with their versions, and the sheet validates with 0 errors when loaded as a folder

#### Scenario: Brand not in the library
- **WHEN** the colleague asks for a brand that isn't in the library (skill trial)
- **THEN** the skill says it isn't there and asks what to do, and it writes no invented pack

### Requirement: Structure diagrams from org material
When the material includes org charts, collaboration models or similar relationship slides, the skill SHALL draft one `## Structure:` section per diagram, using the author's own band names and kinds, mapping each box to an existing or newly drafted role or team, carrying people's names and extra labels into the `Name` and `Note` columns, and turning relationships into undirected lines between cells. It SHALL mark one diagram `Main: yes` only when the material makes clear which diagram covers the whole company or partnership; otherwise it SHALL record that as an open question. Boxes or relationships it cannot place SHALL be recorded as open questions, not guessed.

#### Scenario: Org slides become structure sections
- **WHEN** the skill is given the fictional "org-chart" pack in `tests/skill-packs/org-chart/`, which holds a partnership slide and a sub-programme slide
- **THEN** the draft sheet has two Structure sections, exactly one marked `Main: yes`, with related diagrams linked, and it loads in the engine with no errors

#### Scenario: Unclear main diagram
- **WHEN** the material has two diagrams and neither clearly covers the whole partnership
- **THEN** the sheet's Open questions ask which diagram is the main one
