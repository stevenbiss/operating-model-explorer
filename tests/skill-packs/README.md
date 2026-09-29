# Skill trials

The operating-model-author skill is a conversation, so it can't be a Playwright test (design D10). It is checked by **skill trials**: run the skill in Claude Code on one of these fictional context packs, follow the script, and record the result for each scenario in `openspec/changes/<change>/reports/skill-trials.md` (pass or fail, with the evidence: the sheet, the validator output and the relevant lines of the conversation).

Every company, person and figure in these packs is made up. Keep it that way: the private-names guard (`tests/private-names.txt`) is checked over this folder by `npm run test:unit`.

| Pack | Contents | Scenarios |
|---|---|---|
| `rich/` | Kick-off deck notes, a RACI table and an org list for a made-up freight + analytics partnership. One step has no A. | 2.22, 2.27, 2.28, 2.30, 2.47 |
| `thin/` | One paragraph. | 2.23 |
| `contradictions/` | A partner deck and a RACI table that name different owners for "Price the solution", and an `A/R` cell for Account lead on "Capture the lead". | 2.24, 2.25 |
| `revision/` | New material against the Acme capture sheet: a new legal review step, and a different owner for "Submit the proposal". | 2.26 |

## Setup (every trial)

1. `npm run build`, so the skill folder is current.
2. Make the skill available in a fresh Claude Code session: install it from the marketplace (see 2.51), or copy `skills/operating-model-author/` into a scratch project's `.claude/skills/`.
3. Make an empty output folder **outside this repo**, e.g. `%TEMP%\om-trial-rich\`. Copy the pack's files into a separate input folder, so the skill reads them as the colleague's material.
4. Start a new session for each trial, so trials don't share context.

After each trial, check the sheet from the repo with:

```bash
npm run validate -- "<output folder>/capture-sheet.md"
```

## Trials

### 2.22 Rich context gives a draft first (`rich`)

Prompt: "Here's our kick-off material for the Fernhill and Marlow partnership: `<input folder>`. Can you turn it into an operating model? Save it in `<output folder>`."

- [ ] Before asking any question about the content, the skill writes a complete capture sheet (the only question allowed first is where to save, if the prompt didn't say).
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
- [ ] It asks one question at a time.
- [ ] It does not write a sheet of guessed parties, roles or processes before asking.

### 2.24 Contradiction recorded (`contradictions`)

Prompt: "Draft an operating model from `<input folder>`, save it in `<output folder>`." When the skill asks about "Price the solution", reply "Not sure yet, leave it open."

- [ ] `## Open questions` has an unticked item marked `(contradiction)` that names "Price the solution", the Pricing analyst and the Account lead.
- [ ] The skill didn't settle the owner without saying so.

### 2.25 A/R in the source (`contradictions`, same session)

- [ ] The skill asks which single letter applies to Account lead on "Capture the lead", explaining R (does the work) and A (signs it off).
- [ ] Answer "A". The sheet has `A` in that cell. (Run it a second time answering "I'll decide later": the cell is empty and there is a `(gap)` open question.) Never `A/R`.

### 2.26 New material proposes, not overwrites (`revision`)

Copy `examples/acme-capture-sheet/` (the sheet and `assets/`) to the output folder. Note the sheet's checksum (`certutil -hashfile capture-sheet.md SHA256`, or `sha256sum`).

Prompt: "Here's my current sheet, `<output folder>/capture-sheet.md`, and some new notes, `<input folder>/new-material.md`. Please update the sheet."

- [ ] The skill lists proposed changes: an addition (a Legal review step owned by Legal counsel) and a change (Submit the proposal: Account lead → Bid manager).
- [ ] Before you agree, the sheet's checksum is unchanged.
- [ ] After you agree to the addition only, the sheet has the new step, "Submit the proposal" is still owned by the Account lead, and the sheet still validates with 0 errors.

### 2.29 Refuses the public repo by default (any pack)

Prompt: "Draft the model from `<input folder>` and save it in `examples/` in the operating-model-explorer repo." (Use the repo path.)

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
