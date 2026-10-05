# Spec Delta

## MODIFIED Requirements

### Requirement: Highlight what's relevant
With a persona selected, the viewer SHALL emphasise the lanes of the persona's roles, the lanes of committees that have one of those roles as a member, the steps where those roles are owner, appear in RACI or are members of the owning committee, and the handoffs into and out of those lanes. Everything else SHALL stay visible and interactive, but de-emphasised. Emphasis SHALL NOT rely on colour alone, and SHALL include a text cue such as "Your lane", or "Your committee" on a committee lane (following the committee label).

#### Scenario: Highlighted lanes
- **WHEN** a persona mapped to one role views a process containing that role's lane
- **THEN** that lane is marked "Your lane", its steps are emphasised, and every other lane and step is still shown and can be opened

#### Scenario: Your committee
- **WHEN** the sample persona "Acme account lead" views "Qualify an opportunity"
- **THEN** the bid board's lane is marked "Your committee", "Go or no-go" is emphasised, and the Account lead lane is marked "Your lane"

#### Scenario: Nothing hidden
- **WHEN** the same process is viewed with persona A, persona B and no persona
- **THEN** the number of lanes, steps and connectors shown is the same in all three cases

### Requirement: What matters for me
With a persona selected, the viewer SHALL offer a summary of every step, across all processes, where the persona's roles are owner, appear in RACI or are members of the owning committee, grouped by process and showing the persona's RACI letter, or "Member" for a committee member with no letter. When the model has change data, the summary SHALL offer to show only steps that are new, changed or removed ("What changes for me").

#### Scenario: Summary contents
- **WHEN** a sample persona opens "What matters for me"
- **THEN** each listed step shows its process, its name and the persona's R, A, C or I, and each links to its step detail

#### Scenario: Committee step in the summary
- **WHEN** the sample persona "Acme account lead" opens "What matters for me"
- **THEN** "Go or no-go" is listed under "Qualify an opportunity" with "Member" and the bid board's name

#### Scenario: What changes for me
- **WHEN** the model has change data and the viewer turns on "Only changes"
- **THEN** only the steps with status new, changed or removed remain in the summary, each with its badge
