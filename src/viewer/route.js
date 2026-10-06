// Hash routes (design D7): #/, #/w/<id>, #/p/<id>, #/p/<id>/s/<step>, #/d/<id> (a structure), #/r/<id>, #/e/<id>, #/search, #/me,
// with ?persona=<id>&changes=1&only=1&q=<text>&view=simple|detailed. Hash routing works from file:// and gives Back/Forward.
// The home-page view (?view=) is route.home, as route.view is the page. It's written only when it differs from base,
// the model's own view (design D2), so the default URL stays clean.

const VIEWS = { w: 'workstream', p: 'process', d: 'structure', r: 'role', e: 'element' };

export function parseRoute(hash) {
  const [path, query = ''] = (hash || '').replace(/^#\/?/, '').split('?');
  const q = new URLSearchParams(query);
  const [k, id, s, step] = path.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  const r = { view: 'overview', persona: q.get('persona') || null, changes: q.get('changes') === '1', only: q.get('only') === '1', q: q.get('q') || '', home: ['simple', 'detailed'].includes(q.get('view')) ? q.get('view') : null };
  if (VIEWS[k] && id) Object.assign(r, { view: VIEWS[k], id });
  if (k === 'p' && s === 's' && step) r.step = step;
  if (k === 'search' || k === 'me') r.view = k;
  return r;
}

export function formatRoute(r, base = 'simple') {
  const key = Object.keys(VIEWS).find((k) => VIEWS[k] === r.view);
  let path = key ? `${key}/${encodeURIComponent(r.id)}` : r.view === 'search' || r.view === 'me' ? r.view : '';
  if (r.view === 'process' && r.step) path += `/s/${encodeURIComponent(r.step)}`;
  const q = new URLSearchParams();
  if (r.persona) q.set('persona', r.persona);
  if (r.changes) q.set('changes', '1');
  if (r.view === 'me' && r.only) q.set('only', '1');
  if (r.view === 'search' && r.q) q.set('q', r.q);
  if (r.home && r.home !== base) q.set('view', r.home);
  const qs = q.toString();
  return `#/${path}${qs ? `?${qs}` : ''}`;
}
