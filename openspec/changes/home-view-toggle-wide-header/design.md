# Design: Viewer toggle for the home view, full-width header on diagram pages

## Context

- **Home view today.** `overview()` in `src/viewer/app.js` picks the view from `previewView ?? M.model.view ?? 'simple'`. In author mode, `previewView` comes from `render()`'s third parameter, set by the preview toggle in `src/author/author.js`.
- **Routes** are hash fragments with query parameters (`?persona=`, `?changes=1`, `?only=1`, `?q=`), parsed and formatted in `src/viewer/route.js`, so Back, Forward and copied links reproduce state.
- **Header and footer.** `.bar-in` caps the header bar and footer at 1440px, centred. Process and structure pages use `page page-full` (no cap) since 1.5.0.

## Goals / Non-Goals

**Goals:**
- One toggle, shared by viewers and the author preview, with its state in the URL like the other view state.
- A header and footer that line up with full-width pages, and no change elsewhere.

**Non-Goals:**
- Persisting the choice across visits, or a toggle on other pages.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies.

### D2. `?view=` route parameter
- `parseRoute` reads `view` as `simple`, `detailed` or `null`; anything else counts as `null`. `formatRoute` writes it only when it differs from the model's own view, so the default URL stays clean.
- `overview()` uses `route.view ?? M.model.view ?? 'simple'`.
- Navigation keeps the parameter, as it does for `persona` and `changes`, so pressing Back to the home page restores the choice.
- Rejected: storing the choice in local storage. It's invisible in shared links, and it's per-device state the spec doesn't ask for.

### D3. The toggle
- **Markup:** a two-button group under the home page's heading, `<div role="group" aria-label="Home page view">`, with "Simple" and "Detailed" buttons that use `aria-pressed`.
- **Behaviour:** activating the other button changes the route (`view=`) and re-renders the home page. Focus is put back on the pressed button, and the existing live region announces "Detailed view" or "Simple view".
- **Styling:** it reuses the existing `.btn` styles plus the pressed style added for the author toggle in 1.6.0 (filled background with a ✓).
- **Phones:** at 375px the group wraps under the heading, with no horizontal scroll.
- Rejected: a checkbox-style switch. Two named options read more clearly than an on/off switch called "Detailed".

### D4. Author mode
- The author-only "Preview … view" button and its `previewView` plumbing (`render()`'s third parameter) are removed.
- The preview head keeps one line: "Snapshot opens in: Simple view" (from the content).
- The preview's own home-page toggle drives the preview through the same route parameter. That parameter lives in the preview's state, never in the content, so export is unaffected.

### D5. Full-width header and footer
- `onRoute()` sets `document.body.classList.toggle('full', view is process or structure)`.
- CSS: `body.full .topbar .bar-in, body.full .subbar .bar-in, body.full .foot .bar-in { max-width: none; }`, so the padding gives the same 24px margin as `.page-full`, and 16px under 768px, where nothing changes in practice.
- **Author mode:** the author bar stays capped. The preview's own viewer header and footer follow the same class, scoped to the preview.

### D6. Version 1.8.0
A new viewer control, with no content or format change. All versions move together.

## Risks / Trade-offs

- **[The header width jumps when moving between the home page and a process page on a wide screen.]** → QA judged this better than a permanent misalignment, and it only happens above 1440px.
- **[Older links without `?view=` open in the author's view.]** → That's the intended default.

## Migration Plan

Viewer-only. Existing content and snapshots are unaffected until re-exported. To roll back, use 1.7.1.

## Open Questions

None.
