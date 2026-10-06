# html-tester report: home-view-toggle-wide-header

## Overall: PASS
Tasks 2.1–2.21 are ticked. No app source was changed.

| Suite | Result |
|---|---|
| Unit | 280 of 280 pass |
| E2E | 397 of 397 pass (389 existing + 8 new) |

New tests are in `tests/e2e/home-view-toggle.spec.js`.

## Coverage
- **New tests:**
  - 2.7–2.8: switch views; content and `aria-pressed` follow.
  - 2.9: `view=detailed` in the URL; Back from a process keeps it; a copied URL opens Detailed.
  - 2.10: Tab, Enter and Space; focus stays on the toggle; announced.
  - 2.11: toggle fits at 375, no horizontal scroll.
  - 2.12: at 2560, the header name is within 8px of the h1 on a process page.
  - 2.13: at 2560, the home page's bands are at most 1440px and centred.
  - 2.14: the header at 375 is unchanged on a process page.
- **Reused:**
  - home page: `people-status-view` 2.24–2.27 and 2.29, and `structure-diagrams` 2.56;
  - author mode: `author-mode` 2.51 and the builder's replacement tests `people-status-view` 2.38–2.40;
  - capture sheet: `people-status-view` 2.35 and 2.36.

## Note
`scrollbar-gutter: stable` makes the topbar 2545px wide at 2560, so the home band is centred within the bar, not the full viewport (15px). This is correct behaviour.
