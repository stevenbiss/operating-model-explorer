# Spec Delta

## Purpose

Lets authors record who holds each role, and lets viewers see those people wherever the role appears, without leaving the diagram they are reading.

## ADDED Requirements

### Requirement: People listed on a role
A role MAY list the people who hold it, as an ordered list of names (`people:` in a role file, or the Roles table's `People` column in a capture sheet). A role with no people SHALL be valid and SHALL show no people text anywhere. Names SHALL be shown as text, never executed as markup.

#### Scenario: Role with people loads
- **WHEN** a role lists the people "Sam Example" and "Alex Sample"
- **THEN** the report shows no messages about that role, and its page lists both names

#### Scenario: Markup in a name
- **WHEN** a role lists the person `<img src=x onerror=alert(1)>`
- **THEN** no dialog appears and the name is shown as literal text

### Requirement: People shown under the role name
Wherever a role is shown by name, the viewer SHALL show, directly under the role name, the role's single person's name when it has exactly one, or the text "Multiple people" when it has two or more. This covers swimlane lane headers, structure-diagram role boxes, role chips, a step's owner and RACI rows, and committee member lists. A structure box that has its own name text SHALL show that text instead, as today. A role with no people SHALL show nothing extra.

#### Scenario: One person
- **WHEN** the role "Account lead" lists only "Sam Example" and the viewer opens a process with an Account lead lane
- **THEN** the lane header shows "Account lead" with "Sam Example" under it

#### Scenario: Several people
- **WHEN** the role "Solution architect" lists two people
- **THEN** its lane header, its role chips and its step-owner line show "Multiple people" under the role name

#### Scenario: Box with its own name text
- **WHEN** a structure box for a role with one person has the name text "TBA"
- **THEN** the box shows "TBA", not the role's person

#### Scenario: No people
- **WHEN** a role lists no people
- **THEN** its lane header shows only the role name and team, as before

### Requirement: People pop-up
Hovering over a role that lists people, or giving it keyboard focus, SHALL show a pop-up next to it, titled with the role name and listing every person's name. The pop-up SHALL close when the pointer leaves or focus moves on, and when Escape is pressed. It SHALL NOT hide the element it describes, SHALL stay within the window, and SHALL NOT be the only way to read the names: the role's page also lists them, and the list SHALL be exposed to screen readers as the role's description.

#### Scenario: Hover shows the names
- **WHEN** the viewer hovers over the Solution architect lane header
- **THEN** a pop-up appears listing both people's names, and it closes when the pointer moves away

#### Scenario: Keyboard shows the names
- **WHEN** a keyboard user tabs to a role chip for a role with two people
- **THEN** the pop-up appears listing both names, and Escape closes it while focus stays on the chip

#### Scenario: Screen-reader description
- **WHEN** a screen reader reaches a lane-header link for a role with people
- **THEN** its accessible description includes every person's name

#### Scenario: Pop-up stays on screen
- **WHEN** the viewer hovers over a role near the right edge of a 1280px window
- **THEN** the whole pop-up is inside the window

### Requirement: People on the role page
A role's page SHALL list all its people by name, under a "People" heading, in the author's order.

#### Scenario: Role page lists people
- **WHEN** the viewer opens the page of a role with two people
- **THEN** a "People" section lists both names in order

### Requirement: People on small screens
Below 768px, the person line ("Sam Example" or "Multiple people") SHALL still show under role names in the phone step list and stacked diagrams. The pop-up SHALL NOT be needed to see the names: activating a role opens its page, which lists them. The page SHALL NOT scroll horizontally.

#### Scenario: Mobile people line
- **WHEN** a process is opened at 375px wide
- **THEN** each step's role line includes its single person's name or "Multiple people", and the page does not scroll horizontally

### Requirement: Sample people
The Acme sample, in both its folder and capture-sheet forms, SHALL list one person on at least two roles and two or more people on at least one role, using fictional names only, and SHALL stay in parity with 0 errors and 0 warnings.

#### Scenario: Sample people load
- **WHEN** both Acme forms are loaded
- **THEN** both show 0 errors and 0 warnings, and in both a role with one person shows that name and a role with several people shows "Multiple people"
