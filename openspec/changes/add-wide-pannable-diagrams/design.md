# Design: Wide, draggable diagrams

## Context

See proposal.md (Why) and the three delta specs. The engine today:

- **Widths.**
  - `.page` is capped at 1120px and `.page-wide` at 1440px. The process and structure views use `page page-wide`.
  - In author mode the preview (`#om-preview`) sits inside `.workspace`, which is also capped at 1440px with 24px padding.
  - The header bar (`.bar-in`) is capped at 1440px.
- **Swimlane.**
  - `.swim-scroll` scrolls in both directions (`overflow: auto`), but has no height limit, so its horizontal scrollbar sits under the last lane.
  - Lane headers are a separate sticky SVG (`.lane-heads`, `left: 0`) in the same scroll container, so they stay aligned when it scrolls vertically.
  - The "More steps" cue and the right-hand fade are positioned on `.swim-wrap`.
- **Structure diagram.** `.sd-scroll` scrolls horizontally only. Below 768px both diagrams switch to list or stacked layouts, which don't scroll.
- **Rendering.** Views are re-rendered with `innerHTML` on every route change, so per-element listeners would be lost. The app already uses delegated listeners on the document.
- **Committee placement.** `flow()` in `src/model/layout.js` inserts the committees group with `groups.splice(1, 0, …)`, which is always after the first party group.

## Goals / Non-Goals

**Goals:**
- Diagrams get the whole window width and never more than the window height, and the mouse can pan them. This uses one small shared module and CSS, with no new dependencies.
- Text stays readable: headings, summaries and narrative keep their existing line lengths.

**Non-Goals:**
- Zoom, a minimap, full-screen mode, and custom touch handling (touch already pans natively).
- Changing the width of non-diagram pages.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
This needs CSS, about 40 lines of pointer handling and a one-line layout fix. A pan library or React would add weight without benefit.

### D2. Full width through a page modifier, not by raising the global caps
- Add a `page-full` modifier, used instead of `page-wide` on the process and structure views: `max-width: none`. The page's own padding gives the margin (24px, or 16px below 768px).
- `.lead`, `.prose` and `.about` already carry their own `max-width`, so text keeps its measure without extra rules.
- **Author mode.** Remove the 1440px cap from `.workspace` only around the preview. The report keeps its cap, so the preview can be as wide as the window. In practice: `.workspace` loses its `max-width`, and `.report` and `.preview-head` keep `max-width: 1440px; margin-inline: auto`.
- **The header bar stays capped at 1440px.** It holds controls, not a diagram, and a stretched header reads badly.
- Rejected: raising `.page-wide` to `none` for every view. That would widen card grids and lists that are meant to stay compact.

### D3. Diagram areas are at most the window's height
At 768px and wider:

```css
.swim-scroll, .sd-scroll { max-height: calc(100dvh - 32px); overflow: auto; overscroll-behavior: contain; }
```

- `dvh` follows the real visible height, including browser chrome. A `100vh` fallback goes first for older engines.
- The swimlane's step detail panel already uses `position: sticky; max-height: calc(100vh - 32px)`, so the two sit side by side at the same height.
- **Focus.** When a step is focused or selected, it is scrolled into view with `block: 'nearest'` as well as `inline: 'nearest'`, so a step in a lower lane is brought into the area vertically too. `scroll-padding` keeps it clear of the sticky headers, as today.
- **Party bands.** The bands are inside the SVG and scroll vertically with the lanes. Lane headers stay pinned on the left. Pinning band headers to the top as well is out of scope.

### D4. Drag to pan: one delegated, pointer-based module
Add a new `src/viewer/pan.js` that exports `initPan(root)`. `render()` calls it once, with listeners on `root` (event delegation), so re-renders need nothing extra.

- **`pointerdown`.** Only acts for `button === 0` and `pointerType === 'mouse'` (pen and touch keep native behaviour). The target must be inside a `.swim-scroll` or `.sd-scroll` that overflows, and the swimlane must not be in list layout. It records the start point and the scroll position, and doesn't call `preventDefault` yet, so a plain click still works.
- **`pointermove`.** Once the pointer has moved 5px or more from the start, the gesture becomes a drag:
  - it calls `setPointerCapture`;
  - it adds the `panning` class (`cursor: grabbing; user-select: none`);
  - it sets `scrollLeft` and `scrollTop` to their start values minus the pointer's movement.
- **`pointerup` / `pointercancel`.** After a drag, a capturing `click` listener runs once on the area. It stops propagation and prevents the default, so the release doesn't open a step, box or link. Then the state is cleared.
- **`dragstart`.** Prevented inside the areas, so links and images in structure boxes don't start the browser's own drag-and-drop.
- **Cursor.** An area gets the class `can-pan` (`cursor: grab`) only while it overflows. A `ResizeObserver` per area keeps this current after render or resize. Steps, boxes and links keep their own `pointer` cursor, so it's still clear they can be clicked.
- **5px threshold.** It's the usual value: small enough to feel immediate, and large enough that a slightly shaky click is still a click.
- Rejected:
  - scroll-snap or a transform-based pan, because it breaks native scrollbars, scroll-padding and `scrollIntoView`;
  - pan only on empty space, because the user asked to drag "the diagram", and steps cover much of a busy swimlane.

### D5. Committee placement: after the first party group with a member
In `flow()`, replace `groups.splice(1, 0, …)` with:

```js
const memberParty = new Set(committees.flatMap((c) => Object.keys(members(c)).map(partyOf)));
const at = groups.findIndex((g) => memberParty.has(g.party));
groups.splice((at < 0 ? 0 : at) + 1, 0, committeeGroup);
```

With the two-party sample the result is unchanged (after Acme). With Customer, Acme and Globex, and Acme and Globex members, it lands between Acme and Globex. The lane-header groups added in round 4 of the previous change (labelled groups, in order) follow `f.groups`, so screen-reader and Tab order follow automatically.

### D6. Version 1.5.0
This is a new viewer behaviour with no change to the content or capture-sheet format. The engine, validator, skill and plugin versions move together, as usual.

## Risks / Trade-offs

- **[A drag on a step could open it by accident.]** → After a drag, the next click is suppressed, and there's an e2e test for it.
- **[Pan conflicts with selecting text on structure boxes (names and notes).]** → A short click or a 5px-or-less wobble still behaves as a click, but box text can no longer be selected by dragging inside the diagram. The text is still in the step and box pages, in search and on the committee page. Accepted.
- **[A height-limited area inside a scrolling page gives nested scrolling: the wheel scrolls the diagram, then the page once the diagram reaches its end.]** → `overscroll-behavior: contain` stops the page scroll chaining unexpectedly. The area is never taller than the window, so it can always be scrolled past.
- **[WCAG 2.5.7, dragging movements.]** → Dragging is never the only way: scrollbars, the wheel, the keyboard and the "More steps" cue all still work.
- **[Very wide windows make long connectors.]** → The swimlane keeps its fixed column width. The extra width just shows more steps at once, with less scrolling.

## Migration Plan

The change is viewer-only. Existing models and snapshots are unaffected until they are re-exported with 1.5.0. To roll back, use 1.4.0.

## Open Questions

None.
