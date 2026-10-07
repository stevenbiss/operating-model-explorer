---
id: main-flow
type: process
name: Main flow
workstream: main-work
steps:
  - id: capture-the-lead
    name: Capture the lead
    owner: account-lead
    raci:
      account-lead: A
  - id: kick-off-the-bid
    name: Kick off the bid
    owner: [bid-manager, solution-architect]
    description: The bid manager and the solution architect kick off the bid together.
    raci:
      bid-manager: A
  - id: plan-the-work
    name: Plan the work
    owner: solution-architect
    raci:
      solution-architect: A
    next: []
---
