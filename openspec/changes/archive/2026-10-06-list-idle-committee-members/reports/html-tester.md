# html-tester report: list-idle-committee-members

## Overall: PASS
All 22 scenarios have passing tests, and tasks 2.1–2.22 are ticked. No app source was changed.

| Suite | Result |
|---|---|
| Unit | 265 of 265 pass |
| E2E | 361 of 361 pass (349 existing + 12 new) |

New tests are in `tests/e2e/idle-members.spec.js`.

## Coverage
- **New tests:**
  - 2.1: variant with both members active.
  - 2.22: variant with only Acme members, all idle; groups come out Customer, Committees, Globex.
  - 2.6–2.8 and 2.11: the sample.
  - 2.9: variant where the idle member has a person.
  - 2.10: `committee-idle-long`.
  - 2.18: variant with three idle members.
  - 2.19: `committee-idle-persona`.
  - 2.20: `committee-idle-long` with the persona hidden behind "+ N more".
  - Plus a phone check: lists are unchanged at 375.
- **Reused:**
  - `committees` 2.17, 2.18, 2.19, 2.20 (now includes Legal counsel), 2.27 and 2.61;
  - `wide-diagrams` 2.18;
  - `explorer-views` 2.26, 2.27 and 2.28.

## Notable checks
- **2.6:** no Legal counsel lane; the entry reads "Legal counsel · C", has the accessible name "Legal counsel, Acme Corp, consulted" and Acme's mark, and its link opens the role page.
- **2.10:** party, then role, order; at most 4 lines; "+ N more" with an `aria-label` naming all 9; the tooltip lists 9 on hover and on focus; Escape keeps focus; Enter opens the committee.
- **2.20:** "+ N more" ends with a bold "You"; the lane shows "Your committee".

## Observation for QA
In 2.9, the entry "Legal counsel · C Sam Example" wraps at 24 characters, so the person's name splits across two lines ("Sam" / "Example"). This is within the spec, but worth a polish look.

# Round 2: accountable members first: PASS
- **2.23:** variant whose idle members are C (Alpha), A (Beta) and I (Alpha). Listed A, C, I, top to bottom, with matching accessible names.
- **2.24:** `committee-idle-long`. Partner director (A, last party) is the first entry, above "+ N more". The aria-label and the tooltip list all nine with it first.
- **Results:** unit 266 of 266; e2e 363 of 363.
