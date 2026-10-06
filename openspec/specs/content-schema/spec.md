# content-schema Specification

## Purpose
Defines what an operating model is made of and how authors write it down: a folder of Markdown files, each with a structured header, checked against a published schema. This is the contract between the engine, human authors and future AI authoring tools.

## Requirements

### Requirement: Content folder layout
A model SHALL be a folder containing exactly one `model.md` at its root. It MAY also contain `theme.md` and the subfolders `parties/`, `teams/`, `roles/`, `committees/`, `personas/`, `workstreams/`, `processes/`, `structures/`, `assets/` (images) and `brands/` (brand packs, one folder per brand; see party-brands). The engine SHALL identify each element by its header `type`, not by its folder. The folders are a convention for authors. Files under `brands/` SHALL be read only as brand packs, never as elements.

#### Scenario: Minimal valid model
- **WHEN** a folder containing only a valid `model.md` is loaded in author mode
- **THEN** the validation report shows no errors
- **AND** the preview shows the model overview

#### Scenario: Missing model file
- **WHEN** a folder with no `model.md` is loaded
- **THEN** the validation report shows the error "No model.md found at the top of the folder" and export is disabled

#### Scenario: Brand packs are not elements
- **WHEN** a model folder contains `brands/globex/brand.md`
- **THEN** it is read as a brand pack, and it isn't reported as an unknown element or a file without a type

#### Scenario: Structure found by type, not folder
- **WHEN** a file with `type: structure` is placed in `roles/` instead of `structures/`
- **THEN** it loads as a structure and the report shows no error about its location

#### Scenario: Committee found by type, not folder
- **WHEN** a file with `type: committee` is placed in `roles/` instead of `committees/`
- **THEN** it loads as a committee and the report shows no error about its location

### Requirement: File format
Each content file SHALL consist of a YAML header between two `---` lines, followed by an optional Markdown body. The header SHALL hold structured fields. The body SHALL hold narrative, and the engine SHALL render it as formatted text wherever that element is described. Raw HTML in the body SHALL be shown as text, not executed.

#### Scenario: Narrative rendered
- **WHEN** a process file's body contains a heading, a bulleted list and bold text
- **THEN** the process detail shows them formatted as a heading, a list and bold text

#### Scenario: Script in content is not executed
- **WHEN** a body contains `<script>alert(1)</script>`
- **THEN** no dialog appears and the text is displayed literally or omitted

#### Scenario: Malformed header
- **WHEN** a file's header is not valid YAML
- **THEN** the validation report names the file and the line of the YAML error

### Requirement: Element types and fields
The schema SHALL define these element types, each with a required `id` (kebab-case, unique across the model), `type` and `name`:
- `model`: purpose, `key_messages` (the shared conclusions everyone should reach), optional `version`.
- `party`: an organisation taking part (e.g. a partner company or a client).
- `team`: belongs to one party.
- `role`: belongs to one party, and optionally one team.
- `committee`: a group of member roles, from any parties, each with one RACI letter (a role → R/A/C/I map), that owns steps together (see committees). It belongs to no party.
- `persona`: a viewer type. It maps to one or more roles and has an entry point.
- `workstream`: summary, the parties involved, and `detail: detailed | outline`.
- `process`: belongs to one workstream, and has an ordered list of `steps`.
- `structure`: an author-designed relationship diagram with `bands`, `boxes` and optional `lines`, `kind`, `summary`, `related`, `workstreams` and `main` (see structure-diagrams).

Each step SHALL have an `id` (unique within its process), a `name` and an `owner` (a role or a committee). A step MAY also have `raci` (a role → R/A/C/I map), `inputs`, `outputs`, `systems`, `kpis`, `next` (the step ids that follow, with optional labels for decision branches) and `description`. When `next` is omitted, a step SHALL flow to the following step in the list.

#### Scenario: Sample exercises every type
- **WHEN** `examples/acme-sample/` is loaded
- **THEN** it contains at least one element of every type, including `structure` and `committee`, and at least one decision step with two labelled branches
- **AND** the validation report shows no errors

#### Scenario: Missing required field
- **WHEN** a role file has no `name`
- **THEN** the report shows an error naming the file and the missing field `name`

#### Scenario: Duplicate id
- **WHEN** two files declare `id: account-lead`
- **THEN** the report shows an error that names both files

#### Scenario: Structure and workstream cannot share an id
- **WHEN** a structure and a workstream both declare `id: presales`
- **THEN** the report shows a duplicate id error naming both files

### Requirement: References between elements
Every field that refers to another element (owner, party, team, workstream, persona roles, RACI keys, `next`, committee members, and a structure's box roles and teams, line parties, `related`, `workstreams` and band `opens`) SHALL be checked, and an unknown id SHALL be reported as an error that suggests the closest existing id. A step's owner SHALL be resolved against both roles and committees, and the suggestion SHALL come from either.

#### Scenario: Unknown owner
- **WHEN** a step's owner is `sol-arch` and no such role exists but `solution-architect` does
- **THEN** the report shows an error naming the process file, the step, the unknown id and the suggestion "Did you mean solution-architect?"

#### Scenario: Unknown owner close to a committee
- **WHEN** a step's owner is `bid-bord` and the committee `bid-board` exists
- **THEN** the report shows an error naming the process file, the step and "Did you mean bid-board?"

#### Scenario: Unknown party on a line
- **WHEN** a structure's line names the party `globx` and the party `globex` exists
- **THEN** the report shows an error naming the structure file, the unknown id and "Did you mean globex?"

### Requirement: Optional current vs future state
Any element or step MAY carry a `change` field with `status` (`new`, `changed`, `removed` or `unchanged`) and an optional `today` description. Models without any `change` data SHALL be valid and SHALL show no change-related UI.

#### Scenario: Model without change data
- **WHEN** a model with no `change` fields is loaded
- **THEN** no current-vs-future control or change badges appear anywhere

#### Scenario: Invalid change status
- **WHEN** a step has `change: { status: maybe }`
- **THEN** the report shows an error listing the allowed values

### Requirement: Forward-compatible fields
Unknown header fields SHALL produce a warning, not an error, so content written for a newer engine still loads.

#### Scenario: Unknown field
- **WHEN** a role has the header field `location: London`
- **THEN** the report shows a warning about the unknown field, and export remains enabled

### Requirement: Published schema and reference
The repo SHALL publish a machine-readable schema for every element type's header and a human-readable content reference. The reference SHALL list each type's fields, whether they are required, an example, and the EDGY concept the type corresponds to. The engine SHALL show the reference from author mode.

#### Scenario: Reference reachable from author mode
- **WHEN** the author activates "Content reference" in author mode
- **THEN** the reference is shown, listing every element type and its fields, without any network access

### Requirement: Plain-English validation messages
Every validation message SHALL state the file, the element (and step, if relevant), what is wrong, and how to fix it, without code or stack traces. Errors SHALL block export. Warnings SHALL NOT.

#### Scenario: Message format
- **WHEN** a model with one error and one warning is loaded
- **THEN** the report shows "1 error, 1 warning", each with a file name and a suggested fix
- **AND** the Export control is disabled until the error is fixed

### Requirement: Steps owned by removed roles
A step that is not removed, but whose owner is a removed role or a removed committee, SHALL produce a warning naming the step and the owner. Export SHALL remain enabled.

#### Scenario: Live step with a removed owner
- **WHEN** a role is marked removed and still owns a step that is not removed
- **THEN** the validation report shows a warning naming that step and role, and export remains enabled

#### Scenario: Live step with a removed committee
- **WHEN** a committee is marked removed and still owns a step that is not removed
- **THEN** the validation report shows a warning naming that step and committee, and export remains enabled

### Requirement: One RACI letter per cell
Each role SHALL have at most one RACI letter (R, A, C or I) per step, in both content folders and capture sheets. A value with more than one letter (e.g. `A/R`, `RA`) SHALL be an error naming the step and the role. The fix SHALL say: use R if the role does the work, A if it signs the work off.

#### Scenario: Combined letter in a folder
- **WHEN** a process file gives `account-lead: A/R` on a step
- **THEN** the report shows an error naming the step and Account lead, with the R-or-A guidance

### Requirement: One accountable role per step
Every step SHALL have exactly one accountable. For a step owned by a committee, the accountable SHALL be the committee's members marked A, jointly, and several of them SHALL NOT count as more than one accountable (see committees › RACI for committee-owned steps). Otherwise the accountable is the one role marked A. A step with no accountable SHALL produce a warning asking who signs it off. A step with more than one accountable SHALL produce a warning naming them. Neither case SHALL block export.

#### Scenario: No accountable role
- **WHEN** a step has an owner and RACI entries, but none of them is A
- **THEN** the report shows a warning naming the step and asking who signs it off, and export remains enabled

#### Scenario: Two accountable roles
- **WHEN** a step has A for both Account lead and Bid manager
- **THEN** the report shows a warning naming the step and both roles

#### Scenario: Committee counts as accountable
- **WHEN** a step owned by a committee with two members marked A has no A of its own
- **THEN** the report shows no accountability warning for that step

#### Scenario: Sample stays clean
- **WHEN** `examples/acme-sample/` is loaded
- **THEN** every step has exactly one accountable, and the report shows 0 errors and 0 warnings

### Requirement: Command-line validation
`npm run validate -- <path>` SHALL validate a capture sheet, a content folder or a `.zip`, using the same checks as the engine. It SHALL print each message with its level, location, problem and fix, followed by the counts. It SHALL exit with code 1 when there are errors, and 0 otherwise. Open questions SHALL be reported as warnings.

#### Scenario: Clean sheet
- **WHEN** `npm run validate -- examples/acme-capture-sheet/capture-sheet.md` is run
- **THEN** it prints "0 errors, 0 warnings" and exits with code 0

#### Scenario: Errors fail the command
- **WHEN** it is run against a fixture with an unknown owner
- **THEN** it prints the error with its location and "Did you mean …?", and exits with code 1

### Requirement: People, status and view fields
The schema SHALL accept these optional fields:
- on a role, `people`: a list of names (strings);
- on a process and on a structure, `status`: `under-review` or `agreed` (see review-status);
- on the model, `view`: `simple` or `detailed`, defaulting to `simple` (see explorer-views › L0 model overview).

A value outside the allowed list SHALL be an error naming the file and listing the allowed values. A `people` value that isn't a list of names SHALL be an error naming the role. The published schema and the content reference SHALL describe all three fields.

#### Scenario: Invalid view
- **WHEN** `model.md` has `view: compact`
- **THEN** the report shows an error naming `model.md` and listing "simple" and "detailed", and export is disabled

#### Scenario: People must be a list
- **WHEN** a role file has `people: Sam Example` (a single string, not a list)
- **THEN** the report shows an error naming the role and saying people is a list of names

#### Scenario: Reference lists the fields
- **WHEN** the author opens "Content reference" in author mode
- **THEN** the role, process, structure and model entries describe `people`, `status` and `view`
