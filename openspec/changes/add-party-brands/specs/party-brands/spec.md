# Spec Delta

## Purpose

Gives each party in an operating model its own brand identity (a colour and a mark), shown wherever that party appears, inside the engine's neutral frame. Brand packs are copied into each model from an internal library, so a model stays self-contained, offline and version-pinned.

## ADDED Requirements

### Requirement: Brand pack format
A brand pack SHALL be a folder `brands/<id>/` inside the model folder, containing `brand.md` and image files. The `brand.md` header SHALL hold:
- `id`, matching the folder name;
- `name`;
- `version` and `updated` (a date);
- `colours.primary`, and optionally `colours.secondary` and `colours.dark`, each a hex colour;
- `marks.mark`: a required square SVG in the pack folder;
- optionally `marks.mono` and `marks.full`.

The Markdown body holds usage notes. A pack SHALL NOT define fonts. A `fonts` field SHALL produce a warning saying brand fonts are not used.

#### Scenario: Valid pack
- **WHEN** a model folder contains `brands/globex/` with a complete `brand.md` and `mark.svg`, and a party references `globex`
- **THEN** the report shows no brand messages, and the party is shown with Globex's colour and mark

#### Scenario: Missing mark
- **WHEN** a brand pack's `marks.mark` names a file that isn't in its folder
- **THEN** the report shows an error naming the pack and the missing file, and export is disabled

#### Scenario: Invalid colour
- **WHEN** a brand pack sets `colours.primary: red`
- **THEN** the report shows an error naming the pack and field, and explaining that colours must be hex values such as `#0b1f4d`

#### Scenario: Id doesn't match its folder
- **WHEN** `brands/globex/brand.md` declares `id: globex-corp`
- **THEN** the report shows an error naming the folder and the id, and asking for them to match

### Requirement: Parties reference a brand
A party SHALL be able to name a brand pack by id: with a `brand:` field in a party file, or a `Brand` column in the capture sheet's Parties table. An unknown brand id SHALL be an error, with a "Did you mean …?" suggestion when a close pack id exists. A pack that no party references SHALL NOT be included in the snapshot.

#### Scenario: Unknown brand
- **WHEN** a party names brand `globx` and only `globex` exists
- **THEN** the report shows an error naming the party and "Did you mean globex?"

#### Scenario: Unused pack left out
- **WHEN** the model folder contains `brands/initech/`, but no party references it
- **THEN** the exported snapshot contains nothing from that pack

#### Scenario: Sheet loaded without its brands
- **WHEN** a capture sheet whose Parties table names brands is loaded as a single file, without its folder
- **THEN** the report shows an error for each missing brand, explaining that brand packs are read from the `brands/` folder next to the sheet and suggesting loading the folder instead

### Requirement: Party identity where the party appears
Wherever a party appears, the viewer SHALL show that party's colour and mark together with its name:
- party cards on the overview,
- party bands and lane tints in the swimlane,
- owner chips in step details,
- the swimlane legend,
- party and role pages.

Colour SHALL never be the only cue: the party's name or mark SHALL always accompany it. Everything outside a party's own elements SHALL use the neutral frame.

#### Scenario: Swimlane bands
- **WHEN** a process with lanes for Acme and Globex roles is opened
- **THEN** the Acme band shows Acme's mark, name and colour, the Globex band shows Globex's, and the page frame (header, navigation, buttons) uses neither brand colour

#### Scenario: Party card
- **WHEN** the overview of a model with branded parties is opened
- **THEN** each party card shows that party's mark and colour next to its name

### Requirement: Readable brand colours
The engine SHALL derive what it draws from each brand colour: lane tints, band colours, and the text colour used on them. All text on a brand-coloured surface SHALL meet WCAG AA contrast (4.5:1), whatever the brand colour. In dark mode, the engine SHALL use the pack's `colours.dark` when it is given, and otherwise derive a variant, still meeting AA.

#### Scenario: Light brand colour
- **WHEN** a party's primary colour is `#ffd400` (a light yellow)
- **THEN** text on that party's band is dark, and its contrast is at least 4.5:1

#### Scenario: Dark mode
- **WHEN** a branded model is viewed with the system preferring dark mode
- **THEN** each party's band and tint are drawn in dark-mode variants, and every text/background pair on them is at least 4.5:1

### Requirement: Party colours can be told apart
The engine SHALL check that every pair of party colours in a model is clearly different, including under simulated common colour-vision deficiencies (protanopia, deuteranopia, tritanopia). When two parties' colours are too close, the later party SHALL use its secondary colour if that resolves the clash, and otherwise a shifted shade. The report SHALL show a warning naming both parties and saying which colour was changed. Export SHALL remain enabled.

#### Scenario: Two similar reds
- **WHEN** two parties' primary colours are `#e10600` and `#d40511`, and the second pack has a blue secondary colour
- **THEN** the second party is drawn in its secondary colour, and the report warns that its primary was too close to the first party's

#### Scenario: Distinct colours
- **WHEN** party colours are a dark navy and a green
- **THEN** both are used as given, and no warning is shown

### Requirement: Meaning colours are protected
The colours that carry meaning SHALL always come from the engine, never from a brand:
- "Your lane" and "Your step" highlighting,
- the New, Changed and Removed badges,
- the cross-party handoff style,
- errors and notices,
- focus rings.

When a party colour is too close to one of them, the engine SHALL shift that party's shade and show a warning naming the party and the meaning it would have been confused with.

#### Scenario: Brand close to "Removed"
- **WHEN** a party's primary colour is close to the engine's "Removed" badge colour
- **THEN** that party is drawn in a shifted shade, the badges keep the engine's colour, and the report warns that the party's colour was adjusted so it can't be mistaken for "Removed"

### Requirement: Parties without a brand
A party with no brand SHALL get a neutral engine colour, distinct from the other parties, and a generated mark showing its initials (up to two letters) on that colour.

#### Scenario: Unbranded party
- **WHEN** a model has a party "Client Team" with no brand
- **THEN** its card and band show a "CT" mark in a neutral colour, and no brand message is shown

### Requirement: Header lockup
The viewer header SHALL show the model name together with the marks of every branded party, side by side at equal height and in party order, each with its party name as alt text. Unbranded parties' generated marks SHALL be included only when at least one party has a brand. At widths below 480px, the marks SHALL sit on their own row or shrink, so the page never scrolls horizontally.

#### Scenario: Equal marks
- **WHEN** a model with two branded parties is opened at 1280px wide
- **THEN** the header shows both marks at the same height, in party order, next to the model name, with alt text "Acme Corp" and "Globex"

#### Scenario: Lockup on a phone
- **WHEN** the same model is opened at 375px wide
- **THEN** the lockup and the model name fit without horizontal page scrolling

### Requirement: Brand versions recorded in the snapshot
An exported snapshot SHALL record, for each party, the brand id and version it was drawn with, as data inside the snapshot that isn't shown to viewers. The pack's usage notes, and any file the model doesn't use, SHALL NOT be included.

#### Scenario: Versions recorded, notes excluded
- **WHEN** a model using Globex version `2026.3` is exported
- **THEN** the snapshot's embedded content records `globex` at version `2026.3` for that party, and the snapshot contains no text from the pack's usage notes

### Requirement: Marks can't run code
Brand marks SHALL be shown only as images, and never inserted into the page as markup. Script, event handlers or external references inside an SVG mark SHALL have no effect, in the author preview or in exported snapshots. A mark larger than 200 KB SHALL produce a warning.

#### Scenario: Hostile SVG mark
- **WHEN** a brand pack's mark is an SVG containing a `<script>` element, an `onload` handler and an external image reference
- **THEN** no script runs, no network request is made, and the mark is displayed as an image, in both the preview and the exported snapshot
