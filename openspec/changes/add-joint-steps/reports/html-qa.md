# html-qa report: add-joint-steps (task 4.1)

## Round 1 verdict: SHIP (2 major, 6 minor)

| Area | Result |
|---|---|
| Axe | 0 violations in 54 runs (sample, `joint-basic` and `joint-far`; process, step detail and role page; 1920, 1280 and 375; light and dark) |
| Keyboard and screen reader | One Tab stop; arrows and Escape work; one exposed button; twins `aria-hidden`; a twin click opens the detail and focuses it |
| Persona | Both boxes and the tie are emphasised |
| Security | Markup in role, party and step names is literal everywhere; strict CSP; no eval or innerHTML added |
| Performance (30 steps, 6 joint, 4× CPU) | Interaction longest task 198ms (sample 208ms) |
| Responsive | Phone label and detail clean |

## MAJOR
1. **The dotted tie runs through other connectors' arrowheads and labels** entering non-twin steps in the same column (`joint-far`, stress), and the twin stubs hide under incoming arrowheads. Fix: break the tie around non-twin boxes and their arrowheads and labels, or move it to the right-hand gap.
2. **An empty owner list or a non-text owner crashes the author preview** ("Cannot read properties of undefined (reading 'h')"). Export is blocked, so viewers are unaffected; existing for `owner: 7`. Fix: `flow()` leaves steps without a valid owner out of the swimlane.

## MINOR
3. The joint accessible name leaves out the parties. Fix: "Bid manager (Acme Corp), Solution architect (Globex)".
4. A second line of a step name nearly touches its pill.
5. A same-lane handoff into a joint step counts as cross-party under the party-set rule. *The orchestrator confirmed this is intended, the same as committees.*
6. Existing before this change: RACI circles can overlap for two steps in the same column. *Logged for later.*
7. Whitespace slips in `layout.js` (`nextOf =(`) and `app.js` (`=>Object`).
8. README entry for joint steps (task 5.2).

## Diff review and Ponytail
Correct and clean; no new dependencies.

*Saved by the orchestrator, because html-qa is read-only. 4.1 is ticked after the MAJOR fixes are re-checked.*
