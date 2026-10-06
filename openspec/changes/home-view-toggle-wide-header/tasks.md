# Tasks

## 1. Build

- [x] 1.1 Route (D2): `view` in `parseRoute` and `formatRoute` (written only when it differs from the model's view), kept across navigation; `overview()` uses `route.view ?? M.model.view ?? 'simple'`. Verify with route unit tests
- [x] 1.2 Home-page toggle (D3): a two-button group with `aria-pressed`, focus kept, the change announced, and wrapping at 375. Verify manually at 1280 and 375, light and dark, with mouse and keyboard
- [x] 1.3 Author mode (D4): remove the author-only preview toggle and the `previewView` plumbing, keep the "Snapshot opens in: … view" line, and confirm export is unaffected by the preview's toggle. Update or replace the existing author-toggle tests (1.6.0 scenarios 2.38–2.40). Verify manually
- [x] 1.4 Full-width header and footer (D5): a `body.full` class on process and structure routes; header and footer `.bar-in` uncapped there; other pages and the author bar unchanged. Verify manually at 2560, 1920 and 1280 (header aligned on diagram pages, capped elsewhere) and at 375
- [x] 1.5 Docs and version: README and `docs/authoring-guide.md` say viewers can switch views and `View:` sets the starting view. Version 1.8.0 in `package.json` and `package-lock.json`, with the build stamping the plugin and skill. Verify with the version and skill-folder-current tests

## 2. Test

Playwright tests run against `dist/operating-model-explorer.html` and exported snapshots via `file://`, at 1280×800 unless a scenario says otherwise. `@mobile` scenarios also run at 375×812.

### explorer-views
- [ ] 2.1 Overview content
- [ ] 2.2 Detailed view
- [ ] 2.3 Key messages still reachable in Simple view
- [ ] 2.4 Processes listed on the home page
- [ ] 2.5 Main diagram first
- [ ] 2.6 Home page on a phone (@mobile)
- [ ] 2.7 Viewer switches to Detailed
- [ ] 2.8 Viewer switches back to Simple
- [ ] 2.9 Choice kept in the URL
- [ ] 2.10 Keyboard toggle
- [ ] 2.11 Toggle on a phone (@mobile)
- [ ] 2.12 Header lines up on a wide screen
- [ ] 2.13 Other pages unchanged
- [ ] 2.14 Phones unchanged (@mobile)

### author-mode
- [ ] 2.15 Reload after an edit
- [ ] 2.16 Preview the other view
- [ ] 2.17 Export ignores the preview toggle
- [ ] 2.18 Keyboard toggle (author preview)

### capture-sheet
- [ ] 2.19 Detailed from the sheet
- [ ] 2.20 Unknown view value

- [ ] 2.21 The full existing suite (`npm run test:unit` and `npm test`) still passes

## 3. Verify

- [ ] 3.1 html-verifier checks every requirement in the three delta specs against the running engine and a snapshot at 2560, 1920, 1280 and 375, light and dark, plus a regression pass. It returns VERIFIED. The report is saved to `openspec/changes/home-view-toggle-wide-header/reports/html-verifier.md`
- [ ] 3.2 Confirm there are no real names in the repo

## 4. QA

- [ ] 4.1 html-qa final gate: axe on the home page in both views and on a process page at 2560, 1280 and 375, light and dark; toggle keyboard and screen-reader behaviour; header alignment and width jumps; `/code-review` and a Ponytail audit. It returns SHIP. The report is saved to `openspec/changes/home-view-toggle-wide-header/reports/html-qa.md`

## 5. Package

- [ ] 5.1 `npm run build`, export the Acme demo snapshot from the capture sheet, and publish release 1.8.0 with the three standard assets and checksums
- [ ] 5.2 dist/operating-model-explorer.html built, self-contained, and README updated
