# Spec Delta

## ADDED Requirements

### Requirement: Brands from the library
When the colleague asks to use brands from a brand library and gives its location, the skill SHALL:
- copy each chosen brand pack folder, unchanged, into `brands/<id>/` next to the capture sheet;
- fill in the Parties table's `Brand` column;
- list each pack's id and version under `## Sources`.

The skill SHALL NOT edit a pack's contents. If a named brand isn't in the library, it SHALL ask rather than invent colours or marks. The output-location rules, including the public-repo warning, apply to the copied packs too.

#### Scenario: Packs copied, not altered
- **WHEN** the skill is given the fictional brand library in `tests/skill-packs/brand-library/` and asked to use Acme and Globex (skill trial)
- **THEN** the output folder has `brands/acme/` and `brands/globex/`, byte-identical to the library copies, the Brand column names both, Sources lists both ids with their versions, and the sheet validates with 0 errors when loaded as a folder

#### Scenario: Brand not in the library
- **WHEN** the colleague asks for a brand that isn't in the library (skill trial)
- **THEN** the skill says it isn't there and asks what to do, and it writes no invented pack
