# html-verifier report: home-view-toggle-wide-header (tasks 3.1, 3.2)

## Verdict: VERIFIED
Every requirement and scenario in the three delta specs is MET in the running app. The verifier exported fresh snapshots (sample Simple, sample Detailed, sheet with `View: DETAILED`, plain sheet) and drove them at 2560, 1920, 1280 and 375, light and dark, in author mode and snapshots. Suites re-run: e2e 397 of 397; unit 280 of 280.

| Spec | Result |
|---|---|
| L0 home page | MET. Opens in the content's view; the toggle switches both ways in all 8 size and theme combinations. The URL keeps the choice (`?view=detailed` only when it differs from the model; Back, Forward, a new tab, persona and breadcrumb all keep it). Keyboard (Space and Enter, focus kept, announced); phone (toggle fully visible, no horizontal scroll). |
| Header and footer follow full-width pages | MET. Process and structure pages at 2560 and 1920: name, h1 and footer at x=24. Home and workstream keep the centred 1440 band. 375 unchanged. |
| author-mode › Live preview | MET. "Snapshot opens in" line; no author-only toggle; one toggle in the preview; export opens in the content's view; keyboard in the preview; the author bar keeps 1440 while the preview header follows. |
| capture-sheet › View line | MET. `View: DETAILED` opens Detailed; `View: Full` gives an error. |
| Regression | Persona prompt, swimlane, structures, key messages and workstream all fine; console and network clean; single file. |
| 3.2 | MET. 0 private-name hits across 1,012 tracked files; no real company names. "Steven Biss" appears as the plugin author in `.claude-plugin/*.json` (the repo owner's own public attribution since the first release); not counted as a breach. |

**Notes:**
- In dark mode, the pressed button's fill is close to the page background (state is still clear from the ✓ and the text); worth a non-text contrast look.
- The wide home-page brand and h1 offset predates this change.
- An unknown `?view=` stays in the URL but is ignored.

*Saved by the orchestrator, because html-verifier is read-only. 3.1 and 3.2 ticked on VERIFIED.*
