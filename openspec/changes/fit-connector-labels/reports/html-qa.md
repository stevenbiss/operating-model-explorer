# html-qa report: fit-connector-labels (task 4.1)

## Round 1 verdict: HOLD (1 blocker)

### BLOCKER
**B1. A branch that skips a column runs behind the step in between.** The bend now sits just past the source, so the long run follows the target's lane through any step in a skipped column. It then reads as a connector from that step. 1.7.0 routed it along the source lane. Fix: `mx = cols[targetRank - 1] + NW + 12`, which is identical for adjacent columns. Tested on a scratch copy: clean, with no connector through a step box in the sample or in a 30-step process. Add an e2e scenario.

### MINOR
- **m1.** Labels into the same step stack with no gap and overlap by 1px; a tall stack climbs into the party band. *Superseded by the verifier-driven redesign: separate entry points at 16px pitch.*
- **m2.** A single word longer than a line overlaps the source step and looks cut off. Fix: break after `-` and `/`, and as a last resort split the word.
- **m3.** The width estimate only holds for Latin text. Fix: count wide characters (≥ U+2E80) as about 1.7 units, or document the assumption.
- **m4.** The `LABEL_PAD` comment is wrong (12 + 8 + 4px slack).
- **m5.** Missing tests for skipped columns, stacking and long words; `gaps()` calls `columns()` twice.

### Passed
| Area | Result |
|---|---|
| Axe | 0 violations in 24 runs (1920, 1280 and 375, light and dark, 4 processes) |
| Security | Markup in a wrapped label is escaped in every tspan; no dialog, no injected elements |
| Console and network | Clean |
| Performance (30 steps, 48 labels, 4× CPU) | Process open about 160ms; interaction under 85ms |
| Visual | Big improvement: five-branch labels all readable. Forward labels crossed by connectors went from 28 to 0 in the 30-step process. |
| Code and Ponytail | Lean (+33 / +4 lines), pure and unit-tested |

*Saved by the orchestrator, because html-qa is read-only. 4.1 stays open until the re-check.*
