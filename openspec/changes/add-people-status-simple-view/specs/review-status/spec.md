# Spec Delta

## Purpose

Lets authors say whether each process and structure diagram is still under review or has been agreed, and makes that status impossible to miss for viewers, so drafts aren't read as decisions.

## ADDED Requirements

### Requirement: Review status on processes and diagrams
Every process and every structure diagram SHALL have a review status: **Under review** or **Agreed**. Under review SHALL be the default when the author sets nothing. In a content folder it SHALL be set with `status: under-review` or `status: agreed`. In a capture sheet it SHALL be set with a `Status: Under review` or `Status: Agreed` line in the process or structure section, matched ignoring case and spacing. Any other value SHALL be an error naming the element and listing the allowed values.

#### Scenario: Default is under review
- **WHEN** a process has no status
- **THEN** it loads with no message and is shown as Under review

#### Scenario: Agreed in a sheet
- **WHEN** a sheet's process section has the line `Status: agreed`
- **THEN** it loads with no message and the process is shown as Agreed

#### Scenario: Invalid status
- **WHEN** a structure file has `status: approved`
- **THEN** the report shows an error naming the structure and listing "under-review" and "agreed", and export is disabled

### Requirement: Status shown everywhere the item appears
A process's or diagram's status SHALL be shown as a text badge ("Under review" or "Agreed"), not by colour alone:
- next to the heading on its own page;
- on every card or list entry that links to it: home page, workstream pages, role pages, committee pages, related-diagram panels and "What matters for me";
- in search results.

The two badges SHALL look clearly different from each other and from the change badges (New, Changed, Removed), and SHALL meet WCAG AA contrast in light and dark themes.

#### Scenario: Badges on the home page
- **WHEN** the sample opens on the home page
- **THEN** every process and structure diagram listed shows either "Under review" or "Agreed"

#### Scenario: Badge on the page
- **WHEN** the viewer opens an agreed process
- **THEN** the badge "Agreed" is shown next to its heading

#### Scenario: Badge in search
- **WHEN** the viewer searches for a process name
- **THEN** its result shows the process's status badge

### Requirement: Under-review notice
The page of a process or diagram that is under review SHALL show a short notice directly above the swimlane or diagram, saying it is under review and may still change. Agreed items SHALL show no notice. The notice SHALL be part of the page text, so screen readers read it before the diagram.

#### Scenario: Notice on an under-review process
- **WHEN** the viewer opens a process that is under review
- **THEN** a notice above the swimlane says the process is under review and may still change

#### Scenario: No notice when agreed
- **WHEN** the viewer opens an agreed diagram
- **THEN** no under-review notice is shown

### Requirement: Status on small screens
Below 768px, status badges and the under-review notice SHALL still be shown, wrapping as needed, with no horizontal page scrolling.

#### Scenario: Mobile status
- **WHEN** an under-review process is opened at 375px wide
- **THEN** the "Under review" badge and the notice are visible and the page does not scroll horizontally

### Requirement: Sample status
The Acme sample, in both forms and in parity, SHALL have at least one agreed process and at least one process and one structure diagram under review.

#### Scenario: Sample statuses
- **WHEN** both Acme forms are loaded
- **THEN** both show the same statuses, with at least one "Agreed" and at least one "Under review" process
