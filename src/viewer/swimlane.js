// L2 swimlane as SVG (design D6), from the pure layout in model/layout.js.
// Steps are <g role="button"> in flow order so Tab follows the flow; lane-header role links come last.
import { esc } from './esc.js';

const HEAD = 196; // lane header width
const COL = 244; // column width (one per rank)
const NW = 164; // node width
const NH = 70; // node height
const GAP = COL - NW;
const PARTY_H = 34; // a party row; a two-line party name adds BAND_LINE
const BAND_LINE = 16;
const PAD_T = 18;
const PAD_B = 32; // room for rework loops under the steps
const COMPACT = 50; // lanes that only take part (RACI)

export const laneHeight = (rows) => (rows ? PAD_T + rows * NH + (rows - 1) * 16 + PAD_B : COMPACT);

// Word-wrap for SVG text: up to `lines` lines of about `max` characters.
export function wrap(text, max, lines) {
  const out = [];
  let cur = '';
  for (const w of String(text).split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > max) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] = out[lines - 1].replace(/.{0,2}$/, '…');
  }
  return out;
}

// Orthogonal path with rounded corners.
function path(pts, r = 9) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [[x0, y0], [x1, y1], [x2, y2]] = [pts[i - 1], pts[i], pts[i + 1]];
    const k = Math.min(r, Math.hypot(x1 - x0, y1 - y0) / 2, Math.hypot(x2 - x1, y2 - y1) / 2);
    d += ` L${x1 - Math.sign(x1 - x0) * k} ${y1 - Math.sign(y1 - y0) * k} Q${x1} ${y1} ${x1 + Math.sign(x2 - x1) * k} ${y1 + Math.sign(y2 - y1) * k}`;
  }
  const [x, y] = pts[pts.length - 1];
  return `${d} L${x} ${y}`;
}

// text: HTML-safe (escaped) text.
const pill = (x, y, text, cls) => {
  const w = Math.round(text.length * 6.3 + 14);
  return { w, svg: `<g class="pill ${cls}"><rect x="${x}" y="${y}" width="${w}" height="18" rx="9"/><text x="${x + w / 2}" y="${y + 12.5}" text-anchor="middle">${text}</text></g>` };
};

// ctx: { m, L, f (flow), dp(partyId) -> ' data-party="n"', mark(partyId) -> <img> or initials HTML, mine(role) -> bool, cue(step) -> text|null, badge(change) -> text|null,
//        stepLabel(step) -> accessible name, roleHref(id), label, selected }
// L, cue, stepLabel, roleHref and label return HTML-safe text; everything taken from the model is escaped here.
export function swimlaneSvg(ctx) {
  const { m, f } = ctx;
  const el = m.elements;
  const persona = !!ctx.mine;
  const width = HEAD + f.ranks * COL + 8;
  const FULL = width + 4000; // backgrounds run on when the SVG is stretched to fill a wide container

  // Lane headers: the full role name (wrapped, never truncated), team, and cues ("Your lane", a change badge)
  // stacked below. A lane that only takes part (RACI) stays compact while its name fits one line and it has no cues.
  // A committee lane (design D3) lists its members under each party; a member's own lane says which committees in
  // this process it sits on, with its letter. Both are text, so membership never relies on marks or colour.
  const committees = f.groups.filter((g) => g.committee).flatMap((g) => g.lanes);
  const head = {};
  for (const r of f.lanes) {
    const role = el[r];
    const isCommittee = committees.includes(r);
    const cues = [];
    if (persona && ctx.mine(r)) cues.push([isCommittee ? `Your ${ctx.L.lower('committee')}` : 'Your lane', 'cue']);
    const rb = ctx.badge(role && role.change);
    if (rb) cues.push([rb, `badge-${role.change.status}`]);
    const name = wrap(role ? role.name : r, 22, 99);
    const parties = isCommittee
      ? [...m.order.party, null]
          .map((party) => ({ party, members: Object.keys(role.members).filter((x) => (el[x] && m.order.party.includes(el[x].party) ? el[x].party : null) === party) }))
          .filter((g) => g.members.length)
          .map((g) => ({ party: g.party, name: wrap(g.party ? el[g.party].name : `No ${ctx.L.lower('party')}`, 20, 99), lines: g.members.flatMap((x) => wrap(`${el[x] ? el[x].name : x} · ${role.members[x]}`, 26, 99)) }))
      : [];
    const member = committees.filter((c) => Object.hasOwn(el[c].members, r)).flatMap((c) => wrap(`${el[c].name} member · ${el[c].members[r]}`, 26, 99));
    const compact = !f.rows[r] && !cues.length && name.length === 1 && !member.length;
    const team = !compact && !isCommittee && role && role.team && el[role.team] ? el[role.team].name : '';
    const lines = member.length + parties.reduce((n, g) => n + g.name.length + g.lines.length, 0);
    const need = 30 + (name.length - 1) * 17 + (team ? 18 : 0) + lines * 16 + parties.length * 6 + (cues.length ? 28 : 0) + 16;
    head[r] = { cues, name, team, member, parties, h: compact ? COMPACT : Math.max(laneHeight(f.rows[r]), need) };
  }
  const lh = (r) => head[r].h;

  // Vertical positions of party rows and lanes.
  // A party's name: up to two lines in its header cell, so long names stay readable.
  const partyLines = (p) => (p && el[p] ? wrap(el[p].name, 20, 2).map(esc) : [`No ${ctx.L.lower('party')}`]);
  let y = 0;
  const laneTop = {};
  const bands = [];
  for (const g of f.groups) {
    const name = g.committee ? [ctx.L('committees')] : partyLines(g.party);
    const h = PARTY_H + (name.length - 1) * BAND_LINE;
    bands.push({ party: g.party, y, h, name });
    y += h;
    for (const r of g.lanes) {
      laneTop[r] = y;
      y += lh(r);
    }
  }
  const height = y;
  const pos = (id) => {
    const n = f.nodes[id];
    const x = HEAD + n.rank * COL + GAP / 2;
    const top = laneTop[n.step.owner] + PAD_T + n.slot * (NH + 16);
    return { x, y: top, cx: x + NW / 2, cy: top + NH / 2, bottom: top + NH, laneBottom: laneTop[n.step.owner] + lh(n.step.owner) };
  };

  // Backgrounds: party rows and lanes in the body (bg); their left-hand header cells in the sticky column (headBg).
  // A party's mark is an HTML <img> laid over its header cell (marks), never SVG markup (design D5).
  let bg = '';
  let headBg = '';
  let marks = '';
  for (const b of bands) {
    const band = (w) => `<g class="band"${ctx.dp(b.party)}><rect class="band-bg" x="0" y="${b.y}" width="${w}" height="${b.h}"/>`;
    bg += `${band(FULL)}<line class="band-line" x1="0" x2="${FULL}" y1="${b.y + b.h - 1}" y2="${b.y + b.h - 1}"/></g>`;
    const m = ctx.mark(b.party);
    const x = m ? 42 : 18;
    const lines = b.name.map((t, i) => `<tspan x="${x}" y="${b.y + PARTY_H / 2 + 4.5 + i * BAND_LINE}">${t}</tspan>`).join(' ');
    headBg += `${band(HEAD)}<text class="band-name">${lines}</text></g>`;
    if (m) marks += `<span class="band-mark" style="top:${b.y + (b.h - 22) / 2}px">${m}</span>`;
  }
  const laneParty = Object.fromEntries(f.groups.flatMap((g) => g.lanes.map((r) => [r, g.party])));
  f.lanes.forEach((r, i) => {
    const h = lh(r);
    const g = `<g class="lane${i % 2 ? ' alt' : ''}${persona ? (ctx.mine(r) ? ' mine' : ' dim') : ''}"${ctx.dp(laneParty[r])}>`;
    const line = (w) => `<line class="lane-line" x1="0" x2="${w}" y1="${laneTop[r] + h}" y2="${laneTop[r] + h}"/>`;
    bg += `${g}<rect class="lane-bg" x="0" y="${laneTop[r]}" width="${FULL}" height="${h}"/>${line(FULL)}</g>`;
    headBg += `${g}<rect class="lane-head" x="0" y="${laneTop[r]}" width="${HEAD}" height="${h}"/>${line(HEAD)}</g>`;
  });

  // RACI participation markers where a lane's role is consulted or informed.
  let raci = '';
  for (const id of f.order) {
    const s = f.nodes[id].step;
    const col = HEAD + f.nodes[id].rank * COL + COL / 2;
    for (const [r, letter] of Object.entries(s.raci)) {
      if (r === s.owner || !(r in laneTop)) continue;
      if (Object.values(f.nodes).some((n) => n.step.owner === r && n.rank === f.nodes[id].rank)) continue;
      const cy = laneTop[r] + (f.rows[r] ? PAD_T + NH / 2 : lh(r) / 2);
      raci += `<g class="raci${persona && ctx.mine(r) ? ' mine' : ''}"><circle cx="${col}" cy="${cy}" r="12"/><text x="${col}" y="${cy + 4.5}" text-anchor="middle">${esc(letter)}</text></g>`;
    }
  }

  // Connectors, then their labels on top.
  let edges = '';
  let labels = '';
  const loops = {};
  for (const e of f.edges) {
    const a = pos(e.from);
    const b = pos(e.to);
    const emph = persona ? (ctx.mine(f.nodes[e.from].step.owner) || ctx.mine(f.nodes[e.to].step.owner) ? ' mine' : ' dim') : '';
    const cls = `edge${e.crossParty ? ' cross' : ''}${e.back ? ' back' : ''}${emph}`;
    let d;
    let lx;
    let ly;
    if (e.back || b.x <= a.x) {
      const base = Math.max(a.laneBottom, b.laneBottom);
      loops[base] = (loops[base] ?? -1) + 1;
      const yl = base - 12 - loops[base] * 7;
      d = path([[a.cx + 18, a.bottom], [a.cx + 18, yl], [b.cx - 18, yl], [b.cx - 18, b.bottom + 3]]);
      [lx, ly] = [(a.cx + b.cx) / 2, yl - 5];
    } else {
      const mx = b.x - GAP / 2;
      d = path([[a.x + NW, a.cy], [mx, a.cy], [mx, b.cy], [b.x - 3, b.cy]]);
      [lx, ly] = [mx, b.cy - 8];
    }
    edges += `<path class="${cls}" d="${d}" marker-end="url(#om-${e.crossParty ? 'open' : 'arrow'})" data-from="${esc(e.from)}" data-to="${esc(e.to)}"/>`;
    if (e.label) labels += `<text class="edge-label${emph}" x="${lx}" y="${ly}" text-anchor="middle">${esc(e.label)}</text>`;
  }

  // Steps, in flow order.
  let nodes = '';
  f.order.forEach((id) => {
    const s = f.nodes[id].step;
    const p = pos(id);
    const badge = ctx.badge(s.change);
    const cue = persona ? ctx.cue(s) : null;
    const cls = ['node', s.id === ctx.selected && 'selected', persona && (cue ? 'mine' : 'dim'), badge && `status-${s.change.status}`].filter(Boolean).join(' ');
    const pills = [];
    let px = p.x + 14;
    const by = s.ownerType === 'committee' && `By ${ctx.L.lower('committee')}`;
    for (const [text, c] of [[by, 'committee'], [badge, `badge-${badge && s.change.status}`], [cue, 'cue']]) {
      if (!text) continue;
      const pl = pill(px, p.bottom - 26, text, c);
      pills.push(pl.svg);
      px += pl.w + 6;
    }
    const lines = wrap(s.name, 21, pills.length ? 2 : 3);
    const ty = p.y + (pills.length ? 24 : NH / 2 - (lines.length - 1) * 8.5 + 5);
    nodes += `<g class="${cls}" role="button" tabindex="0" data-step="${esc(id)}" data-testid="step-${esc(id)}" aria-label="${ctx.stepLabel(s)}"${s.id === ctx.selected ? ' aria-current="step"' : ''}${ctx.dp(s.party)}>` +
      `<rect class="ring" x="${p.x - 5}" y="${p.y - 5}" width="${NW + 10}" height="${NH + 10}" rx="14"/>` +
      `<rect class="box" x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="10"/>` +
      `<line class="stripe" x1="${p.x + 6}" x2="${p.x + 6}" y1="${p.y + 12}" y2="${p.bottom - 12}"/>` +
      `<text class="node-name" x="${p.x + 14}" y="${ty}">${lines.map((l, i) => `<tspan x="${p.x + 14}" dy="${i ? 17 : 0}">${esc(l)}</tspan>`).join('')}</text>` +
      pills.join('') +
      '</g>';
  });

  // Lane header links (layout computed above).
  let heads = '';
  for (const r of f.lanes) {
    const { cues, name, team, member, parties } = head[r];
    const top = laneTop[r];
    let inner = `<text class="lane-name" x="18" y="${top + 30}">${name.map((l, i) => `<tspan x="18" dy="${i ? 17 : 0}">${esc(l)}</tspan>`).join(' ')}</text>`;
    let below = top + 30 + (name.length - 1) * 17;
    if (team) inner += ` <text class="lane-team" x="18" y="${(below += 18)}">${esc(team)}</text>`;
    // Joined with spaces, so the link's accessible name reads "Account lead · A Bid manager · I", not "· ABid".
    const textLines = (list, cls, x = 18) => list.map((l) => ` <text class="${cls}" x="${x}" y="${(below += 16)}">${esc(l)}</text>`).join('');
    inner += textLines(member, 'lane-team');
    for (const g of parties) {
      below += 6;
      const pm = ctx.mark(g.party);
      if (pm) marks += `<span class="band-mark member-mark" style="top:${below + 16 - 12.5}px">${pm}</span>`;
      inner += textLines(g.name, 'lane-party', pm ? 38 : 18) + textLines(g.lines, 'lane-team');
    }
    let px = 18;
    for (const [text, c] of cues) {
      const pl = pill(px, below + 10, text, c);
      inner += pl.svg;
      px += pl.w + 6;
    }
    heads += `<a class="lane-link" href="${ctx.roleHref(r)}" data-testid="lane-${esc(r)}"><rect class="lane-hit" x="0" y="${top}" width="${HEAD}" height="${lh(r)}"/>${inner}</a>`;
  }

  // Two SVGs in a row: the steps, then the lane headers (with the party marks over them), which CSS shows first and
  // keeps stuck to the left edge while the steps scroll. The headers come second in the DOM so Tab reaches the steps first.
  const body = width - HEAD;
  return `<div class="swim-row"><svg class="swimlane" width="${body}" height="${height}" viewBox="${HEAD} 0 ${body} ${height}" preserveAspectRatio="xMinYMin meet" role="group" aria-label="${ctx.label}">` +
    '<defs><marker id="om-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>' +
    '<marker id="om-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.8"/></marker></defs>' +
    `<g aria-hidden="true">${bg}${raci}${edges}${labels}</g>${nodes}</svg>` +
    `<div class="lane-heads"><svg class="swimlane" width="${HEAD}" height="${height}" viewBox="0 0 ${HEAD} ${height}" role="group" aria-label="${ctx.L('roles')}"><g aria-hidden="true">${headBg}</g>${heads}</svg>${marks ? `<div class="band-marks" aria-hidden="true">${marks}</div>` : ''}</div></div>`;
}
