# html-tester report: fit-connector-labels

## Overall: PASS
Tasks 2.1–2.7 are ticked. Each scenario is tested in author mode and in a snapshot at 1280×800. No app source was changed.

| Suite | Result |
|---|---|
| Unit | 271 of 271 pass |
| E2E | 375 of 375 pass (363 existing + 12 new) |

New tests are in `tests/e2e/connector-labels.spec.js`.

- **Overlap check:** every forward label (`text-anchor="end"`, the box covering all tspans) is clear of every step box and every other label, inside the SVG, between source and target, and less than 16px before the target.
- **2.1:** "Qualify" labels are exactly Go and No go; step x equals `236 + 244k`.
- **2.2:** only the gap before "Submit the proposal" widens; the label is on one line.
- **2.3:** five labels in full, no overlaps.
- **2.4:** the gap is at most 220, the label has 2 or more tspans at different y, and its text is complete with no "…".
- **2.5:** the loop-back label is middle-anchored, halfway between the step centres, below both boxes.
- **2.6:** author-mode and snapshot positions are deep-equal for both sample processes.
- **Phones:** these scenarios don't apply, because swimlanes are lists at 375px.

# Round 2: PASS (2.1–2.11)
- New tests 2.8–2.11 cover: four labels into a top-lane step; a skip branch past a step in the target's lane (path sampled every 2px); a 47-character hyphenated word; six connectors into one step. Each runs in author mode and in a snapshot.
- **Results:** unit 276 of 276; e2e 383 of 383.
- **Found outside the scenarios:** a skip branch runs through a step in the *source's* lane in the skipped column (1.7.0 had the same). The spec's Routing rule already forbids it. Added as scenario 2.12, and sent to html-builder.

# Round 3: PASS (2.12 and 2.7)
- **2.12:** source in the top lane and in the bottom lane. The skip branch's path, sampled every 2px, enters no step box and stays inside the viewBox; labels are clear. Tested in author mode and in a snapshot.
- **Results:** unit 277 of 277; e2e 387 of 387 (24 in `connector-labels.spec.js`). All of 2.1–2.12 are ticked.
