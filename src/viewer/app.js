// The viewer: header, routing and the L0-L3 views, persona lens and change markers.
// Entry point: render(snapshot), where snapshot comes from model/snapshot.js (or embedded om-content JSON).
import { renderInline, renderMarkdown, useImages } from '../model/markdown.js';
import { flow, isRemoved, nextOf, prevOf } from '../model/layout.js';
import { formatRoute, parseRoute } from './route.js';
import { labeller, partyCss } from './theme.js';
import { swimlaneSvg } from './swimlane.js';
import { mountLines, structureHtml } from './structure.js';
import { esc } from './esc.js';
// OM_VERSION: package.json's version, put in by the build (esbuild define; design D11).

const list = (v) => (Array.isArray(v) ? v : []);
const store = {
  get(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      // Storage can be blocked; progress then lasts for this page only.
    }
  },
};
const RACI = { R: 'Responsible', A: 'Accountable', C: 'Consulted', I: 'Informed' };
const STATUS = { new: 'New', changed: 'Changed', removed: 'Removed' };
const narrow = matchMedia('(max-width: 767px)');

let M; // snapshot
let E; // elements by id
let L; // label lookup; every output is already HTML-escaped (theme.js)
let route = null;
let root;
let main;
let visited;
let F = null; // flow of the open process, for arrow-key navigation
let mounted = false;

// ---------- helpers ----------

// Session keys are scoped by export stamp, so what happens in the author preview (dismissing the persona prompt,
// exploring processes) never carries into an exported snapshot opened later in the same tab.
const key = (k) => `${k}:${M.model && M.model.id}:${M.exported || 'preview'}`;
const arrivedKey = () => key('om-arrived');
const visitedKey = () => key('om-visited');
const is = (id, type) => !!(id && E[id] && E[id].type === type);
const persona = () => (is(route.persona, 'persona') ? E[route.persona] : null);
const personaRoles = () => new Set(persona() ? list(persona().roles) : []);
// A committee is the persona's when one of its members is a persona role (design D9).
const mine = (r) => personaRoles().has(r) || (is(r, 'committee') && Object.keys(E[r].members).some((x) => personaRoles().has(x)));
const to = (r) => formatRoute({ persona: route.persona, changes: route.changes, ...r });
const href = (r) => esc(to(r)); // for HTML attributes; to() for location and setAttribute
const stepHref = (s) => href({ view: 'process', id: s.process, step: s.id });
// Removed steps (and removed elements in search results) are shown only while change markers are on.
const visible = (s) => route.changes || !isRemoved(s);
const nameOf = (id) => (E[id] ? E[id].name : id);
const plural = (n, one, many) => `${n} ${n === 1 ? L.lower(one) : L.lower(many)}`;
const hasChanges = () =>
  Object.values(E).some((x) => x.change && STATUS[x.change.status]) ||
  M.order.process.some((p) => E[p].steps.some((s) => s.change && STATUS[s.change.status])) ||
  M.order.structure.some((s) => E[s].boxes.some((b) => b.change && STATUS[b.change.status]));
const detailed = () => M.order.process.filter((p) => !(E[E[p].workstream] && E[E[p].workstream].detail === 'outline'));
// Party identity (party-brands spec, design D4/D5). A party's colours come from the CSS for data-party="<its position>"
// (partyCss); "none" is the neutral fallback. Marks are only ever <img> data URIs, never inline SVG, so nothing in one runs.
const dp = (p) => ` data-party="${is(p, 'party') ? M.order.party.indexOf(p) : 'none'}"`;
const MARK_URI = /^data:image\/(svg\+xml|png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i;
const markOf = (p) => {
  const b = is(p, 'party') && E[p].brand;
  const src = typeof b === 'string' && M.marks && Object.hasOwn(M.marks, b) && M.marks[b];
  return typeof src === 'string' && MARK_URI.test(src) ? src : null;
};
// Up to two initials, for a party without a brand: "Client Team" -> "CT".
const initials = (name) => String(name).split(/\s+/).map((w) => (w.match(/[\p{L}\p{N}]/u) || [''])[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
// The party's mark, or its initials on the party colour. named: false when the party's name is shown right beside it.
const mark = (p, named = true) => {
  if (!is(p, 'party')) return '';
  const src = markOf(p);
  const name = esc(E[p].name);
  if (src) return `<img class="mk"${dp(p)} src="${esc(src)}" alt="${named ? name : ''}">`;
  return `<span class="mk mk-init"${dp(p)} ${named ? `role="img" aria-label="${name}"` : 'aria-hidden="true"'}>${esc(initials(E[p].name))}</span>`;
};
// A party's name with its mark and colour, e.g. after a step's owner.
const partyTag = (p) => (is(p, 'party') ? `<span class="ptag"${dp(p)}>${mark(p, false)}${esc(E[p].name)}</span>` : '');
const badgeText = (change, force) => ((route.changes || force) && change && STATUS[change.status]) || null;
const badge = (change, force) => {
  const t = badgeText(change, force);
  return t ? `<span class="badge badge-${change.status}" data-testid="badge">${t}</span>` : '';
};
const today = (x) => (route.changes && x.change && x.change.today ? `<div class="today" data-testid="today"><h3>Today</h3><p>${esc(x.change.today)}</p></div>` : '');
const partyChip = (p) => (is(p, 'party') ? `<a class="chip"${dp(p)} href="${href({ view: 'element', id: p })}">${mark(p, false)}${esc(E[p].name)}</a>` : '');
const roleChip = (r) => `<a class="chip${mine(r) ? ' mine' : ''}"${dp(E[r] && E[r].party)} href="${href({ view: 'role', id: r })}">${mark(E[r] && E[r].party)}${esc(nameOf(r))}${mine(r) ? ` <span class="cue">Your ${L.lower('role')}</span>` : ''}</a>`;

// How the persona's roles take part in a step, as HTML-safe text: "Your step", "You: C" or null.
function cue(s) {
  const roles = personaRoles();
  if (!roles.size) return null;
  if (roles.has(s.owner)) return `Your ${L.lower('step')}`;
  const letters = [...new Set([...roles].map((r) => s.raci[r]).filter(Boolean))];
  return letters.length ? `You: ${letters.map(esc).join(', ')}` : null;
}
const involved = (s, r) => s.owner === r || r in s.raci;
const letterOf = (s, r) => s.raci[r] || (s.owner === r ? 'R' : null);
// joint: one of several committee members marked A, written "Accountable, jointly" (design D4).
const letterHtml = (l, joint) => {
  const word = Object.hasOwn(RACI, l) ? `${RACI[l]}${joint && l === 'A' ? ', jointly' : ''}` : '';
  return `<span class="letter"><abbr title="${word || esc(l)}">${esc(l)}</abbr> ${word}</span>`;
};
const raciRow = ([role, l], joint) => `<tr${mine(role) ? ' class="mine"' : ''}><th scope="row">${is(role, 'role') ? `<a href="${href({ view: 'role', id: role })}">${esc(E[role].name)}</a>` : esc(role)}${mine(role) ? ' <span class="cue">You</span>' : ''}</th><td>${letterHtml(l, joint)}</td></tr>`;

// Committees (committees spec, design D9).
const committeeOf = (s) => (s.ownerType === 'committee' && is(s.owner, 'committee') ? E[s.owner] : null);
const byCommittee = (s) => (committeeOf(s) ? `<span class="badge badge-committee" data-testid="by-committee">By ${L.lower('committee')}</span>` : '');
// The committee's name after a step's letters, where a role takes part through it.
const via = (s) => (committeeOf(s) ? `<span class="letter-role" data-testid="via-committee">${esc(committeeOf(s).name)}</span>` : '');
const memberParty = (r) => (is(r, 'role') && is(E[r].party, 'party') ? E[r].party : null);
// A committee's members split by organisation: one heading per party (mark and name), then each member and letter.
function membersHtml(c, h) {
  const members = Object.keys(c.members);
  const joint = members.filter((r) => c.members[r] === 'A').length > 1;
  return [...M.order.party, null]
    .map((p) => {
      const rs = members.filter((r) => memberParty(r) === p);
      return rs.length ? `<div class="member-party"${dp(p)} data-testid="member-party"><${h} class="ptag">${p ? `${mark(p, false)}${esc(E[p].name)}` : `No ${L.lower('party')}`}</${h}><table class="raci-table"><tbody>${rs.map((r) => raciRow([r, c.members[r]], joint)).join('')}</tbody></table></div>` : '';
    })
    .join('');
}

// ---------- entry ----------

// target: #app in viewer mode; in author mode the preview element.
export function render(snapshot, target = document.getElementById('app')) {
  M = snapshot;
  E = M.elements;
  L = labeller(M.theme);
  useImages(M.assets);
  try {
    visited = new Set(JSON.parse(store.get(visitedKey()) || '[]'));
  } catch {
    visited = new Set();
  }
  document.title = (M.model && M.model.name) || 'Operating Model Explorer';
  root = target;
  root.innerHTML = shell();
  main = root.querySelector('main');
  const arrival = root.querySelector('.arrival');
  arrival.addEventListener('close', () => {
    store.set(arrivedKey(), '1');
    // Closing returns focus to where it was before the prompt opened: nowhere, on first load. Start at the heading.
    const a = document.activeElement;
    if (!a || a === document.body || arrival.contains(a)) main.querySelector('h1').focus();
  });
  if (!mounted) {
    mounted = true;
    window.addEventListener('hashchange', onRoute);
    narrow.addEventListener('change', onRoute);
    window.addEventListener('resize', moreCue);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onSearch);
    document.addEventListener('submit', onSearch);
  }
  route = null;
  onRoute();
  const r = route;
  if (!r.persona && r.view === 'overview' && M.order.persona.length && !store.get(arrivedKey())) {
    // In the author preview the prompt sits inside the preview (non-modal), so the report and Export stay usable.
    const dlg = root.querySelector('.arrival');
    if (target.id === 'app') dlg.showModal();
    else dlg.show();
  }
}

function personaButtons(testid = 'persona-door') {
  return M.order.persona
    .map((id) => {
      const p = E[id];
      return `<li><button type="button" class="door" data-persona-choice="${esc(id)}" data-testid="${testid}-${esc(id)}"><span class="door-name">${esc(p.name)}</span>${p.summary ? `<span class="door-text">${esc(p.summary)}</span>` : ''}<span class="door-go" aria-hidden="true">→</span></button></li>`;
    })
    .join('');
}

function shell() {
  const m = M.model || {};
  const personas = M.order.persona;
  return `<style data-testid="party-css">${partyCss(M.partyColours)}</style>
<a class="skip" href="#om-main" data-skip>Skip to content</a>
<header class="topbar"><div class="bar-in">
  <div class="ident"><a class="brand" data-testid="brand" href="#/"><span class="brand-name">${esc(m.name)}</span></a>${lockup()}</div>
  <div class="top-tools">
    <div class="progress" data-testid="progress"><span class="meter" aria-hidden="true"><span></span></span><span class="progress-text"></span>
      <button type="button" class="btn btn-key" data-open-km data-testid="key-messages-button">${L('key_messages')}</button></div>
    ${personas.length ? `<div class="persona-ctl"><label for="om-persona">${L('persona')}</label><select id="om-persona" data-testid="persona-select"><option value="">No ${L.lower('persona')}</option>${personas.map((id) => `<option value="${esc(id)}">${esc(E[id].name)}</option>`).join('')}</select></div>` : ''}
  </div>
</div></header>
<div class="subbar" role="region" aria-label="Find and filter"><div class="bar-in">
  <nav class="crumbs" aria-label="Breadcrumb" data-testid="breadcrumb"></nav>
  <div class="sub-tools">
    <a class="me-link" data-testid="me-link" hidden>What matters for me</a>
    ${hasChanges() ? '<label class="toggle" data-testid="change-toggle"><input type="checkbox" id="om-changes"><span>Show changes</span></label>' : ''}
    <form class="search" role="search" data-testid="search-form"><label for="om-q" class="vh">Search the ${L.lower('model')}</label><input id="om-q" type="search" data-testid="search-input" placeholder="Search" autocomplete="off"><button type="submit" class="btn">Search</button></form>
  </div>
</div></div>
<section class="notice removed-notice" aria-label="Notice" data-testid="removed-notice" hidden><p></p><button type="button" class="btn btn-quiet" data-dismiss-notice data-testid="removed-notice-dismiss">Dismiss</button></section>
<main id="om-main" tabindex="-1"></main>
<footer class="foot" data-testid="footer"><div class="bar-in">${m.version ? `<span>Version ${esc(m.version)}</span>` : ''}${M.exported ? `<span>Exported <time datetime="${esc(M.exported)}">${esc(new Date(M.exported).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</time></span>` : ''}<span data-testid="engine-version">Engine ${OM_VERSION}</span></div></footer>
<dialog class="sheet km" data-testid="key-messages-dialog" aria-labelledby="om-km-title">
  <div class="sheet-head"><h2 id="om-km-title">${L('key_messages')}</h2><button type="button" class="btn" data-close>Close</button></div>
  ${messagesHtml()}
</dialog>
<dialog class="sheet arrival" data-testid="persona-prompt" aria-labelledby="om-arrival-title">
  <p class="eyebrow">${esc(m.name)}</p>
  <h2 id="om-arrival-title">Where would you like to start?</h2>
  <p>Choose ${L.a('persona')} to start from your own perspective. Everyone sees the same ${L.lower('model')}, and you can change this at any time.</p>
  <ul class="doors">${personaButtons('persona-option')}</ul>
  <button type="button" class="btn btn-quiet" data-close data-testid="persona-skip">Explore without ${L.a('persona')}</button>
</dialog>
<div class="vh" aria-live="polite" data-testid="announcer" id="om-live"></div>`;
}

// The header lockup (design D6): every party's mark at the same height, in party order, when at least one party has a brand.
function lockup() {
  const parties = M.order.party;
  if (!parties.some(markOf)) return '';
  return `<span class="lockup" role="group" aria-label="${L('parties')}" data-testid="lockup">${parties.map((p) => mark(p)).join('')}</span>`;
}

function messagesHtml() {
  const msgs = list(M.model && M.model.key_messages);
  return `<ol class="messages" data-testid="key-messages">${msgs.map((k, i) => `<li><span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><p>${renderInline(String(k))}</p></li>`).join('')}</ol>`;
}

// ---------- routing ----------

function onRoute() {
  const prev = route;
  route = parseRoute(location.hash);
  if (route.persona && !is(route.persona, 'persona')) route.persona = null;
  // Removed steps are shown only while change markers are on: a route to one resolves to its process,
  // replacing the history entry so Back never returns to it, and a notice says why.
  const gone = hiddenStep();
  if (gone) {
    route.step = null;
    history.replaceState(history.state, '', formatRoute(route));
  }
  showNotice(gone && `${L('step')} “${esc(gone.name)}” was removed in this model. Turn on Show changes to see it.`);
  // Re-rendering replaces main's content; remember what had focus so it can be restored.
  const a = document.activeElement;
  const keep = a && (a.id ? `#${CSS.escape(a.id)}` : a.dataset && a.dataset.testid ? `[data-testid="${CSS.escape(a.dataset.testid)}"]` : null);
  if (route.view === 'process' && is(route.id, 'process') && !visited.has(route.id)) {
    visited.add(route.id);
    store.set(visitedKey(), JSON.stringify([...visited]));
  }
  F = null;
  chrome();
  main.innerHTML = view();
  mountLines(main.querySelector('.sd'), route.view === 'structure' && is(route.id, 'structure') ? E[route.id].lines : []);
  // Keep the selected step in sight when the detail panel narrows the swimlane.
  const sel = main.querySelector('.node[aria-current]');
  const sc = main.querySelector('.swim-scroll');
  if (sel) {
    // Centred in the part of the box that the sticky lane-header column doesn't cover.
    const box = sel.querySelector('.box').getBoundingClientRect();
    const heads = main.querySelector('.lane-heads').getBoundingClientRect().width;
    const mid = box.left + box.width / 2 - sc.getBoundingClientRect().left + sc.scrollLeft;
    sc.scrollLeft = Math.max(0, mid - (heads + (sc.clientWidth - heads) / 2));
  }
  if (sc) {
    sc.addEventListener('scroll', moreCue, { passive: true });
    moreCue();
  }
  if (prev && prev.persona !== route.persona) {
    say(persona() ? `Now viewing as ${esc(persona().name)}` : `Now viewing without ${L.a('persona')}`);
  }
  if (prev) placeFocus(prev, keep);
}

function placeFocus(prev, keep) {
  const same = prev.view === route.view && prev.id === route.id;
  const q = (sel) => main.querySelector(sel);
  if (route.view === 'process' && route.step && (!same || prev.step !== route.step)) return q('#om-detail-title') && q('#om-detail-title').focus();
  if (route.view === 'process' && same && prev.step && !route.step) {
    const n = q(`[data-step="${CSS.escape(prev.step)}"]`);
    if (n) return n.focus();
  }
  if (!same) {
    if (document.activeElement && document.activeElement.id === 'om-q') return;
    root.scrollIntoView(); // the page top in viewer mode, the preview's top in author mode
    return q('h1') && q('h1').focus({ preventScroll: true });
  }
  if ((!document.activeElement || document.activeElement === document.body) && keep) {
    const k = root.querySelector(keep);
    if (k) k.focus();
  }
}

// The removed step the route names while change markers are off. Removed elements' pages open as normal.
function hiddenStep() {
  if (route.changes || route.view !== 'process' || !is(route.id, 'process') || !route.step) return null;
  const s = E[route.id].steps.find((st) => st.id === route.step);
  return isRemoved(s) ? s : null;
}

// html: HTML-safe text (labels are already escaped).
const say = (html) => (root.querySelector('#om-live').innerHTML = html);

function showNotice(html) {
  const n = root.querySelector('.removed-notice');
  n.hidden = !html;
  n.querySelector('p').innerHTML = html || '';
  // Announced after a moment, so a live region created with the page has registered first.
  if (html) setTimeout(() => say(html), 150);
}

function dismissNotice() {
  const inside = root.querySelector('.removed-notice').contains(document.activeElement);
  showNotice(null);
  if (inside) main.querySelector('h1').focus();
}

const go = (patch, replace) => {
  const h = formatRoute({ ...route, ...patch });
  if (replace) location.replace(h);
  else location.hash = h;
};

function crumbs() {
  const c = [[M.model ? esc(M.model.name) : L('model'), href({ view: 'overview' })]]; // names as HTML
  const x = E[route.id];
  // A structure's breadcrumb is flat: diagrams form a graph, so there is no single path to one (design D7).
  if ((route.view === 'workstream' && is(route.id, 'workstream')) || (route.view === 'structure' && is(route.id, 'structure'))) c.push([esc(x.name)]);
  if (route.view === 'process' && is(route.id, 'process')) {
    if (is(x.workstream, 'workstream')) c.push([esc(E[x.workstream].name), href({ view: 'workstream', id: x.workstream })]);
    const s = route.step && x.steps.find((st) => st.id === route.step);
    c.push([esc(x.name), s ? href({ view: 'process', id: x.id }) : null]);
    if (s) c.push([esc(s.name)]);
  }
  if ((route.view === 'role' || route.view === 'element') && x) {
    const parent = x.type === 'team' || x.type === 'role' ? x.party : null;
    if (is(parent, 'party')) c.push([esc(E[parent].name), href({ view: 'element', id: parent })]);
    c.push([esc(x.name)]);
  }
  if (route.view === 'search') c.push(['Search']);
  if (route.view === 'me') c.push(['What matters for me']);
  c[c.length - 1][1] = null;
  return `<ol>${c.map(([t, h]) => `<li>${h ? `<a href="${h}">${t}</a>` : `<span aria-current="page">${t}</span>`}</li>`).join('')}</ol>`;
}

function chrome() {
  root.querySelector('.brand').setAttribute('href', to({ view: 'overview' }));
  root.querySelector('.crumbs').innerHTML = crumbs();
  const total = detailed();
  const done = total.filter((p) => visited.has(p)).length;
  const prog = root.querySelector('.progress');
  prog.classList.toggle('empty', !total.length);
  prog.querySelector('.progress-text').innerHTML = total.length ? `${done} of ${total.length} ${total.length === 1 ? L.lower('process') : L.lower('processes')} explored` : '';
  prog.querySelector('.meter span').style.width = `${total.length ? (100 * done) / total.length : 0}%`;
  const sel = root.querySelector('#om-persona');
  if (sel) sel.value = route.persona || '';
  const me = root.querySelector('.me-link');
  me.hidden = !persona();
  me.setAttribute('href', to({ view: 'me' }));
  if (route.view === 'me') me.setAttribute('aria-current', 'page');
  else me.removeAttribute('aria-current');
  const ch = root.querySelector('#om-changes');
  if (ch) ch.checked = route.changes;
  const q = root.querySelector('#om-q');
  if (document.activeElement !== q) q.value = route.view === 'search' ? route.q : '';
}

// ---------- events ----------

function openStep(id) {
  const p = E[route.id];
  const s = p.steps.find((st) => st.id === id);
  location.hash = to({ view: 'process', id: s.process, step: s.id });
}

function onClick(e) {
  const t = e.target.closest && e.target;
  if (!t || !root || !root.contains(t)) return;
  if (t.closest('[data-skip]')) {
    e.preventDefault();
    main.focus();
  } else if (t.closest('[data-open-km]')) root.querySelector('.km').showModal();
  else if (t.closest('[data-close]')) t.closest('dialog').close();
  else if (t.closest('[data-dismiss-notice]')) dismissNotice();
  else if (t.closest('[data-persona-choice]')) choosePersona(t.closest('[data-persona-choice]').dataset.personaChoice);
  else if (t.closest('.node')) openStep(t.closest('.node').dataset.step);
  else if (t.closest('[data-more]')) {
    const sc = main.querySelector('.swim-scroll');
    sc.scrollBy({ left: sc.clientWidth * 0.7, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

// Wide swimlanes scroll inside their own box. Shows a cue while more steps are hidden off to the right (or left).
function moreCue() {
  const sc = main && main.querySelector('.swim-scroll[data-layout="svg"]');
  if (!sc) return;
  sc.parentElement.classList.toggle('more-right', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4);
  sc.parentElement.classList.toggle('more-left', sc.scrollLeft > 4);
}

function choosePersona(id) {
  const dlg = root.querySelector('.arrival');
  if (dlg.open) dlg.close();
  const entry = E[id].entry || {};
  const views = { workstream: 'workstream', process: 'process', role: 'role' };
  const ok = views[entry.view] && is(entry.id, entry.view);
  location.hash = formatRoute({ view: ok ? views[entry.view] : 'overview', id: ok ? entry.id : undefined, persona: id, changes: route.changes });
}

function onChange(e) {
  if (e.target.id === 'om-persona') go({ persona: e.target.value || null }, true);
  // "Only changes" lists removed steps, which are shown only while change markers are on: the two move together.
  else if (e.target.id === 'om-changes') go(e.target.checked ? { changes: true } : { changes: false, only: false }, true);
  else if (e.target.id === 'om-only') {
    if (e.target.checked && !route.changes) say('Only changes shown. Change markers turned on.');
    go(e.target.checked ? { only: true, changes: true } : { only: false }, true);
  }
}

function onSearch(e) {
  if (e.target.id !== 'om-q' && !(e.type === 'submit' && e.target.classList.contains('search'))) return;
  if (e.type === 'submit') e.preventDefault();
  const q = root.querySelector('#om-q').value.trim();
  if (!q && e.type === 'input') return;
  go({ view: 'search', q }, route.view === 'search');
}

function onKey(e) {
  if (!route) return;
  const arrival = root.querySelector('.arrival');
  if (e.key === 'Escape' && arrival.open && !arrival.matches(':modal')) {
    e.preventDefault();
    arrival.close();
    return;
  }
  if (e.key === 'Escape' && !root.querySelector('.removed-notice').hidden && !document.querySelector('dialog[open]')) {
    e.preventDefault();
    dismissNotice();
    return;
  }
  if (e.key === 'Escape' && route.view === 'process' && route.step && !document.querySelector('dialog[open]')) {
    e.preventDefault();
    location.hash = to({ view: 'process', id: route.id });
    return;
  }
  const node = e.target.closest && e.target.closest('.node');
  if (!node || !F) return;
  const id = node.dataset.step;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    return openStep(id);
  }
  const col = F.order.filter((s) => F.nodes[s].rank === F.nodes[id].rank);
  const out = nextOf(F, id);
  const into = prevOf(F, id);
  const move = {
    ArrowRight: () => (out.find((x) => !x.back) || out[0] || {}).to,
    ArrowLeft: () => (into.find((x) => !x.back) || into[0] || {}).from,
    ArrowDown: () => col[col.indexOf(id) + 1],
    ArrowUp: () => col[col.indexOf(id) - 1],
  }[e.key];
  if (!move) return;
  e.preventDefault();
  const target = move();
  if (target) main.querySelector(`.node[data-step="${CSS.escape(target)}"]`).focus();
}

// ---------- views ----------

function view() {
  const x = E[route.id];
  switch (route.view) {
    case 'overview':
      return overview();
    case 'workstream':
      return is(route.id, 'workstream') ? workstream(x) : notFound();
    case 'process':
      return is(route.id, 'process') ? processView(x) : notFound();
    case 'structure':
      return is(route.id, 'structure') ? structureView(x) : notFound();
    case 'role':
      return is(route.id, 'role') ? role(x) : notFound();
    case 'element':
      return x && ['party', 'team', 'committee', 'persona'].includes(x.type) ? element(x) : x && x.type === 'role' ? role(x) : notFound();
    case 'search':
      return search();
    case 'me':
      return me();
  }
  return notFound();
}

const notFound = () => `<div class="page"><h1 tabindex="-1">Not found</h1><p>This link doesn't match anything in the ${L.lower('model')}.</p><p><a href="${href({ view: 'overview' })}">Go to the overview</a></p></div>`;

// party: on a party's own page, its mark beside the name and its colour on the heading.
const head = (eyebrow, x, extra = '', party = null) =>
  `<header class="page-head${party ? ' party-head' : ''}"${party ? dp(party) : ''}><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${party ? mark(party, false) : ''}${esc(x.name)}</h1>${badge(x.change) || extra ? `<div class="tags">${badge(x.change)}${extra}</div>` : ''}${x.summary ? `<p class="lead">${esc(x.summary)}</p>` : ''}${today(x)}${x.body ? `<div class="prose">${renderMarkdown(x.body)}</div>` : ''}</header>`;

function overview() {
  const m = M.model || {};
  const ws = M.order.workstream.map((id) => E[id]);
  const st = M.order.structure.filter((id) => E[id].main === true).concat(M.order.structure.filter((id) => E[id].main !== true)); // the main one first
  return `<div class="page">
<section class="hero">
  <p class="eyebrow">${L('model')}</p>
  <h1 tabindex="-1" data-testid="model-name">${esc(m.name)}</h1>
  ${m.purpose ? `<div class="lead purpose" data-testid="purpose">${renderMarkdown(String(m.purpose))}</div>` : ''}
  ${m.body ? `<div class="prose">${renderMarkdown(m.body)}</div>` : ''}
</section>
${list(m.key_messages).length ? `<section class="section" aria-labelledby="om-km-h"><h2 id="om-km-h">${L('key_messages')}</h2>${messagesHtml()}</section>` : ''}
${ws.length ? `<section class="section" aria-labelledby="om-ws-h"><h2 id="om-ws-h">${L('workstreams')}</h2><ul class="cards">${ws.map(wsCard).join('')}</ul></section>` : ''}
${st.length ? `<section class="section" aria-labelledby="om-st-h" data-testid="structure-list"><h2 id="om-st-h">${L('structures')}</h2><ul class="cards">${st.map(structureCard).join('')}</ul></section>` : ''}
${M.order.party.length ? `<section class="section" aria-labelledby="om-pa-h"><h2 id="om-pa-h">${L('parties')}</h2><ul class="cards cards-sm">${M.order.party.map(partyCard).join('')}</ul></section>` : ''}
${M.order.persona.length ? `<section class="section" aria-labelledby="om-pe-h"><h2 id="om-pe-h">Start from your perspective</h2><p class="section-lead">Each ${L.lower('persona')} opens where it matters most to them. Nothing is hidden from anyone.</p><ul class="doors doors-grid">${personaButtons()}</ul></section>` : ''}
</div>`;
}

function wsCard(w) {
  const outline = w.detail === 'outline';
  const n = w.processes.length;
  return `<li><a class="card" href="${href({ view: 'workstream', id: w.id })}" data-testid="workstream-card-${esc(w.id)}">
    <h3>${esc(w.name)}</h3>
    <p>${esc(w.summary)}</p>
    <p class="card-meta">${outline ? '<span class="tag">Outline only</span>' : `<span>${plural(n, 'process', 'processes')}</span>`}${badge(w.change)}
    <span class="dots">${list(w.parties).filter((p) => is(p, 'party')).map((p) => mark(p)).join('')}</span></p>
  </a></li>`;
}

const mainTag = (s) => (s.main === true ? `<span class="tag tag-main" data-testid="main-structure">Main ${L.lower('structure')}</span>` : '');

function structureCard(id) {
  const s = E[id];
  return `<li><a class="card" href="${href({ view: 'structure', id })}" data-testid="structure-card-${esc(id)}">
    <h3>${esc(s.name)}</h3>${s.summary ? `<p>${esc(s.summary)}</p>` : ''}
    <p class="card-meta">${mainTag(s)}${s.kind ? `<span class="tag">${esc(s.kind)}</span>` : ''}${badge(s.change)}</p></a></li>`;
}
const structureChip = (id) => `<a class="chip" href="${href({ view: 'structure', id })}">${esc(E[id].name)}</a>`;

function partyCard(id) {
  const p = E[id];
  const roles = M.order.role.filter((r) => E[r].party === id).length;
  return `<li><a class="card card-party"${dp(id)} href="${href({ view: 'element', id })}" data-testid="party-card-${esc(id)}">
    <h3>${mark(id, false)}${esc(p.name)}</h3><p>${esc(p.summary)}</p><p class="card-meta"><span>${plural(roles, 'role', 'roles')}</span>${badge(p.change)}</p></a></li>`;
}

function rolesIn(processIds) {
  const set = new Set();
  for (const p of processIds) for (const s of E[p].steps) if (visible(s)) [s.owner, ...Object.keys(s.raci)].forEach((r) => is(r, 'role') && set.add(r));
  return M.order.role.filter((r) => set.has(r));
}

function workstream(w) {
  const outline = w.detail === 'outline';
  const parties = list(w.parties).filter((p) => is(p, 'party'));
  const roles = rolesIn(w.processes);
  return `<div class="page">
${head(L('workstream'), w, outline ? '<span class="tag" data-testid="outline-label">Outline only</span>' : '')}
${parties.length ? `<section class="section"><h2>${L('parties')} involved</h2><p class="chips">${parties.map(partyChip).join('')}</p></section>` : ''}
${outline
  ? `<p class="note">This ${L.lower('workstream')} is shown in outline only. Its ${L.lower('processes')} are not detailed yet.</p>`
  : `<section class="section" aria-labelledby="om-pr-h"><h2 id="om-pr-h">${L('processes')}</h2>${w.processes.length ? `<ul class="cards">${w.processes.map((p) => processCard(E[p])).join('')}</ul>` : `<p class="note">No ${L.lower('processes')} yet.</p>`}</section>
${roles.length ? `<section class="section"><h2>${L('roles')} involved</h2><p class="chips">${roles.map(roleChip).join('')}</p></section>` : ''}`}
${list(w.structures).length ? `<section class="section" data-testid="workstream-structures"><h2>Related ${L.lower('structures')}</h2><p class="chips">${w.structures.map(structureChip).join('')}</p></section>` : ''}
</div>`;
}

function processCard(p) {
  const steps = p.steps.filter(visible);
  const yours = persona() && steps.filter((s) => cue(s)).length;
  return `<li><a class="card" href="${href({ view: 'process', id: p.id })}" data-testid="process-card-${esc(p.id)}">
    <h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p>
    <p class="card-meta"><span>${plural(steps.length, 'step', 'steps')}</span>${yours ? `<span class="cue">${yours} for you</span>` : ''}${visited.has(p.id) ? '<span class="tag tag-done">Explored</span>' : ''}${badge(p.change)}</p></a></li>`;
}

function stepLabel(s) {
  const r = E[s.owner];
  const nx = F.nodes[s.id] ? nextOf(F, s.id) : [];
  const b = badgeText(s.change);
  const c = cue(s);
  const owner = committeeOf(s) ? `, by ${L.lower('committee')}: ${esc(committeeOf(s).name)}` : `. ${esc(r ? r.name : s.owner)}${is(s.party, 'party') ? `, ${esc(E[s.party].name)}` : ''}`;
  return `${esc(s.name)}${owner}.${b ? ` ${b}.` : ''}${c ? ` ${c}.` : ''} ${nx.length ? `Next: ${nx.map((e) => `${esc(F.nodes[e.to].step.name)}${e.label ? ` (${esc(e.label)})` : ''}`).join(', ')}.` : 'End of the flow.'}`;
}

function processView(p) {
  const sel = route.step && p.steps.find((s) => s.id === route.step);
  F = flow(M, p.id, { showRemoved: route.changes });
  const w = E[p.workstream];
  const lane = narrow.matches ? flowList() : swimlaneSvg({
    m: M, L, f: F, dp, mark: (p) => mark(p, false), selected: sel && sel.id, label: `${esc(p.name)}: ${L.lower('steps')} by ${L.lower('role')}`,
    mine: persona() ? mine : null, cue, badge: (c) => badgeText(c), stepLabel, roleHref: (r) => href({ view: is(r, 'committee') ? 'element' : 'role', id: r }),
  });
  return `<div class="page page-wide">
<header class="page-head"><p class="eyebrow">${L('process')}${is(p.workstream, 'workstream') ? ` · <a href="${href({ view: 'workstream', id: w.id })}">${esc(w.name)}</a>` : ''}</p>
  <h1 tabindex="-1">${esc(p.name)}</h1>${badge(p.change) ? `<div class="tags">${badge(p.change)}</div>` : ''}${p.summary ? `<p class="lead">${esc(p.summary)}</p>` : ''}${today(p)}</header>
<div class="process-grid${sel ? ' has-detail' : ''}">
  <section class="lane-panel" aria-labelledby="om-lane-h">
    <div class="lane-bar"><h2 id="om-lane-h">${L('steps')} and handoffs</h2>${legend()}</div>
    <div class="swim-wrap"><div class="swim-scroll" data-testid="swimlane" data-layout="${narrow.matches ? 'list' : 'svg'}">${lane}</div>${narrow.matches ? '' : `<button type="button" class="more-cue" data-more tabindex="-1" aria-hidden="true" data-testid="swimlane-more">More ${L.lower('steps')} <span>→</span></button>`}</div>
    ${narrow.matches ? '' : `<p class="hint">Tab moves through the ${L.lower('steps')} in flow order. Arrow keys follow the connectors, Enter opens ${L.a('step')} and Escape closes it.</p>`}
  </section>
  ${sel ? stepDetail(sel) : ''}
</div>
${p.body ? `<section class="section about"><h2>About this ${L.lower('process')}</h2><div class="prose">${renderMarkdown(p.body)}</div></section>` : ''}
</div>`;
}

function legend() {
  if (narrow.matches) return persona() ? `<p class="legend" data-testid="legend"><span class="cue">Your ${L.lower('step')}</span> marks where you take part</p>` : '';
  return `<ul class="legend" data-testid="legend">
  <li><svg width="44" height="12" aria-hidden="true"><path class="edge" d="M2 6H34" marker-end="url(#om-arrow)"/></svg>Handoff within ${L.a('party')}</li>
  <li><svg width="44" height="12" aria-hidden="true"><path class="edge cross" d="M2 6H34" marker-end="url(#om-open)"/></svg>Handoff between ${L.lower('parties')}</li>
  <li><span class="raci-key" aria-hidden="true">C</span>Consulted or informed (RACI)</li>
  ${F.groups.filter((g) => is(g.party, 'party')).map((g) => `<li data-testid="legend-party"${dp(g.party)}><span class="swatch" aria-hidden="true"></span>${mark(g.party, false)}${esc(E[g.party].name)}</li>`).join('')}
  ${persona() ? '<li><span class="cue">Your lane</span> Emphasised for you; everything else stays open</li>' : ''}
</ul>`;
}

function flowList() {
  return `<ol class="flow-list" data-testid="swimlane-list">${F.order
    .map((id, i) => {
      const s = F.nodes[id].step;
      const c = persona() ? cue(s) : null;
      const nx = nextOf(F, id);
      const r = E[s.owner];
      return `<li class="${[s.id === route.step && 'selected', persona() && (c ? 'mine' : 'dim')].filter(Boolean).join(' ')}"${dp(s.party)}>
  <a class="flow-item" href="${stepHref(s)}" data-step="${esc(id)}" data-testid="step-${esc(id)}"${s.id === route.step ? ' aria-current="step"' : ''}>
    <span class="fi-num" aria-hidden="true">${i + 1}</span>
    <span class="fi-body"><span class="fi-name">${esc(s.name)}</span>
    <span class="fi-lane">${committeeOf(s)
      ? `${esc(committeeOf(s).name)}: ${[...M.order.party, null].flatMap((p) => Object.keys(committeeOf(s).members).filter((x) => memberParty(x) === p)).map((x) => `${esc(nameOf(x))}${memberParty(x) ? ` (${esc(E[memberParty(x)].name)})` : ''}`).join(', ')}`
      : `${esc(r ? r.name : s.owner)}${is(s.party, 'party') ? ` · <span class="ptag">${mark(s.party, false)}${esc(E[s.party].name)}</span>` : ''}`}</span>
    ${byCommittee(s) || badge(s.change) || c ? `<span class="tags">${byCommittee(s)}${badge(s.change)}${c ? `<span class="cue">${c}</span>` : ''}</span>` : ''}
    <span class="fi-next">${nx.length ? `Next: ${nx.map((e) => `${esc(F.nodes[e.to].step.name)}${e.label ? ` (${esc(e.label)})` : ''}`).join(', ')}` : 'End of the flow'}</span></span>
  </a></li>`;
    })
    .join('')}</ol>`;
}

function stepDetail(s) {
  const inFlow = !!F.nodes[s.id];
  const nx = inFlow ? nextOf(F, s.id) : [];
  const pv = inFlow ? prevOf(F, s.id) : [];
  const r = E[s.owner];
  const c = persona() ? cue(s) : null;
  const items = (title, v) => (list(v).length ? `<div class="field"><h3>${title}</h3><ul>${list(v).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '');
  // A committee step leads with its members split by organisation; its RACI then lists only the non-members.
  const com = committeeOf(s);
  const raci = Object.entries(s.raci).filter(([role]) => !com || !Object.hasOwn(com.members, role));
  const owner = com
    ? `<a href="${href({ view: 'element', id: s.owner })}">${esc(com.name)}</a> ${byCommittee(s)}`
    : `${r ? `<a href="${href({ view: 'role', id: s.owner })}">${esc(r.name)}</a>` : esc(s.owner)}${partyTag(s.party)}`;
  const link = (id, dir, label) => {
    const t = F.nodes[id].step;
    return `<a class="flow-btn ${dir}" href="${stepHref(t)}" data-testid="step-${dir}" data-to="${esc(id)}"><span class="fb-k">${dir === 'next' ? 'Next' : 'Previous'}${label ? ` · ${esc(label)}` : ''}</span><span class="fb-name">${esc(t.name)}</span></a>`;
  };
  return `<aside class="detail" data-testid="step-detail" aria-labelledby="om-detail-title">
  <div class="detail-top"><p class="eyebrow">${L('step')}${inFlow ? ` ${F.order.indexOf(s.id) + 1} of ${F.order.length}` : ''}</p>
    <a class="btn btn-quiet close" href="${href({ view: 'process', id: s.process })}" data-testid="close-detail" aria-label="Close ${L.lower('step')} detail">Close</a></div>
  <h2 id="om-detail-title" tabindex="-1">${esc(s.name)}</h2>
  ${badge(s.change) || c ? `<div class="tags">${badge(s.change)}${c ? `<span class="cue">${c}</span>` : ''}</div>` : ''}
  <p class="owner" data-testid="owner"><span class="k">Owner</span> ${owner}</p>
  ${com ? `<div class="field members" data-testid="committee-members"><h3>${L('committee')} members</h3>${membersHtml(com, 'h4')}</div>` : ''}
  ${s.description ? `<div class="prose">${renderMarkdown(s.description)}</div>` : ''}
  ${today(s)}
  ${raci.length ? `<div class="field"><h3>RACI</h3><table class="raci-table"><tbody>${raci.map((x) => raciRow(x)).join('')}</tbody></table></div>` : ''}
  ${items('Inputs', s.inputs)}${items('Outputs', s.outputs)}${items('Systems', s.systems)}${items('KPIs', s.kpis)}
  <nav class="flow-nav" aria-label="Move along the flow">
    <div>${pv.length ? pv.map((e) => link(e.from, 'prev', e.back ? e.label : '')).join('') : '<p class="flow-end">Start of the flow</p>'}</div>
    <div>${nx.length ? nx.map((e) => link(e.to, 'next', e.label)).join('') : '<p class="flow-end">End of the flow</p>'}</div>
  </nav>
</aside>`;
}

// A structure diagram (structure-diagrams spec). Columns are the parties of its shown boxes and its line ends, so a
// party used only by a hidden (removed) box gets no column. Persona boxes are emphasised; nothing is hidden.
function structureView(s) {
  const ends = new Set(s.lines.flatMap((l) => [l.from.party, l.to.party]));
  const parties = s.parties.filter((p) => ends.has(p) || s.boxes.some((b) => b.party === p && visible(b)));
  const roles = personaRoles();
  const mineBox = (b) => roles.has(b.role) || (!!b.team && [...roles].some((r) => is(r, 'role') && E[r].team === b.team));
  const rel = s.relatedAll.filter((id) => is(id, 'structure'));
  const ws = s.workstreams.filter((id) => is(id, 'workstream'));
  return `<div class="page page-wide">
<header class="page-head"><p class="eyebrow">${L('structure')}</p><h1 tabindex="-1">${esc(s.name)}</h1>
  ${mainTag(s) || s.kind || badge(s.change) ? `<div class="tags">${mainTag(s)}${s.kind ? `<span class="tag" data-testid="structure-kind">${esc(s.kind)}</span>` : ''}${badge(s.change)}</div>` : ''}
  ${s.summary ? `<p class="lead">${esc(s.summary)}</p>` : ''}${today(s)}</header>
<section class="section" aria-labelledby="om-sd-h"><h2 id="om-sd-h">${L('roles')} and ${L.lower('teams')} by ${L.lower('party')}</h2>
  <div class="sd-scroll" data-testid="structure-diagram">${structureHtml({ m: M, L, s, parties, dp, mark: (p) => mark(p, false), visible, mine: mineBox, badge: (c) => badge(c), href })}</div>
</section>
${rel.length || ws.length ? `<section class="section" aria-labelledby="om-rel-h" data-testid="structure-related"><h2 id="om-rel-h">Related</h2>
  ${rel.length ? `<div class="group"><h3>${L('structures')}</h3><p class="chips">${rel.map(structureChip).join('')}</p></div>` : ''}
  ${ws.length ? `<div class="group"><h3>${L('workstreams')}</h3><p class="chips">${ws.map((w) => `<a class="chip" href="${href({ view: 'workstream', id: w })}">${esc(E[w].name)}</a>`).join('')}</p></div>` : ''}
</section>` : ''}
${s.body ? `<section class="section about"><h2>About this ${L.lower('structure')}</h2><div class="prose">${renderMarkdown(s.body)}</div></section>` : ''}
</div>`;
}

function stepsFor(roles, filter = () => true) {
  return M.order.process
    .map((p) => ({ p: E[p], steps: E[p].steps.filter((s) => [...roles].some((r) => involved(s, r)) && filter(s)) }))
    .filter((g) => g.steps.length);
}

function role(r) {
  const party = is(r.party, 'party') ? `<a class="ptag"${dp(r.party)} href="${href({ view: 'element', id: r.party })}">${mark(r.party, false)}${esc(E[r.party].name)}</a>` : '';
  const team = is(r.team, 'team') ? ` · <a href="${href({ view: 'element', id: r.team })}">${esc(E[r.team].name)}</a>` : '';
  const groups = stepsFor([r.id], visible);
  const diagrams = list(r.structures).filter((s) => E[s].boxes.some((b) => b.role === r.id && visible(b)));
  const committees = list(M.committeesOf && M.committeesOf[r.id]).filter((c) => is(c.committee, 'committee') && visible(E[c.committee]));
  return `<div class="page">
${head(`${L('role')}${party ? ` · ${party}` : ''}${team}`, r, mine(r.id) ? `<span class="cue">Your ${L.lower('role')}</span>` : '')}
${committees.length ? `<section class="section" data-testid="role-committees"><h2>${L('committees')}</h2><ul class="step-list">${committees.map((c) => `<li><a href="${href({ view: 'element', id: c.committee })}">${esc(E[c.committee].name)}</a><span class="step-tags">${letterHtml(c.letter)}${badge(E[c.committee].change)}</span></li>`).join('')}</ul></section>` : ''}
<section class="section" aria-labelledby="om-where-h"><h2 id="om-where-h">Where this ${L.lower('role')} takes part</h2>
${groups.length ? groups.map((g) => `<div class="group"><h3><a href="${href({ view: 'process', id: g.p.id })}">${esc(g.p.name)}</a></h3><ul class="step-list">${g.steps.map((s) => `<li><a href="${stepHref(s)}">${esc(s.name)}</a><span class="step-tags">${s.owner === r.id ? '<span class="tag">Owner</span>' : ''}${s.raci[r.id] ? letterHtml(s.raci[r.id]) : ''}${via(s)}${badge(s.change)}</span></li>`).join('')}</ul></div>`).join('') : `<p class="note">Not part of any ${L.lower('steps')} yet.</p>`}
</section>
${diagrams.length ? `<section class="section" data-testid="role-structures"><h2>${L('structures')} with this ${L.lower('role')}</h2><p class="chips">${diagrams.map(structureChip).join('')}</p></section>` : ''}
</div>`;
}

function element(x) {
  const roles = x.type === 'persona' ? list(x.roles).filter((r) => is(r, 'role')) : M.order.role.filter((r) => E[r][x.type] === x.id);
  const teams = x.type === 'party' ? M.order.team.filter((t) => E[t].party === x.id) : [];
  const parent = x.type === 'team' && is(x.party, 'party') ? ` · <a class="ptag"${dp(x.party)} href="${href({ view: 'element', id: x.party })}">${mark(x.party, false)}${esc(E[x.party].name)}</a>` : '';
  return `<div class="page">
${head(`${L(x.type)}${parent}`, x, '', x.type === 'party' ? x.id : null)}
${teams.length ? `<section class="section"><h2>${L('teams')}</h2><p class="chips">${teams.map((t) => `<a class="chip" href="${href({ view: 'element', id: t })}">${esc(E[t].name)}</a>`).join('')}</p></section>` : ''}
${roles.length ? `<section class="section"><h2>${L('roles')}</h2><p class="chips">${roles.map(roleChip).join('')}</p></section>` : ''}
${x.type === 'committee' ? committeeSections(x) : ''}
${x.type === 'persona' ? `<p><button type="button" class="btn btn-primary" data-persona-choice="${esc(x.id)}">View as ${esc(x.name)}</button></p>` : ''}
</div>`;
}

// A committee's page (committees spec › Committee page): its members by party, then the steps it owns by process.
function committeeSections(c) {
  const owned = list(M.stepsOf && M.stepsOf[c.id]).map((x) => is(x.process, 'process') && E[x.process].steps.find((s) => s.id === x.step)).filter((s) => s && visible(s));
  const groups = M.order.process.map((p) => ({ p: E[p], steps: owned.filter((s) => s.process === p) })).filter((g) => g.steps.length);
  return `<section class="section" data-testid="committee-members"><h2>Members</h2>${membersHtml(c, 'h3')}</section>
<section class="section" data-testid="committee-steps"><h2>${L('steps')} this ${L.lower('committee')} owns</h2>
${groups.length ? groups.map((g) => `<div class="group"><h3><a href="${href({ view: 'process', id: g.p.id })}">${esc(g.p.name)}</a></h3><ul class="step-list">${g.steps.map((s) => `<li><a href="${stepHref(s)}">${esc(s.name)}</a><span class="step-tags">${badge(s.change)}</span></li>`).join('')}</ul></div>`).join('') : `<p class="note">No ${L.lower('steps')} yet.</p>`}
</section>`;
}

function search() {
  const q = route.q.trim().toLowerCase();
  const hit = (...v) => q && v.some((t) => typeof t === 'string' && t.toLowerCase().includes(q));
  const types = ['workstream', 'process', 'step', 'structure', 'role', 'committee', 'team', 'party', 'persona'];
  const plurals = { workstream: 'workstreams', process: 'processes', step: 'steps', structure: 'structures', role: 'roles', committee: 'committees', team: 'teams', party: 'parties', persona: 'personas' };
  const targets = {
    workstream: (x) => href({ view: 'workstream', id: x.id }),
    process: (x) => href({ view: 'process', id: x.id }),
    step: stepHref,
    structure: (x) => href({ view: 'structure', id: x.id }),
    role: (x) => href({ view: 'role', id: x.id }),
  };
  // A match in a box's name or note text lists its structure, with the matched box as the result's context (design D9).
  const boxHit = (x) => x.type === 'structure' && x.boxes.find((b) => visible(b) && hit(b.name, b.note));
  const groups = types
    .map((t) => {
      const items = t === 'step' ? M.order.process.flatMap((p) => E[p].steps.filter((s) => visible(s) && hit(s.name, s.description))) : M.order[t].map((id) => E[id]).filter((x) => visible(x) && (hit(x.name, x.summary, x.purpose) || boxHit(x)));
      return { t, items };
    })
    .filter((g) => g.items.length);
  const boxCtx = (b) => (b ? `<span class="result-ctx" data-testid="search-box-match">${esc([b.name, b.note].filter(Boolean).join(' · '))} · ${esc(nameOf(b.role || b.team))}</span>` : '');
  const n = groups.reduce((a, g) => a + g.items.length, 0);
  return `<div class="page">
<header class="page-head"><p class="eyebrow">Search</p><h1 tabindex="-1">${q ? `Results for “${esc(route.q)}”` : 'Search'}</h1>
<p class="lead" role="status" data-testid="search-count">${q ? `${n} ${n === 1 ? 'result' : 'results'}` : `Type in the search box to find anything in the ${L.lower('model')}.`}</p></header>
${groups
  .map(
    (g) => `<section class="section" data-testid="search-group-${g.t}"><h2>${L(plurals[g.t])} <span class="count">${g.items.length}</span></h2><ul class="results">${g.items
      .map((x) => `<li><a href="${(targets[g.t] || ((y) => href({ view: 'element', id: y.id })))(x)}" data-testid="search-result">${esc(x.name)}</a>${g.t === 'step' ? `<span class="result-ctx">${L('process')}: ${esc(E[x.process].name)}</span>` : ''}${boxCtx(boxHit(x))}${badge(x.change)}</li>`)
      .join('')}</ul></section>`,
  )
  .join('')}
</div>`;
}

function me() {
  const p = persona();
  if (!p) return `<div class="page"><header class="page-head"><p class="eyebrow">${L('persona')}</p><h1 tabindex="-1">What matters for me</h1><p class="lead">Choose ${L.a('persona')} to see every ${L.lower('step')} where you take part.</p></header><ul class="doors doors-grid">${personaButtons()}</ul></div>`;
  const roles = list(p.roles).filter((r) => is(r, 'role'));
  const only = route.only && route.changes && hasChanges(); // "Only changes" needs change markers on (a link may carry only=1 alone)
  const groups = stepsFor(roles, only ? (s) => s.change && STATUS[s.change.status] : visible);
  return `<div class="page">
<header class="page-head"><p class="eyebrow">${esc(p.name)}</p><h1 tabindex="-1">What matters for me</h1>
<p class="lead">Every ${L.lower('step')}, across all ${L.lower('processes')}, where ${roles.map((r) => esc(E[r].name)).join(' or ')} ${roles.length === 1 ? 'is' : 'are'} the owner or in the RACI.</p>
${hasChanges() ? `<label class="toggle" data-testid="only-changes"><input type="checkbox" id="om-only"${only ? ' checked' : ''}><span>Only changes</span></label>` : ''}</header>
${groups.length ? groups.map((g) => `<section class="section group" data-testid="me-group-${esc(g.p.id)}"><h2><a href="${href({ view: 'process', id: g.p.id })}">${esc(g.p.name)}</a></h2><ul class="step-list">${g.steps.map((s) => `<li data-testid="me-step"><a href="${stepHref(s)}">${esc(s.name)}</a><span class="step-tags">${roles.filter((r) => involved(s, r)).map((r) => `${letterHtml(letterOf(s, r))}${roles.length > 1 ? `<span class="letter-role">${esc(E[r].name)}</span>` : ''}`).join('')}${via(s)}${badge(s.change, only)}</span></li>`).join('')}</ul></section>`).join('') : `<p class="note">${only ? `No changes affect you.` : `No ${L.lower('steps')} involve you yet.`}</p>`}
</div>`;
}
