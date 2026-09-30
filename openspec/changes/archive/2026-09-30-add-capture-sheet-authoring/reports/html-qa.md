# html-qa report: add-capture-sheet-authoring

## Round 1: SHIP (2 MAJOR to fix before the release)

**Security.** Hostile capture sheets exercised every section, table cell and line. Nothing executed or was injected in the author preview, the validation report, the Open questions group, the content-reference dialog or exported snapshots. There were zero CSP violations, dialogs, console errors or network requests. No `javascript:`, `data:` or `vbscript:` link became live, and no Open questions, Sources or comments leaked into snapshots. The v1 XSS fix still holds, the CSP is hash-only, and neither the engine nor the bundled validator uses `eval` or `new Function`.

### MAJOR
1. **The CLI passes terminal escape sequences through from sheet text.** `scripts/validate.mjs` (and the bundled copy) print `problem`, `where` and `fix` raw. Control characters could clear the screen or change the terminal title. Fix: strip C0/C1 control characters before printing, and add a test that uses ESC.
2. **`dist/acme-sample.html` is stale.** It predates this change, and the README and design D11 disagree on how the demo is made. Fix: re-export it from `examples/acme-capture-sheet/`, rebuild the checksums, and align the README with the release notes template (release, task 5.1).

### MINOR
1. **Comment stripping is quadratic** on many unclosed `<!--` (`sheet.js` `noComments`): 40k lines take 4 s.
2. **`closest()` is slow on very long names**, taking 4 s at 20k characters. Skip suggestions for strings over about 100 characters.
3. **A long custom "Key messages" label overflows at 375px** (behaviour carried over from v1). Let `.btn-key` and `.progress` wrap.
4. **The author header is cramped at 375px** ("Engine 1.0.0" wraps).
5. **Each open question repeats the "Open question:" prefix** under its own group.
6. **The format spec uses repo-only paths** (`examples/…`, `templates/…`) that engine and skill users don't have.
7. **Version is 1.0.0.** Bump it to 1.1.0 at release (already task 5.2).
8. **Ponytail:** `sheetToDocs` is one large closure, `WORD` is an identity map, and `ref`/`checkRef` are duplicated. There's no dead code or needless dependencies.

### Passed
- **Accessibility:** axe found 0 serious, critical or region violations in 54 scans (1280/768/375, light and dark), apart from MINOR 3. The keyboard walkthrough of Load capture sheet, the Open questions group and the reference tabs passes.
- **Performance:** at 4x throttling, loading a sheet takes 270–400 ms, snapshot LCP is 372 ms, and a large sheet (1,200 steps) parses in 131 ms. The engine is 323 KB.
- **Parser robustness:** malformed tables are reported without hanging.
- **Packaging:** the engine copies are byte-identical, the zip has the 8 expected files, `SHA256SUMS` matches, and the JSON manifests are consistent.
- **SKILL.md** is clear and covers every rule.

### Orchestrator decision
Fix loop: MAJOR 1, MINOR 1–6 and the skill-trial r2 findings N1–N5. MAJOR 2 and MINOR 7 are handled at release (tasks 5.1 and 5.2). MINOR 8 is deferred.
