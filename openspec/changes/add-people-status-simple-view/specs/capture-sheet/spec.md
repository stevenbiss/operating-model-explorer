# Spec Delta

## ADDED Requirements

### Requirement: People column in Roles
The Roles table MAY have a `People` column listing the people who hold each role, separated by semicolons. An empty cell SHALL mean the role lists no people. A sheet and a folder describing the same people SHALL produce the same model.

#### Scenario: People from the sheet
- **WHEN** a Roles row has `Sam Example; Alex Sample` in its People column
- **THEN** that role lists both people, in that order, and its lane header shows "Multiple people"

### Requirement: Status lines
A `## Process:` or `## Structure:` section MAY have a `Status:` line among its other lines, with the value `Under review` or `Agreed` (ignoring case and spacing). A missing line SHALL mean Under review. Any other value SHALL be an error naming the section and listing the allowed values.

#### Scenario: Unknown status value
- **WHEN** a process section has the line `Status: Done`
- **THEN** the report shows an error naming the process section and listing "Under review" and "Agreed"

### Requirement: View line
The lines under the sheet's title MAY include `View: Simple` or `View: Detailed` (ignoring case), which set the home-page view. A missing line SHALL mean Simple. Any other value SHALL be an error naming the line and listing the allowed values. The format version SHALL stay at 1.

#### Scenario: Detailed from the sheet
- **WHEN** a sheet has `View: Detailed` under its title
- **THEN** the exported snapshot's home page shows the key messages section

#### Scenario: Unknown view value
- **WHEN** a sheet has `View: Full` under its title
- **THEN** the report shows an error naming the line and listing "Simple" and "Detailed"
