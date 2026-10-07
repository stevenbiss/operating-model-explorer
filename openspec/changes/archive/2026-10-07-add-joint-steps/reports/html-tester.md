# html-tester report: add-joint-steps

## Overall: PASS
Tasks 2.1–2.18 are ticked. No app source was changed.

| Suite | Result |
|---|---|
| Unit | 303 of 303 pass (295 + 8 new) |
| E2E | 416 of 416 pass (397 + 19 new) |

New tests are in `tests/e2e/joint-steps.spec.js` and `tests/unit/joint-steps.test.js`.

## Coverage
- **2.1–2.3:** sheet joint step loads; a committee among owners and a duplicate role are errors that disable export.
- **2.4:**
  - In the sample, both boxes sit in their lanes at the same x, both marked "Joint".
  - The tie is dashed and spans both box midpoints.
  - Sampled every 2px, the tie enters no step box.
- **2.5:** in `joint-basic`, the connector ends on the nearer (Bid manager) box.
- **2.6:** in `joint-far`, both boxes and the in-between step share an x, and the tie crosses no box.
- **2.7:** detail owners with parties, plus "Joint". Desktop and mobile.
- **2.8:** both role pages list the step once, with Owner and Joint.
- **2.9:** a persona emphasises both boxes and the tie; a control persona dims them.
- **2.10:** the phone list shows one item with both owners and "Joint".
- **2.11:**
  - Keyboard: one Tab stop, after go-no-go, and twins never take focus.
  - Enter opens the detail, and so does a click on the twin.
- **2.12:** the accessible name includes "joint step" and both owners; the twin is `aria-hidden`.
- **2.13:** both sample forms give 0 errors and 0 warnings, with both boxes.
- **2.14–2.17:** owner lists in files and sheets, with "Did you mean" errors.
- **2.18:** the full suite passes.

Reused tests: `explorer-views` 2.35 and 2.37, the people-status phone line, `layout.test.js` 1.3 and 1.4, and `sample.test.js` 1.7.

**Note:** the sheet form derives ids from names (`kick-off-the-bid`); 2.13 handles both forms.
