# theming Specification

## Purpose
Lets each operating model carry its own look and language (colours, fonts, logo and terminology) through a theme file, without code changes, so the same engine feels native to each client or partnership.

## Requirements

### Requirement: Theme file
A model MAY include `theme.md`, whose header defines `labels` (see Terminology labels). The theme controls terminology only. The frame's look always comes from the engine (see Default theme), and party identity comes from brand packs (see party-brands). The keys `colors`, `fonts`, `logo` and `palette` are **retired**. A theme that still sets any of them SHALL load, and the report SHALL show one warning per retired key, naming it and saying that it is ignored and what replaces it.

#### Scenario: Labels applied
- **WHEN** a theme sets only `labels: { workstream: "Value stream", workstreams: "Value streams" }`
- **THEN** the viewer uses "Value stream" and the report shows no theme messages

#### Scenario: Custom colours applied
- **WHEN** a theme sets `colors.primary: "#0b1f4d"`
- **THEN** the report shows a warning that `colors` is ignored and party colours now come from brand packs, the frame uses the engine's neutral colours, and export remains enabled

#### Scenario: Logo shown
- **WHEN** a theme sets `logo: assets/logo.svg`
- **THEN** the report shows a warning that `logo` is ignored, and the header shows the model name with the party marks from brand packs (see party-brands › Header lockup)

### Requirement: Default theme
The engine SHALL always draw the frame (backgrounds, surfaces, text, navigation, buttons, headings and body typography) with its own neutral theme, whether or not `theme.md` is present. The neutral theme SHALL meet WCAG AA contrast and support both light and dark colour schemes, following the viewer's system setting.

#### Scenario: No theme file
- **WHEN** a model without `theme.md` is previewed
- **THEN** the neutral theme is used, and the report shows no theme messages

#### Scenario: Dark mode
- **WHEN** the viewer's system prefers dark mode
- **THEN** the viewer renders with dark backgrounds and light text

### Requirement: Terminology labels
The theme SHALL be able to rename the engine's terms: at least model, party, team, role, committee, persona, workstream, process, step, structure and key messages, each in singular and plural. Every visible label SHALL use the configured term, including the "By committee" badge and the "Your committee" cue, which use the singular committee term. Unset terms SHALL keep their defaults.

#### Scenario: Rename workstream
- **WHEN** the theme sets `labels: { workstream: "Value stream", workstreams: "Value streams" }`
- **THEN** navigation, headings, breadcrumbs and search results say "Value stream" or "Value streams", and "workstream" does not appear in the viewer UI

#### Scenario: Rename structure
- **WHEN** the theme sets `labels: { structure: "Org model", structures: "Org models" }`
- **THEN** the overview list, diagram headings, Related panels and search results say "Org model" or "Org models", and "structure" does not appear in the viewer UI

#### Scenario: Rename committee
- **WHEN** the theme sets `labels: { committee: "Steering group", committees: "Steering groups" }`
- **THEN** the swimlane heading says "Steering groups", committee-owned steps show "By steering group", the persona cue says "Your steering group", search results say "Steering groups", and "committee" does not appear in the viewer UI

### Requirement: Offline assets only
Brand marks and images used in narrative SHALL come from the model folder, and SHALL be embedded in the exported snapshot. A brand pack mark or a narrative image that references a URL SHALL be an error.

#### Scenario: Remote font rejected
- **WHEN** a theme sets its font to `https://fonts.example.com/brand.woff2`
- **THEN** the report shows a warning that `fonts` is retired and ignored, no font is fetched, and the frame uses the engine's fonts

#### Scenario: Remote mark rejected
- **WHEN** a brand pack sets `marks.mark: https://example.com/mark.svg`
- **THEN** the report shows an error explaining that marks must be files in the brand pack's folder

#### Scenario: Missing asset
- **WHEN** a narrative image references `assets/missing.png` and the file is absent
- **THEN** the report shows an error naming the missing file
