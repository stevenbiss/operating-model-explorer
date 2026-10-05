# Spec Delta

## MODIFIED Requirements

### Requirement: One document, fixed sections
A capture sheet SHALL be a single Markdown file whose first heading is `# Operating model: <name>`. The engine SHALL recognise these `##` sections by heading: `Purpose`, `Key messages`, `About this model`, `Parties`, `Teams`, `Roles`, `Committees`, `Workstreams`, one `Process: <name>` section per process, one `Structure: <name>` section per structure diagram, `Personas`, `Theme`, `Notes: <element name>`, `Open questions` and `Sources`. The sections `Purpose`, `Key messages`, `Parties` and `Roles` SHALL be required. Any other `##` heading SHALL produce a warning naming it. HTML comments (`<!-- … -->`) SHALL be ignored, so templates can carry guidance.

#### Scenario: Acme capture sheet loads cleanly
- **WHEN** `examples/acme-capture-sheet/capture-sheet.md` is loaded in author mode together with its `assets/` folder (Load folder or a `.zip`)
- **THEN** the validation report shows 0 errors and 0 warnings, and the preview shows the Acme + Globex model

#### Scenario: Missing required section
- **WHEN** a capture sheet with no `## Roles` section is loaded
- **THEN** the report shows an error saying the Roles section is missing, with a fix naming the heading to add

#### Scenario: Structure section recognised
- **WHEN** a sheet has a `## Structure: Partnership` section
- **THEN** no unknown-section warning is shown, and the preview offers a "Partnership" diagram

#### Scenario: Committees section recognised
- **WHEN** a sheet has a `## Committees` section with a valid table
- **THEN** no unknown-section warning is shown

### Requirement: Things are referred to by name
Authors SHALL refer to parties, teams, roles, committees, workstreams, processes and steps by their names, not ids. The engine SHALL derive each id from its name, in lowercase and hyphenated. An optional `ID` column, or an `ID:` line under the title, MAY set an id explicitly. Name matching SHALL ignore case, extra spaces and punctuation. An unknown name SHALL be an error naming the section and row, with a "Did you mean …?" suggestion when a close match exists. Two elements of the same type with the same name SHALL be an error, and so SHALL a role and a committee with the same name, because either can be named as an owner. When elements of other different types would derive the same id (for example a workstream and a process both called "Win the work"), the engine SHALL keep the names as written and make the ids unique by appending the type (e.g. `win-the-work-process`), with no message. A clash between ids an author set explicitly SHALL be an error, worded in capture-sheet terms and naming both sections.

#### Scenario: Owner written with different case
- **WHEN** a step's owner is written as `solution  Architect` and a role named "Solution architect" exists
- **THEN** the step is owned by Solution architect, and no message is shown

#### Scenario: Unknown name with a suggestion
- **WHEN** a step's owner is `Sol architect` and only "Solution architect" is close
- **THEN** the report shows an error naming the process, the step row and the name, with "Did you mean Solution architect?"

#### Scenario: Same name for a workstream and a process
- **WHEN** a sheet has a workstream and a process both named "Win the work"
- **THEN** it loads with no errors, and both appear under that name in the preview

#### Scenario: Same name for a role and a committee
- **WHEN** a sheet has a role and a committee both named "Bid board"
- **THEN** the report shows an error naming the Roles and Committees rows, asking for different names, and export is disabled

## ADDED Requirements

### Requirement: Committees table
An optional `## Committees` section SHALL be a table with the columns `Committee` and `Members`, and the optional columns `Summary`, `Change`, `Today` and `ID`. `Members` SHALL list role names separated by semicolons, each followed by its RACI letter in brackets (e.g. `Account lead (A); Partner manager (A); Legal counsel (C)`). A member with no letter, or more than one, SHALL be an error naming the Committees row and the member. A step's `Owner` cell MAY name a committee instead of a role. An unknown member SHALL be an error naming the Committees row, with a "Did you mean …?" suggestion. A sheet and a folder describing the same committees SHALL produce the same model, and the format version SHALL stay at 1.

#### Scenario: Committee owns a step in a sheet
- **WHEN** a sheet's Committees table has "Bid board" with the members `Account lead (A); Partner manager (A)`, and a step's Owner is `bid board`
- **THEN** it loads with no errors, and the preview shows that step in the Bid board lane with a "By committee" badge

#### Scenario: Unknown member in a sheet
- **WHEN** a Committees row lists the member `Partner mgr (A)` and the role "Partner manager" exists
- **THEN** the report shows an error naming the Committees row and "Did you mean Partner manager?"

#### Scenario: Member without a letter in a sheet
- **WHEN** a Committees row lists `Account lead; Partner manager (A)`
- **THEN** the report shows an error naming the Committees row and Account lead, asking for one letter in brackets: A if they share the decision, C if consulted, I if informed, R if they do the work

#### Scenario: Missing Members column
- **WHEN** a Committees table has no `Members` column
- **THEN** the report shows an error naming the Committees table and the missing `Members` column
