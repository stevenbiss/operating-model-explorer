# Brand packs

This page is for the people who keep a **brand library**: the internal folder of brand packs that authors copy into their operating models. Authors only need the [authoring guide](authoring-guide.md#brands-optional) or the [capture sheet format](capture-sheet.md#brand-packs).

A brand pack gives one organisation's colour and mark to the Operating Model Explorer. Each party in a model can name a pack, and the engine then shows that party's colour and mark wherever the party appears, inside the engine's own neutral frame.

## How packs travel

- The library is a folder with one folder per pack, named by the pack's id: `acme/`, `globex/`.
- Authors **copy the whole pack folder** into the `brands/` folder of their model, next to the capture sheet or `model.md`: `my-model/brands/acme/`. They never edit the copy.
- The engine reads only the model's own folder, never the library. A model keeps the version of each pack it was built with, and works offline.
- When a brand changes, publish a new version of the pack in the library. Authors take it up by copying the pack again and exporting a new snapshot. The engine can't tell that the library has a newer version.
- An exported snapshot records the id and version of each pack a party used. It never includes the usage notes, or packs that no party uses.

## What's in a pack

```text
acme/
  brand.md          required: the header below, then usage notes
  mark.svg          required: the square mark
  mark-mono.svg     optional: a one-colour mark
  logo.svg          optional: the full logo
```

`brand.md` starts with a header between two `---` lines, then free-text usage notes:

```markdown
---
id: acme
name: Acme Corp
version: "2026.1"
updated: 2026-01-15
colours:
  primary: "#0b5cad"
  secondary: "#5aa9e6"
  dark: "#6fa3e8"
marks:
  mark: mark.svg
---
Show the mark at 20px or larger. Keep clear space of a quarter of its width around it.
```

| Field | Required | What it holds |
|---|---|---|
| `id` | Yes | The pack's id, the same as its folder name: lower-case letters and numbers joined by hyphens, e.g. `acme`. Authors write this id in the model. Never change it: models that use the pack would stop finding it. |
| `name` | Yes | The brand's name. |
| `version` | Yes | The pack's version in the library, e.g. `"2026.1"`. Put quotes around it, so `2026.10` keeps its last 0. Raise it every time anything in the pack changes. |
| `updated` | Yes | The date the pack last changed, as `YYYY-MM-DD`. |
| `colours.primary` | Yes | The main brand colour, as a quoted hex value such as `"#0b5cad"`. |
| `colours.secondary` | No | A second brand colour, used when the primary is too close to another party's. Choose one with a clearly different hue from the primary. |
| `colours.dark` | No | The primary colour for dark mode. Left out, the engine derives one. |
| `marks.mark` | Yes | The square mark, a file in the pack's folder, e.g. `mark.svg`. |
| `marks.mono` | No | A one-colour mark. It is checked, but this version of the engine doesn't show it. |
| `marks.full` | No | The full logo. It is checked, but this version of the engine doesn't show it. |

The full field list is also in the [content reference](content-reference.md#brand).

### Marks

- **SVG, square.** Use a square `viewBox` (e.g. `0 0 64 64`). The mark is shown small, next to the party's name and in the header, so a simple symbol works better than a wordmark.
- **Files in the pack's folder.** A web address or a path outside the pack (`../`, `/`) is an error, because snapshots must work offline.
- **Small.** Keep each mark under 200 KB; a larger one gets a warning, because it is embedded in every snapshot. Convert text to outlines and leave out embedded images.
- **Plain drawings only.** The engine shows marks as images, so scripts, links and animation in an SVG never run. Leave them out.
- **Readable on its own.** The mark sits on the page background in light and dark mode, and on the party's colour, so it needs its own background shape or enough contrast on both.

### No fonts

A pack has no fonts. The engine always uses its own fonts, so every model reads the same. A `fonts` field is ignored, with a warning.

### Usage notes

The text after the header is for authors reading the pack: where the mark may be used, clear space, colours never to pair with it. The engine never shows it, and it is never included in a snapshot, so it can hold internal guidance.

## What the engine may change, and why

Brand colours are shown as given where possible. The engine adjusts a colour only to keep the model readable and honest, and it tells the author each time, as a warning in the validation report. The author can accept it, or ask for a pack with a better secondary or dark colour.

| Adjustment | Why |
|---|---|
| **Lighter or darker shade, so text is readable.** Text on a party's colour must reach the WCAG AA contrast of 4.5:1 with white or near-black text. | Everyone can read the party's name on its band, whatever the brand colour. |
| **The secondary colour, then a shifted shade, when two parties look alike.** Parties are compared as seen normally and with common colour-blindness (protanopia, deuteranopia and tritanopia). The later party in the model changes. | Viewers must be able to tell the parties apart. The names and marks are always shown too. |
| **A shifted shade, when a brand looks like a colour with a meaning.** The engine's own colours for "Your lane", the New, Changed and Removed badges, cross-party handoffs, errors and focus rings always stay the engine's. | A party's colour must not be mistaken for "Removed" or "Your lane". |
| **A dark-mode shade.** Without `colours.dark`, the engine derives one from the primary colour. | The colour stays readable on a dark page. |

A shifted shade is made lighter or darker first, and the hue changes only when that isn't enough, so the brand stays recognisable. When no shade is clearly different, the report says the clash is unresolved and names both parties. Warnings always quote the pack's own colour.

The result is the same every time for the same model. To avoid adjustments: give a primary colour that is not close to a common status red, green or amber, a secondary with a clearly different hue, and a `dark` colour for dark mode.

## Checks the engine makes

When a model is loaded, each pack it holds is checked. Errors stop the export until they are fixed:

- a missing required field, or a colour that isn't a hex value (error);
- an `id` that doesn't match the pack's folder name (error);
- a `mark` file that isn't in the pack's folder (error), or a missing `mono` or `full` file (warning);
- a `fonts` field, a mark over 200 KB, or a mark that doesn't look like SVG (it doesn't start with `<svg` or `<?xml`) (warning).

To check a pack before publishing it, put it in a small model that uses it and load that model in the engine, or run `npm run validate -- <model folder>` in the engine's repository.
