# Spec Delta

## MODIFIED Requirements

### Requirement: Engine opens in author mode
The engine file SHALL open in author mode when it has no embedded content. Author mode SHALL offer loading a capture sheet, loading a content folder, loading a `.zip` of a content folder, loading the bundled sample, and opening the content reference.

#### Scenario: First open
- **WHEN** `dist/operating-model-explorer.html` is opened from disk
- **THEN** author mode shows controls for "Load capture sheet", "Load folder", "Load .zip", "Try the sample" and "Content reference"

### Requirement: Load content
Author mode SHALL accept a capture sheet (a single `.md` file) by file picker or drag-and-drop in any supported browser. It SHALL accept a content folder by drag-and-drop or folder picker in current Chrome and Edge, and a `.zip` of a folder in any supported browser. A folder or `.zip` containing a capture sheet, plus optional `assets/`, SHALL be loaded as that capture sheet. A folder or `.zip` containing both a capture sheet and element files SHALL be an error asking the author to keep one format. Loading SHALL read only the selected files, and SHALL NOT send content anywhere.

#### Scenario: Load a zip
- **WHEN** the author loads a `.zip` of `examples/acme-sample/`
- **THEN** the validation report and the preview appear, and no network requests are made

#### Scenario: Load the bundled sample
- **WHEN** the author activates "Try the sample"
- **THEN** the sample model is validated and previewed without the author selecting any files

#### Scenario: Load a capture sheet
- **WHEN** the author activates "Load capture sheet" and chooses `examples/acme-capture-sheet/capture-sheet.md`
- **THEN** the validation report and the preview appear, and no network requests are made

#### Scenario: Keyboard load of a capture sheet
- **WHEN** a keyboard user tabs to "Load capture sheet", presses Enter and chooses a sheet
- **THEN** the sheet loads exactly as it does with drag-and-drop

#### Scenario: Mixed formats rejected
- **WHEN** a folder contains both `capture-sheet.md` and a `roles/` folder of element files
- **THEN** the report shows an error explaining that a model is either one capture sheet or a folder of element files, and export is disabled

### Requirement: Snapshot contains only what was loaded
The snapshot SHALL contain only the engine and the content the model uses. It SHALL NOT include other files from the folder, the author's file paths, the validation report, or a capture sheet's Open questions, Sources or HTML comments.

#### Scenario: Unused file excluded
- **WHEN** a content folder also contains `notes/private.txt` that no element references
- **THEN** the exported snapshot does not contain the text of `private.txt`

#### Scenario: Capture-sheet working notes excluded
- **WHEN** a capture sheet with Open questions, Sources and guidance comments is exported
- **THEN** the snapshot contains none of that text

## ADDED Requirements

### Requirement: Open questions in the report
When a capture sheet has unticked open questions, the validation report SHALL list them in their own group labelled "Open questions", separately from other warnings, with a count. Export SHALL remain enabled.

#### Scenario: Open questions group
- **WHEN** a sheet with 3 unticked open questions is loaded
- **THEN** the report shows an "Open questions (3)" group listing them, and the Export control is enabled

#### Scenario: Report at 768px
- **WHEN** a sheet with open questions is loaded at 768px wide
- **THEN** the report and the open-questions group are readable without horizontal scrolling
