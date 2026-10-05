# Spec Delta

## Purpose

Lets authors say that a step is decided or done together by a group of roles drawn from more than one party (a committee), and shows viewers who decides together, without inventing a joint party or splitting one decision into several steps.

## ADDED Requirements

### Requirement: Committee element
A model MAY define committees. A committee SHALL have an `id`, a `name` and `members` (a list of one or more role ids, from any parties), and MAY have a `summary`, a Markdown body (its narrative) and `change` data. A committee SHALL NOT belong to a party and SHALL NOT have a brand. In a content folder, committees SHALL be files with `type: committee`, by convention in `committees/`.

#### Scenario: Committee loads from a folder
- **WHEN** a model folder has `committees/bid-board.md` with `type: committee`, a name and two member roles from different parties, and a step owned by `bid-board`
- **THEN** the validation report shows no messages about the committee, and the preview shows the step as owned by the committee

#### Scenario: Committee with no members
- **WHEN** a committee file has `members: []`
- **THEN** the report shows an error naming the committee and saying it needs at least one member role

### Requirement: Committee checks
The engine SHALL check every committee and report, in the usual plain-English form with a fix:
- a member that isn't a known role SHALL be an error, with "Did you mean …?" when a close role exists;
- a committee with fewer than two members SHALL be a warning;
- a committee whose members all belong to one party SHALL be a warning suggesting a team or a single owner instead;
- a committee that owns no step SHALL be a warning;
- a role and a committee with the same name (ignoring case, spacing and punctuation) SHALL be an error naming both.

Warnings SHALL NOT block export.

#### Scenario: Unknown member
- **WHEN** a committee lists the member `partner-mgr` and the role `partner-manager` exists
- **THEN** the report shows an error naming the committee, the unknown id and "Did you mean partner-manager?", and export is disabled

#### Scenario: One member
- **WHEN** a committee that owns a step has only one member
- **THEN** the report shows a warning naming the committee and saying a committee needs at least two members, and export remains enabled

#### Scenario: Members from one party
- **WHEN** a committee's two members both belong to Acme
- **THEN** the report shows a warning naming the committee and suggesting a team or a single owner, and export remains enabled

#### Scenario: Committee that owns nothing
- **WHEN** a committee owns no step in any process
- **THEN** the report shows a warning naming the committee, and export remains enabled

#### Scenario: Same name as a role
- **WHEN** a role and a committee are both named "Bid board"
- **THEN** the report shows an error naming both and asking for different names

### Requirement: Committee-owned steps
A step's `owner` SHALL be either a role or a committee. Any step MAY be owned by a committee, whether or not it has labelled branches.

#### Scenario: Committee owns a decision
- **WHEN** a step with two labelled branches is owned by a committee
- **THEN** the swimlane shows the step in the committee's lane with both labelled connectors leaving it

#### Scenario: Committee owns a working step
- **WHEN** a step with no branches is owned by a committee
- **THEN** it loads with no errors, and the swimlane shows it in the committee's lane

### Requirement: Committee lanes in the swimlane
Each committee that owns a shown step in a process SHALL get its own lane. A process MAY have several committees. All committee lanes SHALL form one group under one heading with the committees label ("Committees" by default), stacked in the order their first steps appear. The group SHALL sit in the middle of the swimlane: directly after the first party group shown, in the model's party order, so with two parties the committees sit between them. With only one party group shown, the group SHALL sit after it. A committee lane's header SHALL show the committee's name and its members, each labelled with its party, and SHALL link to the committee page. Every member role SHALL also get its own lane in its party group, like a role that takes part through RACI. A step owned by a committee SHALL sit in the committee's lane and show a text badge "By committee" (following the committee label).

#### Scenario: Committee lane and badge
- **WHEN** the viewer opens a process in which a committee of an Acme role and a Globex role owns one step
- **THEN** a lane under "Committees" sits between the Acme group and the Globex group, its header names the committee and both members with their parties, the step sits in that lane with a "By committee" badge, and each member also has a lane in its party group

#### Scenario: Two committees in one process
- **WHEN** a process has steps owned by two different committees, and the first of them in flow order is owned by the committee listed second in the content
- **THEN** both committee lanes sit together under one "Committees" heading between the Acme group and the Globex group, with the lane of the committee whose step comes first on top

#### Scenario: Lane header opens the committee
- **WHEN** the viewer activates the committee name in the lane header
- **THEN** the committee page opens

### Requirement: Handoffs to and from committee steps
A connector into or out of a committee-owned step SHALL be styled as cross-party when the committee has at least one member from a party other than that of the step at the other end. Between two committee-owned steps it SHALL be styled as cross-party when the two committees' member parties differ.

#### Scenario: Handoff into a committee
- **WHEN** a step owned by an Acme role flows into a step owned by a committee with Acme and Globex members
- **THEN** the connector is styled as a cross-party handoff

### Requirement: RACI for committee-owned steps
For a committee-owned step, the committee SHALL count as the one accountable (A). A member with no RACI letter on that step SHALL be shown as "Member" wherever a RACI letter would be shown. Authors MAY give a member R, C or I. Any role given A on a committee-owned step SHALL be a second accountable and produce the existing more-than-one-accountable warning, naming the committee and the role.

#### Scenario: Committee is accountable
- **WHEN** a committee-owned step has no RACI letters at all
- **THEN** the report shows no accountability warning for that step, and its detail lists the committee as Accountable and each member as "Member"

#### Scenario: Member with a letter
- **WHEN** a member is given C on a committee-owned step
- **THEN** the step detail lists that member as Consulted, and the other members as "Member"

#### Scenario: A on a role as well
- **WHEN** a committee-owned step gives A to a role
- **THEN** the report shows a warning naming the step, the committee and that role as more than one accountable, and export remains enabled

### Requirement: Committee page
Activating a committee anywhere SHALL open its page, showing its name, summary, narrative, members grouped by party (each linking to the role profile), and every step it owns grouped by process (each linking to its step detail). With change markers on, a removed committee SHALL show a "Removed" badge and its "Today" text.

#### Scenario: Committee page content
- **WHEN** the viewer opens the sample bid board's page
- **THEN** it shows the committee's name and summary, Account lead under Acme and Partner manager under Globex, and "Go or no-go" under "Qualify an opportunity", each a working link

#### Scenario: Deep link to a committee
- **WHEN** the viewer copies the URL while on a committee page and opens it in a new tab
- **THEN** the same committee page is shown

### Requirement: Keyboard and screen readers
Committee-owned steps SHALL take part in the swimlane's Tab order, arrow-key movement, Enter and Escape exactly like other steps. A committee-owned step's accessible name SHALL include the committee's name and the words "by committee". A committee lane header SHALL expose the committee's members as text, not only as marks or colour.

#### Scenario: Keyboard into a committee step
- **WHEN** a keyboard user tabs to the step before a committee-owned step, presses the Right arrow, then Enter
- **THEN** focus moves to the committee-owned step and its detail opens, showing the committee as owner

#### Scenario: Accessible name
- **WHEN** a screen reader reads a committee-owned step
- **THEN** its accessible name includes the step name, the committee name and "by committee"

### Requirement: Committees on small screens
Below 768px, a committee-owned step in the vertical step list SHALL be labelled with the committee's name, a "By committee" badge and its members with their parties, instead of a role and party. The page SHALL NOT scroll horizontally.

#### Scenario: Mobile committee step
- **WHEN** the sample's "Qualify an opportunity" is opened at 375px wide
- **THEN** "Go or no-go" in the step list shows the bid board's name, the "By committee" badge, and Account lead (Acme) and Partner manager (Globex), and the page does not scroll horizontally

### Requirement: Sample committee
The Acme sample, in both its folder and capture-sheet forms, SHALL include the committee "Acme + Globex bid board" with the members Account lead and Partner manager, owning the step "Go or no-go" in "Qualify an opportunity". It SHALL use fictional names only, and both forms SHALL still load with 0 errors and 0 warnings and stay in parity.

#### Scenario: Sample committee loads
- **WHEN** `examples/acme-sample/` and `examples/acme-capture-sheet/` are each loaded
- **THEN** both show 0 errors and 0 warnings, and in both "Go or no-go" sits in the bid board's lane with a "By committee" badge
