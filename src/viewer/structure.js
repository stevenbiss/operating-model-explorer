// Structure diagram as an HTML CSS grid with an SVG line overlay (design D5, D6). One DOM serves desktop, phone and
// screen readers: cells come band by band, then party by party, which is the Tab, reading and stacked order.
// Below 768px the CSS turns the grid into a stacked list; there is no second renderer.
import { esc } from './esc.js';
import { lineGeometry } from '../model/structure.js';
import { peopleAttrs, peopleLine } from './people.js';

// ctx: { m, L, s (the structure), parties (its columns), dp(partyId) -> ' data-party="n"', mark(partyId) -> HTML,
//        visible(x) -> bool, mine(box) -> bool, badge(change) -> HTML, href(route) -> attribute-safe URL }
// L, badge and href return HTML-safe text; everything taken from the model is escaped here.
export function structureHtml(ctx) {
  const { m, L, s, parties } = ctx;
  const el = m.elements;
  const name = (id) => (el[id] ? el[id].name : id);
  const bandName = (id) => (s.bands.flatMap((b) => [b, ...b.bands]).find((b) => b.id === id) || { name: id }).name;
  const labels = s.bands.some((b) => b.bands.length) ? 2 : 1;
  const col = (i) => labels + 1 + i;
  const open = (b) => (el[b.opens] && el[b.opens].type === 'structure' ? ` <a class="sd-open" href="${ctx.href({ view: 'structure', id: b.opens })}" data-testid="band-open-${esc(b.id)}">Open<span class="vh"> ${esc(el[b.opens].name)}</span></a>` : '');

  // "Related to" text for a cell: every line with an end in it. A line to a parent band is listed in each of its sub-band cells.
  const at = (end, row, p) => end.party === p && (end.band === row.id || end.band === row.parent);
  const related = (row, p) =>
    s.lines.flatMap((l) => [[l.from, l.to], [l.to, l.from]].filter(([a]) => at(a, row, p)).map(([, b]) => `<li>Related to: ${esc(name(b.party))}, ${esc(bandName(b.band))}${l.label ? `: “${esc(l.label)}”` : ''}</li>`));

  const box = (b, i) => {
    const holder = el[b.role || b.team];
    const roles = b.team ? m.order.role.filter((r) => el[r].team === b.team && ctx.visible(el[r])) : [];
    const mine = ctx.mine(b);
    const tags = `${mine ? `<span class="cue">Your ${L.lower('role')}</span>` : ''}${ctx.badge(b.change)}`;
    const target = b.role ? { view: 'role', id: b.role } : { view: 'element', id: b.team };
    // The box's own name text wins over its role's people line (role-people spec).
    const role = b.role && holder && holder.type === 'role' ? holder : null;
    const who = b.name || peopleLine(role);
    const line = (r) => (peopleLine(el[r]) ? `<span class="people">${esc(peopleLine(el[r]))}</span>` : '');
    return `<li><a class="sd-box${mine ? ' mine' : ''}${b.change ? ` status-${esc(b.change.status)}` : ''}" href="${ctx.href(target)}" data-testid="structure-box" data-box="${i}"${role ? peopleAttrs(b.role, role) : ''}>
  <span class="sd-box-title">${esc(holder ? holder.name : b.role || b.team)}</span>
  ${who ? `<span class="sd-box-name">${esc(who)}</span>` : ''}${b.note ? `<span class="sd-box-note">${esc(b.note)}</span>` : ''}
  ${roles.length ? `<span class="vh">${L('roles')}:</span><ul class="sd-roles">${roles.map((r) => `<li>${esc(el[r].name)}${line(r)}</li>`).join('')}</ul>` : ''}
  ${tags ? `<span class="tags">${tags}</span>` : ''}${ctx.badge(b.change) && b.change.today ? `<span class="sd-today" data-testid="today"><span class="k">Today</span> ${esc(b.change.today)}</span>` : ''}
</a></li>`;
  };

  const cells = (row, r, level) =>
    parties
      .map((p, i) => {
        const boxes = s.boxes.map((b, n) => [b, n]).filter(([b]) => b.band === row.id && b.party === p && ctx.visible(b));
        const rel = related(row, p);
        const attrs = `class="sd-cell${boxes.length || rel.length ? '' : ' sd-empty'}"${ctx.dp(p)} data-band="${esc(row.id)}" data-parent="${esc(row.parent || '')}" data-col="${esc(p)}" style="grid-column:${col(i)};grid-row:${r}" data-testid="structure-cell-${esc(row.id)}-${esc(p)}"`;
        if (!boxes.length && !rel.length) return `<div ${attrs}></div>`;
        return `<div ${attrs}>
  <h${level} class="sd-cell-h" aria-label="${esc(name(p))}, ${esc(row.name)}">${ctx.mark(p)}${esc(name(p))}</h${level}>
  ${boxes.length ? `<ul class="sd-boxes">${boxes.map(([b, n]) => box(b, n)).join('')}</ul>` : ''}
  ${rel.length ? `<ul class="sd-rel" data-testid="structure-related-text">${rel.join('')}</ul>` : ''}
</div>`;
      })
      .join('');

  let r = 2; // grid row 1 holds the party headers
  const body = s.bands
    .map((b) => {
      if (!b.bands.length) return `<h3 class="sd-band" style="grid-column:1 / span ${labels};grid-row:${r}" data-testid="structure-band-${esc(b.id)}">${esc(b.name)}${open(b)}</h3>${cells(s.rows.find((x) => x.id === b.id && !x.parent), r++, 4)}`;
      const head = `<h3 class="sd-band sd-parent" style="grid-column:1;grid-row:${r} / span ${b.bands.length}" data-testid="structure-band-${esc(b.id)}">${esc(b.name)}${open(b)}</h3>`;
      return head + b.bands.map((c) => `<h4 class="sd-band sd-sub" style="grid-column:2;grid-row:${r}" data-testid="structure-band-${esc(c.id)}">${esc(c.name)}${open(c)}</h4>${cells(s.rows.find((x) => x.id === c.id && x.parent === b.id), r++, 5)}`).join('');
    })
    .join('');

  return `<div class="sd" style="--sd-labels:${labels};--sd-cols:${parties.length}">
<div class="sd-corner" aria-hidden="true" style="grid-column:1 / span ${labels};grid-row:1"></div>
${parties.map((p, i) => `<div class="sd-head"${ctx.dp(p)} aria-hidden="true" style="grid-column:${col(i)};grid-row:1" data-testid="structure-column">${ctx.mark(p)}${esc(name(p))}</div>`).join('')}
${body}
<svg class="sd-lines" aria-hidden="true" data-testid="structure-lines"></svg>
<div class="sd-labels" aria-hidden="true"></div>
</div>`;
}

// Draws the lines over a rendered diagram, and redraws them whenever the grid changes size (fonts, resize, wrapping).
// Lines are plain: no arrowheads, no direction.
let observer = null;
export function mountLines(sd, lines) {
  if (observer) observer.disconnect();
  observer = null;
  if (!sd) return;
  const svg = sd.querySelector('.sd-lines');
  const pills = sd.querySelector('.sd-labels');
  const draw = () => {
    const o = sd.getBoundingClientRect();
    const cells = [...sd.querySelectorAll('.sd-cell')].map((c) => {
      const b = c.getBoundingClientRect();
      return { band: c.dataset.band, parent: c.dataset.parent || null, party: c.dataset.col, x: b.left - o.left, y: b.top - o.top, w: b.width, h: b.height };
    });
    const segs = lineGeometry(cells, lines).filter(Boolean);
    const n = (v) => Math.round(v * 10) / 10;
    svg.innerHTML = segs.map((g) => `<line class="sd-line" x1="${n(g.x1)}" y1="${n(g.y1)}" x2="${n(g.x2)}" y2="${n(g.y2)}" data-testid="structure-line"/>`).join('');
    // A label on a mostly vertical line sits in the narrow gap between two rows, so its pill is wider and stays shallow.
    pills.innerHTML = segs.filter((g) => g.label).map((g) => `<span class="sd-label${Math.abs(g.y2 - g.y1) > Math.abs(g.x2 - g.x1) ? ' sd-label-v' : ''}" style="left:${n(g.lx)}px;top:${n(g.ly)}px" data-testid="structure-line-label">${esc(g.label)}</span>`).join('');
  };
  observer = new ResizeObserver(draw);
  observer.observe(sd);
  // A focused box is scrolled into view inside the diagram's own scroll area (design D6).
  sd.addEventListener('focusin', (e) => e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
}
