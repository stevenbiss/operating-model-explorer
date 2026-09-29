# explorer-views Specification

## Purpose
The views viewers use to explore an operating model at four zoom levels (model overview, workstreams, process swimlanes and step detail), moving freely between them while the shared key messages stay one action away.

## Requirements

### Requirement: L0 model overview
The overview SHALL show the model's name, its purpose (rendered narrative), its parties, its workstreams at a glance, and its key messages.

#### Scenario: Overview content
- **WHEN** the sample model opens with no persona selected
- **THEN** the overview shows the model name, the purpose text, every party, every workstream and every key message

### Requirement: Key messages always reachable
The model's key messages SHALL be reachable in one action from every view, and SHALL be identical for every persona.

#### Scenario: From a step detail
- **WHEN** the viewer is on any step detail and activates "Key messages"
- **THEN** the key messages are shown, with the same text regardless of the selected persona

### Requirement: L1 workstream view
Each workstream SHALL show its summary, the parties and roles involved, and its processes. Workstreams marked `detail: outline` SHALL be shown with their summary and labelled as outline only.

#### Scenario: Outline workstream
- **WHEN** the viewer opens a workstream marked `outline`
- **THEN** its summary is shown with an "Outline only" label, and no empty process list is shown

### Requirement: L2 process swimlane
A process SHALL be shown as a swimlane with one lane per role that owns or takes part in its steps. Lanes SHALL be grouped and labelled by party. Steps SHALL appear in their owner's lane in flow order. Every `next` relationship SHALL be drawn as a connector. Handoffs that cross parties SHALL be visually distinct from handoffs within a party. Decision branches SHALL show their labels.

#### Scenario: Lanes and steps
- **WHEN** the viewer opens a sample process whose steps are owned by roles from two parties
- **THEN** a lane appears for each of those roles, grouped under the two party names, and each step sits in its owner's lane in list order

#### Scenario: Decision branches
- **WHEN** a step has `next` with two labelled branches
- **THEN** two connectors leave that step, each showing its label

#### Scenario: Cross-party handoff
- **WHEN** a connector joins steps owned by roles in different parties
- **THEN** it is styled differently from same-party connectors, and a legend explains the difference

### Requirement: L3 step detail
Activating a step SHALL open its detail: name, owner (role and party), RACI, inputs, outputs, systems, KPIs and narrative, showing only fields that have content. The detail SHALL offer navigation to the previous and next steps in the flow. When a step has several next steps, each SHALL be offered by its label.

#### Scenario: Open and move along the flow
- **WHEN** the viewer opens a step's detail and activates "Next"
- **THEN** the detail of the following step in the flow is shown, and the swimlane highlights it

### Requirement: Role profile
Activating a role anywhere SHALL show its profile: party, team, description, and every step across all processes where it is owner or appears in RACI, grouped by process.

#### Scenario: Role across processes
- **WHEN** the viewer opens the profile of a sample role that appears in two processes
- **THEN** the profile lists the relevant steps under both process names, each linking to its step detail

### Requirement: Navigation and deep links
Every view SHALL show a breadcrumb of its location (e.g. Model > Workstream > Process > Step). The browser Back and Forward buttons SHALL move between views. The current view (and persona) SHALL be reflected in the URL fragment, so opening the snapshot with that fragment returns to the same view.

#### Scenario: Deep link
- **WHEN** the viewer copies the URL while on a step detail, then opens that URL in a new tab
- **THEN** the same step detail is shown

#### Scenario: Back button
- **WHEN** the viewer goes from the overview to a process and presses the browser Back button
- **THEN** the overview is shown again

### Requirement: Search
The viewer SHALL provide search across the names and descriptions of all elements and steps, with results grouped by type and each result opening its element.

#### Scenario: Find a step
- **WHEN** the viewer searches for part of a step name
- **THEN** that step appears in the results under its type label, and activating it opens its detail

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
At viewport widths below 768px, the swimlane SHALL be presented as a vertical, ordered list of steps, each showing its lane (role and party) and its next steps, with no horizontal page scrolling.

#### Scenario: Mobile swimlane
- **WHEN** a process is opened at 375px wide
- **THEN** the steps appear as a vertical list in flow order, each labelled with its role and party, and the page does not scroll horizontally

### Requirement: Element pages
Parties, teams and personas SHALL each have a page showing their name, summary and related elements: a party's teams and roles, a team's roles, and a persona's roles and entry point. Search results and links for these types SHALL open that page.

#### Scenario: Open a party from search
- **WHEN** the viewer searches for a party name and opens the result
- **THEN** a page shows the party's name, its summary, and links to its teams and roles

### Requirement: Wide swimlanes scroll within their own area
When a swimlane is wider than the viewport, it SHALL scroll horizontally inside its own container, never the page. Lane headers SHALL stay visible while it scrolls. A visible "More steps" cue SHALL show while steps lie off-screen to the right. A step that receives keyboard focus, or is selected, SHALL be scrolled fully into view clear of the lane headers.

#### Scenario: More steps cue
- **WHEN** a process whose swimlane is wider than a 1024px viewport is opened
- **THEN** the page does not scroll horizontally, the lane headers stay visible, and a "More steps" cue is shown

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
