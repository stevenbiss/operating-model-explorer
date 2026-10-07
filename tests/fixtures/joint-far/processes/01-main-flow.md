---
id: main-flow
type: process
name: Main flow
workstream: main-work
steps:
  - id: open-the-bid
    name: Open the bid
    owner: bid-manager
    raci:
      bid-manager: A
    next: [kick-off-the-bid, brief-the-client]
  - id: kick-off-the-bid
    name: Kick off the bid
    owner: [bid-manager, solution-architect]
    raci:
      bid-manager: A
    next: [close-the-bid]
  - id: brief-the-client
    name: Brief the client
    owner: account-lead
    raci:
      account-lead: A
    next: [close-the-bid]
  - id: close-the-bid
    name: Close the bid
    owner: bid-manager
    raci:
      bid-manager: A
    next: []
---
