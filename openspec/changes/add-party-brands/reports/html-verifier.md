# html-verifier report: add-party-brands

## Round 1: NOT VERIFIED (one PARTIAL)

**Coverage.** 29 of 30 delta requirements are MET, and all removal and regression checks are MET. The checks were run against 14 snapshots I exported myself, opened from `file://` with the network off:
- **Contrast:** 1,764 text/background pairs on party surfaces, in light and dark, at 1280 and 375. The minimum was 4.65:1, so none failed.
- **Distinguishability:** at least 0.062 between every pair of parties, in normal vision and under three colour-vision simulations.
- **axe:** 0 serious, critical or region findings across 336 snapshot views and the engine.
- **Console and network:** zero console errors and zero external requests.

**PARTIAL: author-mode › Snapshot contains only what was loaded.** Retired theme keys (`colors`, `fonts` including a font URL, `logo`, `palette`) are copied into the snapshot's embedded content. Nothing is drawn or fetched from them.

**Classified, not failed:**
- Unbranded parties get hue-shifted neutrals.
- Yellow shifts in dark mode, by design.
- The SKILL.md Sources example writes a local path into the sheet (a privacy nit).

**Out of scope:** party marks also appear on workstream cards.

**3.2:** PASS. No real brand assets, and the marks are geometric.

**Open questions raised:**
- The proposal names real organisations.
- Two fixture hex colours match real companies' brand reds.
- A fresh-session skill trial.

### Orchestrator decisions
- The proposal's names are removed, and public history is rewritten with the user's approval (force-pushed `a79a0d0`).
- Fixture colours are changed to arbitrary values.
- Workstream-card marks are kept and added to the spec.
- The retired theme data is stripped from snapshots.
- The Sources example is fixed.
- The private-names guard is extended to `openspec/` so names in planning documents are caught.
