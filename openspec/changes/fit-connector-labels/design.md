# Design: Make room for connector labels

## Context

`src/viewer/swimlane.js` places step `x` at `HEAD + rank * COL + GAP / 2`, with fixed `COL = 244`, `NW = 164` and `GAP = 80`.

- A forward connector runs from the source's right edge to a bend at `mx`, then vertically, then horizontally into the target.
- Its label is a `<text>` drawn near the bend, in the middle of the gap, so anything wider than about 80px spills over the boxes.
- Rework loops are routed under the steps, with their own label placement.
- `flow()` in `src/model/layout.js` is pure, unit-tested and gives ranks and edges.

## Goals / Non-Goals

**Goals:**
- Readable labels with the smallest layout change: per-column gaps, labels on the entry segment, and pure, unit-tested positioning.

**Non-Goals:**
- Text measurement in the browser, author-set widths, or a change to node size or loop routing.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies.

### D2. Estimate label widths, don't measure *(answers the draft's open question 1)*
- A pure `labelWidth(text) = ceil(len * 6.4) + 8` estimates the width at the label's 12px font size. Measured text averages about 5.9px per character, so 6.4px keeps a margin of roughly 10% without over-widening gaps. *(Tightened from 7.2 after verification measured 30–40% over-estimates.)* The unit test against a fixed character-width table still guards the margin.
- Rejected: measuring in the browser. It would make the layout depend on fonts and the DOM, break the Node unit tests, and could differ between the author preview and the snapshot.

### D3. Gap per column *(answers open question 2)*
- A pure function `columns(f)` returns `{ x: [..] }`: the left edge of each rank's step box.
- `gap[k] = clamp(max(labelWidth of labelled forward edges into rank k) + 2 * 12, 80, 220)`. The bend sits 12px past the source and the label ends 8px before the target, so the label has `gap - 20` of room, which is at least `labelWidth + 4`. Short labels ("Go", "No go") stay within today's 80px. *(Corrected during build: an earlier `+ 24` widened even short labels and contradicted the "no change" scenario.)*
- Then `x[k] = x[k-1] + NW + gap[k]`.
- Rejected: one gap for the whole diagram. A single long label would widen every column and make big diagrams much wider for no benefit.

### D4. Label on the entry segment *(answers open question 3)*
- The bend moves to `mx = a.x + NW + 12`, just past the source.
- The connector then runs vertically and enters the target horizontally across almost the whole gap.
- The label is right-aligned at `target.x - 8`, sitting 6px above the entry line.
- A decision's branches go to different targets, which sit in different lanes or slots, so their entry lines are at least one step height apart. The labels land on separate rows by construction.
- **Edges that skip columns** (rank difference greater than 1): only the gap directly in front of the target is sized for the label, which is where the label sits.
- **Same-lane edges** (a straight horizontal line): same placement, above the line.
- **Wrapping:** when `labelWidth + 24 > 220`, the text is wrapped greedily at word boundaries into as many lines as needed, so that each line's estimated width is at most `220 - 24`. The lines are `<tspan>`s stacked upwards from the entry line. A single word longer than a line stays whole. Typical long labels take two lines, which fit easily in the vertical space between lanes.
- **Several labelled edges into the same step** (corrected after verification): each enters at its own point on the target's left edge, spread at 16px pitch around the centre line and ordered by the source's vertical position, so connectors don't cross near the target. Each label sits above its own entry line. When the topmost label would rise above the diagram, the lane-band area is reserved by shifting the entries down within the box, or the label is placed below its line. Line pitch is at least 16px, against a 15px text box.

### D5. Unchanged parts
- Rework loops, the "More steps" cue, drag to pan, `scrollIntoView` for the selected and focused step, Tab order and accessible names are unchanged; they read positions from the same layout.
- The total width keeps 1.7.0's right margin: `x[last] + NW + 40 + 8`. It is unchanged when no gap widens.

### D6. Sample and version
- "Review the proposal" gets the branch label "Approved, ready to submit" in both forms.
- Release 1.7.1: a layout fix with no content or format change.

## Risks / Trade-offs

- **[The estimate is too small for a very wide font or glyphs.]** → The per-character width is generous. A unit test checks the estimate is at least the real width for sample strings, using a fixed table of character widths. The e2e tests also measure real `getBBox()` overlap in Chromium.
- **[Moving the bend to the source side changes how every forward connector looks.]** → It's slightly different from 1.7.0, but more readable, and it's consistent. Cross-party styling and arrowheads are unchanged.
- **[Two connectors leave the same source towards targets in the same lane and slot.]** → That can't happen, because two different steps never share a lane, rank and slot.

## Migration Plan

Viewer-only, with no content change. Re-exported snapshots get the new layout. To roll back, use 1.7.0.

## Open Questions

None.
