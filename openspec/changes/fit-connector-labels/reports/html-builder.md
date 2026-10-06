# html-builder report: fit-connector-labels

## Round 1: tasks 1.1–1.5
- **1.1:** `labelWidth()` and `columns()` in `src/model/layout.js`. `HEAD` and `NW` moved there and exported, along with the gap constants. Unit tests: positions unchanged with no labels; only the labelled gap widens; capped at 220; the estimate is at least a fixed width table for the sample and fixture labels.
- **1.2:**
  - Steps and RACI markers use `columns()`.
  - The bend sits at `a.x + NW + 12`; the label is right-aligned at `target.x - 8`, 6px above the line.
  - Loop-backs are unchanged.
  - Added: labels into the same target stack 14px per line.
  - The right margin stays at 1.7.0's value.
  - No existing e2e coordinates needed changing.
- **1.3:** fixtures `branches-five` and `branch-label-long`.
- **1.4:** the sample label is now "Approved, ready to submit" in both forms (parity kept); `sample.test.js` updated. The capture-sheet-authoring edit string applies to the `sheet-tiny` fixture, so it was left alone.
- **1.5:** version 1.7.1.
- **Ambiguity raised:** the design's `+ 24` widened even short labels, contradicting the spec. The orchestrator corrected the design.

## Round 2: corrected gap formula and multi-line wrap
- `gap = clamp(labelWidth + 24, 80, 220)`: "Go" and "No go" stay at 80, and the sample label gets a 212px gap on one line.
- `labelLines()` wraps greedily into as many lines as needed, each at most 196px by estimate. A long word stays whole and nothing is cut. The 60-character label takes 3 lines.
- Unit tests updated, plus a long-word test. No overlaps in Chromium across the sample and the fixtures.
- **Results:** unit 271 of 271; e2e 363 of 363.

## Round 3: verifier and QA fixes
1. **Skip-column bend:** `mx = cols[targetRank - 1] + NW + 12`, restoring 1.7.0's routing for skips.
2. **Entry points:** a pure `entryPoints()` gives each labelled connector its own entry line, ordered by source, at least 16px apart, kept on the step's edge. Labels are pushed clear of each other and stay inside the diagram; the lowest move below their lines if needed.
3. **Estimate:** 6.4px per character; characters from U+2E80 count 1.7.
4. **Long words:** broken after `-` or `/`, else mid-word; the text is always complete.
5. **Small fixes:** `LABEL_PAD` comment; single `columns()` call in the unit test.
- **Unit tests:** skip bend, entry spreading for several shapes, rendered entry order, long words, wide characters. The sample gap is now 192 on one line.
- **Results:** unit 275 of 275; e2e 375 of 375.
- **Limit raised:** four long multi-line labels can't each sit on their own line, because the step edge is 70px. The orchestrator's decision: they stack in connector order (spec updated), and 5 or more entries spread evenly within the edge (new scenario 2.11).

## Round 4: label order and the more-than-four guard
- **Label order:** already held in every case; a new unit test covers several label sets at top, middle and cramped heights.
- **Guard:** entries that can't keep 16px within the step edge now spread evenly along it. 6 entries span 62–112 at 10px spacing, with no overlapping labels, all inside the diagram. 4 entries keep 16px.
- **Results:** unit 276 of 276; e2e 375 of 375.

## Round 5: skip branches past a step in their own lane
- **When it detours:** a forward edge detours if a source-lane step in a skipped column spans the source's centre height.
- **The route:** bend just past the source → along the source lane's boundary on the target's side (top if the target is higher, otherwise bottom) → drop just before the target's column. Otherwise the route is unchanged.
- **Edge case:** in the bottom lane, the boundary is the diagram's bottom edge.
- **Unit test:** a rendered `s → mid → far` plus a labelled `s → far`. The skip branch crosses no box and runs along the lane line; the adjacent edge doesn't detour.
- **Results:** unit 277 of 277; e2e 383 of 383.
