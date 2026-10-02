# html-qa report: add-party-brands

## Round 1: HOLD (0 BLOCKER, 3 MAJOR)

**Security: solid.** Hostile marks were tried in the preview and in snapshots, and nothing executed, fetched, injected or produced a CSP violation. The marks tested were:
- `<script>`, `onload`, and `foreignObject` containing an iframe;
- a `javascript:` href, `@import`/`url()`, and an external `<image>`/`<use>`;
- an XXE payload, HTML posing as SVG, and a 295 KB file.

Markup in brand fields and in the Brand cell was escaped. All 19 odd mark paths were rejected. The CSP stays hash-only, there's no `eval` or `new Function`, and the CLI strips control characters.

**Colour:**
- 20,916 derived pairs across 1,906 random models: 0 below 4.5:1.
- 1,554 text/background pairs measured in the browser: 0 below 4.5:1.
- The meaning and frame tokens are unchanged.

**MAJOR**
1. **Privacy:** retired theme values (colours, a font URL, the logo path, the palette) are embedded in snapshots. Fix: embed only `theme.labels`, and add a test.
2. **Horizontal scroll at 375 when a workstream has 7 or more parties.** Fix: let `.dots` in the workstream card wrap.
3. **Swimlane band names are truncated** to about 5 characters ("PARTN…"). Fix: allow two lines, drop the uppercase, or show the full name.

**MINOR**
1. Unresolved colour clashes (many-party models) are reported as "shifted" instead of "unresolved".
2. Dark-mode warnings quote a derived colour the author never chose.
3. A non-SVG mark gives no warning.
4. A `brands/__proto__/` folder is not guarded. Use `Object.create(null)` and `Object.hasOwn`.
5. Black or white brands make the legend swatch invisible; it needs a border.
6. Loading a 20-party, 180-step model in author mode causes a one-off 817 ms long task.
7. The skill-trial findings are still open, including the Sources local path.
8. Release housekeeping: the demo is stale and the README status needs updating.
9. Ponytail: `mono` and `full` are validated but unused, so a missing optional file blocks export. `updated` is unused. There are duplicate name maps.
10. The footer at 375 wraps with a leading "·".

### Orchestrator decision
One fix round covers MAJOR 1–3, MINOR 1–5, 7 and 9 (missing optional marks become warnings, and the name maps are merged), plus the yellow-in-dark rule (shift lightness before hue) and the verifier decisions. MINOR 6 and 10 are deferred. MINOR 8 is handled at release.

## Round 2: SHIP
- **The three MAJOR findings from round 1 are fixed:**
  - Only labels are embedded from the theme; the retired values are absent from the file.
  - 20 parties show at 375 with no horizontal scroll.
  - Long band names are readable.
- **The round-1 MINOR findings 1–5 and 9 are fixed.** Across 3,900 random models:
  - Every clash that can't be resolved is labelled "unresolved".
  - All 4,834 warnings quote the author's own colour.
- **Adjusting lightness before hue:** yellow stays yellow in dark mode. The largest hue drift across 10 yellows was 0.4°.
- **Contrast:** 20,916 pairs from the model sweep and 3,968 pairs measured in the browser, all at 4.5:1 or above.
- **Distinguishability:** no pair was too close without being reported, and 0 of 25,200 pairs failed under colour-blindness simulation.
- **Security:** the hostile brand-pack battery is still inert, and the CSP is still hash-only.
- **Other checks:**
  - axe finds 0 serious, critical or region issues.
  - The console is clean.
  - Performance is unchanged.
  - The skill wording is in place.
- **New MINOR findings:**
  1. A long single word in a party name causes horizontal scroll on the party page at 375.
  2. Band names that wrap badly can overflow the 196px header cell.
  3. An SVG that starts with a comment or DOCTYPE gets a false "not SVG" warning.

### Orchestrator decision
- MINOR 1 (it breaks the no-horizontal-scroll standard) and MINOR 3 are fixed before release.
- MINOR 2 is deferred. The legend always shows the full name.
