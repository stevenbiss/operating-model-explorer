---
id: partnership-structure
type: structure
name: Partnership structure
kind: Partnership
summary: Who leads the partnership on each side, and how the account teams line up.
main: true
related: [harbour-account]
workstreams: [presales]
bands:
  - { id: partnership-leadership, name: Partnership leadership }
  - id: account-management
    name: Account management
    bands:
      - { id: harbour-account, name: Harbour account, opens: harbour-account }
      - { id: summit-account, name: Summit account }
  - { id: delivery, name: Delivery }
boxes:
  - { band: partnership-leadership, role: account-lead, name: Sam Example, note: Executive sponsor }
  - band: partnership-leadership
    role: legal-counsel
    change: { status: removed, today: Legal counsel sat on the steering group. }
  - { band: partnership-leadership, role: partner-manager, name: Jo Placeholder, note: "Grade: Director" }
  - { band: harbour-account, role: bid-manager, name: Alex Sample }
  - { band: harbour-account, team: globex-solutions }
  - { band: summit-account, role: bid-manager, name: TBA }
  - { band: summit-account, role: solution-architect, name: Riley Demo }
  - { band: delivery, team: acme-delivery }
lines:
  - from: { band: partnership-leadership, party: acme }
    to: { band: partnership-leadership, party: globex }
    label: Joint steering
  - from: { band: partnership-leadership, party: globex }
    to: { band: account-management, party: globex }
  - from: { band: harbour-account, party: acme }
    to: { band: harbour-account, party: globex }
    label: Weekly bid call
---
The partnership is led jointly. Each account has a named lead on both sides, and the Acme delivery team takes over once work is won.
