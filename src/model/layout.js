// Swimlane layout for one process (design D6). Pure, so it is unit-tested in Node.
// m is the normalised model (load.js / snapshot.js); nothing here touches the DOM.

export const isRemoved = (x) => !!(x && x.change && x.change.status === 'removed');
// A handoff is cross-party when the two ends' party sets differ (design D8). A role's step has a set of one.
const partiesKey = (s) => String(s.parties || [s.party]);

export function flow(m, processId, { showRemoved = false } = {}) {
  const all = m.elements[processId].steps;
  const byId = Object.fromEntries(all.map((s) => [s.id, s]));
  const hidden = (id) => !showRemoved && isRemoved(byId[id]);
  const steps = all.filter((s) => !hidden(s.id));

  // While removed steps are hidden, the flow bridges over them: a predecessor connects to their successors.
  const resolve = (to, label, seen) => {
    if (!byId[to]) return [];
    if (!hidden(to)) return [{ to, label }];
    if (seen.has(to)) return [];
    seen.add(to);
    return byId[to].next.flatMap((n) => resolve(n.to, label ?? n.label, seen));
  };
  const edges = [];
  for (const s of steps) {
    const done = new Set([s.id]);
    for (const n of s.next) {
      for (const t of resolve(n.to, n.label, new Set())) {
        if (done.has(t.to)) continue;
        done.add(t.to);
        edges.push({ from: s.id, to: t.to, label: t.label, crossParty: partiesKey(s) !== partiesKey(byId[t.to]), back: false });
      }
    }
  }

  // Back-edges (rework loops): edges into a step that is still on the depth-first path. They don't count for rank.
  const out = Object.fromEntries(steps.map((s) => [s.id, []]));
  for (const e of edges) out[e.from].push(e);
  const state = {};
  const visit = (id) => {
    state[id] = 1;
    for (const e of out[id]) {
      if (state[e.to] === 1) e.back = true;
      else if (!state[e.to]) visit(e.to);
    }
    state[id] = 2;
  };
  for (const s of steps) if (!state[s.id]) visit(s.id);

  // Rank = longest forward path from the start, so parallel branches line up.
  const into = Object.fromEntries(steps.map((s) => [s.id, []]));
  for (const e of edges) if (!e.back) into[e.to].push(e.from);
  const rank = {};
  const rankOf = (id) => (rank[id] ??= Math.max(0, ...into[id].map((f) => rankOf(f) + 1)));
  steps.forEach((s) => rankOf(s.id));

  // Lanes: every role that owns or takes part (RACI) in a shown step, grouped by party in content order. Each committee
  // that owns a shown step gets a lane too (design D3): all of them in one group in the order their first steps appear.
  // A committee member that takes part only through its committees is idle (list-idle-committee-members D2): no lane,
  // listed in idle[committee] instead. Its letter on a step owned by one of its committees is committee participation.
  const committees = [];
  const used = new Set();
  for (const s of steps) {
    if (s.ownerType === 'committee') committees.includes(s.owner) || committees.push(s.owner);
    else if (typeof s.owner === 'string') used.add(s.owner);
    const members = s.ownerType === 'committee' ? m.elements[s.owner].members : {};
    Object.keys(s.raci).forEach((r) => Object.hasOwn(members, r) || used.add(r));
  }
  const partyOf = (r) => (m.elements[r] && m.order.party.includes(m.elements[r].party) ? m.elements[r].party : null);
  // Party order, then role order (ids not in the model last).
  const byParty = (set) => {
    const known = m.order.role.filter((r) => set.has(r));
    const roles = [...known, ...[...set].filter((r) => !known.includes(r))];
    return [...m.order.party, null].map((party) => ({ party, lanes: roles.filter((r) => partyOf(r) === party) }));
  };
  const groups = byParty(used).filter((g) => g.lanes.length);
  const idle = Object.fromEntries(committees.map((c) => [c, byParty(new Set(Object.keys(m.elements[c].members).filter((r) => !used.has(r)))).flatMap((g) => g.lanes)]));
  const first = (c) => Math.min(...steps.filter((s) => s.owner === c).map((s) => rank[s.id]));
  // The committees group goes where the first party (in party order) with a member of any of them sits (design D5):
  // after its group, or, when all its members here are idle and it has none, where its group would be. With only one
  // party group shown (or no member's party known), after the first group.
  const memberParty = new Set(committees.flatMap((c) => Object.keys(m.elements[c].members).map(partyOf)));
  const fp = m.order.party.findIndex((p) => memberParty.has(p));
  const at = fp < 0 || groups.length < 2 ? 1 : groups.filter((g) => g.party !== null && m.order.party.indexOf(g.party) <= fp).length;
  if (committees.length) groups.splice(at, 0, { party: null, committee: true, lanes: committees.sort((a, b) => first(a) - first(b)) });
  const lanes = groups.flatMap((g) => g.lanes);

  // Two steps in the same lane and rank stack into slots.
  const nodes = {};
  const slots = {};
  for (const s of steps) {
    const key = `${s.owner}|${rank[s.id]}`;
    slots[key] = (slots[key] ?? -1) + 1;
    nodes[s.id] = { step: s, rank: rank[s.id], lane: lanes.indexOf(s.owner), slot: slots[key] };
  }
  const rows = Object.fromEntries(lanes.map((r) => [r, 0]));
  for (const n of Object.values(nodes)) rows[n.step.owner] = Math.max(rows[n.step.owner], n.slot + 1);

  // Flow order (also the Tab order): by rank, then lane, then slot.
  const order = steps.map((s) => s.id).sort((a, b) => nodes[a].rank - nodes[b].rank || nodes[a].lane - nodes[b].lane || nodes[a].slot - nodes[b].slot);

  return { nodes, edges, groups, lanes, rows, order, idle, ranks: Math.max(0, ...Object.values(rank)) + 1 };
}

export const nextOf = (f, id) => f.edges.filter((e) => e.from === id);
export const prevOf = (f, id) => f.edges.filter((e) => e.to === id);
