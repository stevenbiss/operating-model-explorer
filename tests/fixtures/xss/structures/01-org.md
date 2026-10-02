---
id: org
type: structure
name: 'Structure <img src=x onerror="document.body.dataset.pwned=1">'
kind: 'Kind <img src=x onerror="document.body.dataset.pwned=1">'
summary: 'Structure summary <img src=x onerror="document.body.dataset.pwned=1">'
main: true
related: [sub]
workstreams: [main-ws]
bands:
  - { id: top, name: 'Band <img src=x onerror="document.body.dataset.pwned=1">' }
  - id: group
    name: 'Group <img src=x onerror="document.body.dataset.pwned=1">'
    bands:
      - { id: inner, name: 'Sub-band <img src=x onerror="document.body.dataset.pwned=1">', opens: sub }
boxes:
  - { band: top, role: account-lead, name: 'Box name <img src=x onerror="document.body.dataset.pwned=1">', note: 'Box note <img src=x onerror="document.body.dataset.pwned=1">' }
  - band: top
    role: solution-architect
    change: { status: changed, today: 'Box today <img src=x onerror="document.body.dataset.pwned=1">' }
  - { band: inner, team: alpha-team, note: 'Team note <img src=x onerror="document.body.dataset.pwned=1">' }
lines:
  - from: { band: top, party: alpha }
    to: { band: top, party: beta }
    label: 'Line <img src=x onerror="document.body.dataset.pwned=1">'
  - from: { band: group, party: alpha }
    to: { band: top, party: alpha }
    label: 'Vertical <img src=x onerror="document.body.dataset.pwned=1">'
---
Structure body <img src=x onerror="document.body.dataset.pwned=1"> <script>document.body.dataset.pwned=1</script>
