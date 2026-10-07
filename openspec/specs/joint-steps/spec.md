# joint-steps Specification

## Purpose
Lets authors describe an activity that two or more roles do together as one step, and shows viewers that activity side by side in each owner's lane at the same point in the flow, so it isn't misread as a sequence.

## Requirements

### Requirement: Steps with several role owners
A step's owner MAY be two or more roles: a list in a content file, or role names separated by semicolons in a capture sheet's Owner cell. Such a step is a **joint step**. It SHALL remain one step, with one id, one name, one place in the flow and one detail page. The first owner listed SHALL be its primary owner. Joint owners SHALL all be roles. Naming a committee among several owners, or naming the same role twice, SHALL be an error naming the step. Joint owners SHALL get no RACI letter by default, and RACI rules SHALL apply as for any step.

#### Scenario: Joint step loads
- **WHEN** a step's Owner is `Bid manager; Solution architect`
- **THEN** it loads with no messages and is shown as one joint step owned by both roles

#### Scenario: Committee among joint owners
- **WHEN** a step's Owner lists a role and a committee
- **THEN** the report shows an error naming the step and saying joint owners must be roles, and export is disabled

#### Scenario: Same role twice
- **WHEN** a step's Owner is `Bid manager; Bid manager`
- **THEN** the report shows an error naming the step and the repeated role

### Requirement: Joint steps drawn in parallel
In the swimlane, a joint step SHALL be drawn as one box in each owner's lane, all in the same column, each showing the step name and a "Joint" badge. A dotted line SHALL tie the boxes together, and it SHALL NOT pass through any other step box. A connector into a joint step SHALL end at the owner box nearest the step it comes from. A connector out of it SHALL start at the owner box nearest the step it goes to. A connector counts as cross-party when the joint step's owners include a party other than the step at the other end.

#### Scenario: Parallel boxes with a dotted tie
- **WHEN** the viewer opens the sample's "Qualify an opportunity"
- **THEN** "Kick off the bid" appears once in the Bid manager lane and once in the Solution architect lane, in the same column, both marked "Joint", tied by a dotted line that crosses no other step box

#### Scenario: Connectors attach to the nearest box
- **WHEN** a step in the Account lead lane flows into a joint step owned by roles in the Bid manager and Solution architect lanes
- **THEN** the connector ends at whichever of the two boxes is nearer the Account lead lane

#### Scenario: Owners in non-adjacent lanes
- **WHEN** a joint step's two owner lanes have another lane between them that holds a step in the same column
- **THEN** both owner boxes are in that column and the dotted tie passes no step box

### Requirement: One step everywhere else
Outside the swimlane, a joint step SHALL appear once:
- Its step detail SHALL list every owner with their party, with a "Joint" badge.
- Each owner's role page SHALL list it as a step the role owns.
- Search SHALL list it once.
- Below 768px, the phone step list SHALL show it once, labelled with every owner and party and "Joint", with no horizontal page scrolling.

With a persona selected, every box of a joint step SHALL be emphasised when the persona holds any of its owner roles.

#### Scenario: Step detail lists the owners
- **WHEN** the viewer opens "Kick off the bid" in the sample
- **THEN** the detail lists Bid manager (Acme) and Solution architect (Globex) as owners with a "Joint" badge

#### Scenario: Role pages
- **WHEN** the viewer opens the Solution architect's role page
- **THEN** "Kick off the bid" is listed among the steps it owns

#### Scenario: Persona emphasis
- **WHEN** a persona mapped to Solution architect views "Qualify an opportunity"
- **THEN** both "Kick off the bid" boxes are emphasised

#### Scenario: Phone list
- **WHEN** "Qualify an opportunity" is opened at 375px wide
- **THEN** "Kick off the bid" appears once, labelled with both owners, their parties and "Joint", and the page does not scroll horizontally

### Requirement: Keyboard and screen readers for joint steps
A joint step SHALL be one stop in the swimlane's Tab order, on its primary owner's box, in flow order. Clicking any of its boxes SHALL open its detail. Its accessible name SHALL include the step name, the words "joint step" and every owner.

#### Scenario: One Tab stop
- **WHEN** a keyboard user tabs through "Qualify an opportunity"
- **THEN** "Kick off the bid" receives focus once, and Enter opens its detail

#### Scenario: Accessible name
- **WHEN** a screen reader reaches "Kick off the bid"
- **THEN** its accessible name includes "joint step", "Bid manager" and "Solution architect"

### Requirement: Sample joint step
The Acme sample, in both its folder and capture-sheet forms, SHALL make "Kick off the bid" a joint step of Bid manager and Solution architect, using fictional names only, with both forms loading with 0 errors and 0 warnings and staying in parity.

#### Scenario: Sample joint step loads
- **WHEN** both Acme forms are loaded
- **THEN** both show 0 errors and 0 warnings, and in both "Kick off the bid" is drawn in the Bid manager and Solution architect lanes
