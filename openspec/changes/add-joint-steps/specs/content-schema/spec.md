# Spec Delta

## ADDED Requirements

### Requirement: Several owners on a step
A step's `owner` SHALL accept either one role or committee id, as today, or a list of two or more role ids (see joint-steps). The published schema and the content reference SHALL describe both forms. Every id in the list SHALL be checked like any owner reference, with "Did you mean …?" suggestions.

#### Scenario: Owner list in a file
- **WHEN** a process file has a step with `owner: [bid-manager, solution-architect]`
- **THEN** it loads with no messages as a joint step

#### Scenario: Unknown role in an owner list
- **WHEN** a step has `owner: [bid-manager, sol-arch]` and the role `solution-architect` exists
- **THEN** the report shows an error naming the step, the unknown id and "Did you mean solution-architect?"
