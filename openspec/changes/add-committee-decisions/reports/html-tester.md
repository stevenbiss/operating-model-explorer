# html-tester report: add-committee-decisions (round 1)

## Overall: PASS

All 83 Test tasks (2.1–2.83) pass and are ticked. No app source was changed.

| Suite | Result |
|---|---|
| `npm run test:unit` | 244 of 244 pass |
| `npm test` (build, then Playwright at 1280×800 and 375×812) | 293 passed, 0 failed |
| `tests/e2e/committees.spec.js` alone | 50 runs (44 desktop, 6 mobile) |

Every e2e test also fails on any console error, JavaScript dialog or network request.

## Files
- New `tests/e2e/committees.spec.js`. Its header maps each reused scenario to the existing test that covers it.
- `tests/e2e/removed-element-page.spec.js`: adds an export-enabled assertion, for 2.40.
- New `reports/skill-trials.md`.

## Scenario coverage
Key: C = `tests/e2e/committees.spec.js`. Unit tests are in `validate.test.js` (V), `sheet.test.js` (S) and `layout.test.js` (L).

- **committees (2.1–2.27):** all in C, with unit tests in V or L for the validation and layout scenarios. All PASS.
- **content-schema (2.28–2.45):**
  - 2.32, 2.38, 2.41 and 2.44 are new tests in C and V.
  - 2.33 is extended in C.
  - The rest reuse existing tests in `content-schema`, `party-brands`, `structure-diagrams`, `capture-sheet-authoring` and `removed-element-page`.
  - All PASS.
- **capture-sheet (2.46–2.57):** 2.49 and 2.53–2.57 are new in C and S. The rest reuse existing tests. All PASS.
- **explorer-views (2.58–2.71):** 2.61, 2.63, 2.66, 2.69 and 2.71 are new in C (2.71 had no test before). The rest reuse existing tests, which already include the bid-board lane. All PASS.
- **persona-lens (2.72–2.77):** 2.73 and 2.76 are new in C. The rest reuse existing tests. All PASS.
- **theming (2.78–2.80):** 2.80 is new in C. It uses the `committee-labels` fixture with text that never says "committee", and checks that the word appears on no route. All PASS.
- **authoring-skill (2.81–2.82):** PASS as walk-throughs. See `skill-trials.md`.
- **2.83 Full suite:** PASS.

## Failures
None. The first run had 4 failures, all mistakes in the tester's own tests, which it fixed.

## Caveats
- **Skill trials were walk-throughs.** The tester couldn't start the fresh Claude Code session the README asks for, so it followed SKILL.md itself against the `joint-decision` pack and played the colleague from the README's scripted replies.
  - The output sheet, the validator result (0 errors, 9 warnings: 5 open questions and 4 steps with no A on the slide) and the engine check are real.
  - The "confirm with the colleague" step is weaker evidence.
  - Re-run both trials once in a fresh session.
- **Label sweep:** `tests/e2e/labels-all.spec.js` doesn't include the committee label yet. Scenario 2.80 covers it in a narrower way.
