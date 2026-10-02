# Spec Delta

## MODIFIED Requirements

### Requirement: One document, fixed sections
A capture sheet SHALL be a single Markdown file whose first heading is `# Operating model: <name>`. The engine SHALL recognise these `##` sections by heading: `Purpose`, `Key messages`, `About this model`, `Parties`, `Teams`, `Roles`, `Workstreams`, one `Process: <name>` section per process, one `Structure: <name>` section per structure diagram, `Personas`, `Theme`, `Notes: <element name>`, `Open questions` and `Sources`. The sections `Purpose`, `Key messages`, `Parties` and `Roles` SHALL be required. Any other `##` heading SHALL produce a warning naming it. HTML comments (`<!-- … -->`) SHALL be ignored, so templates can carry guidance.

#### Scenario: Acme capture sheet loads cleanly
- **WHEN** `examples/acme-capture-sheet/capture-sheet.md` is loaded in author mode together with its `assets/` folder (Load folder or a `.zip`)
- **THEN** the validation report shows 0 errors and 0 warnings, and the preview shows the Acme + Globex model

#### Scenario: Missing required section
- **WHEN** a capture sheet with no `## Roles` section is loaded
- **THEN** the report shows an error saying the Roles section is missing, with a fix naming the heading to add

#### Scenario: Structure section recognised
- **WHEN** a sheet has a `## Structure: Partnership` section
- **THEN** no unknown-section warning is shown, and the preview offers a "Partnership" diagram

### Requirement: Tables recognised by column name
Parties, teams, roles, workstreams, process steps, RACI, personas, and structure bands, boxes and lines SHALL be written as Markdown tables. Columns SHALL be recognised by header name, ignoring case and spacing, in any order. Each table SHALL have its required columns (for example `Role` and `Party` for roles), and optional columns MAY be left out or left empty. An unrecognised column SHALL produce a warning. A missing required column SHALL be an error naming the table and the column.

#### Scenario: Missing required column
- **WHEN** a Roles table has no `Party` column
- **THEN** the report shows an error naming the Roles table and the missing `Party` column

#### Scenario: Columns in a different order
- **WHEN** a Roles table lists its columns as `Summary | Party | Role`
- **THEN** it loads exactly as it does with the columns in the order `Role | Party | Summary`

#### Scenario: Lines table missing a column
- **WHEN** a structure's Lines table has no `To party` column
- **THEN** the report shows an error naming the structure's Lines table and the missing `To party` column

## ADDED Requirements

### Requirement: Structure sections
Each `## Structure: <name>` section SHALL describe one structure. It SHALL be able to start with these lines: `Kind:`, `Summary:`, `Main: yes`, `Related:` (structure names separated by semicolons), `Workstreams:` (workstream names separated by semicolons), `Change:`, `Today:` and `ID:`. These are followed by the subsections:
- `### Bands` (required): a table with the columns `Band` (required), `Inside` (the name of the parent band, for a sub-band) and `Opens` (a structure name). Bands are drawn in row order.
- `### Boxes` (required): a table with the columns `Band` (required), `Role`, `Team`, `Name`, `Note`, `Change` and `Today`. Exactly one of `Role` or `Team` is filled in each row. Boxes are placed in row order.
- `### Lines` (optional): a table with the columns `From band`, `From party`, `To band` and `To party` (all required) and `Label`.
- `### Notes` (optional): rendered as the diagram's narrative.

Bands SHALL be referred to by name, and band names SHALL be unique within their structure. Roles, teams, parties, structures and workstreams SHALL be referred to by name, under the same rules as elsewhere in the sheet. A sheet and a folder describing the same structures SHALL produce the same model.

#### Scenario: Structure written in a sheet
- **WHEN** a sheet has a Structure section with two bands, one of them inside the other, three boxes and one labelled line
- **THEN** the preview shows the diagram with the sub-band inside its band, the three boxes in their party columns and the labelled line

#### Scenario: Unknown band name in a box
- **WHEN** a Boxes row names the band "Deliver" and the structure has a band "Delivery"
- **THEN** the report shows an error naming the structure, the Boxes row and "Did you mean Delivery?"

#### Scenario: Role and team both filled
- **WHEN** a Boxes row fills in both `Role` and `Team`
- **THEN** the report shows an error naming the structure and the row, saying to fill in only one

#### Scenario: Missing Bands subsection
- **WHEN** a Structure section has no `### Bands` subsection
- **THEN** the report shows an error naming the structure and the missing subsection

#### Scenario: Sample parity
- **WHEN** `examples/acme-capture-sheet/capture-sheet.md` and `examples/acme-sample/` are both loaded
- **THEN** they produce the same structures, with the same bands, boxes, lines and relations
