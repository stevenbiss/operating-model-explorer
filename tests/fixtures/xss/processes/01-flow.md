---
id: flow
type: process
name: 'Process <img src=x onerror="document.body.dataset.pwned=1">'
workstream: main-ws
summary: 'Process summary <img src=x onerror="document.body.dataset.pwned=1">'
steps:
  - id: start
    name: 'Start <img src=x onerror="document.body.dataset.pwned=1">'
    owner: account-lead
    description: 'Description <img src=x onerror="document.body.dataset.pwned=1">'
    raci:
      solution-architect: C
    inputs: ['Input <img src=x onerror="document.body.dataset.pwned=1">']
    outputs: ['Output <img src=x onerror="document.body.dataset.pwned=1">']
    systems: ['System <img src=x onerror="document.body.dataset.pwned=1">']
    kpis: ['KPI <img src=x onerror="document.body.dataset.pwned=1">']
    next:
      - to: design
        label: 'Label <img src=x onerror="document.body.dataset.pwned=1">'
    change:
      status: new
      today: 'Step today <img src=x onerror="document.body.dataset.pwned=1">'
  - id: design
    name: 'Design <img src=x onerror="document.body.dataset.pwned=1">'
    owner: solution-architect
    raci:
      account-lead: I
---
Process body <img src=x onerror="document.body.dataset.pwned=1">
