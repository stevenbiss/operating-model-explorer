# html-verifier report: add-engine-v1

## Round 1: NOT VERIFIED

I checked every requirement myself, against both the engine in author mode and a snapshot I exported, opened from `file://` with the network off. Screenshots are in the session scratchpad under `verify/`.

**Everything is MET except these two, which are PARTIAL:**
- **theming › Terminology labels.** With all 9 terms renamed, some text still uses the default words: "Your step", "More steps →", the swimlane keyboard hint, and the step aria-labels. There is also a hard-coded article, e.g. "Handoff within a organisation".
- **explorer-views › Current vs future display.** Search lists a `removed` step while change markers are off, with no badge. Opening it silently turns markers on.

**Missing the point, though technically passing:**
- In the author preview, the persona prompt covers the validation report and the Export button until it's dismissed.
- A single-role persona lane truncates its role name ("Delive…") to fit the "Your lane" cue.
- The validation count appears twice: "0 errors 0 warnings (0 errors, 0 warnings)".

**Open items:**
- **(a)** Exploration progress from the author preview carries into a snapshot opened in the same browser tab.
- **(b)** Two checks can't be automated and need doing by hand: picking a real folder then Reload, and dragging a real folder from the desktop.
- **(c)** `dist/` is gitignored.

**Out of scope, but reasonable:**
- a generic element page (`#/e/<id>`)
- a "More steps →" button
- `?changes=1` and `&only=1` in the URL

**3.2 search:** no real client content. The only hits are test patterns and general mentions of the first use case in the planning documents.

## Orchestrator decision for fix loop 1
The builder fixes both PARTIALs and all three "missing the point" items. It also keeps preview progress separate from snapshots, the same way the persona prompt already is. The out-of-scope additions stay and are listed for the user. Items (b) and (c) go to the user.

## Round 2: NOT VERIFIED
- **All six loop-1 fixes are MET, and there are no regressions.** Terminology labels are now MET. axe found 0 serious or critical issues, with no console errors and no network requests. The 3.2 search passes.
- **explorer-views › Current vs future display is still PARTIAL.** A removed step stays shown after "Show changes" is turned off, and a deep link to a removed step (without `changes=1`) shows it with markers off. Evidence: `r2-75-deeplink-removed-markers-off.png`, `r2-76-removed-step-after-markers-off.png`.

### Orchestrator decision for fix loop 2
When change markers are off, the route to a removed step always resolves to its process, with a short notice saying the step was removed and how to show changes. Turning markers off while viewing a removed step does the same. This keeps to the spec wording, "shown only while change markers are on", and a shared link that includes `changes=1` still opens the step with markers on.

## Round 3: VERIFIED
- **All requirements are MET.** That covers all five change specs and shared/html-deliverable. explorer-views › Current vs future display is now MET, and so is persona-lens › What matters for me / What changes for me.
- **Other checks:** axe found 0 serious or critical issues on the snapshot at 1280 and 375 and on the engine at 1280 and 768. There were zero console errors and no network requests. The 3.2 search passes.
- **Minor issues, not blocking:**
  1. A removed role or element now goes to its parent with a notice. That's more than the spec asks, and with markers off the role's lane label still links to it, which leads nowhere.
  2. Turning on "Only changes" quietly turns on Show changes, and nothing tells screen-reader users.
  3. axe reports one moderate "region" finding.
  These are passed to html-qa and the next fix loop.
- **Still open for the user:** (b) the manual checks of real folder pick + Reload and real folder drag-and-drop; (c) `dist/` is gitignored.

## Round 4 (regression after the QA fix loop): VERIFIED
- **All requirements MET:** all five specs and shared/html-deliverable, checked against the engine and 6 self-exported snapshots, including a stress model with `&`, quotes and markup in names.
- **Removed roles and teams** open normally, with no dead end. Removed steps stay hidden everywhere while markers are off.
- **Escaping:** nothing is double-escaped.
- **Accessibility:** axe found 0 serious or critical issues and 0 `region` findings.
- **Console and network:** zero errors, zero network requests.
- **3.2:** passes.
- **New minor issues (not blocking):**
  1. After "Next", the step may sit below the fold, because the page doesn't scroll vertically.
  2. Long party names are truncated in the band header.
  3. A bad YAML header also produces a follow-on "unknown owner" error.
- **Still open for the user:** (b) the manual checks of Reload with a real folder and real folder drag-and-drop; (c) `dist/` is gitignored.

## Manual checks by the user (29 September 2026)
- **Load folder + Reload, real browser folder picker: PASS.** The user loaded `examples/acme-sample` using Load folder, edited `roles/account-lead.md` (changing `name`), and clicked Reload. The swimlane lane label updated without re-selecting the folder.
- **Drag a real folder from the desktop: PASS.** The user dragged the `examples/acme-sample` folder onto the engine page, and it loaded the same way as Load folder.
