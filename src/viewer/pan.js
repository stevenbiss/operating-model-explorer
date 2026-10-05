// Drag to pan the swimlane and structure diagrams with the left mouse button (add-wide-pannable-diagrams D4).
// Listeners are delegated on root, so views re-rendered with innerHTML need nothing extra. Touch and pen keep their
// native scrolling; the keyboard, wheel and scrollbars are untouched. Panning only scrolls; it never edits the model.
const AREAS = '.swim-scroll[data-layout="svg"], .sd-scroll';
const wide = matchMedia('(min-width: 768px)');
const pannable = (a) => wide.matches && (a.scrollWidth > a.clientWidth || a.scrollHeight > a.clientHeight);
// The release after a drag must not open the step, box or link it ends on.
const swallow = (e) => {
  e.stopPropagation();
  e.preventDefault();
};

export function initPan(root) {
  let drag = null;
  const areaOf = (t) => t instanceof Element && t.closest(AREAS);
  // The open-hand cursor shows only while the area overflows; checked as the mouse comes over it.
  root.addEventListener('pointerover', (e) => {
    const a = e.pointerType === 'mouse' && areaOf(e.target);
    if (a) a.classList.toggle('can-pan', pannable(a));
  });
  root.addEventListener('pointerdown', (e) => {
    const a = e.button === 0 && e.pointerType === 'mouse' && areaOf(e.target);
    if (!a || !pannable(a)) return;
    const r = a.getBoundingClientRect();
    // Not on the area's own scrollbars, which keep their native drag.
    if (e.clientX - r.left - a.clientLeft >= a.clientWidth || e.clientY - r.top - a.clientTop >= a.clientHeight) return;
    a.classList.add('can-pan', 'panning');
    drag = { a, id: e.pointerId, x: e.clientX, y: e.clientY, left: a.scrollLeft, top: a.scrollTop, moved: false };
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { a, moved } = drag;
    drag = null;
    a.classList.remove('panning');
    if (!moved) return;
    a.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => a.removeEventListener('click', swallow, { capture: true })); // in case no click follows
  };
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!(e.buttons & 1)) return end(e); // released outside the window
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 5) return; // still a click
      drag.moved = true;
      drag.a.setPointerCapture(e.pointerId);
    }
    drag.a.scrollLeft = drag.left - dx;
    drag.a.scrollTop = drag.top - dy;
  });
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  // Links and images in the diagrams don't start the browser's own drag and drop.
  root.addEventListener('dragstart', (e) => areaOf(e.target) && e.preventDefault());
}
