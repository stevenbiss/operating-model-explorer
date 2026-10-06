# Proposal: People on roles, review status, and a simpler home page

## Why

Colleagues reviewing a model raised four gaps:

- **Who is the role?** Processes and diagrams refer to roles ("Account lead"), but viewers can't see who actually holds a role. They need the name, or names, without leaving the diagram.
- **Is this settled?** Most models are shared while their processes are still being worked out. Viewers can't tell a draft process from an agreed one, so drafts get read as decisions.
- **Too much on the home page.** For a review, people want to get straight to the diagrams. Key messages, narrative and persona doors push the processes and structure diagrams down the page.
- **Processes are hard to find.** There is no list of processes on the home page. Viewers have to go through a workstream or a diagram to reach one.

## Who uses it and how it's shared

- **Authors (colleagues)** add people to roles, mark processes and diagrams as agreed, and choose the home-page view in the capture sheet or content folder. The operating-model-author skill fills in people when the material names them.
- **Viewers (colleagues and clients)** receive the exported snapshot as before, by email, Teams or a file share. Nothing changes in how it's opened or shared.

## What Changes

- **People on roles.**
  - A role can list the people who hold it: an optional `People` column on the capture sheet's Roles table (names separated by semicolons), or `people:` in a role file.
  - Wherever a role is shown by name (swimlane lane headers, structure-diagram role boxes, role chips, step owners, RACI rows and committee member lists), a single person's name appears under the role name. Several people show as "Multiple people".
  - Hovering over the role, or focusing it with the keyboard, shows a pop-up listing everyone who holds it.
  - The role's own page lists them all.
  - A structure box that has its own Name text keeps showing that text, as today.
- **Review status.**
  - Each process and each structure diagram is either **Under review** or **Agreed**. Under review is the default.
  - Authors mark one as agreed with a `Status: Agreed` line in its capture-sheet section, or `status: agreed` in its file.
  - The status is shown as a text badge, not colour alone, on the process or diagram page next to its heading, on every card and list entry for it (home page, workstream pages, role pages, related diagrams) and in search results.
  - An "Under review" process or diagram also shows a short notice above the diagram saying it may still change.
- **Simple or Detailed home page.**
  - Authors choose the home-page view with a `View: Simple` or `View: Detailed` line under the capture sheet's title, or `view:` in `model.md`. Simple is the default.
  - **Simple** shows the model name, then the parties (organisation), workstreams, processes and structure diagrams.
  - **Detailed** adds the purpose, the "About this model" narrative, the key messages section and the persona doors.
  - Only the home page changes. The Key messages button, the progress bar, the persona prompt and every other page are the same in both views.
  - Viewers can't switch view. In author mode the preview shows the view that will be published, with a toggle to preview the other.
- **Processes on the home page.** A new section on the home page, in both views, lists every process with its workstream and its review status, in workstream order.
- **Capture sheet:** the new `People` column, `Status:` lines and `View:` line are all optional. The format stays at 1.
- **Authoring skill:** it fills in `People` when the material names role holders, without inventing names. It leaves status as Under review unless the colleague says a process or diagram is agreed. It doesn't set the view unless asked.

## Capabilities

### New Capabilities
- `role-people`: people listed on roles, how they're shown under role names everywhere, the hover and focus pop-up, the role page list, keyboard and screen-reader access, and small screens.
- `review-status`: the Under review and Agreed status on processes and structure diagrams, its default, validation, and where and how it's shown.

### Modified Capabilities
- `explorer-views`: "L0 model overview" becomes the Simple and Detailed home pages, with the new processes section.
- `content-schema`: `people` on roles, `status` on processes and structures, and `view` on the model, added to the element fields.
- `capture-sheet`: the Roles table gains a `People` column; Process and Structure sections gain a `Status:` line; the title block gains a `View:` line.
- `author-mode`: "Live preview" shows the published view and offers a preview toggle.
- `authoring-skill`: drafting people and status.

## Non-goals

- People as their own elements: no person pages, no people in search results, and no contact details or photos.
- Different people per process or per step. A role's people are the same everywhere it appears.
- More statuses than Under review and Agreed (for example Draft or Retired), or approval dates and approvers.
- A status on workstreams, roles or the model itself.
- Letting viewers switch between Simple and Detailed.
- Changing any page other than the home page between the two views.
- A separate "sub-programme" element. Sub-programmes appear on the home page through their structure diagrams, as today.

## Impact

- **Schema:** `role.schema.json` (`people`), `process.schema.json` and `structure.schema.json` (`status`), `model.schema.json` (`view`). The generated content reference is updated.
- **Model:** `sheet.js` (People column, Status and View lines), `validate.js` (allowed values), and `load.js` / `snapshot.js` (carry the new fields).
- **Viewer:**
  - `app.js`: the home page, status badges and notices, role people on chips, owners, RACI and committee lists, the role page, and search;
  - `swimlane.js`: people under the lane-header role name;
  - `structure.js`: people on role boxes;
  - a small shared people pop-up;
  - `styles.css`.
- **Author mode:** the preview's view toggle.
- **Samples:** both Acme forms gain people on several roles (one with several people) and one agreed process, in parity, with fictional names only.
- **Docs, template, skill and tests:** updated to match. Release 1.6.0.
