# Tasks

## 1. Build

- [x] 1.1 Idleness in `flow()` (D2), in `src/model/layout.js`:
  - a member is active if it owns a shown step or has a letter in the own `raci` of a shown step not owned by one of its committees;
  - idle members are left out of the lane roles;
  - `f.idle[committeeId]` is returned in party, then role, order (changed to letter, then party, then role order in 1.7, below).

  Verify with unit tests in `tests/unit/layout.test.js`: an idle member; a member that owns a step; a member with a letter on a role-owned step; a member with a letter on its own committee's step (still idle); a role idle in two committees; per-process idleness; and an unchanged layout for processes without committees
- [x] 1.2 Committee lane header list (D3, D4), in `src/viewer/swimlane.js`:
  - after the committee name, idle entries with a party mark or swatch, then "Role · Letter" and the person line;
  - each entry is a link to its role page, with an accessible name that includes the party and the letter;
  - the header grows to at most four lines, then "+ N more", which links to the committee page with `data-members` (shared tooltip) and an `aria-label` listing everyone;
  - the persona "You" cue goes on the entry, or on "+ N more" when the entry is hidden.

  Verify manually at 1280 in light and dark with the sample and a long-list fixture
- [x] 1.3 Tooltip support for `data-members` in `src/viewer/people.js` (same behaviour as the people pop-up: hover delay, keyboard focus, Escape, window clamp). Verify manually by hover and Tab
- [x] 1.4 Fixtures, fictional names only:
  - `committee-idle-long`: a committee with 9 idle members across two parties, one with a person listed, plus a persona mapped to a member hidden behind "+ N more";
  - `committee-idle-persona`: a persona mapped to an idle member.

  Verify that each loads with 0 errors
- [x] 1.5 Acme sample (D6), both forms, in parity: add Legal counsel (C) to the bid board. Verify that both load with 0 errors and 0 warnings, that the parity test passes, and that Legal counsel is idle in "Qualify an opportunity" and has a lane in "Build the proposal"
- [x] 1.6 Docs: the authoring guide's committee section explains idle members and how they're shown. Version 1.7.0 in `package.json` and `package-lock.json`, with the build stamping the plugin and skill. Verify with the version and skill-folder-current unit tests

- [x] 1.7 Accountable members first (user decision after QA): order `f.idle` by letter (A, R, C, I), then party order, then role order. Verify with a unit test in `tests/unit/layout.test.js`

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at 1280×800 unless a scenario says otherwise. Node tests cover `flow()`.

### committees
- [x] 2.1 Committee lane and badge
- [x] 2.2 Membership shown in the member's own lane
- [x] 2.3 Two committees in one process
- [x] 2.4 Lane header opens the committee
- [x] 2.5 Committee after the first party with members
- [x] 2.22 Placement when member parties have no lanes (added during build)
- [x] 2.6 Idle member listed in the committee lane
- [x] 2.7 Member with its own step keeps its lane
- [x] 2.8 Member with a RACI letter on another step keeps its lane
- [x] 2.9 People on a listed member
- [x] 2.10 Long member list
- [x] 2.11 Idle in one process, a lane in another
- [x] 2.12 Open the committee decision
- [x] 2.13 Sample committee loads

### explorer-views
- [x] 2.14 Lanes and steps
- [x] 2.15 Decision branches
- [x] 2.16 Cross-party handoff
- [x] 2.17 Process without committees
- [x] 2.18 No empty member lanes

### persona-lens
- [x] 2.19 Persona is an idle member
- [x] 2.20 Hidden behind more

- [x] 2.23 Accountable members first
- [x] 2.24 Accountable member not hidden
- [x] 2.21 The full existing suite (`npm run test:unit` and `npm test`) still passes. Lane-count assertions on the sample are updated only where this rule changes them

## 3. Verify

- [x] 3.1 html-verifier checks every requirement in the three delta specs against the running engine and an exported snapshot at 1920, 1280 and 375 (phones unchanged), plus a regression pass over the main specs. It returns VERIFIED. The report is saved to `openspec/changes/list-idle-committee-members/reports/html-verifier.md`
- [x] 3.2 Confirm there are no real names anywhere in the repo (private-names guard plus `git grep -iw` for common real company names)

## 4. QA

- [x] 4.1 html-qa final gate:
  - accessibility: axe at 1920, 1280 and 375; entry accessible names; tooltip on "+ N more"; focus order through the header list;
  - visual polish of the header list (party marks, letters, people lines, "+ N more"), light and dark;
  - performance with a 9-member committee;
  - `/code-review` and a Ponytail audit.

  It returns SHIP. The report is saved to `openspec/changes/list-idle-committee-members/reports/html-qa.md`

## 5. Package

- [x] 5.1 `npm run build`, export the Acme demo snapshot from the capture sheet, and publish release 1.7.0 with the three standard assets and checksums
- [x] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
