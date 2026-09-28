# Spec Delta

## Purpose

Defines what an operating model is made of and how authors write it down: a folder of Markdown files, each with a structured header, checked against a published schema. This is the contract between the engine, human authors and future AI authoring tools.

## ADDED Requirements

### Requirement: Content folder layout
A model SHALL be a folder containing exactly one `model.md` at its root and, optionally, `theme.md` and the subfolders `parties/`, `teams/`, `roles/`, `personas/`, `workstreams/`, `processes/` and `assets/` (images). The engine SHALL identify each element by its header `type`, not by its folder. The folders are a convention for authors.

#### Scenario: Minimal valid model
- **WHEN** a folder containing only a valid `model.md` is loaded in author mode
- **THEN** the validation report shows no errors
- **AND** the preview shows the model overview

#### Scenario: Missing model file
- **WHEN** a folder with no `model.md` is loaded
- **THEN** the validation report shows the error "No model.md found at the top of the folder" and export is disabled

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
- `persona`: a viewer type. It maps to one or more roles and has an entry point.
- `workstream`: summary, the parties involved, and `detail: detailed | outline`.
- `process`: belongs to one workstream, and has an ordered list of `steps`.

Each step SHALL have an `id` (unique within its process), a `name` and an `owner` (a role). A step MAY also have `raci` (a role → R/A/C/I map), `inputs`, `outputs`, `systems`, `kpis`, `next` (the step ids that follow, with optional labels for decision branches) and `description`. When `next` is omitted, a step SHALL flow to the following step in the list.

#### Scenario: Sample exercises every type
- **WHEN** `examples/acme-sample/` is loaded
- **THEN** it contains at least one element of every type and at least one decision step with two labelled branches
- **AND** the validation report shows no errors

#### Scenario: Missing required field
- **WHEN** a role file has no `name`
- **THEN** the report shows an error naming the file and the missing field `name`

#### Scenario: Duplicate id
- **WHEN** two files declare `id: account-lead`
- **THEN** the report shows an error that names both files

### Requirement: References between elements
Every field that refers to another element (owner, party, team, workstream, persona roles, RACI keys, `next`) SHALL be checked, and an unknown id SHALL be reported as an error that suggests the closest existing id.

#### Scenario: Unknown owner
- **WHEN** a step's owner is `sol-arch` and no such role exists but `solution-architect` does
- **THEN** the report shows an error naming the process file, the step, the unknown id and the suggestion "Did you mean solution-architect?"

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
