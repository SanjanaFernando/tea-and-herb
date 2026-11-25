"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { BufferGeometry, Float32BufferAttribute, Group, LineSegments, PerspectiveCamera, Points, PointsMaterial, ShaderMaterial, Vector3 } from "three";
import {
  LEAF_SCALE, SPACING, STEPS, center, fallY, leafDrawing, leafPose, leafState, packTargets, particleOffsets, stageFit, stepDrawings, stepState, type Drawing,
} from "./leaf-sketches";

export type Anchor = { x: number; y: number; u: number; step: number };
type Props = {
  /** Scroll progress 0..1, written by the GSAP scrub. */
  progress: RefObject<number>;
  /** False while the section is off-screen: no frames are rendered. */
  active: boolean;
  /** Called each frame with the active object's screen position (px) and px-per-world-unit. */
  onAnchor?: (a: Anchor) => void;
  /** The leaf comes to rest on this element at the end of the story. */
  restOn?: RefObject<HTMLElement | null>;
};

// sRGB values straight to the screen: these materials skip three's colour management on purpose.
const INK = new Vector3(0xf3 / 255, 0xef / 255, 0xe4 / 255);
const GOLD = new Vector3(0xc9 / 255, 0xa4 / 255, 0x6a / 255);
const TAU = Math.PI * 2;
const DEG6 = (6 * Math.PI) / 180;
const PARTICLES = 260;
const TRAIL = 420;
/** The camera follows the fall at 92%: the leaf still drifts down the frame (step 01 sits a little
 *  high, step 05 a little low) while the page of drawings scrolls up past it. */
const camFor = (p: number) => 0.92 * fallY(p) + 0.6;

const NOISE = /* glsl */ `
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

/** Every line is drawn twice (aPass 0/1), each pass wobbling on its own — two strokes of a pen. */
function sketchMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uTick: { value: 0 }, uDraw: { value: 1 }, uOpacity: { value: 1 }, uWob: { value: 0.022 }, uInk: { value: INK }, uGold: { value: GOLD } },
    vertexShader: /* glsl */ `
      attribute float aProg; attribute float aPass; attribute float aGold;
      uniform float uTick, uWob;
      varying float vProg, vPass, vGold;
      ${NOISE}
      void main(){
        vec3 p = position;
        vec3 q = p * 3.2 + vec3(uTick * 1.7 + aPass * 13.1, uTick * 2.3, aPass * 7.7);
        p += (vec3(n3(q), n3(q + 19.1), n3(q + 41.3)) - 0.5) * uWob * (1.0 + aPass * 0.6);
        p.xy += aPass * vec2(0.011, -0.008);
        vProg = aProg; vPass = aPass; vGold = aGold;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk, uGold; uniform float uOpacity, uDraw;
      varying float vProg, vPass, vGold;
      void main(){
        // draw-on: the second pass trails the first a little, like going back over a line
        if (vProg > uDraw * 1.06 - vPass * 0.06 || uOpacity < 0.004) discard;
        gl_FragColor = vec4(mix(uInk, uGold, vGold), uOpacity * mix(0.95, 0.42, vPass));
      }`,
  });
}

/** Polylines → doubled line segments with a 0..1 "drawn so far" value along the pen path. */
function lineGeometry(d: Drawing) {
  let total = 0;
  for (const s of d) for (let i = 1; i < s.pts.length; i++) total += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1], s.pts[i][2] - s.pts[i - 1][2]);
  const pos: number[] = [], prog: number[] = [], pass: number[] = [], gold: number[] = [];
  for (const ps of [0, 1]) {
    let acc = 0;
    for (const s of d) for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1], b = s.pts[i];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      pos.push(...a, ...b); prog.push(acc / total, (acc + len) / total); acc += len;
      pass.push(ps, ps); gold.push(s.gold ? 1 : 0, s.gold ? 1 : 0);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("aProg", new Float32BufferAttribute(prog, 1));
  g.setAttribute("aPass", new Float32BufferAttribute(pass, 1));
  g.setAttribute("aGold", new Float32BufferAttribute(gold, 1));
  return g;
}

function particleSystem() {
  const from = particleOffsets(PARTICLES).flat(), to = packTargets(PARTICLES).flat();
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(from, 3));
  g.setAttribute("aTo", new Float32BufferAttribute(to, 3));
  g.setAttribute("aRand", new Float32BufferAttribute(Array.from({ length: PARTICLES }, (_, i) => ((i * 0.6180339) % 1)), 1));
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uLeaf: { value: new Vector3() }, uTo: { value: new Vector3(...center(3)) }, uScatter: { value: 0 }, uGather: { value: 0 }, uOpacity: { value: 0 }, uTime: { value: 0 }, uSize: { value: 3 }, uInk: { value: INK }, uGold: { value: GOLD } },
    vertexShader: /* glsl */ `
      attribute vec3 aTo; attribute float aRand;
      uniform vec3 uLeaf, uTo; uniform float uScatter, uGather, uTime, uSize;
      varying float vRand;
      void main(){
        float a = aRand * 6.2831;
        vec3 drift = vec3(sin(uTime * 0.7 + a), cos(uTime * 0.55 + a * 1.3), sin(uTime * 0.4 + a * 2.1)) * 0.14 * uScatter;
        vec3 from = uLeaf + position * (1.0 + uScatter * (1.2 + aRand * 1.6)) + drift - vec3(0.0, uScatter * aRand * 0.3, 0.0);
        float g = smoothstep(0.0, 1.0, clamp(uGather * 1.5 - aRand * 0.5, 0.0, 1.0)); // staggered settle
        vRand = aRand;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(from, uTo + aTo, g), 1.0);
        gl_PointSize = uSize * (0.55 + aRand * 0.9);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk, uGold; uniform float uOpacity; varying float vRand;
      void main(){
        if (length(gl_PointCoord - 0.5) > 0.5 || uOpacity < 0.004) discard;
        gl_FragColor = vec4(vRand > 0.78 ? uGold : uInk, uOpacity * 0.85);
      }`,
  });
  const pts = new Points(g, m);
  pts.frustumCulled = false;
  return { pts, m };
}

function Scene({ progress, onAnchor, restOn }: Omit<Props, "active">) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);

  const parts = useMemo(() => {
    const objects = stepDrawings().map((d, k) => {
      const m = sketchMaterial(), line = new LineSegments(lineGeometry(d), m), grp = new Group();
      line.frustumCulled = false; grp.position.set(...center(k)); grp.add(line);
      return { grp, m };
    });
    const leafMat = sketchMaterial(); leafMat.uniforms.uWob.value = 0.014;
    const leafLine = new LineSegments(lineGeometry(leafDrawing()), leafMat); leafLine.frustumCulled = false;
    const leaf = new Group(); leaf.add(leafLine); leaf.scale.setScalar(LEAF_SCALE); leaf.rotation.order = "ZYX";
    const trailPos = Array.from({ length: TRAIL }, (_, i) => { const q = leafPose(i / (TRAIL - 1)); return [q.x, q.y, q.z - 0.2]; }).flat();
    const trailGeo = new BufferGeometry(); trailGeo.setAttribute("position", new Float32BufferAttribute(trailPos, 3)); trailGeo.setDrawRange(0, 0);
    const trail = new Points(trailGeo, new PointsMaterial({ color: "#c9a46a", size: 2, sizeAttenuation: false, transparent: true, opacity: 0.38, depthWrite: false }));
    trail.frustumCulled = false;
    return { objects, leaf, leafMat, trail, trailGeo, particles: particleSystem() };
  }, []);

  useEffect(() => () => {
    parts.objects.forEach((o) => { o.m.dispose(); (o.grp.children[0] as LineSegments).geometry.dispose(); });
    parts.leafMat.dispose(); parts.trailGeo.dispose(); parts.particles.pts.geometry.dispose(); parts.particles.m.dispose();
  }, [parts]);

  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => { pointer.current.x = (e.clientX / innerWidth) * 2 - 1; pointer.current.y = (e.clientY / innerHeight) * 2 - 1; };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  const s = useRef({ p: progress.current ?? 0, cy: camFor(progress.current ?? 0), tx: 0, ty: 0, w: 0, h: 0, u: 1, init: false });
  const tmp = useMemo(() => ({ v: new Vector3(), d: new Vector3(), rest: new Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1), time = state.clock.elapsedTime, st = s.current;
    const { width: w, height: h } = state.size;

    // Fit the camera: keep the drawings wide enough on portrait screens, and move the optical
    // centre right of the copy on desktop / into the top 55% on phones.
    if (w !== st.w || h !== st.h) {
      st.w = w; st.h = h;
      const fit = stageFit(w, h, camera.fov);
      camera.position.z = fit.z;
      camera.setViewOffset(w, h, fit.ox, fit.oy, w, h);
      camera.updateProjectionMatrix();
      st.u = fit.u;
    }

    // Light and floaty: chase the scrubbed progress instead of locking to it.
    const k1 = 1 - Math.exp(-dt * 5);
    st.p += ((progress.current ?? 0) - st.p) * (st.init ? k1 : 1);
    const p = st.p;
    st.tx += (pointer.current.x - st.tx) * (1 - Math.exp(-dt * 3));
    st.ty += (pointer.current.y - st.ty) * (1 - Math.exp(-dt * 3));

    const camTarget = camFor(p);
    st.cy += (camTarget - st.cy) * (st.init ? 1 - Math.exp(-dt * 4) : 1);
    st.init = true;
    camera.position.x = st.tx * 0.12;
    camera.position.y = st.cy;
    camera.updateMatrixWorld();

    const tick = Math.floor(time / 0.12); // lines "boil" ~8 times a second
    parts.objects.forEach(({ grp, m }, k) => {
      const ss = stepState(p, k);
      grp.visible = ss.opacity > 0.004;
      m.uniforms.uOpacity.value = ss.opacity;
      m.uniforms.uDraw.value = ss.draw;
      m.uniforms.uTick.value = tick + k * 31;
      grp.rotation.x = st.ty * DEG6;
      grp.rotation.y = st.tx * DEG6 + Math.sin(time * 0.35 + k) * 0.05;
    });

    const pose = leafPose(p), ls = leafState(p), leaf = parts.leaf;
    const breathe = Math.sin((time * TAU) / 4); // 4s idle drift
    leaf.position.set(pose.x + Math.sin((time * TAU) / 8) * 0.03, pose.y + breathe * 0.05, pose.z);
    leaf.rotation.set(pose.rx + st.ty * DEG6, pose.ry + st.tx * DEG6, pose.rz + breathe * 0.07);

    const target = restOn?.current;
    if (ls.rest > 0 && target) {
      const r = target.getBoundingClientRect(), c = gl.domElement.getBoundingClientRect();
      tmp.v.set(((r.left + r.width * 0.5 - c.left) / c.width) * 2 - 1, -((r.top - c.top) / c.height) * 2 + 1, 0.5).unproject(camera);
      tmp.d.copy(tmp.v).sub(camera.position).normalize();
      tmp.rest.copy(camera.position).addScaledVector(tmp.d, -camera.position.z / tmp.d.z);
      tmp.rest.y += 0.2 + breathe * 0.01 * (1 - ls.rest);
      const e = ls.rest;
      leaf.position.lerp(tmp.rest, e);
      leaf.rotation.x += (-0.4 - leaf.rotation.x) * e;
      leaf.rotation.y += (TAU * STEPS - leaf.rotation.y) * e;
      leaf.rotation.z += (-1.38 - leaf.rotation.z) * e;
    }
    leaf.visible = ls.leaf > 0.004;
    parts.leafMat.uniforms.uOpacity.value = ls.leaf;
    parts.leafMat.uniforms.uTick.value = tick;

    const pm = parts.particles.m.uniforms;
    parts.particles.pts.visible = ls.particles > 0.004;
    pm.uOpacity.value = ls.particles; pm.uScatter.value = ls.scatter; pm.uGather.value = ls.gather; pm.uTime.value = time;
    pm.uSize.value = 2.6 * state.viewport.dpr;
    pm.uLeaf.value.copy(leaf.position);

    parts.trailGeo.setDrawRange(0, Math.floor(p * (TRAIL - 1)));

    if (onAnchor) {
      const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
      tmp.v.set(0, -step * SPACING, 0).project(camera);
      onAnchor({ x: ((tmp.v.x + 1) / 2) * w, y: ((1 - tmp.v.y) / 2) * h, u: st.u, step });
    }
  });

  return <>
    <primitive object={parts.trail} />
    {parts.objects.map((o, k) => <primitive key={k} object={o.grp} />)}
    <primitive object={parts.particles.pts} />
    <primitive object={parts.leaf} />
  </>;
}

/** With frameloop="demand", frames only happen while this keeps asking — i.e. while on screen. */
function Pump({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => { invalidate(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [active, invalidate]);
  return null;
}

export default function FallingLeaf({ progress, active, onAnchor, restOn }: Props) {
  return <div className="ps-canvas" aria-hidden="true">
    <Canvas frameloop="demand" dpr={[1, 1.75]} camera={{ fov: 35, position: [0, 0, 8], near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} style={{ pointerEvents: "none" }}>
      <Pump active={active} />
      <Scene progress={progress} onAnchor={onAnchor} restOn={restOn} />
    </Canvas>
  </div>;
}
