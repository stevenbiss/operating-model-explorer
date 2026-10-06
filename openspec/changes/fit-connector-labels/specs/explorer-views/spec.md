# Spec Delta

## ADDED Requirements

### Requirement: Connector labels fit between steps
In the swimlane, every label on a forward connector (a decision branch) SHALL be fully readable: no part of it SHALL overlap a step box, and labels SHALL NOT overlap each other.
- **Placement.** A label SHALL sit on the connector's last horizontal segment, the one entering its target step, just before the target. When several labelled connectors enter the same step, each SHALL enter at its own point along the step's left edge, at least 16px apart while they fit within that edge, or spread evenly along it when there are more. Each label SHALL sit next to its own connector where there is room; where there isn't, the labels SHALL be stacked in the same top-to-bottom order as their connectors. No label SHALL extend outside the diagram.
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

#### Scenario: Many connectors into one step
- **WHEN** six labelled connectors with short labels enter the same step
- **THEN** all six enter within the step's left edge, all six labels are fully visible, and none overlaps another

#### Scenario: Branch that skips a column
- **WHEN** a decision has one labelled branch to the next column and another labelled branch two columns on, into a lane that has a step in the skipped column
- **THEN** the longer branch passes no step box, and its label sits clear of every step box

#### Scenario: One very long word
- **WHEN** a branch label is a single 47-character hyphenated word
- **THEN** it is shown in full on more than one line, and no part of it overlaps a step box

#### Scenario: Loop-back label unchanged
- **WHEN** the sample's "Build the proposal" is opened
- **THEN** the "Needs rework" loop-back label is drawn under the steps, as before

#### Scenario: Same layout in the snapshot
- **WHEN** the sample is exported and the snapshot's "Build the proposal" is opened
- **THEN** the step and label positions match the author-mode preview
