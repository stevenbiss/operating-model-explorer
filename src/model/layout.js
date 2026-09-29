// Swimlane layout for one process (design D6). Pure, so it is unit-tested in Node.
// m is the normalised model (load.js / snapshot.js); nothing here touches the DOM.

export const isRemoved = (x) => !!(x && x.change && x.change.status === 'removed');

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
        edges.push({ from: s.id, to: t.to, label: t.label, crossParty: s.party !== byId[t.to].party, back: false });
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

  // Lanes: every role that owns or takes part (RACI) in a shown step, grouped by party in content order.
  const used = new Set();
  for (const s of steps) {
    if (typeof s.owner === 'string') used.add(s.owner);
    Object.keys(s.raci).forEach((r) => used.add(r));
  }
  const known = m.order.role.filter((r) => used.has(r));
  const roles = [...known, ...[...used].filter((r) => !known.includes(r))];
  const partyOf = (r) => (m.elements[r] && m.order.party.includes(m.elements[r].party) ? m.elements[r].party : null);
  const groups = [...m.order.party, null]
    .map((party) => ({ party, lanes: roles.filter((r) => partyOf(r) === party) }))
    .filter((g) => g.lanes.length);
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

  return { nodes, edges, groups, lanes, rows, order, ranks: Math.max(0, ...Object.values(rank)) + 1 };
}

export const nextOf = (f, id) => f.edges.filter((e) => e.from === id);
export const prevOf = (f, id) => f.edges.filter((e) => e.to === id);
