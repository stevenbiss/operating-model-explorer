---
id: build-proposal
type: process
name: Build the proposal
workstream: presales
summary: Design, price and review the proposal, then send it to the client.
steps:
  - id: plan-bid
    name: Plan the bid
    owner: bid-manager
    description: Break the bid into tasks and agree who writes what.
    inputs: [Bid plan]
    outputs: [Task list]
  - id: design-solution
    name: Design the solution
    owner: solution-architect
    description: Write the solution and the delivery approach.
    raci:
      delivery-manager: C
    outputs: [Solution design]
  - id: price-solution
    name: Price the solution
    owner: pricing-analyst
    description: Build the price from the design and check the margin.
    inputs: [Solution design]
    outputs: [Price model]
    systems: [Pricing tool]
  - id: review-proposal
    name: Review the proposal
    owner: account-lead
    description: Read the whole proposal as the client would.
    raci:
      account-lead: A
      delivery-manager: C
      solution-architect: C
    next:
      - to: submit-proposal
        label: Approved
      - to: design-solution
        label: Needs rework
  - id: submit-proposal
    name: Submit the proposal
    owner: account-lead
    description: Send the proposal to the client and confirm it arrived.
    raci:
      legal-counsel: C
      partner-manager: I
    kpis: [Submitted on or before the deadline]
  - id: courier-copies
    name: Courier printed copies
    owner: bid-manager
    description: Print and courier bound copies to the client.
    change:
      status: removed
      today: Every proposal was printed and couriered, even when the client asked for email.
---
## How we build proposals

1. **Plan** the bid together.
2. **Design** first, then **price** from the design.
3. **Review** as the client would, and loop back if it needs rework.
