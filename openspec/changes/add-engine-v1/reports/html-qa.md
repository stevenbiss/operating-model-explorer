# html-qa report: add-engine-v1

## Round 1: HOLD

### BLOCKER
**B1. Security: unescaped theme labels and RACI letters reach `innerHTML`.** The CSP allows inline event handlers, because `'unsafe-inline'` in `script-src` covers attributes as well as script blocks.
- **Reproduction:** set `labels.process` to `<img src=x onerror=…>Proc`. Validation shows 0 errors, and the handler runs in the author preview and again in the exported snapshot. A RACI value containing markup is blocked from export by the schema, but it still runs in the preview.
- **Where:** `src/viewer/app.js`. `plural()` (line 58) is used in `wsCard`, `partyCard` and `processCard`. `letterHtml()` (line 86) is used in `stepDetail`, `role` and `me`.
- **Fix:** escape all labeller output once, at the source. Add tests for markup in a label and in a RACI value. Replace `'unsafe-inline'` in `script-src` with a sha256 hash of the `om-engine` script.

### MAJOR
None.

### MINOR
1. **axe "region" (moderate):** `.subbar .sub-tools`, `.removed-notice > p` and `.preview-head` sit outside any landmark.
2. **Only changes:** turning it on also turns on change markers, but nothing is announced.
3. **Removed role or element:** the redirect to the parent is a dead end, because the lane label and role chip still link to it.
4. **Performance:** there's one 270 ms long task on the first step click, because every route change re-renders the whole of `main`. Acceptable for v1. LCP is 319 ms at 4x CPU throttling, and the engine is 285 KB.
5. **Keyboard:** pressing Escape on the snapshot's persona prompt leaves focus on `<body>`.
6. **Visual:** when a selected step is scrolled into view, connector labels and neighbouring nodes slide under the sticky lane headers.
7. **README:** the Status line is stale.
8. **Ponytail:** `esc` is duplicated between `author.js` and `app.js`. Snapshots carry author-only code, which design D5 accepts. `pluralOf`/`singularOf` and `article()` are small but speculative, so no action for now.

### Passed
- axe found 0 serious or critical issues across 105 scans, covering the engine and snapshot at 1280, 768 and 375 in light and dark, including dialogs.
- No horizontal scroll at any width.
- Zero console errors and zero external requests.
- No `eval` or `new Function`. Markdown is rendered with `html:false`, and names, messages and search text are escaped.
- No secrets and no real client names.
- Visual quality is strong and consistent.
- Keyboard walkthrough passes, apart from minor 5.

### Orchestrator decision for fix loop (QA 1)
Fix B1, including the hash-based CSP, and minors 1, 2, 3, 5, 6, 7 and the `esc` duplication from 8. For minor 3, drop the redirects for removed roles and elements. The spec only requires hiding removed steps, so their pages open normally with a "Removed" badge. Also add a validation warning when a step that is not removed is owned by a removed role. Minor 4 and the rest of 8 are deferred. After the fix, re-run the tester, the verifier and QA.
