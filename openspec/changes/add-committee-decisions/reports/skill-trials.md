# Skill trials: add-committee-decisions (2.81, 2.82)

- Date: 2026-10-05
- Commit trialled: `91026a7` (skill folder `skills/operating-model-author/`, version 1.4.0)
- Pack: `tests/skill-packs/joint-decision/` (`bid-process-slide.md`), copied to a separate input folder
- Output folder: outside the repo, in the session scratchpad (`…/scratchpad/om-trial-joint-decision/output/`)
- Run by: the html-tester agent

## How it was run, and its limits

`tests/skill-packs/README.md` asks for a **fresh Claude Code session** with the skill installed, one per trial. The tester agent couldn't start a separate session, so the trial was a **walk-through**: the agent followed `SKILL.md`, `references/interview-guide.md` and `references/capture-sheet-format.md` step by step against the pack, and played the colleague using the README's scripted replies ("Yes, that's right." to the committee confirmation, and "Leave it open for now, please hand it over." to everything else).

This is weaker evidence than an independent trial:

- the agent had already read the trial checklist and the authoring-skill spec, so it knew the expected outcome before drafting;
- the "asks the colleague to confirm" step was played by the same agent on both sides.

The sheet, the validator output and the engine check below are real artefacts. **Before relying on 2.81 and 2.82, re-run them once in a fresh Claude Code session** that has the skill but hasn't seen the checklist.

## Conversation (walk-through)

1. **Read the material** (SKILL.md step 1). There is one source, `bid-process-slide.md`, giving two parties, four roles, two key messages, and a five-step process with a decision.
2. **Draft or interview** (step 2). There are parties, roles and a process, so the skill drafts first, and no question comes before the draft.
3. **Draft** (step 3, the Committees subsection). The slide's caption says "Go or no-go" is "decided together by the Acme Account lead and the Globex Partner manager". That is a joint decision across two parties, so the draft gets a `## Committees` row, and "Go or no-go" is owned by the committee rather than by either person.
   - Letters taken from the material: Account lead (A) and Partner manager (A) because they "decide together"; Solution architect (C) because they are "consulted on fit".
   - The Bid manager "just needs to hear the outcome" (speaker note). That makes them informed, but the slide doesn't say they sit on the decision. So they are I on the step's RACI row as a non-member, recorded as an `(assumption)`, rather than a member the material doesn't support.
   - The slide says "someone from finance also sits on the decision", but there is no finance role. Following the rule "never invent members", this became a `(gap)` naming the committee and "someone from finance". No role was added.
   - The slide gives the group no name, so it got the working name "Go or no-go group", recorded in the confirmation question.
   - The other steps say who does the work but not who signs it off, so their RACI rows are empty, with a `(gap)`.
4. **Save** (step 4). The prompt named the output folder, and that folder is outside the repository, so there was no public-repo warning.
5. **Validate** (step 6). Result: 0 errors.
6. **Talk it through** (step 7). The first question the skill asked:
   > "I've made 'Go or no-go' a committee decision rather than giving it to one person, because the slide says the Acme Account lead and the Globex Partner manager decide it together. The committee ('Go or no-go group' for now) has Account lead (A) and Partner manager (A), who share the decision because both are marked A, and Solution architect (C), consulted on fit. Are those the right members and letters?"

   The colleague replied "Yes, that's right." The `(assumption)` was ticked with that answer.
   - Next question, about the finance member. Reply: "Leave it open for now, please hand it over." The `(gap)` stays unticked.
7. **Validate again and hand over** (step 8). The engine was copied next to the sheet.

## Evidence

The final `capture-sheet.md` (relevant parts):

```markdown
## Committees

| Committee | Members | Summary |
|---|---|---|
| Go or no-go group | Account lead (A); Partner manager (A); Solution architect (C) | Decides together whether to bid. |
...
| 3 | Go or no-go | Go or no-go group | Decided together by ... | | | | | Go: 4; No go: 5 |
...
| Step | Account lead | Bid manager | Partner manager | Solution architect |
| 3 | | I | | |
...
## Open questions

- [x] (assumption) Committees › Go or no-go group: ... Confirmed by the author: "Yes, that's right."
- [ ] (gap) Committees › Go or no-go group: the slide says "someone from finance also sits on the decision", but no finance role is named. Which role is it, which party is it in, and what is its letter on the committee ...? It is left out of the committee until then.
- [ ] (gap) Process: Qualify an opportunity › Capture the lead, Assess solution fit, Kick off the bid and Decline politely: ... Who is accountable for each?
- [ ] (assumption) Workstreams › Joint bids ...
- [ ] (assumption) Purpose ...
- [ ] (assumption) Process: Qualify an opportunity › Go or no-go: the Bid manager is informed (I) on the step ...
```

Validator output: the bundled `scripts/validate.mjs`, and also `npm run validate -- "<output>/capture-sheet.md"` from the repo:

```text
Operating Model Explorer validator 1.4.0
...
0 errors, 9 warnings
```

The 9 warnings are 5 unticked open questions and 4 "No role is accountable (A)" warnings, for the steps whose sign-off the slide doesn't give. There are no committee warnings.

Engine check: the handed-over `operating-model-explorer.html` (1.4.0) was opened with **Load capture sheet** in Chromium at 1280×800, and the preview opened at `#/p/qualify-an-opportunity`. Results:

- Report: `0 errors, 9 warnings`, with no console errors.
- Bands: `Acme Corp`, `Committees`, `Globex`.
- "Go or no-go" sits in the lane `lane-go-or-no-go-group`, whose header reads "Go or no-go group Acme Corp Account lead · A Globex Partner manager · A Solution architect · C".
- The step's pill is "By committee", and its accessible name is "Go or no-go, by committee: Go or no-go group. Next: Kick off the bid (Go), Decline politely (No go)."
- Screenshot: `…/scratchpad/om-trial-joint-decision/engine-swimlane.png`.

## Results

### 2.81 Joint decision becomes a committee: PASS (walk-through)

- [x] The draft has a `## Committees` row with Account lead (A) and Partner manager (A), plus Solution architect (C), a letter from the slide. The skill chose no other letters. The Bid manager's I comes from the speaker note and was put on the step as a non-member, with an `(assumption)`.
- [x] "Go or no-go" is owned by the committee, and its RACI row gives no letters to members.
- [x] The skill asked the colleague to confirm the members and each letter, explaining that members marked A share the decision. (This was simulated; see the limits above.)
- [x] The validator ends with `0 errors`, and in the engine "Go or no-go" sits in the committee's lane with a "By committee" badge.

### 2.82 Unplaced member: PASS (walk-through)

- [x] `## Open questions` has an unticked `(gap)` naming the committee ("Go or no-go group") and "someone from finance".
- [x] No finance role is in the Roles table, and the committee has no finance member.
