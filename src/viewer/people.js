// People on roles (role-people spec, design D3 and D4): the line under a role's name, and one delegated pop-up
// listing everyone who holds the role. Every role element with people has data-people="<role id>" and
// aria-describedby pointing to a hidden "People: …" span, so the pop-up is never the only way to read the names.
import { esc } from './esc.js';

export const names = (role) => (role && Array.isArray(role.people) ? role.people.filter((p) => typeof p === 'string' && p.trim()) : []);

// '' for no people, the one name, or "Multiple people". Plain text: escape it where it goes into HTML.
export const peopleLine = (role) => {
  const n = names(role);
  return n.length > 1 ? 'Multiple people' : n[0] || '';
};

const descId = (id) => `om-ppl-${id}`;
// Attributes for a role element: ' data-people="…" aria-describedby="…"', or '' when the role has no people.
export const peopleAttrs = (id, role) => (names(role).length ? ` data-people="${esc(id)}" aria-describedby="${esc(descId(id))}"` : '');

// The hidden descriptions and the pop-up itself, once per render.
export const peopleHtml = (els, ids) =>
  `<div hidden>${ids.filter((id) => names(els[id]).length).map((id) => `<span id="${esc(descId(id))}">People: ${esc(names(els[id]).join(', '))}</span>`).join('')}</div>` +
  '<div id="om-people-tip" class="people-tip" role="tooltip" data-testid="people-tip" hidden></div>';

// Delegated listeners, added once. getRole(id) -> the role element of the model on screen.
export function initPeopleTip(doc, getRole) {
  let timer = 0;
  let on = null; // the element the pop-up describes
  const tip = () => doc.getElementById('om-people-tip');
  const hide = () => {
    clearTimeout(timer);
    on = null;
    if (tip()) tip().hidden = true;
  };
  const show = (el) => {
    const t = tip();
    const role = getRole(el.dataset.people);
    if (!t || !role || !names(role).length) return;
    on = el;
    t.innerHTML = `<p class="people-tip-h">${esc(role.name)}</p><ul>${names(role).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
    t.hidden = false;
    // Below the element, or above it when there is no room; always inside the window.
    const r = el.getBoundingClientRect();
    const w = t.offsetWidth;
    const h = t.offsetHeight;
    const { clientWidth: vw, clientHeight: vh } = doc.documentElement; // the window less its scrollbars
    const top = r.bottom + 6 + h <= vh ? r.bottom + 6 : Math.max(4, r.top - 6 - h);
    t.style.top = `${top}px`;
    t.style.left = `${Math.max(4, Math.min(r.left, vw - w - 4))}px`;
  };
  const target = (e) => e.target.closest && e.target.closest('[data-people]');
  doc.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    if (tip() && tip().contains(e.target)) return clearTimeout(timer); // the pop-up can be hovered (WCAG 1.4.13)
    const el = target(e);
    if (!el || el === on) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(el), 150);
  });
  doc.addEventListener('pointerout', (e) => {
    const to = e.relatedTarget;
    if (to && ((on && on.contains(to)) || (tip() && tip().contains(to)))) return;
    if (target(e) || (tip() && tip().contains(e.target))) {
      clearTimeout(timer);
      if (on && on !== doc.activeElement) timer = setTimeout(hide, 100);
    }
  });
  // Keyboard focus only: a mouse click focuses the element too, and hover already covers the pointer.
  doc.addEventListener('focusin', (e) => {
    const el = target(e);
    if (el && el.matches(':focus-visible')) {
      clearTimeout(timer);
      show(el);
    } else if (on) hide();
  });
  doc.addEventListener('focusout', (e) => target(e) === on && hide());
  doc.addEventListener('pointerdown', hide);
  // Scrolling hides a hover pop-up; a focused element's pop-up follows it (focus often scrolls it into view).
  doc.addEventListener('scroll', () => on && (on === doc.activeElement ? show(on) : hide()), true);
  // Capture phase, so Escape closes the pop-up only, and focus stays where it is.
  doc.defaultView.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || !on) return;
      e.preventDefault();
      e.stopPropagation();
      hide();
    },
    true,
  );
}
