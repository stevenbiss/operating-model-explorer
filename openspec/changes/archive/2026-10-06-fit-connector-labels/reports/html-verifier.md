# html-verifier report: fit-connector-labels

## Round 1: NOT VERIFIED
All six scenarios are MET at 1920 and 1280, light and dark, in author mode and in snapshots: no change with short labels; only the labelled gap widens (212px, one line); five branches in full, no overlaps; a 60-character label wraps onto 3 lines inside a 220px gap; loop-back unchanged; author and snapshot identical. The regression pass is clean: More steps, drag to pan, selected step in view, keyboard, committees and idle members, persona, and the 375 list.

**Failure** (the general rule "every label fully readable, no overlaps, never truncated"): several labelled connectors into the same top-lane step stack their labels upwards with no limit.
- With 4 labels, one sits at bbox y = −29 and is clipped entirely.
- With 3, one is clipped by 1px.
- Stacked labels overlap by 1px (14px pitch against a 15px text box).
- Labels sharing one entry line can't be matched to their connectors.

**Observation:** the width estimate (7.2px per character) was measured at 30–40% too generous, so gaps were wider than needed.

**3.2:** PASS (no real names in tracked files). Ticked by the orchestrator.

**Orchestrator decision:** fix it in this change. Each labelled connector into a step gets its own entry point, at least 16px apart, and no label may extend outside the diagram. New scenario "Several labels into one step" (2.8). The estimate is tightened to 6.4px per character.

## Round 2: VERIFIED
Build at commit 7271c16; the skill's engine is byte-identical. The verifier's own probes covered 3 and 4 labels into one top-lane step, a skip into an already-labelled step, 6 labels into one step, the 2.9 shape, skips past a step in the source's own lane (both directions) and long words. Each ran in author mode and in a snapshot, at 1920 and 1280, light and dark: 104 runs, 0 failures.

| Scenario | Result |
|---|---|
| Short label, no change | MET (x = 236, 480, 724, 968) |
| Long label widens its gap | MET (192px, one line) |
| Five branches | MET |
| Several labels into one step | MET. Entries at 63, 79, 95, 111; order matches; top label at y = 3, inside (was −29). |
| Label past the maximum wraps | MET (220, 3 lines) |
| Many connectors into one step | MET (6 entries, even 10px spacing, stacked in order) |
| Branch that skips a column | MET |
| Skip branch past a step in its own lane | MET (top and bottom detours clear) |
| One very long word | MET (hyphen, slash and mid-word breaks) |
| Loop-back label unchanged | MET |
| Same layout in the snapshot | MET (52 of 52 identical) |

The regression pass is clean: More steps, drag to pan, selected step in view, keyboard, committees and idle members, persona, and the 375 list. 3.2: still clean.

**Notes (not failures):**
- An unlabelled connector can share an entry line with a labelled one.
- Two connectors can share a vertical segment.
- Stacks of many labels look crowded.
- Mid-word breaks get no hyphen.
