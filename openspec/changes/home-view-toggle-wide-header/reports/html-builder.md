# html-builder report: home-view-toggle-wide-header

## Tasks 1.1–1.5: done
- **1.1 Route:** `?view=simple|detailed`, exact lowercase, stored as `route.home` because `route.view` is already the page type. `formatRoute(r, base)` writes it only when it differs from the model's view, and it's carried through every link, persona, search and redirect. New unit test.
- **1.2 Toggle:** `role="group"` "Home page view" with Simple and Detailed `.btn` buttons (`aria-pressed`) under the h1. Focus returns to the pressed button, the live region announces the change, and switching replaces the current history entry (like persona and "Show changes"). Checked at 2560, 1920, 1280 and 375, light and dark: Back from a process keeps Detailed, Enter and Space work, it wraps at 375.
- **1.3 Author mode:** the author-only toggle and `previewView` plumbing are removed. The preview head reads "Snapshot opens in: Simple view". Tests 2.38–2.40 were replaced; `content-schema` 2.1 now uses the preview's toggle.
- **1.4 Header:** `body.full` on process and structure routes uncaps the header bar, sub-bar and footer. On a process page, the model name and heading are both at 24px (2560, 1920 and 1280) and 16px at 375. The home page keeps the 1440px band; the author bar stays capped.
- **1.5 Docs:** README, the authoring guide, the capture-sheet format and the model schema description now say viewers can switch. Version 1.8.0.
- **Test artefact fixed:** in `party-brands` 2.33, the pointer rested on a card after Skip; the test now moves the mouse away before reading colours.
- **Results:** unit 280 of 280; e2e 389 of 389.

## Implementation choices accepted by the orchestrator
- `route.home` as the field name.
- `formatRoute` takes the model's view as a second argument.
- Switching views replaces the history entry.
