# Content reference

Every content file starts with a header between two `---` lines, followed by optional Markdown text. This page lists the header fields for each `type`.
Fields inside an optional group (such as `change.status`) are only required when that group is used.

_Generated from `schema/*.schema.json` by `npm run build`. Do not edit by hand._

## model

The operating model itself: its name, purpose and the key messages everyone should take away. Exactly one per folder, in model.md at the top of the folder.

**EDGY concept:** Outcome / Purpose

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. acme-sample. Also used as the snapshot file name. |
| `type` | Yes | one of: model | Always model. |
| `name` | Yes | text | The model's display name. |
| `purpose` | Yes | text | Why this operating model exists. Markdown is allowed. |
| `key_messages` | Yes | list of text | The shared conclusions every viewer should reach, in order. |
| `version` | No | text or number | Optional content version, shown in the snapshot footer. |
| `view` | No | one of: simple, detailed | Optional view the home page opens in: simple (the default) shows the name, parties, workstreams, processes and structure diagrams; detailed also shows the purpose, the About this model text, the key messages and the persona doors. Viewers can switch with the toggle on the home page. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: acme-sample
type: model
name: Acme + Globex partnership
purpose: How Acme and Globex win and deliver joint work.
key_messages:
  - One team, one plan
  - Globex owns the solution, Acme owns the client
version: '1.0'
---
```

## party

An organisation taking part in the model, such as a partner company or a client. Lanes in a swimlane are grouped by party.

**EDGY concept:** Organisation

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. acme. |
| `type` | Yes | one of: party | Always party. |
| `name` | Yes | text | The organisation's display name. |
| `summary` | No | text | One or two sentences about this party. |
| `brand` | No | text | Optional id of a brand pack in brands/<id>/, e.g. acme. The party is then shown with that brand's colour and mark. Left out, it gets a neutral colour and its initials. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: acme
type: party
name: Acme Corp
summary: The client-facing partner.
brand: acme
---
```

## team

A team inside one party. Roles can optionally belong to a team.

**EDGY concept:** Organisation

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. acme-sales. |
| `type` | Yes | one of: team | Always team. |
| `name` | Yes | text | The team's display name. |
| `party` | Yes | text | The id of the party this team belongs to. |
| `summary` | No | text | One or two sentences about this team. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: acme-sales
type: team
name: Sales
party: acme
---
```

## role

A role that owns or takes part in process steps. Each role that appears in a process gets its own lane in the swimlane.

**EDGY concept:** People

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. account-lead. |
| `type` | Yes | one of: role | Always role. |
| `name` | Yes | text | The role's display name. |
| `party` | Yes | text | The id of the party this role belongs to. |
| `team` | No | text | Optional id of the team this role belongs to. |
| `summary` | No | text | One or two sentences about what this role does. |
| `people` | No | list of text | Optional names of the people who hold this role, in order. One name is shown under the role name wherever the role appears; two or more show as Multiple people. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: account-lead
type: role
name: Account lead
party: acme
team: acme-sales
summary: Owns the client relationship.
people:
  - Sam Example
---
```

## committee

A group of roles, from any parties, that owns steps together. Each member has one RACI letter, and the members marked A are jointly accountable. A committee belongs to no party.

**EDGY concept:** Organisation

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. bid-board. Used as a step's owner. |
| `type` | Yes | one of: committee | Always committee. |
| `name` | Yes | text | The committee's display name. It can't be the same as a role's name. |
| `summary` | No | text | One or two sentences about what this committee decides. |
| `members` | Yes | role id: R, A, C, I | At least one member role id, each to one letter: A (shares the decision, jointly accountable), R (does the work), C (consulted) or I (informed), e.g. partner-manager: A. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
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

## persona

A type of viewer. A persona maps to one or more roles, whose lanes and steps are highlighted, and has an entry point where the viewer starts.

**EDGY concept:** People

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. partner-lead. Used in links. |
| `type` | Yes | one of: persona | Always persona. |
| `name` | Yes | text | The persona's display name. |
| `summary` | No | text | A short description, shown when viewers choose a persona. |
| `roles` | Yes | list of text | The ids of one or more roles this persona plays. |
| `entry` | Yes | group of fields | Where this persona starts. |
| `entry.view` | Yes | one of: overview, workstream, process, role | The kind of view to open. |
| `entry.id` | No | text | The id of the workstream, process or role to open. Not needed for overview. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: partner-lead
type: persona
name: Partner lead
summary: You run the relationship.
roles:
  - account-lead
entry:
  view: process
  id: qualify-opportunity
---
```

## workstream

A grouping of related processes. A detailed workstream has processes; an outline workstream only has a summary.

**EDGY concept:** Capability (grouping)

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. presales. |
| `type` | Yes | one of: workstream | Always workstream. |
| `name` | Yes | text | The workstream's display name. |
| `summary` | Yes | text | What this workstream covers. |
| `parties` | No | list of text | The ids of the parties involved. |
| `detail` | Yes | one of: detailed, outline | detailed if it has processes, outline if it is only summarised for now. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: presales
type: workstream
name: Presales
summary: From first conversation to signed proposal.
parties:
  - acme
  - globex
detail: detailed
---
```

## process

A process inside one workstream, with its steps in order. It is shown as a swimlane with one lane per role.

**EDGY concept:** Process

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. qualify-opportunity. |
| `type` | Yes | one of: process | Always process. |
| `name` | Yes | text | The process's display name. |
| `workstream` | Yes | text | The id of the workstream this process belongs to. |
| `summary` | No | text | One or two sentences about this process. |
| `status` | No | one of: under-review, agreed | Optional review status: under-review (the default) while it may still change, or agreed once it is settled. Shown as a badge wherever the process appears. |
| `steps` | Yes | list of groups of fields | The steps, in order. A step flows to the next one in the list unless it has next. (EDGY: Activity) |
| `steps[].id` | Yes | text | Id, unique within this process: lower-case letters and numbers joined by hyphens, e.g. scope. |
| `steps[].name` | Yes | text | The step's display name. |
| `steps[].owner` | Yes | text | The id of the role or committee that owns this step. The step sits in that role's or committee's lane. |
| `steps[].description` | No | text | What happens in this step. Markdown is allowed. |
| `steps[].raci` | No | role id: R, A, C, I | Role id to R (responsible), A (accountable), C (consulted) or I (informed), e.g. solution-architect: C. |
| `steps[].inputs` | No | list of text | What this step needs. (EDGY: Object) |
| `steps[].outputs` | No | list of text | What this step produces. (EDGY: Object) |
| `steps[].systems` | No | list of text | Tools or systems used. |
| `steps[].kpis` | No | list of text | How this step is measured. |
| `steps[].next` | No | list of text or groups of fields | The steps that follow. Use a step id, or { to: step-id, label: Yes } for a labelled decision branch. Use [] to end the flow here. |
| `steps[].next[].to` | Yes | text | The id of the following step in this process. |
| `steps[].next[].label` | No | text | The branch label, e.g. Yes or No. |
| `steps[].change` | No | group of fields | Optional current vs future state. |
| `steps[].change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `steps[].change.today` | No | text | How it works today, shown next to the future state. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: qualify-opportunity
type: process
name: Qualify an opportunity
workstream: presales
steps:
  - id: capture
    name: Capture the lead
    owner: account-lead
    outputs: [Lead record]
  - id: go-no-go
    name: Go / no-go
    owner: account-lead
    raci: {solution-architect: C}
    next: [{to: scope, label: Go}, {to: decline, label: No go}]
  - id: scope
    name: Scope the work
    owner: solution-architect
    next: []
  - id: decline
    name: Decline politely
    owner: account-lead
    change: {status: new, today: Leads are left to go cold.}
---
```

## structure

A relationship diagram you design: one column per party, rows (bands) you name yourself, boxes that place roles and teams in a band, and plain lines between cells.

**EDGY concept:** Organisation (structure view)

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | Unique id: lower-case letters and numbers joined by hyphens, e.g. partnership. |
| `type` | Yes | one of: structure | Always structure. |
| `name` | Yes | text | The diagram's display name. |
| `kind` | No | text | Optional label in your own words, e.g. Partnership, Market or Sub-programme. It has no built-in meaning. |
| `summary` | No | text | One or two sentences about this diagram. |
| `status` | No | one of: under-review, agreed | Optional review status: under-review (the default) while it may still change, or agreed once it is settled. Shown as a badge wherever the diagram appears. |
| `main` | No | true or false | true for the one diagram that covers the whole company or partnership. A model with diagrams has exactly one. |
| `related` | No | list of text | The ids of related structures. Each relation is shown from both sides. |
| `workstreams` | No | list of text | The ids of related workstreams. |
| `bands` | Yes | list of groups of fields | The rows, top to bottom. A band can hold sub-bands, one level deep. |
| `bands[].id` | Yes | text | Id, unique within this structure: lower-case letters and numbers joined by hyphens, e.g. leadership. |
| `bands[].name` | Yes | text | The band's label. |
| `bands[].opens` | No | text | Optional id of a structure that this band opens (drill down). |
| `bands[].bands` | No | list of groups of fields | Optional sub-bands, top to bottom. A band with sub-bands holds no boxes of its own. |
| `bands[].bands[].id` | Yes | text | Id, unique within this structure: lower-case letters and numbers joined by hyphens, e.g. harbour. |
| `bands[].bands[].name` | Yes | text | The sub-band's label. |
| `bands[].bands[].opens` | No | text | Optional id of a structure that this sub-band opens (drill down). |
| `bands[].bands[].bands` | No | list | Not allowed: bands can be nested only one level deep. |
| `boxes` | Yes | list of groups of fields | The boxes, in order. Each places one role or one team in a band, in the column of its party. |
| `boxes[].band` | Yes | text | The id of the band (or sub-band) the box sits in. |
| `boxes[].role` | No | text | The id of the role in this box. Use role or team, not both. |
| `boxes[].team` | No | text | The id of the team in this box. Use role or team, not both. |
| `boxes[].name` | No | text | Optional text, e.g. the person who holds the role, or TBA. |
| `boxes[].note` | No | text | Optional extra text, e.g. a grade or another title. |
| `boxes[].change` | No | group of fields | Optional current vs future state. |
| `boxes[].change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `boxes[].change.today` | No | text | How it works today, shown next to the future state. |
| `lines` | No | list of groups of fields | Plain lines between two cells, each given as a band and a party. Lines have no direction. |
| `lines[].from` | Yes | group of fields | One end of the line. |
| `lines[].from.band` | Yes | text | The id of the band. |
| `lines[].from.party` | Yes | text | The id of the party (the column). |
| `lines[].to` | Yes | group of fields | The other end of the line. |
| `lines[].to.band` | Yes | text | The id of the band. |
| `lines[].to.party` | Yes | text | The id of the party (the column). |
| `lines[].label` | No | text | Optional text shown with the line, e.g. Joint steering. |
| `change` | No | group of fields | Optional current vs future state. |
| `change.status` | Yes | one of: new, changed, removed, unchanged | How this element differs from today. |
| `change.today` | No | text | How it works today, shown next to the future state. |

**Example**

```yaml
---
id: partnership
type: structure
name: Partnership structure
kind: Partnership
main: true
related:
  - harbour-account
workstreams:
  - presales
bands:
  - id: leadership
    name: Partnership leadership
  - id: accounts
    name: Account management
    bands: [{id: harbour, name: Harbour account, opens: harbour-account}, {id: summit, name: Summit account}]
boxes:
  - band: leadership
    role: partner-manager
    name: Sam Example
    note: 'Grade: Director'
  - band: harbour
    team: globex-solutions
lines:
  - from: {band: leadership, party: acme}
    to: {band: leadership, party: globex}
    label: Joint steering
---
```

## theme

Optional words used for each term, in theme.md at the top of the folder. The frame always uses the engine's neutral theme, and each party's colours and mark come from its brand pack.

**EDGY concept:** None (presentation only)

| Field | Required | Value | Description |
|---|---|---|---|
| `type` | Yes | one of: theme | Always theme. |
| `id` | No | text | Optional id: lower-case letters and numbers joined by hyphens. |
| `name` | No | text | Optional theme name. |
| `colors` | No | group of fields | Retired in 1.2: ignored, with a warning. Party colours now come from brand packs. |
| `fonts` | No | group of fields | Retired in 1.2: ignored, with a warning. The engine always uses its own fonts. |
| `logo` | No | text | Retired in 1.2: ignored, with a warning. The header shows the party marks from brand packs. |
| `palette` | No | list | Retired in 1.2: ignored, with a warning. Each party's colour comes from its brand pack. |
| `labels` | No | group of fields | Your words for the engine's terms. Anything left out keeps its default. |
| `labels.model` | No | text | Default: Model |
| `labels.models` | No | text | Default: Models |
| `labels.party` | No | text | Default: Party |
| `labels.parties` | No | text | Default: Parties |
| `labels.team` | No | text | Default: Team |
| `labels.teams` | No | text | Default: Teams |
| `labels.role` | No | text | Default: Role |
| `labels.roles` | No | text | Default: Roles |
| `labels.committee` | No | text | Default: Committee |
| `labels.committees` | No | text | Default: Committees |
| `labels.persona` | No | text | Default: Persona |
| `labels.personas` | No | text | Default: Personas |
| `labels.workstream` | No | text | Default: Workstream |
| `labels.workstreams` | No | text | Default: Workstreams |
| `labels.process` | No | text | Default: Process |
| `labels.processes` | No | text | Default: Processes |
| `labels.step` | No | text | Default: Step |
| `labels.steps` | No | text | Default: Steps |
| `labels.structure` | No | text | Default: Structure |
| `labels.structures` | No | text | Default: Structures |
| `labels.key_message` | No | text | Default: Key message |
| `labels.key_messages` | No | text | Default: Key messages |

**Example**

```yaml
---
type: theme
labels:
  workstream: Value stream
  workstreams: Value streams
---
```

## brand

A brand pack: a party's colours and mark. It lives in brands/<id>/brand.md, next to its image files, and is copied into the model from the brand library. The Markdown text below the header holds usage notes, which are never shown or exported. A party uses it with a brand: line (or the capture sheet's Brand column).

**EDGY concept:** None (presentation only)

| Field | Required | Value | Description |
|---|---|---|---|
| `id` | Yes | text | The pack's id, the same as its folder name: lower-case letters and numbers joined by hyphens, e.g. globex. |
| `name` | Yes | text | The brand's name. |
| `version` | Yes | text or number | The pack's version in the brand library, e.g. "2026.1". Put quotes around it, so a version such as 2026.10 keeps its last 0. |
| `updated` | Yes | text | The date the pack was last changed, as YYYY-MM-DD, e.g. 2026-03-01. |
| `colours` | Yes | group of fields | The brand's colours. Colours must be hex values such as "#0b1f4d". Put quotes around them. |
| `colours.primary` | Yes | text | The main brand colour. Colours must be hex values such as "#0b1f4d". |
| `colours.secondary` | No | text | Used when the primary colour is too close to another party's. Colours must be hex values such as "#e0632a". |
| `colours.dark` | No | text | The primary colour for dark mode. Left out, the engine derives one. Colours must be hex values such as "#6a86bc". |
| `marks` | Yes | group of fields | Image files in the pack's own folder, written relative to it, e.g. mark.svg. |
| `marks.mark` | Yes | text | A square SVG mark, shown next to the party's name, e.g. mark.svg. |
| `marks.mono` | No | text | Optional one-colour version of the mark, e.g. mark-mono.svg. |
| `marks.full` | No | text | Optional full logo, e.g. logo.svg. |

**Example**

```yaml
---
id: globex
name: Globex
version: '2026.1'
updated: '2026-03-01'
colours:
  primary: '#2e7d5b'
  secondary: '#3a6ea5'
marks:
  mark: mark.svg
---
```
