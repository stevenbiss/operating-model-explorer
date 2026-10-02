# Spec Delta

## MODIFIED Requirements

### Requirement: Draft first, interview when context is thin
When the colleague provides substantial material (for example a deck, notes or tables covering parties, roles and at least one process or org diagram), the skill SHALL produce a complete draft capture sheet before asking questions. When the material is too thin to draft from, it SHALL interview the colleague, one question at a time, in this order: purpose and key messages, parties, roles, workstreams, processes, structure diagrams, personas.

#### Scenario: Rich context gives a draft first
- **WHEN** the skill is given the fictional "rich" context pack in `tests/skill-packs/rich/`
- **THEN** its first deliverable is a full capture sheet that loads in the engine, before it asks any question

#### Scenario: Thin context starts an interview
- **WHEN** the skill is given only the one-paragraph "thin" pack in `tests/skill-packs/thin/`
- **THEN** it asks about the model's purpose first and does not produce a sheet of guesses

## ADDED Requirements

### Requirement: Structure diagrams from org material
When the material includes org charts, collaboration models or similar relationship slides, the skill SHALL draft one `## Structure:` section per diagram, using the author's own band names and kinds, mapping each box to an existing or newly drafted role or team, carrying people's names and extra labels into the `Name` and `Note` columns, and turning relationships into undirected lines between cells. It SHALL mark one diagram `Main: yes` only when the material makes clear which diagram covers the whole company or partnership; otherwise it SHALL record that as an open question. Boxes or relationships it cannot place SHALL be recorded as open questions, not guessed.

#### Scenario: Org slides become structure sections
- **WHEN** the skill is given the fictional "org-chart" pack in `tests/skill-packs/org-chart/`, which holds a partnership slide and a sub-programme slide
- **THEN** the draft sheet has two Structure sections, exactly one marked `Main: yes`, with related diagrams linked, and it loads in the engine with no errors

#### Scenario: Unclear main diagram
- **WHEN** the material has two diagrams and neither clearly covers the whole partnership
- **THEN** the sheet's Open questions ask which diagram is the main one
