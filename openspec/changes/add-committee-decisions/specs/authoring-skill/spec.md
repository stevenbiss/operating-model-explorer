# Spec Delta

## ADDED Requirements

### Requirement: Committees from joint decisions
When the material shows a step decided or done jointly by people from more than one party (for example a shared decision on a process slide, "the steering group decides", or "by committee"), the skill SHALL draft a `## Committees` row and name that committee as the step's owner, instead of picking one member as owner. It SHALL ask the colleague to confirm the committee's members. Members it cannot place SHALL be recorded as `(gap)` open questions, and it SHALL NOT invent members. When the material shows one person deciding with others only consulted, the skill SHALL keep a single role owner.

#### Scenario: Joint decision becomes a committee
- **WHEN** the skill is given the fictional "joint-decision" pack in `tests/skill-packs/joint-decision/`, where a slide says an Acme role and a Globex role decide "Go or no-go" together (skill trial)
- **THEN** the draft sheet has a Committees row with both roles as members, "Go or no-go" is owned by that committee, the skill asks the colleague to confirm the members, and the sheet loads with 0 errors

#### Scenario: Unplaced member
- **WHEN** the same pack also says "someone from finance" sits on the decision, and no finance role exists (skill trial)
- **THEN** the sheet's Open questions has a `(gap)` item naming the committee and the unplaced member, and no finance role is invented
