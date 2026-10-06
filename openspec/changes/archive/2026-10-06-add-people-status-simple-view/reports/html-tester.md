# html-tester report: add-people-status-simple-view

## Overall: PASS
Tasks 2.1–2.40 and 2.43 all pass. 2.41 and 2.42 are skill trials, run separately (see `skill-trials.md`). No app source was changed.

| Suite | Result |
|---|---|
| Unit | 256 of 256 pass |
| E2E | 348 of 348 pass (309 existing + 39 new: 35 desktop, 4 mobile) |
| New file run 3 times | 117 of 117 pass |

New tests are in `tests/e2e/people-status-view.spec.js`, and its header lists the reused tests: 2.24 also uses `explorer-views` 2.23 and `structure-diagrams` 2.55; 2.28 uses `structure-diagrams` 2.56; 2.37 uses `author-mode` 2.51.

## Notable checks
- **Pop-up:** real mouse hover with a 400ms wait; title and names in order; never overlaps its element; closes on pointer-out; Escape keeps focus; accessible description contains every name; stays inside the window at the right edge and in the detail panel.
- **Markup in a name:** `<img src=x onerror=alert(1)>` shows as literal text on the role page, the lane header, the pop-up and the chip. No element is created and no dialog opens.
- **Variants** (`Status: Done`, `View: Full`, Detailed Acme) are built in memory.

## Observations
- The two Acme forms use different process ids, so the people and status parity tests compare by name.
- Reload (2.37) uses the in-memory folder stand-in; the real `showDirectoryPicker` dialog needs a manual check.
