# Spec Delta

## MODIFIED Requirements

### Requirement: View line
The lines under the sheet's title MAY include `View: Simple` or `View: Detailed` (ignoring case), which set the view the home page opens in. Viewers can still switch views (see explorer-views › L0 model overview). A missing line SHALL mean Simple. Any other value SHALL be an error naming the line and listing the allowed values. The format version SHALL stay at 1.

#### Scenario: Detailed from the sheet
- **WHEN** a sheet has `View: Detailed` under its title
- **THEN** the exported snapshot's home page opens in Detailed view, showing the key messages section

#### Scenario: Unknown view value
- **WHEN** a sheet has `View: Full` under its title
- **THEN** the report shows an error naming the line and listing "Simple" and "Detailed"
