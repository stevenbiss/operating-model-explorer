# Design: People on roles, review status, simpler home page

## Context

See proposal.md (Why) and the delta specs. The relevant parts of the engine today:

- **Roles are shown by name in several renderers:**
  - the swimlane lane headers, as SVG text in `swimlane.js`;
  - structure role boxes, as HTML in `structure.js`, which already show a box's own `name` text;
  - `roleChip()`, step-detail owner and RACI rows, and committee member lists, all in `app.js`;
  - the phone `flowList()`.
- **Element fields.** Fields go through JSON schemas (`schema/*.schema.json`) and then `validate.js`. The capture sheet (`sheet.js`) turns tables and `Key: value` lines into the same documents a folder would produce, and a parity test checks the two Acme forms match.
- **Badges.** Change badges (New, Changed, Removed) already exist as text pills through `badge()`.
- **Home page.** `overview()` renders the hero (name, purpose, body), key messages, workstreams, structures, parties and persona doors.
- **Author mode.** `author.js` renders the report and the preview, which uses the same `render()` as a snapshot.

## Goals / Non-Goals

**Goals:**
- Three small, optional content fields (`people`, `status`, `view`), each with one way to write it in a folder and one in a sheet.
- One shared people pop-up and one status badge helper, reused by every renderer.

**Non-Goals:**
- Person elements, statuses on other element types, and a viewer switch for the view.

## Decisions

### D1. Stack: vanilla, in the existing esbuild single-file bundle
No new dependencies. The pop-up is a single positioned `<div>`, and the rest is markup and CSS.

### D2. Field names and values
- **`people: [..]` on roles.** In the sheet, a `People` column added to the role column spec, split by `;`.
- **`status: under-review | agreed` on processes and structures.** The default is applied at load (`status ?? 'under-review'`) so viewer code never deals with a missing value.
  - In the sheet, a `Status:` line is added to the allowed keys of the Process and Structure sections. Its value is normalised (`nameKey`: "Under review", "under-review" and "UNDER REVIEW" all match).
  - Top-level `status` doesn't clash with `change.status`, which is nested.
- **`view: simple | detailed` on the model.** In the sheet, a `View:` line is added to the title block's allowed keys, next to `Format:`, `ID:` and `Version:`.
- Rejected: `review:` or `agreed: true` as the field name. `status` reads naturally in a sheet ("Status: Agreed"), and a boolean can't grow later.

### D3. People line: one helper per output type
- A `peopleLine(role)` helper returns `''`, the single name, or `'Multiple people'`.
- **Swimlane:** the lane header gains one muted line after the role name (and before the team), using the existing wrap and height logic. Compact lanes stop being compact when they have a people line, the same as with other cues.
- **HTML renderers** (chips, owner, RACI, committee members, structure role boxes, phone list) add a `<span class="people">` under or after the name.
- **Structure boxes:** the box's own `name` wins (spec), so `box.name ?? peopleLine(role)`.
- **Team boxes:** their role list gets people lines too, through the same helper.

### D4. People pop-up: one delegated tooltip
- Every role element that has people gets a `data-people="<role id>"` attribute:
  - the SVG lane-header link;
  - chips, owner, RACI and committee links;
  - structure role boxes.
- A single hidden element `<div id="om-people-tip" role="tooltip">` is created once by the viewer, in the snapshot and the author preview alike.
- **Delegated listeners** (`pointerover` / `pointerout`, `focusin` / `focusout` and `keydown` Escape) fill it with the role name and a list of names, and position it next to the element's `getBoundingClientRect()`. It flips above or left when it would leave the window, and it's hidden on scroll.
- **Hover delay.** A short delay (about 150ms) on hover, and none on focus, so moving the pointer across a swimlane doesn't flash pop-ups.
- **Screen readers.** The tooltip isn't relied on: each role element gets `aria-describedby` pointing to a per-render hidden `<span id="om-ppl-<role>">` holding "People: a, b". A plain `title` attribute was rejected, because native tooltips can't be styled, are slow, and don't appear on keyboard focus.
- **Touch.** No hover, so the pop-up isn't shown. The person line and the role page carry the names (spec).
- **Drag to pan.** The tooltip hides on `pointerdown`, so it doesn't follow a pan.

### D5. Status badge and notice
- A `statusBadge(el)` helper returns `<span class="status status-agreed">Agreed</span>` or `<span class="status status-review">Under review</span>`.
- **Visual style.** To stay clearly different from the change badges:
  - Under review is an outlined amber pill with a small clock-like dot;
  - Agreed is a filled green pill with a tick.
  - The text is always present, the colours come from engine tokens checked for AA in both themes, and neither uses brand colours.
- **Where it's used:** the process and structure page headers, `processCard`, `structureCard`, the related-diagram panel entries, the role and committee step groupings (once per process heading), "What matters for me" process headings, and search results for processes and structures.
- **Notice.** `<p class="review-note">` above `.swim-wrap` and `.sd-scroll` when under review: "This process is under review and may still change." It uses the process or structure label term.
- Workstream cards don't get a status; that's out of scope.

### D6. Home page: one function, two views
`overview()` reads `view = route.previewView ?? M.model.view ?? 'simple'` and builds sections in the new order:

| Order | Section | Simple | Detailed |
|---|---|---|---|
| 1 | Hero name | yes | with purpose and body |
| 2 | Key messages | no | yes |
| 3 | Parties ("organisation") | yes | yes |
| 4 | Workstreams | yes | yes |
| 5 | Processes (new) | yes | yes |
| 6 | Structure diagrams | yes | yes |
| 7 | Persona doors | no | yes |

- **Processes section:** `M.order.workstream.flatMap(w => E[w].processes)`, plus any process whose workstream is unknown at the end. It reuses `processCard`, with the workstream name as an eyebrow and the status badge.
- **Viewer switching.** No viewer control exists. `previewView` is set only by author mode (D7), and is never written to the URL or the snapshot.

### D7. Author-mode preview toggle
- The preview head gains a line: "Published home page: Simple view", plus a toggle button "Preview Detailed view" (`aria-pressed`).
- Pressing it re-renders the preview with `previewView` set to the other view, and pressing again resets it. The state lives in author mode only.
- Export always calls the snapshot builder with the model as loaded, so the toggle can't leak into the export (spec scenario).

### D8. Samples, skill and docs
- **Acme sample, in both forms and in parity:**
  - People: Account lead has one person ("Sam Example"); Solution architect has two ("Alex Sample; Jo Placeholder"); Partner manager has one.
  - Status: "Qualify an opportunity" is `Status: Agreed`; "Build the proposal" and both structures stay under review.
  - No `View:` line, so the demo shows the new Simple default.
  - The existing structure box "Sam Example" stays as box text.
- **Skill:** a short "People and status" step in SKILL.md. Org-chart names go in the People column when they name the role's holder generally. A box's Name column is used only when a box's holder differs, for example a role held by different people per account. It never invents names, leaves status as Under review unless told, and leaves `View:` alone unless asked.
- **Docs:** the capture-sheet format (People column, Status and View lines), the authoring guide (when to mark agreed, Simple vs Detailed) and the template comments.

### D9. Version 1.6.0
Three additive content fields and new viewer features, with no format change. All versions move together.

## Risks / Trade-offs

- **[Every existing model shows "Under review" everywhere after the upgrade.]** → This is what the user asked for (review is the default). The release notes tell authors to add `Status: Agreed` where it applies.
- **[Simple is the new default, so existing models lose key messages and purpose on the home page when re-exported.]** → Again by request. The release notes give the one-line `View: Detailed` fix, and the Key messages button still reaches them in Simple view.
- **[Tall lane headers in a busy swimlane.]** → It's one muted line, only for roles with people, and the swimlane already sizes lane headers to their content.
- **[A role's people may differ per structure box, e.g. per account.]** → The box Name text still wins on boxes. People on roles are the general holders.
- **[Hover pop-ups can be annoying.]** → A 150ms delay, closing on pointer-out, Escape and scroll. It's never the only source of the names.
- **[People are personal data in a shared file.]** → Only names, and only what the author enters. The repo's samples and tests use fictional names, guarded by the private-names check.

## Migration Plan

The change is additive. Old content loads unchanged. Re-exported snapshots show "Under review" badges and the Simple home page unless the author adds `Status: Agreed` or `View: Detailed`. Release 1.6.0. To roll back, use 1.5.0.

## Open Questions

None.
