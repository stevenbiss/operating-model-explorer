# Authoring guide

This guide is for colleagues writing an operating model for the Operating Model Explorer. You need a text editor and a browser. You don't need to install anything.

The quickest start is to copy `examples/acme-sample/` and change it. It's a fictional model (Acme and Globex are made-up companies) that uses every feature. For the exact fields of each type, see the [content reference](content-reference.md).

## How it works

1. Write your model as a folder of Markdown files.
2. Open `operating-model-explorer.html` in Chrome or Edge, and load the folder (or a `.zip` of it).
3. Fix anything the validation report lists. Each message names the file, what's wrong and how to fix it.
4. Preview the model as viewers will see it, then export a snapshot: one HTML file you can send by email or Teams.

## The folder

```
my-model/
  model.md          required: the model, its purpose and key messages
  theme.md          optional: colours, fonts, logo and your own words for terms
  parties/          the organisations taking part
  teams/            teams inside a party
  roles/            the roles that do the work
  personas/         the types of viewer, and where each one starts
  workstreams/      groups of processes
  processes/        one file per process, with its steps
  assets/           images and font files used by the theme
```

The folders are only a convention. The engine goes by each file's `type`, not by its folder. Items appear in the order of their file names, so prefix them with numbers to control the order, e.g. `01-presales.md` and `02-delivery.md`.

## A content file

Every file starts with a **header** between two `---` lines, followed by optional **Markdown** text:

```markdown
---
id: account-lead
type: role
name: Account lead
party: acme
summary: Owns the client relationship.
---
The account lead is the **single point of contact** for the client.
```

- `id` is how other files refer to this one. Use lower-case words joined by hyphens (`account-lead`). Every id must be unique across the whole model. Step ids only need to be unique within their process.
- `type` is one of `model`, `party`, `team`, `role`, `persona`, `workstream`, `process` or `theme`.
- The text after the header is shown wherever the element is described. Headings, lists and **bold** all work. HTML is shown as plain text, never run.

## Processes and steps

A process lists its steps in order. Each step needs an `id`, a `name` and an `owner` (a role id), and sits in its owner's lane in the swimlane.

```yaml
steps:
  - id: capture-lead
    name: Capture the lead
    owner: account-lead
  - id: go-no-go
    name: Go or no-go
    owner: account-lead
    raci:
      partner-manager: C
    next:
      - to: kick-off-bid
        label: Go
      - to: decline
        label: No go
  - id: decline
    name: Decline politely
    owner: account-lead
    next: []
  - id: kick-off-bid
    name: Kick off the bid
    owner: bid-manager
```

- **Flow:** a step flows to the next step in the list, unless it has `next`.
- **Decisions:** give `next` two or more `{ to, label }` entries. Each label is shown on its branch.
- **Loops:** point `next` back at an earlier step (e.g. "Needs rework" back to "Design the solution").
- **End of the flow:** `next: []`.
- **RACI:** map role ids to `R`, `A`, `C` or `I`.
- Also available: `description`, `inputs`, `outputs`, `systems` and `kpis`.

Keep a process to about **12 steps or fewer**. If it grows beyond that, split it into two processes. Large diagrams are hard to read, especially on small screens.

## Personas

A persona is a type of viewer. It maps to the roles that viewer plays, which are highlighted for them, and has an entry point where they start:

```yaml
roles: [account-lead]
entry:
  view: process          # overview, workstream, process or role
  id: qualify-opportunity
```

Nothing is ever hidden from a persona. The persona only changes where they start and what is highlighted.

## Current vs future state (optional)

Any element or step can say how it differs from today:

```yaml
change:
  status: changed        # new, changed, removed or unchanged
  today: Kick-off happened by email, and Globex joined a week later.
```

If no file uses `change`, the explorer shows no change controls at all.

## Theme (optional)

`theme.md` sets colours (as quoted hex codes), fonts, a logo from `assets/`, and your own words for the engine's terms:

```yaml
---
type: theme
colors:
  primary: "#0b1f4d"
logo: assets/logo.svg
labels:
  workstream: Value stream
  workstreams: Value streams
---
```

Fonts and images must be files in `assets/` (or a system font such as `Georgia, serif`). Web addresses are not allowed, because snapshots must work offline.

## Safe YAML habits

Most problems are small typing slips in the header. The report gives the file and line number.

- **Indent with spaces, never tabs**, and keep items at the same level lined up.
- **Put quotes around text that contains `: `**, e.g. `name: "Step 1: capture"`.
- **Put quotes around colours**, e.g. `"#0b1f4d"`. Without them, `#` starts a comment.
- For long text, use `>-` and indent the lines below it (see `purpose` in the sample's `model.md`).
- Lists can go on one line (`roles: [account-lead, bid-manager]`) or one item per line starting with `- `.
- An unknown field is only a warning, so check the spelling. It won't stop you exporting.

## What not to put in a model

Snapshots are plain files that can be forwarded. Don't include passwords, keys, personal data or anything confidential that you wouldn't put in a slide deck.
