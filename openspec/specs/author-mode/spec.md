# author-mode Specification

## Purpose
Lets colleagues turn their content folder into a shareable snapshot using only the engine file and a browser: load, validate, preview and export, with no install, no command line and no network.

## Requirements

### Requirement: Engine opens in author mode
The engine file SHALL open in author mode when it has no embedded content. Author mode SHALL offer loading a content folder, loading a `.zip` of a content folder, loading the bundled sample, and opening the content reference.

#### Scenario: First open
- **WHEN** `dist/operating-model-explorer.html` is opened from disk
- **THEN** author mode shows controls for "Load folder", "Load .zip", "Try the sample" and "Content reference"

### Requirement: Load content
Author mode SHALL accept a content folder by drag-and-drop or folder picker in current Chrome and Edge, and a `.zip` of the folder in any supported browser. Loading SHALL read only the selected files, and SHALL NOT send content anywhere.

#### Scenario: Load a zip
- **WHEN** the author loads a `.zip` of `examples/acme-sample/`
- **THEN** the validation report and the preview appear, and no network requests are made

#### Scenario: Load the bundled sample
- **WHEN** the author activates "Try the sample"
- **THEN** the sample model is validated and previewed without the author selecting any files

### Requirement: Validation report
After loading, author mode SHALL show the validation report (see content-schema) with error and warning counts, each message identifying its file. A model with no problems SHALL show a clear "Ready to export" state.

#### Scenario: Clean model
- **WHEN** the sample is loaded
- **THEN** the report shows "0 errors, 0 warnings" and "Ready to export"

### Requirement: Live preview
Author mode SHALL show the model exactly as viewers will see it, including theme, persona prompt and all views. After editing files, the author SHALL be able to reload the same folder in one action where the browser permits (Chrome and Edge). Otherwise they load it again.

#### Scenario: Reload after an edit
- **WHEN** the author changes a role name in a loaded folder (in Chrome or Edge) and activates "Reload"
- **THEN** the preview shows the new role name without the folder being selected again

### Requirement: Export snapshot
When there are no errors, author mode SHALL export a snapshot as a single HTML file named after the model id (e.g. `acme-sample.html`). The snapshot SHALL embed the engine, the content, the theme and every asset. It SHALL open directly in viewer mode, with no author controls, and SHALL show the model version (if given) and the export date.

#### Scenario: Export and open
- **WHEN** the author exports the sample and opens the downloaded file from disk with the network disabled
- **THEN** the model opens in viewer mode with its theme, no author controls are present, and the footer shows the export date

#### Scenario: Export blocked by errors
- **WHEN** the loaded model has one or more errors
- **THEN** the Export control is disabled and says how many errors must be fixed

### Requirement: Snapshot contains only what was loaded
The snapshot SHALL contain only the engine and the files loaded from the content folder that the model uses. It SHALL NOT include other files from the folder, the author's file paths, or the validation report.

#### Scenario: Unused file excluded
- **WHEN** a content folder also contains `notes/private.txt` that no element references
- **THEN** the exported snapshot does not contain the text of `private.txt`

### Requirement: Accessible author mode
All author mode controls SHALL be keyboard operable and labelled, including the folder and zip pickers as alternatives to drag-and-drop. Author mode SHALL be usable at 768px width and above.

#### Scenario: Keyboard load
- **WHEN** a keyboard user tabs to "Load .zip", presses Enter and chooses a file
- **THEN** the content loads exactly as it does with drag-and-drop
