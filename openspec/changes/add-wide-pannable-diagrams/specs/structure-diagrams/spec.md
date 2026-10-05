# Spec Delta

## MODIFIED Requirements

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
