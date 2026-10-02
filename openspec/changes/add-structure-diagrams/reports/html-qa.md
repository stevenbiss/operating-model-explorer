# html-qa report: add-structure-diagrams (task 4.1)

**Verdict: SHIP.** No blockers. There are 2 SHOULD-FIX items and 8 NICE-TO-HAVE items. html-qa's role is read-only, so the orchestrator saved this report.

## How this was checked
- **Build:** `npm run build` passes (`dist/operating-model-explorer.html`, 365.4 KB).
  - `npm run test:unit` gives 210 / 210.
  - A Playwright rerun of `structure-diagrams.spec.js`, `xss-escaping.spec.js` and `html-deliverable.spec.js` gives 77 / 77.
- **Browser:** the built file and exported snapshots, driven over `file://` with the project's own Playwright install.
  - The sources were the Acme sample, `tests/fixtures/structure-org`, `tests/fixtures/structure-wide`, hostile variants, and a generated model with 8 parties, 12 leaf bands, 100 boxes and 24 lines.
  - The evidence is in the workspace's gitignored `scratch/qa-add-structure-diagrams/`.

## Results by area

| Area | Result |
|---|---|
| **Security** | **PASS.** Payloads such as `<img onerror>`, `</script><script>` and `"><svg onload>` were put into every new field, in both folder and capture-sheet form (details below). Every route renders them as text: 0 handlers ran, 0 payload elements, 0 `on*` attributes. Checked in author mode and in the snapshot, at 1280 and 375. |
| **Accessibility** | **PASS.** axe reported 0 violations on every page checked, at 1280 and 375, light and dark (details below). Tab order is band by band, then party by party. Every stop has a 3px `:focus-visible` ring. Each cell has a hidden heading and a "Related to" list from both ends of each line. The overlay is `aria-hidden`. |
| **Line geometry** | **PASS.** Across 7 resizes, 125% text and dark mode, every line endpoint sits on its cells' edges. There are no marker, path or polygon elements, so no arrowheads. |
| **Console and network** | **PASS.** 0 console errors or warnings, 0 dialogs and 0 requests other than file:, data: and blob:. |
| **Performance** | **PASS** on the generated 8 × 12 × 100 diagram (numbers below). |
| **Responsiveness** | **PASS** for the sample and the generated diagram: 0 px of page overflow at 375, 768 and 1280. The one exception is a long `kind` value (S1). |
| **Visual polish** | Good, and consistent with the rest of the app in light and dark. Small issues: N4, N5. |
| **Code review** (diff since d57fad2) | No correctness bugs that block shipping. Findings: N3, N6. |
| **Ponytail audit** | Lean: a 39-line geometry function, a 95-line renderer and one CSS block. It reuses `esc`, `badge`, `href`, `mark`, `rowsOf` and `closest`, and `partsOf()` removed duplication. No new dependencies. Small finding: N7. |
| **Packaging** | Still one self-contained file with a CSP (`default-src 'none'`, hashed script), no eval and no external URLs. The version still reads 1.2.0 and the demo is still the old one; tasks 5.1 to 5.3 cover both. |

### Security detail
- **Folder form:** band and sub-band names, box name and note, team-box note, line labels, `kind`, structure names, summary, Today text and the narrative body (which also contained a raw `<script>`).
- **Theme labels:** `structure`, `structures`, `role`, `roles`, `party` and `teams`.
- **Sheet form:** the Structure heading, `Kind:`, `Summary:`, Name and Note cells, band names, Label cells and Notes.
- **Routes walked:** the overview, every `#/d/` route (plain, with changes, and with changes and a persona), search, the role profile, the workstream page and the team page.

### Accessibility detail
- **axe pages:** the sample main diagram (plain, and with persona and changes), the Harbour account diagram, the overview, the role profile, search, the structure-org market diagram (persona and changes), the programme diagram and the wide diagram. All on the exported snapshot.

### Performance detail

| Measure | Normal CPU | 4× CPU throttle |
|---|---|---|
| Snapshot load | 177 ms | 663 ms |
| Route to diagram until lines are drawn | 88 ms | 313 ms |
| Re-measure after a resize | about 33 ms per frame | 32 to 83 ms |
| Longest task | 62 ms | 195 ms |

The generated diagram scrolls inside its own container and the page does not scroll. Its snapshot is 353 KB.

## Findings

### BLOCKER
None.

### SHOULD-FIX

**S1. A long `kind` value makes the page scroll sideways at 375 px.**
- **What's wrong:** `.tag` has `white-space: nowrap` (`src/styles.css`, the `.tag, .badge, .cue` rule).
- **Evidence:** in a snapshot at 375 px:
  - a 56-character kind gives 35 px of page overflow on `#/` and 12 px on `#/d/<id>`;
  - an 84-character kind gives 184 px and 161 px.
- **Why the tests miss it:** the author preview clips the overflow.
- **Why it matters:** it breaks "no horizontal page scrolling" in the small-screens requirement.
- **Fix:** let tags wrap (`white-space: normal; overflow-wrap: anywhere; max-width: 100%`), and add a 375 px snapshot test with a long kind.

**S2. A line to a parent band is written as text only in the first sub-band cell of its column.**
- **What's wrong:** `cells()` / `related()` in `src/viewer/structure.js`.
- **Evidence:** in the sample, Summit/Globex doesn't mention the (Partnership leadership, Globex) to (Account management, Globex) line. Only Harbour/Globex does.
- **Why it matters:** the spec asks that each cell expose the cells it is related to, and a parent-band cell is the union of its sub-band cells.
- **Fix:** list the line once under the parent band's heading, or in every sub-band cell of that column.

### NICE-TO-HAVE

- **N1. Stray space in the screen-reader cell heading.**
  - **What's wrong:** the name is read as "Acme Corp , Partnership leadership", because of the hidden span in `cells()`.
  - **Fix:** give the heading `aria-label="${party}, ${band}"`, or keep the comma outside the hidden span.
- **N2. Noisy follow-on errors.**
  - **What's wrong:** a missing `### Bands` adds about 10 band errors, and a duplicate structure/workstream id adds a type-mismatch error.
  - **Fix:** skip band-reference checks when a structure has no bands, and skip the type-mismatch message when the id is already reported as a duplicate.
- **N3. A line between a band and its own sub-band in the same column is accepted silently and not drawn,** and the cell then lists itself as related.
  - **Fix:** an error in `structureChecks()`.
- **N4. Long line labels overlap boxes on vertical lines,** and words split mid-word.
  - **Fix:** `overflow-wrap: normal` with `hyphens: auto`, a wider or offset pill on vertical lines, and a recommendation for short labels in the authoring guide.
- **N5. Line stroke contrast in light mode is about 3.0:1.** That is at the threshold, and the relationships are also given as text.
  - **Fix:** a darker token or `stroke-width: 2.5`.
- **N6. The sample breadcrumb repeats the name.**
  - **Fix:** rename the sample's main diagram (for example "Partnership structure") in both forms.
- **N7. `isObj` is defined twice,** in `load.js` and `validate.js`.
  - **Fix:** export it once and reuse it.
- **N8. Test coverage gaps:**
  - `xss-escaping.spec.js` doesn't visit `#/d/` routes, and the xss fixture has no structure payloads;
  - `labels-all.spec.js` doesn't rename `structure`.

## Triage of the known items
1. Stray space in the cell heading: **N1**.
2. Parent-band line written only in the first sub-band cell: **S2**.
3. Noisy follow-on errors: **N2**.
4. Sample breadcrumb repeats the name: **N6**.

## Overall: SHIP
No blockers. Fix S1 and S2 before the 1.3.0 release (task 5.2).
