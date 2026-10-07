# Spec Delta

## ADDED Requirements

### Requirement: Several owners in the Owner cell
A process step's `Owner` cell MAY list two or more role names separated by semicolons, making the step a joint step (see joint-steps). Each name SHALL be matched like any role name, ignoring case, spacing and punctuation, with "Did you mean …?" suggestions. A sheet and a folder describing the same joint step SHALL produce the same model, and the format version SHALL stay at 1.

#### Scenario: Joint owners in a sheet
- **WHEN** a step row's Owner is `bid manager; Solution  Architect`
- **THEN** the step is a joint step owned by Bid manager and Solution architect, with no messages

#### Scenario: Unknown name in the Owner list
- **WHEN** a step row's Owner is `Bid manager; Sol architect`
- **THEN** the report shows an error naming the process, the row and "Did you mean Solution architect?"
