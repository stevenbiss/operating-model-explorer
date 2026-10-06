# html-builder report: list-idle-committee-members

## Round 1: tasks 1.1–1.6
- **1.1 `flow()`:** a role gets a lane only if it owns a shown step, or has a letter on a shown step not owned by one of its committees. Letters held by members of the step's owning committee are skipped. `f.idle[committeeId]` is returned in party, then role, order. 8 new unit tests cover idle, owns a step, letter on a role-owned step, letter on its own committee's step (still idle), letter on another committee's step, idle in two committees, ordering, and per-process idleness (sample Legal counsel).
- **1.2 Header list:**
  - Each entry shows a party mark or swatch, then "Role · Letter" (letter and "You" kept on the name's last line), then the person line, in two lines at most.
  - All entries are shown if they fit in four lines; otherwise as many as fit in three, then "+ N more".
  - Entries link to their role pages with accessible names such as "Legal counsel, Acme Corp, consulted[, person][, you]".
  - "+ N more" links to the committee page, with `data-members` and the accessible name "N more members. All M: …", and carries "You" when the persona's role is hidden.
- **1.3 Tooltip:** `people.js` also handles `[data-members]` through a shared `tipHtml()`.
- **1.4 Fixtures:**
  - `committee-idle-long`: Alpha (branded) and Beta (unbranded); 9 idle members; one person; a persona hidden behind "+ 7 more".
  - `committee-idle-persona`: the sample plus an `acme-legal-counsel` persona.
- **1.5 Sample:** Legal counsel (C) added to the bid board in both forms, in parity. It's idle in Qualify and has a lane in Build.
- **1.6:** authoring guide updated; version 1.7.0.
- **Existing tests updated** in `committees.spec.js`, only where this change alters them:
  - 2.20 and 2.22: member rows now include Legal counsel.
  - 2.16: the band check uses Solution architect.
  - 2.25: link order now includes the idle entry.
  - 2.19 and 2.23: they click `.lane-name`.
- **Fixture change:** in `committee-three-parties`, Account lead is `I` on "request", so that Acme still shows a group.
- **Results:** unit 264 of 264; e2e 349 of 349.

## Round 2: placement when member parties have no lanes
The committees group goes where the first member party sits in the party order: after its group if it has lanes, otherwise between the shown groups before and after it. New unit test: Customer, Committees, Globex. Unit 265 of 265; e2e 349 of 349.

## Decisions accepted by the orchestrator
- The "+ N more" accessible-name wording.
- The legend lists only parties that have lanes.
- The tooltip doesn't mark "You".
- Very long role names are cut with "…"; the full name stays in the accessible name and the tooltip.

## Round 3: html-qa polish (after SHIP)
- **m1 and m5:** the per-character class code is removed. Each entry is name lines ending in " · L" (with a bold " You"), plus the person on its own unsplit line. The 4-line cap counts both.
- **m2:** only the name is cut, so the " · L You" suffix always fits.
- **m3:** a `you` flag per tooltip item, shown in bold.
- **m4:** the entry's accessible name no longer includes the person (the description still reads it); "+ N more" keeps people.
- **m6:** the legend includes the parties of idle members.
- **Ordering:** unchanged. Accountable-first is waiting for the user's decision.
- **Tests:** `idle-members.spec.js` 2.9 updated; 2.10 gains a legend check; 2.20 gains a tooltip "You" check.
- **Results:** unit 265 of 265; e2e 361 of 361.
