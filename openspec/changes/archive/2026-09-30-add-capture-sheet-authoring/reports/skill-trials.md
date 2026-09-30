# Skill trials: operating-model-author 1.0.0

Change: `add-capture-sheet-authoring`, tasks 2.22 to 2.30 and 2.47 (2.51 marketplace install is out of scope).
Date: 2026-09-29. Run by an agent following `skills/operating-model-author/SKILL.md` and its `references/`, playing the colleague per `tests/skill-packs/README.md`.

All paths below are relative to this folder, `trials/`, which stands in for "the location the colleague chooses". Each trial folder has `input/` (a copy of the pack), `output/` (what the skill wrote), `transcript.md` and the validator output.

## Summary

| Task | Scenario | Result |
|---|---|---|
| 2.22 | Rich context gives a draft first | **PASS** |
| 2.23 | Thin context starts an interview | **PASS** |
| 2.24 | Contradiction recorded | **PASS** |
| 2.25 | A/R in the source (both "A" and "decide later") | **PASS** (see finding F2) |
| 2.26 | New material proposes, not overwrites | **PASS** (see finding F3) |
| 2.27 | Handover sheet validates | **PASS** (after a self-fix, see finding F1) |
| 2.28 | Sources listed | **PASS** |
| 2.29 | Refuses the public repo by default | **PASS** |
| 2.30 | Handover message | **PASS** (see finding F4) |
| 2.47 | Engine handed over with the sheet | **PASS** |

No scenario failed. There are four findings about the skill's wording (F1 to F4) and two about the trial script (F5, F6). None blocks a scenario, but F1 and F2 are places where a less careful run could fail.

## Setup and environment

- `npm run build` was **not** run, because the repo is read-only for this trial. Instead: `dist/operating-model-explorer.html` and `skills/operating-model-author/engine/operating-model-explorer.html` have the same SHA-256 (`8d239a2d…42311710`), and `package.json` is `1.0.0`, which matches the validator banner (`Operating Model Explorer validator 1.0.0`), the engine (`Engine 1.0.0`) and `SKILL.md` (`Version: 1.0.0`).
- The skill was followed from its repo folder. It was not installed into a separate `.claude/skills/` folder, and there was no fresh session per trial (see Limitations).
- Node v26.10.0. Bundled validator: `node "<skill>/scripts/validate.mjs" <sheet>`. Repo validator: `npm run validate -- <sheet>`, run from the project folder.
- **Concurrent repo activity:** while the trials were running, another process (probably a parallel agent) created `tests/fixtures/{raci-combined,raci-no-accountable,raci-two-accountable,sheet-mixed,sheet-tiny}/` and modified `tests/e2e/author-mode.spec.js` and `tests/e2e/helpers.js` (their timestamps are 23:38 to 23:39, during this run). These trials didn't write them: they write only under `trials/`. So for 2.29, "git status clean" was checked on `examples/` rather than the whole repo.

## Results by scenario

### 2.22 Rich context gives a draft first: PASS

- The prompt named the output folder, so the skill asked nothing about location. The pack has parties, roles and a process with steps and owners, so SKILL.md step 3 means "draft first".
- The skill wrote `rich/output/capture-sheet.md` (2 parties, 3 teams, 5 roles, 2 workstreams, 1 seven-step process with a yes/no branch and a RACI, 2 personas, 6 open questions, 3 sources) **before its first message**. The first question it asked was a content question about the gap on "Cost the service", and it came after the draft (`rich/transcript.md`).
- The sheet loads in the handed-over engine. A Playwright check (`rich/engine-load-check.cjs`, output in `rich/engine-load-check.txt`) loaded it through the engine's own sheet input and got: `Loaded capture-sheet.md: 0 errors, 7 warnings. Ready to export.`, `Open questions (6)`, `Engine 1.0.0`.

### 2.23 Thin context starts an interview: PASS

- The brief names two parties and an aim, but no roles and no process, so it's below the draft bar and the skill interviews.
- The first and only question in the first message is about purpose and key messages, in the guide's order: "why does this operating model exist … And what are the two to five things you'd want everyone who looks at it to take away?" (`thin/transcript.md`).
- No sheet was written: `thin/output/` is empty.

### 2.24 Contradiction recorded: PASS

- `contradictions-answer-A/output/capture-sheet.md`, Open questions item 1 (unticked):
  `- [ ] (contradiction) Win a campaign › Price the solution: the partner deck says the **Pricing analyst** owns it (…); the RACI table (account team's spreadsheet) marks the **Account lead** R, … The sheet follows the RACI table for now (owner Account lead). Which is right?`
- The skill kept one side so the sheet loads, said which side, and asked. When the colleague said "Not sure yet, leave it open", it left the item unticked. It never settled the owner without saying so. A separate `(gap)` records that the step has no A.

### 2.25 A/R in the source: PASS

- The skill asked: "Which letter should the Account lead have on Capture the lead?", explaining "**R, responsible:** the account lead does the work …" and "**A, accountable:** the account lead signs it off".
- Run 1, answer "A": the RACI row is `| Capture the lead | A | | I | |`, and the gap is ticked with the answer. Result `0 errors, 6 warnings` (`contradictions-answer-A/validate-2-final.txt`).
- Run 2, answer "I'll decide later": the RACI row is `| Capture the lead | | | I | |`, with the `(gap)` left unticked. Result `0 errors, 8 warnings` (`contradictions-defer/validate-2-final.txt`).
- `A/R` appears in neither sheet's RACI table. It appears only as quoted source text inside the open question.

### 2.26 New material proposes, not overwrites: PASS

- The proposal message (`revision/transcript.md`) lists:
  - Additions: "Build the proposal › new step "Legal review" … owner **Legal counsel** … RACI: Legal counsel **A**", with the current and proposed values and the source.
  - Changes: "Submit the proposal: owner Account lead → Bid manager", with the current and proposed RACI, the source, and a note that it disagrees with a value the colleague set.
  - Removals: none.
- Checksums (`revision/hashes.txt`):
  1. After copying: `dcf13f27…5cf88a`, the same as the repo's `examples/acme-capture-sheet/capture-sheet.md`.
  2. After the proposal message, before agreement: `dcf13f27…5cf88a`, **unchanged**.
  3. After the colleague agreed to the addition only: a new hash.
- `revision/diff.txt` shows only the Legal review row, the renumbered rows and Next, one new RACI row, a ticked open question recording the declined change, and a new Sources line. "Submit the proposal" is still `Account lead`, with the Account lead as A.
- The revised sheet has `0 errors, 0 warnings` with both the bundled validator and `npm run validate`.

### 2.27 Handover sheet validates: PASS

- `npm run validate -- rich/output/capture-sheet.md` gives `0 errors, 7 warnings`, exit 0 (`rich/npm-validate.txt`). The bundled validator gives the same (`rich/validate-3-handover.txt`).
- Open questions include `(gap) Win the work › Cost the service: no role is marked A in the RACI table …`, and it is unticked.
- The first draft had **1 error** (`rich/validate-1-draft.txt`, draft kept as `rich/draft-v1-before-fix.md`): `The id "win-the-work" is also used by capture-sheet.md`. The skill fixed it at step 5 by adding `ID: win-the-work-process` (finding F1).

### 2.28 Sources listed: PASS

`rich/output/capture-sheet.md` `## Sources` lists `kickoff-deck-notes.md`, `raci-table.md` and `org-list.md`, each with a short description.

### 2.29 Refuses the public repo by default: PASS

- The colleague asked to save to `<repo>/examples/`. Walking up from that folder finds `.claude-plugin/marketplace.json` with `"name": "operating-model-explorer"` and `skills/operating-model-author/` (`public-repo/evidence-before.txt`).
- The skill's message: "the folder you've chosen … is inside a **public** repository. A capture sheet usually describes real organisations and people … Could you give me another folder …? If you really do want it in `examples/`, tell me and I'll save it there." (`public-repo/transcript.md`)
- Nothing was written. `git status --porcelain -- examples` is empty, and the `examples/` listing is the same before and after (`public-repo/evidence-after.txt`). `public-repo/output/` is empty. The whole-repo status was not clean, but only because of the concurrent activity described under Setup.

### 2.30 Handover message: PASS

The rich handover message (`rich/transcript.md`) gives:
- the location, `trials/rich/output/capture-sheet.md`, with the engine next to it;
- `0 errors, 7 warnings` and **6 unticked open questions**, with the three most important;
- how to load it: open in Chrome or Edge and choose **Load capture sheet** (with a note that **Load folder** isn't needed because there's no `assets/`);
- how to review it: the Open questions group and each persona;
- how to export it: **Export snapshot**, and that Open questions, Sources and comments are never included.

### 2.47 Engine handed over with the sheet: PASS

- `rich/output/` contains `capture-sheet.md` and `operating-model-explorer.html`.
- SHA-256 of the copy equals `skills/operating-model-author/engine/operating-model-explorer.html`: `8d239a2d6ae6ce38b6e8490be2eb15d7e6abf0369f785e5e3214e42e42311710` (`rich/engine-sha256.txt`). All four trial output folders hold the same file.
- Loading the sheet in that engine gives `0 errors, 7 warnings` and shows `Engine 1.0.0`, which matches `package.json` `1.0.0` (`rich/engine-load-check.txt`).

## Findings

### F1. A process with the same name as its workstream causes an id clash the format doesn't warn about (affects 2.22, 2.27)

Both rich-pack sources call the workstream and its process "Win the work", and the skill, correctly, kept the colleague's names. The validator then gave:

```
error · Process: Win the work
  Problem: The id "win-the-work" is also used by capture-sheet.md.
  Fix: Ids must be unique across the whole model. Change the id in one of the two files.
```

- Nothing in SKILL.md or `capture-sheet-format.md` says that ids are shared across element types. The format only says "Names must be different within a process" for steps. So the first draft had an error, and it was only recovered because step 5 says "fix what you can".
- The message is written for the folder format ("also used by capture-sheet.md", "in one of the two files"). For a single sheet it points at the file itself, doesn't name the other element (the workstream), and doesn't mention the `ID:` line that fixes it.
- A less careful run could rename the process, which changes the colleague's wording without asking, or hand over with an error.

Suggested fixes:
- `docs/capture-sheet.md`, under "At a glance", after the "Things refer to each other by name" bullet: "Every id must be unique across the whole model, including between different kinds of thing. If a workstream and a process share a name, give one of them an `ID:` line (e.g. `ID: win-the-work-process`)."
- Validator, for capture sheets: "Workstreams › row 1 (Win the work) and Process: Win the work both have the id "win-the-work". Add an `ID:` line to one of them."
- SKILL.md step 4, optional: "Keep the colleague's names. If two things share a name, give one an `ID:` line rather than renaming it."

### F2. SKILL.md doesn't say what to put in the draft for a combined RACI letter before asking (affects 2.25)

- Step 4 says to draft and tag gaps. Step 6 says: "for a combined letter such as `A/R` explain R … and A … and ask them to pick; if they defer, leave the cell empty and add a `(gap)`."
- Section 4 of the interview guide has the same rule. Neither says what the **draft** cell holds before the question is asked.
- Copying `A/R` gives a validator error, so step 5 has to change it. Picking `A` would break "Don't choose for them". The trial chose an empty cell with a `(gap)`, but that was a judgement call, not an instruction.

Suggested wording for SKILL.md step 4: "For a combined letter such as `A/R` in the material, leave the cell empty in the draft (a combined letter is an error) and add a `(gap)` naming the step, the role and the source's letters; then ask about it in step 6."

### F3. Revision: the rule for a disagreement with a set value is ambiguous, and so is what to record when a change is declined (affects 2.26)

- SKILL.md says: "A disagreement with a value they already set is a contradiction to ask about, not an update to make."
- Section 5 of the interview guide, and the README's check, list exactly that case (Submit the proposal: Account lead → Bid manager) under **Changes**, with "needs your agreement".
- Read literally, SKILL.md says it shouldn't be proposed as a change at all. The trial followed the guide's example (listed as a change, flagged as disagreeing with their decision), which is what the scenario expects.
- There is also no rule for a change the colleague **declines**. The guide covers "want to think about" (add an open question) but not "no". The trial recorded it as a ticked `(contradiction)` with the answer, which is reasonable but not instructed.

Suggested SKILL.md wording: "If new material disagrees with a value they already set, list it under Changes, say that it overrides their decision, and apply it only if they agree. If they decline, keep the current value; if they want to think about it, add an unticked `(contradiction)` naming both values and the source."

### F4. The handover list in SKILL.md leaves out one item from the guide (affects 2.30, minor)

Section 8 of the interview guide has six items. Item 6, "That reviewers can comment on the capture sheet itself before a snapshot is made", isn't in SKILL.md's Handover list, so a run that follows SKILL.md alone leaves it out. The scenario doesn't need it. Either add a bullet to SKILL.md Handover step 2 ("that reviewers can comment on the sheet itself before a snapshot is made") or drop it from the guide.

### F5. Trial script: the rich trial has no scripted replies for the talk-through (README)

SKILL.md step 6 always asks at least one question before handover, but the README scripts no reply for the rich pack. The trial simulated a deferral ("Leave that open for now … Can you just hand it over?") so that the 2.27 check could be observed. A real tester might answer instead, which would tick the gap and make "Open questions include a (gap) for Cost the service" fail.

Suggested README line under 2.22: "Reply to any question with 'Leave it open for now, please hand it over.'"

### F6. Minor wording points (no failure observed)

- **One question at a time:** interview guide item 1 is "Purpose and key messages", which is two questions in one turn. That's fine for 2.23 (the README says "purpose (and key messages)"), but the guide could say "count purpose and key messages as one question".
- **Repo detection:** SKILL.md step 1 says "inside the operating-model-explorer repository (it has `.claude-plugin/marketplace.json` …)". Here "it" is the repository, and the file sits at the repo root, not in the chosen `examples/` folder. A literal check of the chosen folder alone would miss it. Suggested: "(the folder or any folder above it has `.claude-plugin/marketplace.json` naming `operating-model-explorer`, or `skills/operating-model-author/`)".

## Limitations

- **This was a simulated trial by an agent, not a real colleague session.** One agent played both the skill and the colleague. It had read the README's checks and the spec's scenarios before "running" the skill, so its behaviour was shaped by knowing what would be checked. A fresh session reacting only to SKILL.md may behave differently, especially on F1 and F2.
- All trials ran in one context, not in fresh sessions per trial as the README requires. Run 2 of 2.25 reused run 1's draft, so it only tests the "decide later" branch.
- The skill was read from the repo folder and was not installed into `.claude/skills/`, so skill triggering (the `description` field) was not tested. Nor was 2.51.
- `npm run build` was not run (repo read-only). The skill folder was shown to match `dist/` by hash instead.
- The colleague's replies were limited to the README script, plus one unscripted deferral in the rich trial (F5). The thin and public-repo trials stop after the skill's first message, because the script gives no further replies.
- The engine load was checked headlessly through the engine's own file input (Playwright), not by a person clicking **Load capture sheet**.
