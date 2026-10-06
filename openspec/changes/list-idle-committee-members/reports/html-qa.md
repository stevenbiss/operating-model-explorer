# html-qa report: list-idle-committee-members (task 4.1)

## Verdict: SHIP (no blockers, no majors, 6 minor)

| Area | Result |
|---|---|
| Security | PASS. Markup and script in role, committee, party and person names show as literal text in entries, "+ N more", aria-labels and the tooltip. All fields escaped; letters limited to RACI; no eval. |
| Axe | PASS. 0 violations in 30 runs (1920, 1280 and 375, light and dark, 5 states). |
| Accessible names | PASS, e.g. "Legal counsel, Acme Corp, consulted, you"; "7 more members. All 9: …". |
| WCAG 1.4.13 tooltip | PASS. Hover with a delay, keyboard focus, the tooltip can be hovered, Escape works, clamped and flips. |
| Focus | PASS. Committee name, entries, "+ N more", each with a visible outline. |
| Contrast | PASS. Entries 13.6:1 light and 11.1:1 dark; muted person line 5.5:1 and 6.0:1. |
| Responsive | PASS. No horizontal scroll; phones unchanged. |
| Console and network | PASS. |
| Performance (9 members, 4× CPU) | PASS. Interaction tasks all under 200ms. |
| Code review and Ponytail | PASS; one over-complex spot (m5). |

## Findings (minor)
- **m1.** Person names split across lines ("Sam / Example"). Fix: the person on its own line.
- **m2.** A role name that needs 3 lines loses its " · Letter" and "You". Fix: truncate the name, not the suffix.
- **m3.** The overflow tooltip doesn't mark the persona. Fix: a "You" flag per item.
- **m4.** The person is announced twice (aria-label plus `aria-describedby`). Fix: drop the person from the entry's aria-label.
- **m5.** Per-character class bookkeeping in `idleOf`. Fix: wrap "Role · L You" and the person line separately.
- **m6.** A swatch party with no lanes has no legend key. Fix: include idle members' parties in the legend.

## Recommendations on the verifier's observations
1. Legend: fix (m6).
2. List accountable (A) members first: recommended as a follow-up spec change. *Waiting for the user's decision.*
3. Tooltip "You": fix (m3).
4. Person split: fix (m1, with m5).
5. A click in the middle of the header opens an entry: accept as designed.
6. Git history: the user's decision.

*Saved by the orchestrator, because html-qa is read-only. 4.1 ticked on SHIP. m1–m6 sent to html-builder before release.*
