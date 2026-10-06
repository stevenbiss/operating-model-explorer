# Spec Delta

## MODIFIED Requirements

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
