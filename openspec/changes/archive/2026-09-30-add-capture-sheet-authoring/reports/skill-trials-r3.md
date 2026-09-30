# Skill trials, round 3

Skill: `skills/operating-model-author/` at commit b17553f (SKILL.md and references/ read fresh). Validator: bundled `scripts/validate.mjs` (Node v26.10.0). Outputs under `trials-r3/<trial>/`.

| Trial | Result |
|---|---|
| 2.22 variant (rich, no save location given) | PASS |
| 2.23 (thin) | PASS |
| 2.29 (folder inside the repo, deeper than examples/) | PASS |

Repo check after all trials: `git -C projects/operating-model-explorer status --short` printed nothing (clean). `tests/skill-packs/` still holds only README.md, contradictions, revision, rich, thin (no `out/`).

## 2.22 variant: rich pack, no save location

Colleague: "Here are my notes for the Fernhill partnership, can you turn them into an operating model?" (kickoff-deck-notes.md, org-list.md, raci-table.md attached)

Skill (first reply, no question before it): read all three items; draft-first criteria met (2 parties, 5 roles, 1 process with 7 steps). Presented the complete draft: Purpose, 3 key messages, 2 parties, 3 teams, 5 roles, workstreams "Win the work" (Detailed) and "Run the service" (Outline), `## Process: Win the work` (7 steps, "Yes or no" branches `Yes: 5; No: 4`, RACI copied letter-for-letter), 2 personas, 5 tagged open questions, 3 sources. It ended with: "The draft is ready. Where would you like me to save it? I'll put the sheet and the matching engine file there."

Colleague: "Save it in trials-r3/2.22/."

Skill: walked up from the folder (no repo markers), wrote `capture-sheet.md`, copied `operating-model-explorer.html`, validated.

Validator: `0 errors, 6 warnings` (5 unticked open questions and "No role is accountable (A) for the step Cost the service"). No `ID:` line; workstream and process both named "Win the work".

Evidence: the draft was complete before the first question, the only question before writing was the location, asked when the draft was ready to save, and the sheet has 0 errors.

## 2.23: thin pack

Colleague: "Can you help me build an operating model from this?" (thin/brief.md)

Skill: "Your brief names the two parties, Tarnside Water and Kilnworth Surveys, but not the roles or processes yet, so rather than guess, I'll build the sheet with you one question at a time. First: why does this operating model exist, and what are the two to five things everyone who views it should take away?"

Evidence: the first and only question covers purpose and key messages together. No sheet was written (`trials-r3/2.23/` does not exist). No location was asked yet: under the interview rule, it is asked when the sheet is first written.

## 2.29: folder inside the engine repo

Colleague (rich pack): "Draft the model and save it in projects/operating-model-explorer/tests/skill-packs/out/."

Skill: drafted as in 2.22, then before writing checked the chosen folder and every folder above it:

```
.../tests/skill-packs/out      exists=n markers=[]
.../tests/skill-packs          exists=y markers=[]
.../tests                      exists=y markers=[]
.../operating-model-explorer   exists=y markers=[marketplace.json names operating-model-explorer; skills/operating-model-author/]
(no markers above that)
```

Skill: "That folder is inside the operating-model-explorer repository, which is public. A capture sheet usually describes real organisations and people, so I'd rather not save it there. Where else should I save it? (If you really want it there, say so and I'll go ahead.)" Nothing was written.

Colleague: "OK, use trials-r3/2.29/ instead."

Skill: no markers above it; wrote the sheet and engine. Validator: `0 errors, 6 warnings`. Repo status: clean.

## Findings (minor, no failures)

1. **The draft's form before a location is known is implicit.** SKILL.md step 2 says "write a complete draft before asking anything", and step 4 says "Write only there" and "ask at the first write, once the draft is ready". Together they imply the draft lives in the conversation until then, but a reader could take "write" in step 2 to mean a file. Suggested fix for step 4: "If they haven't named a folder, show the draft in the conversation and ask where to save it; write no file until they answer."
2. **The draft isn't validated before the location question.** Validation (step 5) comes after saving, while interview-guide section 2 says "Write a complete draft sheet, validate it, and only then ask about what's missing". That is consistent, because the location isn't a content question, so this is optional. Suggested fix: none needed, or add "(the location question isn't a content question)" to step 4.
3. **The trial script is out of date with the new wording.** In `tests/skill-packs/README.md`, 2.22 says "the only question allowed first is where to save, if the prompt didn't say". The skill now asks for the location only after the draft. Suggested wording: "No question comes before the complete draft; if the prompt gave no folder, the location question comes once the draft is ready." 2.29 still uses `examples/`, so add the deeper-folder variant (e.g. `tests/skill-packs/out/`) that exercises the walk-up check.

## Limitation

These trials were run by one agent acting as both the skill and the colleague, in one session. Trials did not get fresh sessions, and the skill was not installed from the marketplace or `.claude/skills/`. Instead, SKILL.md was read and followed by hand. The colleague's replies were scripted, and "shown to the colleague" means presented in the simulated transcript. Engine loading (**Load capture sheet**) was not exercised in a browser; only the bundled validator was run. Trial 2.29 reused the 2.22 draft content rather than redrafting it.
