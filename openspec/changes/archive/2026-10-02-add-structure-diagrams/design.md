# Design: Structure diagrams

## Context

See proposal.md (Why) and `specs/structure-diagrams/spec.md` for the behaviour. The engine today:

- **Loading.** Elements are loaded from a content folder or a capture sheet. The sheet is converted into the same documents a folder would produce (`src/model/sheet.js`), and a parity test proves the two Acme forms match.
- **Checking.** Headers are checked against JSON schemas in `schema/` and then by cross-reference checks in `src/model/validate.js`. Every message is plain English, with a fix and a "Did you mean" suggestion.
- **Drawing.** Swimlanes are drawn as SVG from a pure, unit-tested layout (`src/model/layout.js` and `src/viewer/swimlane.js`). Routes are hash fragments (`src/viewer/route.js`). All other views live in `src/viewer/app.js`.
- **Brands.** Parties carry brand colours and marks from v1.2.0, and the views read them through the existing party-identity helpers.
- **Constraints.** The deliverable must stay one offline HTML file, and Ponytail minimal-code mode applies.

## Goals / Non-Goals

**Goals:**
- Add structures as a normal element type, so loading, validation, snapshots, search, labels and change markers mostly work through the existing paths.
- Keep the diagram readable at any text length, and fully accessible, with one DOM that serves desktop, phone and screen readers.

**Non-Goals:**
- A general graph-layout engine. The layout is a fixed grid of bands by parties, and lines join grid cells.
- Line routing around obstacles.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies. The diagram is a grid with straight lines, which needs neither React nor a layout library.

### D2. One element type, `structure`, with nested bands
Folder form:

```yaml
---
id: partnership
type: structure
name: Acme + Globex partnership
kind: Partnership
main: true
related: [harbour-account]
workstreams: [presales]
bands:
  - { id: leadership, name: Partnership leadership }
  - id: accounts
    name: Account management
    bands:
      - { id: harbour, name: Harbour account, opens: harbour-account }
      - { id: summit, name: Summit account }
boxes:
  - { band: leadership, role: partner-manager, name: Sam Example, note: "Grade: Director" }
  - { band: harbour, team: globex-solutions }
lines:
  - { from: { band: leadership, party: acme }, to: { band: leadership, party: globex }, label: Joint steering }
---
```

- `schema/structure.schema.json` describes the shape, with a recursive `bands` item. The schema allows nesting, and validate.js enforces the one-level limit, so the error message can name the band.
- `main` lives on the structure, not on the model. That keeps the model file unchanged and lets the sheet say `Main: yes` inside the section it belongs to. The alternative, `model.main_structure: <id>`, was rejected because it splits one fact across two files.
- Relations are two fields, `related` (structure ids) and `workstreams` (workstream ids), rather than one mixed list. Ids are already unique across types, but two fields make the sheet lines unambiguous ("Related:" and "Workstreams:") and keep reference errors specific.
- Line ends are `{ band, party }` objects. A shorthand string such as `leadership/acme` was rejected because it would be another syntax to explain.

### D3. Validation in validate.js, next to the process checks
These checks are added after the schema checks:
- band ids unique within a structure, and nesting one level deep;
- no boxes in a band that has sub-bands;
- exactly one of `role` or `team` per box;
- every reference resolves (box band, role and team; line band and party; `opens`; `related`; `workstreams`), using the existing `closest()` helper for suggestions;
- a line's two ends must be different cells (error), and so must not be a band and its own sub-band in one column (error); a repeated line is a warning;
- a structure that relates to or opens itself is a warning;
- the main-diagram rule: run once over all structures, as an error listing them.

All messages follow the existing wording style (problem plus fix) and locate the problem by structure, then band or row.

### D4. Capture sheet: a `Structure:` section, parsed like `Process:`
`sheet.js` gains a `Structure:` section handler that reuses the existing table reader and name resolver:
- `Kind`, `Summary`, `Main`, `Related`, `Workstreams`, `Change`, `Today` and `ID` lines;
- `### Bands`, `### Boxes`, `### Lines` and `### Notes` subsections.

Band names are resolved within their section, and band ids come from `toId(name)`. The output is the same document as the folder form, so the parity test extends naturally. The format stays at 1. A v1.2 engine meets an unknown `## Structure:` heading, warns that it is ignored, and loads the rest of the sheet. That is acceptable for an additive feature, and the skill always ships its matching engine.

### D5. Rendering: an HTML CSS grid with an SVG line overlay
Swimlanes are pure SVG with fixed node sizes. Structure boxes instead hold free text (names, notes, team role lists) of unpredictable length, so they are **HTML**:

- The diagram is a CSS grid: a band-label column, then one column per party. There is one grid row per leaf band. A parent band's label spans its sub-band rows, and a sub-band's label sits beside it.
- Each cell is a container in DOM order, band by band and then party by party. That gives Tab order, screen-reader order and the stacked phone order without any extra work.
- Boxes are buttons (role or team) styled as cards, with the party's brand tint on the cell. Column headers show the party's name and mark through the existing brand helpers.
- **Lines** are drawn in one absolutely positioned `<svg aria-hidden="true">` behind the cells.
  - A pure function `lineGeometry(cellRects, lines)` turns measured cell rectangles into segments. Cells in the same row join edge to edge horizontally. Cells in the same column join edge to edge vertically. Any other pair gets a straight segment between the facing edge midpoints.
  - The overlay is re-measured with a `ResizeObserver` on the grid.
  - Labels sit at the segment's midpoint, on a small background pill, the same pattern as the swimlane's branch labels.
  - The geometry function is unit-tested in Node, like layout.js.
- A **parent band cell** (a line end that names a parent band) is the union of its sub-band cells in that column.
- **Accessibility:** every cell holds a visually hidden heading ("<Party>, <band>") and a "Related to: …" list built from the lines. Lines are therefore never the only carrier of meaning. Below 768px, the same elements become visible (see D6).

Alternatives considered:
- A pure SVG grid like the swimlane needs manual word-wrapping and truncation (names and notes would get cut off) and a separate phone renderer. Rejected.
- Drawing lines with CSS borders can't draw diagonal lines or labels well. Rejected.

### D6. Small screens with CSS only
Below 768px:
- the grid becomes block layout;
- band labels become headings;
- each cell's party label and "Related to" list become visible;
- the SVG overlay is hidden.

There's no second renderer, and the DOM order from D5 already reads correctly. At 768px and wider, the grid sits in an `overflow-x: auto` container with a minimum column width, and focusing a box calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })`.

### D7. Route `#/d/<id>` and breadcrumb Model > Diagram
- Add `d: 'structure'` to `VIEWS` in route.js. Persona and change query parameters work as for every view.
- The breadcrumb is flat, because a graph has no single path. Back and Forward come from hash history, as today.

### D8. Related panel computed once at load
When the model is normalised, build a `relatedOf[id]` map, the union of `related` in both directions, and a `structuresOf[workstreamId]` map. The diagram's Related panel, the workstream page and the overview all read these maps. The role profile uses a `structuresOfRole[roleId]` map built from the boxes.

### D9. Integration with existing features
- **Search:** index each structure under its type, and add each box's `name` and `note` text to its structure's searchable text. A match on a box opens the diagram. The result line shows the matched box text, so the viewer sees why the diagram matched.
- **Persona:** a box gets the existing emphasis class plus a visible "Your role" text cue when its role is in the persona's roles, or when it is a team box whose team contains one of them. Nothing is hidden.
- **Change markers:** structures reuse the element badge. Boxes get badges and `today` text. Removed boxes are filtered out while markers are off, as removed steps are, and lines are unaffected because they join cells, not boxes. Removed roles in a team box's role list follow the same rule.
- **Labels:** add `['structure', 'structures']` to `LABEL_PAIRS` in theme-check.js, with the defaults "Structure" and "Structures".
- **Party columns:** the parties of a diagram's visible boxes, plus its line ends, sorted by the model's party order.

### D10. Samples and tests use fictional data only
The Acme folder and sheet gain a main "Partnership structure" diagram and a "Harbour account" diagram:
- they use only the existing Acme and Globex roles and teams;
- people's names are clearly fictional (for example "Sam Example");
- between them they cover sub-bands, `opens`, a team box, name and note text, a labelled line and a related workstream.

`tests/private-names.txt` keeps guarding against real names. A fictional `tests/skill-packs/org-chart/` pack, with a partnership slide and a sub-programme slide described in text, drives the skill trial.

## Risks / Trade-offs

- [Lines between non-adjacent cells pass behind the cells in between] → Lines sit behind the cells, so only the gutter parts show, and every relationship is also written as text in the cell. The authoring guide recommends lines between neighbouring cells.
- [The overlay depends on DOM measurement, so the geometry can go stale after a font load or resize] → The overlay is re-measured with ResizeObserver, and the geometry function is pure and unit-tested. The e2e tests check that line endpoints touch their cells.
- [Many party columns get wide] → The diagram scrolls horizontally inside its own container (spec requirement), and columns only appear for parties the diagram uses.
- [Name text means the same person can be typed differently in two boxes] → This was accepted in exploration (no person elements). Search on box text at least finds every spelling.
- [A v1.2 engine silently drops Structure sections apart from a warning] → The skill bundles its matching engine, and the release notes call it out.
- [Lines join cells, not boxes, so person-to-person relationships can't be shown] → This was a deliberate choice in exploration. Box-to-box lines can be added later without breaking the format, as optional `from.box` and `to.box` fields.

## Migration Plan

The change is additive. Existing models load unchanged and need no main diagram until they add a structure. It ships as release 1.3.0, with the capture-sheet format still at 1. To roll back, use the 1.2.0 engine. Snapshots already exported are unaffected.

## Open Questions

None. The default word in the viewer is "Structure" (confirmed by the user for now); models can relabel it.
