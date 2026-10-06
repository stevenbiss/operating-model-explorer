# committees Specification

## Purpose
Lets authors say that a step is decided or done together by a group of roles drawn from more than one party (a committee), each with its own RACI letter, and shows viewers who decides together, without inventing a joint party or splitting one decision into several steps.

## Requirements

### Requirement: Committee element
A model MAY define committees. A committee SHALL have an `id`, a `name` and `members`: a map of one or more role ids, from any parties, each to exactly one RACI letter (R, A, C or I). The committee's RACI SHALL describe how its members take part in its decisions. Members marked A are **jointly accountable**, and there is no single overall owner. A committee MAY also have a `summary`, a Markdown body (its narrative) and `change` data. A committee SHALL NOT belong to a party and SHALL NOT have a brand. In a content folder, committees SHALL be files with `type: committee`, by convention in `committees/`.

#### Scenario: Committee loads from a folder
- **WHEN** a model folder has `committees/bid-board.md` with `type: committee`, a name, an Acme member and a Globex member both marked A, a member marked C, and a step owned by `bid-board`
- **THEN** the validation report shows no messages about the committee, and the preview shows the step as owned by the committee

#### Scenario: Committee with no members
- **WHEN** a committee file has `members: {}`
- **THEN** the report shows an error naming the committee and saying it needs at least one member role

#### Scenario: Member without a valid letter
- **WHEN** a committee gives a member the letter `A/R`, or no letter
- **THEN** the report shows an error naming the committee and the member, asking for one of R, A, C or I, and export is disabled

### Requirement: Committee checks
The engine SHALL check every committee and report, in the usual plain-English form with a fix:
- a member that isn't a known role SHALL be an error, with "Did you mean …?" when a close role exists;
- a committee with no member marked A SHALL be a warning asking who makes the decision;
- a committee with only one member marked A SHALL be a warning suggesting a single role owner with RACI instead, since the decision isn't joint;
- a committee whose members marked A all belong to one party SHALL be a warning suggesting a team or a single owner instead;
- a committee that owns no step SHALL be a warning;
- a role and a committee with the same name (ignoring case, spacing and punctuation) SHALL be an error naming both.

Warnings SHALL NOT block export.

#### Scenario: Unknown member
- **WHEN** a committee lists the member `partner-mgr` and the role `partner-manager` exists
- **THEN** the report shows an error naming the committee, the unknown id and "Did you mean partner-manager?", and export is disabled

#### Scenario: No accountable member
- **WHEN** a committee's members are all marked C or I
- **THEN** the report shows a warning naming the committee and asking which members make the decision (A), and export remains enabled

#### Scenario: One accountable member
- **WHEN** a committee has one member marked A and two marked C
- **THEN** the report shows a warning naming the committee and suggesting a single owner with RACI instead, and export remains enabled

#### Scenario: Accountable members from one party
- **WHEN** a committee's two members marked A both belong to Acme
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

### Requirement: RACI for committee-owned steps
A committee-owned step's RACI SHALL be the committee's member letters, plus any RACI the step gives to roles that aren't members. Its accountable SHALL be the committee's members marked A, jointly. Several A members on a committee-owned step SHALL NOT produce the more-than-one-accountable warning. A step RACI entry for a role that isn't a member and is marked A SHALL produce a warning saying the committee's accountable members already sign the step off. A step RACI entry for a member SHALL produce a warning saying members' letters are set on the committee, and the committee's letter SHALL be used.

#### Scenario: Joint accountability
- **WHEN** a committee-owned step has no RACI of its own, and the committee has two members marked A
- **THEN** the report shows no accountability warning for that step, and its detail lists both members as Accountable, jointly

#### Scenario: Others informed on the step
- **WHEN** a committee-owned step gives I to Delivery manager, who isn't a member
- **THEN** the step detail lists Delivery manager as Informed, below the committee members, and no message is shown

#### Scenario: A non-member marked A
- **WHEN** a committee-owned step gives A to a role that isn't a member
- **THEN** the report shows a warning naming the step, the committee and that role, and export remains enabled

#### Scenario: A member given a letter on the step
- **WHEN** a committee-owned step gives C to a role that the committee marks A
- **THEN** the report shows a warning saying members' letters are set on the committee, and the step detail shows that member as Accountable

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

### Requirement: Members shown when a committee step is opened
Activating a committee-owned step SHALL open its step detail, as for any step. That detail SHALL lead with the committee's name and "By committee" badge, followed by all its members **split by organisation**: one heading per party, with the party's mark and name, listing each member role (linking to its role profile) with its RACI letter written out (e.g. "Accountable"). When more than one member is marked A, each SHALL be shown as "Accountable, jointly". The rest of the detail (description, RACI for non-members, inputs, outputs and the flow navigation) SHALL follow as for any step.

#### Scenario: Open the committee decision
- **WHEN** the viewer clicks "Go or no-go" in the sample's swimlane
- **THEN** the step detail opens with the bid board's name and "By committee" badge, then an Acme heading listing Account lead (Accountable, jointly) and Bid manager (Informed), and a Globex heading listing Partner manager (Accountable, jointly) and Solution architect (Consulted)

### Requirement: Handoffs to and from committee steps
A connector into or out of a committee-owned step SHALL be styled as cross-party when the committee has at least one member from a party other than that of the step at the other end. Between two committee-owned steps it SHALL be styled as cross-party when the two committees' member parties differ.

#### Scenario: Handoff into a committee
- **WHEN** a step owned by an Acme role flows into a step owned by a committee with Acme and Globex members
- **THEN** the connector is styled as a cross-party handoff

### Requirement: Committee page
Activating a committee anywhere SHALL open its page, showing its name, summary, narrative, members grouped by party with their RACI letters (each linking to the role profile), and every step it owns grouped by process (each linking to its step detail). With change markers on, a removed committee SHALL show a "Removed" badge and its "Today" text.

#### Scenario: Committee page content
- **WHEN** the viewer opens the sample bid board's page
- **THEN** it shows the committee's name and summary, its Acme and Globex members with their letters, and "Go or no-go" under "Qualify an opportunity", each a working link

#### Scenario: Deep link to a committee
- **WHEN** the viewer copies the URL while on a committee page and opens it in a new tab
- **THEN** the same committee page is shown

### Requirement: Keyboard and screen readers
Committee-owned steps SHALL take part in the swimlane's Tab order, arrow-key movement, Enter and Escape exactly like other steps. A committee-owned step's accessible name SHALL include the committee's name and the words "by committee". Member lane headers SHALL expose membership and letters as text, not only as marks or colour, and the members panel of a committee step SHALL be reachable by keyboard and read as text.

#### Scenario: Keyboard into a committee step
- **WHEN** a keyboard user tabs to the step before a committee-owned step, presses the Right arrow, then Enter
- **THEN** focus moves to the committee-owned step and its detail opens, showing the members split by organisation, and Escape closes it with focus back on the step

#### Scenario: Accessible name
- **WHEN** a screen reader reads a committee-owned step
- **THEN** its accessible name includes the step name, the committee name and "by committee"

### Requirement: Committees on small screens
Below 768px, a committee-owned step in the vertical step list SHALL be labelled with the committee's name and a "By committee" badge, instead of a role and party, without listing the members. Its detail SHALL show the members split by organisation, as on wider screens. The page SHALL NOT scroll horizontally.

#### Scenario: Mobile committee step
- **WHEN** the sample's "Qualify an opportunity" is opened at 375px wide
- **THEN** "Go or no-go" in the step list shows the bid board's name and the "By committee" badge but no member list, opening it shows the members split by organisation, and the page does not scroll horizontally

### Requirement: Sample committee
The Acme sample, in both its folder and capture-sheet forms, SHALL include the committee "Acme + Globex bid board", owning the step "Go or no-go" in "Qualify an opportunity", with the members Account lead (A), Partner manager (A), Solution architect (C) and Bid manager (I). It SHALL use fictional names only, and both forms SHALL still load with 0 errors and 0 warnings and stay in parity.

#### Scenario: Sample committee loads
- **WHEN** `examples/acme-sample/` and `examples/acme-capture-sheet/` are each loaded
- **THEN** both show 0 errors and 0 warnings, and in both "Go or no-go" sits in the bid board's lane with a "By committee" badge
