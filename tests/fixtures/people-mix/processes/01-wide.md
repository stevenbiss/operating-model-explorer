---
id: wide
type: process
name: Wide process
workstream: main-ws
steps:
  - id: capture
    name: Capture the lead
    owner: account-lead
    raci: { account-lead: A, legal-counsel: I, gamma-lead: I }
  - id: assess
    name: Assess the fit
    owner: solution-architect
    raci: { solution-architect: A, account-lead: C, legal-counsel: I, gamma-lead: I }
  - id: check
    name: Check the terms
    owner: legal-counsel
    raci: { legal-counsel: A, account-lead: C, gamma-lead: I }
  - id: scope
    name: Scope the work
    owner: solution-architect
    raci: { solution-architect: A, account-lead: C, legal-counsel: I, gamma-lead: I }
  - id: partner
    name: Agree the partner role
    owner: gamma-lead
    raci: { gamma-lead: A, account-lead: C, legal-counsel: I }
  - id: price
    name: Price the work
    owner: solution-architect
    raci: { solution-architect: A, account-lead: C, legal-counsel: I, gamma-lead: I }
  - id: approve
    name: Approve the bid
    owner: account-lead
    raci: { account-lead: A, legal-counsel: I, gamma-lead: I }
  - id: submit
    name: Submit the bid
    owner: account-lead
    raci: { account-lead: A, legal-counsel: I, gamma-lead: I }
---
