# Proposal: Joint steps shared by two or more roles

## Why

Some activities are done together by two roles at the same time, for example a pursuit lead and a client lead working a transformation brief together. Today every step has exactly one role owner. Authors therefore write the activity twice, one step per role, and join the two with a "Joint" branch label. The swimlane reads that link as "comes after", so the second box lands one column later. The diagram shows two activities in sequence when there is really one, done together.

## Who uses it and how it's shared

- **Authors (colleagues):** name more than one role in a step's `Owner`, separated by semicolons, instead of duplicating the step. Nothing else changes.
- **Viewers (colleagues and clients):** receive the exported snapshot as before, and see the joint activity side by side in each owner's lane, at the same point in the flow, tied with a dotted line.

## What Changes

- **A step can have two or more role owners.**
  - In a capture sheet, the `Owner` cell lists them separated by semicolons (`Global client lead; Strategic pursuit lead`). In a content folder, `owner:` may be a list of role ids.
  - It is still one step: one id, one name, one description, one place in the flow, one detail page.
  - The first owner listed is the primary owner, which decides where connectors start and end when there's a choice.
- **Drawn in parallel.**
  - A joint step is drawn as one box in each owner's lane, all in the same column, each marked "Joint".
  - A dotted line ties the boxes together. It never passes through another step.
  - Connectors into a joint step end at the owner box nearest the step they come from. Connectors out of it start at the owner box nearest the step they go to.
- **One step everywhere else:**
  - The step detail lists every owner with their party.
  - Each owner's role page lists the step as one it owns.
  - With a persona selected, every one of its boxes is emphasised when the persona holds any owner role.
  - Search finds it once.
  - The phone step list shows it once, labelled with all its owners and "Joint".
  - Keyboard users reach it once in the Tab order, and screen readers hear "joint step" and every owner.
- **Validation:** joint owners must be roles. A committee can't be a joint owner, and naming the same role twice is an error. Owners from one party or from several are both fine. Joint owners get no RACI letter by default; RACI is written as today.
- **Cross-party handoffs:** a connector into or out of a joint step counts as cross-party when the step's owners include a party other than the step at the other end. This is the same rule committees use.
- **Sample:** the Acme sample (both forms, in parity) makes "Kick off the bid" a joint step of the Bid manager (Acme) and the Solution architect (Globex). Fictional names only.
- **The capture-sheet format stays at 1.** An engine before 1.9.0 reports a multi-role Owner cell as an unknown role, so models that use joint steps need 1.9.0.

## Capabilities

### New Capabilities
- `joint-steps`: steps owned jointly by two or more roles. Covers how they're written, validated, drawn (twin boxes in one column, dotted tie, connector attachment), the step detail, role pages, persona, search, keyboard and screen-reader access, phones, and the sample.

### Modified Capabilities
- `content-schema`: an added requirement that a step's owner may be a list of roles.
- `capture-sheet`: an added requirement that the Owner cell may list several roles.

## Non-goals

- Mixing a committee and roles as joint owners. Committees stay a separate concept for group decisions.
- Two or more separate steps marked "in parallel" (a different model, considered and not chosen).
- Joint ownership on structure diagrams.
- Changing the RACI rules.
- Any real names, brands or org data in this public repo.

## Impact

- `schema/process.schema.json`: `owner` may be a string or a list.
- `src/model/sheet.js`, `validate.js` and `load.js`: parsing, checks, and normalising to an `owners` list.
- `src/model/layout.js`: twin nodes per owner lane in one rank, and connector attachment.
- `src/viewer/swimlane.js`: twin boxes, the "Joint" badge, the dotted tie and accessibility.
- `src/viewer/app.js`: step detail, role pages, persona, search and the phone list.
- The sample (both forms), fixtures, docs and template, the authoring skill (draft one joint step instead of two duplicates), and tests.
- Release 1.9.0.
