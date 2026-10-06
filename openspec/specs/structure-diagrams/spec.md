# structure-diagrams Specification

## Purpose
Lets authors design their own relationship diagrams, which show how a model's parties, teams and roles are arranged in bands and how they relate, and lets viewers explore those diagrams read-only in the snapshot.

## Requirements

### Requirement: Structure element
A model MAY contain any number of `structure` elements. Each SHALL have an `id`, a `name`, a list of `bands` and a list of `boxes`. It MAY have a `kind` (free text shown as a label, e.g. "Market" or "Sub-programme"), a `summary`, `lines`, `related` (ids of other structures), `workstreams` (ids of related workstreams), `main: true` and `change`. A narrative body SHALL be rendered on the diagram's page. The engine SHALL NOT give any band, kind or diagram name a built-in meaning.

#### Scenario: Diagram with author's own vocabulary
- **WHEN** a structure has `kind: Local market` and bands named "Strategic", "Tactical" and "Operational"
- **THEN** the validation report shows no errors, and the diagram page shows the kind "Local market" and the three bands in that order

#### Scenario: Missing bands
- **WHEN** a structure has no `bands`
- **THEN** the report shows an error naming the structure and the missing field `bands`

### Requirement: Bands
Bands SHALL be the diagram's rows, drawn top to bottom in the order listed. Each band SHALL have an `id`, unique within its structure, and a `name`. A band MAY hold sub-bands, one level deep only. A band MAY name a structure it `opens`. A band with sub-bands SHALL NOT hold boxes of its own.

#### Scenario: Sub-bands drawn inside their band
- **WHEN** a band "Programme management" has the sub-bands "Harbour" and "Summit"
- **THEN** the diagram shows "Programme management" as one row containing two labelled sub-rows, "Harbour" above "Summit"

#### Scenario: Nesting too deep
- **WHEN** a sub-band has bands of its own
- **THEN** the report shows an error naming the structure and the band, saying that bands can be nested only one level deep

#### Scenario: Box in a band with sub-bands
- **WHEN** a box is placed in a band that has sub-bands
- **THEN** the report shows an error naming the band and suggesting one of its sub-bands

#### Scenario: Duplicate band id
- **WHEN** two bands in one structure share the id `delivery`
- **THEN** the report shows an error naming the structure and the duplicate band id

### Requirement: Boxes
Each box SHALL name a `band` and exactly one of a `role` or a `team`. It MAY have `name` text (e.g. the person who holds it, or "TBA"), `note` text and `change`. A box SHALL be drawn in its band, in the column of its role's or team's party, after the earlier boxes in the same cell. A box SHALL show the role or team name, its name text and its note text. A team box SHALL also list the team's roles. The same role or team MAY have boxes in several bands.

#### Scenario: Box content
- **WHEN** a box places the role "Account lead" with name "Sam Example" and note "Grade: Director"
- **THEN** the box shows "Account lead", "Sam Example" and "Grade: Director" in that role's party column

#### Scenario: Team box lists its roles
- **WHEN** a box places a team that has two roles
- **THEN** the box shows the team name and both role names

#### Scenario: Box names both a role and a team
- **WHEN** a box has both `role` and `team`
- **THEN** the report shows an error naming the structure and the box's band, saying a box names either a role or a team

#### Scenario: Same role in two bands
- **WHEN** a role has boxes in the bands "Harbour" and "Summit" with different name text
- **THEN** both boxes are shown, each with its own name text, and the report shows no error

### Requirement: Party columns
The diagram's columns SHALL be the model's parties, in the order the model lists them, limited to the parties that have a box or a line end in this diagram. Each column SHALL be headed by the party's name and mark and use the party's brand colour (see party-brands). An empty cell SHALL be drawn empty.

#### Scenario: Unused party has no column
- **WHEN** a model has three parties and a diagram's boxes and lines use only two of them
- **THEN** the diagram shows two columns, in the model's party order

### Requirement: Lines
A line SHALL join two cells, each given as a band and a party, and MAY have a `label`. Lines SHALL be drawn as plain lines with no arrowheads or direction. A line whose two ends are the same cell SHALL be an error. A line repeated with the same two cells (in either order) SHALL be a warning. A line's label SHALL be shown on or beside the line.

#### Scenario: Line across parties
- **WHEN** a line joins (Leadership, Acme) to (Leadership, Globex) with the label "Joint steering"
- **THEN** a line without arrowheads connects those two cells, and "Joint steering" is shown with it

#### Scenario: Line down a column
- **WHEN** a line joins (Leadership, Acme) to (Delivery, Acme)
- **THEN** a line without arrowheads connects the two Acme cells

#### Scenario: Line to the same cell
- **WHEN** a line's two ends are both (Delivery, Globex)
- **THEN** the report shows an error naming the structure and the cell

#### Scenario: Line from a band to its own sub-band
- **WHEN** a line joins (Programme management, Acme) to its sub-band (Harbour, Acme)
- **THEN** the report shows an error naming both bands and the party, saying the line has nothing to join

### Requirement: References inside a structure
Every reference in a structure SHALL be checked: box bands, roles and teams; line bands and parties; band `opens`; `related`; and `workstreams`. An unknown id SHALL be an error naming the structure, the field and the unknown id, and suggesting the closest existing id. A structure listing itself in `related` or `opens` SHALL be a warning.

#### Scenario: Unknown role in a box
- **WHEN** a box names the role `acount-lead` and the role `account-lead` exists
- **THEN** the report shows an error naming the structure, the unknown id and "Did you mean account-lead?"

#### Scenario: Unknown related structure
- **WHEN** a structure lists `related: [harbor]` and only the structure `harbour` exists
- **THEN** the report shows an error suggesting `harbour`

### Requirement: One main diagram
When a model has at least one structure, exactly one structure SHALL have `main: true`, representing the whole company or partnership. No main structure, or more than one, SHALL be an error naming the structures involved. A model with no structures SHALL need no main structure.

#### Scenario: No main diagram
- **WHEN** a model has two structures and neither has `main: true`
- **THEN** the report shows an error saying one structure must be the main diagram, naming both, and export is disabled

#### Scenario: Two main diagrams
- **WHEN** two structures have `main: true`
- **THEN** the report shows an error naming both

#### Scenario: Model without diagrams
- **WHEN** a model with no structures is loaded
- **THEN** the report shows no message about a main diagram

### Requirement: Related diagrams
Relations between structures SHALL be undirected. A structure SHALL show, in a Related panel, every structure it lists in `related`, every structure that lists it in `related`, and every workstream in its `workstreams`, each as a link. A band that `opens` a structure SHALL offer a link to it from the band's label.

#### Scenario: Relation shown from both sides
- **WHEN** structure A lists structure B in `related` and B does not list A
- **THEN** A's Related panel links to B, and B's Related panel links to A

#### Scenario: Drill down from a band
- **WHEN** the viewer activates the "Open" link on a band that opens the structure "Harbour account"
- **THEN** the "Harbour account" diagram is shown

#### Scenario: Related workstream
- **WHEN** a structure lists `workstreams: [presales]`
- **THEN** its Related panel links to the Presales workstream page

### Requirement: Diagram route and breadcrumb
Each structure SHALL have its own view, reachable by a URL fragment that reopens it, with the breadcrumb Model > <structure name>. The browser Back button SHALL return from a diagram to the previous view.

#### Scenario: Deep link to a diagram
- **WHEN** the viewer copies the URL while on a diagram and opens it in a new tab
- **THEN** the same diagram is shown, with the breadcrumb Model > <structure name>

#### Scenario: Back from a drill-down
- **WHEN** the viewer drills down from the main diagram to another diagram and presses Back
- **THEN** the main diagram is shown again

### Requirement: Open a box
Activating a role box SHALL open that role's profile. Activating a team box SHALL open that team's page.

#### Scenario: Role box opens the role
- **WHEN** the viewer activates a box for the role "Account lead"
- **THEN** the Account lead role profile is shown

### Requirement: Persona highlight in diagrams
With a persona selected, the boxes for the persona's roles, and the team boxes for teams containing those roles, SHALL be emphasised with a text cue "Your role". Every other box and line SHALL stay visible and openable. The number of boxes and lines shown SHALL NOT depend on the persona.

#### Scenario: Your role marked
- **WHEN** a persona mapped to "Account lead" opens a diagram with an Account lead box
- **THEN** that box shows "Your role", and every other box is still shown and can be opened

#### Scenario: Nothing hidden
- **WHEN** the same diagram is viewed with two different personas and with no persona
- **THEN** the number of boxes and lines shown is the same in all three cases

### Requirement: Change markers in diagrams
Structures and boxes SHALL support `change`. With change markers on, a structure and its boxes SHALL show New, Changed or Removed badges, and a box's `today` text SHALL be shown with it. Boxes marked removed SHALL be shown only while change markers are on.

#### Scenario: Removed box hidden by default
- **WHEN** a diagram has a box with `change.status: removed` and change markers are off
- **THEN** the box is not shown

#### Scenario: Removed box with markers on
- **WHEN** change markers are turned on
- **THEN** the removed box is shown with a "Removed" badge and its "Today" text

### Requirement: Keyboard and screen-reader access to diagrams
Every box, band link and Related link SHALL be reachable with Tab in reading order (band by band, then party by party) and activated with Enter. Each cell SHALL expose, as text available to assistive technology, its band, its party and the cells it is related to by lines, with their labels. Lines SHALL NOT be the only way relationships are conveyed.

#### Scenario: Tab through a diagram
- **WHEN** the viewer presses Tab repeatedly on a diagram
- **THEN** focus moves through the boxes band by band in party order with a visible focus ring, and Enter on a role box opens its profile

#### Scenario: Lines described as text
- **WHEN** a screen reader reads the cell (Leadership, Acme) that has a line to (Leadership, Globex) labelled "Joint steering"
- **THEN** it announces that the cell is related to Globex, Leadership: "Joint steering"

### Requirement: Diagrams on small screens
At viewport widths below 768px, a diagram SHALL be presented as a stacked list: each band (and sub-band) as a heading, then each party with its boxes, then that cell's lines written as "Related to: <party>, <band>" with any label, with no horizontal page scrolling.

#### Scenario: Mobile diagram
- **WHEN** the sample main diagram is opened at 375px wide
- **THEN** bands appear as headings in order, each followed by its parties' boxes and their "Related to" lines, and the page does not scroll horizontally

### Requirement: Wide diagrams scroll within their own area
At viewport widths of 768px and more, a diagram page SHALL use the full width of the browser window, less a margin of at most 24px on each side, in a snapshot, and SHALL fill the width of the preview in author mode. Its heading, summary and narrative SHALL keep their readable line length. When a diagram is wider or taller than the space it has, it SHALL scroll inside its own area, never the page, and that area SHALL be no taller than the browser window, so both its scrollbars stay on screen. The diagram SHALL be pannable by dragging (see explorer-views › Drag to pan diagrams). A focused box SHALL be scrolled into view.

#### Scenario: Many parties
- **WHEN** a diagram with six party columns is opened at 1024px wide
- **THEN** the diagram scrolls horizontally inside its container and the page itself does not scroll horizontally

#### Scenario: Diagram uses the full width
- **WHEN** a diagram with eight party columns is opened at 1920×1080 in a snapshot
- **THEN** the diagram area is at least 1850px wide and the page does not scroll horizontally

#### Scenario: Drag a wide diagram
- **WHEN** at 1280×800 the viewer holds the left mouse button on an empty part of a diagram wider than its area and drags 300px left
- **THEN** the diagram scrolls about 300px right inside its area, and releasing opens nothing

#### Scenario: Click still opens a box
- **WHEN** the viewer clicks a role box without moving the mouse
- **THEN** that role's profile opens as before

### Requirement: Sample diagrams
The Acme sample, in both its folder and its capture-sheet forms, SHALL include a main diagram and at least one related diagram. Together they SHALL use sub-bands, a band that opens another diagram, a team box, a box with name and note text, a labelled line and a related workstream. They SHALL use fictional names only.

#### Scenario: Sample diagrams load
- **WHEN** the sample is opened and the viewer opens the main diagram
- **THEN** it shows sub-bands, a team box, a labelled line and a band link that opens the related diagram, and the report shows no errors
