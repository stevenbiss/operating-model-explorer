---
id: market
type: structure
name: Harbourside partnership
kind: Partnership
summary: How the two sides line up.
main: true
related: [programme]
workstreams: [presales]
bands:
  - { id: leadership, name: Leadership }
  - { id: delivery, name: Delivery }
  - { id: operations, name: Operations }
boxes:
  - { band: leadership, role: account-lead, name: Sam Example, note: "Grade: Director" }
  - { band: leadership, role: partner-manager, name: Jo Placeholder }
  - { band: delivery, role: delivery-lead, name: Alex Sample }
  - { band: delivery, team: globex-solutions }
  - band: operations
    role: partner-manager
    change: { status: removed, today: The partner manager ran operations. }
  - { band: operations, role: delivery-lead, name: TBA }
lines:
  - from: { band: leadership, party: acme }
    to: { band: leadership, party: globex }
    label: Joint steering
  - from: { band: leadership, party: acme }
    to: { band: delivery, party: acme }
---
The partnership is led jointly.
