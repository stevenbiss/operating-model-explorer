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

## Round 2: NOT VERIFIED (one PARTIAL)
- **The round-1 PARTIAL is MET.** Only labels are embedded from the theme, and the retired values are absent.
- **Everything else is MET.** Across 19 snapshots, 3,456 text/background pairs have a minimum contrast of 4.51. axe finds nothing, and there are no console errors or requests. The regression pass is clean. 3.2 passes: 0 matches across the repo and its full history.
- **PARTIAL: party-brands › Party identity where the party appears.** The swimlane legend shows the colour and name, but not the mark, which the spec requires.
- **Minor findings:**
  - The mobile step list shows the party colour and name, but no mark.
  - Unbranded parties whose names start with the same words get identical initials ("PO").

### Orchestrator decision
- Add marks to the legend items.
- Add a mark next to the party name in the mobile step list, for consistency.
- The identical initials for similarly named unbranded parties are deferred. Names and colours still differ, and the remedy is to give those parties brands.
- QA round-2 MINOR 1 (long word in a party-page heading) and MINOR 3 (an SVG with a leading comment or DOCTYPE) are fixed in the same round.

## Round 3 (targeted): VERIFIED
- **party-brands › Party identity where the party appears is MET everywhere listed.** That includes the legend, now with marks: 24/24, 6/6 and 12/12 entries.
- **Phone step list:** all marks shown with their names, and no horizontal scroll.
- **Long names:** a party name that is a single 34-character word causes no horizontal scroll on any page.
- **SVG check:** marks starting with a comment or DOCTYPE give no warning, while HTML posing as an SVG still warns.
- **Regression:** axe found 0 issues across 16 runs, with 0 console errors and 0 requests. All text pairs are at least 4.5:1.
- **New minor issue (deferred):** a single 38-character word in a role name widens the RACI table by 10px at 375. This predates the change.
- **Still deferred:** identical initials for unbranded parties with similar names.

Combined with round 2, where every other requirement was MET: **all requirements are MET.**
