"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Anchor } from "./falling-leaf";
import { STEPS, stageFit, staticDrawing, toSvgPath } from "./leaf-sketches";
import { Lines, Roll, v } from "./ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// three.js only ever loads in the browser, and only when motion is allowed.
const FallingLeaf = dynamic(() => import("./falling-leaf"), { ssr: false });

type XY = [number, number];
type Note = { text: string; at: XY; align?: "start" | "middle" | "end"; arrow: [XY, XY, XY]; gold?: boolean };
type Step = { n: string; word: string; tag: string; label: string; lines: string[]; notes: Note[] };

const steps: Step[] = [
  {
    n: "01", word: "Bush", tag: "Hand-plucked · High grown", label: "The garden",
    lines: ["Selected from Ceylon’s high, mid", "and low-grown regions, where each", "climate gives the leaf its character.", "Two leaves and a bud, by hand."],
    notes: [
      { text: "two leaves & a bud", at: [0.85, 1.3], arrow: [[0.8, 1.25], [0.45, 1.45], [0.15, 1.22]] },
      { text: "fine plucking", at: [1.25, -0.22], arrow: [[1.2, -0.15], [1.05, 0.1], [0.86, 0.24]] },
      { text: "left on the bush", at: [-0.95, -1.55], align: "end", arrow: [[-0.9, -1.48], [-0.58, -1.46], [-0.6, -1.16]] },
    ],
  },
  {
    n: "02", word: "Taste", tag: "Cupped daily · 40 years", label: "The tasting room",
    lines: ["Forty years of tasting experience", "guide every single lot. Each one is", "cupped side by side — leaf, liquor", "and aroma — before it is chosen."],
    notes: [
      { text: "withered 18 hrs", at: [1.2, 0.86], arrow: [[1.15, 0.8], [0.6, 0.76], [0.22, 0.14]] },
      { text: "the tasting lid", at: [-0.9, 1.36], align: "end", arrow: [[-0.85, 1.3], [-0.7, 1.05], [-0.56, 0.92]] },
      { text: "liquor, leaf & aroma", at: [1.15, -0.56], arrow: [[1.1, -0.5], [0.85, -0.25], [0.52, -0.06]] },
    ],
  },
  {
    n: "03", word: "Blend", tag: "Custom blends · Flavouring", label: "The blending floor",
    lines: ["Custom blending and flavouring,", "shaped around your brief. Ceylon", "tea meets herbs and spices such as", "hibiscus, lemongrass and cinnamon."],
    notes: [
      { text: "hibiscus petal", at: [-1.35, 1.56], align: "middle", arrow: [[-1.3, 1.45], [-1.22, 1.3], [-1.3, 1.14]] },
      { text: "lemongrass", at: [1.75, 1.0], arrow: [[1.7, 0.94], [1.55, 0.85], [1.4, 0.6]] },
      { text: "true cinnamon", at: [-0.6, -1.56], arrow: [[-0.65, -1.5], [-0.95, -1.5], [-1.1, -1.12]] },
    ],
  },
  {
    n: "04", word: "Pack", tag: "Packed in-house · 3,000 m²", label: "The packing hall",
    lines: ["Tea bags, pouches, tins and cartons,", "packed in-house in our 3,000 m²", "facility, so nothing gets lost", "between one step and the next."],
    notes: [
      { text: "tea bag", at: [-1.5, 1.42], align: "middle", arrow: [[-1.5, 1.32], [-1.4, 1.2], [-1.46, 1.04]] },
      { text: "pouch", at: [0, 1.0], align: "middle", arrow: [[0, 0.9], [0.06, 0.78], [0, 0.62]] },
      { text: "tin", at: [1.95, 1.0], arrow: [[1.9, 0.95], [1.8, 0.86], [1.66, 0.78]] },
      { text: "FSSC 22000", at: [1.5, -1.08], align: "middle", gold: true, arrow: [[1.5, -0.93], [1.56, -0.8], [1.5, -0.62]] },
    ],
  },
  {
    n: "05", word: "Ship", tag: "Colombo · 20+ markets", label: "The port",
    lines: ["Minutes from the Port of Colombo", "and Bandaranaike airport, we send", "Ceylon tea to more than twenty", "markets around the world."],
    notes: [
      { text: "Port of Colombo", at: [-1.25, 0.56], align: "middle", arrow: [[-1.25, 0.45], [-1.32, 0.2], [-1.2, -0.34]] },
      { text: "20+ markets", at: [2.2, 0.8], arrow: [[2.22, 0.66], [2.22, 0.48], [2.04, 0.4]] },
    ],
  },
];

// Notes are authored in world units (y up) and drawn in an SVG at 100 user units per world unit.
const P = (x: number, y: number) => `${(x * 100).toFixed(1)} ${(-y * 100).toFixed(1)}`;
function arrowPath([a, c, b]: [XY, XY, XY]) {
  const dx = b[0] - c[0], dy = b[1] - c[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, s = 0.085;
  const h1: XY = [b[0] - s * (ux * 0.87 - uy * 0.5), b[1] - s * (uy * 0.87 + ux * 0.5)];
  const h2: XY = [b[0] - s * (ux * 0.87 + uy * 0.5), b[1] - s * (uy * 0.87 - ux * 0.5)];
  return `M${P(...a)}Q${P(...c)} ${P(...b)}M${P(...h1)}L${P(...b)}L${P(...h2)}`;
}

/** One step's annotations (and, without WebGL, its whole drawing). */
function Sketch({ step, i, active, drawn, drawing }: { step: Step; i: number; active: boolean; drawn: boolean; drawing?: { ink: string; gold: string } }) {
  return <svg className={`ps-sketch${active ? " is-active" : ""}${drawn ? " is-drawn" : ""}`} viewBox="-300 -200 600 400" aria-hidden="true" data-step={i}>
    {drawing && <g className="ps-drawing">
      {[0, 1].map((pass) => <g key={pass} transform={`translate(${pass * 1.1} ${pass * 0.8}) scale(100)`} className={pass ? "ps-pass2" : undefined}>
        <path className="ps-ink" d={drawing.ink} /><path className="ps-ink ps-ink-gold" d={drawing.gold} />
      </g>)}
    </g>}
    {step.notes.map((n, j) => <g key={j} className="ps-note" style={v({ "--i": j })}>
      <path className="ps-arrow" d={arrowPath(n.arrow)} pathLength={1} />
      <text x={n.at[0] * 100} y={-n.at[1] * 100 + 6} textAnchor={n.align ?? "start"} className={n.gold ? "is-gold" : undefined}>{n.text}</text>
    </g>)}
  </svg>;
}

export function ProcessSection() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const notes = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);
  const progress = useRef(0);
  const [step, setStep] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [ctaOn, setCtaOn] = useState(false);
  const [mode, setMode] = useState<"pending" | "gl" | "static">("pending");
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => { setMode(matchMedia("(prefers-reduced-motion: reduce)").matches ? "static" : "gl"); }, []);

  // Render frames only while the section is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Where the notes sit before (or without) WebGL: the same framing the camera uses.
  useEffect(() => {
    const place = () => {
      const f = frame.current, n = notes.current;
      if (!f || !n) return;
      const fit = stageFit(f.clientWidth, f.clientHeight);
      n.style.setProperty("--ax", `${fit.cx}px`); n.style.setProperty("--ay", `${fit.cy}px`); n.style.setProperty("--u", fit.u.toFixed(2));
    };
    place();
    addEventListener("resize", place);
    return () => removeEventListener("resize", place);
  }, [mode]);

  const onAnchor = useCallback((a: Anchor) => {
    const n = notes.current;
    if (!n) return;
    n.style.setProperty("--ax", `${a.x.toFixed(1)}px`); n.style.setProperty("--ay", `${a.y.toFixed(1)}px`); n.style.setProperty("--u", a.u.toFixed(2));
  }, []);

  useGSAP(() => {
    const root = document.documentElement, proxy = { p: 0 };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(proxy, {
      p: 1, ease: "none",
      scrollTrigger: {
        trigger: frame.current, pin: true, start: "top top", end: "+=100%", scrub: reduce ? true : 0.6, anticipatePin: 1,
        onToggle: (self) => root.classList.toggle("in-process", self.isActive),
      },
      onUpdate: () => {
        const p = proxy.p, k = Math.min(STEPS - 1, Math.floor(p * STEPS)), t = p * STEPS - k;
        progress.current = p;
        setStep(k);
        setDrawn(reduce || (t > 0.58 && (k === STEPS - 1 || t < 0.93)));
        setCtaOn(p > 0.93);
      },
    });
    return () => root.classList.remove("in-process");
  }, { scope: section });

  const staticArt = useMemo(() => mode === "static" ? steps.map((_, k) => { const d = staticDrawing(k); return { ink: toSvgPath(d, false), gold: toSvgPath(d, true) }; }) : null, [mode]);

  return <section className="process" id="process" ref={section} aria-labelledby="process-title">
    <div className="ps-frame" ref={frame} style={v({ "--s": step })}>
      <div className="ps-grid" aria-hidden="true" />
      <div className="ps-rule ps-rule-top" aria-hidden="true" />
      <div className="ps-rule ps-rule-bottom" aria-hidden="true" />

      {mode === "gl" && <FallingLeaf progress={progress} active={onScreen} onAnchor={onAnchor} restOn={cta} />}
      <div className={`ps-notes${mode === "static" ? " is-static" : ""}`} ref={notes}>
        {steps.map((s, i) => <Sketch key={s.n} step={s} i={i} active={i === step} drawn={i === step && drawn} drawing={staticArt?.[i]} />)}
      </div>

      <header className="ps-head">
        <span className="ps-mark" aria-hidden="true">T<i>&amp;</i>H</span>
        <nav className="ps-pills" aria-label="Process section">
          <a className="ps-pill is-active" href="#process" aria-current="true">Process</a>
          <Link className="ps-pill" href="/who-we-are">House</Link>
          <Link className="ps-pill" href="/contact">Contact</Link>
        </nav>
        <Link className="ps-pill ps-pill-cta" href="/contact">Request samples</Link>
      </header>

      <div className="ps-meta">
        <div className="ps-count">
          <span className="ps-roll ps-num" aria-hidden="true"><span>{steps.map((s) => <span key={s.n}>{s.n}</span>)}</span></span>
          <span className="ps-dots" aria-hidden="true">{steps.map((s, i) => <i key={s.n} className={i <= step ? "on" : undefined} />)}</span>
        </div>
        <h2 className="ps-title" id="process-title">— Our Process</h2>
        <span className="ps-roll ps-tag" aria-hidden="true"><span>{steps.map((s) => <span key={s.n}>{s.tag}</span>)}</span></span>
      </div>

      <ol className="ps-copy">
        {steps.map((s, i) => <li key={s.n} className={`ps-step${i === step ? " is-active" : ""}`} aria-current={i === step ? "step" : undefined}>
          <span className={`ps-label split${i === step ? " in" : ""}`}><Lines lines={[`${s.n} · ${s.label}`]} /></span>
          <h3 className={`split${i === step ? " in" : ""}`}><Lines lines={[s.word]} start={1} /></h3>
          <p className={`split${i === step ? " in" : ""}`}><Lines lines={s.lines} start={2} /></p>
          <i className="ps-step-rule" aria-hidden="true" />
        </li>)}
      </ol>

      <Link ref={cta} className={`btn btn-light ps-cta${ctaOn ? " is-on" : ""}`} href="/tea-blends" data-magnetic tabIndex={ctaOn ? undefined : -1}>
        <Roll>Start your blend</Roll><span className="btn-ico"><ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" /></span>
      </Link>

      <div className="ps-roll ps-word" aria-hidden="true"><span>{steps.map((s) => <span key={s.n}>{s.word}</span>)}</span></div>
    </div>
  </section>;
}
