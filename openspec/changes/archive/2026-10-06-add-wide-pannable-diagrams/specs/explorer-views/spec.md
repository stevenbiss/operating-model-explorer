# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
