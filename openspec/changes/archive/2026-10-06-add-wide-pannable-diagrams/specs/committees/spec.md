# Spec Delta

## MODIFIED Requirements

### Requirement: Committee lanes in the swimlane
Each committee that owns a shown step in a process SHALL get its own lane. A process MAY have several committees. All committee lanes SHALL form one group under one heading with the committees label ("Committees" by default), stacked in the order their first steps appear. The group SHALL sit in the middle of the swimlane: directly after the first party group, in the model's party order, that has a member of any committee shown in that process. So with two parties the committees sit between them, and with a client party first (e.g. Customer, Acme, Globex, with Acme and Globex members) they sit between the members' parties. With only one party group shown, the group SHALL sit after it.

A committee lane's header SHALL show only the committee's name, linking to the committee page. It SHALL NOT list the members, which are shown when a committee step is opened (see Members shown when a committee step is opened) and on the committee page. Every member SHALL also get its own lane in its party group, like a role that takes part through RACI. That lane's header SHALL list each committee in the process that the role sits on, with the role's letter in it (e.g. "Bid board member · A"). A step owned by a committee SHALL sit in the committee's lane and show a text badge "By committee" (following the committee label).

#### Scenario: Committee lane and badge
- **WHEN** the viewer opens a process in which a committee of an Acme role and a Globex role owns one step
- **THEN** a lane under "Committees" sits between the Acme group and the Globex group, its header shows the committee name only, with no member list, and the step sits in that lane with a "By committee" badge

#### Scenario: Membership shown in the member's own lane
- **WHEN** the viewer opens the sample's "Qualify an opportunity"
- **THEN** the Partner manager lane header says it is a member of the bid board with the letter A, and the Solution architect lane header says it is a member with the letter C

#### Scenario: Two committees in one process
- **WHEN** a process has steps owned by two different committees, and the first of them in flow order is owned by the committee listed second in the content
- **THEN** both committee lanes sit together under one "Committees" heading between the Acme group and the Globex group, with the lane of the committee whose step comes first on top

#### Scenario: Lane header opens the committee
- **WHEN** the viewer activates the committee name in the lane header
- **THEN** the committee page opens

#### Scenario: Committee after the first party with members
- **WHEN** a model's parties are Customer, Acme and Globex in that order, and a process has steps owned by a Customer role and by a committee of an Acme role and a Globex role
- **THEN** the order of groups in the swimlane is Customer, Acme, Committees, Globex
