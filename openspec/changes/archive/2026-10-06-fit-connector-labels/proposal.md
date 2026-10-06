# Proposal: Make room for connector labels in the swimlane

## Why

In the process swimlane every column is the same width (`COL = 244`) and every step is `NW = 164` wide, so the gap between two columns is always 80px (`src/viewer/swimlane.js`). A forward connector runs across that gap, and its label (a decision branch such as "Go") is drawn on the connector in the middle of the gap.

A label wider than about 80px therefore runs over the step boxes on both sides of the gap. Short labels ("Yes", "No") fit, but real decision branches often don't. A decision with five branches ("Existing account", "New initiative", "Not for us", "More information needed", "Park or decline") makes most of its labels unreadable. They are drawn under the neighbouring steps' boxes and over each other's connectors.

Authors can only work around it by shortening labels until they lose meaning.

## Who uses it and how it's shared

- **Authors (colleagues):** nothing to change. Branch labels are written as today, in `Next`.
- **Viewers (colleagues and clients):** receive the exported snapshot HTML as before, and can read every branch label in the swimlane without hovering or opening the step.

## What Changes

- **Gaps widen to fit their labels.** The gap in front of a column, which its incoming connectors cross, is at least as wide as the widest label on a forward connector into that column, plus padding. Today's 80px is the minimum. Columns with no long labels keep today's width, so most diagrams don't change.
- **Labels sit clear of the steps.**
  - A forward connector's label sits on the connector's last horizontal segment, the one entering its target step, just before the target.
  - Its whole width lies in the gap, and it never overlaps a step box.
  - The connector bends close to the source, so that segment is long enough.
- **Labels of one decision don't collide.** Each branch enters its target at that target's own height, so the labels of a decision sit on separate rows.
- **Very long labels wrap.** A maximum gap of 220px stops one very long label from stretching the diagram. Past it, the label wraps onto two lines, still clear of the steps.
- **Loop-back labels are unchanged.** Labels on rework loops, drawn under the steps, keep today's placement.
- **Everything else follows the new widths.** Step positions, drag to pan, keeping the selected step in view, step order, Tab order and screen-reader text are unchanged apart from coordinates. The snapshot uses the same layout.
- **Sample:** the Acme sample's "Review the proposal" decision gets a longer branch label, "Approved, ready to submit", in both forms.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `explorer-views`: an added requirement for connector labels: column gaps sized to labels, label placement clear of steps, separate rows for one decision's labels, wrapping past the maximum, unchanged loop-back labels.

## Non-goals

- Changing the step box size, lane heights or the rework-loop routing.
- Letting authors set column widths.
- Abbreviating or truncating labels automatically (wrapping is used instead).
- Any real names, brands or org data in this public repo, including examples and tests.

## Impact

- `src/model/layout.js` (or a small pure helper next to it): per-column x positions from estimated label widths, unit-tested in Node.
- `src/viewer/swimlane.js`: node x from those positions, the bend point near the source, labels on the entry segment, two-line wrap.
- The Acme sample (both forms, in parity), fixtures for a long label and a five-branch decision, unit and e2e tests.
- Release 1.7.1. This is a layout fix with no content or format change.
