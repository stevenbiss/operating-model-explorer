---
id: flow
type: process
name: Main flow
workstream: main-ws
steps:
  - id: step-globex
    name: Globex does its part
    owner: globex-lead
    raci:
      globex-lead: A
  - id: step-client-team
    name: Client Team does its part
    owner: client-team-lead
    raci:
      client-team-lead: A
---
