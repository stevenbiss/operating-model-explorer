# Spec Delta

## MODIFIED Requirements

### Requirement: Live preview
Author mode SHALL show the model exactly as viewers will see it, including theme, persona prompt and all views. The preview SHALL say which home-page view (Simple or Detailed) will be published, and SHALL offer a toggle to preview the other view. The toggle SHALL change only the preview: an exported snapshot SHALL always use the view set in the content. After editing files, the author SHALL be able to reload the same folder in one action where the browser permits (Chrome and Edge). Otherwise they load it again.

#### Scenario: Reload after an edit
- **WHEN** the author changes a role name in a loaded folder (in Chrome or Edge) and activates "Reload"
- **THEN** the preview shows the new role name without the folder being selected again

#### Scenario: Preview the other view
- **WHEN** the author loads the sample (Simple view) and activates the toggle to preview the Detailed view
- **THEN** the preview's home page shows the key messages section, and the preview still says that Simple view will be published

#### Scenario: Export ignores the preview toggle
- **WHEN** the author previews the Detailed view of a Simple-view model and exports
- **THEN** the snapshot's home page is in Simple view

#### Scenario: Keyboard toggle
- **WHEN** a keyboard user tabs to the view toggle and presses Space
- **THEN** the preview switches view and the toggle's pressed state is announced
