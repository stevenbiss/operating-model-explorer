---
id: change-flow
type: process
name: Approve a change
workstream: main-ws
steps:
  - id: raise
    name: Raise the change
    owner: change-lead
    raci:
      change-lead: A
  - id: approve
    name: Approve the change
    owner: steering-group
  - id: announce
    name: Announce the change
    owner: change-lead
    raci:
      change-lead: A
    next: []
---
