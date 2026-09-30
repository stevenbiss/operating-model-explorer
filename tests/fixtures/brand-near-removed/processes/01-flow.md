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
  - id: step-rustco
    name: Rust Co does its part
    owner: rustco-lead
    raci:
      rustco-lead: A
---
