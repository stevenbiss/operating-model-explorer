# html-verifier report: add-committee-decisions (round 1)

## Verdict: NOT VERIFIED
The app meets every app-side requirement, and the regression pass is clean. VERIFIED is held back by:
1. **authoring-skill: PARTIAL.** Skill trials 2.81 and 2.82 were walk-throughs by the tester agent, who had already read the checklist and played both sides of the "confirm" exchange. They need re-running in a fresh, independent context.
2. **Docs defect.** The `## Committees` row is duplicated in the sections table of `docs/capture-sheet.md` (lines 131–132) and in the skill's `references/capture-sheet-format.md`. It was introduced in 91026a7, with task 1.12 ticked.

Task 3.2 (no real names) passes and is ticked: 0 hits across tracked files, history and built files. 3.1 is not ticked.

## Method
- Drove the built `dist/operating-model-explorer.html` with Playwright.
- Loaded the sample folder, the Acme sheet (as a folder), `sheet-committees`, all 13 `committee-*` fixtures and 10 scratch variants.
- Exported the Acme sample snapshot through the Export button and checked it at 1280 and 375, in light and dark.
- Zero console errors and zero non-file requests.

## Evidence summary
| Spec › Requirement | Result |
|---|---|
| committees: element, checks, owned steps, RACI, lanes, members panel, handoffs, page, keyboard and screen readers, small screens, sample | MET |
| content-schema: folder layout, element types, references, removed owners, one accountable | MET |
| capture-sheet: sections, names, Committees table | MET |
| explorer-views: L2, L3, role profile, search, small screens, element pages | MET |
| persona-lens: highlight, What matters for me | MET |
| theming: terminology labels ("Steering group") | MET |
| authoring-skill: committees from joint decisions | PARTIAL (walk-through only) |
| Regression over main specs (snapshot smoke, unit suite, CLI validate) | MET |

## Non-blocking notes
1. `proposal.md` and `design.md` still described the lane header as listing members. *Fixed by the orchestrator after this report.*
2. The committee lane-header link sits inside the swimlane's `group "Roles"`, so screen readers announce it as a role.
3. The removed-committee warning names the committee by id, not by name.
4. The "What matters for me" intro says "owner or in the RACI" and leaves out committee membership.
5. For QA: at 1280 with the detail open, "Assess solution fit" is partly hidden behind the sticky lane headers (probably existing behaviour).

# Round 2: VERIFIED
Built file 19:08 (no newer sources). The skill's bundled engine is byte-identical to `dist`. HEAD `56b41a7`.

| Item | Result |
|---|---|
| authoring-skill: independent trial re-run (fresh agent, skill and pack only, scripted colleague); sheet checked, 0 errors | MET (evidence judged adequate) |
| Duplicate `## Committees` docs row | FIXED (once in the docs and once in the skill reference) |
| Committee lane header in its own "Committees" group | FIXED |
| Removed-committee warning uses the name ("Bid board") | FIXED |
| "What matters for me" intro mentions committees | FIXED |

**Regression re-run:** all round-1 checks still hold across the fixtures, both sample forms, the swimlane, the step detail, the committee page, the role profile, search, persona, keyboard, labels, the 375 layout and the main-spec smoke. No console errors and no non-local requests. Unit tests 244 of 244 pass. The private-names guard finds 0 hits across 787 tracked files, `dist` and the history.

Tasks 3.1 and 3.2 are ticked.

**For html-qa:**
- The committee lane link comes after the role lane links in the Tab order, although it sits between the parties on screen.
- With the detail open at 1280, "Assess solution fit" is partly hidden behind the sticky lane headers.
- Member tags can wrap so the letter sits alone on the next line.
