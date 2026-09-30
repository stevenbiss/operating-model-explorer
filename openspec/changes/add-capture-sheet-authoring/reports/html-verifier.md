# html-verifier report: add-capture-sheet-authoring

## Round 1: VERIFIED

I checked this myself against the engine from `file://` with the network off, the CLI, the skill package, and snapshots I exported from both the capture sheet and the folder. Across all sessions there were 0 external requests and 0 app console errors.

**Every in-scope requirement is MET:**
- **capture-sheet:** all 13 requirements.
- **author-mode:** all 4.
- **content-schema:** all 3.
- **authoring-skill:** 10 are MET, with the conversational ones evidenced by simulated trials in two rounds.

**Classified, not failed:**
- 2.51 marketplace install needs the user.
- 2.52 release comes later.
- Single-file load of a sheet that has a logo reports the missing asset. This is documented: load the folder instead.

**Other results:**
- **Regression:** the engine v1 features work on a snapshot built from the sheet. axe found 0 serious, critical or region issues on the snapshot (1280/375) and on the engine (1280/768).
- **Parity:** I crawled 28 routes in each snapshot, and page text matched on every route. So did the 10 step details and the 3 personas.
- **3.2:** 0 matches for private names across 325 tracked files, `dist/`, the unzipped package and all commits.

**Weaknesses and open questions:**
1. SKILL.md step 1 asks for a save location before the draft, which conflicts with "draft before asking".
2. 2.23 and 2.29 weren't re-run after the wording changes.
3. The "loads cleanly" scenario doesn't say it means loading with `assets/`.
4. `references/assets/logo.svg` isn't listed in the package spec.
5. The combined-letter error in a sheet points at the step row rather than the RACI row.

### Orchestrator decisions
- The skill drafts first and asks where to save at the first write (the SKILL.md fix).
- The scenario wording now says the sheet is loaded with its `assets/` folder.
- The package spec lists `references/assets/`.
- The error location is fixed in this fix round.
- 2.23 and 2.29 are re-run after the fix round.
