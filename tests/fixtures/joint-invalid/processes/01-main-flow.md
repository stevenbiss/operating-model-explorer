---
id: main-flow
type: process
name: Main flow
workstream: main-work
steps:
  - id: decide-together
    name: Decide together
    owner: [bid-manager, bid-board]
    raci:
      bid-manager: A
  - id: plan-the-bid
    name: Plan the bid
    owner: [bid-manager, bid-manager]
    raci:
      bid-manager: A
    next: []
---
