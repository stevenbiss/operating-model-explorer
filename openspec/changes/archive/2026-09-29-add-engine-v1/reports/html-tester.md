# html-tester report: add-engine-v1

**Overall: PASS.** 61 of 61 scenarios (tasks 2.1–2.61) have exactly one Playwright test each, and all pass.

- **Runs:** 72 per `npm test`. All tests run at 1280×800. The small-screen scenarios 2.37 and 2.60, plus 11 key flows, also run at 375×812.
- **Stability:** four full runs were green, taking 1m14s to 1m26s with 8 workers. A stress pass (every test three times, 216 runs) was green after 2.58 and 2.59 were given extra time with `test.slow()`, because axe runs 32 scans and hit the timeout under load.
- **Every test fails on:** any console error, uncaught exception, JavaScript alert or dialog, or any request other than `file:`, `data:` or `blob:`.
- **What's tested:** viewer scenarios run against a snapshot exported through the real Export button. Author-mode scenarios run against `dist/operating-model-explorer.html`.
- **Unit tests:** 67/67, unchanged.

## Manual checks still needed
- **2.51 Reload:** the real `showDirectoryPicker` dialog can't be automated, so the test replaces it with an in-memory folder. Picking a real folder, then Reload, needs a one-off check in Chrome and Edge.
- **Folder drag-and-drop:** a real folder dragged from the desktop can't be automated. The tests cover a simulated zip drop.

## Follow-ups raised (none are failures)
1. **Content reference at 375px:** in author mode, the reference dialog's 6 example `<pre>` blocks scroll sideways and can't be reached by keyboard. axe flags this as `scrollable-region-focusable` (serious). Author mode is specced for 768px and up. It's fixed in the builder's follow-up round.
2. **README:** out of date on `npm test` and the location of the Playwright tests. Fixed in the follow-up round.
3. **Persona prompt:** dismissing it in the author preview is remembered for that browser tab, so an exported snapshot opened in the same tab skips the prompt. Fixed in the follow-up round.

## Files
- `playwright.config.js`
- `tests/e2e/*.spec.js` (6 files) and `tests/e2e/helpers.js`
- `tests/fixtures/` (error-case folders, plus `minimal-model`, `tiny` and `three-processes`)
- Results in `test-results/results.json`
