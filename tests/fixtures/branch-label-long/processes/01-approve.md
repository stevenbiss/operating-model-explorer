---
id: approve
type: process
name: Approve the offer
workstream: main-ws
steps:
  - id: draft-offer
    name: Draft the offer
    owner: account-lead
    raci:
      account-lead: A
  - id: check-offer
    name: Check the offer
    owner: solution-architect
    raci:
      solution-architect: A
    next:
      - to: send-offer
        label: Approved by both parties and ready to send to the client now
      - to: draft-offer
        label: Needs changes
  - id: send-offer
    name: Send the offer
    owner: account-lead
    raci:
      account-lead: A
---
