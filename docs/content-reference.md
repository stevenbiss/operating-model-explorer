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
| `steps` | Yes | list of groups of fields | The steps, in order. A step flows to the next one in the list unless it has next. (EDGY: Activity) |
| `steps[].id` | Yes | text | Id, unique within this process: lower-case letters and numbers joined by hyphens, e.g. scope. |
| `steps[].name` | Yes | text | The step's display name. |
| `steps[].owner` | Yes | text | The id of the role that owns this step. The step sits in this role's lane. |
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

## theme

Optional look and language of the model: colours, fonts, logo and the words used for each term. Lives in theme.md at the top of the folder. Anything left out uses the neutral default theme.

**EDGY concept:** None (presentation only)

| Field | Required | Value | Description |
|---|---|---|---|
| `type` | Yes | one of: theme | Always theme. |
| `id` | No | text | Optional id: lower-case letters and numbers joined by hyphens. |
| `name` | No | text | Optional theme name. |
| `colors` | No | group of fields | Colours as hex codes, e.g. "#0b1f4d". Put quotes around them. |
| `colors.primary` | No | text | Header, active navigation and selected items. A hex colour such as #0b1f4d. |
| `colors.accent` | No | text | Highlights. A hex colour such as #e0632a. |
| `colors.background` | No | text | Page background. A hex colour such as #ffffff. |
| `colors.surface` | No | text | Cards and panels. A hex colour such as #f4f5f7. |
| `colors.text` | No | text | Body text. A hex colour such as #1a1a1a. |
| `colors.palette` | No | list of text | Colours for parties and lanes, used in order. |
| `fonts` | No | group of fields | A font file in assets/ (e.g. assets/brand.woff2) or a system font stack (e.g. Georgia, serif). Web addresses are not allowed. |
| `fonts.body` | No | text | Font for body text. |
| `fonts.heading` | No | text | Font for headings. |
| `logo` | No | text | An image file in assets/, e.g. assets/logo.svg. |
| `labels` | No | group of fields | Your words for the engine's terms. Anything left out keeps its default. |
| `labels.model` | No | text | Default: Model |
| `labels.models` | No | text | Default: Models |
| `labels.party` | No | text | Default: Party |
| `labels.parties` | No | text | Default: Parties |
| `labels.team` | No | text | Default: Team |
| `labels.teams` | No | text | Default: Teams |
| `labels.role` | No | text | Default: Role |
| `labels.roles` | No | text | Default: Roles |
| `labels.persona` | No | text | Default: Persona |
| `labels.personas` | No | text | Default: Personas |
| `labels.workstream` | No | text | Default: Workstream |
| `labels.workstreams` | No | text | Default: Workstreams |
| `labels.process` | No | text | Default: Process |
| `labels.processes` | No | text | Default: Processes |
| `labels.step` | No | text | Default: Step |
| `labels.steps` | No | text | Default: Steps |
| `labels.key_message` | No | text | Default: Key message |
| `labels.key_messages` | No | text | Default: Key messages |

**Example**

```yaml
---
type: theme
colors:
  primary: '#0b1f4d'
  accent: '#e0632a'
  background: '#ffffff'
  surface: '#f4f5f7'
  text: '#1a1a1a'
  palette:
    - '#3a6ea5'
    - '#2e7d5b'
fonts:
  body: Segoe UI, system-ui, sans-serif
logo: assets/logo.svg
labels:
  workstream: Value stream
  workstreams: Value streams
---
```
