# Skill trials: add-people-status-simple-view (2.41, 2.42)

## Setup (independent)
- **Commit:** `90e1d5a`. The committed `skills/operating-model-author/` was copied to an isolated scratch folder (`scratchpad/trial3/skill/`).
- **Input:** `org-chart/partnership-slide.md`, `org-chart/northern-routes-slide.md` and all three `rich/` files. The output folder was empty and outside the repo.
- **Assistant:** a fresh general-purpose agent, told to read only `trial3/` (the skill, the input and the output). It never saw the repo, the README checklist or the specs.
- **Colleague:** played by the orchestrator, using only the README's scripted replies.

## Transcript highlights
- **Draft first:** the agent drafted before asking anything: 2 parties, 3 teams, 7 roles, 2 workstreams, the 7-step "Win the work" process, 2 structures and 2 personas. It found no public-repo markers on the output folder and validated the draft (0 errors).
- **First question:** who signs off "Cost the service" (no A).
- **Colleague, verbatim:** "Leave it open for now, please hand it over. Oh, and one thing: the Win the work process is agreed."
- **Handover:** the agent added `Status: Agreed` to "Win the work" only, left the A cell empty with its open question unticked, copied the 1.6.0 engine in, and gave load, review and export instructions.

## Checklist
**2.41 People drafted, status left as review: PASS**
- [x] The Roles table has a `People` column with names from the material only:
  - Client manager: Pat Example
  - Partnership lead: Chris Sample
  - Pricing lead: Lee Test
  - Operations lead: Robin Placeholder
  - Depot supervisor: Jamie Sample
  - Route planner: Sasha Example; Dana Demo

  Every name was found in the input files, and none were invented.
- [x] The Data analyst, whose holder isn't named, has an empty People cell. The empty Marlow commercial box ("Ask Chris") is a `(gap)` open question, not a name.
- [x] Before the colleague's instruction there were no `Status:` lines, and there is never a `View:` line.
- [x] `npm run validate` gives `0 errors, 13 warnings`: 12 open questions and 1 step with no A.

**2.42 Agreed when told: PASS**
- [x] After the colleague's instruction, only the "Win the work" `## Process:` section has `Status: Agreed`. Neither structure section has a `Status:` line.
- [x] The sheet still validates with 0 errors. In the handed-over engine (1.6.0, loaded with **Load capture sheet**), the home page's process card for "Win the work" shows "Agreed", and both structure cards show "Under review". No page errors.
