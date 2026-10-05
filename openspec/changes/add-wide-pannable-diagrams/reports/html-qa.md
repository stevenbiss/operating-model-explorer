# html-qa report: add-wide-pannable-diagrams (task 4.1)

## Round 1 verdict: HOLD (1 blocker)

### BLOCKER
**B1. Clicking a step in a lower lane loses your place, and the step ends up cut off at the bottom of the window.**
- **Evidence:** at 1280×800 with `wide-tall-process`, the area was scrolled to `scrollTop` 500 and step s06 (at y=238) was clicked. After the re-render, `scrollTop` was 21, the step's box ran to about 801 in an 800px window, and the area's bottom edge and scrollbar were at 824, off-screen. The deep link `#/p/long-flow/s/s20` also lands with the step cut off.
- **Cause:** `onRoute()` rebuilds the view, which resets the area's scroll, and the selected-step block only scrolls the area, never the window.
- **Fix:** save and restore the area's `scrollLeft` and `scrollTop` when re-rendering the same process, then call `scrollIntoView({block:'nearest', inline:'center'})` on the selected step. The existing `scroll-padding` keeps it clear of the headers and the cue. This replaces the hand-written centring. Add a test.

### MINOR
- **M1. Header bar capped at 1440 on full-width pages.** At 2560, the brand starts at x=577 while the content starts at x=24, and the footer is the same. Recommendation: on process and structure pages, let the header and footer follow the content (a class toggled from `onRoute()`). *Not done: this reverses the "header stays capped" choice the user agreed to in D2, so it's left for the user to decide.*
- **M2.** Starting a drag clears text selected elsewhere on the page (`removeAllRanges`). Fix: remove the call; `user-select: none` already prevents selection.
- **M3.** Pressing to drag focuses the step underneath (browser default, no visible ring). No change.
- **M4.** The header shifts 7px depending on whether the page has a scrollbar (existing behaviour). Fix: `html { scrollbar-gutter: stable; }`.
- **M5.** The `can-pan` cursor can go stale after a resize until the pointer moves again. Leave it.

### Passed
| Area | Result |
|---|---|
| Axe | 0 violations across 54 runs (1920, 1280 and 375, light and dark) and the author preview at 1920 |
| Keyboard | Tab order and focus scrolling correct for steps, lane links and boxes |
| Alternatives to dragging (WCAG 2.5.7) | Scrollbars on screen, cue, wheel and keyboard all work |
| Panning feel (Chromium 153 and Edge 154) | Cursors, no text selection, no accidental opening, right and middle buttons ignored, release outside the window handled |
| Nested wheel scrolling | Passes to the page at the area's top and bottom; horizontal overscroll doesn't navigate |
| Performance (30 steps, 3 committees, CPU 6× slower) | 0 long tasks; frames 17ms at p50, p95 and max |
| Health | No console errors or network requests; no eval; self-contained, 391 KB |
| Code review and Ponytail | Lean; the B1 fix also simplifies the code; no dead code |

## Round 2 verdict: SHIP
Checked on the rebuilt engine, with fresh snapshots, in Chromium 153 and Edge 154 with real scrollbars. 0 console errors and 0 network requests.

- **B1 fixed:**
  - Clicking a step at 3 scroll positions, at each of 1280, 1024 and 1920 (9 cases, with the detail panel open and the legend wrapping): scroll is kept (500 stays 500), and the step stays fully inside the area and the window.
  - 36 Next moves: all visible. Escape returns focus to a visible step.
  - Deep links to s20, s12 and s25 at all three sizes: fully visible.
  - Keyboard flow and the 375 layout are fine.
- **M2:** an existing text selection survives a drag. **M4:** the header x position is identical on pages with and without a page scrollbar.
- **No regressions:**
  - More steps cue works.
  - All the round-1 panning checks still pass.
  - Axe: 0 violations on 16 runs (selected-step views at 1280 and 1920, light and dark).
- **Code:** the `onRoute` change is small and correct, and simpler than before.
- **Still open, minor:**
  - M1 (header width): the user's decision.
  - M3 and M5: trivial.

*Saved by the orchestrator, because html-qa is read-only. 4.1 ticked on the SHIP verdict.*
