# html-tester report: add-wide-pannable-diagrams

## Overall: PASS
All 18 scenarios have passing tests, and tasks 2.1–2.19 are ticked. No app source was changed.

| Suite | Result |
|---|---|
| Unit | 246 of 246 pass |
| E2E | 307 of 307 pass (293 existing + 14 new) |
| New tests, `--repeat-each=3` | 42 of 42 pass |

New tests are in `tests/e2e/wide-diagrams.spec.js`, and its header lists the reused tests. Drags use real `page.mouse` down, move in 15 steps, up.

## Coverage
**explorer-views**
- 2.1 More steps cue (1024): new.
- 2.2 Full width: two new tests, one for the snapshot (area at least 1850px at 1920) and one for author mode (fills the preview).
- 2.3 Both scrollbars on screen: new. Height at most 800, bottom edge on screen, overflows both ways, scrolls without moving the page.
- 2.4 Drag the swimlane: new. 300/200 within ±10px; the page doesn't move, nothing opens, no text is selected.
- 2.5 Drag starting on a step: new. It pans, the URL is unchanged, and the next click still opens.
- 2.6 Click still opens a step: new.
- 2.7 Hand cursor: new. grab, grabbing, then grab.
- 2.8 Keyboard unchanged: reuses `explorer-views` 2.36.
- 2.9 Phones keep the list: new (@mobile-only).

**structure-diagrams**
- 2.10 Many parties: reuses `structure-diagrams` 2.33 (six columns).
- 2.11 Full width: new (`structure-wide-8`).
- 2.12 Drag a wide diagram: new, plus a check that a drag starting on a box opens nothing.
- 2.13 Click still opens a box: new.

**committees**
- 2.14–2.17: reuse `committees` tests 2.16–2.19.
- 2.18 Committee after the first party with members: new (`committee-three-parties`: Customer, Acme, Committees, Globex).

**2.19 Full suite:** PASS.

## Note
Headless Chromium hides scrollbars, so 2.3 checks for `overflow-x: auto` or `scroll` instead of measuring the scrollbar. The specified assertions (bottom edge on screen, clientHeight < scrollHeight) are unchanged.
