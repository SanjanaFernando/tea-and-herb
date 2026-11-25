"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { Badge, Roll } from "./ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const statement = "We source, process and pack speciality teas in Sri Lanka for customers around the world.";
const highlighted = new Set([5, 6, 12, 13, 14]); // "speciality teas", "around the world."

const chapters = [
  { kicker: "Who we are", title: "A family tea house, three generations in.", text: "Registered in Sri Lanka in 1998, we bring the care of a family business to every order we send abroad.", image: "/images/journey/taste.webp", alt: "Tea taster evaluating Ceylon tea", note: "Tasted daily in Mulleriyawa" },
  { kicker: "What we make", title: "Ceylon tea, mostly unblended.", text: "Unblended Ceylon tea makes up most of our exports. We also supply herbal and spice infusions.", image: "/images/journey/bush.webp", alt: "Tea bushes on a Sri Lankan estate", note: "Straight from the estate" },
  { kicker: "How we work", title: "One facility, every step.", text: "Our 3,000 m² facility brings processing, packing and storage together — so nothing gets lost between steps.", image: "/images/journey/pack.webp", alt: "Tea being packed at the facility", note: "Packed on site" },
  { kicker: "For your brand", title: "Your blend, made ready to sell.", text: "For private label partners, we develop blends and handle printing and packaging, start to finish.", image: "/images/journey/blend.webp", alt: "Loose tea blend being prepared", note: "Your blend, your name" },
];

const facts = [
  { value: 1998, from: 1960, label: "Registered in Sri Lanka" },
  { value: 3, label: "Generations in tea" },
  { value: 2, label: "Acres at our facility" },
  { value: 20, suffix: "+", label: "Markets served" },
];

const statsVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const statVariants: Variants = { hidden: { opacity: 0, y: 48, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: EASE } } };

/** Number that counts up (Framer Motion `animate`) the first time it scrolls into view. */
function Counter({ to, from = 0 }: { to: number; from?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => { if (!reduce && ref.current) ref.current.textContent = String(from); }, [from, reduce]);
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(from, to, { duration: 2.2, ease: EASE, onUpdate: (n) => { if (ref.current) ref.current.textContent = String(Math.round(n)); } });
    return () => controls.stop();
  }, [inView, reduce, from, to]);

  return <span ref={ref}>{to}</span>;
}

export function AboutSection({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const chapter = chapters[active];

  useGSAP(() => {
    // Chapter tracking runs for everyone — it only swaps content, it isn't decorative motion.
    // On phones the photo is pinned over the top ~40% of the screen, so chapters activate lower down,
    // while their text is still in the visible band beneath it.
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 901px)", mobile: "(max-width: 900px)" }, (ctx) => {
      const line = ctx.conditions?.mobile ? "80%" : "60%";
      gsap.utils.toArray<HTMLElement>(".ab-chapter").forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: `top ${line}`, end: `bottom ${line}`, onToggle: (self) => { if (self.isActive) setActive(i); } });
      });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Statement: words sharpen out of a blur as you scroll.
      gsap.fromTo(".ab-word", { opacity: 0.12, yPercent: 40, filter: "blur(10px)" }, {
        opacity: 1, yPercent: 0, filter: "blur(0px)", ease: "none", stagger: 0.08,
        scrollTrigger: { trigger: ".ab-statement", start: "top 88%", end: "bottom 45%", scrub: 0.8 },
      });
      // Photo frame opens up from an inset window.
      gsap.fromTo(".ab-frame", { clipPath: "inset(16% 12% 16% 12% round 28px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "none",
        scrollTrigger: { trigger: ".ab-story", start: "top 92%", end: "top 30%", scrub: 0.6 },
      });
      // Gold rail fills as the chapters pass.
      gsap.fromTo(".ab-rail i", { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: ".ab-chapters", start: "top 60%", end: "bottom 60%", scrub: true },
      });
    });
    // Desktop-only decorations (on phones the polaroid sits inside the photo and the arrow/seal are hidden).
    mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
      // Polaroid drifts and swings against the scroll.
      gsap.fromTo(".ab-polaroid", { y: 120, rotate: 12 }, {
        y: -50, rotate: -5, ease: "none",
        scrollTrigger: { trigger: ".ab-story", start: "top bottom", end: "bottom top", scrub: 1 },
      });
      // Hand-drawn arrow draws itself.
      gsap.fromTo(".ab-arrow path", { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ".ab-story", start: "top 70%", end: "top 20%", scrub: 0.5 },
      });
      // Seal turns with the scroll.
      gsap.to(".ab-seal", { rotate: 300, ease: "none", scrollTrigger: { trigger: ".ab-story", start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
  }, { scope: root });

  const t = (d: number) => (reduce ? { duration: 0 } : { duration: d, ease: EASE });

  return <section className="section about" ref={root}>
    <div className="section-label" data-reveal="line"><span>01 / About the company</span><span>Mulleriyawa, Sri Lanka</span></div>

    <h2 className="ab-statement">
      {statement.split(" ").map((w, i) => <span key={i}><span className={`ab-word ${highlighted.has(i) ? "hl" : ""}`}>{w}</span>{" "}</span>)}
    </h2>

    <div className="ab-story">
      <div className="ab-media">
        <div className="ab-sticky">
          <div className="ab-frame">
            <AnimatePresence initial={false}>
              <motion.div key={active} className="ab-slide"
                initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                exit={{ scale: 1.06, opacity: 0.4, transition: t(1.1) }}
                transition={t(1.1)}>
                <Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 900px) 100vw, 46vw" priority={active === 0} />
              </motion.div>
            </AnimatePresence>
            <div className="ab-counter">
              <span className="ab-counter-mask">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={active} initial={{ y: "105%" }} animate={{ y: "0%" }} exit={{ y: "-105%" }} transition={t(0.7)}>0{active + 1}</motion.span>
                </AnimatePresence>
              </span>
              <small>/ 0{chapters.length}</small>
            </div>
            <div className="ab-dots" aria-hidden="true">{chapters.map((_, i) => <motion.i key={i} animate={{ width: i === active ? 28 : 8, opacity: i === active ? 1 : 0.5 }} transition={t(0.6)} />)}</div>
          </div>

          <div className="ab-seal"><Badge id="about-seal" text="REGISTERED 1998 ✳ THREE GENERATIONS ✳ " center={<>T<i>&amp;</i>H</>} /></div>

          <svg className="ab-arrow" viewBox="0 0 120 90" aria-hidden="true"><path pathLength={1} d="M6 14 C 44 2, 96 18, 104 74 M104 74 L 92 63 M104 74 L 111 59" /></svg>

          <div className="ab-polaroid">
            <div className="ab-polaroid-img"><Image src="/images/journey/hero.webp" alt="" fill sizes="230px" /></div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={active} className="ab-note" initial={{ opacity: 0, y: 10, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: -3 }} exit={{ opacity: 0, y: -10 }} transition={t(0.4)}>{chapter.note}</motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="ab-chapters">
        <div className="ab-rail" aria-hidden="true"><i /></div>
        {chapters.map((c, i) => <motion.article key={c.kicker} className={`ab-chapter ${i === active ? "is-active" : ""}`}
          initial={reduce ? false : { opacity: 0, y: 70 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -15% 0px" }} transition={t(1)}>
          <span className="ab-kicker"><b>0{i + 1}</b>{c.kicker}</span>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
          {i === chapters.length - 1 && <Link className="btn btn-dark" href="/who-we-are" data-magnetic><Roll>Meet the company</Roll><span className="btn-ico"><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" /></span></Link>}
        </motion.article>)}
      </div>
    </div>

    <motion.div className="ab-stats" variants={statsVariants} initial={reduce ? false : "hidden"} whileInView="show" viewport={{ once: true, margin: "0px 0px -12% 0px" }}>
      {facts.map((f) => <motion.div className="ab-stat" key={f.label} variants={statVariants} whileHover={reduce ? undefined : { y: -8 }}>
        <strong><Counter to={f.value} from={f.from} />{f.suffix && <sup>{f.suffix}</sup>}</strong>
        <small>{f.label}</small>
      </motion.div>)}
    </motion.div>

    {children}
  </section>;
}
