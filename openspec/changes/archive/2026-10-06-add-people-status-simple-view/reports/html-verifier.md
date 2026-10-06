# html-verifier report: add-people-status-simple-view (tasks 3.1, 3.2)

## Verdict: VERIFIED
Every requirement in the seven delta specs is MET.

**Method:**
- The verifier's own Node and Playwright scripts against `file://`, in author mode and in snapshots exported with the real Export button.
- 1920, 1280 and 375, light and dark.
- 0 console errors, 0 dialogs and 0 network requests. The build was current, and the skill's engine is byte-identical to `dist`.

## Summary
| Spec | Result |
|---|---|
| role-people | MET. Names in order; markup shown as text; one person or "Multiple people" on lanes, chips, owner, RACI, committee members and team boxes; a box's own name wins ("TBA"); nothing when a role has no people. Pop-up: delayed on hover (not at 60ms, shown by 300ms), can be hovered, persists, closes on pointer-out, Escape and scroll; immediate on focus, Escape keeps focus. Accessible description passes. Across 10 routes, 0 pop-ups off-window or overlapping their element. Role page People section; phone list; sample parity. |
| review-status | MET. Default, case-insensitive sheet values, invalid-value error with export disabled. Badges everywhere listed in the spec, distinct and AA (Under review 16.6:1, Agreed about 5:1). Notice above the swimlane and the diagram, none when agreed. 375 layout; sample statuses. |
| explorer-views | MET. Simple default (name, Parties, Value streams, Processes, Structures). Detailed adds purpose, About, key messages and persona doors. Key messages dialog works in Simple. Processes section and main-first both work. 375 layout. Only the home page differs. |
| content-schema | MET. Errors for invalid view and non-list people; the reference lists all three fields. |
| capture-sheet | MET. People, Status and View lines, with their errors. |
| author-mode | MET. Reload (stubbed picker); preview toggle; export stays Simple; keyboard toggle with `aria-pressed`. |
| authoring-skill | MET, judged on the trial report: all 7 names checked against the pack files; only "Win the work" agreed. |
| html-deliverable | MET. Single file, `default-src 'none'`, no network. |
| Regression | Unit 256 of 256 pass; e2e 348 of 348 pass; spot checks fine. |

**3.2:** private-names guard: 0 matches. `git grep -iw` for about 50 real company names: 0 matches.

## Open questions (not blocking)
1. The Under review icon (a partial ring) can read as a circled "C" next to the RACI "C" markers.
2. A box with its own Name text still pops up the role's people, which can contradict the box text.
3. The right-edge clamp is in the code but no real layout reached it.
4. Clicking a role element brings its pop-up back (focus after pointerdown); this only matters while dragging.
5. The preview toggle's label doesn't change when pressed; only `aria-pressed` does.
