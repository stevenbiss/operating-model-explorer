# Proposal: Structure diagrams

## Why

The explorer explains **how work flows** (workstreams, process swimlanes, steps), but not **how the organisations are arranged around it**: which teams and roles sit at which level, who their counterparts are in the other parties, and how a sub-programme, market or division fits into the whole. Today authors explain that with hand-drawn slides ("collaboration model", "operating model for <sub-programme>"). Those slides drift away from the model and from each other: the same people and roles appear on several of them.

The model already holds the parties, teams and roles those slides are made of. What's missing is a way for authors to arrange them into relationship diagrams of their own design, the same way they design processes from scratch, and for viewers to explore those diagrams in the snapshot.

## Who uses it and how it's shared

- **Authors (colleagues):** design one or more structure diagrams in the capture sheet (a `## Structure: <name>` section) or as `structure` files in a content folder, alongside the processes. The operating-model-author skill can draft them from org slides and decks. They export as today.
- **Viewers (colleagues and clients):** receive the exported snapshot HTML as before, by email, Teams or file share, and explore the diagrams read-only: open a box's role or team, follow related diagrams, see their own roles highlighted. Nothing changes about how the file is opened or shared.

## What Changes

- **A new element type, `structure`:** an author-designed relationship diagram. It has a name, an optional free-text `kind` in the author's own words (for example Partnership, Market, Sub-programme or Division) and an optional summary.
- **Columns are parties.** Each box's column comes from its role's or team's party. Columns appear in the model's party order, and only for parties the diagram uses.
- **Bands are rows the author names freely,** in order from top to bottom, with one optional level of sub-bands (for example "Programme management" holding "Harbour" and "Summit"). The engine builds in no tiers or governance vocabulary.
- **Boxes** place an existing role or team in a band. A box can carry optional **name** text (who holds it, or TBA) and optional **note** text (for example "Partner grade: Executive Director"). The same role may have boxes in several bands. A team box lists the team's roles.
- **Lines** join two cells (a band and a party) to show a relationship. They are plain and undirected, with no arrowheads and an optional label. Band order carries seniority.
- **Diagrams form a graph, not a tree.** A diagram lists `related` diagrams and related workstreams, and each relation is shown from both sides. A band may **open** another diagram, which lets viewers drill down (for example from the "Harbour" band to the Harbour diagram).
- **One main diagram.** If a model has any diagrams, exactly one of them is marked `main`: the whole company or partnership. The overview lists it first.
- **Viewer:**
  - a diagram view with its own route and breadcrumb (Model > Diagram) and a Related panel;
  - the overview and workstream pages list diagrams, and a role's profile lists the diagrams it appears in;
  - search covers diagram names and box name and note text, so searching for a person finds the diagram they appear in;
  - with a persona selected, boxes for the persona's roles are highlighted;
  - change markers work on diagrams and boxes;
  - below 768px the diagram becomes a stacked list, with full keyboard and screen-reader access.
- **Labels:** the term "structure" can be renamed per model, like the other terms.
- **Capture sheet:** a new `## Structure: <name>` section with `Kind`, `Main`, `Related` and `Workstreams` lines and `Bands`, `Boxes` and `Lines` tables. The format stays at 1, because the section is additive.
- **Authoring skill:** drafts structure sections from org-chart material, asks which diagram is the main one, and records any box or line it can't place as an open question.
- **Samples:** the Acme sample (folder and capture sheet, kept in parity) gains a main partnership diagram and one related diagram, using fictional names only.

## Capabilities

### New Capabilities
- `structure-diagrams`: the structure element (bands, boxes, lines, kind, main, related, opens), its validation rules, and how the diagram is drawn and explored: the grid layout, lines, the Related panel and drill-down, persona highlight, change markers, keyboard and screen-reader access, the small-screen layout and the route.

### Modified Capabilities
- `content-schema`: `structure` added to the element types and the folder layout, and its references (roles, teams, parties, bands, related diagrams, workstreams, opened diagrams) added to reference checking.
- `capture-sheet`: the `Structure: <name>` section added to the recognised sections, with its tables.
- `explorer-views`: the overview lists diagrams with the main one first, workstream pages list related diagrams, role profiles list the diagrams the role appears in, and search covers box name and note text.
- `theming`: `structure`/`structures` added to the renameable terms.
- `authoring-skill`: drafting structure sections from source material, and including them in the interview order.

## Non-goals

- Editing or rearranging diagrams in the viewer. Diagrams are authored in content, and viewers explore them read-only.
- People as elements: no person pages and no linking of one person across boxes. Names are text on a box.
- Lines between individual boxes, directed lines or arrowheads, and line styles or kinds.
- Columns other than parties, such as functional columns.
- Nesting bands more than one level deep.
- A separate "scope" element (market, division) that roles or teams could belong to.
- Starting a persona on a diagram (`entry.view: structure`). This could come later.
- Auto-generating a diagram from the model when the author hasn't drawn one.
- Any real names, brands or org data in this public repo, including in examples and tests.

## Impact

- **Engine:**
  - model: `schema/structure.schema.json`, the structure checks in `src/model/validate.js`, and the sheet parsing in `src/model/sheet.js`;
  - viewer: a new diagram renderer next to `src/viewer/swimlane.js`, a `#/d/<id>` route in `src/viewer/route.js`, and overview, workstream, role, search and persona changes in `src/viewer/app.js`;
  - labels in `src/model/theme-check.js`.
- **Content and docs:** `examples/acme-sample/structures/` and the Acme capture sheet; `templates/capture-sheet.md`; `docs/capture-sheet.md`, `docs/authoring-guide.md` and the generated `docs/content-reference.md`.
- **Skill:** SKILL.md and the interview guide; a fictional org-chart skill pack in `tests/skill-packs/`; the regenerated skill references.
- **Compatibility:** additive. Existing models and snapshots are unchanged. A sheet with Structure sections opened in a v1.2 engine loads, with a warning that the section is unknown.
- **Release:** a minor version, 1.3.0.
