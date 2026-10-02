# html-verifier report: add-structure-diagrams (tasks 3.1 and 3.2)

**Verdict: NOT VERIFIED.** All 29 requirements in the six delta specs are MET in the running app. The verdict fails on task 3.2: a committed file in this **public** repo contains a term from the private-names list, and so the unit suite fails (209 of 210).

Neither 3.1 nor 3.2 is ticked in tasks.md.

## How this was checked

- **Build:** I ran `npm run build` first, so `dist/operating-model-explorer.html` matches the source.
- **Browser:** I drove the built file over `file://` with Playwright, using the project's own install. The Playwright MCP blocks `file:` URLs.
  - **Author mode:** "Try the sample", the Acme capture sheet, `tests/fixtures/structure-org/`, `tests/fixtures/structure-wide/`, and about 30 in-memory variants of them, loaded through the real "Load .zip" button.
  - **Viewer mode:** a snapshot of the sample exported through the real Export button. I checked a deep link opened in a new tab, drill-down and Back, and the 375px layout.
  - **Widths:** 1280×800, plus 375×812 for mobile and 1024×800 for wide diagrams. Light and dark.
- **Network and console:** across every run there were **0 network requests** other than file:, data: and blob:, and **0 console errors or page errors**. The snapshot has no `script[src]` or `link[href]`.
- **Evidence:** screenshots are in the workspace's gitignored `scratch/verifier-add-structure-diagrams/`, two levels up from this project. I name them below by file name. The exported snapshot is saved there as `acme-sample-snapshot.html`.
- **Cross-checks:** I reran the suites. `npm run test:unit` gives **209 pass, 1 fail** (see 3.2), and Playwright gives **240 / 240 pass**.

## 3.1 Requirements

### structure-diagrams

| Requirement | Result | Evidence |
|---|---|---|
| Structure element | MET | **Own vocabulary:** structure-org "Regional market" shows the kind "Local market" and the bands Strategic, Tactical and Operational in order, with 0 errors (`31-own-vocabulary-local-market.png`). **Missing bands:** removing `bands` gives "The required field "bands" is missing", naming `structures/02-regions.md · regions` (`50-missing-bands.png`), plus knock-on box-band errors. **Narrative:** the body renders under "About this structure" (`02-main-diagram-1280.png`). No band, kind or name has a built-in meaning. |
| Bands | MET | **Sub-bands:** "Programme management" is one row whose label spans the two sub-rows "Harbour" (y 429) and "Summit" (y 550) (`32-subbands-same-role-two-bands-unused-party.png`). **Errors:** "The band "Summit" is a sub-band with bands of its own. Bands can be nested only one level deep." (`51`). The parent-band error suggests "Harbour or Summit" (`52`). "Two bands in this structure use the id "tactical"" (`53`). |
| Boxes | MET | **Content:** the box shows "Account lead / Sam Example / Grade: Director" under the Acme column (`33`). **Team box:** "Globex Solutions" lists its roles, Pricing analyst and Solution architect (`02`). **Role and team:** "The box in the band "Delivery" names both a role and a team. A box names either a role or a team." (`54`). **Same role twice:** Account lead appears in Harbour as "Sam Example" and in Summit as "Quinn Lighthouse", with 0 errors (`32`). |
| Party columns | MET | **Unused party:** structure-org has 3 parties, and "Coastal programme" shows only Acme Corp and Globex, in model order (`32`). "Regional market" uses all three (`31`). Column headers carry the party's name, mark and brand colour. The empty cell (Delivery, Globex) is a dashed empty cell (`02`). |
| Lines | MET | **Across parties:** a horizontal line joins (Leadership, Acme) and (Leadership, Globex), with a "Joint steering" pill. **Down a column:** a vertical line joins (Leadership, Acme) and (Delivery, Acme) (`33`). **No direction:** the overlay contains 0 `marker` or `polygon` elements, and the `<line>`s have no marker attributes. **Errors:** the same cell gives "This line joins the cell (Leadership, Acme Corp) to itself." (`55`). A repeated line gives a warning, "…A line has no direction, so the same two cells in either order are the same line." (`56`). |
| References inside a structure | MET | `acount-lead` gives "Did you mean account-lead?" (`56`). `programm` gives "Did you mean programme?". `opens: regionz` gives "Did you mean regions?". `presale` gives "Did you mean presales?" (`57`). Each error names the structure file and id. Listing itself in `related` gives the warning "This structure lists itself as related." (`56`). |
| One main diagram | MET | **None:** "None of the structures is marked as the main diagram…" names all three diagrams, and Export is disabled (`58`). **Two:** "More than one structure is marked as the main diagram: "Regional market" and "Harbourside partnership"" (`59`). **No structures:** 0 errors and 0 warnings, with no main-diagram message (`60`). |
| Related diagrams | MET | **Both sides:** "Harbourside partnership" lists `related: [programme]`, and "Coastal programme"'s Related panel links back to Harbourside partnership. **Workstreams:** the panel shows "Workstreams: Presales", which opens `#/w/presales`. **Drill-down:** the "Open" link on the sample's Harbour account band opens `#/d/harbour-account` (`04-drilldown-harbour-account.png`). |
| Diagram route and breadcrumb | MET | The route is `#/d/<id>`. Copying the URL in the exported snapshot and opening it in a new tab shows the same diagram, with the breadcrumb "<model> › <structure>", for example "Harbourside demo › Harbourside partnership" (`20-snapshot-deeplink-main-diagram.png`). Back after a drill-down returns to `#/d/acme-globex-partnership`, in author mode and in the snapshot. |
| Open a box | MET | The Account lead box opens `#/r/account-lead`. The Globex Solutions team box opens `#/e/globex-solutions`. |
| Persona highlight in diagrams | MET | **Your role:** the sample persona "Acme account lead" marks only the Account lead box "Your role". "Globex solution team" marks the team box and Solution architect (`09-persona-your-role.png`). "Pricing view" marks the team box that holds Pricing analyst (`34`). **Nothing hidden:** boxes and lines are 7/3 on the sample with no persona and with each of the 3 personas, and 5/2 (one label) on structure-org with no persona and with each of 2 personas. |
| Change markers in diagrams | MET | With markers off, the removed "Legal counsel" or "Partner manager" box is absent (7 boxes; 5 on structure-org). With Show changes on, it appears with "Removed" and "Today: Legal counsel sat on the steering group." (`10-change-markers-removed-box.png`, `35-removed-box-markers-on.png`). |
| Keyboard and screen-reader access | MET | **Tab order:** Account lead (Leadership, Acme), Partner manager (Leadership, Globex), the "Open Harbour account" band link, Bid manager (Harbour, Acme), Globex Solutions (Harbour, Globex), and so on, then the Related links. Every stop has `:focus-visible` with a 3px solid outline (`08-keyboard-focus-ring.png`). Enter on a focused role box opens its profile (snapshot). **Screen reader:** the aria snapshot of the (Leadership, Acme) cell has the heading "Acme Corp , Leadership" and the list item "Related to: Globex, Leadership: “Joint steering”". The line overlay is `aria-hidden="true"`. |
| Diagrams on small screens | MET | At 375px, bands are H3 and sub-bands H4, in order. Each cell shows its party label, then its boxes, then visible "Related to: …" lines. The SVG overlay is `display: none`, and horizontal page overflow is 0, in author mode and in the snapshot (`11-main-diagram-375-stacked.png`, `22-snapshot-375.png`). |
| Wide diagrams scroll within their own area | MET | structure-wide at 1024 has 6 columns. The container is `overflow-x: auto`, with scrollWidth 1464 and clientWidth 926, and the page overflow is 0. Focusing the last box sets the container's scrollLeft to 538 while window.scrollX stays 0, and the box is fully in view (`40-wide-1024-scrolled-container.png`). |
| Sample diagrams | MET | The folder and sheet forms both load with 0 errors and 0 warnings (`68-sheet-acme-clean.png`). The main diagram has sub-bands, a team box, a box with name and note, the labelled lines "Joint steering" and "Weekly bid call", a band that opens "Harbour account", and a related workstream (`02`). Names are fictional. |

### content-schema

| Requirement | Result | Evidence |
|---|---|---|
| Content folder layout | MET | `minimal-model` gives 0 errors. `missing-model` gives "No model.md found at the top of the folder", and Export is disabled. A `type: structure` file moved into `roles/` loads with 0 errors and 0 warnings and opens at `#/d/regions` (`61-structure-in-roles-folder.png`). |
| Element types and fields | MET | The sample has every type, including 2 structures and a decision step with labelled branches. `missing-name` gives "The required field "name" is missing", naming the file. `duplicate-id` names both files. A structure and a workstream that share `presales` give "The id "presales" is also used by structures/02-regions.md" (`62`), plus a knock-on error (see the notes). |
| References between elements | MET | `unknown-owner` names the process file, the step, `sol-arch` and "Did you mean solution-architect?". `globx` on a line gives "The line party "globx" does not match any party. Did you mean globex?", naming `structures/03-market.md` (`63`). |

### capture-sheet

| Requirement | Result | Evidence |
|---|---|---|
| One document, fixed sections | MET | The Acme sheet gives 0 errors and 0 warnings and previews both diagrams (`68`). A sheet without `## Roles` gives "The sheet has no "Roles" section. Add a "## Roles" heading…". A `## Structure: Partnership` section gives no unknown-section warning, and the overview offers "Partnership" (`69-sheet-structure-written.png`). |
| Tables recognised by column name | MET | A Roles table without Party gives "The Roles table has no "Party" column." A Lines table without To party gives "Structure: Harbour account › Lines: The Lines table has no "To party" column." (`67`). The reordered-columns scenario is covered by the passing e2e test. I did not re-run it by hand. |
| Structure sections | MET | **Written in a sheet:** 2 bands, one inside the other, three boxes and a labelled line render with the sub-band (`sd-sub`) inside Leadership, the boxes in the Acme and Globex columns, and the "Joint steering" line (`69`). **Unknown band:** "Structure: Harbour account › Boxes › row 3 (Bid tem) … Did you mean Bid team?" (`64`). **Role and team:** "…row 3 (Bid team) … Fill in only one of the Role and Team columns." (`65`). **Missing Bands:** "Structure: Harbour account: This structure has no "### Bands" subsection." (`66`). **Parity:** both Acme forms list the same diagrams, and unit test 2.54 passes. |

### explorer-views

| Requirement | Result | Evidence |
|---|---|---|
| L0 model overview | MET | The overview shows the name, purpose, key messages, value streams, the Structures list, parties and personas (`01-sample-overview-author.png`). In structure-org, where the main diagram is last in the content, the cards run market (tagged "Main structure"), then programme, then regions, each with its kind and each link opening its diagram (`30`). With no structures, there is no list. |
| L1 workstream view | MET | The outline Presales in structure-org shows "Outline only" with no empty process list, and "Related structures: Harbourside partnership". The sample's Presales links to the main diagram (`06`). |
| Role profile | MET | Account lead lists its steps under both processes, and under "Structures with this role" it lists "Acme + Globex partnership" and "Harbour account" (`05`). In structure-org it lists both diagrams. |
| Search | MET | "Riley", which appears only as box name text, returns 1 result under Structures: "Acme + Globex partnership — Riley Demo · Solution architect", which opens the diagram (`07`). Note text ("Grade: Director") also matches. Searching for a step still works (regression pass). |

### theming

| Requirement | Result | Evidence |
|---|---|---|
| Terminology labels | MET | With `structure: Org model` / `structures: Org models`, the overview heading, the "Main org model" tag, the eyebrow "ORG MODEL", the Related panel "Org models", "About this org model", search groups and the role profile all change. "structure" appears in no visible text on any of 7 routes (`70`, `71`, `72`). The sample's own workstream rename ("Value stream") leaves no "workstream" text or aria-label on the diagram pages or the workstream page. |

### authoring-skill (from `reports/skill-trials.md` and the shipped skill)

| Requirement | Result | Evidence |
|---|---|---|
| Draft first, interview when context is thin | MET | The trials report shows draft-before-question for `rich`, and a purpose-first single question with no sheet for `thin`. `docs/interview-guide.md` and the skill reference put structure diagrams at step 6, after processes and before personas, as the spec orders. |
| Structure diagrams from org material | MET | The SKILL.md "Structure diagrams" subsection and the interview guide cover the spec's points: the author's own band names and kind, Name and Note, undirected lines, `Main: yes` only when clear, and open questions for anything unplaced. Trial 2.67 produced two sections with exactly one main, linked by Related and Opens, and 0 errors in the engine. Trial 2.68 produced no main, an open question asking which is main, and the expected validator error left for the colleague. **Caveat (accepted):** the harness blocked the skill from running its validator, so the tester validated each sheet. The engine copy in `skills/operating-model-author/engine/` is byte-identical to `dist/`. |

### Builder deviations: do they still meet the spec?
1. **The schema spells out two levels of bands, and validate.js rejects deeper nesting.** OK: the nesting error was observed (`51`).
2. **Boxes are `<a href>` rather than buttons.** OK: the spec asks for Tab and Enter, and both work. The design's word "buttons" isn't a spec requirement.
3. **A sheet structure with the same name as the model gets the id `<name>-structure`.** OK, invisible to authors.
4. **Some checks run only in the sheet reader.** OK: no duplicate messages were seen.
5. **Spec readings.** The role profile counts role boxes only, which matches "a box for that role". Removed boxes are left out of the profile while markers are off, which is consistent with how removed steps behave. A line to a parent band is written into the first sub-band cell only: (Account management, Globex) appears as "Related to" text in the Harbour/Globex cell. That is acceptable, but see note 2.
6. **The section heading reads "Roles and teams by party".** OK.

### Regression pass over the main specs
I checked these in the browser on the sample:
- **explorer-views:** overview, workstream, process swimlane, role profile, search, and key messages.
- **persona-lens:** the arrival prompt, the "Your lane" and "Your step" cues on the swimlane, and the "What matters for me" view (`?persona=acme-account-lead`).
- **party brands:** marks and colours on the header, overview, swimlane and diagram columns, in light and dark.
- **theming:** the workstream and structure renames.
- **capture-sheet:** missing section, missing column, and the clean Acme sheet.
- **content-schema:** the five unchanged scenarios above.
- **process at 375:** no horizontal scroll.

No regressions. Playwright passes 240 / 240, including the swimlane, persona, brand, labels and axe specs.

## 3.2 No real names, clients or org data: NOT MET

- **Guard result:** I ran the guard's own regex, `PRIVATE_NAMES` from `tests/private-names.js` (case-insensitive, whole word), over every file in the working tree, the skill zip, HEAD and the full git history. The working tree contains `examples/`, `tests/`, `docs/`, `skills/`, `openspec/`, `src/`, `templates/`, `dist/` and the README.
- **Clean:** `examples/`, `tests/`, `docs/`, `skills/`, `src/`, `templates/`, `schema/`, `scripts/`, `dist/` (including the skill zip) and the README have **0 matches**. The sample and fixture names are fictional.
- **Expected:** zero matches anywhere in the repo.
- **Observed:**
  - `openspec/changes/add-structure-diagrams/reports/html-tester.md`, lines 110 to 115, has **6 matches**. The "Files" list gives absolute Windows paths, and the local OneDrive folder name in those paths contains the employer's name. It was committed in `22c8bf3`, which is pushed to `origin/main`, and the GitHub repo is **PUBLIC**.
  - In git history, the earlier `proposal.md` example the builder mentioned was committed in `d57fad2` and removed in `31c0a94`. Both commits are pushed, so the term is still readable in the public history.
  - The unit test "the skill folder, the trial packs and the planning docs (openspec/) contain no real company names" therefore **fails now**: `npm run test:unit` gives 209 / 210. The tester reported 210 / 210 because it wrote its report after running the suite. Task 2.69 ("the full existing suite still passes") is therefore no longer true either.

**Fix for the builder or orchestrator:**
1. Replace the absolute paths in `reports/html-tester.md` with project-relative ones.
2. Rerun `npm run test:unit`, which should give 210 / 210.
3. Make agent reports always use project-relative paths.

**User decision needed:** scrubbing the public history (`d57fad2`, `31c0a94`, `22c8bf3`) needs a history rewrite and a force-push. That is the user's call.

## Out-of-scope additions
None found. Everything visible traces back to a spec or the design:
- the "Roles and teams by party" and "About this structure" headings;
- the self-`opens` warning, which the spec covers ("relates to or opens itself");
- the sheet-only check on the `Main:` value.

## Notes (non-blocking)
1. **Stray space in the screen-reader heading:** the cell heading reads "Acme Corp , Leadership", because of a space between the mark markup and the visually hidden band text. It's cosmetic (the tester raised it too).
2. **Lines to a parent band:** a line to a parent band is described only in the first sub-band cell of that column. A reader of the Summit/Globex cell doesn't hear it.
3. **Noisy knock-on errors:**
   - A missing `### Bands` gives 1 useful error plus 10 knock-on "band does not match" errors.
   - A shared structure and workstream id gives a second error, "…is a structure, not a workstream".
   - Both still meet the spec.
4. **Sample breadcrumb (intent):** the sample model and its main diagram are both named "Acme + Globex partnership", so the diagram breadcrumb reads "Acme + Globex partnership › Acme + Globex partnership". It meets the spec, but a slightly different diagram name, for example "Partnership structure", would read better.
5. **Not yet due, for the package step:** `dist/acme-sample.html` is still the pre-structures demo (dated 1 October), and the engine still reports 1.2.0. Tasks 5.1 and 5.2 cover both.
6. **Pre-existing and outside this change:** a sheet with no Roles section repeats the persona-row error for Delivery manager twice.

## Open questions for the user
1. **History:** rewrite and force-push the public repo history to remove the term from `d57fad2`, `31c0a94` and `22c8bf3`? Or accept it in history and only fix the current file?
2. **Sample naming:** rename the sample's main diagram so its breadcrumb doesn't repeat the model name?
3. **Default term:** keep "Structure" (already confirmed as a key decision), which resolves design.md's open question?

## Overall: **NOT VERIFIED**
| Unmet item | Expected | Observed |
|---|---|---|
| 3.2 No real names, clients or org data in the repo | 0 matches against the private-names guard | 6 matches in the committed `reports/html-tester.md` (absolute paths with the employer's name in the folder name), plus 2 pushed historical commits. The unit guard test fails, at 209 / 210. |
| 2.69 Full suite passes (ticked) | `npm run test:unit` all pass | 1 failure, caused by the item above |

All 29 delta-spec requirements are MET. Once the tester report uses relative paths and the unit suite is back to 210 / 210, this change should verify. The history question is for the user.

## Re-check after fix (orchestrator)

- The only failure (3.2) was absolute paths in `reports/html-tester.md` that contained the local OneDrive folder name. These are now project-relative paths.
- The private-names scan over every tracked file, this report included, now finds **0 matches**.
- `npm run test:unit` gives **210 / 210**.
- No app code changed, so the 29 MET requirements from 3.1 stand.
- Verdict after the fix: **VERIFIED**.
- The earlier occurrences remain in the pushed history (`d57fad2`, `22c8bf3`). Whether to rewrite it is the user's decision.
