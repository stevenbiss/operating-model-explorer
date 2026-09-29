---
id: qualify-opportunity
type: process
name: Qualify an opportunity
workstream: presales
summary: Decide quickly and together whether an opportunity is worth pursuing.
steps:
  - id: capture-lead
    name: Capture the lead
    owner: account-lead
    description: Log the opportunity as soon as the client mentions it.
    outputs: [Lead record]
    systems: [CRM]
    kpis: [Leads logged within 1 day]
  - id: assess-fit
    name: Assess solution fit
    owner: solution-architect
    description: Check whether Globex can build what the client needs.
    raci:
      account-lead: C
      partner-manager: I
    inputs: [Lead record]
    outputs: [Fit assessment]
  - id: go-no-go
    name: Go or no-go
    owner: account-lead
    description: Decide together whether to bid.
    raci:
      account-lead: A
      partner-manager: C
      bid-manager: I
    inputs: [Fit assessment]
    kpis: [Decision within 5 working days]
    next:
      - to: kick-off-bid
        label: Go
      - to: decline
        label: No go
  - id: decline
    name: Decline politely
    owner: account-lead
    description: Tell the client why, and what would change the answer.
    next: []
    change:
      status: new
      today: Opportunities without a fit were left to go cold, with no reply to the client.
  - id: kick-off-bid
    name: Kick off the bid
    owner: bid-manager
    description: Agree the bid team, the plan and the deadline.
    raci:
      solution-architect: C
      delivery-manager: I
    outputs: [Bid plan]
    systems: [Shared bid workspace]
    change:
      status: changed
      today: Kick-off happened by email, and Globex joined a week later.
---
## Why this matters

Most lost bids were lost **before they started**. This process makes sure that:

- every lead is logged the same day
- Globex sees the lead before anyone promises a solution
- the client always gets an answer
