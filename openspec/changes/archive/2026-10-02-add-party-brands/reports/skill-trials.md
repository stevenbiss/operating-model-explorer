# Skill trials: party brands (2.34, 2.35)

- Skill: `skills/operating-model-author/` at local commit 9464e93 (SKILL.md Version 1.1.0), read fresh.
- Script: `tests/skill-packs/README.md`, trials 2.34 and 2.35 only. Library: `tests/skill-packs/brand-library/`.
- Spec: `openspec/changes/add-party-brands/specs/authoring-skill/spec.md` (Brands from the library).
- Output folders (the colleague's chosen location, outside the repo): `trials-brands/2.34/`, `trials-brands/2.35/`.
- Setup for both: copied only `examples/acme-capture-sheet/capture-sheet.md` and removed the Parties `Brand` column (header cell, dashes and last cell of each row), with a Node script.

**Limitation:** simulated. One agent played both the skill and the colleague in one session, not a fresh Claude Code session per trial with the skill installed. The agent knew the pass criteria, which may make it follow the skill more closely than a real run would. It shows that SKILL.md can be followed as written, not that a model reliably follows it unprompted.

## 2.34 Packs copied, not altered: PASS

Colleague: "Please show Acme Corp and Globex in their brand colours in `capture-sheet.md`. Our brand library is `tests/skill-packs/brand-library/`: use the acme and globex brands."

Skill (condensed): checked the chosen folder and every parent for `.claude-plugin/marketplace.json` / `skills/operating-model-author/` (none, so no public-repo warning). Found the packs by `id` in each `brand.md` (acme 2026.2, globex 2026.3). Copied both pack folders with a file-copy command (`cp -r`) into `brands/`. Added `acme` / `globex` to the Brand column, listed both packs in Sources, validated, copied the engine next to the sheet.

| Check | Result |
|---|---|
| `brands/acme/`, `brands/globex/` present; no `initech` | Yes. Files: `brands/acme/{brand.md,mark.svg}`, `brands/globex/{brand.md,mark.svg}` only |
| Byte-identical to library (sha256) | All 4 match (below) |
| Not from `references/brands/` | The `brand.md` hashes differ from the `references/brands` copies (2026.1), so the copies came from the library |
| Brand column | `Acme Corp ... \| acme \|`, `Globex ... \| globex \|` |
| Sources | `- Brand pack acme, version 2026.2, from the brand library (tests/skill-packs/brand-library/)` and `- Brand pack globex, version 2026.3, ...` |
| Bundled validator | `0 errors, 0 warnings` (5 files) |
| `npm run validate -- <sheet>` and `-- <folder>` | `0 errors, 0 warnings` both |
| Engine **Load folder** (Playwright, folder input) | "Loaded 2.34: 0 errors, 0 warnings. Ready to export."; SVG mark images with alt "Acme Corp" and "Globex" rendered |

sha256:

| File | Output copy | Library | references/brands |
|---|---|---|---|
| acme/brand.md | 7b8baafc...0d12cd | 7b8baafc...0d12cd | cb5199f9...f03353 |
| acme/mark.svg | 464f77d5...f665e8 | 464f77d5...f665e8 | 464f77d5...f665e8 |
| globex/brand.md | 30e04002...76b22 | 30e04002...76b22 | 6b6be22a...53 |
| globex/mark.svg | 356a9ed8...9ff94 | 356a9ed8...9ff94 | 356a9ed8...9ff94 |

Negative control: the same sheet validated without `brands/` gives 2 errors ("uses the brand "globex", but no brand packs were loaded"), which shows the validator really reads the packs.

## 2.35 Brand not in the library: PASS

Colleague: "Use our brand library at `tests/skill-packs/brand-library/` for `capture-sheet.md`: the acme brand for Acme Corp and the Tarnside brand for Globex."

Skill: searched every `brand.md` by `id` and `name`. No match for Tarnside anywhere in the library. Reply:

> There's no Tarnside brand pack in the brand library: no `brand.md` there has the id or name Tarnside. The library has acme (Acme Corp, 2026.2), globex (Globex, 2026.3) and initech (Initech, 2025.4). For Globex, would you like to use one of these (there is a `globex` pack named Globex), leave Globex without a brand for now (I'll record a gap), or wait for the curators to add Tarnside? I won't make up a Tarnside pack. I can go ahead with acme for Acme Corp meanwhile.

Before the answer, the folder held only `capture-sheet.md` (checksum unchanged, af7fff37...0a1fd).

Colleague (deferring): "Leave Globex without a brand for now; go ahead with acme."

| Check | Result |
|---|---|
| Says it isn't there, lists the packs, asks | Yes (above) |
| No invented pack | Folder: `brands/acme/{brand.md,mark.svg}`, `capture-sheet.md`, `operating-model-explorer.html`. No `brands/tarnside/`, no `brands/globex/`, no colour or mark for Globex |
| `brands/acme/` byte-identical | brand.md 7b8baafc...0d12cd, mark.svg 464f77d5...f665e8 (library hashes) |
| Brand cell empty + `(gap)` | `\| Globex \| ... \| \|`; `- [ ] (gap) Globex has no brand yet: the colleague asked for the Tarnside brand, but the brand library (...) has no Tarnside pack (it has acme, globex and initech). ...` |
| Sources | acme 2026.2 only |
| Validators (bundled, npm) | `0 errors, 1 warning` (the open gap) |
| Engine Load folder | "Loaded 2.35: 0 errors, 1 warning."; Acme mark shown, Globex neutral |

## Repo check

`git -C projects/operating-model-explorer status --short` afterwards shows ` M tests/e2e/capture-sheet-authoring.spec.js` (modified 16:42, during this run). This run did not change it: its only repo commands were reads, `npm run validate` and `git status`. It is most likely another session working in parallel. Nothing new came from these trials.

## Findings

1. **Sources example puts a local path into the sheet.** SKILL.md: "`- Brand pack acme, version 2026.2, from <library path>`". The interview guide says "`from the brand library`". A library path is often an absolute local path (user name, OneDrive or company folder), and it goes into a sheet that others review. Suggested fix: "`- Brand pack acme, version 2026.2, from the <library name> brand library`. Name the library as the colleague did; don't write a full local path." Also make both files use the same example.
2. **Brand request on an existing sheet vs the revision rule.** "Revising an existing sheet" says "don't edit the file yet. List the proposed additions, changes and removals ... and wait for their agreement". Both trials change an existing sheet, but the brands section doesn't say whether that rule applies. I applied the change directly because the colleague's request was explicit and exact. Suggested fix: add to Brands step 4: "When the colleague asks for brands on an existing sheet, their request is the agreement: add the Brand cells and Sources lines without a separate proposal, unless it replaces a brand already set."
3. **Partial go-ahead is left open (minor).** Step 6 says to ask, but not whether the found packs (acme) can be copied before the answer. I waited. Suggested fix: "Copy the packs that were found only after the colleague answers about the missing one, so the sheet is changed once."
4. **What went well.** "Copy the files as files (a file-copy command), never by reading and re-writing their text" led to byte-identical copies. "Each brand is the library folder whose `brand.md` has that `id` (or that `name`)" made it easy to be sure that Tarnside is missing.
