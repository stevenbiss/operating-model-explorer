# Spec Delta

## MODIFIED Requirements

### Requirement: Content folder layout
A model SHALL be a folder containing exactly one `model.md` at its root. It MAY also contain `theme.md` and the subfolders `parties/`, `teams/`, `roles/`, `personas/`, `workstreams/`, `processes/`, `assets/` (images) and `brands/` (brand packs, one folder per brand; see party-brands). The engine SHALL identify each element by its header `type`, not by its folder. The folders are a convention for authors. Files under `brands/` SHALL be read only as brand packs, never as elements.

#### Scenario: Minimal valid model
- **WHEN** a folder containing only a valid `model.md` is loaded in author mode
- **THEN** the validation report shows no errors
- **AND** the preview shows the model overview

#### Scenario: Missing model file
- **WHEN** a folder with no `model.md` is loaded
- **THEN** the validation report shows the error "No model.md found at the top of the folder" and export is disabled

#### Scenario: Brand packs are not elements
- **WHEN** a model folder contains `brands/globex/brand.md`
- **THEN** it is read as a brand pack, and it isn't reported as an unknown element or a file without a type
