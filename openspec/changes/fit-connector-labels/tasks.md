# Tasks

## 1. Build

- [x] 1.1 Pure layout (D2, D3): `labelWidth(text)` and `columns(f)` (per-rank step `x` from label-sized gaps between 80 and 220px). Verify with unit tests: no labels gives today's positions; a long label widens only its gap; a 60-character label caps at 220; the estimate is at least the width from a fixed character-width table for the sample labels
- [x] 1.2 Swimlane rendering (D4, D5) in `src/viewer/swimlane.js`: node `x` from `columns()`, the bend just past the source, the label right-aligned on the entry segment above the line, a two-line wrap past the maximum, loop-back labels unchanged, and the total width from the new positions. Verify manually at 1280 in light and dark with the sample and the fixtures
- [x] 1.3 Fixtures, fictional names only: `branches-five` (a decision with five branches, labels up to 24 characters, to five steps) and `branch-label-long` (one 60-character label). Verify that each loads with 0 errors
- [x] 1.4 Sample (D6): "Review the proposal" → `Approved, ready to submit` in both forms, in parity. Update the two tests that assert "Approved". Verify that both load with 0 errors and 0 warnings and that the parity test passes
- [x] 1.5 Version 1.7.1 in `package.json` and `package-lock.json`, with the build stamping the plugin and skill. Verify with the version unit test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://` at 1280×800. Overlap checks use `getBBox()` / `getBoundingClientRect()` of the label `<text>` against every step `rect.box`.

### explorer-views
- [ ] 2.1 Short label, no change
- [ ] 2.2 Long label widens its gap
- [ ] 2.3 Five-branch decision
- [ ] 2.4 Label past the maximum wraps
- [ ] 2.5 Loop-back label unchanged
- [ ] 2.6 Same layout in the snapshot
- [ ] 2.7 The full existing suite (`npm run test:unit` and `npm test`) still passes

## 3. Verify

- [ ] 3.1 html-verifier checks the requirement against the running engine and a snapshot at 1920 and 1280, light and dark, with the sample and the fixtures, plus a regression pass over the swimlane (drag to pan, selected step in view, keyboard, committees, idle members). It returns VERIFIED. The report is saved to `openspec/changes/fit-connector-labels/reports/html-verifier.md`
- [ ] 3.2 Confirm there are no real names in the repo (private-names guard plus `git grep -iw` for common real company names)

## 4. QA

- [ ] 4.1 html-qa final gate: axe on the affected swimlanes at 1920, 1280 and 375; visual polish of labels and bends, light and dark; long and wrapped labels; `/code-review` and a Ponytail audit. It returns SHIP. The report is saved to `openspec/changes/fit-connector-labels/reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, export the Acme demo snapshot from the capture sheet, and publish release 1.7.1 with the three standard assets and checksums
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
