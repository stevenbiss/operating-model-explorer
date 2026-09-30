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
  - id: step-sunco
    name: Sunco does its part
    owner: sunco-lead
    raci:
      sunco-lead: A
---
