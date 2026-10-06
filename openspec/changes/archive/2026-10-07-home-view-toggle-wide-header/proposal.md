# Proposal: Viewer toggle for the home view, and a full-width header on diagram pages

## Why

- **The home view belongs to the viewer.** Since 1.6.0 the author chooses Simple or Detailed for the home page, and viewers can't switch. In testing, the author found that different viewers want different things from the same snapshot. A reviewer wants Simple; a sponsor wants the key messages and narrative. One author choice can't serve both, so the viewer should be able to flip between them.
- **The header doesn't line up on wide screens.** Since 1.5.0, process and structure pages fill the window, but the header bar and footer stay capped at 1440px and centred. On a 2560px screen the header's title starts about 550px to the right of the page heading below it, so the page looks like two layouts. QA recommended letting the header follow the content on those pages, and the user agreed.

## Who uses it and how it's shared

- **Viewers (colleagues and clients):** open the exported snapshot from email or disk as before. On the home page they can switch between Simple and Detailed at any time.
- **Authors (colleagues):** keep the optional `View:` line. It now sets the view the home page opens in, and the preview shows the same toggle viewers get.

## What Changes

- **Home view toggle.**
  - The home page gets a two-option toggle, "Simple" and "Detailed", near its heading, available to every viewer.
  - The home page opens in the author's view: `View:` in the capture sheet or `view:` in `model.md`, with Simple as the default.
  - The viewer's choice is kept in the URL, so Back and Forward, deep links and shared links keep it.
  - The toggle is keyboard operable, its state is announced, and it works on phones.
  - What each view shows is unchanged: Simple lists parties, workstreams, processes and structure diagrams; Detailed adds the purpose, narrative, key messages and persona doors.
- **Author mode.** The preview's separate "Preview … view" toggle is replaced by the same home-page toggle viewers get. The preview still says which view the snapshot opens in. Export always opens in the content's view, whatever the toggle was set to in the preview.
- **Full-width header on diagram pages.**
  - On process and structure pages at 768px and wider, the header bar's and footer's contents follow the page's full width, with the same side margin as the content.
  - On every other page the header and footer keep today's centred 1440px band.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `explorer-views`:
  - "L0 model overview": viewers can switch, the author's view is the starting view, and the choice is in the URL.
  - An added requirement: the header and footer follow full-width pages.
- `author-mode`: "Live preview" uses the viewer toggle instead of its own preview toggle.
- `capture-sheet`: "View line" sets the view the home page opens in.

## Non-goals

- Remembering a viewer's choice between visits (for example in local storage). The URL carries it within a session and in shared links.
- A view toggle on any page other than the home page.
- Changing what Simple and Detailed show.
- Widening the header on non-diagram pages.
- Any real names, brands or org data in this public repo.

## Impact

- `src/viewer/app.js`: the home-page toggle, the `view` route parameter, and the header/footer width class on process and structure routes.
- `src/viewer/route.js`: parse and format `?view=`.
- `src/author/author.js`: remove the separate preview toggle and keep the "opens in" line.
- `src/styles.css`: the toggle, and the full-width header and footer.
- Tests: existing preview-toggle tests replaced, new e2e tests.
- Release 1.8.0 (a new viewer control).
