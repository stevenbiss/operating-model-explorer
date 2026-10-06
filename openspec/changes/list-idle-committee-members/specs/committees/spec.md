# Spec Delta

## MODIFIED Requirements

### Requirement: Committee lanes in the swimlane
Each committee that owns a shown step in a process SHALL get its own lane. A process MAY have several committees. All committee lanes SHALL form one group under one heading with the committees label ("Committees" by default), stacked in the order their first steps appear. The group SHALL sit in the middle of the swimlane: directly after the first party group, in the model's party order, that has a member of any committee shown in that process. So with two parties the committees sit between them, and with a client party first (e.g. Customer, Acme, Globex, with Acme and Globex members) they sit between the members' parties. With only one party group shown, the group SHALL sit after it.

A committee member SHALL get its own lane in its party group only when, in that process, it owns a shown step or has a RACI letter on a shown step that isn't owned by one of its committees. That lane's header SHALL list each committee in the process that the role sits on, with the role's letter in it (e.g. "Bid board member · A"). A member that takes part in the process only through its committees is an **idle member** there, and SHALL NOT get a lane. Idleness SHALL be worked out per process.

A committee lane's header SHALL show the committee's name, linking to the committee page, and below it list the committee's idle members in that process:
- grouped by party in the model's party order, each with its party's colour or mark;
- each entry showing the role's name and its letter in the committee (e.g. "Legal counsel · C"), followed by the role's person line (see role-people), and linking to the role's page.

Members that have their own lane SHALL NOT be listed. When the list needs more than four lines, the header SHALL show the first entries and "+ N more". "+ N more" SHALL link to the committee page, and its tooltip and accessible name SHALL list every idle member. All of a committee's members SHALL still be shown when a committee step is opened (see Members shown when a committee step is opened) and on the committee page. A step owned by a committee SHALL sit in the committee's lane and show a text badge "By committee" (following the committee label).

#### Scenario: Committee lane and badge
- **WHEN** the viewer opens a process in which a committee of an Acme role and a Globex role owns one step
- **THEN** a lane under "Committees" sits between the Acme group and the Globex group, its header shows the committee name, and the step sits in that lane with a "By committee" badge

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

#### Scenario: Idle member listed in the committee lane
- **WHEN** the viewer opens the sample's "Qualify an opportunity", where the bid board's member Legal counsel (C) owns no step and has no other RACI letter
- **THEN** the swimlane has no Legal counsel lane, and the bid board lane's header lists "Legal counsel · C" under Acme, linking to the Legal counsel page

#### Scenario: Member with its own step keeps its lane
- **WHEN** the bid board's member Account lead (A) also owns "Capture the lead"
- **THEN** the swimlane has an Account lead lane whose header says it is a bid board member with the letter A, and the bid board lane's header doesn't list Account lead

#### Scenario: Member with a RACI letter on another step keeps its lane
- **WHEN** the bid board's member Partner manager owns no step but is marked I on "Assess solution fit", which a role owns
- **THEN** Partner manager has its own lane, and isn't listed in the bid board lane's header

#### Scenario: People on a listed member
- **WHEN** an idle member's role lists one person, "Sam Example"
- **THEN** its entry in the committee lane's header shows the role, its letter and "Sam Example"

#### Scenario: Long member list
- **WHEN** a committee has nine idle members in a process
- **THEN** the header shows the first entries and "+ N more" within four lines, "+ N more" opens the committee page, and its tooltip and accessible name list all nine members

#### Scenario: Idle in one process, a lane in another
- **WHEN** a committee member is idle in one process and owns a step in another
- **THEN** it is listed in the committee lane in the first process, and has its own lane in the second

### Requirement: Members shown when a committee step is opened
Activating a committee-owned step SHALL open its step detail, as for any step. That detail SHALL lead with the committee's name and "By committee" badge, followed by all its members **split by organisation**: one heading per party, with the party's mark and name, listing each member role (linking to its role profile) with its RACI letter written out (e.g. "Accountable"). When more than one member is marked A, each SHALL be shown as "Accountable, jointly". The rest of the detail (description, RACI for non-members, inputs, outputs and the flow navigation) SHALL follow as for any step.

#### Scenario: Open the committee decision
- **WHEN** the viewer clicks "Go or no-go" in the sample's swimlane
- **THEN** the step detail opens with the bid board's name and "By committee" badge, then an Acme heading listing Account lead (Accountable, jointly), Bid manager (Informed) and Legal counsel (Consulted), and a Globex heading listing Partner manager (Accountable, jointly) and Solution architect (Consulted)

### Requirement: Sample committee
The Acme sample, in both its folder and capture-sheet forms, SHALL include the committee "Acme + Globex bid board", owning the step "Go or no-go" in "Qualify an opportunity", with the members Account lead (A), Partner manager (A), Solution architect (C), Bid manager (I) and Legal counsel (C). Legal counsel SHALL take no other part in that process, so the sample shows an idle member. It SHALL use fictional names only, and both forms SHALL still load with 0 errors and 0 warnings and stay in parity.

#### Scenario: Sample committee loads
- **WHEN** `examples/acme-sample/` and `examples/acme-capture-sheet/` are each loaded
- **THEN** both show 0 errors and 0 warnings, and in both "Go or no-go" sits in the bid board's lane with a "By committee" badge
