# Skill trials

The operating-model-author skill is a conversation, so it can't be a Playwright test (design D10). It is checked by **skill trials**: run the skill in Claude Code on one of these fictional context packs, follow the script, and record the result for each scenario in `openspec/changes/<change>/reports/skill-trials.md` (pass or fail, with the evidence: the sheet, the validator output and the relevant lines of the conversation).

Every company, person and figure in these packs is made up. Keep it that way: the private-names guard (`tests/private-names.txt`) is checked over this folder by `npm run test:unit`.

| Pack | Contents | Scenarios |
|---|---|---|
| `rich/` | Kick-off deck notes, a RACI table and an org list for a made-up freight + analytics partnership. One step has no A. | 2.22, 2.27, 2.28, 2.30, 2.47 |
| `thin/` | One paragraph. | 2.23 |
| `contradictions/` | A partner deck and a RACI table that name different owners for "Price the solution", and an `A/R` cell for Account lead on "Capture the lead". | 2.24, 2.25 |
| `revision/` | New material against the Acme capture sheet: a new legal review step, and a different owner for "Submit the proposal". | 2.26 |
| `org-chart/` | Org slides described in text, for a made-up freight + analytics partnership: the whole-partnership collaboration model, the Northern routes programme and the Coastal routes programme. They hold a role missing from the contact sheet, a cropped arrow and an empty box. | 2.67, 2.68 |
| `brand-library/` | A fictional brand library: packs for Acme (2026.2), Globex (2026.3) and Initech (2025.4, never used). Used with a copy of the Acme capture sheet. | 2.34, 2.35 |
| `joint-decision/` | A process slide described in text, where the Acme Account lead and the Globex Partner manager decide "Go or no-go" together, the Solution architect is consulted, the Bid manager is told the outcome, and "someone from finance" also sits on the decision (no finance role exists). | add-committee-decisions 2.81, 2.82 |

## Setup (every trial)

1. Use the committed skill folder, `skills/operating-model-author/`. It is kept current by the build and checked by `npm run test:unit`, so a trial doesn't need to build and doesn't write to the repo. Note the commit you trial.
2. Make the skill available in a fresh Claude Code session: install it from the marketplace (see 2.51), or copy `skills/operating-model-author/` into a scratch project's `.claude/skills/`.
3. Make an empty output folder **outside this repo**, e.g. `%TEMP%\om-trial-rich\`. Copy the pack's files into a separate input folder, so the skill reads them as the colleague's material.
4. Start a new session for each trial, so trials don't share context.

After each trial, check the sheet from the repo with:

```bash
npm run validate -- "<output folder>/capture-sheet.md"
```

## Trials

### 2.22 Rich context gives a draft first (`rich`)

Prompt: "Here's our kick-off material for the Fernhill and Marlow partnership: `<input folder>`. Can you turn it into an operating model? Save it in `<output folder>`." Reply to every question the skill asks about the content with "Leave it open for now, please hand it over." (so the open questions are still there for 2.27).

- [ ] The workstream and the process are both called "Win the work" in the sheet (neither renamed), and the draft validates with 0 errors without an `ID:` line being added.
- [ ] No question comes before the complete draft. If the prompt gave no folder, the skill shows the draft and the location question comes only once the draft is ready; no file is written before the colleague answers.
- [ ] The sheet loads in the engine (**Load capture sheet**).

### 2.27 Handover sheet validates (`rich`, continued)

- [ ] `npm run validate -- "<output folder>/capture-sheet.md"` ends with `0 errors`.
- [ ] Open questions include a `(gap)` for "Cost the service", which has no A in the RACI table.

### 2.28 Sources listed (`rich`, continued)

- [ ] `## Sources` lists `kickoff-deck-notes.md`, `raci-table.md` and `org-list.md`.

### 2.30 Handover message (`rich`, continued)

- [ ] The final message names the sheet's location, the number of unticked open questions, how to load it (**Load capture sheet**) and how to export it (**Export snapshot**).

### 2.47 Engine handed over with the sheet (`rich`, continued)

- [ ] The output folder contains `capture-sheet.md` and `operating-model-explorer.html`.
- [ ] Opening that `operating-model-explorer.html` and loading the sheet shows 0 errors, and the version shown matches `package.json`.

### 2.23 Thin context starts an interview (`thin`)

Prompt: "Can you help me build an operating model from this? `<input folder>/brief.md`. Save it in `<output folder>`."

- [ ] The skill's first content question is about the model's purpose (and key messages).
- [ ] It asks one question at a time (purpose and key messages count as one question).
- [ ] It does not write a sheet of guessed parties, roles or processes before asking.

### 2.24 Contradiction recorded (`contradictions`)

Prompt: "Draft an operating model from `<input folder>`, save it in `<output folder>`." When the skill asks about "Price the solution", reply "Not sure yet, leave it open."

- [ ] `## Open questions` has an unticked item marked `(contradiction)` that names "Price the solution", the Pricing analyst and the Account lead.
- [ ] The skill didn't settle the owner without saying so.

### 2.25 A/R in the source (`contradictions`, same session)

- [ ] In the first draft, before you answer, that RACI cell is empty and there is an unticked `(gap)` naming "Capture the lead", the Account lead and the source's `A/R`.
- [ ] The skill asks which single letter applies to Account lead on "Capture the lead", explaining R (does the work) and A (signs it off).
- [ ] Answer "A". The sheet has `A` in that cell. (Run it a second time answering "I'll decide later": the cell is empty and there is a `(gap)` open question.) Never `A/R`.

### 2.26 New material proposes, not overwrites (`revision`)

Copy `examples/acme-capture-sheet/` (the sheet and `brands/`) to the output folder. Note the sheet's checksum (`certutil -hashfile capture-sheet.md SHA256`, or `sha256sum`).

Prompt: "Here's my current sheet, `<output folder>/capture-sheet.md`, and some new notes, `<input folder>/new-material.md`. Please update the sheet."

- [ ] The skill lists proposed changes: an addition (a Legal review step owned by Legal counsel) and a change (Submit the proposal: Account lead → Bid manager), saying the change would override a value already in the sheet.
- [ ] Before you agree, the sheet's checksum is unchanged.
- [ ] Reply "Add the legal review step, but keep the Account lead on Submit the proposal." Afterwards the sheet has the new step, "Submit the proposal" is still owned by the Account lead, the declined change is recorded as a ticked `(contradiction)` under `## Open questions`, and the sheet still validates with 0 errors.

### 2.34 Packs copied, not altered (`brand-library`)

Copy only `examples/acme-capture-sheet/capture-sheet.md` (not its `brands/`) to the output folder, and delete the `Brand` column from its Parties table (the header cell, its dashes and the last cell of each row). The library's Acme and Globex packs have newer versions (2026.2 and 2026.3) than the example's copies in the skill's `references/brands/` (2026.1), so a copy from the wrong place shows.

Prompt: "Please show Acme Corp and Globex in their brand colours in `<output folder>/capture-sheet.md`. Our brand library is `<repo>/tests/skill-packs/brand-library/`: use the acme and globex brands."

- [ ] The output folder has `brands/acme/` and `brands/globex/`, and nothing from `initech`.
- [ ] Every file in them is byte-identical to the library copy: `certutil -hashfile <file> SHA256` (or `sha256sum`) matches for `brand.md` and `mark.svg` in each.
- [ ] The Parties table has a `Brand` column naming `acme` for Acme Corp and `globex` for Globex.
- [ ] `## Sources` lists both ids with their versions: acme 2026.2 and globex 2026.3.
- [ ] `npm run validate -- "<output folder>/capture-sheet.md"` ends with `0 errors` (the validator reads `brands/` next to the sheet), and **Load folder** on the output folder in the engine shows each party with its mark.

### 2.35 Brand not in the library (`brand-library`, same setup)

Prompt: "Use our brand library at `<repo>/tests/skill-packs/brand-library/` for `<output folder>/capture-sheet.md`: the acme brand for Acme Corp and the Tarnside brand for Globex."

- [ ] The skill says there is no Tarnside pack in the library (ideally listing the packs that are there) and asks what to do.
- [ ] No `brands/tarnside/` folder or other invented pack is written, and no colour or mark is made up for Globex.
- [ ] If it goes ahead with Acme, `brands/acme/` is byte-identical to the library copy.

### 2.67 Org slides become structure sections (`org-chart`)

Copy `org-chart/partnership-slide.md`, `org-chart/northern-routes-slide.md` and `rich/org-list.md` into the input folder (not the Coastal routes slide).

Prompt: "Here are our org slides and contact sheet: `<input folder>`. Can you turn them into an operating model? Save it in `<output folder>`." Reply to every question about the content with "Leave it open for now, please hand it over."

- [ ] The draft comes before any question, and has two `## Structure:` sections: one for the partnership and one for Northern routes.
- [ ] Exactly one is marked `Main: yes`: the partnership one (its slide says it covers the whole partnership).
- [ ] The two are linked: `Related:` names the other one, or the partnership's Northern routes band `Opens` it.
- [ ] Bands use the slides' own words (Steering, Programmes with the sub-bands Northern routes and Coastal routes, Commercial; Programme leads, Delivery), and people's names are in the `Name` column, with "Marlow title: Partner sponsor" and "Grade: Principal" in `Note`.
- [ ] Lines have no direction (the double-headed arrow and "Signs off plans" become plain lines, labels kept).
- [ ] `## Open questions` covers what can't be placed: the Depot supervisor (missing from the contact sheet, tagged `(gap)` or added as an `(assumption)`), the cropped arrow, and the empty Marlow commercial box. None of them is guessed into the diagram.
- [ ] `npm run validate -- "<output folder>/capture-sheet.md"` ends with `0 errors`, and the sheet loads in the engine with both diagrams.

### 2.68 Unclear main diagram (`org-chart`)

Copy only `org-chart/northern-routes-slide.md`, `org-chart/coastal-routes-slide.md` and `rich/org-list.md` into the input folder. Neither slide covers the whole partnership.

Prompt: as for 2.67.

- [ ] The sheet has two `## Structure:` sections, and neither is marked `Main: yes` by guesswork: `## Open questions` asks which diagram is the main one.
- [ ] The validator's "main diagram" error is reported to the colleague as needing their decision, not silenced by picking one.

### 2.81 Joint decision becomes a committee (`joint-decision`, add-committee-decisions)

Prompt: "Here's our bid process slide: `<input folder>`. Can you turn it into an operating model? Save it in `<output folder>`." When the skill asks you to confirm the committee, reply "Yes, that's right." Reply to every other question about the content with "Leave it open for now, please hand it over."

- [ ] The draft has a `## Committees` row whose members include Account lead and Partner manager, both marked `(A)`, and Solution architect `(C)` and Bid manager `(I)` if the skill took those letters from the slide (no other letters are chosen by the skill).
- [ ] "Go or no-go" is owned by that committee, not by the Account lead or the Partner manager, and its RACI row gives no letters to the members.
- [ ] The skill asks the colleague to confirm the committee's members and each member's letter, explaining that members marked A share the decision.
- [ ] `npm run validate -- "<output folder>/capture-sheet.md"` ends with `0 errors`, and in the engine "Go or no-go" sits in the committee's lane with a "By committee" badge.

### 2.82 Unplaced member (`joint-decision`, same session)

- [ ] `## Open questions` has an unticked `(gap)` naming the committee and "someone from finance".
- [ ] No finance role is added to the Roles table, and no finance member is added to the committee.

### 2.29 Refuses the public repo by default (any pack)

Prompt: "Draft the model from `<input folder>` and save it in `tests/skill-packs/out/` in the operating-model-explorer repo." (Use the repo path. The folder is deliberately deeper than the repo root and doesn't exist yet, so the check must walk up the parent folders.)

- [ ] The skill warns that the repo is public and asks for another location.
- [ ] Nothing is written under the repo (`git -C <repo> status` is clean) unless you confirm after the warning.

### 2.51 Marketplace install works (after pushing to GitHub)

In a Claude Code session outside this repo:

```text
/plugin marketplace add stevenbiss/operating-model-explorer
/plugin install operating-model-author@operating-model-explorer
```

- [ ] The operating-model-author skill is listed as available.
- [ ] Its bundled validator reports 0 errors on the Acme sheet: `node "<installed skill folder>/scripts/validate.mjs" "<installed skill folder>/references/example-capture-sheet.md"` ends with `0 errors, 0 warnings`.
