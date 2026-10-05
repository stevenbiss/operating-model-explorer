# html-qa report: add-committee-decisions (task 4.1)

## Verdict: SHIP
No blockers. Two small SHOULD-fix items and some minor polish.

## Results
| Area | Result |
|---|---|
| Security | PASS. Markup and script in committee names, summaries, narrative, members, step names and every sheet Committees field show as literal text, in author mode, the snapshot and every view. No eval or new Function, no secrets, no stray URLs. |
| Accessibility (axe) | PASS. 0 violations, in light and dark, at 1280, 768 and 375: swimlane with 2 committees, committee step detail, committee page, 30-step swimlane with 3 committees, role profile. |
| Accessible names | PASS. The committee step names its committee and "by committee". Member lane links carry membership text. Lane headers have separate "Roles" and "Committees" groups. The members block is a heading, then a heading per party, then a table with row headers. |
| Keyboard | PASS. Committee steps follow flow order, Enter opens the detail, and the focus ring shows in both themes. |
| Responsive | PASS. No horizontal scroll at any width, in either theme. |
| Console and network | PASS. 0 errors, 0 warnings, 0 non-file requests, 0 dialogs. |
| Performance (30 steps, 3 committees, CPU 4x slower) | PASS. Load about 450 ms; opening a step 56–168 ms; on a par with 1.3.0. |
| Size | Engine 389 KB; 30-step snapshot 359 KB. |
| Code review (0d42e8a..HEAD) | No correctness bugs. |
| Ponytail audit | PASS. About 230 source lines over 11 files, no dependencies, helpers reused, no dead code. |

## Verifier items
1. **Committee lane link comes after all role lane links in the Tab order.** SHOULD-fix (minor). Fix: emit header-link groups in `f.groups` order.
2. **"Assess solution fit" partly hidden behind the sticky headers with the detail open.** Acceptable: identical in 1.3.0 (screenshots `overlap-v130…`, `overlap-v140…`), so not introduced by this change.
3. **A member tag's letter wraps onto its own line.** SHOULD-fix (minor). Fix: wrap "<name> member" and append " · <letter>" to the last line.

## Other minor findings
- Long committee names make member lanes tall. This is readable and within the spec; the authoring guide could advise short names.
- The role profile's Committees list says "Accountable", not "Accountable, jointly".
- The `via` tag on the role profile and "What matters for me" puts the committee name straight after the letter, with no lead-in.
- A sheet that lists the same member twice silently keeps the last letter. A folder can't do this, because YAML rejects duplicate keys.
- Packaging (task 5.2): README is still at 1.3.0, and `package-lock.json` is still at 1.2.0.

Evidence: `scratchpad/qa/` (`out.log`, `out2.log`, `out/*.png`, exported snapshots).

*Saved by the orchestrator, because html-qa is read-only. 4.1 ticked on the SHIP verdict.*
