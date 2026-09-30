# Operating Model Explorer vX.Y.Z

<!--
Release notes template. Copy it for each release, replace the placeholders, and delete this comment.
Cut releases from main after `npm test` passes, so the committed skill folder matches the attached files:
  npm run build
  gh release create vX.Y.Z dist/operating-model-author.zip dist/operating-model-explorer.html dist/acme-sample.html --title "vX.Y.Z" --notes-file <these notes>
Paste the checksums from dist/SHA256SUMS (the build writes it; export dist/acme-sample.html first, then build again).
-->

<!-- One or two sentences on what's new in this release. -->

## Which file do I need?

| File | Use it if |
|---|---|
| `operating-model-author.zip` | You want an AI assistant to help you write a model from your decks, notes and RACI tables. It is the skill, with the matching engine and validator inside. **Start here.** |
| `operating-model-explorer.html` | You write the model yourself (a capture sheet or a content folder) and just need the engine. Open it in Chrome or Edge. |
| `acme-sample.html` | You want to see what viewers get: a snapshot of the fictional Acme + Globex sample. |

The engine inside the zip is the same file as `operating-model-explorer.html` (same checksum).

## Install the skill

**Claude Code:** in any session, run

```text
/plugin marketplace add stevenbiss/operating-model-explorer
/plugin install operating-model-author@operating-model-explorer
```

Updates arrive through the marketplace. To install without the marketplace, unzip `operating-model-author.zip` into `~/.claude/skills/` (or a project's `.claude/skills/`).

**claude.ai:** download `operating-model-author.zip`, then go to Settings → Capabilities → Skills and upload it. Upload the new zip again for each release.

Then ask for help in your own words, for example: "Turn these workshop notes into an operating model."

## Versions

- Engine, validator and skill: X.Y.Z
- Capture sheet format: 1 <!-- Say so clearly if this changed: older engines can't read the new format. -->

## Changes

- <!-- Changes, one per line, for authors first. -->

## Models look different from 1.2.0

<!-- Standard note: keep it in every release from 1.2.0 on, while authors may still have models with theme colours. -->

Each party is now shown in its own brand colour and mark, from a **brand pack**, inside the engine's neutral frame. Theme colours, fonts, the theme logo and the palette are **retired**:

- A model that still sets them (`colors`, `fonts`, `logo` or `palette` in `theme.md`, or colour, font, palette and logo lines in a capture sheet's Theme section) still loads and exports, with a warning for each setting saying it is ignored. It is shown in the neutral frame, and parties without a brand get neutral colours and their initials.
- To show each party's colour and mark, copy its brand pack from your brand library into the model's `brands/` folder, unchanged, and name it in the party: `brand: <id>` in a party file, or the `Brand` column of the capture sheet's Parties table. Then load the folder and export again.
- Theme labels (your own words for terms) work as before.
- Snapshots exported with an earlier version are not affected. The capture sheet format is still 1.

## Checksums (SHA-256)

```text
<!-- contents of dist/SHA256SUMS -->
```
