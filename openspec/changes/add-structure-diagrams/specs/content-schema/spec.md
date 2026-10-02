# Spec Delta

## MODIFIED Requirements

### Requirement: Content folder layout
A model SHALL be a folder containing exactly one `model.md` at its root and, optionally, `theme.md` and the subfolders `parties/`, `teams/`, `roles/`, `personas/`, `workstreams/`, `processes/`, `structures/` and `assets/` (images). The engine SHALL identify each element by its header `type`, not by its folder. The folders are a convention for authors.

#### Scenario: Minimal valid model
- **WHEN** a folder containing only a valid `model.md` is loaded in author mode
- **THEN** the validation report shows no errors
- **AND** the preview shows the model overview

#### Scenario: Missing model file
- **WHEN** a folder with no `model.md` is loaded
- **THEN** the validation report shows the error "No model.md found at the top of the folder" and export is disabled

#### Scenario: Structure found by type, not folder
- **WHEN** a file with `type: structure` is placed in `roles/` instead of `structures/`
- **THEN** it loads as a structure and the report shows no error about its location

### Requirement: Element types and fields
The schema SHALL define these element types, each with a required `id` (kebab-case, unique across the model), `type` and `name`:
- `model`: purpose, `key_messages` (the shared conclusions everyone should reach), optional `version`.
- `party`: an organisation taking part (e.g. a partner company or a client).
- `team`: belongs to one party.
- `role`: belongs to one party, and optionally one team.
- `persona`: a viewer type. It maps to one or more roles and has an entry point.
- `workstream`: summary, the parties involved, and `detail: detailed | outline`.
- `process`: belongs to one workstream, and has an ordered list of `steps`.
- `structure`: an author-designed relationship diagram with `bands`, `boxes` and optional `lines`, `kind`, `summary`, `related`, `workstreams` and `main` (see structure-diagrams).

Each step SHALL have an `id` (unique within its process), a `name` and an `owner` (a role). A step MAY also have `raci` (a role → R/A/C/I map), `inputs`, `outputs`, `systems`, `kpis`, `next` (the step ids that follow, with optional labels for decision branches) and `description`. When `next` is omitted, a step SHALL flow to the following step in the list.

#### Scenario: Sample exercises every type
- **WHEN** `examples/acme-sample/` is loaded
- **THEN** it contains at least one element of every type, including `structure`, and at least one decision step with two labelled branches
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
Every field that refers to another element (owner, party, team, workstream, persona roles, RACI keys, `next`, and a structure's box roles and teams, line parties, `related`, `workstreams` and band `opens`) SHALL be checked, and an unknown id SHALL be reported as an error that suggests the closest existing id.

#### Scenario: Unknown owner
- **WHEN** a step's owner is `sol-arch` and no such role exists but `solution-architect` does
- **THEN** the report shows an error naming the process file, the step, the unknown id and the suggestion "Did you mean solution-architect?"

#### Scenario: Unknown party on a line
- **WHEN** a structure's line names the party `globx` and the party `globex` exists
- **THEN** the report shows an error naming the structure file, the unknown id and "Did you mean globex?"
