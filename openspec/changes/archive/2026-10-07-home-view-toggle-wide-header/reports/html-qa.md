# html-qa report: home-view-toggle-wide-header (task 4.1)

## Verdict: SHIP (no blockers, no majors, 4 minor)

| Area | Result |
|---|---|
| Axe | 0 violations (WCAG 2.0, 2.1 and 2.2 AA plus best practice) on home (Simple and Detailed), process and structure pages, and author mode, at 2560, 1280 and 375, light and dark |
| Toggle (screen reader) | group "Home page view", buttons with `aria-pressed` that follow the state |
| Toggle (keyboard) | Tab, Enter and Space switch and announce; focus stays; visible 3px outline; pressing the active button does nothing |
| URL and history | Carried through every link; Back restores the choice; default URL clean |
| Author mode | Author-only toggle gone; "Snapshot opens in: Simple view"; export opens in Simple; author bar capped; preview header aligned |
| Security | Six hostile `?view=` values all ignored and never rendered; only the literal values are written |
| Console, network, performance | Clean; long tasks 74 and 85ms |
| Responsiveness | No horizontal scroll anywhere; toggle visible at 375 |
| Wide header | Diagram pages fill the window with brand and h1 at 24px; other pages keep the centred 1440 band; the jump between them returns cleanly |
| Code review and Ponytail | Correct; removing the author toggle left no dead code |

## Minor findings (accepted as follow-ups)
1. Unstyled `view-line` class in `author.js:77`; the class can be dropped.
2. In author mode, `body.full` is set on the author page's `<body>`. It's safe because the author bar uses `.author-bar`, but D5 said "scoped to the preview".
3. An invalid `?view=` stays in the address bar until the next navigation. It's never rendered; it could be rewritten with `replaceState`.
4. Existing before this change: on the home page at 1920 and above, the brand sits about 136px left of the h1, because the home content is narrower than the 1440 band.

*Saved by the orchestrator, because html-qa is read-only. 4.1 ticked on SHIP.*
