---
id: triage
type: process
name: Triage a request
workstream: main-ws
steps:
  - id: log-request
    name: Log the request
    owner: account-lead
    raci:
      account-lead: A
  - id: decide-route
    name: Decide the route
    owner: account-lead
    raci:
      account-lead: A
    next:
      - to: grow-account
        label: Existing account
      - to: start-initiative
        label: New initiative
      - to: decline-request
        label: Not for us
      - to: refer-request
        label: Refer to the other party
      - to: park-request
        label: Park or decline
  - id: grow-account
    name: Grow the account
    owner: account-lead
    raci:
      account-lead: A
    next: []
  - id: start-initiative
    name: Start an initiative
    owner: solution-architect
    raci:
      solution-architect: A
    next: []
  - id: decline-request
    name: Decline politely
    owner: account-lead
    raci:
      account-lead: A
    next: []
  - id: refer-request
    name: Refer the request
    owner: reviewer
    raci:
      reviewer: A
    next: []
  - id: park-request
    name: Park the request
    owner: solution-architect
    raci:
      solution-architect: A
    next: []
---
