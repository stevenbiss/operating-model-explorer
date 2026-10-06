---
id: harbour-account
type: structure
name: Harbour account
kind: Account
summary: The joint team for the Harbour account, from the account leads to delivery.
bands:
  - { id: account-leadership, name: Account leadership }
  - { id: bid-team, name: Bid team }
  - { id: delivery, name: Delivery }
boxes:
  - { band: account-leadership, role: account-lead, name: Sam Example }
  - { band: account-leadership, role: partner-manager, name: Jo Placeholder }
  - { band: bid-team, role: bid-manager, name: Alex Sample }
  - { band: bid-team, role: solution-architect, name: Morgan Test }
  - { band: bid-team, role: pricing-analyst, name: TBA, note: Shared with the Summit account }
  - { band: delivery, team: acme-delivery }
lines:
  - from: { band: account-leadership, party: acme }
    to: { band: account-leadership, party: globex }
  - from: { band: bid-team, party: acme }
    to: { band: bid-team, party: globex }
    label: Shared bid plan
---
