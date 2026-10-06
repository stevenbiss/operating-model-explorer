# Spec Delta

## ADDED Requirements

### Requirement: Connector labels fit between steps
In the swimlane, every label on a forward connector (a decision branch) SHALL be fully readable: no part of it SHALL overlap a step box, and labels SHALL NOT overlap each other.
- **Placement.** A label SHALL sit on the connector's last horizontal segment, the one entering its target step, just before the target.
- **Gap sizing.** The gap in front of each column SHALL be at least as wide as the widest label on a forward connector entering that column, plus padding on both sides, and never narrower than today's gap. Columns without such labels SHALL keep today's width.
- **Wrapping.** A gap SHALL be at most 220px wide. A label too long for that SHALL wrap onto two lines, still clear of the step boxes.
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

#### Scenario: Label past the maximum wraps
- **WHEN** a branch label is 60 characters long
- **THEN** its gap is at most 220px, and the label shows on two lines without overlapping any step box

#### Scenario: Loop-back label unchanged
- **WHEN** the sample's "Build the proposal" is opened
- **THEN** the "Needs rework" loop-back label is drawn under the steps, as before

#### Scenario: Same layout in the snapshot
- **WHEN** the sample is exported and the snapshot's "Build the proposal" is opened
- **THEN** the step and label positions match the author-mode preview
