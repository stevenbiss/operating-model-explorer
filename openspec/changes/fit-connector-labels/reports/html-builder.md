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
