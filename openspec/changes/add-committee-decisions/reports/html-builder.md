# html-builder report: add-committee-decisions (round 1)

## Result
All Build tasks 1.1–1.14 are complete and ticked in `tasks.md`.

| Check | Result |
|---|---|
| `npm run test:unit` | 244 of 244 pass (212 before the change) |
| `npm test` | build, then 243 of 243 Playwright tests pass |
| Rebuild | changes nothing |
| skill-folder-current, version, private-names | pass |

The built file is `dist/operating-model-explorer.html` (380 KB, Engine 1.4.0).

## How each task was verified
- **1.1 Schema:** `schema/committee.schema.json` is registered, and the step owner description now says "role or committee". The generated `docs/content-reference.md` has a `## committee` section. The schema and reference unit tests pass.
- **1.2 and 1.3 Validation and RACI:** one unit test per message in `validate.test.js`.
  - Committee checks: no members; bad letter (A/R, empty, X); unknown member with "Did you mean"; no A; one A; all A from one party; owns no step; name clash with a role; an unknown owner close to a committee; a removed committee owning a live step.
  - Step RACI: joint A gives no warning; a non-member I is shown after the members; a non-member A warns; a member's letter on the step warns and the committee's letter wins.
  - The `effectiveRaci` helper has its own test.
- **1.4 Load:** a unit test covers `ownerType`, step `parties`, `committeesOf` (with letters), `stepsOf`, cross-party edges and the snapshot maps.
- **1.5 Layout:** unit tests cover:
  - the committee group sits right after the first party group;
  - two committees are ordered by their first step in the flow;
  - with one party shown, the group sits after it;
  - cross-party is judged by each end's set of parties;
  - a process with no committee steps keeps exactly the same layout.
- **1.6 Sheet:** unit tests cover the Committees table, an Owner naming a committee, the Change/Today/ID columns, an unknown member, missing, combined or invalid letters, a missing Members column, the role/committee clash naming both rows, Owner suggestions and folder/sheet parity.
- **1.7 to 1.9 Viewer:** manual Playwright runs on the built engine.
  - At 1280: light, dark and the "Acme account lead" persona; the step detail members block; the committee page; the Partner manager profile; "What matters for me" (A plus the bid board's name); searching "bid board".
  - At 375: the phone list and detail, with no horizontal scroll.
  - On fixtures: keyboard Right, Enter and Escape on a committee step, and the renamed labels ("Steering groups", "By steering group").
  - No console errors. A theme unit test covers the label pair.
- **1.10 Sample:** both forms report 0 errors and 0 warnings. The parity test now also compares committees, step `parties`, `committeesOf` and `stepsOf`.
- **1.11 Fixtures:** each of the 14 fixtures gives exactly its intended messages. `committee-removed` gives one warning per live step the committee owns.
- **1.12 Docs:** the doc-examples unit test passes. The blank template's error count is unchanged.
- **1.13 Skill:** the skill folder was rebuilt, and the skill-folder-current and trial-packs tests pass.
- **1.14 Version:** 1.4.0 is in `package.json` and is stamped into SKILL.md and plugin.json.

## Notes
1. **Existing tests updated because the sample changed:**
   - "Go or no-go" now hands off across parties, so the same-party edge checks now use other steps.
   - Swimlane lane and band expectations include the committee lane.
   - The phone label for "Go or no-go" is now the committee.
   - The persona label on "Go or no-go" is now "You: A."
   - The Globex solution team's "What changes for me" lists 6 steps, not 5.
   - The one-A checks accept the joint A.
   - The owner error now reads "role or committee".
2. **`minProperties: 1` is not in the schema.** The engine's schema checker rejects that keyword, so empty `members` is caught in `validate.js` instead, the same way personas with no roles are.
3. **The role/committee name clash is checked once, in `validate.js`, for both forms.** In a sheet, the committee keeps a `-committee` id suffix.
4. **Small additions:**
   - The unknown-member error names the committee.
   - Lane-header text lines are joined with spaces, so screen readers read them correctly.
   - The sample Account lead summary is updated, and the bid board has a short narrative.
5. **Left for release (task 5.2):** the README status line, and `package-lock.json` (still at 1.2.0, unchanged in 1.3.0 too).

No spec ambiguities were found.

# Round 2: name-only committee lane header (user change)
- **Swimlane:** the committee lane header shows only the committee name, linking to its page, and sizes like any other lane. The member tags on members' own lanes are unchanged.
- **Phone list:** the committee name and "By committee" badge only.
- **Unchanged:** the members block in the step detail and on the committee page.
- **CSS:** two rules used only by the removed member lines are deleted.
- **Tests updated to the new spec:**
  - `committees.spec.js`: 2.16 (header text and link), 2.25 (the lane's accessible name), 2.26 (phone label, no member names).
  - `explorer-views.spec.js`: 2.37 (phone label).
- **Results:** `npm run test:unit` 244 of 244 pass; `npm test` 293 passed, 0 failed.
