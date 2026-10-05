# Spec Delta

## MODIFIED Requirements

### Requirement: L2 process swimlane
A process SHALL be shown as a swimlane with one lane per role that owns or takes part in its steps, and one lane per committee that owns any of its steps (see committees › Committee lanes in the swimlane). Role lanes SHALL be grouped and labelled by party. Committee lanes SHALL form one group in the middle, between the first party group and the rest. A role takes part in a step when it appears in the step's RACI or is a member of the committee that owns it. Steps SHALL appear in their owner's lane in flow order. Every `next` relationship SHALL be drawn as a connector. Handoffs that cross parties SHALL be visually distinct from handoffs within a party. Decision branches SHALL show their labels.

#### Scenario: Lanes and steps
- **WHEN** the viewer opens a sample process whose steps are owned by roles from two parties
- **THEN** a lane appears for each of those roles, grouped under the two party names, and each step sits in its owner's lane in list order

#### Scenario: Decision branches
- **WHEN** a step has `next` with two labelled branches
- **THEN** two connectors leave that step, each showing its label

#### Scenario: Cross-party handoff
- **WHEN** a connector joins steps owned by roles in different parties
- **THEN** it is styled differently from same-party connectors, and a legend explains the difference

#### Scenario: Process without committees
- **WHEN** a process has no committee-owned steps
- **THEN** no committees group or heading is shown

### Requirement: L3 step detail
Activating a step SHALL open its detail: name, owner, RACI, inputs, outputs, systems, KPIs and narrative, showing only fields that have content. A role owner SHALL be shown with its party. A committee owner SHALL be shown with its "By committee" badge and its members split by organisation, each with their RACI letter, and SHALL link to the committee page (see committees › Members shown when a committee step is opened). The detail SHALL offer navigation to the previous and next steps in the flow. When a step has several next steps, each SHALL be offered by its label.

#### Scenario: Open and move along the flow
- **WHEN** the viewer opens a step's detail and activates "Next"
- **THEN** the detail of the following step in the flow is shown, and the swimlane highlights it

#### Scenario: Committee owner in the detail
- **WHEN** the viewer opens the detail of a committee-owned step
- **THEN** the owner shows the committee's name with a "By committee" badge and its members under one heading per party with their letters, and activating the committee name opens its page

### Requirement: Role profile
Activating a role anywhere SHALL show its profile: party, team, description, every committee it is a member of (with its letter), every step across all processes where it is owner, appears in RACI or is a member of the owning committee, grouped by process, and every structure diagram with a box for that role.

#### Scenario: Role across processes
- **WHEN** the viewer opens the profile of a sample role that appears in two processes
- **THEN** the profile lists the relevant steps under both process names, each linking to its step detail

#### Scenario: Role in diagrams
- **WHEN** the viewer opens the profile of a role that has boxes in two structure diagrams
- **THEN** the profile links to both diagrams

#### Scenario: Role on a committee
- **WHEN** the viewer opens the profile of Partner manager in the sample
- **THEN** the profile links to the bid board with the letter A, and lists "Go or no-go" with A as a step Partner manager takes part in through the committee

### Requirement: Search
The viewer SHALL provide search across the names and descriptions of all elements (including committees) and steps, and across the name and note text of structure boxes, with results grouped by type and each result opening its element. A match in a box's name or note text SHALL be listed under its structure and SHALL open that structure's diagram.

#### Scenario: Find a step
- **WHEN** the viewer searches for part of a step name
- **THEN** that step appears in the results under its type label, and activating it opens its detail

#### Scenario: Find a person on a diagram
- **WHEN** the viewer searches for a name that appears only as a box's name text
- **THEN** the structure containing that box appears in the results, and activating it opens the diagram

#### Scenario: Find a committee
- **WHEN** the viewer searches for "bid board"
- **THEN** the bid board appears under the committees label, and activating it opens the committee page

### Requirement: Small screens
At viewport widths below 768px, the swimlane SHALL be presented as a vertical, ordered list of steps, each showing its lane (role and party, or committee and members) and its next steps, with no horizontal page scrolling.

#### Scenario: Mobile swimlane
- **WHEN** a process is opened at 375px wide
- **THEN** the steps appear as a vertical list in flow order, each labelled with its role and party, or its committee, and the page does not scroll horizontally

### Requirement: Element pages
Parties, teams, committees and personas SHALL each have a page showing their name, summary and related elements: a party's teams and roles, a team's roles, a committee's members and steps (see committees › Committee page), and a persona's roles and entry point. Search results and links for these types SHALL open that page.

#### Scenario: Open a party from search
- **WHEN** the viewer searches for a party name and opens the result
- **THEN** a page shows the party's name, its summary, and links to its teams and roles
