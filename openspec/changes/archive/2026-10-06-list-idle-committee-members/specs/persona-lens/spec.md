# Spec Delta

## ADDED Requirements

### Requirement: Idle member highlight
With a persona selected, an idle committee member that is one of the persona's roles SHALL be marked inside its committee lane's member list with the text cue "You", not by colour alone, and the committee lane SHALL be marked "Your committee" as for any member. When that member is hidden behind "+ N more", the "+ N more" entry SHALL carry the "You" cue.

#### Scenario: Persona is an idle member
- **WHEN** a persona mapped to Legal counsel views the sample's "Qualify an opportunity"
- **THEN** the bid board lane is marked "Your committee", and its "Legal counsel · C" entry shows "You"

#### Scenario: Hidden behind more
- **WHEN** the persona's role is one of the idle members hidden behind "+ N more"
- **THEN** the "+ N more" entry shows "You"
