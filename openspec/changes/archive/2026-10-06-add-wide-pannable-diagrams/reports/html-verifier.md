# html-verifier report: add-wide-pannable-diagrams (task 3.1)

## Verdict: VERIFIED
Every requirement and scenario in the three delta specs is met in the running app.

**Method:**
- The verifier's own Playwright scripts, using real `page.mouse` drags and real scrollbars (Chromium without `--hide-scrollbars`).
- Author mode, plus snapshots it exported itself: `wide-tall-process`, `structure-wide`, `structure-wide-8`, `committee-three-parties`, `committee-two` and the Acme sample, plus a tall in-memory structure variant.
- Viewports 1920×1080, 1280×800, 1024×768 and 375×812.
- No console or page errors, and no non-file requests. Suites: unit 246 of 246, e2e 307 of 307.

## Evidence summary
**explorer-views**
- **Full width:** at 1920 the snapshot area is 1857px; in author mode the preview is 1857px and the area 1807px (page padding inside the preview); text stays at 615px.
- **Window height:** at 1280×800 the area is 768px tall with its bottom at 784px and a real 17px scrollbar on screen. Same at 1920 and 1024.
- **Keyboard:** across 40 arrow presses, no focused step left the area or went behind the headers. The keyboard flow is unchanged.
- **Drag:** a drag of 300/200 scrolls exactly 300/200 in the snapshot and in author mode. A drag starting on a step or a lane-header link doesn't navigate. A click (including a 3px wobble) still opens.
- **Cursors:** grab, then grabbing with no text selection, then grab.
- **Phones:** 375 keeps the list, with no pan classes. The switch happens between 767 and 768px.
- **Wheel:** scrolls inside the area, then the page at its top or bottom. Shift and horizontal wheel scroll sideways. A middle-button drag doesn't pan.

**structure-diagrams**
- 6 columns at 1024 scroll inside the area. 8 columns at 1920 give a 1872px area.
- The tall variant fits the window.
- A drag of 300 scrolls 300, and a drag starting on a box doesn't open it. A click opens the role. A focused box is scrolled into view.

**committees**
- `committee-three-parties`: Customer, Acme, Committees, Globex.
- The two-party sample and `committee-two` are unchanged.
- The lane header opens the committee.

**Regression:** all 11 sample routes at 1920, 1280 and 375 have no sideways page scroll. Only process and structure pages are full width. Persona cues work. Single file, no network. Real-names check: 0 hits in tracked files, commit messages, `dist` and the zip.

## Notes (not blocking)
1. Author mode "fills the preview": the diagram is 50px narrower than the preview because of page padding. Read as met.
2. At 1920 the header bar stays capped at 1440 (D2), so its title starts at about x=256 while the content starts at x=24. For QA's visual pass.
3. In tall structure diagrams, the party headers and band labels scroll out of view vertically. Not required.
4. The `panning` class is set on press, so a plain click briefly shows `grabbing`. This matches the spec's "closed hand while held".
