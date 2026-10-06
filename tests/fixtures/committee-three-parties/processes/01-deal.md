---
id: deal
type: process
name: Agree a deal
workstream: main-ws
steps:
  - id: request
    name: Send a request
    owner: buyer
    raci:
      buyer: A
      account-lead: I
  - id: decide
    name: Decide on the deal
    owner: deal-board
  - id: deliver
    name: Deliver the work
    owner: partner-manager
    raci:
      partner-manager: A
    next: []
---
