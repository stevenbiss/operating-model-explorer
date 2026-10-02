# Skill trials: add-structure-diagrams (tasks 2.65 to 2.68)

Run by html-tester on 2026-10-02, following `tests/skill-packs/README.md`.

## How the trials were run

- **Skill:** the committed `skills/operating-model-author/` folder at commit 31c0a94 (unchanged in the working tree). For each trial it was copied into a separate scratch project's `.claude/skills/`, with separate input and output folders, all outside the repo in the session scratchpad.
- **Sessions:** each trial ran in a fresh, headless Claude Code session (`claude.exe -p`, CLI 2.1.287, model claude-opus-5-5), using `--setting-sources project`. That setting kept the user-level plugin copy of the skill from loading, so only the committed copy was trialled. Every session's init listed `operating-model-author` as a skill, and its first tool call was `Skill operating-model-author`.
- **Prompts:** the exact prompts from the README, with absolute input and output paths filled in. None of the scenarios needed a second turn: each trial's first response settled all its checkboxes.
- **Harness limitation, not a skill fault:** the tool allowlist covered `Bash(node:*)` but not the PowerShell tool. When the skill tried to run its bundled validator and copy the engine through PowerShell, those calls were denied. In each case the skill said plainly that both steps hadn't run, and why. I validated every sheet myself from the repo (`node scripts/validate.mjs <sheet>`), and loaded the rich and org-chart sheets in `dist/operating-model-explorer.html` with Playwright ("Load capture sheet").
- **Not checked here:** the README's "engine handed over with the sheet" check (2.47 of the earlier change) is outside this change's scenarios, and the harness blocked the copy anyway.
- **Transcripts:** the session scratchpad `trials/<rich|thin|orgchart|unclear>/turn1.jsonl`, with the sheets under `trials/*/output/`. These are temporary and not committed.

## Results

| Task | Scenario | Pack | Result |
|---|---|---|---|
| 2.65 | Rich context gives a draft first | `rich/` | **PASS** |
| 2.66 | Thin context starts an interview | `thin/` | **PASS** |
| 2.67 | Org slides become structure sections | `org-chart/` (partnership and Northern routes slides, plus `rich/org-list.md`) | **PASS** |
| 2.68 | Unclear main diagram | `org-chart/` (Northern and Coastal routes slides, plus `rich/org-list.md`) | **PASS** |

### 2.65 Rich context gives a draft first (`rich`)
- [x] **No question before the complete draft.** The tool order was Skill, reading the inputs, the repo-location check, then Write `capture-sheet.md`. The only question comes at the end of the final message ("Do you want to start with who signs off the price?"), after the draft.
- [x] **"Win the work" is the name of both the workstream and the process.** The sheet has `## Process: Win the work` and `Workstream: Win the work`, and no `ID:` line was added (`grep -c '^ID:'` gives 0).
- [x] **The sheet validates and loads.** Validator: `0 errors, 10 warnings` (9 open questions, plus the expected no-A warning on "Cost the service"). Loaded in the engine: `0 errors, 10 warnings`.

### 2.66 Thin context starts an interview (`thin`)
- [x] **Purpose comes first.** The first content question is "what's the model for, and what should people take away from it?", covering purpose and key messages as a single question.
- [x] **One question at a time.** The message ends after that one question: "After this I'll ask what each party brings, then about the roles involved."
- [x] **No sheet of guesses.** The output folder is empty, and the skill explains: "If I drafted a full operating model from it now, almost every role, step and owner would be my guess".

### 2.67 Org slides become structure sections (`org-chart`)
- [x] **The draft comes before any question, with two Structure sections:** `## Structure: Fernhill + Marlow partnership` and `## Structure: Northern routes`.
- [x] **Exactly one `Main: yes`**, on the partnership diagram, based on slide 4's speaker note. It is also listed as an assumption to confirm.
- [x] **The two diagrams are linked.** Northern routes has `Related: Fernhill + Marlow partnership`, and the partnership's Northern routes band `Opens` Northern routes.
- [x] **Bands use the slides' own words:** Steering, Programmes (with the sub-bands Northern routes and Coastal routes) and Commercial; then Programme leads and Delivery. Names are in `Name` (Pat Example, Chris Sample, Robin Placeholder, Dana Demo, Lee Test, Sasha Example, Jamie Sample, TBA), and the notes "Marlow title: Partner sponsor" and "Grade: Principal" are in `Note`.
- [x] **Lines are undirected, with their labels kept:** "Quarterly steering", "Weekly planning" (the double-headed arrow) and "Signs off plans" (the arrow). The skill also asks whether to record the lost direction in the diagram's notes.
- [x] **Open questions cover everything that couldn't be placed:**
  - the Depot supervisor, as an `(assumption)`: added as a role because it isn't on the contact sheet;
  - the cropped arrow, as a `(gap)`;
  - the empty Marlow commercial box, as a `(gap)` quoting the sticky note.

  None of them was guessed into the diagram: the cropped arrow and the commercial box are left out.
- [x] **The sheet validates and loads.** Validator: `0 errors, 12 warnings`. In the engine: `0 errors, 12 warnings`, and the overview lists both diagrams ("Fernhill + Marlow partnership", "Northern routes").

### 2.68 Unclear main diagram (`org-chart`)
- [x] **Two Structure sections, and neither is marked main:** `## Structure: Northern routes` and `## Structure: Coastal routes`, with no `Main:` line in either.
- [x] **Open questions ask which diagram is the main one.** The first item is: "(gap) Main diagram: … Neither programme slide does … Can you share slide 4 so it can become the main diagram …, or should Northern routes or Coastal routes be marked main?"
- [x] **The main-diagram error is left for the colleague to decide.** Validator: `1 error, 9 warnings`, and the error is "None of the structures is marked as the main diagram … "Northern routes" and "Coastal routes"". The skill's message says it expects "**1 error** that's yours to decide: the format needs one diagram marked as the main one", and asks about it first. It didn't silence the error by picking a diagram.
  - Caveat: the skill couldn't run its validator (see the harness limitation above), so it predicted this error from the format rather than quoting validator output. Its prediction matches the real validator exactly.
