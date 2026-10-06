# Spec Delta

## MODIFIED Requirements

### Requirement: L2 process swimlane
A process SHALL be shown as a swimlane with one lane per role that owns or takes part in its steps (except idle committee members, which are listed in their committee's lane instead; see committees › Committee lanes in the swimlane), and one lane per committee that owns any of its steps (see committees › Committee lanes in the swimlane). Role lanes SHALL be grouped and labelled by party. Committee lanes SHALL form one group in the middle, between the first party group and the rest. A role takes part in a step when it appears in the step's RACI or is a member of the committee that owns it. A committee member that takes part only through its committees is idle in that process. Steps SHALL appear in their owner's lane in flow order. Every `next` relationship SHALL be drawn as a connector. Handoffs that cross parties SHALL be visually distinct from handoffs within a party. Decision branches SHALL show their labels.

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

#### Scenario: No empty member lanes
- **WHEN** a process's committee has three members who take part in nothing else in that process
- **THEN** none of the three has a lane, the committee lane lists all three, and every role lane shown owns a step or has a RACI letter on a role-owned step
