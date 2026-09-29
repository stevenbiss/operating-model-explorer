---
id: flow
type: process
name: Main flow
workstream: main-ws
steps:
  - id: start
    name: Start the work
    owner: account-lead
    change: { status: maybe }
  - id: design
    name: Design the answer
    owner: solution-architect
---
