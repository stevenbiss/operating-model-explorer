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
  - id: step-greyco
    name: Grey Co does its part
    owner: greyco-lead
    raci:
      greyco-lead: A
---
