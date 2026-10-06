# Authoring guide

This guide is for colleagues writing an operating model for the Operating Model Explorer. You need a text editor and a browser. You don't need to install anything.

## The easy route: a capture sheet

Most authors should write a **capture sheet** instead of the folder described below: one Markdown file with fixed headings, a table for each list of things and a RACI matrix per process, where everything is referred to by name rather than by id. It is easier to write, and clients can review it as one document.

- Start from `templates/capture-sheet.md`. The format is in [capture-sheet.md](capture-sheet.md), and `examples/acme-capture-sheet/capture-sheet.md` is a complete fictional example.
- In the engine, choose **Load capture sheet**. If the sheet names brands (a `brands/` folder) or shows images from an `assets/` folder, choose **Load folder** on the folder holding the sheet and those folders.
- To check it without a browser, run `npm run validate -- <path to the sheet>` in this repo.
- To have an AI assistant draft the sheet from your decks, notes and RACI tables, install the **operating-model-author** skill (see the README). It follows the [interview guide](interview-guide.md), which you can also use on your own or with another assistant.

The rest of this guide describes the folder format, for authors who want one file per element.

## Content folders

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
  theme.md          optional: your own words for terms
  parties/          the organisations taking part
  teams/            teams inside a party
  roles/            the roles that do the work
  committees/       groups of roles from any parties that own steps together (optional)
  personas/         the types of viewer, and where each one starts
  workstreams/      groups of processes
  processes/        one file per process, with its steps
  structures/       one file per structure diagram (how the parties are arranged)
  brands/           brand packs copied from the brand library, one folder each (brands/acme/)
  assets/           images used in the text
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
- `type` is one of `model`, `party`, `team`, `role`, `committee`, `persona`, `workstream`, `process`, `structure` or `theme`. A brand pack's `brand.md` has no `type`: the engine knows it by its place, `brands/<id>/brand.md`.
- The text after the header is shown wherever the element is described. Headings, lists and **bold** all work. HTML is shown as plain text, never run.

## Processes and steps

A process lists its steps in order. Each step needs an `id`, a `name` and an `owner` (a role id, or a [committee](#committees-decisions-taken-together) id), and sits in its owner's lane in the swimlane.

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

## Committees: decisions taken together

Some steps aren't owned by one role: people from both sides decide them together, such as a go or no-go on a joint bid, or a steering group's sign-off. Describe that group as a **committee**, and name it as the step's owner. Don't pick one member as the owner, split the decision into one step per party, or invent a "joint" party to hold it.

```markdown
---
id: bid-board
type: committee
name: Acme + Globex bid board
summary: Decides together whether to bid.
members:
  account-lead: A
  partner-manager: A
  solution-architect: C
  bid-manager: I
---
```

- `members` is the committee's own RACI: each member role, from any party, with **one** letter. Members marked `A` are **jointly accountable**: they share the decision, and no one of them owns it alone. The viewer writes each of them as "Accountable, jointly".
- A step owned by the committee (`owner: bid-board`) takes its members' letters from the committee, so don't repeat them in the step's `raci`. The step can still give letters to roles that aren't members, such as someone informed, but not `A`: the committee's `A` members already sign it off.
- In the swimlane the committee gets a lane of its own, between the parties, and the step shows "By committee". Each member's own lane says it sits on the committee, with its letter.

**When to use a committee, and when one owner.** Use a committee only when two or more people, usually from different parties, genuinely make the decision together. When one person decides and the others are only consulted or informed, keep that person as the step's owner and put the others in the step's RACI. The engine warns about a committee with no member marked `A`, with only one (that's a single owner), or whose `A` members all belong to one party (a team may fit better), and about a committee that owns no step. A role and a committee can't share a name.

## Structure diagrams

Processes show how work flows. A **structure** shows how the parties are arranged around it: who leads on each side, how the account or programme teams line up, and who works with whom. You design each diagram yourself, from the parties, teams and roles already in the model.

```yaml
---
id: partnership
type: structure
name: Partnership structure
kind: Partnership
main: true
related: [harbour-account]
workstreams: [presales]
bands:
  - { id: leadership, name: Partnership leadership }
  - id: accounts
    name: Account management
    bands:
      - { id: harbour, name: Harbour account, opens: harbour-account }
      - { id: summit, name: Summit account }
boxes:
  - { band: leadership, role: account-lead, name: Sam Example, note: "Grade: Director" }
  - { band: leadership, role: partner-manager }
  - { band: harbour, team: globex-solutions }
lines:
  - from: { band: leadership, party: acme }
    to: { band: leadership, party: globex }
    label: Joint steering
---
```

- **Columns are parties.** Each box goes in the column of its role's or team's party. Columns follow the model's party order, and only parties the diagram uses get one.
- **Bands are your rows,** top to bottom, named in your own words: "Partnership leadership", "Strategic", "Market teams". The engine gives them no meaning. A band can hold sub-bands, one level deep, and then holds no boxes of its own. Order the bands so seniority reads from the top.
- **Boxes** place a role or a team (never both) in a band. `name` says who holds it (or TBA) and `note` adds a grade or another title. A team box lists the team's roles. The same role can appear in several bands, each with its own name.
- **Lines** join two cells (a band and a party). They are plain, with no arrowheads, and an optional `label`. Draw lines between **neighbouring cells**: a line between cells far apart passes behind the cells in between. Keep `label` to two or three short words ("Joint steering", "Weekly call"): it sits on a small pill in the gap between cells, so a long label wraps and can cover the boxes beside it. Every line is also written out as text in its cells, for screen readers and small screens.
- **Main and related:** when a model has diagrams, exactly one is `main: true`, the one that covers the whole company or partnership. It is listed first. `related` links diagrams both ways, so write each link once. `workstreams` links a diagram to workstreams, and a band's `opens` lets viewers drill down from that band to another diagram.
- `kind` is a free label, such as Partnership, Market or Sub-programme. `change` works on the diagram and on each box, as for other elements.

Keep a diagram to a handful of parties and about a dozen bands. Split a large organisation into a main diagram and related diagrams for each part.

## Personas

A persona is a type of viewer. It maps to the roles that viewer plays, which are highlighted for them, and has an entry point where they start:

```yaml
roles: [account-lead]
entry:
  view: process          # overview, workstream, process or role
  id: qualify-opportunity
```

Nothing is ever hidden from a persona. The persona only changes where they start and what is highlighted.

## People, review status and the home page (optional)

**People on roles.** A role can list the people who hold it. Wherever the role is shown by name (swimlane lanes, structure boxes, role chips, a step's owner, RACI rows and committee members), one person's name appears under it, or "Multiple people" for two or more. Hovering over the role, or focusing it with the keyboard, lists them all, and the role's page lists them under "People".

```yaml
people: [Sam Example, Alex Sample]   # in a role file; in a capture sheet, the Roles table's People column
```

List only the people who hold the role in general. When one structure box is held by someone else (for example a different person per account), write that name in the box's `name` instead: the box's own name wins on that box. People's names go into the shared snapshot, so add only names everyone receiving it may see.

**Review status.** Every process and structure diagram is **Under review** until you say otherwise. It shows a badge everywhere it appears, and its page says it may still change, so drafts aren't read as decisions. Mark one as agreed once the people who own it have signed it off:

```yaml
status: agreed          # under-review (the default) or agreed; in a capture sheet, "Status: Agreed"
```

**Simple or Detailed home page.** By default the home page is **Simple**: the model's name, then its parties, workstreams, processes and structure diagrams, so reviewers get straight to the diagrams. **Detailed** also shows the purpose, the About this model text, the key messages and the persona doors: use it when the snapshot has to explain itself, for example for viewers new to the model. Only the home page changes; the Key messages button and every other page are the same. Viewers can't switch, and author mode's preview has a toggle to see the other view before you export.

```yaml
view: detailed          # in model.md; simple (the default) or detailed; in a capture sheet, "View: Detailed"
```

## Current vs future state (optional)

Any element or step can say how it differs from today:

```yaml
change:
  status: changed        # new, changed, removed or unchanged
  today: Kick-off happened by email, and Globex joined a week later.
```

If no file uses `change`, the explorer shows no change controls at all.

## Brands (optional)

Each party can be shown in its own brand's colour, with its mark next to its name, wherever it appears: party cards, swimlane bands and lanes, owner chips, the legend and the header. The rest of the page keeps the engine's neutral frame.

1. **Copy the brand packs** you need from your organisation's brand library into `brands/` in your model folder. Copy each pack's whole folder, unchanged: `brands/acme/` holds `brand.md` and `mark.svg`. Never edit the copy; if a brand looks wrong, ask the library's curators to fix it.
2. **Name the brand in the party file**, by the pack's id (its folder name):

```yaml
---
id: acme
type: party
name: Acme Corp
brand: acme
---
```

- The engine reads only the packs in your model folder, never the library itself. So a model keeps the brand versions it was built with. To take up a newer version, copy the pack again and export a new snapshot.
- A party without a brand gets a neutral colour and its initials.
- The engine may adjust a brand colour so that text on it is readable, parties can be told apart (also with common colour-blindness), and no party looks like a colour with a meaning, such as the "Removed" badge. The report tells you each time, as a warning.
- For the fields of `brand.md`, see the [content reference](content-reference.md#brand). For how packs are made and kept, see [brand packs](brand-packs.md).

## Theme (optional)

`theme.md` holds your own words for the engine's terms:

```yaml
---
type: theme
labels:
  workstream: Value stream
  workstreams: Value streams
---
```

Theme colours, fonts, a theme logo and a palette are retired: a `theme.md` that still sets `colors`, `fonts`, `logo` or `palette` loads with a warning for each, saying it is ignored. Party colours and marks come from brand packs instead, and the engine always uses its own fonts.

## Safe YAML habits

Most problems are small typing slips in the header. The report gives the file and line number.

- **Indent with spaces, never tabs**, and keep items at the same level lined up.
- **Put quotes around text that contains `: `**, e.g. `name: "Step 1: capture"`.
- **Put quotes around colours**, e.g. `"#0b1f4d"` in a brand pack. Without them, `#` starts a comment.
- For long text, use `>-` and indent the lines below it (see `purpose` in the sample's `model.md`).
- Lists can go on one line (`roles: [account-lead, bid-manager]`) or one item per line starting with `- `.
- An unknown field is only a warning, so check the spelling. It won't stop you exporting.

## What not to put in a model

Snapshots are plain files that can be forwarded. Don't include passwords, keys, personal data or anything confidential that you wouldn't put in a slide deck.
