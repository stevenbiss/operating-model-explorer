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

## Round 2 verdict: SHIP (1 major, 3 minor)
- **Fixed:**
  - B1: skip branches drop in the gap before the target, with no connector through a step.
  - The own-lane detour reads well on the lane divider.
  - Labelled entries get separate rows.
  - Long words break after a hyphen.
  - m3–m5 done.
- **M1.** When labelled and unlabelled connectors enter the same step, the unlabelled one still enters at the centre and runs through a neighbouring label ("Prepare pack —Approved→ Send the pack"). Not a regression on 1.7.0. Fix: give every forward connector into a step an entry point (unlabelled = 0 lines or a 16px slot), and add an e2e scenario.
- **m1.** The bottom-lane detour sits on the diagram's bottom edge, reading as a double border. Fix: about 10px more SVG height, or route it inside the lane, clear of loop-backs.
- **m2.** W/M-heavy capitals overflow the 6.4px estimate. Fix: count capitals about 1.15 (or W and M about 1.5).
- **m3.** `entryPoints` is dense. Fix: a worked example in the comment; the M1 fix may simplify it.
- **Passed:** axe 0 violations in 24 runs; console and network clean; security (escaped tspans); visual; performance (30 steps, longest task 82ms); code lean.

*Saved by the orchestrator. 4.1 ticked on SHIP. M1 and m1–m3 folded in before packaging.*

## Round 3 verdict: SHIP (no blockers, no majors)
- **Former M1 fixed:** in `mix`, each connector has its own entry and no connector crosses a label. Same in `own`, `caps`, the sample and both fixtures; in `perf30`, only rework-loop labels are crossed (out of scope).
- **Former m1 fixed:** the bottom-lane detour sits at 6px inset and reads as a connector. With a bottom-lane rework loop added, they run 6px apart briefly and cross once, with labels clear.
- **Former m2 fixed:** "WHO MANAGES MOMENTUM WORKFLOW" wraps, clear of the steps.
- **Former m3 done:** the worked example checks out.
- **No connector behind a step box** in any fixture.
- **Passed:** axe 0 violations in 36 runs; security; performance (open about 166ms, longest task about 90ms); diff small and correct.

**Known limits (accepted by the orchestrator, possible follow-up):**
- When several 3–4-line labels and plain connectors enter one step and the entries fall back to 16px, a connector can run through a label stack (`stress`, `many`). Possible fix: grow the target step or wrap tighter.
- In the bottom lane, the detour can run 6px beside a rework loop; a 10px inset would separate them more.

*Saved by the orchestrator, because html-qa is read-only. 4.1 already ticked (round 2 SHIP).*
