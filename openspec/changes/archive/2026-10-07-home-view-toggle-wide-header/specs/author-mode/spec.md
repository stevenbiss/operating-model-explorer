# Spec Delta

## MODIFIED Requirements

### Requirement: Live preview
Author mode SHALL show the model exactly as viewers will see it, including theme, persona prompt and all views. The preview SHALL say which home-page view (Simple or Detailed) the snapshot opens in, and SHALL offer the same home-page view toggle that viewers get, with no separate author-only toggle. Using that toggle in the preview SHALL NOT change the exported snapshot, which SHALL always open in the view set in the content. After editing files, the author SHALL be able to reload the same folder in one action where the browser permits (Chrome and Edge). Otherwise they load it again.

#### Scenario: Reload after an edit
- **WHEN** the author changes a role name in a loaded folder (in Chrome or Edge) and activates "Reload"
- **THEN** the preview shows the new role name without the folder being selected again

#### Scenario: Preview the other view
- **WHEN** the author loads the sample (Simple view) and activates "Detailed" on the preview's home page
- **THEN** the preview's home page shows the key messages section, the preview still says the snapshot opens in Simple view, and there is no separate author-only view toggle

#### Scenario: Export ignores the preview toggle
- **WHEN** the author switches the preview's home page to Detailed for a Simple-view model and exports
- **THEN** the snapshot's home page opens in Simple view, with the viewer toggle available

#### Scenario: Keyboard toggle
- **WHEN** a keyboard user tabs to the home-page view toggle in the preview and presses Space on the other view
- **THEN** the preview switches view and the new view is announced
