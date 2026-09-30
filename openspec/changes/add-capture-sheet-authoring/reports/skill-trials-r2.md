# Skill trials, round 2 (re-run after the wording fixes)

Skill: `skills/operating-model-author/` at commit `be0ceee` (version 1.0.0). I read SKILL.md and all four references fresh and followed SKILL.md as the operating instructions. I read the previous report (`reports/skill-trials.md`) only after these trials, to compare. Earlier files from a cut-off attempt were moved, unread, to `_stale-cutoff-attempt/`.

Every path below is relative to this folder. Each trial has `input/` (a copy of the pack), `out/` (the colleague's output folder), `conversation.md` and the validator and engine outputs. The repo was not written to: `git status` is clean.

## Results

| # | Scenario | Result |
|---|---|---|
| 2.22 | Rich context gives a draft first | **PASS** |
| 2.27 | Handover sheet validates | **PASS** |
| 2.28 | Sources listed | **PASS** |
| 2.30 | Handover message | **PASS** |
| 2.47 | Engine handed over with the sheet | **PASS** |
| 2.24 | Contradiction recorded (both variants) | **PASS** |
| 2.25 | A/R in the source ("A" and "decide later") | **PASS** |
| 2.26 | New material proposes, not overwrites (with one change declined) | **PASS** |

## Evidence

### rich (2.22, 2.27, 2.28, 2.30, 2.47)

- **Draft first.** The sheet was written and validated before the first content question (`conversation.md`). The output folder and every parent were checked for the repo's marker files, and there were none.
- **Names kept.** The workstream and the process are both called "Win the work". The sheet has no `ID:` line.
- **First validation:** `validate-draft.txt` ends `0 errors, 7 warnings`, with no id clash. Six warnings are unticked open questions, and one is the missing A on "Cost the service".
- **Talk-through.** The skill asked about the missing A on "Cost the service", and the colleague replied "Leave it open for now, please hand it over." The (gap) stays unticked.
- **Handover validation.** The bundled validator gives `0 errors, 7 warnings` (`validate-handover.txt`). `npm run validate -- <sheet>`, run from the project folder, gives `0 errors, 7 warnings` (`npm-validate.txt`).
- **Cost the service gap.** Open questions item 1 is `- [ ] (gap) Win the work › Cost the service: the RACI table gives the Pricing lead R and no role A. Who signs the price off?`
- **Sources** list `kickoff-deck-notes.md`, `raci-table.md` and `org-list.md`.
- **Engine.** `out/` holds `capture-sheet.md` and `operating-model-explorer.html`. Loading the sheet in that engine with Playwright and Chromium (**Load capture sheet** input) gives `0 errors, 7 warnings. Ready to export.` and shows version `1.0.0`, which matches `package.json` (`engine-load.txt`). There were no page errors.
- **Handover message** (`conversation.md`). It gives the location with the engine next to it, the validator result, 6 unticked questions with the top 3, **Load capture sheet**, the review steps (the Open questions group and the preview as each persona), **Export snapshot** (Open questions, Sources and comments never included), and "Reviewers can also comment on the capture sheet itself before you make a snapshot."

### contradictions (2.24, 2.25). Variants `contradictions-A/` and `contradictions-defer/`

- **First draft** (`first-draft.md`, identical in both). The row is `| Capture the lead | | | I | |`, so the Account lead cell is **empty**. It has `- [ ] (gap) Win a campaign › Capture the lead: the RACI table gives the Account lead \`A/R\`. A cell takes one letter, so it is empty for now. Which one applies: R (does the work) or A (signs it off)?` Validation: `0 errors, 7 warnings`.
- **2.24.** The draft has `- [ ] (contradiction) Win a campaign › Price the solution`, which names the partner deck (Pricing analyst) and the RACI table (Account lead R), and says which side the sheet follows (the deck). The colleague replied "Not sure yet, leave it open", so it stays unticked in both variants. The owner wasn't settled silently.
- **2.25 question.** The skill explained R (does the work) and A (signs it off), noted that the owner already counts as R, and asked which single letter applies.
- **Variant A.** The cell is `A` and the (gap) is ticked with "Answer: A". Bundled validator, npm validate and the engine all give `0 errors, 5 warnings`.
- **Variant defer.** The cell stays empty and the (gap) stays unticked. Bundled validator, npm validate and the engine all give `0 errors, 7 warnings`.
- `A/R` never appears in either sheet (grep count 0).

### revision (2.26)

- **Hashes.**
  - Before the proposal: `dcf13f27…5cf88a` (`hash-before.txt`), the same as the repo's Acme sheet.
  - After the proposal, before agreement: `dcf13f27…5cf88a`, **unchanged** (`hash-before-agreement.txt`).
  - After the edit: `fe4ed283…68bc51b` (`hash-after.txt`).
- **Proposal** (`conversation.md`).
  - Additions: Legal review after Review the proposal, owned by Legal counsel (A), with its branches and renumbering, source `new-material.md`.
  - **Changes:** "Submit the proposal: owner Account lead → Bid manager … This value is already set in your sheet, so this change would **override your decision**. Accept or decline?"
  - Removals: none.
- **Reply:** "Add the legal review step, but keep the Account lead on Submit the proposal."
- **Result.**
  - Row 5 is Legal review / Legal counsel, and row 6 is still Submit the proposal / Account lead, with the Account lead still A in the RACI.
  - A new `## Open questions` has `- [x] (contradiction) Build the proposal › Submit the proposal: the current sheet has the Account lead as owner (A); new-material.md (March review notes) says the Bid manager, with the Account lead informed. The colleague declined the change: Account lead kept as is.`
  - An unticked (assumption) records the send-back target.
  - `new-material.md` is added to Sources.
- **Validation.** Bundled validator and npm validate give `0 errors, 1 warning`. **Load folder** in the engine (the sheet plus `assets/`) gives `0 errors, 1 warning. Ready to export.`

## F1 to F4: are the fixes confirmed?

| Finding | Status | Evidence |
|---|---|---|
| F1: id clash between a workstream and a process with the same name | **Fixed** | The first rich draft validated with 0 errors. "Win the work" is kept for both, and there is no `ID:` line. The format spec now explains the `-process` suffix. |
| F2: what goes in the draft cell for a combined letter | **Fixed** | SKILL.md step 4 now says to leave the cell empty and add a (gap). The first draft followed it, and the variants then split correctly. |
| F3: a disagreement with a set value, and what to record when a change is declined | **Fixed** | The change was listed under Changes as overriding a decision. The hash was unchanged before agreement. The declined change kept its value and got a ticked (contradiction) with "kept as is". |
| F4: the handover message leaves out comments on the sheet | **Fixed** | The handover bullet is now in SKILL.md, and all three handovers include it. |

## New findings (none failed a scenario)

**N1. When a contradiction is about the owner, it's unclear what the RACI row should hold** (SKILL.md step 4: "keep one side in the sheet so it loads"). The deck names the Pricing analyst as owner of "Price the solution". The RACI table gives the Account lead R and the Pricing analyst C. I set the owner from the deck and kept the RACI letters as the source gives them. So the row now shows the owner as only C, and no role is A. It loads, but it's inconsistent, and a run could just as well rewrite the RACI to match the chosen side, which would settle more than the question admits. Suggested addition to step 4: "When the sides disagree on a step's owner, take the Owner from one side, keep the RACI letters exactly as the source gives them, and say both in the `(contradiction)`."

**N2. Inserting a step renumbers the later ones, and nothing says so** (SKILL.md "Revising an existing sheet", and interview guide section 5). Adding Legal review as row 5 shifted Submit and Courier down, and the existing `Next` values (`Approved: 5`) and the RACI row numbers had to be updated to match. A careless edit would silently re-point "Approved" to the new step or move RACI letters onto the wrong step. The validator can't catch that, because every number is still valid. Suggested line for the revision section: "When you add or remove a step, update every `Next` and RACI reference to the steps that move, or refer to steps by name, and list the renumbering in the proposal."

**N3. The revision section doesn't say how to finish** (SKILL.md). It ends at "Apply only what they accept". It doesn't point back to "Validate again, then hand over", or say whether to copy the engine again. I did both. Suggested: "Then validate and hand over as usual (Validating, Handover)."

**N4. A pack that names no workstream needs one invented** (format: `Workstream:` is required on a process). The contradictions pack has a process but no workstream. I created "Joint bids" from the deck's title and flagged it as an (assumption). That's the right behaviour, but no instruction covers it. Optional: the interview guide section 3 could list "a process with no workstream" as an example of a (gap) or (assumption).

**N5. Trial script (README), minor.** The setup step "`npm run build`, so the skill folder is current" writes into the repo, so it couldn't be run under the read-only rule. The trials used the committed skill folder at `be0ceee`, which already has the fixes.

## Limitation

This was simulated. **One agent played both the skill and the colleague**, in one session rather than a fresh session per trial. It had read the README checks, the spec scenarios and this re-run's F1 to F4 targets before "running" the skill, so knowing what would be checked may have shaped how it behaved. A real colleague session, or a fresh agent that sees only SKILL.md, could behave differently. The engine checks were automated (Playwright and Chromium, through the engine's file inputs), not a manual click-through.
