# Design: Operating Model Explorer engine v1

## Context

See proposal.md for the motivation, and the five specs for the requirements. Constraints that shape the approach:
- The engine and every snapshot must be **one offline HTML file** (`shared/html-deliverable`), opened from `file://` with no network access.
- Authors are non-technical and will use nothing but a browser: no Node, no command line.
- Ponytail minimal-code mode applies. The html-qa gate forbids `eval` and `new Function`, and requires zero console errors.
- Content will later be written mostly by an AI (option D), so the schema must be exact, and it is the single source of truth.

## Goals / Non-Goals

**Goals:**
- One engine codebase that serves as both the author tool and the viewer. A snapshot is the engine plus embedded content, in viewer mode.
- One schema definition drives validation, editor/AI tooling and the in-app content reference.
- Adding a workstream, process or persona is only ever a content change.

**Non-Goals:**
- A general diagramming tool: the swimlane layout is automatic, with no manual positioning.
- Supporting browsers older than the current Chrome, Edge, Safari and Firefox releases.

## Decisions

### D1. Stack: vanilla JS modules, bundled into one file
**Choice:** vanilla HTML, CSS and JS (ES modules in `src/`), bundled by **esbuild** into `dist/operating-model-explorer.html`.
**Why:** the UI is a handful of views over a small data model. React and shadcn would add weight and a toolchain without solving a real problem here. esbuild is a single fast dev dependency that bundles modules, and the build then inlines the result.
**Alternatives:** the React bundle via web-artifacts-builder (heavier, and more than this needs); no bundler at all, with one giant hand-written file (unmaintainable at this size).

### D2. Runtime dependencies (inlined, about 100KB total)
| Need | Choice | Why |
|---|---|---|
| YAML headers | `js-yaml` | Mature, and uses YAML 1.2 by default (avoids the "no" → false problem) |
| Markdown bodies | `markdown-it` with `html: false` | Raw HTML is escaped by default, which meets the "script not executed" requirement without a separate sanitiser |
| `.zip` loading | `fflate` | Tiny and fast |

### D3. Schema: JSON Schema as the source, with a small in-engine checker
**Choice:** the schemas live in `schema/*.schema.json` (a JSON Schema 2020-12 subset: `type`, `required`, `enum`, `pattern`, `properties`, `items`, `additionalProperties`). The engine contains a **small interpreter for exactly that subset** that produces plain-English messages. Cross-file checks (unknown ids, "Did you mean…", duplicates) are hand-written in the engine, because JSON Schema can't express them anyway.
**Why:** VS Code and AI tools can use the published schema directly. The in-app reference is **generated from the same schema at build time**, so the docs can't drift from the rules.
**Alternatives:** Ajv was rejected because it compiles validators with `new Function`, which fails the QA gate, it's about 120KB, and its messages are technical. Two separate definitions for the schema and the validator were rejected because they would drift.
**Guard:** a unit test fails if any schema uses a keyword the interpreter doesn't support.

### D4. Internal model
Loading turns the files into one normalised in-memory model: elements indexed by id, with steps resolved to their owner, lane and party. Every edge is precomputed: `next`, handoffs, and cross-party flags. Snapshots embed this model as JSON (bodies kept as raw Markdown and rendered at view time), plus the referenced assets as data URIs.

### D5. Export: rebuild the file from known parts
The engine's CSS and JS sit in `<style id="om-style">` and `<script id="om-engine">`. Rendering never changes those elements. To export, the engine assembles a new document from the doctype, those two elements, and `<script id="om-content" type="application/json">…</script>`, then offers it as a download via a Blob. On startup, the presence of `om-content` means viewer mode, and its absence means author mode.
**Alternatives:** serialising the live DOM (it contains rendered state and author UI); fetching its own file (not allowed from `file://`); embedding a second copy of the engine (doubles the size).

### D6. Swimlane layout: SVG with automatic ranking
- **Rows:** lanes, one per role, grouped by party in content order.
- **Columns:** each step's rank, meaning its longest-path distance from the process's first step, so parallel branches line up and decision branches fan out.
- **Back-edges** (rework loops) are drawn as returning connectors below the lane and aren't counted in the ranking.
- **Connectors** are orthogonal SVG paths; cross-party ones use a distinct dash and marker, with a legend.
- **Below 768px** the same data renders as an ordered HTML list (the `explorer-views` small-screen requirement), with no SVG.
- **Steps** are focusable `<g role="button">` elements with accessible names, arranged in flow order for keyboard use.

### D7. Routing and state
Hash routes, e.g. `#/w/presales`, `#/p/qualify`, `#/p/qualify/s/scope`, `#/r/account-lead`, with `?persona=partner-lead`. These give working Back/Forward and deep links from `file://`. Exploration progress lives in memory and `sessionStorage`, wrapped in try/catch. Nothing else is persisted.

### D8. Theme and labels
- Theme colours become CSS custom properties on `:root`, and the default theme defines both a light and a dark set.
- Every visible term goes through one `label('workstream', {plural})` lookup, built from the defaults plus `theme.labels`. A test scans the rendered UI for default terms when overrides are set.
- The contrast check uses the WCAG relative-luminance formula.

### D9. Reloading a folder
In Chrome and Edge, `showDirectoryPicker()` keeps a directory handle, so "Reload" re-reads it. Drag-and-drop uses `DataTransferItem.getAsFileSystemHandle()` where available. Otherwise the author re-selects the folder or uses `.zip` (`<input webkitdirectory>` or a file input).

### D10. EDGY alignment
Each type maps to an EDGY concept: `party` and `team` → Organisation; `role` and `persona` → People; `process` and `step` → Process/Activity; `workstream` → Capability-like grouping; step `inputs`/`outputs` → Object; `model.key_messages` → Outcome/Purpose. The mapping is recorded in the schema (`x-edgy`) and shown in the content reference. Project 2 can add Identity- and Experience-facet types, such as journeys and products, without changing these.

### D11. Repo layout
```
src/            index.html (template), main.js, views/, model/, author/, styles.css
schema/         model, party, team, role, persona, workstream, process, theme (.schema.json)
examples/acme-sample/   fictional two-party model (Acme + Globex); also bundled for "Try the sample"
scripts/build.mjs       esbuild bundle -> inline CSS/JS/sample -> dist/operating-model-explorer.html
tests/          Playwright (e2e, via file://) + unit tests for the checker and layout ranking
docs/           authoring guide (for colleagues); the content reference is generated
```

## Risks / Trade-offs

- **[Risk] Directory APIs vary on `file://` across browsers** → the `.zip` path works everywhere and is the tested baseline. Folder and reload behaviour are checked in Chrome/Edge early (task 1) before building on them.
- **[Risk] Automatic swimlane layout gets messy with large or looping processes** → rank-based layout plus drawn back-edges. The sample includes a loop and a decision. Very large processes remain readable through the list view, and the step count per process is kept in the authoring guide's advice.
- **[Risk] YAML is easy to get wrong by hand**, e.g. an unquoted `: ` → errors quote the file and line, the guide shows safe patterns, and AI authoring (D) removes most hand-editing later.
- **[Risk] The subset schema interpreter misses a keyword** → the guard test from D3 fails the build.
- **[Trade-off] Snapshots store raw Markdown and render it at view time** → slightly more work at open, but one rendering path, and no pre-rendered HTML to sanitise.
- **[Trade-off] No manual layout control** → consistent diagrams, and no layout data in content, at the cost of fine-tuning.

## Migration Plan

This is new. Rollback means not shipping it. Snapshots are self-contained, so later engine versions never break a snapshot someone already has. The content version is recorded in the snapshot, so older content can be re-exported with a newer engine.

## Open Questions

- The product name shown to colleagues ("Operating Model Explorer" for now). Can change at any time.
- The licence or usage terms before wider distribution to colleagues (and possibly moving the repo to a work GitHub organisation).
