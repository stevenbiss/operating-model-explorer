# Spec Delta

## Purpose

Defines the capture sheet: one readable Markdown document that holds a whole operating model. People and AI assistants can write, review and share it, and the engine can load it directly. It is an alternative to a content folder for authors who shouldn't need to know the file format.

## ADDED Requirements

### Requirement: One document, fixed sections
A capture sheet SHALL be a single Markdown file whose first heading is `# Operating model: <name>`. The engine SHALL recognise these `##` sections by heading: `Purpose`, `Key messages`, `About this model`, `Parties`, `Teams`, `Roles`, `Workstreams`, one `Process: <name>` section per process, `Personas`, `Theme`, `Notes: <element name>`, `Open questions` and `Sources`. The sections `Purpose`, `Key messages`, `Parties` and `Roles` SHALL be required. Any other `##` heading SHALL produce a warning naming it. HTML comments (`<!-- … -->`) SHALL be ignored, so templates can carry guidance.

#### Scenario: Acme capture sheet loads cleanly
- **WHEN** `examples/acme-capture-sheet/capture-sheet.md` is loaded in author mode together with its `assets/` folder (Load folder or a `.zip`)
- **THEN** the validation report shows 0 errors and 0 warnings, and the preview shows the Acme + Globex model

#### Scenario: Missing required section
- **WHEN** a capture sheet with no `## Roles` section is loaded
- **THEN** the report shows an error saying the Roles section is missing, with a fix naming the heading to add

### Requirement: Tables recognised by column name
Parties, teams, roles, workstreams, process steps, RACI and personas SHALL be written as Markdown tables. Columns SHALL be recognised by header name, ignoring case and spacing, in any order. Each table SHALL have its required columns (for example `Role` and `Party` for roles), and optional columns MAY be left out or left empty. An unrecognised column SHALL produce a warning. A missing required column SHALL be an error naming the table and the column.

#### Scenario: Missing required column
- **WHEN** a Roles table has no `Party` column
- **THEN** the report shows an error naming the Roles table and the missing `Party` column

#### Scenario: Columns in a different order
- **WHEN** a Roles table lists its columns as `Summary | Party | Role`
- **THEN** it loads exactly as it does with the columns in the order `Role | Party | Summary`

### Requirement: Things are referred to by name
Authors SHALL refer to parties, teams, roles, workstreams, processes and steps by their names, not ids. The engine SHALL derive each id from its name, in lowercase and hyphenated. An optional `ID` column, or an `ID:` line under the title, MAY set an id explicitly. Name matching SHALL ignore case, extra spaces and punctuation. An unknown name SHALL be an error naming the section and row, with a "Did you mean …?" suggestion when a close match exists. Two elements of the same type with the same name SHALL be an error. When elements of different types would derive the same id (for example a workstream and a process both called "Win the work"), the engine SHALL keep the names as written and make the ids unique by appending the type (e.g. `win-the-work-process`), with no message. A clash between ids an author set explicitly SHALL be an error, worded in capture-sheet terms and naming both sections.

#### Scenario: Owner written with different case
- **WHEN** a step's owner is written as `solution  Architect` and a role named "Solution architect" exists
- **THEN** the step is owned by Solution architect, and no message is shown

#### Scenario: Unknown name with a suggestion
- **WHEN** a step's owner is `Sol architect` and only "Solution architect" is close
- **THEN** the report shows an error naming the process, the step row and the name, with "Did you mean Solution architect?"

#### Scenario: Same name for a workstream and a process
- **WHEN** a sheet has a workstream and a process both named "Win the work"
- **THEN** it loads with no errors, and both appear under that name in the preview

### Requirement: Process sections
Each `## Process: <name>` section SHALL contain a `Workstream:` line, an optional `Summary:` line, and a step table with the columns `#`, `Step` and `Owner`. It MAY also have the optional columns `Description`, `Inputs`, `Outputs`, `Systems`, `KPIs`, `Next`, `Change` and `Today`. Lists in a cell (inputs, outputs, systems, KPIs) SHALL be separated by semicolons. `Next` SHALL accept step numbers or names, with optional labels (e.g. `Go: 4; No go: 5`). An empty `Next` SHALL mean the following row, and `End` SHALL mean the flow stops at that step. An optional `### Notes` subsection SHALL become the process's narrative.

#### Scenario: Decision with labelled branches
- **WHEN** a step row has `Next` set to `Go: 4; No go: 5`
- **THEN** the swimlane shows two connectors from that step, labelled "Go" and "No go", leading to steps 4 and 5

#### Scenario: Next points at a missing step
- **WHEN** a step row has `Next` set to `9` and the process has 5 steps
- **THEN** the report shows an error naming the process, the row and step number 9

### Requirement: RACI matrix per process
A process section MAY include a `### RACI` table with one row per step (by `#` or step name) and one column per role (by role name). Each cell SHALL be empty or a single letter: R, A, C or I. A cell with more than one letter (e.g. `A/R`) SHALL be an error naming the step and role, asking the author to choose one (see content-schema › One RACI letter per cell). An unknown role column or step row SHALL be an error with a suggestion.

#### Scenario: Matrix becomes RACI
- **WHEN** a RACI table gives Legal counsel `C` on "Submit the proposal"
- **THEN** that step's detail in the preview lists Legal counsel as Consulted

#### Scenario: Combined letters rejected
- **WHEN** a RACI cell for Account lead on "Capture the lead" contains `A/R`
- **THEN** the report shows an error naming the step and role, telling the author to use R if they do the work or A if they sign it off, and export is disabled

### Requirement: Personas table
A `## Personas` section SHALL be a table with the columns `Persona`, `Roles` (role names separated by semicolons) and `Starts at`, and an optional `Summary`. `Starts at` SHALL be one of `Overview`, `Workstream: <name>`, `Process: <name>` or `Role: <name>`.

#### Scenario: Persona starts at a process
- **WHEN** the Acme sheet's snapshot is exported and the persona "Acme account lead" is chosen
- **THEN** the "Qualify an opportunity" process opens

### Requirement: Theme section
An optional `## Theme` section SHALL hold `Key: value` lines for colours, fonts, the logo and labels (e.g. `Primary colour: #0b1f4d`, `Logo: assets/logo.svg`, `Label workstream: Value stream`). A logo or font SHALL be read from an `assets/` folder loaded alongside the sheet. The theming rules (contrast, offline assets only) SHALL apply unchanged.

#### Scenario: Theme from the sheet
- **WHEN** the Acme sheet is loaded together with its `assets/` folder
- **THEN** the preview uses the theme's primary colour, shows the logo, and says "Value stream" instead of "Workstream"

### Requirement: Narrative text
The paragraphs under `## Purpose` SHALL become the model's purpose, and `## About this model` SHALL become the model's narrative. A `## Notes: <element name>` section SHALL attach its text as the narrative of the named element (a workstream, party, role and so on), and an unknown name SHALL be an error with a suggestion. Narrative SHALL be rendered with the same Markdown rules as content files: raw HTML is shown as text, never executed.

#### Scenario: Notes for a workstream
- **WHEN** a sheet has `## Notes: Presales` with a paragraph of text
- **THEN** the Presales workstream view shows that paragraph

### Requirement: Open questions and Sources
`## Open questions` SHALL be a checklist (`- [ ]` / `- [x]`). Each unticked item SHALL appear in the author-mode report as a warning quoting its text, and ticked items SHALL be ignored. `## Sources` SHALL be a list of the material the sheet was drafted from. Neither section, nor any HTML comment, SHALL appear in an exported snapshot.

#### Scenario: Open questions become warnings
- **WHEN** a sheet has two unticked and one ticked open question
- **THEN** the report shows 2 warnings quoting the unticked questions, and export remains enabled

#### Scenario: Not in the snapshot
- **WHEN** a sheet with open questions and sources is exported
- **THEN** the snapshot file contains none of their text

### Requirement: Messages point into the sheet
Every validation message for a capture sheet SHALL name its location in the sheet, i.e. the section plus the row number or step name (e.g. "Process: Build the proposal › step 3"), instead of a content file path.

#### Scenario: Location in the message
- **WHEN** a step in the second row of the "Build the proposal" table has an unknown owner
- **THEN** the message names "Process: Build the proposal" and row 2

### Requirement: Same model as the folder
`examples/acme-capture-sheet/capture-sheet.md` SHALL describe exactly the same model as the `examples/acme-sample/` folder: the same elements, names, relationships, steps, RACI, change data, personas, theme and narrative. Where ids differ because the sheet derives them from names, they SHALL be compared by name.

#### Scenario: Snapshots match
- **WHEN** the sample is exported once from the folder and once from the capture sheet
- **THEN** both snapshots show the same overview, the same swimlanes and step details, and the same persona highlights

### Requirement: Template and format spec
The repo SHALL provide `templates/capture-sheet.md`, a blank capture sheet with every section, table header and guidance as HTML comments, and `docs/capture-sheet.md`, the human-readable format spec. Author mode SHALL link to the format spec from the content reference.

#### Scenario: Blank template loads
- **WHEN** `templates/capture-sheet.md` is loaded unchanged
- **THEN** the report lists what is missing (errors for the empty required sections) without crashing, and the guidance comments do not appear anywhere in the preview

### Requirement: Format version
A capture sheet SHALL declare its format version on a `Format: <n>` line under the title. The engine and the validator SHALL know which format versions they support. A sheet with a newer format SHALL be an error naming the sheet's format, the highest format this engine reads, and that a newer engine is needed. A sheet with no `Format:` line SHALL be treated as the current format, with a warning suggesting the line be added. The blank template, the Acme sheet and every sheet the skill writes SHALL include the line.

#### Scenario: Newer format
- **WHEN** a sheet declaring `Format: 99` is loaded
- **THEN** the report shows an error saying this engine supports up to the current format and a newer engine is needed, and export is disabled

#### Scenario: Missing format line
- **WHEN** a sheet with no `Format:` line is loaded
- **THEN** it loads as the current format, and the report shows a warning suggesting the `Format:` line be added
