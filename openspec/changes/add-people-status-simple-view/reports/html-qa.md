# html-qa report: add-people-status-simple-view (task 4.1)

## Verdict: SHIP (no blockers, no majors, 9 minor)

| Area | Result |
|---|---|
| Security | PASS. Three XSS payloads in people names (folder and sheet) show as text in the lane headers, pop-up, description, boxes, team lists, role page, phone list and search. The same payloads as status or view values give escaped errors and disable export, and never reach the markup. CSP is hash-based with `default-src 'none'`. |
| Accessibility | PASS. 0 axe violations (1920, 1280 and 375, light and dark) on home (Simple and Detailed), processes, structures, a role page, search, with the pop-up open, and in author mode. WCAG 1.4.13 met: hover delay, the pop-up can be hovered, persists, and is dismissable. Focus order correct in the viewer and in author mode (toggle after Export). |
| Responsiveness | PASS. No horizontal scroll anywhere. |
| Performance | PASS. Hovering and tabbing across a 30-step, all-people process at 4× CPU: 0 long tasks. The first step-open re-render takes 238–258ms (174–184ms without people). Accepted. |
| Code review and Ponytail | No correctness bugs; minor tidy-ups. |

## Findings
1. The Under review icon (a ring with a gap) reads as the RACI circled "C". Fix: a half-filled dot.
2. A box with its own Name still pops up and describes the role's people, contradicting the box text. Recommendation: skip the pop-up and description on such boxes, with a spec edit.
3. The right-edge clamp works (constructed case), but uses `innerWidth`, which includes the scrollbar. Fix: `clientWidth`/`clientHeight`.
4. Mouse focus after `pointerdown` re-shows the pop-up during a pan. Fix: show on focus only when the element matches `:focus-visible`.
5. First step-open re-render over 200ms at 4× CPU. Accepted.
6. The preview toggle has no visible pressed state. Fix: a pressed style; keep the label.
7. Ponytail tidy-ups: reuse `names` from `people.js`; `roleChip` calls `ppl()` twice; the `line` closure in `structure.js` is recreated per box; two ways to set the preview view.
8. README not yet updated (task 5.2).
9. In team boxes, the people line looks heavier than the role name above it. Fix: weight 400.

*Saved by the orchestrator, because html-qa is read-only. 4.1 ticked on SHIP. Findings 1–4, 6, 7 and 9 sent to html-builder before release; 8 is done in packaging; 5 accepted.*
