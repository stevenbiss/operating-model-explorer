# html-builder report: add-wide-pannable-diagrams

## Round 1: tasks 1.1–1.6
- **1.1 Full width:**
  - The process and structure views use `page page-full` (no max-width). `.page-wide` is removed, since nothing else used it.
  - `.workspace` is uncapped; `.report` and `.preview-head` stay at 1440px.
  - The header bar is unchanged, and text keeps its measure (`.lead` 615px).
- **1.2 Window-height areas:**
  - At 768px and wider, `.swim-scroll` and `.sd-scroll` get `max-height: calc(100vh - 32px)`, then `calc(100dvh - 32px)`, with `overflow: auto`.
  - Selecting a step also scrolls vertically.
  - Keyboard focus (`.node:focus-visible`) calls `scrollIntoView({block:'nearest', inline:'nearest'})`, so a mouse press doesn't scroll the area before a drag.
- **1.3 Drag to pan:** new `src/viewer/pan.js`, with `initPan(document)` called once when mounting.
  - Left mouse button only, 5px threshold, pointer capture, scrolls both ways.
  - Ignores presses on the area's own scrollbars and windows under 768px.
  - After a drag, the next click is swallowed once (with a timeout cleanup); `dragstart` is prevented.
  - `can-pan` is toggled on delegated `pointerover` and `pointerdown`. A ResizeObserver isn't used; design D4 was updated to match.
- **1.4 Committee placement:** in `flow()`, the group is inserted after the first party group with a member. New unit test (Customer, Acme, Committees, Globex); existing tests unchanged.
- **1.5 Fixtures:**
  - `wide-tall-process`: 3 parties, 12 roles, 25 steps.
  - `committee-three-parties`.
  - `structure-wide-8`: new, because extending `structure-wide` would break the existing six-column tests.
- **1.6:** README "Moving around big diagrams"; version 1.5.0 via `npm version --no-git-tag-version`, stamped into the plugin and skill by the build.
- **Manual checks:**
  - 1920 snapshot: swimlane 1872px wide.
  - Author preview: fills the preview.
  - 1280×800: area 768px tall, bottom edge on screen; a drag of 300/200 scrolls exactly 300/200; a drag starting on a step opens nothing; a click still opens.
  - Structure diagram with 8 parties: 1872px wide; a drag doesn't navigate; a click opens the role.
  - 375: unchanged.
- **Suites:** e2e 293 of 293. The one unit failure was real names in the planning docs, since fixed by the orchestrator: 246 of 246.

## Round 2: wheel trap
`overscroll-behavior` is now horizontal only (`-x: contain`), so the wheel scrolls the page after reaching the diagram's top or bottom. Checked: twenty wheel-downs reach scrollTop 776 of 776, then the page scrolls from 300 to 433; wheeling left at the left edge doesn't navigate. Unit 246 of 246; e2e 293 of 293.
