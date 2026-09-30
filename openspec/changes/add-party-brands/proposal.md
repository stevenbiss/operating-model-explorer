# Proposal: Party brands

## Why

Operating models are mostly about partnerships: two or more organisations working together. Today the engine has one theme per model: one colour set, one font pair and one logo. Party colours come from a palette by **position**, so a party's colour depends on where it sits in the list, not on its brand. There's no way to show each partner's own identity, or to reuse "the" correct colours and marks of a recurring partner across models, so every model re-types them and they drift.

We want the engine to show **whose part is whose** at a glance: each party's colour and mark wherever that party appears, inside a calm neutral frame that doesn't favour any one partner (option C, neutral host). Brand details should come from a curated internal library and be **copied into each model**, so a model stays self-contained, offline and reproducible.

## Who uses it and how it's shared

- **Authors (colleagues):** copy the brand packs they need from the organisation's internal brand library into the model folder, or have the authoring skill do it, and name each party's brand in the capture sheet. They load the folder in the engine and export as today.
- **Viewers (colleagues and clients):** receive the exported snapshot HTML as before, by email, Teams or file share. They see each party's colour and mark in context. Nothing changes about how the file is opened or shared.
- **Brand library curators (internal):** maintain the brand packs, with versions, in a private internal location. The engine never reads the library directly.

## What Changes

- **Brand packs.** A new format: `brands/<id>/brand.md`, holding the id, name, `version`, `updated` date, a primary colour, a secondary colour, an optional dark-mode colour and free-text usage notes. It comes with a required square **mark** (SVG) and an optional mono mark and full logo. There are **no fonts**.
- **Brands travel with the model.** A model folder carries **copies** of the packs it uses under `brands/`. It stays self-contained and version-pinned, and updating a brand is a deliberate re-copy followed by a re-export. The engine reads only the model's own folder, never the library.
- **Parties name their brand.** The capture sheet gets a `Brand` column in the Parties table, and folder content gets a `brand:` field on party files. Loading a single capture-sheet file can't see `brands/`, so it warns and suggests loading the folder, as it already does for logos.
- **Three layers of colour:**
  1. **Host:** the engine's own neutral frame, always (option H1).
  2. **Party:** each party's colour and mark, only where that party appears: party cards, swimlane bands, lane tints, owner chips, the legend and the header lockup.
  3. **Meaning:** engine-owned colours ("Your lane", New/Changed/Removed badges, cross-party handoffs, errors, focus rings) that brands can never override.
- **Colour adaptation and checks.** The engine derives readable lane tints and text colours from brand colours, plus dark-mode variants where a pack gives none. It checks that party colours can be told apart, including for common colour-blindness, and that no party colour can be mistaken for a meaning colour. On a clash it falls back to the secondary colour or shifts the shade, and warns the author.
- **A party without a brand** gets a neutral engine colour and a generated initial mark.
- **Header lockup.** The header shows the partnership (model) name with the party marks side by side at equal size.
- **The theme becomes terminology only. BREAKING (visual):** theme frame colours, fonts, the theme logo and the palette are **retired**. Content that still sets them loads with a warning saying they're ignored. `labels` stays unchanged. The capture sheet's Theme section is reduced to labels, and no format version bump is needed, because retired keys only warn.
- **Snapshot metadata.** An exported snapshot records which brand id and version each party used. This is metadata only: usage notes are never included, and nothing about it is visible to viewers.
- **Authoring skill.** A new "use brands from the library" step. Given a library path from the colleague, it copies the chosen packs into the model folder and fills in the Brand column.
- **Samples.** The public repo ships only **fictional** brand packs (Acme, Globex). The Acme sample moves to them, and in doing so loses its custom navy frame.

## Capabilities

### New Capabilities
- `party-brands`: the brand pack format, loading packs from `brands/`, party-to-brand references, colour adaptation (tints, text colour, dark variants), the distinguishability and meaning-colour checks, the fallback for parties with no brand, the header lockup, and the snapshot's brand metadata.

### Modified Capabilities
- `theming`: frame colours, fonts, the theme logo and the palette are retired (REMOVED, with migration notes). Labels are kept, and the default theme is the neutral host. The requirements covering custom colours, the logo, remote fonts and theme contrast change or are removed.
- `content-schema`: a `brand:` field on party files, a `brands/` folder in the content layout, and validation of brand packs (required fields, a missing mark, bad colours).
- `capture-sheet`: a `Brand` column in the Parties table, and a Theme section reduced to labels.
- `explorer-views`: party cards, swimlane bands and lane tints, owner chips and the legend use brand identity, and the header shows the lockup.
- `authoring-skill`: the brand library workflow (copying packs into the model folder, filling in the Brand column, the output-location rules unchanged).

## Non-goals

- Option A (lead brand) and option B (co-brand) layouts, host or house themes (H2), and partnership identities (H3).
- Brand fonts, or any typography that comes from a brand.
- Building a brand pack from a brand-guidelines PDF (a natural later job for the skill).
- Detecting that the library has a newer version of a brand. The engine can't see the library.
- Hosting, syncing or managing the organisation's brand library itself.
- Storing any real brand assets (logos, colours) in this public repo, including in examples or tests.

## Impact

- **Engine:** party identity rendering in `src/viewer/` (cards, swimlane, legend, header); colour adaptation and clash checks, extending `src/model/theme-check.js`; brand-pack loading and validation in `src/model/`; theme handling reduced to labels.
- **Content:** a new `brands/` folder convention; the fictional `examples/acme-sample/brands/` and `examples/acme-capture-sheet/brands/`; the format spec, content reference and authoring guide updated.
- **Skill:** a new workflow step in SKILL.md and the interview guide; the bundled references are regenerated.
- **Compatibility:** existing models still load. Their custom frame colours and fonts are ignored with a warning, and parties without brands get neutral colours. Snapshots exported earlier are unaffected. The capture-sheet `Format` stays at 1.
- **Release:** a minor version, 1.2.0, because the retired theme keys change how existing models look.
