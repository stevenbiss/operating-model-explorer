# html-verifier report: list-idle-committee-members (tasks 3.1, 3.2)

## Verdict: VERIFIED
Every requirement in the three delta specs is MET in the running app.

**Method:** the verifier's own Playwright scripts at `file://`, in author mode (sample, zip, sheet folder) and in snapshots exported with the Export button. Viewports 1920, 1280 and 375, light and dark. No non-file requests, console errors or dialogs. The 1.7.0 build was current.

## Evidence summary
| Spec | Result |
|---|---|
| committees › Committee lanes | MET. Lane and badge; member lane tags; two committees; header link; three-party placement; placement with idle member parties (Customer, Committees, Globex). Legal counsel idle in Qualify with no lane, "Legal counsel · C" with Acme's mark and an accessible name, linking to its role page. Account lead and Partner manager keep their lanes. A letter on its own committee's step stays idle. A role idle in two committees is listed in both. Party order holds, with marks or swatches. The people line shows, including "Multiple people". The long list (9) stays within 4 lines plus "+ 7 more" (link, tooltip on hover and focus, Escape, aria-label lists all). Per-process idleness holds. |
| committees › Members panel | MET. Legal counsel (C Consulted) is listed under Acme at 1280 and 375. |
| committees › Sample | MET. Both forms 0 errors and 0 warnings. |
| explorer-views › L2 | MET. Lanes, branches, cross-party handoffs; no Committees group without committees; no empty member lanes; phones unchanged. |
| persona-lens › Idle member highlight | MET. "You" (bold text) on the entry or on "+ N more"; "Your committee" on the lane. |
| Regression | Unit 265 of 265; e2e 361 of 361; spot checks fine. |
| 3.2 No real names | MET for tracked files, `dist` and the zip (private-names guard and about 70 company names). |

## Observations (not blocking)
1. A swatch for a party with no lanes has no legend key, so sighted viewers can't tell which party it is. The party is in the accessible name.
2. An accountable (A) member can be hidden behind "+ N more", since entries are in party order.
3. The overflow tooltip doesn't mark the persona; the entry and its aria-label do.
4. Person names split across lines.
5. A click in the middle of the committee lane header can land on a member entry.
6. Git history still contains real names from an earlier commit (the user's decision is pending).
