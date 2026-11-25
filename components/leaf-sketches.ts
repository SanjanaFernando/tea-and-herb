/**
 * Hand-sketched line drawings for the process section, as plain 3D polylines.
 * No three.js here — the WebGL leaf and the reduced-motion SVG fallback both read these.
 * Units: one object is roughly 2.5 units tall; +y is up.
 */
export type V3 = [number, number, number];
export type Stroke = { pts: V3[]; gold?: boolean };
export type Drawing = Stroke[];
export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };

export const STEPS = 5;
export const SPACING = 4; // world units between step objects on the fall column
export const LEAF_SCALE = 0.85;
export const center = (k: number): V3 => [0, -k * SPACING, 0];

// ── tiny deterministic helpers ─────────────────────────────────────────────
function rng(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Subdivide a polyline so the GPU wobble has vertices to push around. */
function dense(pts: V3[], step = 0.05): V3[] {
  const out: V3[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / step));
    for (let j = 1; j <= n; j++) out.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n), lerp(a[2], b[2], j / n)]);
  }
  return out;
}
const S = (pts: V3[], gold?: boolean): Stroke => ({ pts: dense(pts), gold });

function quad(a: V3, c: V3, b: V3, n = 16): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]] as V3; });
}
/** Ellipse arc. `plane` "xy" faces the camera, "xz" lies flat (seen edge-on until tilted). */
function arc(c: V3, rx: number, ry: number, plane: "xy" | "xz" = "xy", a0 = 0, a1 = TAU, n = 48): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / n), u = Math.cos(a) * rx, w = Math.sin(a) * ry;
    return (plane === "xy" ? [c[0] + u, c[1] + w, c[2]] : [c[0] + u, c[1], c[2] + w]) as V3;
  });
}
/** A dashed straight line, as separate short strokes. */
function dashes(a: V3, b: V3, dash = 0.07, gap = 0.06, gold = true): Stroke[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), out: Stroke[] = [];
  for (let d = 0; d < len; d += dash + gap) {
    const t0 = d / len, t1 = Math.min(1, (d + dash) / len);
    out.push({ pts: [[lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0)], [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), lerp(a[2], b[2], t1)]], gold });
  }
  return out;
}
/** Dots along any polyline (for routes). */
function dotted(pts: V3[], every = 0.09, gold = true): Stroke[] {
  const out: Stroke[] = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    acc += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (acc >= every) { acc = 0; out.push({ pts: [a, [lerp(a[0], b[0], 0.45), lerp(a[1], b[1], 0.45), lerp(a[2], b[2], 0.45)]], gold }); }
  }
  return out;
}
/** Short parallel hatching strokes along one side of a shape: the "shadow side". */
function hatch(from: V3, to: V3, count: number, len: number, angle: number, jitter = 0.25, seed = 1): Stroke[] {
  const r = rng(seed), dx = Math.cos(angle) * len, dy = Math.sin(angle) * len;
  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1), l = 1 - jitter + r() * jitter * 2;
    const p: V3 = [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
    return { pts: [p, [p[0] + dx * l, p[1] + dy * l, p[2]]] };
  });
}

type Xf = { s?: number; rx?: number; ry?: number; rz?: number; t?: V3 };
/** Scale, rotate (x, then y, then z), then translate — matches a three.js Euler with order "ZYX". */
export function xfPoint(p: V3, { s = 1, rx = 0, ry = 0, rz = 0, t = [0, 0, 0] }: Xf): V3 {
  let [x, y, z] = [p[0] * s, p[1] * s, p[2] * s];
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  return [x + t[0], y + t[1], z + t[2]];
}
const xf = (d: Drawing, o: Xf): Drawing => d.map((s) => ({ ...s, pts: s.pts.map((p) => xfPoint(p, o)) }));

// ── the tea leaf ───────────────────────────────────────────────────────────
const LEN = 1.1, WID = 0.46;
const halfW = (s: number) => (WID / 2) * Math.pow(Math.sin(Math.PI * clamp01(s)), 0.78) * (1 - 0.2 * s);
const leafY = (s: number) => -LEN / 2 + s * LEN;
/** Slightly cupped across the blade, arched along it. */
const leafZ = (x: number, s: number) => 1.7 * x * x - 0.28 * (s - 0.52) ** 2;

/** A Ceylon tea leaf: elliptic, acute tip, serrated margin, midrib + 7 pairs of curving veins. */
export function leafDrawing(): Drawing {
  const n = 90, right: V3[] = [], left: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const tooth = s > 0.1 && s < 0.95 ? ((s * 24) % 1) * 0.016 : 0; // sawtooth teeth leaning to the tip
    const w = halfW(s) + tooth;
    right.push([w, leafY(s), leafZ(w, s)]);
    left.push([-w, leafY(s), leafZ(w, s)]);
  }
  const outline: Stroke = { pts: [...right, ...left.reverse()] };
  const petiole = S([[0, leafY(0), 0], [0.012, leafY(0) - 0.08, -0.01], [0.03, leafY(0) - 0.16, -0.02]]);
  const midrib: Stroke = { pts: Array.from({ length: 30 }, (_, i) => { const s = i / 29; const x = 0.014 * Math.sin(Math.PI * s); return [x, leafY(s), leafZ(x, s) + 0.004] as V3; }), gold: true };
  const veins: Stroke[] = [];
  for (let i = 0; i < 7; i++) {
    const s0 = 0.14 + i * 0.105, s1 = Math.min(0.97, s0 + 0.11);
    for (const side of [1, -1]) {
      const ex = side * halfW(s1) * 0.86;
      veins.push({ pts: quad([0, leafY(s0), leafZ(0, s0)], [ex * 0.45, leafY(s0) + 0.035, leafZ(ex * 0.45, s0)], [ex, leafY(s1), leafZ(ex, s1)], 10) });
    }
  }
  // Shadow side (left): short strokes slanting off the margin.
  const hatchStrokes: Stroke[] = [];
  for (let s = 0.2; s < 0.86; s += 0.055) {
    const w = halfW(s);
    hatchStrokes.push({ pts: [[-w * 0.94, leafY(s), leafZ(w, s)], [-w * 0.66, leafY(s) + 0.035, leafZ(w * 0.66, s)]] });
  }
  return [outline, petiole, midrib, ...veins, ...hatchStrokes];
}

/** A rolled bud: two curves closing to a point, with a crease. */
function bud(t: V3, rz: number): Drawing {
  const d: Drawing = [
    S(quad([0, 0, 0], [0.09, 0.2, 0.02], [0, 0.42, 0])),
    S(quad([0, 0, 0], [-0.08, 0.2, 0.02], [0, 0.42, 0])),
    S(quad([0.01, 0.04, 0.01], [0.03, 0.2, 0.02], [0.004, 0.38, 0.01]), true),
  ];
  return xf(d, { rz, t });
}

// ── 01 BUSH: a sprig — "two leaves and a bud" ──────────────────────────────
const node1: V3 = [0.05, 0.42, 0], node2: V3 = [0.03, -0.02, 0], node3: V3 = [-0.06, -0.62, 0];
const dirOf = (rz: number): V3 => [-Math.sin(rz), Math.cos(rz), 0];
const along = (n: V3, rz: number, d: number): V3 => { const v = dirOf(rz); return [n[0] + v[0] * d, n[1] + v[1] * d, n[2]]; };
const SLOT_RZ_BUSH = -0.95;
const LEAF_HALF = (LEN / 2) * LEAF_SCALE;

function bushDrawing(): Drawing {
  const stem = S(quad([-0.14, -1.35, 0], [0.12, -0.3, 0], [0.02, 1.0, 0]));
  const stem2 = S(quad([-0.11, -1.35, 0], [0.15, -0.3, 0], [0.04, 0.98, 0])); // the stem has width
  const l1rz = 0.9, l3rz = 2.2;
  const gap = 0.16;
  return [
    stem, stem2,
    ...bud([0.03, 0.98, 0], -0.08),
    ...xf(leafDrawing(), { s: LEAF_SCALE * 0.9, rz: l1rz, t: along(node1, l1rz, gap + LEAF_HALF * 0.9) }),
    ...dashes(node1, along(node1, l1rz, gap), 0.04, 0.035),
    ...dashes(node2, along(node2, SLOT_RZ_BUSH, gap), 0.04, 0.035), // where the falling leaf joins
    ...xf(leafDrawing(), { s: LEAF_SCALE * 1.15, rz: l3rz, t: along(node3, l3rz, gap + LEAF_HALF * 1.15) }),
    ...dashes(node3, along(node3, l3rz, gap), 0.04, 0.035),
    ...hatch([0.16, -1.2, 0], [0.12, 0.5, 0], 12, 0.08, -0.5, 0.3, 3),
    ...dashes([0.02, -1.55, 0], [0.02, 1.5, 0], 0.05, 0.09),
  ];
}

// ── 02 TASTE: exploded tasting cup, lid, saucer and spoon ──────────────────
const TILT = 0.42; // tip flat circles toward the camera so they read as ellipses

function tasteDrawing(): Drawing {
  const cupProfile = (side: number) => S(quad([side * 0.6, 0.12, 0], [side * 0.66, -0.3, 0], [side * 0.34, -0.5, 0]));
  const d: Drawing = [
    // saucer
    S(arc([0, -1.0, 0], 1.0, 1.0, "xz")), S(arc([0, -0.97, 0], 0.56, 0.56, "xz")), S(arc([0, -1.1, 0], 0.62, 0.62, "xz", 0, Math.PI)),
    // cup
    S(arc([0, 0.12, 0], 0.6, 0.6, "xz")), S(arc([0, 0.09, 0], 0.55, 0.55, "xz")), cupProfile(1), cupProfile(-1), S(arc([0, -0.5, 0], 0.34, 0.34, "xz", 0, Math.PI)),
    // liquor surface (gold)
    { ...S(arc([0, 0.0, 0], 0.5, 0.5, "xz")), gold: true },
    // handle
    S(quad([0.62, 0.0, 0], [1.02, -0.06, 0], [0.56, -0.32, 0])), S(quad([0.62, -0.06, 0], [0.88, -0.1, 0], [0.58, -0.26, 0])),
    // serrated tasting notch on the rim
    S([[-0.22, 0.12, 0.56], [-0.17, 0.08, 0.57], [-0.12, 0.12, 0.58], [-0.07, 0.08, 0.59], [-0.02, 0.12, 0.6]]),
    // lid, lifted off (exploded)
    S(arc([0, 0.9, 0], 0.62, 0.62, "xz")), S(arc([0, 0.95, 0], 0.5, 0.5, "xz", Math.PI, TAU)), S(quad([-0.62, 0.9, 0], [-0.3, 1.08, 0], [-0.1, 1.08, 0])), S(quad([0.62, 0.9, 0], [0.3, 1.08, 0], [0.1, 1.08, 0])),
    S(arc([0, 1.16, 0], 0.1, 0.1, "xz")), S([[-0.1, 1.08, 0], [-0.1, 1.16, 0]]), S([[0.1, 1.08, 0], [0.1, 1.16, 0]]),
    ...hatch([0.5, -0.05, 0.05], [0.33, -0.42, 0.05], 8, 0.11, -0.25, 0.3, 5),
    ...hatch([0.7, -1.04, 0.3], [0.3, -1.06, 0.8], 7, 0.08, -0.9, 0.3, 7),
    ...dashes([0, -1.45, 0], [0, 1.45, 0], 0.05, 0.09),
  ];
  const spoon: Drawing = [S(arc([0, 0, 0], 0.11, 0.17)), S(quad([0, -0.17, 0], [0.01, -0.5, 0], [0.03, -0.85, 0])), S(quad([0.025, -0.17, 0], [0.04, -0.5, 0], [0.05, -0.85, 0]))];
  return [...xf(d, { rx: TILT }), ...xf(spoon, { rz: -0.6, t: [-1.35, 0.25, 0.2] }), ...dashes([-0.95, -0.25, 0], [-0.55, -0.55, 0], 0.035, 0.035)];
}
const SLOT_TASTE: Pose = (() => { const p = xfPoint([0, 0.02, 0], { rx: TILT }); return { x: p[0], y: p[1], z: p[2] + 0.06, rx: -1.05, ry: 0, rz: 0.75 }; })();

// ── 03 BLEND: the leaf breaks up beside hibiscus, lemongrass and cinnamon ──
function blendDrawing(): Drawing {
  const petal: Drawing = [
    S(quad([0, -0.5, 0], [-0.62, 0.05, 0], [-0.32, 0.45, 0])), S(quad([-0.32, 0.45, 0], [0, 0.62, 0], [0.32, 0.45, 0])), S(quad([0.32, 0.45, 0], [0.62, 0.05, 0], [0, -0.5, 0])),
    ...[-0.32, -0.16, 0, 0.16, 0.32].map((x) => ({ ...S(quad([0, -0.45, 0], [x * 0.6, 0.0, 0], [x, 0.46, 0])), gold: true })),
    ...hatch([0.42, 0.25, 0], [0.18, -0.3, 0], 6, 0.09, -0.4, 0.3, 11),
  ];
  const blade = (bend: number, h: number): Stroke[] => [S(quad([0, 0, 0], [bend * 0.5, h * 0.5, 0], [bend, h, 0])), S(quad([0.06, 0, 0], [bend * 0.5 + 0.05, h * 0.5, 0], [bend, h, 0]))];
  const grass: Drawing = [...blade(0.25, 1.5), ...blade(-0.32, 1.25), ...blade(0.55, 1.05), S(arc([0.03, 0, 0], 0.09, 0.03)), ...hatch([0.08, 0.1, 0], [0.2, 0.9, 0], 6, 0.06, -0.3, 0.3, 13)];
  const stick: Drawing = [
    S([[0, 0.12, 0], [1.1, 0.12, 0]]), S([[0, -0.12, 0], [1.1, -0.12, 0]]), S(arc([0, 0, 0], 0.05, 0.12)),
    S(Array.from({ length: 34 }, (_, i) => { const a = i / 33 * TAU * 1.6, r = 0.11 * (1 - i / 40); return [1.1 + Math.cos(a) * r * 0.45, Math.sin(a) * r, 0] as V3; })),
    S([[0.15, 0.02, 0], [0.9, 0.03, 0]]), ...hatch([0.15, -0.1, 0], [1.0, -0.1, 0], 9, 0.06, 1.2, 0.3, 17),
  ];
  const ring = arc([0, 0, 0], 0.95, 0.95, "xy", 0, TAU, 120);
  return [
    ...xf(petal, { s: 0.85, rz: 0.4, t: [-1.35, 0.65, 0] }),
    ...xf(grass, { s: 0.9, rz: -0.15, t: [1.2, -0.75, 0] }),
    ...xf(stick, { s: 0.95, rz: 0.22, t: [-1.65, -1.05, 0] }),
    ...dotted(ring, 0.07),
  ];
}

// ── 04 PACK: tea bag → pouch → tin, exploded along one axis ────────────────
const BAG_X = -1.5;
function packDrawing(): Drawing {
  const rect = (x: number, y: number, w: number, h: number): Stroke => S([[x - w / 2, y - h / 2, 0], [x + w / 2, y - h / 2, 0], [x + w / 2, y + h / 2, 0], [x - w / 2, y + h / 2, 0], [x - w / 2, y - h / 2, 0]]);
  const bag: Drawing = [
    rect(BAG_X, -0.05, 0.62, 0.78), ...dashes([BAG_X - 0.25, 0.26, 0], [BAG_X + 0.25, 0.26, 0], 0.03, 0.03, false), ...dashes([BAG_X - 0.25, -0.36, 0], [BAG_X + 0.25, -0.36, 0], 0.03, 0.03, false),
    S(quad([BAG_X, 0.34, 0], [BAG_X + 0.08, 0.6, 0], [BAG_X - 0.02, 0.8, 0])), rect(BAG_X - 0.02, 0.9, 0.24, 0.18), { ...S([[BAG_X - 0.1, 0.9, 0], [BAG_X + 0.06, 0.9, 0]]), gold: true },
    ...hatch([BAG_X + 0.3, 0.3, 0], [BAG_X + 0.3, -0.4, 0], 8, 0.07, Math.PI * 0.8, 0.3, 19),
  ];
  const pouch: Drawing = [
    S([[-0.36, 0.55, 0], [0.36, 0.55, 0]]), S(quad([0.36, 0.55, 0], [0.42, -0.1, 0], [0.4, -0.55, 0])), S(quad([-0.36, 0.55, 0], [-0.42, -0.1, 0], [-0.4, -0.55, 0])),
    S(quad([-0.4, -0.55, 0], [0, -0.68, 0.1], [0.4, -0.55, 0])), S(quad([-0.36, -0.46, 0], [0, -0.38, 0.05], [0.36, -0.46, 0])),
    { ...S([[-0.34, 0.4, 0], [0.34, 0.4, 0]]), gold: true }, S([[0.28, 0.55, 0], [0.32, 0.48, 0]]),
    S([[-0.22, 0.12, 0], [0.22, 0.12, 0], [0.22, -0.2, 0], [-0.22, -0.2, 0], [-0.22, 0.12, 0]]), S(quad([-0.12, -0.05, 0], [0, 0.06, 0], [0.12, -0.05, 0])),
    ...hatch([0.38, 0.35, 0], [0.38, -0.4, 0], 9, 0.07, Math.PI * 0.82, 0.3, 23),
  ];
  const tinR = 0.38, tx = 1.5;
  const tin: Drawing = xf([
    S(arc([0, -0.55, 0], tinR, tinR, "xz")), S(arc([0, 0.25, 0], tinR, tinR, "xz")), S([[tinR, -0.55, 0], [tinR, 0.25, 0]]), S([[-tinR, -0.55, 0], [-tinR, 0.25, 0]]),
    { ...S(arc([0, -0.05, 0], tinR + 0.005, tinR + 0.005, "xz", 0, Math.PI)), gold: true },
    // lid, lifted
    S(arc([0, 0.52, 0], tinR + 0.03, tinR + 0.03, "xz")), S(arc([0, 0.66, 0], tinR + 0.03, tinR + 0.03, "xz")), S([[tinR + 0.03, 0.52, 0], [tinR + 0.03, 0.66, 0]]), S([[-tinR - 0.03, 0.52, 0], [-tinR - 0.03, 0.66, 0]]),
    ...dashes([0, 0.27, 0], [0, 0.5, 0], 0.03, 0.03),
    ...hatch([tinR - 0.03, 0.2, 0.05], [tinR - 0.03, -0.5, 0.05], 8, 0.1, Math.PI * 0.85, 0.3, 29),
  ], { rx: TILT, t: [tx, -0.05, 0] });
  return [...bag, ...dashes([-2.2, -0.05, 0], [2.2, -0.05, 0], 0.06, 0.08), ...pouch, ...tin];
}
/** Where the blend particles settle: inside the tea bag. */
export function packTargets(count: number): V3[] {
  const r = rng(41);
  return Array.from({ length: count }, () => [BAG_X + (r() - 0.5) * 0.5, -0.05 + (r() - 0.5) * 0.56, (r() - 0.5) * 0.05]);
}

// ── 05 SHIP: container, dotted route, globe ────────────────────────────────
function shipDrawing(): Drawing {
  const w = 1.35, h = 0.56, dz = 0.56;
  const box: V3[][] = [];
  const f = (x: number, y: number, z: number): V3 => [x - w / 2, y - h / 2, z - dz / 2];
  const edges: [V3, V3][] = [
    [f(0, 0, dz), f(w, 0, dz)], [f(w, 0, dz), f(w, h, dz)], [f(w, h, dz), f(0, h, dz)], [f(0, h, dz), f(0, 0, dz)],
    [f(0, h, 0), f(w, h, 0)], [f(w, h, 0), f(w, 0, 0)], [f(0, h, dz), f(0, h, 0)], [f(w, h, dz), f(w, h, 0)], [f(w, 0, dz), f(w, 0, 0)],
  ];
  edges.forEach(([a, b]) => box.push([a, b]));
  for (let x = 0.08; x < w - 0.04; x += 0.075) box.push([f(x, 0.04, dz), f(x, h - 0.04, dz)]);
  const doors: V3[][] = [0.12, 0.24, 0.36, 0.48].map((z) => [f(w, 0.05, z), f(w, h - 0.05, z)]);
  const container: Drawing = xf([...box.map((p) => S(p)), ...doors.map((p) => ({ ...S(p), gold: true }))], { rx: 0.3, ry: -0.55, t: [-1.25, -0.75, 0] });

  const R = 0.72, gc: V3 = [1.3, 0.42, 0];
  const meridians: Drawing = [0.35, 1.05, 1.75, 2.45].map((a) => S(Array.from({ length: 61 }, (_, i) => { const th = (i / 60) * TAU; return [R * Math.sin(th) * Math.cos(a), R * Math.cos(th), R * Math.sin(th) * Math.sin(a)] as V3; })));
  const parallels: Drawing = [-0.45, 0, 0.45].map((y) => S(arc([0, y * R, 0], R * Math.sqrt(1 - y * y), R * Math.sqrt(1 - y * y), "xz")));
  const globe: Drawing = [...xf([...meridians, ...parallels], { rx: 0.35, t: gc }), S(arc(gc, R, R, "xy", 0, TAU, 72)), ...hatch([gc[0] + R * 0.6, gc[1] + R * 0.5, 0], [gc[0] + R * 0.55, gc[1] - R * 0.55, 0], 8, 0.12, Math.PI * 0.9, 0.3, 31)];
  // Sri Lanka, roughly — a gold tick mark on the globe
  const lk = xfPoint([R * 0.25, -0.05, R * 0.9], { rx: 0.35, t: gc });
  const mark: Drawing = [{ pts: [[lk[0] - 0.05, lk[1], lk[2]], [lk[0] + 0.05, lk[1], lk[2]]], gold: true }, { pts: [[lk[0], lk[1] - 0.05, lk[2]], [lk[0], lk[1] + 0.05, lk[2]]], gold: true }];
  const route = dotted(quad([-0.75, -0.25, 0.2], [-0.1, 1.45, 0.3], [lk[0] - 0.02, lk[1] + 0.03, lk[2]], 80), 0.06);
  return [...container, ...route, ...globe, ...mark, ...dashes([-2.2, -1.25, 0], [2.2, -1.25, 0], 0.06, 0.08)];
}

let cache: Drawing[] | null = null;
/** One drawing per step, in local coordinates around that step's centre. */
export function stepDrawings(): Drawing[] {
  return (cache ??= [bushDrawing(), tasteDrawing(), blendDrawing(), packDrawing(), shipDrawing()]);
}

// ── the leaf's fall ─────────────────────────────────────────────────────────
const SWING = 0.95;
const slots: (Pose | null)[] = [
  (() => { const c = along(node2, SLOT_RZ_BUSH, 0.16 + LEAF_HALF); return { x: c[0], y: c[1], z: 0, rx: 0, ry: 0, rz: SLOT_RZ_BUSH }; })(),
  SLOT_TASTE,
  { x: 0, y: 0, z: 0.1, rx: 0.2, ry: 0, rz: 0.35 },
  null, null,
];

/** Base fall height for progress p: slows almost to a stop as it passes each step's object. */
export function fallY(p: number) {
  const f = clamp01(p) * STEPS, k = Math.min(STEPS - 1, Math.floor(f)), t = f - k, u = t * 2 - 1;
  const e = 0.5 + 0.5 * (0.3 * u + 0.7 * u * u * u);
  return lerp(SPACING / 2, -SPACING / 2, e) - k * SPACING;
}

/** Where the leaf is, and how it is turned, at scroll progress p (0..1). */
export function leafPose(p: number): Pose & { dwell: number } {
  const f = clamp01(p) * STEPS, k = Math.min(STEPS - 1, Math.floor(f)), t = f - k;
  const dwell = smooth(0.24, 0.42, t) * (1 - smooth(0.66, 0.84, t));
  const phase = Math.PI * f; // = p·π·5
  const free = 1 - dwell;
  const flip = 0.5 * smooth(0, 0.3, t) + 0.5 * smooth(0.74, 1, t);
  const pose: Pose = {
    x: -Math.cos(phase) * SWING * free,       // pendulum swing, centred while it rests on an object
    y: fallY(p),
    z: 0.15 * Math.sin(phase * 0.5),
    rx: 0.35 * Math.sin(phase * 1.3) * free,
    ry: TAU * (k + flip) - Math.PI,           // one turn per step, facing front at rest
    rz: (35 * Math.PI / 180) * Math.sin(phase) * free,
  };
  const slot = slots[k];
  if (slot) {
    const c = center(k);
    pose.x = lerp(pose.x, c[0] + slot.x, dwell); pose.y = lerp(pose.y, c[1] + slot.y, dwell); pose.z = lerp(pose.z, slot.z, dwell);
    pose.rx = lerp(pose.rx, slot.rx, dwell); pose.rz = lerp(pose.rz, slot.rz, dwell);
  }
  return { ...pose, dwell };
}

/** Per-step timings for opacity / draw-on, from scroll progress. All values 0..1. */
export function stepState(p: number, k: number) {
  const t = clamp01(p) * STEPS - k;
  const last = k === STEPS - 1;
  return {
    t,
    opacity: smooth(-0.18, 0.18, t) * (last ? 1 : 1 - smooth(0.8, 1.02, t)),
    draw: smooth(0.1, 0.56, t),
  };
}

/** Leaf / particle visibility through the story. */
export function leafState(p: number) {
  const f = clamp01(p) * STEPS;
  const t2 = f - 2, t3 = f - 3, t4 = f - 4;
  return {
    leaf: f < 2 ? 1 : f < 3 ? 1 - smooth(0.36, 0.5, t2) : f < 4 ? 0 : smooth(0.6, 0.8, t4),
    particles: f < 2 ? 0 : f < 3 ? smooth(0.34, 0.46, t2) : f < 4 ? 1 - smooth(0.55, 0.85, t3) : 0,
    scatter: f < 3 ? smooth(0.36, 0.8, t2) : 1,
    gather: f < 3 ? 0 : smooth(0.02, 0.5, t3),
    rest: smooth(0.7, 1, t4), // settling onto the CTA
  };
}

/** Random scatter offsets for the blend particles, leaf-shaped. */
export function particleOffsets(count: number): V3[] {
  const r = rng(7);
  return Array.from({ length: count }, () => {
    const s = r(), side = r() < 0.5 ? -1 : 1, w = halfW(s) * r() * side;
    return [w * LEAF_SCALE, leafY(s) * LEAF_SCALE, (r() - 0.5) * 0.1];
  });
}

/** Project a drawing to an SVG path (orthographic, y flipped). Used by the reduced-motion fallback. */
export function toSvgPath(d: Drawing, gold: boolean) {
  return d.filter((s) => !!s.gold === gold).map((s) => "M" + s.pts.map((p) => `${p[0].toFixed(3)} ${(-p[1]).toFixed(3)}`).join("L")).join("");
}

/** A step's drawing with the leaf already in place (for the static fallback). */
export function staticDrawing(k: number): Drawing {
  const d = stepDrawings()[k], slot = slots[k];
  return slot && k < 2 ? [...d, ...xf(leafDrawing(), { s: LEAF_SCALE, rx: slot.rx, rz: slot.rz, t: [slot.x, slot.y, slot.z] })] : d;
}

/**
 * How the stage is framed for a w×h canvas: camera distance, px per world unit at z=0, where the
 * optical centre sits (right of the copy on desktop, the top 55% on phones) and the view offset
 * that puts it there. Shared by the WebGL camera and the static fallback so both line up.
 */
export function stageFit(w: number, h: number, fov = 35) {
  const half = Math.tan((fov * Math.PI) / 360), mobile = w < 768, z = Math.max(mobile ? 8 : 8.8, 5.2 / (2 * half * (w / h)));
  return { z, u: h / (2 * z * half), cx: mobile ? 0.5 * w : 0.57 * w, cy: mobile ? 0.275 * h : 0.41 * h, ox: mobile ? 0 : -0.07 * w, oy: mobile ? 0.225 * h : 0.09 * h };
}
