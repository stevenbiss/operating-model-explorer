# persona-lens Specification

## Purpose
Lets each viewer enter the operating model from their own perspective. Their persona sets where they start and what is highlighted, while the whole model and its key messages stay identical and visible for everyone.

## Requirements

### Requirement: Choose a persona on arrival
When a snapshot opens without a persona in the URL, the viewer SHALL be offered the model's personas (name and short description) plus an option to explore without a persona. The choice SHALL be skippable, and changeable at any time from every view.

#### Scenario: Arrival
- **WHEN** the sample snapshot is opened for the first time
- **THEN** every sample persona is offered, along with "Explore without a persona"

#### Scenario: Change persona later
- **WHEN** the viewer is on a process swimlane and switches to another persona
- **THEN** the same process remains open, and the highlighting updates to the new persona

### Requirement: Persona entry point
Each persona SHALL define an entry point: the overview, a workstream, a process or a role profile. Choosing the persona SHALL open that view.

#### Scenario: Enter at a process
- **WHEN** the viewer chooses a sample persona whose entry point is a specific process
- **THEN** that process's swimlane opens, and the breadcrumb shows its place in the model

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
With a persona selected, the viewer SHALL offer a summary of every step, across all processes, where the persona's roles are owner, appear in RACI or are members of the owning committee, grouped by process and showing the persona's RACI letter. For a committee-owned step, the letter SHALL be the one the committee gives the persona's role, and the committee's name SHALL be shown. When the model has change data, the summary SHALL offer to show only steps that are new, changed or removed ("What changes for me").

#### Scenario: Summary contents
- **WHEN** a sample persona opens "What matters for me"
- **THEN** each listed step shows its process, its name and the persona's R, A, C or I, and each links to its step detail

#### Scenario: Committee step in the summary
- **WHEN** the sample persona "Acme account lead" opens "What matters for me"
- **THEN** "Go or no-go" is listed under "Qualify an opportunity" with A and the bid board's name

#### Scenario: What changes for me
- **WHEN** the model has change data and the viewer turns on "Only changes"
- **THEN** only the steps with status new, changed or removed remain in the summary, each with its badge

### Requirement: Persona in the URL
The selected persona SHALL be part of the URL fragment, so a link can open the snapshot as a given persona.

#### Scenario: Link as persona
- **WHEN** the snapshot is opened with a URL fragment naming a sample persona
- **THEN** the persona prompt is skipped and that persona's highlighting is active

### Requirement: Accessible persona switching
The persona control SHALL be keyboard operable and labelled for screen readers. A change of persona SHALL be announced to assistive technology.

#### Scenario: Keyboard switch
- **WHEN** a keyboard user opens the persona control, selects a persona with the arrow keys and presses Enter
- **THEN** the persona changes, and a live region announces the new persona name

### Requirement: Only changes and change markers move together
Turning on "Only changes" SHALL also turn change markers on, and SHALL announce "Only changes shown. Change markers turned on." to assistive technology. Turning change markers off SHALL also turn "Only changes" off.

#### Scenario: Only changes turns markers on
- **WHEN** change markers are off and the viewer turns on "Only changes"
- **THEN** change markers turn on, removed steps owned by the persona are listed with a "Removed" badge, and the change is announced

### Requirement: Idle member highlight
With a persona selected, an idle committee member that is one of the persona's roles SHALL be marked inside its committee lane's member list with the text cue "You", not by colour alone, and the committee lane SHALL be marked "Your committee" as for any member. When that member is hidden behind "+ N more", the "+ N more" entry SHALL carry the "You" cue.

#### Scenario: Persona is an idle member
- **WHEN** a persona mapped to Legal counsel views the sample's "Qualify an opportunity"
- **THEN** the bid board lane is marked "Your committee", and its "Legal counsel · C" entry shows "You"

#### Scenario: Hidden behind more
- **WHEN** the persona's role is one of the idle members hidden behind "+ N more"
- **THEN** the "+ N more" entry shows "You"
