# Proposal: Wide, draggable diagrams

## Why

Testing the 1.4.0 engine with a real model showed three problems:

- **Wasted width.** Process and structure pages are capped at 1440px. In the author-mode preview they sit inside a capped workspace too. On a wide screen the swimlane uses about half the window, and steps disappear behind the "More steps" cue.
- **Lost scrollbars.** A swimlane box is as tall as all its lanes. With many lanes, its horizontal scrollbar is far below the screen, so the viewer can't see it or reach it without scrolling the page down and back up.
- **Committee placement with three parties.** In a model with a client party first (Customer, Acme, Globex), the committees block sits between Customer and Acme, because it's always placed after the first party shown. A committee of Acme and Globex members should sit between Acme and Globex.

## Who uses it and how it's shared

- **Viewers (colleagues and clients)** open the exported snapshot from email or disk, as before. Wide diagrams now fill their window and can be dragged around with the mouse.
- **Authors (colleagues)** get the same behaviour in the author-mode preview.
- Nothing changes in how files are made, opened or shared, and the capture-sheet format is unchanged.

## What Changes

- **Full width for diagrams.** Process swimlanes and structure diagrams use the full width of the browser window, less a small margin, in both the snapshot and the author-mode preview. Page headings, summaries and narrative keep their readable line length. Other pages are unchanged.
- **Diagram area fits the window.** On screens 768px and wider, a swimlane or structure diagram that is taller than the window scrolls inside its own area. That area is never taller than the window, so both its scrollbars stay on screen. Lane headers stay pinned on the left as today.
- **Drag to pan.** Holding the left mouse button on a diagram and dragging moves it in any direction: left, right, up and down. The cursor shows a hand (grab, then grabbing). A click without movement still opens a step or box. Text isn't selected while dragging. Keyboard, mouse wheel, trackpad and touch scrolling work as before. Phones keep their list layouts.
- **Committee placement:** the committees block sits directly after the first party group that has a member of a committee in that process. With Customer, Acme and Globex, and members from Acme and Globex, it sits between Acme and Globex. With the two-party sample nothing changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `explorer-views`: "Wide swimlanes scroll within their own area" becomes full-width, window-height, drag-to-pan swimlanes.
- `structure-diagrams`: "Wide diagrams scroll within their own area" becomes the same for structure diagrams.
- `committees`: "Committee lanes in the swimlane" places the committees block after the first party group that has a committee member.

## Non-goals

- Zooming in or out of diagrams.
- A minimap or overview of the whole diagram.
- Dragging on touch screens. Touch already pans natively, and phones use the list layouts.
- Full-screen mode.
- Moving steps or boxes by dragging. Dragging pans the view; it never edits the model.
- Changing widths of non-diagram pages (overview, workstream, role, element and search pages).

## Impact

- `src/styles.css`: page and workspace widths for the process and structure pages, plus height limits and cursors on the diagram areas.
- `src/viewer/app.js`, or a small new viewer module: the drag-to-pan pointer handling, shared by the swimlane and the structure diagram, with click suppression after a drag.
- `src/model/layout.js`: where the committees group goes.
- Tests: new e2e tests for width, height, panning and clicks; a layout unit test for the three-party case. Existing "More steps" and wide-diagram tests are checked.
- Release 1.5.0 (a new viewer feature; no change to the content or capture-sheet format).
