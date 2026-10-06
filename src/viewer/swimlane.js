// L2 swimlane as SVG (design D6), from the pure layout in model/layout.js.
// Steps are <g role="button"> in flow order so Tab follows the flow; lane-header role links come last.
import { esc } from './esc.js';
import { peopleAttrs, peopleLine } from './people.js';
import { columns, GAP_MAX, GAP_MIN, HEAD, LABEL_PAD, labelWidth, NW } from '../model/layout.js';

const NH = 70; // node height
const PARTY_H = 34; // a party row; a two-line party name adds BAND_LINE
const BAND_LINE = 16;
const PAD_T = 18;
const PAD_B = 32; // room for rework loops under the steps
const COMPACT = 50; // lanes that only take part (RACI)

export const laneHeight = (rows) => (rows ? PAD_T + rows * NH + (rows - 1) * 16 + PAD_B : COMPACT);

// Word-wrap for SVG text: up to `lines` lines of about `max` characters. text: a string, or its words (kept whole).
export function wrap(text, max, lines) {
  const out = [];
  let cur = '';
  for (const w of Array.isArray(text) ? text : String(text).split(/\s+/)) {
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
//        stepLabel(step) -> accessible name, roleHref(id), letterWord(letter) -> "Consulted", label, selected }
// L, cue, stepLabel, roleHref and label return HTML-safe text; everything taken from the model is escaped here.
export function swimlaneSvg(ctx) {
  const { m, f } = ctx;
  const el = m.elements;
  const persona = !!ctx.mine;
  const cols = columns(f).x;
  const width = cols[cols.length - 1] + NW + GAP_MIN / 2 + 8;
  const FULL = width + 4000; // backgrounds run on when the SVG is stretched to fill a wide container

  // Lane headers: the full role name (wrapped, never truncated), its people line (role-people spec), team, and cues ("Your lane", a change badge)
  // stacked below. A lane that only takes part (RACI) stays compact while its name fits one line and it has no cues.
  // A committee lane shows its name, then its idle members (see idleOf); a member's own lane says, as text, which
  // committees in this process it sits on, with its letter, so membership never relies on marks or colour.
  const committees = f.groups.filter((g) => g.committee).flatMap((g) => g.lanes);
  // A committee's idle members (list-idle-committee-members D3, D4), in f.idle's order: "Role · Letter" (and the
  // persona's "You") on up to two lines, where only the name is ever cut, then the person line on a line of its own.
  // All of them when they fit in four lines; otherwise as many as fit in three, then "+ N more".
  const idleOf = (c) => {
    const entries = (f.idle[c] || []).map((r) => {
      const role = el[r];
      const words = String(role ? role.name : r).split(/\s+/);
      const you = persona && ctx.mine(r);
      const suffix = ` · ${el[c].members[r]}${you ? ' You' : ''}`;
      let name = wrap([...words.slice(0, -1), words[words.length - 1] + suffix], 24, 99);
      if (name.length > 2) {
        // Too long: the first line as usual, then the rest of the name cut to leave room for the suffix.
        const [line] = wrap(words, 24, 99);
        name = [line, wrap(words.slice(line.split(' ').length), 24 - suffix.length, 1)[0] + suffix];
      }
      const person = role && role.type === 'role' ? peopleLine(role) : '';
      return { r, role, you, person, name, people: person ? wrap(person, 24, 1) : [], lines: name.length + (person ? 1 : 0) };
    });
    const room = entries.reduce((n, e) => n + e.lines, 0) <= 4 ? 4 : 3;
    let used = 0;
    const shown = [];
    for (const e of entries) {
      if (used + e.lines > room) break;
      shown.push(e);
      used += e.lines;
    }
    return { entries, shown, lines: used + (shown.length < entries.length ? 1 : 0) };
  };
  const head = {};
  for (const r of f.lanes) {
    const role = el[r];
    const isCommittee = committees.includes(r);
    const cues = [];
    if (persona && ctx.mine(r)) cues.push([isCommittee ? `Your ${ctx.L.lower('committee')}` : 'Your lane', 'cue']);
    const rb = ctx.badge(role && role.change);
    if (rb) cues.push([rb, `badge-${role.change.status}`]);
    const name = wrap(role ? role.name : r, 22, 99);
    // "<Committee> member" wraps on its own, then " · A" joins its last line, so the letter never sits alone.
    const member = committees.filter((c) => Object.hasOwn(el[c].members, r)).flatMap((c) => {
      const lines = wrap(`${el[c].name} member`, 22, 99);
      lines[lines.length - 1] += ` · ${el[c].members[r]}`;
      return lines;
    });
    const people = role && role.type === 'role' && peopleLine(role) ? wrap(peopleLine(role), 24, 2) : [];
    const compact = !f.rows[r] && !cues.length && name.length === 1 && !member.length && !people.length;
    const team = !compact && role && role.team && el[role.team] ? el[role.team].name : '';
    const idle = isCommittee ? idleOf(r) : { lines: 0 };
    // The idle list starts 20px below the line above it (44px below a row of cues), one line every 16px.
    const list = idle.lines ? (cues.length ? 44 : 20) + (idle.lines - 1) * 16 : cues.length ? 28 : 0;
    const need = 30 + (name.length - 1) * 17 + people.length * 16 + (team ? 18 : 0) + member.length * 16 + list + 16;
    head[r] = { cues, name, people, team, member, idle, h: compact ? COMPACT : Math.max(laneHeight(f.rows[r]), need) };
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
    const x = cols[n.rank];
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
    const col = cols[f.nodes[id].rank] + NW / 2;
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
  const stack = {}; // label lines already drawn above each target's entry line
  for (const e of f.edges) {
    const a = pos(e.from);
    const b = pos(e.to);
    const emph = persona ? (ctx.mine(f.nodes[e.from].step.owner) || ctx.mine(f.nodes[e.to].step.owner) ? ' mine' : ' dim') : '';
    const cls = `edge${e.crossParty ? ' cross' : ''}${e.back ? ' back' : ''}${emph}`;
    let d;
    if (e.back || b.x <= a.x) {
      const base = Math.max(a.laneBottom, b.laneBottom);
      loops[base] = (loops[base] ?? -1) + 1;
      const yl = base - 12 - loops[base] * 7;
      d = path([[a.cx + 18, a.bottom], [a.cx + 18, yl], [b.cx - 18, yl], [b.cx - 18, b.bottom + 3]]);
      if (e.label) labels += `<text class="edge-label${emph}" x="${(a.cx + b.cx) / 2}" y="${yl - 5}" text-anchor="middle">${esc(e.label)}</text>`;
    } else {
      // Bend just past the source, then enter the target across the gap, with the label on that entry line (D4).
      const mx = a.x + NW + 12;
      d = path([[a.x + NW, a.cy], [mx, a.cy], [mx, b.cy], [b.x - 3, b.cy]]);
      if (e.label) {
        // Too wide for the largest gap: two lines, split at the space nearest the middle, stacking upwards.
        const t = String(e.label);
        let lines = [t];
        if (labelWidth(t) + LABEL_PAD > GAP_MAX) {
          const mid = t.length / 2;
          const at = [...t.matchAll(/ /g)].map((s) => s.index).sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid))[0];
          if (at !== undefined) lines = [t.slice(0, at), t.slice(at + 1)];
        }
        // Labelled edges into the same step stack above one another.
        const y0 = b.cy - 6 - (stack[e.to] ?? 0) * 14;
        stack[e.to] = (stack[e.to] ?? 0) + lines.length;
        const text = lines.length > 1 ? lines.map((l, i) => `<tspan x="${b.x - 8}" y="${y0 - (lines.length - 1 - i) * 14}">${i ? ' ' : ''}${esc(l)}</tspan>`).join('') : esc(t);
        labels += `<text class="edge-label${emph}" x="${b.x - 8}" y="${y0}" text-anchor="end">${text}</text>`;
      }
    }
    edges += `<path class="${cls}" d="${d}" marker-end="url(#om-${e.crossParty ? 'open' : 'arrow'})" data-from="${esc(e.from)}" data-to="${esc(e.to)}"/>`;
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

  // Lane header links (layout computed above). With committees, each lane group (a party's roles, the committees)
  // is its own labelled group, in screen order, so a screen reader never announces a committee as a role.
  const links = {};
  for (const r of f.lanes) {
    const { cues, name, people, team, member } = head[r];
    const top = laneTop[r];
    let inner = `<text class="lane-name" x="18" y="${top + 30}">${name.map((l, i) => `<tspan x="18" dy="${i ? 17 : 0}">${esc(l)}</tspan>`).join(' ')}</text>`;
    let below = top + 30 + (name.length - 1) * 17;
    inner += people.map((l) => ` <text class="lane-people" x="18" y="${(below += 16)}">${esc(l)}</text>`).join('');
    if (team) inner += ` <text class="lane-team" x="18" y="${(below += 18)}">${esc(team)}</text>`;
    // Each line starts with a space, so the link's accessible name reads "Partner manager Bid board member · A".
    inner += member.map((l) => ` <text class="lane-team" x="18" y="${(below += 16)}">${esc(l)}</text>`).join('');
    let px = 18;
    for (const [text, c] of cues) {
      const pl = pill(px, below + 10, text, c);
      inner += pl.svg;
      px += pl.w + 6;
    }
    // A committee's idle list (design D3, D4): each entry, and "+ N more", is its own link after the committee name's,
    // drawn over it (the committee's link still spans the lane). A party mark is an <img> over the header (marks);
    // a party without a brand gets a swatch in its colour.
    const { idle } = head[r];
    let list = '';
    if (idle.lines) {
      let y = below + (cues.length ? 44 : 20);
      const partyOf = (e) => (e.role && el[e.role.party] && el[e.role.party].type === 'party' ? e.role.party : null);
      // The entry's own name leaves out the person: its aria-describedby (peopleAttrs) already reads them out.
      const label = (e, person) => [e.role ? e.role.name : e.r, partyOf(e) && el[partyOf(e)].name, String(ctx.letterWord(el[r].members[e.r])).toLowerCase(), person && e.person, e.you && 'you'].filter(Boolean).map(esc).join(', ');
      for (const e of idle.shown) {
        const p = partyOf(e);
        const mk = ctx.mark(p);
        if (mk.startsWith('<img')) marks += `<span class="idle-mark" style="top:${y - 11}px">${mk}</span>`;
        const swatch = mk.startsWith('<img') ? '' : `<rect class="idle-swatch" x="18" y="${y - 9}" width="14" height="9" rx="2"${ctx.dp(p)}/>`;
        // The name's last line ends with " · A" and, for the persona, a bold " You"; the person line is muted.
        const name = e.name.map((l, n) => `<text class="idle-name" x="38" y="${y + n * 16}">${n === e.name.length - 1 && e.you ? `${esc(l.slice(0, -4))}<tspan class="idle-you"> You</tspan>` : esc(l)}</text>`);
        const people = e.people.map((l) => `<text class="lane-people" x="38" y="${y + e.name.length * 16}">${esc(l)}</text>`);
        list += `<a class="lane-link idle-entry" href="${ctx.roleHref(e.r)}" data-testid="idle-${esc(r)}-${esc(e.r)}" aria-label="${label(e)}"${e.role && e.role.type === 'role' ? peopleAttrs(e.r, e.role) : ''}>` +
          `<rect class="lane-hit" x="0" y="${y - 12}" width="${HEAD}" height="${e.lines * 16}"/>${swatch}${name.join('')}${people.join('')}</a>`;
        y += e.lines * 16;
      }
      const hidden = idle.entries.slice(idle.shown.length);
      if (hidden.length) {
        const you = hidden.some((e) => e.you);
        // [ "Role · A", "Party · person", persona's member ] per idle member, for the shared pop-up (people.js).
        const members = { name: el[r].name, list: idle.entries.map((e) => [`${e.role ? e.role.name : e.r} · ${el[r].members[e.r]}`, [partyOf(e) && el[partyOf(e)].name, e.person].filter(Boolean).join(' · '), !!e.you]) };
        list += `<a class="lane-link idle-more" href="${ctx.roleHref(r)}" data-testid="idle-more-${esc(r)}" data-members="${esc(JSON.stringify(members))}" aria-label="${hidden.length} more members. All ${idle.entries.length}: ${idle.entries.map((e) => label(e, true)).join('; ')}">` +
          `<rect class="lane-hit" x="0" y="${y - 12}" width="${HEAD}" height="16"/><text class="idle-name" x="38" y="${y}">+ ${hidden.length} more${you ? ' <tspan class="idle-you">You</tspan>' : ''}</text></a>`;
      }
    }
    links[r] = `<a class="lane-link" href="${ctx.roleHref(r)}" data-testid="lane-${esc(r)}"${el[r] && el[r].type === 'role' ? peopleAttrs(r, el[r]) : ''}><rect class="lane-hit" x="0" y="${top}" width="${HEAD}" height="${lh(r)}"/>${inner}</a>${list}`;
  }

  const groupLabel = (g) => (g.committee ? ctx.L('committees') : g.party && el[g.party] ? `${esc(el[g.party].name)} ${ctx.L.lower('roles')}` : ctx.L('roles'));
  const headLinks = committees.length
    ? f.groups.map((g) => `<g role="group" aria-label="${groupLabel(g)}">${g.lanes.map((r) => links[r]).join('')}</g>`).join('')
    : f.lanes.map((r) => links[r]).join('');

  // Two SVGs in a row: the steps, then the lane headers (with the party marks over them), which CSS shows first and
  // keeps stuck to the left edge while the steps scroll. The headers come second in the DOM so Tab reaches the steps first.
  const body = width - HEAD;
  return `<div class="swim-row"><svg class="swimlane" width="${body}" height="${height}" viewBox="${HEAD} 0 ${body} ${height}" preserveAspectRatio="xMinYMin meet" role="group" aria-label="${ctx.label}">` +
    '<defs><marker id="om-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>' +
    '<marker id="om-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.8"/></marker></defs>' +
    `<g aria-hidden="true">${bg}${raci}${edges}${labels}</g>${nodes}</svg>` +
    `<div class="lane-heads"><svg class="swimlane" width="${HEAD}" height="${height}" viewBox="0 0 ${HEAD} ${height}"${committees.length ? ' role="none"' : ` role="group" aria-label="${ctx.L('roles')}"`}><g aria-hidden="true">${headBg}</g>${headLinks}</svg>${marks ? `<div class="band-marks" aria-hidden="true">${marks}</div>` : ''}</div></div>`;
}
