---
id: flow
type: process
name: Main flow
workstream: main-ws
steps:
  - id: capture
    name: Capture the lead
    owner: account-lead
    raci:
      account-lead: A
  - id: price
    name: Agree the price
    owner: pricing-panel
  - id: go-no-go
    name: Go or no-go
    owner: bid-board
    next:
      - to: scope
        label: Go
      - to: decline
        label: No go
  - id: scope
    name: Scope the work
    owner: solution-architect
    raci:
      solution-architect: A
    next: []
  - id: decline
    name: Decline politely
    owner: account-lead
    raci:
      account-lead: A
    next: []
---
