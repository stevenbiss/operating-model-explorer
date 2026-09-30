# Capture sheet format

A capture sheet is one Markdown file that holds a whole operating model. It is the easy way to write a model: fixed section headings, a table for each list of things, and names instead of ids. People can read and comment on it as one document, and the engine loads it directly, just like a content folder.

This page is the full format, **format 1**. For a complete real-size sheet, see the example capture sheet. To start a new one, copy the blank template. (In the repo they are `examples/acme-capture-sheet/capture-sheet.md` and `templates/capture-sheet.md`; in the authoring skill, `references/example-capture-sheet.md` and `references/capture-sheet-template.md`.)

## At a glance

- The first heading is `# Operating model: <name>`. That is how the engine knows the file is a capture sheet.
- Under the title, a `Format: 1` line says which version of this format the sheet uses.
- Each part of the model has a `##` section with a fixed heading, such as `## Roles` or `## Process: Build the proposal`.
- Lists of things (parties, teams, roles, workstreams, steps, personas, the RACI matrix) are Markdown tables. Columns are found by their header, in any order, ignoring case and spaces.
- Things refer to each other **by name**. Names match ignoring case, spaces and punctuation, so `solution  Architect` finds "Solution architect".
- Different kinds of thing may share a name, such as a workstream and a process both called "Win the work". Every id must still be unique across the whole model, so the engine appends the kind to the id of the one that comes **later** in the sheet (parties, teams, roles, workstreams, personas, then processes, each in table order): the process gets the id `win-the-work-process`. There is no message, and the names stay as written. An id you set yourself (an `ID` column or `ID:` line) is never changed: if it is the same as the id of something earlier in the sheet, the report shows an error naming both places.
- HTML comments (`<!-- like this -->`) are ignored everywhere, so you can leave guidance in the sheet. A comment ends at the next `-->`. If a `<!--` is never closed, everything from it to the end of the file is ignored, so close every comment you add.
- **Open questions** and **Sources** are working notes. They are never included in an exported snapshot.

## A complete small sheet

Every example on this page fits into this sheet.

```markdown
# Operating model: Acme + Globex partnership

Format: 1

## Purpose

How **Acme** and **Globex** win and deliver joint work for their clients.

## Key messages

- One team, one plan.
- Acme owns the client relationship. Globex owns the solution.

## About this model

A short example of the capture sheet format.

## Parties

| Party | Summary |
|---|---|
| Acme Corp | The client-facing partner. |
| Globex | The solution partner. |

## Teams

| Team | Party | Summary |
|---|---|---|
| Acme Sales | Acme Corp | Finds opportunities and runs bids. |

## Roles

| Role | Party | Team | Summary |
|---|---|---|---|
| Account lead | Acme Corp | Acme Sales | Owns the client relationship. |
| Bid manager | Acme Corp | Acme Sales | Runs the bid plan. |
| Solution architect | Globex | | Designs the solution. |

## Workstreams

| Workstream | Summary | Parties | Detail |
|---|---|---|---|
| Presales | From the first client conversation to a submitted proposal. | Acme Corp; Globex | Detailed |
| Delivery | Running the project once it is won. | Acme Corp; Globex | Outline |

## Process: Qualify an opportunity

Workstream: Presales
Summary: Decide quickly and together whether an opportunity is worth pursuing.

| # | Step | Owner | Description | Outputs | Next |
|---|---|---|---|---|---|
| 1 | Capture the lead | Account lead | Log the opportunity as soon as the client mentions it. | Lead record | |
| 2 | Go or no-go | Account lead | Decide together whether to bid. | | Go: 4; No go: 3 |
| 3 | Decline politely | Account lead | Tell the client why. | | End |
| 4 | Kick off the bid | Bid manager | Agree the bid team and the plan. | Bid plan | |

### RACI

| Step | Account lead | Bid manager | Solution architect |
|---|---|---|---|
| 1 | A | | |
| 2 | A | I | C |
| 3 | A | | |
| 4 | | A | C |

## Personas

| Persona | Roles | Starts at | Summary |
|---|---|---|---|
| Acme account lead | Account lead | Process: Qualify an opportunity | You own the client. |

## Open questions

- [x] Does Globex join the go or no-go decision?

## Sources

- Workshop notes, 12 March.
```

## The top of the sheet

```markdown
# Operating model: Acme + Globex partnership

Format: 1
ID: acme-sample
Version: 1.0
```

| Line | Required | What it does |
|---|---|---|
| `# Operating model: <name>` | Yes | The model's name. It must be the first heading in the file. |
| `Format: <n>` | Yes | The capture sheet format version. This page describes format 1. Without it the sheet is read as format 1, with a warning. A sheet with a newer format than the engine reads is an error: open it with a newer engine. |
| `ID: <id>` | No | The model's id, which is also the snapshot's file name. By default it comes from the name (`acme-globex-partnership`). |
| `Version: <text>` | No | The content version, shown in the snapshot footer. |

## Sections

| Section | Required | Holds |
|---|---|---|
| `## Purpose` | Yes | Why this operating model exists: one or more paragraphs. |
| `## Key messages` | Yes | A list (`- `) of the conclusions every viewer should reach, in order. |
| `## About this model` | No | Text shown with the model, e.g. who it is for and how to read it. |
| `## Parties` | Yes | A table of the organisations taking part. |
| `## Teams` | No | A table of teams inside a party. |
| `## Roles` | Yes | A table of the roles that do the work. |
| `## Workstreams` | No | A table of groups of processes. |
| `## Process: <name>` | No | One section per process: its lines, a step table, a RACI matrix and notes. |
| `## Personas` | No | A table of the types of viewer, and where each one starts. |
| `## Theme` | No | Your own words for terms. |
| `## Notes: <name>` | No | Text for a party, team, role, workstream, process or persona, shown on its page. |
| `## Open questions` | No | A checklist of things still to decide. Not included in snapshots. |
| `## Sources` | No | A list of the material the sheet was drafted from. Not included in snapshots. |

Any other `##` heading is a warning, and its content is ignored. A missing required section is an error that names the heading to add.

### Text in Purpose, About this model and Notes

These sections are ordinary Markdown: paragraphs, lists, **bold**, links and images from `assets/`. HTML is shown as plain text, never run.

A heading inside one of them is written **one level below its section**, and shows as a first-level heading in the text. So under `## About this model` or `## Notes: Presales` write `### How to read it`; under `### Notes` in a process write `#### Why this matters`.

## Tables

Every table has a header row, a row of dashes, then one row per item:

```markdown
## Roles

| Summary | Party | Role |
|---|---|---|
| Owns the client relationship. | Acme Corp | Account lead |
| Runs the bid plan. | Acme Corp | Bid manager |
| Designs the solution. | Globex | Solution architect |
```

- Columns can be in any order, and headers ignore case and spaces (`Starts at`, `starts at` and `StartsAt` are the same).
- Optional columns can be left out, or left empty.
- An unknown column is a warning, and is ignored. A missing required column is an error naming the table and the column.
- A required cell left empty is an error naming the row. Completely empty rows are skipped.
- Lists in a cell (parties, roles, inputs, outputs, systems, KPIs) are separated by semicolons: `Acme Corp; Globex`.
- To put a `|` inside a cell, write `\|`.

Every table can also have these optional columns:

| Column | What it does |
|---|---|
| `Change` | How this differs from today: `New`, `Changed`, `Removed` or `Unchanged`. |
| `Today` | How it works today, shown next to the future state. Needs `Change`. |
| `ID` | An explicit id. By default each id comes from the name: lower case, with hyphens (`Account lead` → `account-lead`). |

### Parties

| Column | Required | What it holds |
|---|---|---|
| `Party` | Yes | The party's name. |
| `Summary` | No | One or two sentences about it. |

### Teams

| Column | Required | What it holds |
|---|---|---|
| `Team` | Yes | The team's name. |
| `Party` | Yes | The name of the party it belongs to. |
| `Summary` | No | One or two sentences about it. |

### Roles

| Column | Required | What it holds |
|---|---|---|
| `Role` | Yes | The role's name. |
| `Party` | Yes | The name of the party it belongs to. |
| `Team` | No | The name of its team. |
| `Summary` | No | What this role does. |

### Workstreams

| Column | Required | What it holds |
|---|---|---|
| `Workstream` | Yes | The workstream's name. |
| `Summary` | Yes | One or two sentences about it. |
| `Parties` | No | The names of the parties involved, separated by semicolons. |
| `Detail` | Yes | `Detailed` (its processes are mapped) or `Outline` (not yet). |

### Personas

| Column | Required | What it holds |
|---|---|---|
| `Persona` | Yes | The persona's name. |
| `Roles` | Yes | The names of the roles this persona plays, separated by semicolons. |
| `Starts at` | Yes | Where the viewer starts: `Overview`, `Workstream: <name>`, `Process: <name>` or `Role: <name>`. |
| `Summary` | No | A short description, shown when viewers choose a persona. |

```markdown
## Personas

| Persona | Roles | Starts at | Summary |
|---|---|---|---|
| Acme account lead | Account lead | Process: Qualify an opportunity | You own the client. |
| Globex solution team | Solution architect | Workstream: Presales | You design the solution. |
| New joiner | Account lead; Bid manager | Overview | Start with the big picture. |
```

## Processes

Each process has its own section. It starts with some lines, then the step table, then optional `### RACI` and `### Notes` subsections.

```markdown
## Process: Qualify an opportunity

Workstream: Presales
Summary: Decide quickly and together whether an opportunity is worth pursuing.

| # | Step | Owner | Description | Outputs | Next |
|---|---|---|---|---|---|
| 1 | Capture the lead | Account lead | Log the opportunity as soon as the client mentions it. | Lead record | |
| 2 | Go or no-go | account LEAD | Decide together whether to bid. | | Go: Kick off the bid; No go: 3 |
| 3 | Decline politely | Account lead | Tell the client why. | | End |
| 4 | Kick off the bid | Bid manager | Agree the bid team and the plan. | Bid plan | |

### RACI

| Step | Account lead | Bid manager | Solution architect |
|---|---|---|---|
| Capture the lead | A | | |
| Go or no-go | A | I | C |
| Decline politely | A | | |
| Kick off the bid | | A | C |

### Notes

#### Why this matters

Most lost bids were lost **before they started**.
```

| Line | Required | What it does |
|---|---|---|
| `Workstream: <name>` | Yes | The workstream this process belongs to. |
| `Summary: <text>` | No | One or two sentences about the process. |
| `Change:` and `Today:` | No | Current vs future state of the whole process, as in the table columns. |
| `ID: <id>` | No | An explicit id for the process. |

### The step table

| Column | Required | What it holds |
|---|---|---|
| `#` | Yes | The step's number, used by `Next` and the RACI matrix. Number the rows 1, 2, 3 and so on. |
| `Step` | Yes | The step's name. Names must be different within a process. |
| `Owner` | Yes | The name of the role that owns the step. The step sits in this role's lane. |
| `Description` | No | What happens. Markdown is allowed. |
| `Inputs` | No | What the step needs, separated by semicolons. |
| `Outputs` | No | What the step produces, separated by semicolons. |
| `Systems` | No | Tools or systems used, separated by semicolons. |
| `KPIs` | No | How the step is measured, separated by semicolons. |
| `Next` | No | The steps that follow (see below). |

Steps appear in the order of the rows.

### Next

- **Empty:** the flow goes on to the following row.
- **One or more steps:** a `#` number or a step name, separated by semicolons, e.g. `4` or `Kick off the bid; 5`.
- **Labelled branches** for a decision: `label: step`, e.g. `Go: 4; No go: 5`. Each branch becomes a labelled connector.
- **`End`:** the flow stops at this step.

A `Next` that points to a step that doesn't exist in the process is an error naming the row and the step.

### The RACI matrix

`### RACI` is a table with one row per step and one column per role:

- The first column names the step, by `#` or by name. Its header can be anything, e.g. `Step`.
- Every other column header is a role's name.
- Each cell is empty or **one letter**: `R` (responsible: does the work), `A` (accountable: signs it off), `C` (consulted) or `I` (informed).
- A cell with more than one letter, such as `A/R`, is an error. Choose R if the role does the work, or A if it signs the work off.
- Every step should have **exactly one A**. A step with no A, or with more than one, is a warning. It doesn't stop the export.
- The owner counts as R when it has no letter of its own.
- An unknown role column or step row is an error, with a suggestion when a name is close.

### Notes

`### Notes` is the process's text, shown on the process page. Its headings start at `####` (see [Text](#text-in-purpose-about-this-model-and-notes)).

## Notes for other elements

`## Notes: <name>` attaches text to the party, team, role, workstream, process or persona with that name:

```markdown
## Notes: Presales

Presales is where the partnership is **won or lost**. Both parties work from one bid plan.
```

An unknown name is an error, with a suggestion when one is close. So is a name shared by two kinds of thing, because the engine can't tell which one the notes are for: rename one of them, or put the text in that process's `### Notes`.

## Theme

`## Theme` is optional. It holds `Label <term>: <word>` lines, one per line: your word for one of the engine's terms: `model`, `party`, `team`, `role`, `persona`, `workstream`, `process`, `step` and `key message`, each also in the plural (`Label workstreams`). Rename both forms together.

```markdown
## Theme

Label workstream: Value stream
Label workstreams: Value streams
```

The frame always uses the engine's neutral theme. Lines for colours, fonts, a logo or a palette are retired: each one is ignored with a warning, because party colours and marks now come from brand packs.

An image is read from an `assets/` folder next to the sheet. To load it, put the sheet and `assets/` in one folder (or `.zip`) and load that.

## Open questions and Sources

```markdown
## Open questions

- [ ] Who signs off the price: the account lead or the partner manager?
- [x] Does Globex join the go or no-go decision? Yes, from March.

## Sources

- Partnership kick-off deck, 3 March.
- Workshop notes, 12 March.
```

- Each unticked item (`- [ ]`) in **Open questions** is shown as a warning in author mode, quoting the question. Ticked items (`- [x]`) are ignored. Open questions don't stop the export.
- **Sources** lists what the sheet was drafted from, so reviewers can check it.
- Neither section, and no HTML comment, is ever included in an exported snapshot.

## Validation messages

Every message about a capture sheet says where in the sheet the problem is: the section, and the row and name where there is one, e.g. `Process: Build the proposal › row 2 (Design the solution)` or `Roles › row 3 (Legal counsel)`. Then it says what's wrong and how to fix it.

## Loading a sheet

- Load the sheet on its own as a single `.md` file, or load a folder (or `.zip`) that holds the sheet and its `assets/` folder.
- A folder can hold either one capture sheet or a folder of element files, not both. Mixing them is an error.
