# Spec Delta

## MODIFIED Requirements

### Requirement: Terminology labels
The theme SHALL be able to rename the engine's terms: at least model, party, team, role, committee, persona, workstream, process, step, structure and key messages, each in singular and plural. Every visible label SHALL use the configured term, including the "By committee" badge and the "Your committee" cue, which use the singular committee term. Unset terms SHALL keep their defaults.

#### Scenario: Rename workstream
- **WHEN** the theme sets `labels: { workstream: "Value stream", workstreams: "Value streams" }`
- **THEN** navigation, headings, breadcrumbs and search results say "Value stream" or "Value streams", and "workstream" does not appear in the viewer UI

#### Scenario: Rename structure
- **WHEN** the theme sets `labels: { structure: "Org model", structures: "Org models" }`
- **THEN** the overview list, diagram headings, Related panels and search results say "Org model" or "Org models", and "structure" does not appear in the viewer UI

#### Scenario: Rename committee
- **WHEN** the theme sets `labels: { committee: "Steering group", committees: "Steering groups" }`
- **THEN** the swimlane heading says "Steering groups", committee-owned steps show "By steering group", the persona cue says "Your steering group", search results say "Steering groups", and "committee" does not appear in the viewer UI
