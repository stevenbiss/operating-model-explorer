# Design: Party brands

## Context

See proposal.md for the motivation and the specs for the requirements. What the engine does today:
- **Party colour** comes from position. `partyColour` in `src/viewer/app.js` returns `palette[i % palette.length]`, where the palette is either the theme's or `DEFAULT_PALETTE`.
- **The theme** (`src/viewer/theme.js` `themeCss`) writes CSS custom properties for primary, accent, frame colours and fonts, plus `@font-face` rules for font files. The logo is one `<img>` in the header. `src/model/theme-check.js` checks theme contrast, URLs and missing assets.
- **Meaning colours** are already separate tokens in `src/styles.css`: `--om-new`, `--om-changed`, `--om-removed` and `--om-accent` ("Your lane"), plus the focus and error styles. Each has a light and a dark value.
- **Constraints carried over:** offline single file, a hash-based CSP (`img-src data: blob:`; `style-src 'unsafe-inline'`), no `eval` or `new Function`, everything escaped through `src/viewer/esc.js`, Ponytail minimal code, and `shared/html-deliverable`.

## Goals / Non-Goals

**Goals:**
- Party identity is decided once per model, in a single deterministic place, and every view reads the result.
- Brand colours never reduce readability, and never blur a meaning colour.
- Brand packs are data. Nothing in one can execute.

**Non-Goals:**
- Brand typography, lead-brand or co-brand layouts, house or partnership frames (see the proposal's non-goals).
- Pixel-perfect brand fidelity. Adapting colours for readability and distinguishability takes priority over the exact brand hex.

## Decisions

### D1. Stack: vanilla, no new dependencies
The colour maths is small, pure JavaScript in a new `src/model/colour.js`:
- hex to OKLab / OKLCH and back;
- WCAG contrast (already exists in `theme-check.js`, so it moves here);
- simulation of protanopia, deuteranopia and tritanopia, using the Machado 2009 matrices at full severity on linear RGB;
- ΔE in OKLab.

It's roughly 120 lines and easy to unit-test. React isn't justified.
**Alternative considered:** culori or chroma.js, at about 20–40 KB each. Rejected, because only these few functions are needed.

### D2. Loading brand packs
- **Reading packs:** folder, zip and sheet-folder loading already give `[{ path, data }]`. `loadModel` treats `brands/<id>/brand.md` as a brand pack, parsed with the existing `parseFile`, and never as an element. Mark files are read from the same `brands/<id>/` folder.
- **Validation:** the validator checks packs against a new `schema/brand.schema.json` (same subset interpreter): required fields, hex colours, mark path inside the pack, and id matching the folder. Unknown `fonts` gives a warning.
- **Resolving references:** `party.brand` (folder format), or the sheet's `Brand` column mapped to `brand` by `sheetToDocs`, resolves through the existing `closest()` "Did you mean …?" check.
- **Output:** `buildModel` adds `model.brands` (`{ id, name, version, colours, marks }`, with usage notes dropped) and `party.brand` (an id).

### D3. Colour resolution: one function, run once per model
`resolvePartyColours(parties, brands, meaning)` in `src/model/colour.js` returns, for each party in order:
```
  { base, dark, band, bandText, tint, darkBand, darkBandText, darkTint, source, adjusted? }
```
Algorithm, for each scheme (light, then dark):
1. **Candidate colour.**
   - Light scheme: the pack's primary.
   - Dark scheme: the pack's `dark` if given, otherwise primary with OKLCH lightness clamped to 0.62–0.78.
   - Unbranded party: the next neutral from a fixed, well-spaced neutral set.
2. **Accept** the candidate if, against every colour already assigned and every meaning colour for that scheme, the OKLab ΔE is at least `T` (starting at 0.10, tuned in task 1.3) in normal vision **and** under each of the three simulations.
3. **Otherwise try the secondary** (light scheme only), then **shift** the OKLCH lightness, keeping hue and chroma. Failing that, shift the hue in ±20° steps up to ±120° (D3a: lightness before hue). The first candidate that passes wins.
4. **Record** `adjusted: { from, reason: 'party' | '<meaning>' , other }` so the report can say which party or meaning was too close.
5. **Derive** from the accepted colour:
   - `band` is the colour itself;
   - `bandText` is whichever of the near-black or near-white ink has contrast ≥ 4.5;
   - `tint` is the colour mixed into the surface at 10%, and its text is the frame text colour, checked at ≥ 4.5.

   If no ink reaches 4.5 on `band`, lightness is shifted until one does.

**Tuned values (task 1.3):**
- `T = 0.06` in OKLab. That is about 3× the OKLab just-noticeable difference. Measured pairs (fixture colours, arbitrary): `#d6281e`/`#c92d25` are 0.025 apart (0.015 at their closest under simulation; must clash), `#b8261c` is 0.010 from Removed `#b42318` (must clash), `#d6281e` is 0.072 from Removed and 0.076 from "Your lane" (must pass), and navy `#0b1f4d` is 0.396 from green `#3aaa35` (must pass). So T has to fall between 0.025 and 0.072.
- **Party vs party** uses the smallest ΔE in normal vision and under each of the three simulations. **Party vs meaning** uses ΔE in normal vision only. This departs from step 2: under simulation the four warm and green meaning colours collapse onto one axis, so nearly every warm or green brand (including `#d6281e` against "Your lane" at 0.010 for deuteranopia) would be shifted. Meaning is never shown by colour alone, because badges and "Your lane" carry text.
- The meaning colours are accent, new, changed and removed. The focus ring (`--om-link`) is included too, in light and dark. They're mirrored from `styles.css` in `ENGINE` in `colour.js`, and a unit test keeps the two in step.
- **Steps:** secondary colour (light scheme only), then OKLCH lightness −/+0.06 up to ±0.30 (darker first), then hue ±20° up to ±120° (D3a). If nothing passes, the candidate with the largest margin is used and an "unresolved" warning names both parties (or the party and the meaning). For example, the light yellow `#ffd23f` derives `#deb200` for dark mode, which is too close to the dark "Changed" amber, so it is drawn `#f2c531`: still yellow, and darker than the author's colour. Before any check, each candidate is shifted in lightness by 0.01 steps until white or `#111111` ink reaches 4.5:1. If that changed a brand's colour, a "contrast" warning is shown.
- **Dark:** the pack's `dark` is used only when the light scheme used the primary. Otherwise the dark colour is derived from the light result (clamped to L 0.62–0.78), so a party that fell back to its secondary colour stays on that hue.
- **Tint:** 10% of the band mixed into the surface (sRGB), with the frame text on it.
- **Neutrals:** `#3e5c71`, `#c0c9a5`, `#635737`, `#bea0ba`, `#a2cfc5`, `#a8ae99`. The first three stay T apart in both schemes. Later neutrals are shifted if needed, and unbranded parties never get a colour warning.

This is deterministic: the same model always gives the same colours. It's pure, so it's unit-tested without a browser. It runs in `buildModel`, and its result is embedded in the snapshot, so the viewer never recomputes it.

### D3a. Fix-round decisions (after verify and QA round 1)
- Adjustments shift **lightness before hue** in light and dark, so brands stay recognisable. Hue shifts are used only when lightness alone can't clear a clash.
- Clashes that no candidate resolves are reported as **unresolved**, naming both parties.
- Warnings quote the author's own colour, and mention the derived value only as an explanation.
- Fixture colours are arbitrary (e.g. `#d6281e` and `#c92d25`), never real brands' colours.

### D4. Applying colours in the viewer
`themeCss` becomes `partyCss`. For each party index, it emits custom properties on `[data-party="<n>"]`: `--p-band`, `--p-band-text` and `--p-tint`, with a `@media (prefers-color-scheme: dark)` block for the dark values. Views set `data-party` on cards, bands, lanes, chips, legend items and page headers. The swimlane SVG uses the same properties through `style` attributes. `partyColour(i)` and the palette are removed.

### D5. Marks, and SVG safety
- **Brand marks** are embedded as `<img src="data:image/svg+xml;base64,…">`. A browser never runs scripts in an SVG shown through `<img>`, and the CSP `img-src data:` already allows it.
- **Marks are never inlined as SVG markup.** That rule is what keeps a hostile mark harmless.
- **Size:** a mark over 200 KB gives a warning, since marks should be tiny.
- **Unbranded parties** get their initial mark as a styled `<span>` of escaped text (up to two letters) on the party's band colour. There's no generated SVG.

### D6. Header lockup
The header is: model name, then a row of marks at a fixed height (28px), in party order, each `alt` set to its party name, with an `aria-label` on the group. Below 480px the marks row wraps under the name. With no branded parties, no lockup is shown, and the name stands alone as in v1.

### D7. Retiring theme keys
- **Warnings:** `checkTheme` warns once per retired key (`colors`, `fonts`, `logo`, `palette`) in `theme.md` or in the sheet's Theme lines. Each warning says what replaces it.
- **Cleanup:** `themeCss` loses the frame colours, `@font-face` and the palette. Labels are unchanged.
- **Removed checks:** the theme contrast check (the removed "Accessible theme colours" requirement) is deleted. Contrast now lives in D3.
- **Retired fonts:** URL font rejection for themes becomes a retired-key warning, and no font is ever fetched or embedded.

### D8. Snapshot contents
`toSnapshot` embeds:
- the resolved party colours from D3;
- only the marks of brands that are referenced;
- `brandsUsed: [{ party, brand, version }]`.

Usage notes and unreferenced packs are never embedded. A test searches exported snapshots for pack note text and for unused pack names.

### D9. Capture sheet
- **Parties table:** gains an optional `Brand` column, holding a pack id and matched with the usual forgiving name matching.
- **Theme section:** keeps only `Label …` lines, and every other key gives a retired-line warning.
- **Brand packs:** read only when the sheet is loaded as a folder or zip. A single-file load with Brand values reports each brand missing, with a hint to load the folder.
- **Format:** stays 1, because old engines only warn about an unknown `Brand` column.

### D10. Samples and fixtures (fictional only)
- `examples/acme-sample/brands/{acme,globex}/` and `examples/acme-capture-sheet/brands/{acme,globex}/`: simple geometric SVG marks, fictional colours, `version: 2026.1`. Both sample themes are reduced to labels, and the sheet parity test still holds.
- `tests/skill-packs/brand-library/`: `acme`, `globex` and `initech`, the last one for the "unused" and "not in library" tests.
- Fixtures cover a light yellow brand, two similar reds, a colour close to "Removed", a missing mark, a bad colour, an id/folder mismatch, a hostile SVG with script, an unbranded party and retired theme keys.
- The private-names guard runs over all of them.

### D11. Authoring skill
SKILL.md gains a "Brands" step: when the colleague names a library path and brands, copy the pack folders unchanged, fill in the Brand column, and list the id and version under Sources. If a brand is missing, ask. `docs/interview-guide.md` gets a portable "Brands" section. The skill trials add two scenarios, using the fictional library.

### D12. Versions
The release is 1.2.0. The retired theme keys change how existing models look, so it's a minor version with a clear note. The capture sheet `Format` stays 1.

## Risks / Trade-offs

- **[Risk] A threshold that's too strict shifts legitimate brand colours unnecessarily; one that's too loose lets colours be confused** → tune `T` on a small set of real-world-like colour pairs in task 1.3, and always tell the author when a colour was adjusted.
- **[Risk] Colour-blindness simulation is an approximation** → use the published Machado matrices, and never rely on colour alone: names and marks are always shown.
- **[Risk] A hostile SVG mark** → it's only ever rendered through `<img>`, and there's a test with a script-bearing SVG. QA must try to break this.
- **[Trade-off] Brand colours may be shown adjusted, not exact** → this is intentional. Readability and meaning take priority, and the report explains every adjustment.
- **[Trade-off] Retiring theme colours is a visible change for existing models** → the warnings say exactly what's ignored. The release notes flag it, and the Acme demo shows the new pattern.
- **[Risk] A model folder copied without its `brands/`** → the parties fall back to neutral colours, and the unknown brand is reported with guidance.

## Migration Plan

Additive, apart from the retired theme keys:
1. Existing models load. Retired keys warn, and parties without brands get neutral colours.
2. Authors add `brands/` copies and a `Brand` value per party, then re-export.
3. Snapshots exported before this change are unaffected.

Rollback means shipping the 1.1.0 engine. When archiving, update the theming main spec's Purpose, which still mentions colours and fonts, to match the labels-only scope.

## Open Questions

- The exact distinguishability threshold `T` and the hue-shift steps. These are tuned against fixtures in task 1.3, and don't change the specs.
