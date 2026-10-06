# Spec Delta

## ADDED Requirements

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
