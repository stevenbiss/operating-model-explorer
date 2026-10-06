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
