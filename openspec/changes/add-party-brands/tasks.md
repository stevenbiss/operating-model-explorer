# Tasks

## 1. Build

- [x] 1.1 Add `schema/brand.schema.json` (id, name, version, updated, colours.primary/secondary/dark as hex, marks.mark required, mono and full optional). Load `brands/<id>/brand.md` as brand packs, not elements (D2). Validate required fields, hex colours, mark inside the pack, id matching the folder, a `fonts` warning and a warning for marks over 200 KB. Verify with unit tests for each message
- [x] 1.2 Resolve party brand references: `brand:` on party files and the sheet Parties `Brand` column (D2, D9), with "Did you mean". Report each missing brand on a single-file sheet load with the load-the-folder hint. Verify with unit tests
- [x] 1.3 Implement `src/model/colour.js` (D1, D3): OKLab/OKLCH, contrast (moved from theme-check), Machado CVD simulation, and `resolvePartyColours` with the secondary fallback, hue then lightness shifts, meaning-colour protection, derived band, text and tint for light and dark, and adjustment records turned into report warnings. Tune threshold `T` and the shift steps against fixture colour pairs and record the values in design.md. Verify with unit tests covering light yellow, two similar reds, distinct colours, closeness to Removed, AA on every derived pair and determinism
- [x] 1.4 Viewer (D4, D5): replace `partyColour` and the palette with `data-party` plus party CSS for light and dark. Show the colour, mark and name on party cards, swimlane bands and lane tints, owner chips, the legend, and party and role pages. Render marks only as `<img>` data URIs. Unbranded parties get an initials span. Verify manually at 1280 and 375, light and dark
- [x] 1.5 Header lockup (D6): the model name plus equal-height marks in party order with alt text, wrapping below 480px, and no lockup when no party is branded. Verify at 1280 and 375
- [x] 1.6 Retire theme keys (D7): warnings for `colors`, `fonts`, `logo` and `palette` in `theme.md` and in sheet Theme lines. Strip `themeCss` down to labels, and remove the theme contrast check and the font-face and palette code. Verify with unit tests, and check that labels still apply
- [x] 1.7 Snapshot (D8): embed the resolved colours, referenced marks only, and `brandsUsed` (party, brand, version). Leave out usage notes and unused packs. Verify by exporting a fixture and searching the file
- [x] 1.8 Fictional samples and fixtures (D10): Acme and Globex brand packs in `examples/acme-sample/brands/` and `examples/acme-capture-sheet/brands/`, both sample themes reduced to labels, Brand fields and columns added, the parity test still passing, and the brand fixtures under `tests/fixtures/` (including a hostile SVG). Verify that both samples load with 0 errors and 0 warnings and that the private-names guard passes
- [x] 1.9 Docs: update `docs/capture-sheet.md` (Brand column, Theme labels only), `docs/authoring-guide.md` and the generated content reference (brand pack format and the `brands/` folder), and add `docs/brand-packs.md` for library curators (format, versioning, marks, "copy into the model"). Verify the examples in the docs parse
- [x] 1.10 Authoring skill (D11): add a "Brands" step to SKILL.md (copy packs unchanged from the colleague's library path, fill in the Brand column, list id and version in Sources, ask if a brand is missing), a portable "Brands" section in `docs/interview-guide.md`, `tests/skill-packs/brand-library/` (acme, globex, initech) and trial checklist entries in `tests/skill-packs/README.md`. Rebuild the skill folder. Verify with `npm run build` and a skill-folder-current test
- [x] 1.11 README (brands for authors, the brand library, release notes wording for the retired theme keys) and `docs/release-notes-template.md` (a note on the visual change). Verify the documented commands run as written

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`. Node tests cover the model and colour logic. Skill trials follow `tests/skill-packs/README.md`, and their results go in `reports/skill-trials.md`.

### party-brands
- [ ] 2.1 Valid pack
- [ ] 2.2 Missing mark
- [ ] 2.3 Invalid colour
- [ ] 2.4 Id doesn't match its folder
- [ ] 2.5 Unknown brand
- [ ] 2.6 Unused pack left out
- [ ] 2.7 Sheet loaded without its brands
- [ ] 2.8 Swimlane bands
- [ ] 2.9 Party card
- [ ] 2.10 Light brand colour
- [ ] 2.11 Dark mode (party-brands)
- [ ] 2.12 Two similar reds
- [ ] 2.13 Distinct colours
- [ ] 2.14 Brand close to "Removed"
- [ ] 2.15 Unbranded party
- [ ] 2.16 Equal marks
- [ ] 2.17 Lockup on a phone
- [ ] 2.18 Versions recorded, notes excluded
- [ ] 2.19 Hostile SVG mark

### theming
- [ ] 2.20 Labels applied
- [ ] 2.21 Custom colours applied (now: ignored with a warning)
- [ ] 2.22 Logo shown (now: ignored; lockup shown)
- [ ] 2.23 No theme file (existing test still passes)
- [ ] 2.24 Dark mode (theming; existing test still passes)
- [ ] 2.25 Remote font rejected (now: retired-key warning, nothing fetched)
- [ ] 2.26 Remote mark rejected
- [ ] 2.27 Missing asset (narrative image)

### content-schema
- [ ] 2.28 Minimal valid model (existing test still passes)
- [ ] 2.29 Missing model file (existing test still passes)
- [ ] 2.30 Brand packs are not elements

### capture-sheet
- [ ] 2.31 Theme from the sheet (labels only)
- [ ] 2.32 Retired theme line
- [ ] 2.33 Brands from the sheet's folder

### authoring-skill
- [ ] 2.34 Packs copied, not altered (skill trial)
- [ ] 2.35 Brand not in the library (skill trial)

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement across the five delta specs, plus a regression pass over the existing main specs, against the engine and exported snapshots, with evidence. It reviews the skill-trial report and returns VERIFIED. The report is saved to `openspec/changes/add-party-brands/reports/html-verifier.md`
- [ ] 3.2 Confirm there are no real brand assets or real client or partner content anywhere in the repo (private-names guard plus a repo search, including `brands/` folders and the brand library fixture); verify zero matches

## 4. QA

- [ ] 4.1 html-qa final gate: security first (hostile brand packs: script-bearing SVG marks, markup in brand names, versions and notes, path traversal in mark paths), then colour accessibility (AA on every derived pair in light and dark, distinguishability under CVD simulation), accessibility (axe), console and network, performance (the colour resolution cost on a large model), responsiveness, visual polish, `/code-review` and a Ponytail audit. It returns SHIP. The report is saved to `openspec/changes/add-party-brands/reports/html-qa.md`

## 5. Package

- [ ] 5.1 Build, export the Acme demo from its capture-sheet folder (with brands), rebuild the checksums, run the full tests, commit and push
- [ ] 5.2 Bump the version to 1.2.0 across the bundle, tag it, and publish the release with `gh` (skill zip, engine, demo; notes from the template flagging the retired theme keys; checksums). Verify by downloading and checking the checksums
- [ ] 5.3 dist/operating-model-explorer.html built, self-contained, and README updated
