# Spec Delta

## ADDED Requirements

### Requirement: One RACI letter per cell
Each role SHALL have at most one RACI letter (R, A, C or I) per step, in both content folders and capture sheets. A value with more than one letter (e.g. `A/R`, `RA`) SHALL be an error naming the step and the role. The fix SHALL say: use R if the role does the work, A if it signs the work off.

#### Scenario: Combined letter in a folder
- **WHEN** a process file gives `account-lead: A/R` on a step
- **THEN** the report shows an error naming the step and Account lead, with the R-or-A guidance

### Requirement: One accountable role per step
Every step SHALL have exactly one role marked A. A step with no A SHALL produce a warning asking who signs it off. A step with more than one A SHALL produce a warning naming the roles. Neither case SHALL block export.

#### Scenario: No accountable role
- **WHEN** a step has an owner and RACI entries, but none of them is A
- **THEN** the report shows a warning naming the step and asking who signs it off, and export remains enabled

#### Scenario: Two accountable roles
- **WHEN** a step has A for both Account lead and Bid manager
- **THEN** the report shows a warning naming the step and both roles

#### Scenario: Sample stays clean
- **WHEN** `examples/acme-sample/` is loaded
- **THEN** every step has exactly one A, and the report shows 0 errors and 0 warnings

### Requirement: Command-line validation
`npm run validate -- <path>` SHALL validate a capture sheet, a content folder or a `.zip`, using the same checks as the engine. It SHALL print each message with its level, location, problem and fix, followed by the counts. It SHALL exit with code 1 when there are errors, and 0 otherwise. Open questions SHALL be reported as warnings.

#### Scenario: Clean sheet
- **WHEN** `npm run validate -- examples/acme-capture-sheet/capture-sheet.md` is run
- **THEN** it prints "0 errors, 0 warnings" and exits with code 0

#### Scenario: Errors fail the command
- **WHEN** it is run against a fixture with an unknown owner
- **THEN** it prints the error with its location and "Did you mean …?", and exits with code 1
