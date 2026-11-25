"use client";

import { useEffect, useRef } from "react";

/* Procedural bird silhouettes on a canvas.
   Each bird has a jointed wing (arm + hand) seen in light 3/4 perspective from below:
   the hand lags the arm and folds on the upstroke, the body bobs with each beat, and
   birds alternate bursts of flapping with glides — climbing while they beat, sinking while
   they glide, pitching with the climb. Flocks drift loosely; egrets cruise slow and steady. */

type Kind = "small" | "egret";
type Bird = {
  ox: number; oy: number;             // slot within the flock (px)
  wa: number; wf: number; wp: number; // wander amplitude / frequency / phase
  size: number; freq: number; amp: number;
  phase: number; glide: number;       // wing phase, glide blend 0..1
  gliding: boolean; timer: number;    // current state + time left in it
  alt: number; vAlt: number;          // altitude drift from flap/glide
  px: number; py: number;             // previous screen position (for pitch)
  shade: number;                      // 0 = full ink, 1 = paper (atmospheric depth)
  yaw: number;                        // slant of flight relative to the screen
};
type Flock = { kind: Kind; x: number; y: number; dir: 1 | -1; speed: number; t: number; drift: number; birds: Bird[] };

const TAU = Math.PI * 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const TILT = 0.38; // camera sits a little below the birds

function hex(c: string): [number, number, number] {
  const m = c.trim().replace("#", "");
  const n = parseInt(m.length === 3 ? m.replace(/./g, "$&$&") : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeFlock(kind: Kind, W: number, H: number, mobile: boolean, initial: boolean): Flock {
  const dir: 1 | -1 = kind === "egret" || Math.random() < 0.8 ? 1 : -1;
  const n = kind === "egret" ? 2 : Math.round(rnd(mobile ? 2 : 3, mobile ? 4 : 6));
  const depth = rnd(0, 1);
  const base = kind === "egret" ? rnd(30, 38) : rnd(16, 22) * (1 - depth * 0.35);
  const scale = mobile ? 0.75 : 1;
  const birds: Bird[] = Array.from({ length: n }, (_, i) => {
    const size = base * rnd(0.88, 1.1) * scale;
    return {
      ox: kind === "egret" ? -i * rnd(55, 75) : rnd(-90, 90) * scale,
      oy: kind === "egret" ? i * rnd(10, 22) : rnd(-34, 34) * scale,
      wa: kind === "egret" ? rnd(2, 5) : rnd(5, 14), wf: rnd(0.15, 0.4), wp: rnd(0, TAU),
      size,
      freq: kind === "egret" ? rnd(2.0, 2.5) : rnd(3.6, 5.2),
      amp: kind === "egret" ? rnd(0.75, 0.9) : rnd(0.85, 1.05),
      phase: rnd(0, TAU), glide: 0, gliding: Math.random() < 0.3,
      timer: rnd(0.2, 1.5), alt: 0, vAlt: 0, px: NaN, py: NaN,
      shade: kind === "egret" ? 0.1 : 0.05 + depth * 0.35,
      yaw: kind === "egret" ? rnd(0.45, 0.6) : rnd(0.8, 1.05) * (Math.random() < 0.5 ? 1 : -1),
    };
  });
  const span = 140;
  const startX = initial ? rnd(0.05, 0.9) * W : dir === 1 ? -span - rnd(0, 300) : W + span + rnd(0, 300);
  return {
    kind, dir, birds, t: rnd(0, 100), drift: rnd(-6, 6),
    speed: (kind === "egret" ? rnd(34, 46) : rnd(52, 78)) * (1 - depth * 0.25) * (mobile ? 0.8 : 1),
    x: startX, y: rnd(0.08, kind === "egret" ? 0.4 : 0.55) * H,
  };
}

function step(b: Bird, kind: Kind, dt: number) {
  b.timer -= dt;
  if (b.timer <= 0) {
    b.gliding = !b.gliding;
    if (kind === "egret") b.timer = b.gliding ? rnd(0.6, 1.4) : rnd(3, 7);
    else b.timer = b.gliding ? rnd(0.5, 1.8) : (Math.round(rnd(3, 8)) / b.freq);
  }
  b.glide += ((b.gliding ? 1 : 0) - b.glide) * Math.min(1, dt * 5);
  // wings keep beating through the blend, then settle
  b.phase = (b.phase + TAU * b.freq * dt * (1 - b.glide * 0.92)) % TAU;
  // climb while flapping, sink gently while gliding
  const targetV = b.gliding ? 9 : -5;
  b.vAlt += (targetV - b.vAlt) * Math.min(1, dt * 1.5);
  b.alt = Math.max(-40, Math.min(40, b.alt + b.vAlt * dt));
}

// Bird space: x forward, y up, z along the right wing. Each bird is yawed so it flies at a slant
// across the sky (wings spread across the screen, body foreshortened), then seen from a little below.
let yc = 1, ys = 0;
const P = (x: number, y: number, z: number): [number, number] => {
  const sx = x * yc - z * ys, depth = x * ys + z * yc;
  return [sx, -(y * Math.cos(TILT) + depth * Math.sin(TILT))];
};

function wingPath(ctx: CanvasRenderingContext2D, side: 1 | -1, b: Bird, kind: Kind) {
  const s = Math.sin(b.phase), c = Math.cos(b.phase);
  const glideArm = kind === "egret" ? 0.02 : 0.12, glideHand = kind === "egret" ? -0.08 : -0.05;
  const up = Math.max(0, c) * (1 - b.glide);                    // upstroke: hand folds in
  const arm = (s * b.amp + 0.12) * (1 - b.glide) + glideArm * b.glide;
  const hand = arm + (Math.sin(b.phase - 0.7) * b.amp * 0.55) * (1 - b.glide) + glideHand * b.glide;
  const L1 = kind === "egret" ? 0.48 : 0.42;
  const L2 = (kind === "egret" ? 0.58 : 0.62) * (1 - up * 0.45);
  const sweep = (kind === "egret" ? 0.12 : 0.22) + up * 0.28;
  const chord = kind === "egret" ? 0.4 : 0.34;

  const ey = Math.sin(arm) * L1, ez = Math.cos(arm) * L1 * side;
  const ty = ey + Math.sin(hand) * L2, tz = ez + Math.cos(hand) * L2 * side;

  const sF = P(0.12, 0, 0), sB = P(0.12 - chord, 0, 0);
  const eF = P(0.06, ey, ez), eB = P(0.06 - chord * 0.95, ey, ez);
  const t = P(-sweep, ty, tz);
  const hB = P(-sweep * 0.55 - chord * (kind === "egret" ? 0.85 : 0.55), (ey + ty) / 2, (ez + tz) / 2);

  ctx.beginPath();
  ctx.moveTo(...sF);
  ctx.quadraticCurveTo((sF[0] + eF[0]) / 2 + 0.02, (sF[1] + eF[1]) / 2 - 0.03 * side, ...eF);
  ctx.quadraticCurveTo((eF[0] + t[0]) / 2 + 0.04, (eF[1] + t[1]) / 2, ...t);  // leading edge of the hand
  ctx.quadraticCurveTo(hB[0], hB[1], ...eB);                                   // primaries trail back
  ctx.quadraticCurveTo((eB[0] + sB[0]) / 2, (eB[1] + sB[1]) / 2 + 0.02, ...sB);
  ctx.closePath();
  ctx.fill();
}

function bodyPath(ctx: CanvasRenderingContext2D, kind: Kind) {
  const m = (x: number, y: number) => ctx.moveTo(...P(x, -y, 0));
  const l = (x: number, y: number) => ctx.lineTo(...P(x, -y, 0));
  const q = (cx: number, cy: number, x: number, y: number) => ctx.quadraticCurveTo(...P(cx, -cy, 0), ...P(x, -y, 0));
  ctx.beginPath();
  if (kind === "egret") {
    // folded S-neck, slim body, legs trailing past the tail
    m(0.62, -0.02); l(0.42, -0.05); q(0.34, -0.08, 0.3, -0.03); q(0.26, 0.06, 0.16, 0.02);
    q(-0.1, -0.06, -0.34, 0.0); l(-0.42, 0.03); q(-0.1, 0.09, 0.14, 0.08); q(0.3, 0.1, 0.36, 0.0); l(0.42, -0.01);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); m(-0.3, 0.03); l(-0.8, 0.07); l(-0.8, 0.095); l(-0.3, 0.065); ctx.closePath(); ctx.fill();
  } else {
    // rounded head, tapering body, forked tail
    m(0.36, 0.0); q(0.34, -0.08, 0.22, -0.075); q(0.0, -0.085, -0.22, -0.03); l(-0.52, -0.08); l(-0.38, 0.0);
    l(-0.54, 0.07); l(-0.22, 0.035); q(0.05, 0.09, 0.24, 0.06); q(0.35, 0.045, 0.36, 0.0);
    ctx.closePath(); ctx.fill();
  }
  // a touch of body volume seen from below
  ctx.beginPath(); ctx.ellipse(...P(0.02, 0, 0), Math.max(0.06, 0.22 * Math.abs(yc)), 0.075, 0, 0, TAU); ctx.fill();
}

export function FooterBirds() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const ink = hex(styles.getPropertyValue("--green") || "#1d3125");
    const paper = hex(styles.getPropertyValue("--paper") || "#f3efe4");
    const colour = (k: number) => `rgb(${ink.map((v, i) => Math.round(v + (paper[i] - v) * k)).join(",")})`;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, flocks: Flock[] = [], raf = 0, last = 0, visible = false;

    const seed = () => {
      const mobile = W < 700;
      flocks = Array.from({ length: mobile ? 2 : 3 }, () => makeFlock("small", W, H, mobile, true));
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      const first = W === 0;
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (first) seed();
      if (still) draw(0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, W, H);
      const dpr = canvas.width / (W || 1);
      flocks.forEach((f, fi) => {
        f.t += dt;
        f.x += f.speed * f.dir * dt;
        const fy = f.y + Math.sin(f.t * 0.23) * 14 + Math.sin(f.t * 0.61 + 1) * 6 + f.drift * f.t * 0.05;

        // sort far-to-near so lighter, distant birds sit behind
        [...f.birds].sort((a, b) => b.shade - a.shade).forEach(b => {
          if (!still) step(b, f.kind, dt); else { b.glide = 1; }
          const w = Math.sin(f.t * b.wf * TAU + b.wp);
          const x = f.x + b.ox * f.dir + Math.cos(f.t * b.wf * 4.1 + b.wp) * b.wa * 0.6;
          const bob = Math.cos(b.phase) * b.size * 0.07 * (1 - b.glide);        // lift on each downstroke
          const y = fy + b.oy + w * b.wa + b.alt + bob;
          const vy = Number.isNaN(b.py) || dt === 0 ? 0 : (y - b.py) / dt;
          b.px = x; b.py = y;
          const pitch = Math.max(-0.28, Math.min(0.28, Math.atan2(vy, f.speed))) * f.dir;

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(x, y);
          ctx.rotate(pitch);
          ctx.scale(b.size * f.dir, b.size);
          yc = Math.cos(b.yaw); ys = Math.sin(b.yaw);
          const far: 1 | -1 = b.yaw > 0 ? 1 : -1;                              // the wing turned away from us
          ctx.fillStyle = colour(b.shade + 0.16);
          wingPath(ctx, far, b, f.kind);
          ctx.fillStyle = colour(b.shade);
          bodyPath(ctx, f.kind);
          wingPath(ctx, (-far) as 1 | -1, b, f.kind);
        });

        const reach = 160;
        const gone = f.dir === 1 ? f.x - reach > W : f.x + reach < 0;
        if (gone) flocks[fi] = makeFlock(f.kind, W, H, W < 700, false);
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      draw(dt);
      if (visible) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !still) { last = 0; raf = requestAnimationFrame(loop); }
    });
    io.observe(canvas);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <canvas ref={ref} className="footer-birds" aria-hidden="true" />;
}
