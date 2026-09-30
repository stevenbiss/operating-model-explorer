# html-tester report: add-capture-sheet-authoring

**Result: PASS.** Every Test task in scope has one test, and all of them pass. That covers 2.1–2.21, 2.31–2.46, 2.48–2.50, 2.53 and 2.54. There were no app defects and no flaky tests.

- **`npm test`:** 139 passed, 0 failed, on two runs, taking about 2.2 minutes each. 35 of these tests are new.
- **`npm run test:unit`:** 129 passed, 0 failed, on two runs.
- **Repeats:** the new spec ran 3 times (`--repeat-each=3`); all 102 runs passed.
- **Accessibility:** axe found 0 serious, critical or region violations in the new author-mode states (a sheet loaded, the open-questions group, and a sheet with an error) at 1280 and 768.
- **2.17 Snapshots match:** the folder export and the sheet export were compared by name across the overview, workstreams, both processes (change markers off and on), all 11 step details, 3 personas on 2 processes, and the `#/me` pages. Everything matched.
- **Existing tests reused:** 2.32, 2.33 and 2.37 are covered by the engine v1 tests, which still pass. 2.19–2.21, 2.45, 2.46, 2.48 and 2.50 are Node tests, and they cover their scenarios in full.
- **Not in scope here:** the skill trials (see `skill-trials.md`), 2.51 (marketplace install, a manual check) and 2.52 (release).

New spec: `tests/e2e/capture-sheet-authoring.spec.js`. New fixtures: `sheet-tiny`, `sheet-mixed`, `raci-combined`, `raci-no-accountable` and `raci-two-accountable`.
