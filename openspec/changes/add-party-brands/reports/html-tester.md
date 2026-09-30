# html-tester report: add-party-brands

**Result: PASS.** Every Test task in scope (2.1–2.33) has a Playwright test, and all of them pass. The skill trials 2.34 and 2.35 are in `skill-trials.md`.

**Suite results:**
- `npm test`: 175 passed, twice (desktop 1280 and mobile 375), with no flaky tests.
- `npm run test:unit`: 167 passed, twice.

**Rewritten tests.** The old tests of retired theme behaviour now check the new specified behaviour:
- 2.15 → 2.21: theme colours are ignored with a warning, and the frame stays neutral.
- 2.16 → 2.22: the theme logo is ignored, and the lockup is shown.
- 2.20 is removed, and replaced by a brand mid-grey contrast test.
- 2.21 → 2.25: a remote font gives a retired-key warning, and nothing is fetched.
- 2.22 → 2.27: a missing narrative image blocks export.
- author-mode 2.52 and html-deliverable 2.56 now check the lockup marks.
- capture-sheet 2.12 → 2.31: the Theme section is labels only.

The helpers now zip `brands/` with a sheet.

**Extra checks:**
- AA contrast (4.5:1) for every text/background pair on party-coloured surfaces, across 8 snapshots in light and dark.
- The frame never uses a brand colour.
- Colour is never the only cue.
- Marks are always `<img>` data URIs.
- The hostile SVG is inert in both the preview and the snapshot.
- axe finds 0 serious, critical or region violations at 1280 and 375, in light and dark.

**Raised, not failed:**
1. Retired theme values, such as the old colours and a font URL, are still copied into the snapshot's embedded data. Nothing is drawn or fetched with them.
2. An unbranded party's colour can be a hue-shifted variant of a listed neutral, not an exact member of the list.
