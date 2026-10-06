# html-builder report: add-people-status-simple-view

## Tasks 1.1–1.11: done
- **1.1 Schemas:** `people` on role, `status` on process and structure, `view` on model. Defaults applied at load (`view` simple, `status` under-review). A non-list `people` gets its own wording. Unit tests cover defaults, snapshot carry and invalid values.
- **1.2 Sheet:** People column split by `;`; `Status:` lines in Process and Structure sections and a `View:` line under the title, matched ignoring case and spacing, with errors for other values. Format stays 1. Six unit tests, including parity.
- **1.3 People line:** new `src/viewer/people.js`. Shown in lane headers, chips, the step owner, RACI rows, committee members, role boxes (the box's own name wins), team-box roles and the phone list.
- **1.4 Pop-up:**
  - One delegated tooltip: 150ms hover delay, immediate on focus.
  - It can itself be hovered, and closes on pointer-out, focus-out, Escape (focus stays), scroll and `pointerdown`.
  - It stays inside the window, and names are exposed through `aria-describedby`. The role page gains a "People" section.
- **1.5 Status:** `statusBadge()` (classes `rev-*`, since `.status` was already taken) on headers, cards, structure chips, role, committee and "What matters" groupings, and search results. The under-review notice sits above the swimlane and the diagram. Axe: no violations, light and dark.
- **1.6 Home page:** new section order, a processes section and Simple/Detailed. **1.7** Author toggle via `previewView()`; export stays Simple.
- **1.8 Fixtures:** 7 new, each giving exactly its intended messages.
- **1.9 Sample:** Account lead: Sam Example. Partner manager: Jo Placeholder. Solution architect: Morgan Test; Riley Demo (matching the existing box names). "Qualify an opportunity" is Agreed. Both forms 0 errors and 0 warnings, in parity.
- **1.10 Docs and skill:** capture-sheet format, authoring guide, template, SKILL.md "People and status", trials 2.41 and 2.42; existing trial 2.67 updated so names go in People.
- **1.11 Version:** 1.6.0.
- **Suites:** unit 256 of 256; e2e 309 of 309.

## Existing tests updated
Only where the new behaviour changes what's on screen: overview tests (now the Simple default), heading selectors (the badge sits inside the heading), the chip text, the phone lane text (person in brackets) and the committee `memberRows` helper.

## Decisions the orchestrator accepted
- Sample names follow the existing box names.
- Trial 2.42 uses the `rich` pack ("Win the work").
- Trial 2.67 updated.
- Role boxes with their own name still show the role's people in the pop-up.
- `rev-*` class names.
- The badge sits inside the heading.
- The phone list shows the person in brackets.
