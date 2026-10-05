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
  - id: go-no-go
    name: Go or no-go
    owner: bid-board
    raci:
      delivery-manager: I
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
  - id: review
    name: Review together
    owner: bid-board
    next: []
  - id: decline
    name: Decline politely
    owner: account-lead
    raci:
      account-lead: A
    next: []
---
