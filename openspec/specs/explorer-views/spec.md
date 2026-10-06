# explorer-views Specification

## Purpose
The views viewers use to explore an operating model at four zoom levels (model overview, workstreams, process swimlanes and step detail), moving freely between them while the shared key messages stay one action away.

## Requirements

### Requirement: L0 model overview
The home page SHALL be shown in the view the author chose for the model: **Simple** (the default) or **Detailed**. Viewers SHALL NOT be able to switch between them.

In both views the home page SHALL show the model's name and then, in this order:
1. its parties (organisation);
2. its workstreams at a glance;
3. its processes, as one list in workstream order, each with its workstream and its review status;
4. its structure diagrams.

Structure diagrams SHALL be listed with the main diagram first and marked as the main diagram, each with its kind when it has one. A model with no structures SHALL show no structure list, and a model with no processes SHALL show no process list.

The **Detailed** view SHALL also show the purpose (rendered narrative) and the "About this model" narrative under the name, the key messages section, and the persona doors. The **Simple** view SHALL show none of these on the home page.

Only the home page SHALL differ between the views. The Key messages control, the exploration progress, the persona prompt and every other page SHALL be the same in both.

#### Scenario: Overview content
- **WHEN** the sample model, which sets no view, opens with no persona selected
- **THEN** the home page shows the model name, every party, every workstream, every process and every structure diagram, and shows no purpose text, key messages section or persona doors

#### Scenario: Detailed view
- **WHEN** a model with `view: detailed` opens
- **THEN** the home page also shows the purpose text, every key message and the persona doors

#### Scenario: Key messages still reachable in Simple view
- **WHEN** a Simple-view snapshot is on its home page and the viewer activates "Key messages"
- **THEN** the key messages are shown

#### Scenario: Processes listed on the home page
- **WHEN** the sample opens on the home page
- **THEN** a processes section lists every process in workstream order, each showing its workstream and status, and activating one opens its swimlane

#### Scenario: Main diagram first
- **WHEN** a model has three structures and the main one is listed last in the content
- **THEN** the overview lists the main diagram first, marked as the main diagram, and each link opens its diagram

#### Scenario: Home page on a phone
- **WHEN** the sample home page is opened at 375px wide
- **THEN** the sections stack in order and the page does not scroll horizontally

### Requirement: Key messages always reachable
The model's key messages SHALL be reachable in one action from every view, and SHALL be identical for every persona.

#### Scenario: From a step detail
- **WHEN** the viewer is on any step detail and activates "Key messages"
- **THEN** the key messages are shown, with the same text regardless of the selected persona

### Requirement: L1 workstream view
Each workstream SHALL show its summary, the parties and roles involved, its processes, and the structure diagrams related to it (those that list it in `workstreams`). Workstreams marked `detail: outline` SHALL be shown with their summary and labelled as outline only.

#### Scenario: Outline workstream
- **WHEN** the viewer opens a workstream marked `outline`
- **THEN** its summary is shown with an "Outline only" label, and no empty process list is shown

#### Scenario: Related diagrams on a workstream
- **WHEN** a structure lists `workstreams: [presales]` and the viewer opens the Presales workstream
- **THEN** the workstream page links to that structure diagram

### Requirement: L2 process swimlane
A process SHALL be shown as a swimlane with one lane per role that owns or takes part in its steps (except idle committee members, which are listed in their committee's lane instead; see committees › Committee lanes in the swimlane), and one lane per committee that owns any of its steps (see committees › Committee lanes in the swimlane). Role lanes SHALL be grouped and labelled by party. Committee lanes SHALL form one group in the middle, between the first party group and the rest. A role takes part in a step when it appears in the step's RACI or is a member of the committee that owns it. A committee member that takes part only through its committees is idle in that process. Steps SHALL appear in their owner's lane in flow order. Every `next` relationship SHALL be drawn as a connector. Handoffs that cross parties SHALL be visually distinct from handoffs within a party. Decision branches SHALL show their labels.

#### Scenario: Lanes and steps
- **WHEN** the viewer opens a sample process whose steps are owned by roles from two parties
- **THEN** a lane appears for each of those roles, grouped under the two party names, and each step sits in its owner's lane in list order

#### Scenario: Decision branches
- **WHEN** a step has `next` with two labelled branches
- **THEN** two connectors leave that step, each showing its label

#### Scenario: Cross-party handoff
- **WHEN** a connector joins steps owned by roles in different parties
- **THEN** it is styled differently from same-party connectors, and a legend explains the difference

#### Scenario: Process without committees
- **WHEN** a process has no committee-owned steps
- **THEN** no committees group or heading is shown

#### Scenario: No empty member lanes
- **WHEN** a process's committee has three members who take part in nothing else in that process
- **THEN** none of the three has a lane, the committee lane lists all three, and every role lane shown owns a step or has a RACI letter on a role-owned step

### Requirement: L3 step detail
Activating a step SHALL open its detail: name, owner, RACI, inputs, outputs, systems, KPIs and narrative, showing only fields that have content. A role owner SHALL be shown with its party. A committee owner SHALL be shown with its "By committee" badge and its members split by organisation, each with their RACI letter, and SHALL link to the committee page (see committees › Members shown when a committee step is opened). The detail SHALL offer navigation to the previous and next steps in the flow. When a step has several next steps, each SHALL be offered by its label.

#### Scenario: Open and move along the flow
- **WHEN** the viewer opens a step's detail and activates "Next"
- **THEN** the detail of the following step in the flow is shown, and the swimlane highlights it

#### Scenario: Committee owner in the detail
- **WHEN** the viewer opens the detail of a committee-owned step
- **THEN** the owner shows the committee's name with a "By committee" badge and its members under one heading per party with their letters, and activating the committee name opens its page

### Requirement: Role profile
Activating a role anywhere SHALL show its profile: party, team, description, every committee it is a member of (with its letter), every step across all processes where it is owner, appears in RACI or is a member of the owning committee, grouped by process, and every structure diagram with a box for that role.

#### Scenario: Role across processes
- **WHEN** the viewer opens the profile of a sample role that appears in two processes
- **THEN** the profile lists the relevant steps under both process names, each linking to its step detail

#### Scenario: Role in diagrams
- **WHEN** the viewer opens the profile of a role that has boxes in two structure diagrams
- **THEN** the profile links to both diagrams

#### Scenario: Role on a committee
- **WHEN** the viewer opens the profile of Partner manager in the sample
- **THEN** the profile links to the bid board with the letter A, and lists "Go or no-go" with A as a step Partner manager takes part in through the committee

### Requirement: Navigation and deep links
Every view SHALL show a breadcrumb of its location (e.g. Model > Workstream > Process > Step). The browser Back and Forward buttons SHALL move between views. The current view (and persona) SHALL be reflected in the URL fragment, so opening the snapshot with that fragment returns to the same view.

#### Scenario: Deep link
- **WHEN** the viewer copies the URL while on a step detail, then opens that URL in a new tab
- **THEN** the same step detail is shown

#### Scenario: Back button
- **WHEN** the viewer goes from the overview to a process and presses the browser Back button
- **THEN** the overview is shown again

### Requirement: Search
The viewer SHALL provide search across the names and descriptions of all elements (including committees) and steps, and across the name and note text of structure boxes, with results grouped by type and each result opening its element. A match in a box's name or note text SHALL be listed under its structure and SHALL open that structure's diagram.

#### Scenario: Find a step
- **WHEN** the viewer searches for part of a step name
- **THEN** that step appears in the results under its type label, and activating it opens its detail

#### Scenario: Find a person on a diagram
- **WHEN** the viewer searches for a name that appears only as a box's name text
- **THEN** the structure containing that box appears in the results, and activating it opens the diagram

#### Scenario: Find a committee
- **WHEN** the viewer searches for "bid board"
- **THEN** the bid board appears under the committees label, and activating it opens the committee page

### Requirement: Exploration progress
The viewer SHALL show how many of the model's detailed processes have been visited in the current session, and SHALL offer a link to the key messages. Progress SHALL NOT restrict navigation.

#### Scenario: Progress updates
- **WHEN** a model has 3 detailed processes and the viewer has opened 2 of them
- **THEN** the progress shows "2 of 3" with a link to the key messages

### Requirement: Current vs future display
When the model has `change` data, the viewer SHALL offer a control to show change markers. Elements and steps SHALL then show a badge for new, changed or removed, and a step's detail SHALL show its `today` description. Removed steps SHALL be shown only while change markers are on.

#### Scenario: Change markers
- **WHEN** change markers are turned on for a process with one `new` and one `changed` step
- **THEN** those steps show "New" and "Changed" badges as text, not colour alone, and the changed step's detail shows its "Today" description

### Requirement: Keyboard operation
All views SHALL be fully operable by keyboard. In a swimlane, steps SHALL be reachable in flow order with Tab, the arrow keys SHALL move to connected steps, Enter SHALL open the detail, and Escape SHALL close it and return focus to the step.

#### Scenario: Keyboard through a swimlane
- **WHEN** a keyboard user tabs into a swimlane, presses the Right arrow, then Enter, then Escape
- **THEN** focus moves to the next step in the flow, its detail opens, and on Escape the detail closes with focus back on that step

### Requirement: Small screens
At viewport widths below 768px, the swimlane SHALL be presented as a vertical, ordered list of steps, each showing its lane (role and party, or committee and members) and its next steps, with no horizontal page scrolling.

#### Scenario: Mobile swimlane
- **WHEN** a process is opened at 375px wide
- **THEN** the steps appear as a vertical list in flow order, each labelled with its role and party, or its committee, and the page does not scroll horizontally

### Requirement: Element pages
Parties, teams, committees and personas SHALL each have a page showing their name, summary and related elements: a party's teams and roles, a team's roles, a committee's members and steps (see committees › Committee page), and a persona's roles and entry point. Search results and links for these types SHALL open that page.

#### Scenario: Open a party from search
- **WHEN** the viewer searches for a party name and opens the result
- **THEN** a page shows the party's name, its summary, and links to its teams and roles

### Requirement: Wide swimlanes scroll within their own area
A process page SHALL use the full width of the browser window, less a margin of at most 24px on each side, in a snapshot, and SHALL fill the width of the preview in author mode. Its heading, summary and narrative SHALL keep their readable line length. When a swimlane is wider or taller than the space it has, it SHALL scroll inside its own area, never the page. At viewport widths of 768px and more, that area SHALL be no taller than the browser window, so both its scrollbars stay on screen. Lane headers SHALL stay visible while it scrolls. A visible "More steps" cue SHALL show while steps lie off-screen to the right. A step that receives keyboard focus, or is selected, SHALL be scrolled fully into view clear of the lane headers.

#### Scenario: More steps cue
- **WHEN** a process whose swimlane is wider than a 1024px viewport is opened
- **THEN** the page does not scroll horizontally, the lane headers stay visible, and a "More steps" cue is shown

#### Scenario: Swimlane uses the full width
- **WHEN** a process with a wide swimlane is opened at 1920×1080, in a snapshot and in the author-mode preview
- **THEN** the swimlane area is at least 1850px wide in the snapshot, fills the preview's width in author mode, and the page does not scroll horizontally

#### Scenario: Both scrollbars stay on screen
- **WHEN** a process whose swimlane is taller and wider than a 1280×800 viewport is opened and scrolled to the swimlane
- **THEN** the swimlane area is no taller than the window, its bottom edge (with its horizontal scrollbar) is visible on screen, and the lanes scroll vertically inside it

### Requirement: Change state in the URL
Whether change markers are on, and whether "Only changes" is on, SHALL be part of the URL, so a link reproduces the same view.

#### Scenario: Link with change markers
- **WHEN** a snapshot is opened with a URL that has change markers turned on
- **THEN** change markers are on and badges are shown

### Requirement: Removed steps are never shown while change markers are off
With change markers off, a link or route to a removed step SHALL open its process instead, with a dismissible notice saying the step was removed and how to show changes. The notice SHALL be announced to assistive technology. Turning change markers off while a removed step is open SHALL do the same, and Back SHALL NOT return to the hidden step.

#### Scenario: Link to a removed step with markers off
- **WHEN** a snapshot is opened at a removed step's route without change markers on
- **THEN** its process is shown without that step, together with the notice "… was removed in this model. Turn on Show changes to see it."

### Requirement: Removed roles and elements stay reachable
Roles, teams, parties and other elements marked removed SHALL open normally. When change markers are on, they SHALL show a "Removed" badge and their "Today" text.

#### Scenario: Removed role profile
- **WHEN** change markers are on and the viewer opens the profile of a removed role
- **THEN** the profile opens and shows a "Removed" badge

### Requirement: Drag to pan diagrams
At viewport widths of 768px and more, the viewer SHALL be able to move a swimlane or structure diagram that is larger than its area by holding the left mouse button anywhere on it and dragging, in any direction. While the pointer is over a pannable diagram, the cursor SHALL show an open hand, and a closed hand while dragging. A press and release with little or no movement (under 5px) SHALL still count as a click, so it opens a step, a box or a link as before. A drag SHALL NOT open anything when released, and SHALL NOT select text. Keyboard, mouse wheel, trackpad and touch scrolling SHALL work as before, and dragging SHALL never change the model.

#### Scenario: Drag the swimlane
- **WHEN** at 1280×800 the viewer presses the left mouse button on an empty part of a wide, tall swimlane and drags 300px left and 200px up
- **THEN** the swimlane scrolls about 300px right and 200px down inside its area, and the page itself does not scroll

#### Scenario: Drag starting on a step
- **WHEN** the viewer presses on a step, drags 100px and releases
- **THEN** the swimlane pans and the step's detail does not open

#### Scenario: Click still opens a step
- **WHEN** the viewer clicks a step without moving the mouse
- **THEN** the step's detail opens as before

#### Scenario: Hand cursor
- **WHEN** the mouse is over a pannable swimlane, then the left button is held down
- **THEN** the cursor is an open hand over empty areas, then a closed hand while the button is held

#### Scenario: Keyboard unchanged
- **WHEN** a keyboard user tabs into a swimlane, presses the Right arrow, then Enter, then Escape
- **THEN** focus moves to the next step in the flow, its detail opens, and on Escape the detail closes with focus back on that step

#### Scenario: Phones keep the list
- **WHEN** a process is opened at 375px wide
- **THEN** the steps appear as a vertical list as before, with no hand cursor or panning area, and the page does not scroll horizontally

### Requirement: Connector labels fit between steps
In the swimlane, every label on a forward connector (a decision branch) SHALL be fully readable: no part of it SHALL overlap a step box, and labels SHALL NOT overlap each other.
- **Placement.** A label SHALL sit on the connector's last horizontal segment, the one entering its target step, just before the target. When several connectors enter the same step and at least one has a label, each of them, labelled or not, SHALL enter at its own point along the step's left edge, at least 16px apart while they fit within that edge, or spread evenly along it when there are more. Each label SHALL sit next to its own connector where there is room; where there isn't, the labels SHALL be stacked in the same top-to-bottom order as their connectors. No label SHALL extend outside the diagram.
- **Gap sizing.** The gap in front of each column SHALL be at least as wide as the widest label on a forward connector entering that column, plus padding on both sides, and never narrower than today's gap. Columns without such labels SHALL keep today's width.
- **Wrapping.** A gap SHALL be at most 220px wide. A label too long for that SHALL wrap onto two or more lines, as many as it needs, still clear of the step boxes. A single word too long for a line SHALL be broken (after a hyphen or slash, or else mid-word) rather than overlap a step. A label SHALL never be truncated.
- **Routing.** A forward connector that skips one or more columns SHALL NOT pass through or behind any step box on its way to its target.
- **Loop-back labels.** Labels on loop-back (rework) connectors SHALL keep their current placement under the steps.

The layout SHALL be the same in author mode and in an exported snapshot.

#### Scenario: Short label, no change
- **WHEN** a process's only branch labels are "Go" and "No go"
- **THEN** every column keeps today's width, and each label sits clear of the step boxes

#### Scenario: Long label widens its gap
- **WHEN** the viewer opens the sample's "Build the proposal", whose "Review the proposal" step has the branch "Approved, ready to submit"
- **THEN** the gap before "Submit the proposal" is wider than today's, the label is fully visible between the two steps, and it overlaps no step box

#### Scenario: Five-branch decision
- **WHEN** a decision step has five labelled branches to five different steps, with labels of up to 24 characters
- **THEN** all five labels are fully visible, none overlaps a step box, and no two labels overlap

#### Scenario: Several labels into one step
- **WHEN** four labelled connectors, with labels up to 60 characters, enter the same step in the top lane
- **THEN** each connector enters the step at its own point, all four labels are fully visible inside the diagram, none overlaps a step box or another label, and the labels run top to bottom in the same order as their connectors

#### Scenario: Label past the maximum wraps
- **WHEN** a branch label is 60 characters long
- **THEN** its gap is at most 220px, and the label shows on two or more lines, in full, without overlapping any step box

#### Scenario: Labelled and unlabelled connectors into one step
- **WHEN** two labelled connectors and one unlabelled connector enter the same step
- **THEN** all three enter at their own points, both labels are fully visible, and no connector line crosses either label

#### Scenario: Many connectors into one step
- **WHEN** six labelled connectors with short labels enter the same step
- **THEN** all six enter within the step's left edge, all six labels are fully visible, and none overlaps another

#### Scenario: Branch that skips a column
- **WHEN** a decision has one labelled branch to the next column and another labelled branch two columns on, into a lane that has a step in the skipped column
- **THEN** the longer branch passes no step box, and its label sits clear of every step box

#### Scenario: Skip branch past a step in its own lane
- **WHEN** a labelled branch skips a column, and the source step's own lane has a step in the skipped column
- **THEN** the branch passes no step box on its way to its target

#### Scenario: One very long word
- **WHEN** a branch label is a single 47-character hyphenated word
- **THEN** it is shown in full on more than one line, and no part of it overlaps a step box

#### Scenario: Loop-back label unchanged
- **WHEN** the sample's "Build the proposal" is opened
- **THEN** the "Needs rework" loop-back label is drawn under the steps, as before

#### Scenario: Same layout in the snapshot
- **WHEN** the sample is exported and the snapshot's "Build the proposal" is opened
- **THEN** the step and label positions match the author-mode preview
