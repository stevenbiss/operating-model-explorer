# Tasks

## 1. Build

- [x] 1.1 Full width (D2): a `page-full` modifier (no max-width) on the process and structure views in `src/viewer/app.js`, and in `src/styles.css` the author-mode `.workspace` uncapped, with `.report` and `.preview-head` kept at 1440px. Headings, `.lead`, `.prose` and `.about` keep their measure. Verify manually at 1920×1080 in a snapshot and in the author-mode preview, and at 1024 and 768, with no horizontal page scroll
- [x] 1.2 Window-height diagram areas (D3): at 768px and wider, `.swim-scroll` and `.sd-scroll` get `max-height` (`100vh` fallback, then `100dvh`, minus 32px) and `overflow: auto` with `overscroll-behavior-x: contain`, and step focus or selection scrolls with `block: 'nearest'` as well. Verify manually with a tall, wide fixture at 1280×800: the bottom scrollbar is on screen, lane headers stay pinned, and the "More steps" cue and the focus scroll still work
- [x] 1.3 Drag to pan (D4): new `src/viewer/pan.js` with `initPan(root)`, called once from `render()`:
  - delegated `pointerdown`, `pointermove`, `pointerup` and `pointercancel` handlers, for the left mouse button only, with a 5px threshold, pointer capture and the `panning` class;
  - after a drag, the next `click` is suppressed once;
  - `dragstart` is prevented inside the areas;
  - a delegated `pointerover` (and `pointerdown`) toggles `can-pan`, and CSS sets `cursor: grab` and `grabbing` and turns off text selection while panning;
  - list or stacked layouts below 768px are not affected.

  Verify manually by dragging the swimlane and a wide structure diagram, and by clicking steps, boxes and links
- [x] 1.4 Committee placement (D5): in `src/model/layout.js`, insert the committees group after the first party group that has a member of any shown committee. Verify with a new `tests/unit/layout.test.js` case (Customer, Acme, Globex), and confirm the existing committee layout tests are unchanged
- [x] 1.5 Test fixtures: `wide-tall-process` (a process with about 25 steps across 12 or more lanes, fictional names) and `committee-three-parties` (Customer, Acme, Globex, with an Acme and Globex committee). Reuse `structure-wide` for wide diagrams, extending it to 8 parties if needed. Verify that each loads with 0 errors
- [x] 1.6 Docs: a short "Moving around big diagrams" note in the README's "Using the engine" section, and in `docs/authoring-guide.md` if it describes viewing. Version 1.5.0 in `package.json` (and `package-lock.json`), with the plugin and skill updated through the build. Verify with the version unit test and the skill-folder-current test

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at the viewport each scenario names (default 1280×800). `@mobile` scenarios also run at 375×812. Mouse dragging uses `page.mouse` (down, move in steps, up).

### explorer-views
- [ ] 2.1 More steps cue
- [ ] 2.2 Swimlane uses the full width (snapshot and author-mode preview, 1920×1080)
- [ ] 2.3 Both scrollbars stay on screen
- [ ] 2.4 Drag the swimlane
- [ ] 2.5 Drag starting on a step
- [ ] 2.6 Click still opens a step
- [ ] 2.7 Hand cursor
- [ ] 2.8 Keyboard unchanged
- [ ] 2.9 Phones keep the list (@mobile)

### structure-diagrams
- [ ] 2.10 Many parties
- [ ] 2.11 Diagram uses the full width
- [ ] 2.12 Drag a wide diagram
- [ ] 2.13 Click still opens a box

### committees
- [ ] 2.14 Committee lane and badge
- [ ] 2.15 Membership shown in the member's own lane
- [ ] 2.16 Two committees in one process
- [ ] 2.17 Lane header opens the committee
- [ ] 2.18 Committee after the first party with members

- [ ] 2.19 The full existing suite (`npm run test:unit` and `npm test`) still passes, with no regressions in the swimlane, structure, committee, persona or keyboard tests

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement in the three delta specs against the running engine and an exported snapshot at 1920×1080, 1280×800, 1024×768 and 375×812, including real mouse dragging, plus a regression pass over the main specs. It returns VERIFIED. The report is saved to `openspec/changes/add-wide-pannable-diagrams/reports/html-verifier.md`

## 4. QA

- [ ] 4.1 html-qa final gate:
  - accessibility: axe at 1920, 1280 and 375, focus order and focus scrolling inside a height-limited area, and keyboard and scrollbar alternatives to dragging (WCAG 2.5.7);
  - the feel of panning in Chrome and Edge: no stray text selection, no accidental opening after a drag, and the right cursors;
  - nested scrolling behaviour with the wheel and trackpad;
  - visual polish at 1920 and 2560 in light and dark;
  - performance while dragging a 30-step, 3-committee process (no long tasks);
  - `/code-review` and a Ponytail audit.

  It returns SHIP. The report is saved to `openspec/changes/add-wide-pannable-diagrams/reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, export the Acme demo snapshot from the capture sheet, and publish release 1.5.0 with the three standard assets and checksums
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
