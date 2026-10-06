# Spec Delta

## ADDED Requirements

### Requirement: People and status from the material
When the material names the people who hold a role (for example "Account lead: Sam Example" on an org chart), the skill SHALL list them in the Roles table's `People` column. It SHALL NOT invent names, and a role whose holder is unclear SHALL get no people and, when the material hints at one, a `(gap)` open question. The skill SHALL leave every process and structure diagram as Under review (no `Status:` line) unless the colleague or the material says it is agreed. It SHALL NOT set `View:` unless the colleague asks for the Detailed home page.

#### Scenario: People drafted, status left as review
- **WHEN** the skill is given the fictional "org-chart" pack, which names the holders of some roles (skill trial)
- **THEN** the draft sheet lists those names in the People column, has no `Status: Agreed` lines and no `View:` line, and validates with 0 errors

#### Scenario: Agreed when told
- **WHEN** the colleague says "the qualification process is agreed" during the trial
- **THEN** that process section gets `Status: Agreed` and no other section does
