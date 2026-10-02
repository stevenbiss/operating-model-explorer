# html-builder report: add-structure-diagrams, round 1 (tasks 1.1 to 1.13)

All 13 build tasks are done and ticked in tasks.md.

## Results
- `npm run build`: passes. The engine is 365.4 KB and the skill folder is regenerated and current.
- `npm run test:unit`: 208 pass and 1 fail, from the private-names guard on an example in proposal.md. The orchestrator replaced it with a fictional label, and the suite is now **209 / 209**.
- `npm test` (Playwright): **181 passed, 0 failed**. There are no regressions in the existing e2e tests.
- Both Acme forms validate with 0 errors and 0 warnings, and the parity test passes.

## Changes per task
- **1.1**
  - `schema/structure.schema.json`, registered in `src/model/schemas.js`.
  - A structure section in the generated `docs/content-reference.md`.
  - The schema tests are updated.
- **1.2** `structureChecks()` in `src/model/validate.js`:
  - band ids unique, and nesting one level deep;
  - no boxes in a parent band;
  - exactly one of role or team;
  - every reference resolved, with "Did you mean";
  - a same-cell line error and a repeated-line warning;
  - self-relation and self-opens warnings;
  - the one-main rule.
- **1.3** `resolveStructure()` in `src/model/load.js` adds:
  - rows with their parents;
  - box parties;
  - party columns;
  - `relatedAll`;
  - `structures` on workstreams and roles.
- **1.4** `## Structure:` sections in `src/model/sheet.js`, with row-precise messages. The shared helpers are `partsOf()` and the key column of `rowsOf()`.
- **1.5** A pure `lineGeometry()` in `src/model/structure.js`. It is tested in `tests/unit/structure-layout.test.js`.
- **1.6 and 1.7**
  - `src/viewer/structure.js`: the grid and an SVG overlay, re-measured with ResizeObserver, with label pills and a focusin `scrollIntoView`.
  - `src/styles.css`: a CSS stacked layout below 768px, and horizontal scrolling inside the diagram's container at 768px and wider.
- **1.8**
  - `src/viewer/route.js`: the `#/d/<id>` route.
  - `src/viewer/app.js`: the diagram view and breadcrumb, the Related panel, the overview list with the main diagram first, related diagrams on workstream pages, diagrams on role profiles, and boxes that open their role or team.
- **1.9**
  - search on box name and note text;
  - "Your role" on role boxes and team boxes;
  - badges and Today text on structures and boxes;
  - removed boxes hidden while markers are off.
- **1.10** The `structure`/`structures` labels: `LABEL_PAIRS`, `DEFAULT_LABELS` and the theme schema.
- **1.11** Sample diagrams:
  - `examples/acme-sample/structures/01-partnership.md` (main) and `02-harbour-account.md`, plus matching sheet sections;
  - fictional names only;
  - coverage checked in `tests/unit/sample.test.js`.
- **1.12** Docs: `docs/capture-sheet.md`, `docs/authoring-guide.md` and `templates/capture-sheet.md`.
- **1.13** Skill:
  - SKILL.md: a Structure diagrams subsection;
  - `docs/interview-guide.md`: structure diagrams become step 6 in the question order;
  - the fictional `tests/skill-packs/org-chart/` pack and its trial entries;
  - the skill folder rebuilt.

## Deviations and decisions to review
1. **The schema spells out two levels of bands.** The schema checker has no `$ref`, so it can't be recursive. Validate.js reports any deeper nesting.
2. **Boxes are `<a href>` links rather than buttons**, because they navigate. Enter works the same way.
3. **A sheet's model id is reserved first.** A structure with the same name as the model gets the id `<name>-structure`, with no message.
4. **Some checks happen only in the sheet reader:** duplicate and unknown band names, a sub-band inside a sub-band, and a `Main:` value that isn't yes or no. Nothing is reported twice.
5. **Readings of the spec:**
   - the role profile lists only diagrams with a box for that role, so team boxes don't count;
   - removed boxes are left out of the role profile while markers are off;
   - a line to a parent band is written out in the first sub-band cell of that column.
6. **The diagram's section heading reads "Roles and teams by party"**, through the labels.
