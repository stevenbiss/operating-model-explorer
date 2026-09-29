# Operating model: <!-- The model's name, e.g. Acme + Globex partnership -->

Format: 1

<!--
A capture sheet holds a whole operating model in one file. Fill in each section, then load the sheet
in the engine to check it. Comments like this one are ignored: delete them when you're done, or leave them.
The full format is in docs/capture-sheet.md, and examples/acme-capture-sheet/capture-sheet.md is a complete example.

Refer to things by name, exactly as they are written in their own table (case and spacing don't matter).
Optional lines under the title: "ID: my-model" (the snapshot's file name) and "Version: 1.0".
-->

## Purpose

<!-- Required. Why this operating model exists, in a sentence or two. Markdown such as **bold** works. -->

## Key messages

<!-- Required. The conclusions every viewer should reach, one per line, each starting with "- ". -->

## About this model

<!-- Optional. Who the model is for, what it covers and how to read it. Headings here start at ###. -->

## Parties

<!-- Required. The organisations taking part: one row each. -->

| Party | Summary |
|---|---|

## Teams

<!-- Optional. Teams inside a party. Party is the name of a party above. -->

| Team | Party | Summary |
|---|---|---|

## Roles

<!-- Required. The roles that do the work. Party and Team are names from the tables above; Team is optional.
Optional columns on every table: Change (New, Changed, Removed or Unchanged), Today (how it works today) and ID. -->

| Role | Party | Team | Summary |
|---|---|---|---|

## Workstreams

<!-- Groups of processes. Parties: names separated by semicolons. Detail: Detailed or Outline. -->

| Workstream | Summary | Parties | Detail |
|---|---|---|---|

## Process: <!-- The process's name. Copy this whole section once per process. -->

Workstream: <!-- The name of its workstream -->
Summary: <!-- Optional: one or two sentences -->

<!--
One row per step, in order. Owner is a role's name. Lists in a cell are separated by semicolons.
Next: leave empty to go to the following row; write a # or step name; label decision branches
("Go: 4; No go: 5"); or write End to finish the flow at this step.
-->

| # | Step | Owner | Description | Inputs | Outputs | Systems | KPIs | Next |
|---|---|---|---|---|---|---|---|---|

### RACI

<!--
One row per step (by # or name) and one column per role (by name). Each cell is one letter or empty:
R does the work, A signs it off, C is consulted, I is informed. Give every step exactly one A.
Never combine letters such as A/R: choose R if the role does the work, or A if it signs the work off.
-->

| Step |
|---|

### Notes

<!-- Optional. The process's narrative. Headings here start at ####. -->

## Personas

<!-- Optional. The types of viewer. Roles: role names separated by semicolons.
Starts at: Overview, Workstream: <name>, Process: <name> or Role: <name>. -->

| Persona | Roles | Starts at | Summary |
|---|---|---|---|

## Theme

<!--
Optional. One "Key: value" line each; anything left out uses the default theme. For example:

Primary colour: #0b1f4d
Accent colour: #b34700
Background colour: #ffffff
Surface colour: #f4f5f7
Text colour: #1a1a1a
Palette: #3a6ea5; #2e7d5b
Body font: Segoe UI, system-ui, sans-serif
Heading font: Georgia, serif
Logo: assets/logo.svg
Label workstream: Value stream
Label workstreams: Value streams

A logo or font file goes in an assets/ folder next to the sheet; load the folder (or a .zip of it).
-->

<!--
## Notes: <name>

Optional, one section per element: text for the party, team, role, workstream, process or persona
with that name, shown on its page.
-->

## Open questions

<!-- Things still to decide, as a checklist: "- [ ] question". Tick an answered one with "- [x]".
Unticked questions show as warnings. They are never included in a snapshot. -->

## Sources

<!-- The material this sheet was drafted from, one per line starting with "- ". Never included in a snapshot. -->
