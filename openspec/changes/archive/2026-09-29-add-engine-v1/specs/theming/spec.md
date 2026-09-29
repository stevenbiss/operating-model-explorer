# Spec Delta

## Purpose

Lets each operating model carry its own look and language (colours, fonts, logo and terminology) through a theme file, without code changes, so the same engine feels native to each client or partnership.

## ADDED Requirements

### Requirement: Theme file
A model MAY include `theme.md`, whose header defines `colors` (primary, accent, background, surface, text, and a palette for parties and lanes), `fonts` (a font file in `assets/`, or a system font stack), an optional `logo` (an image in `assets/`) and optional `labels`. The theme SHALL apply everywhere in the viewer, including exported snapshots.

#### Scenario: Custom colours applied
- **WHEN** a theme sets the primary colour to `#0b1f4d` and the model is previewed
- **THEN** primary UI elements (header, active navigation, selected items) use `#0b1f4d`

#### Scenario: Logo shown
- **WHEN** the theme sets `logo: assets/logo.svg`
- **THEN** the logo appears in the viewer header of the preview and of the exported snapshot, with the model name as alt text

### Requirement: Default theme
When no `theme.md` is present, the engine SHALL use a neutral built-in theme that meets WCAG AA contrast and supports both light and dark colour schemes, following the viewer's system setting.

#### Scenario: No theme file
- **WHEN** a model without `theme.md` is previewed
- **THEN** the default theme is used, and the report shows no theme errors

#### Scenario: Dark mode
- **WHEN** the default theme is in use and the viewer's system prefers dark mode
- **THEN** the viewer renders with dark backgrounds and light text

### Requirement: Terminology labels
The theme SHALL be able to rename the engine's terms: at least model, party, team, role, persona, workstream, process, step and key messages, each in singular and plural. Every visible label SHALL use the configured term. Unset terms SHALL keep their defaults.

#### Scenario: Rename workstream
- **WHEN** the theme sets `labels: { workstream: "Value stream", workstreams: "Value streams" }`
- **THEN** navigation, headings, breadcrumbs and search results say "Value stream" or "Value streams", and "workstream" does not appear in the viewer UI

### Requirement: Accessible theme colours
The engine SHALL check theme text/background colour pairs and warn when their contrast is below WCAG AA (4.5:1 for normal text).

#### Scenario: Low-contrast theme
- **WHEN** a theme sets text `#999999` on background `#ffffff`
- **THEN** the report shows a warning naming the two colours, their contrast ratio and the required minimum

### Requirement: Offline assets only
Fonts and images SHALL come from the content folder or the system, and SHALL be embedded in the exported snapshot. A theme that references a URL SHALL produce an error.

#### Scenario: Remote font rejected
- **WHEN** a theme sets its font to `https://fonts.example.com/brand.woff2`
- **THEN** the report shows an error explaining that fonts must be files in `assets/`

#### Scenario: Missing asset
- **WHEN** a theme sets `logo: assets/missing.png` and the file is absent
- **THEN** the report shows an error naming the missing file
