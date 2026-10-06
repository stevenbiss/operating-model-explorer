# Proposal: List idle committee members in the committee lane

## Why

Since 1.4.0, every member of a committee that owns a step gets **its own lane** in the swimlane, in its party group, with a header such as "Bid board member · A" (`committees` spec, "Committee lanes in the swimlane"). The layout builds lanes from every role that owns or takes part in a shown step, and a committee-owned step's RACI includes all of the committee's members.

That works for a small committee whose members also do things of their own. It reads badly for a larger steering group. When a committee of eight owns most of a long process and six of its members own nothing else, the swimlane draws six **empty lanes**, half the diagram's height, that say nothing except "member".

- Viewers read an empty lane as a forgotten role, or as a gap in the process.
- Authors ask how to remove the lanes. The only way in the content is to take the members out of the committee, which makes the model wrong.

The membership is already shown in two places: on the committee page, and when a committee step is opened. An empty lane adds height without adding information.

## Who uses it and how it's shared

- **Authors (colleagues):** nothing to change in their content. Committees, members and RACI are written as today, in the capture sheet or a content folder.
- **Viewers (colleagues and clients):** receive the exported snapshot HTML as before. In the process view they see fewer, fuller lanes, and the committee lane's header names the members who take part only through the committee.

## What Changes

- **Idle members get no lane.** In a process's swimlane, a committee member gets its own lane only when it takes part in a shown step **other than through committee membership**: it owns a step, or it has a RACI letter on a step that isn't owned by one of its committees. A member that takes part only through its committees is an **idle member** in that process, and gets no lane.
- **The committee lane lists its idle members.**
  - A committee lane's header keeps the committee's name, which links to the committee page. Below it, the header lists that committee's idle members in this process, accountable (A) members first, then R, C and I, then in the model's party order, each with its party's colour.
  - Each entry shows the role's name and its letter in the committee (e.g. "Legal counsel · C"), and links to the role's page.
  - When a role has `People`, the person's name (or "Multiple people") follows the role, as elsewhere.
  - When the list is longer than four lines, the header shows the first members and "+ N more". "+ N more" links to the committee page; its tooltip and accessible name list everyone.
- **Members with a lane are unchanged.** Their lane header still lists each committee they sit on, with their letter ("Bid board member · A"). They are not repeated in the committee lane's list.
- **This replaces one rule from 1.4.0.** "Committee lanes in the swimlane" currently says the committee lane header "SHALL NOT list the members" and "every member SHALL also get its own lane". That rule came from the earlier request to keep the committee lane to its name, with members only in the step's pop-up. It worked for small committees and doesn't scale to steering groups. Both sentences are replaced by the rules above. Opening a committee step still shows all members ("Members shown when a committee step is opened"), and the committee page is unchanged.
- **Worked out per process.** A role that is idle in one process can have a lane in another.
- **Persona lens:** with a persona selected, an idle member that is one of the persona's roles is marked "You" inside the committee lane's list, since it has no lane of its own to highlight.
- **No content, validation or format change.** Existing models render with fewer lanes and need no edits. The capture-sheet format stays at 1.
- **Samples:** the Acme sample's bid board gains Legal counsel as a member marked C. Legal counsel takes no other part in "Qualify an opportunity", so it is idle there. The sample then shows all three cases:
  - a member that owns a step (Account lead);
  - a member with a RACI letter on a role-owned step (Partner manager, I on "Assess solution fit");
  - an idle member listed in the committee lane (Legal counsel).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `committees`: "Committee lanes in the swimlane" changes which members get lanes and what the committee lane header lists. New scenarios cover an idle member, a member that owns a step, a member with a RACI letter on a role-owned step, a long member list, people on listed members and idleness per process.
- `explorer-views`: "L2 process swimlane" changes which roles get lanes.
- `persona-lens`: an added requirement for the "You" mark on an idle member inside the committee lane.

## Non-goals

- Hiding the lanes of roles that aren't committee members. A role with a lane always takes part in some step.
- An author setting to force lanes on or off per member or per committee. Revisit if authors ask for it.
- Changing the committee page, the step detail, validation or the RACI rules.
- A note on role pages for members who are idle in every process (design D5).
- Committee boxes on structure diagrams.
- Any change to phone layouts. They show no lanes, and a committee step still lists all its members when opened.
- Any real names, brands or org data in this public repo, including examples and tests.

## Impact

- `src/model/layout.js`: `flow()` works out idle members per committee and leaves them out of the role lanes.
- `src/viewer/swimlane.js`: the committee lane header lists idle members (party grouping and colour, letters, people line, persona "You", up to four lines, then "+ N more" with tooltip and accessible name).
- `src/viewer/people.js`, if the shared tooltip is reused for the overflow list.
- The Acme sample (both forms, in parity), unit tests for `flow()`, e2e tests, and existing tests that count sample lanes.
- Release 1.7.0.
