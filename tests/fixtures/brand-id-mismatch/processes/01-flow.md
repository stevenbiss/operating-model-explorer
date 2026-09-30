---
id: flow
type: process
name: Main flow
workstream: main-ws
steps:
  - id: step-acme
    name: Acme Corp does its part
    owner: acme-lead
    raci:
      acme-lead: A
  - id: step-globex
    name: Globex does its part
    owner: globex-lead
    raci:
      globex-lead: A
---
