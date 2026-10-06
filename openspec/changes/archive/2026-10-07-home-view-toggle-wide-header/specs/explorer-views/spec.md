# Spec Delta

## MODIFIED Requirements

### Requirement: L0 model overview
The home page SHALL have two views, **Simple** and **Detailed**, and SHALL offer every viewer a toggle near its heading to switch between them at any time. The home page SHALL open in the view the author chose for the model (Simple when the author chose none). The viewer's choice SHALL be kept in the URL, so Back, Forward and copied links keep it. The toggle SHALL be keyboard operable, SHALL expose which view is on to assistive technology, and SHALL announce a change of view.

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
- **THEN** the home page opens in Detailed view and also shows the purpose text, every key message and the persona doors

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

#### Scenario: Viewer switches to Detailed
- **WHEN** a viewer opens the sample snapshot (Simple by default) and activates "Detailed" on the home page
- **THEN** the home page shows the purpose text, the key messages section and the persona doors, and the toggle shows Detailed as on

#### Scenario: Viewer switches back to Simple
- **WHEN** a viewer of a model that opens in Detailed view activates "Simple"
- **THEN** the purpose text, key messages section and persona doors are no longer shown on the home page

#### Scenario: Choice kept in the URL
- **WHEN** a viewer switches to Detailed, opens a process, then presses Back
- **THEN** the home page is shown in Detailed view, and copying the home page URL into a new tab also opens it in Detailed view

#### Scenario: Keyboard toggle
- **WHEN** a keyboard user tabs to the view toggle and activates the other view with Enter or Space
- **THEN** the home page switches view, focus stays on the toggle, and the new view is announced

#### Scenario: Toggle on a phone
- **WHEN** the sample home page is opened at 375px wide and the viewer switches to Detailed
- **THEN** the toggle is fully visible and usable, the Detailed sections appear, and the page does not scroll horizontally

## ADDED Requirements

### Requirement: Header and footer follow full-width pages
On process and structure pages at viewport widths of 768px and more, the header bar's and footer's contents SHALL span the same width as the page content, with the same side margin, so the header's title lines up with the page heading. On every other page, the header and footer SHALL keep their centred band of at most 1440px.

#### Scenario: Header lines up on a wide screen
- **WHEN** a process page is opened at 2560×1440 in a snapshot
- **THEN** the left edge of the header's model name is within 8px of the left edge of the page heading, and the page does not scroll horizontally

#### Scenario: Other pages unchanged
- **WHEN** the home page is opened at 2560×1440
- **THEN** the header's contents stay within a centred band of at most 1440px

#### Scenario: Phones unchanged
- **WHEN** a process page is opened at 375px wide
- **THEN** the header looks as before and the page does not scroll horizontally
