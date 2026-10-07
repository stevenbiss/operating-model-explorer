# html-verifier report: add-joint-steps (tasks 3.1, 3.2)

## Verdict: VERIFIED
Every requirement in the three delta specs is MET in the running app, in author mode and in snapshots (Acme folder and sheet, `joint-basic`, `joint-far`, `sheet-joint`, and a 3-party probe), at 1920, 1280 and 375, light and dark. No console errors or external requests.

| Area | Result |
|---|---|
| Several owners | MET. Loads cleanly; committee among owners and duplicates are errors that disable export; the primary owner gets the Tab stop; RACI rules unchanged. |
| Drawn in parallel | MET. Boxes in one column, each with "Joint"; the dashed tie never enters a box (sampled every 1px); connectors attach to the nearest box (probe: in and out from several lanes; ties go to the primary); non-adjacent lanes; cross-party rule; 3 owners give 3 boxes. |
| One step elsewhere | MET. Detail owners with parties; role pages once; search once; persona emphasis on both boxes; phone list once. |
| Keyboard and screen readers | MET. One Tab stop on the primary box; twins `aria-hidden`; accessible name with "joint step" and the owners. |
| Schema, sheet and sample | MET. |
| Regression | MET. Labels, committees, idle members, RACI, drag to pan (including from a twin), selected step in view, keyboard. Unit 303 of 303; e2e 416 of 416. |
| 3.2 | MET. No real names. |

**Polish notes:**
- Arrowheads into a box between twins cross the tie (same as QA M1).
- Two connectors share one arrowhead in `joint-far` (existing before this change).
- An unknown name in a multi-owner cell says "role or committee", though only roles are allowed there.
- One-item lists and trailing semicolons load silently.

**Persona question:** both twins show "Your step". The orchestrator confirmed this is intended, as the spec says.

*Saved by the orchestrator, because html-verifier is read-only. 3.1 and 3.2 ticked on VERIFIED.*
