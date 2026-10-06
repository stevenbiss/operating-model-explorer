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
  // Idle members: by their letter in the committee (A, R, C, I), so those who share the decision come first, then party
  // and role order (the sort is stable).
  const letter = (c, r) => 'ARCI'.indexOf(m.elements[c].members[r]);
  const idle = Object.fromEntries(committees.map((c) => [c, byParty(new Set(Object.keys(m.elements[c].members).filter((r) => !used.has(r)))).flatMap((g) => g.lanes).sort((a, b) => letter(c, a) - letter(c, b))]));
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

// Column positions sized to connector labels (fit-connector-labels D2, D3). Shared with the swimlane renderer.
export const HEAD = 196; // lane header width
export const NW = 164; // step box width
export const GAP_MIN = 80;
export const GAP_MAX = 220;
export const LABEL_PAD = 2 * 12; // the bend sits 12px past the column before, the label ends 8px before the target: 4px slack

// An estimate of a label's width at its 12px font, so the layout never depends on fonts or the DOM (D2). Characters
// from U+2E80 on (CJK and other wide scripts) count as 1.7, since 6.4px a character assumes Latin text.
export const labelWidth = (text) => Math.ceil([...String(text)].reduce((n, c) => n + (c.codePointAt(0) >= 0x2e80 ? 1.7 : 1), 0) * 6.4) + 8;
const fits = (s) => labelWidth(s) + LABEL_PAD <= GAP_MAX;

// The left edge of each rank's step box. The gap in front of rank k fits the widest label on a forward edge into it.
export function columns(f) {
  const need = Array(f.ranks).fill(0);
  for (const e of f.edges) if (!e.back && e.label) need[f.nodes[e.to].rank] = Math.max(need[f.nodes[e.to].rank], labelWidth(e.label));
  const x = [HEAD + GAP_MIN / 2];
  for (let k = 1; k < f.ranks; k++) x.push(x[k - 1] + NW + Math.min(GAP_MAX, Math.max(GAP_MIN, need[k] + LABEL_PAD)));
  return { x };
}

// A label's lines: one when it fits the largest gap, otherwise wrapped greedily so each line's estimate fits it (D4).
// A word too long for a line breaks after "-" or "/", or else mid-word. Nothing is cut: the lines joined, with a space
// where a line starts a new word, give back the label.
export function labelLines(text) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (fits(t)) return [t];
  // Pieces of each word, with the glue that goes before them: a space before a word, nothing inside one.
  const pieces = t.split(' ').flatMap((w) =>
    w.split(/(?<=[-/])/).flatMap((a) => {
      const out = [''];
      for (const c of a) fits(out[out.length - 1] + c) ? (out[out.length - 1] += c) : out.push(c);
      return out;
    }).map((a, i) => [i ? '' : ' ', a]),
  );
  const lines = [];
  for (const [glue, a] of pieces) {
    if (lines.length && fits(lines[lines.length - 1] + glue + a)) lines[lines.length - 1] += glue + a;
    else lines.push(a);
  }
  return lines;
}

// Where several labelled connectors enter one step (D4): one entry line each, at least 16px apart around the step's
// centre cy and within [top, bottom], in the given order (top to bottom), each label on its own line. counts: each
// label's number of lines. The first k labels sit above their lines and the rest below, trying k = n, n - 1, ... 0 until
// no label leaves the diagram (0 to limit). Returns each entry's y and its label's first baseline; lines are 14px apart.
const ASC = 12; // a label line's box: 12px above its baseline, 3px below
const boxH = (lines) => ASC + 3 + (lines - 1) * 14;
export function entryPoints(counts, cy, top, bottom, limit) {
  const n = counts.length;
  let first;
  for (let k = n; k >= 0; k--) {
    // Room between two entry lines for the label that sits between them, or 16px when neither does.
    let pitch = counts.slice(1).map((c, j) => Math.max(16, j + 1 < k ? boxH(c) + 4 : j >= k ? boxH(counts[j]) + 4 : 16));
    if (pitch.reduce((s, p) => s + p, 0) > bottom - top) pitch = pitch.map(() => 16);
    const ys = [cy - pitch.reduce((s, p) => s + p, 0) / 2];
    for (const p of pitch) ys.push(ys[ys.length - 1] + p);
    // Label boxes' tops: above their lines, pushed up clear of the one below; below their lines, pushed down.
    const tops = [];
    for (let i = k - 1; i >= 0; i--) tops[i] = Math.min(ys[i] - 3, i < k - 1 ? tops[i + 1] - 1 : Infinity) - boxH(counts[i]);
    for (let i = k; i < n; i++) tops[i] = Math.max(ys[i] + 3, i > k ? tops[i - 1] + boxH(counts[i - 1]) + 1 : -Infinity);
    const out = ys.map((y, i) => ({ y, baseline: tops[i] + ASC }));
    first ??= out;
    if (tops.every((t, i) => t >= 0 && t + boxH(counts[i]) <= limit)) return out;
  }
  return first;
}
