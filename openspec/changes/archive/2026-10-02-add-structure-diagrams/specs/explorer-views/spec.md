# Spec Delta

## MODIFIED Requirements

### Requirement: L0 model overview
The overview SHALL show the model's name, its purpose (rendered narrative), its parties, its workstreams at a glance, its structure diagrams and its key messages. Structure diagrams SHALL be listed with the main diagram first and marked as the main diagram, each with its kind when it has one. A model with no structures SHALL show no structure list.

#### Scenario: Overview content
- **WHEN** the sample model opens with no persona selected
- **THEN** the overview shows the model name, the purpose text, every party, every workstream, every structure diagram and every key message

#### Scenario: Main diagram first
- **WHEN** a model has three structures and the main one is listed last in the content
- **THEN** the overview lists the main diagram first, marked as the main diagram, and each link opens its diagram

### Requirement: L1 workstream view
Each workstream SHALL show its summary, the parties and roles involved, its processes, and the structure diagrams related to it (those that list it in `workstreams`). Workstreams marked `detail: outline` SHALL be shown with their summary and labelled as outline only.

#### Scenario: Outline workstream
- **WHEN** the viewer opens a workstream marked `outline`
- **THEN** its summary is shown with an "Outline only" label, and no empty process list is shown

#### Scenario: Related diagrams on a workstream
- **WHEN** a structure lists `workstreams: [presales]` and the viewer opens the Presales workstream
- **THEN** the workstream page links to that structure diagram

### Requirement: Role profile
Activating a role anywhere SHALL show its profile: party, team, description, every step across all processes where it is owner or appears in RACI, grouped by process, and every structure diagram with a box for that role.

#### Scenario: Role across processes
- **WHEN** the viewer opens the profile of a sample role that appears in two processes
- **THEN** the profile lists the relevant steps under both process names, each linking to its step detail

#### Scenario: Role in diagrams
- **WHEN** the viewer opens the profile of a role that has boxes in two structure diagrams
- **THEN** the profile links to both diagrams

### Requirement: Search
The viewer SHALL provide search across the names and descriptions of all elements and steps, and across the name and note text of structure boxes, with results grouped by type and each result opening its element. A match in a box's name or note text SHALL be listed under its structure and SHALL open that structure's diagram.

#### Scenario: Find a step
- **WHEN** the viewer searches for part of a step name
- **THEN** that step appears in the results under its type label, and activating it opens its detail

#### Scenario: Find a person on a diagram
- **WHEN** the viewer searches for a name that appears only as a box's name text
- **THEN** the structure containing that box appears in the results, and activating it opens the diagram
