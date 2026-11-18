/**
 * The footpaths around the island. Characters walk from node to node along these,
 * and the same segments are drawn as paths and kept clear of grass.
 */

export type XZ = [number, number];

export const NODES: Record<string, XZ> = {
  // Main road, from outside the gates to the plaza in front of the throne.
  gateOut: [0, 15.6],
  gateIn: [0, 10.6],
  mainNorth: [0, 8.0],
  mainMid: [0, 2.0],
  castleStop: [0, -1.0],
  mainSouth: [0, -2.2],
  plaza: [0, -4.6],
  // West loop: roses, through the rose arch, tea party, dragon, back to the plaza.
  roses: [-4.8, 8.9],
  roseArch: [-6.0, 5.2],
  tea: [-9.4, 3.4],
  teaSouth: [-8.6, 0.4],
  dragon: [-10.2, -4.0],
  dragonEast: [-4.6, -4.6],
  // East side: well, gazebo, easel, dock.
  well: [5.2, 9.9],
  gazebo: [2.2, 1.9],
  east: [7.6, -1.6],
  easel: [8.9, -2.9],
  dock: [15.3, 1.9],
};

export const EDGES: [string, string][] = [
  ["gateOut", "gateIn"],
  ["gateIn", "mainNorth"],
  ["mainNorth", "mainMid"],
  ["mainMid", "castleStop"],
  ["castleStop", "mainSouth"],
  ["mainSouth", "plaza"],
  ["mainNorth", "roses"],
  ["roses", "roseArch"],
  ["roseArch", "tea"],
  ["tea", "teaSouth"],
  ["teaSouth", "dragon"],
  ["dragon", "dragonEast"],
  ["dragonEast", "plaza"],
  ["mainNorth", "well"],
  ["mainMid", "gazebo"],
  ["mainSouth", "east"],
  ["east", "easel"],
  ["east", "dock"],
];

/** Path segments as pairs of points, for drawing and for keeping grass off them. */
export const SEGMENTS: [XZ, XZ][] = EDGES.map(([a, b]) => [NODES[a], NODES[b]]);

const dist = (a: XZ, b: XZ) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function nearestNode(p: XZ) {
  let best = "";
  let bd = Infinity;
  for (const [k, v] of Object.entries(NODES)) {
    const d = dist(p, v);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

function shortest(from: string, to: string): string[] {
  const d: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const open = new Set(Object.keys(NODES));
  for (const k of open) {
    d[k] = Infinity;
    prev[k] = null;
  }
  d[from] = 0;
  while (open.size) {
    let u = "";
    let ud = Infinity;
    for (const k of open)
      if (d[k] < ud) {
        ud = d[k];
        u = k;
      }
    if (!u || u === to) break;
    open.delete(u);
    for (const [a, b] of EDGES) {
      const v = a === u ? b : b === u ? a : null;
      if (!v || !open.has(v)) continue;
      const nd = d[u] + dist(NODES[u], NODES[v]);
      if (nd < d[v]) {
        d[v] = nd;
        prev[v] = u;
      }
    }
  }
  const out: string[] = [];
  for (let k: string | null = to; k; k = prev[k]) out.unshift(k);
  return out[0] === from ? out : [from, to];
}

/**
 * Waypoints from one spot to another along the paths (the destination is the last point).
 * `side` nudges a walker to one side of the path so two people can walk side by side.
 */
export function route(from: XZ, to: XZ, side = 0): XZ[] {
  // Short hops (inside the gazebo, off the boat) go straight.
  if (dist(from, to) < 2.6) return [to];
  const a = nearestNode(from);
  const b = nearestNode(to);
  if (a === b) return [to];
  const names = shortest(a, b);
  const pts = names.map((n) => NODES[n]);
  // Don't walk backwards to a node that is behind us, or past the destination.
  if (pts.length >= 2 && dist(from, pts[1]) < dist(pts[0], pts[1])) pts.shift();
  if (pts.length >= 2 && dist(pts[pts.length - 2], to) < dist(pts[pts.length - 2], pts[pts.length - 1])) pts.pop();
  const out: XZ[] = pts.map((p, i) => {
    if (!side) return p;
    const prev = i === 0 ? from : pts[i - 1];
    const next = i === pts.length - 1 ? to : pts[i + 1];
    const dx = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const l = Math.hypot(dx, dz) || 1;
    return [p[0] - (dz / l) * side, p[1] + (dx / l) * side];
  });
  out.push(to);
  return out;
}

export function routeLength(from: XZ, to: XZ) {
  const pts = route(from, to);
  let len = 0;
  let cur = from;
  for (const p of pts) {
    len += dist(cur, p);
    cur = p;
  }
  return len;
}

/** Distance from a point to the nearest path. */
export function distanceToPath(x: number, z: number) {
  let best = Infinity;
  for (const [a, b] of SEGMENTS) {
    const vx = b[0] - a[0];
    const vz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz)));
    const d = Math.hypot(x - (a[0] + vx * t), z - (a[1] + vz * t));
    if (d < best) best = d;
  }
  return best;
}
