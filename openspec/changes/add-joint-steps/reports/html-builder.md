# html-builder report: add-joint-steps

## Tasks 1.1–1.8: done
- **1.1:** `owner` is a string or a list. `load.js` normalises `owners`, `owner` (primary), `joint`, `lane` and `parties`; the snapshot keeps them.
- **1.2:**
  - Committee among owners: error. Duplicate role: error. Each owner gets the reference check with suggestions.
  - The removed-owner warning covers every owner, and the committee-owns-no-step check flattens lists.
  - The sheet splits the Owner cell on `;`; folder/sheet parity is tested.
- **1.3:** `flow()` gives each joint node `twins` (per-lane slots) and lists it once in `order`. Edges get `fromBox` and `toBox` (nearest lane, ties to the primary). New `boxesOf()`.
- **1.4:**
  - A box per owner with a "Joint" pill; the primary is the Tab stop ("<step>, joint step: A, B"); other boxes are `aria-hidden` click-throughs.
  - The dotted tie runs 5px left of the column.
  - Connectors, entry points, labels and detours work per box.
  - Unit render tests: the tie crosses no box; connectors attach to the nearest box.
- **1.5:**
  - Step detail shows Owners with a "Joint" badge.
  - Role pages and "What matters for me" count any owner.
  - Phone label: "Bid manager (Acme Corp) · Solution architect (Globex)" plus "Joint".
  - Search finds the step once.
- **1.6:** fixtures `joint-basic`, `joint-far` and `sheet-joint` give 0 messages; `joint-invalid` gives exactly 2 errors.
- **1.7:** in the sample, "Kick off the bid" is joint in both forms, with the Solution architect C → R (0 errors and 0 warnings). Docs, SKILL.md and the template are updated.
- **1.8:** version 1.9.0.
- **Tests updated:**
  - `validate-cli`: the escape-sequence test now uses `:` instead of `;`.
  - `explorer-views` and `people-status-view`: Kick off the bid's pills and phone label.
- **Results:** unit 295 of 295; e2e 397 of 397.

## Edge-case choices accepted by the orchestrator
1. **Connectors between two joint steps:** the source box is chosen against the target's primary lane, then the target box against that source box.
2. **"Nearest":** the smallest lane difference, with ties going to the primary owner's box. The sample's Go connector enters the Bid manager box and isn't cross-party.
3. **Owner lists:** an empty list is an error; a one-item list counts as a single owner but must be a role; with duplicates the step shows once and the error blocks export.
4. **Phone label:** owners and parties only, with no people line.
5. **Test ids:** `joint-twin-<id>`, `joint-tie-<id>`, `owner-item`, `joint-badge`.
6. **Tie placement:** short arrowheads into intermediate boxes can cross the dotted line, but no step box can.
