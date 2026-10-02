# Spec Delta

## MODIFIED Requirements

### Requirement: Theme section
An optional `## Theme` section SHALL hold `Label <term>: <value>` lines for terminology (e.g. `Label workstream: Value stream`). Lines for the retired keys (colours, fonts, logo, palette) SHALL load with one warning each, saying the line is ignored and that party colours and marks now come from brand packs.

#### Scenario: Theme from the sheet
- **WHEN** the Acme sheet is loaded together with its folder
- **THEN** the preview says "Value stream" instead of "Workstream", and the report shows no theme messages

#### Scenario: Retired theme line
- **WHEN** a sheet's Theme section contains `Primary colour: #0b1f4d`
- **THEN** the report shows a warning naming that line as ignored, and export remains enabled

## ADDED Requirements

### Requirement: Brand column in Parties
The Parties table MAY have a `Brand` column naming a brand pack id for each party. Brand packs SHALL be read from the `brands/` folder next to the sheet, when the sheet is loaded as a folder or `.zip`. An empty cell SHALL mean the party has no brand.

#### Scenario: Brands from the sheet's folder
- **WHEN** the Acme capture-sheet folder, with `brands/acme/` and `brands/globex/`, is loaded and its Parties table names those brands
- **THEN** the report shows 0 errors and 0 warnings, and each party is shown with its brand's colour and mark
