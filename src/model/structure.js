// Structure diagram lines (design D5). Pure, so it is unit-tested in Node; the viewer measures the cells.

// cells: [{ band, parent, party, x, y, w, h }], one per leaf cell (parent: the band a sub-band sits in, or null).
// lines: [{ from: { band, party }, to: { band, party }, label? }]. A line end naming a parent band is the union of
// its sub-band cells in that column.
// Returns one entry per line: { x1, y1, x2, y2, lx, ly, label } (lx, ly: the label's centre), or null when an end
// has no cell or the two ends overlap (a parent band and its own sub-band in one column).
// Cells in the same row join edge to edge horizontally, cells in the same column vertically, and any other pair
// with a straight segment between the facing edge midpoints.
export function lineGeometry(cells, lines) {
  const rectOf = ({ band, party }) => {
    const hit = cells.filter((c) => c.party === party && (c.band === band || c.parent === band));
    if (!hit.length) return null;
    const x = Math.min(...hit.map((c) => c.x));
    const y = Math.min(...hit.map((c) => c.y));
    return { x, y, r: Math.max(...hit.map((c) => c.x + c.w)), b: Math.max(...hit.map((c) => c.y + c.h)) };
  };
  return lines.map((l) => {
    const a = rectOf(l.from);
    const b = rectOf(l.to);
    if (!a || !b) return null;
    const [left, right] = a.x <= b.x ? [a, b] : [b, a];
    const [top, bottom] = a.y <= b.y ? [a, b] : [b, a];
    const gapX = right.x - left.r; // > 0: the cells are side by side
    const gapY = bottom.y - top.b; // > 0: one is above the other
    let s;
    if (gapX > 0 && gapY < 0) {
      const y = (Math.max(a.y, b.y) + Math.min(a.b, b.b)) / 2; // the middle of the rows they share
      s = [left.r, y, right.x, y];
    } else if (gapY > 0 && gapX < 0) {
      const x = (Math.max(a.x, b.x) + Math.min(a.r, b.r)) / 2;
      s = [x, top.b, x, bottom.y];
    } else if (gapX > 0 && gapX >= gapY) s = [left.r, (left.y + left.b) / 2, right.x, (right.y + right.b) / 2];
    else if (gapY > 0) s = [(top.x + top.r) / 2, top.b, (bottom.x + bottom.r) / 2, bottom.y];
    else return null;
    const [x1, y1, x2, y2] = s;
    return { x1, y1, x2, y2, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2, label: l.label };
  });
}
