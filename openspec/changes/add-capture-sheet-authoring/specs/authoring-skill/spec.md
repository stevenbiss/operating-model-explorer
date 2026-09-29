# Spec Delta

## Purpose

A Claude skill that turns a colleague's own background material into a clean, valid capture sheet through conversation. It drafts from what it's given, asks only about gaps and contradictions, and never overrides decisions a person has made. It is built on a portable core that other assistants can use later.

## ADDED Requirements

### Requirement: Installable skill package
The build SHALL produce `dist/operating-model-author.zip`, containing `SKILL.md`, the reference files (the capture sheet format spec, the blank template, the Acme capture sheet and the interview guide) and a single-file validator script that needs no `node_modules`. The same folder SHALL be usable as a Claude Code skill (copied into a `.claude/skills/` folder) and uploadable as a skill in claude.ai.

#### Scenario: Package contents
- **WHEN** `npm run build` completes
- **THEN** `dist/operating-model-author.zip` exists and contains `SKILL.md`, the four reference files and the validator script

#### Scenario: Bundled validator runs on its own
- **WHEN** the validator script is copied out of the unzipped package into an empty folder and run against the Acme capture sheet
- **THEN** it reports 0 errors and 0 warnings and exits successfully

### Requirement: Portable core
The format spec, template, example and interview guide SHALL be plain Markdown with no Claude-specific instructions or tool names, so they can be given to another AI assistant unchanged. Only `SKILL.md` SHALL contain Claude-specific workflow.

#### Scenario: Core has no Claude-specific content
- **WHEN** the four reference files are searched for Claude tool names or Claude-only instructions
- **THEN** there are no matches

### Requirement: Draft first, interview when context is thin
When the colleague provides substantial material (for example a deck, notes or tables covering parties, roles and at least one process), the skill SHALL produce a complete draft capture sheet before asking questions. When the material is too thin to draft from, it SHALL interview the colleague, one question at a time, in this order: purpose and key messages, parties, roles, workstreams, processes, personas.

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
