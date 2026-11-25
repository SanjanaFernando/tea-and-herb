"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const all = (s: string) => Array.from(document.querySelectorAll<HTMLElement>(s));

/**
 * One lightweight motion engine for the whole site. Pages opt in with data attributes:
 * data-reveal · data-count · data-parallax · data-scrub · data-hscroll/data-track ·
 * data-magnetic · data-tilt · data-pointer
 */
export function MotionProvider() {
  const pathname = usePathname();

  // Global, mount-once: preloader exit, header state, scroll progress.
  useEffect(() => {
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => root.classList.add("loaded"), reduce ? 150 : 1500);
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      root.classList.toggle("scrolled", y > 40);
      if (y > 500 && y > lastY + 4) root.classList.add("nav-hidden");
      else if (y < lastY - 4 || y <= 500) root.classList.remove("nav-hidden");
      lastY = y;
      const max = root.scrollHeight - innerHeight;
      root.style.setProperty("--sp", String(max > 0 ? y / max : 0));
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); removeEventListener("scroll", onScroll); };
  }, []);

  // Per route: wire up everything on the current page.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    all("[data-reveal]").forEach((el) => reveal.observe(el));

    const counters = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      counters.unobserve(el);
      const end = Number(el.dataset.count);
      const pad = Number(el.dataset.pad || 0);
      const start = performance.now();
      const tick = (now: number) => {
        const p = clamp((now - start) / 2000);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 4)))).padStart(pad, "0");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.5 });
    if (!reduce) all("[data-count]").forEach((el) => { el.textContent = "0".padStart(Number(el.dataset.pad || 0), "0"); counters.observe(el); });

    const parallax = all("[data-parallax]");
    const scrubs = all("[data-scrub]");
    const hs = all("[data-hscroll]");

    const sizeH = () => hs.forEach((el) => {
      const track = el.querySelector<HTMLElement>("[data-track]");
      if (!track) return;
      if (innerWidth <= 900 || reduce) { el.style.height = ""; el.dataset.dist = "0"; track.style.transform = ""; return; }
      const dist = Math.max(0, track.scrollWidth - innerWidth);
      el.dataset.dist = String(dist);
      el.style.height = `${dist + innerHeight}px`;
    });

    let raf = 0;
    const frame = () => {
      raf = 0;
      const vh = innerHeight;
      if (!reduce) parallax.forEach((el) => {
        const box = (el.parentElement ?? el).getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        const s = Number(el.dataset.parallax || 0.12);
        el.style.setProperty("--py", `${(box.top + box.height / 2 - vh / 2) * -s}px`);
      });
      scrubs.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--p", String(clamp((vh * 0.88 - r.top) / (r.height + vh * 0.3))));
      });
      hs.forEach((el) => {
        const track = el.querySelector<HTMLElement>("[data-track]");
        const dist = Number(el.dataset.dist || 0);
        if (!track || !dist) return;
        const p = clamp(-el.getBoundingClientRect().top / dist);
        track.style.transform = `translate3d(${-p * dist}px,0,0)`;
        el.style.setProperty("--hp", String(p));
      });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const onResize = () => { sizeH(); req(); };
    sizeH(); frame();
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", onResize);
    // Fonts can change track widths after first paint.
    document.fonts?.ready.then(onResize).catch(() => {});

    const on = (el: HTMLElement, type: string, fn: (e: PointerEvent) => void) => {
      el.addEventListener(type, fn as EventListener);
      cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };

    if (fine && !reduce) {
      all("[data-magnetic]").forEach((el) => {
        on(el, "pointermove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
        });
        on(el, "pointerleave", () => { el.style.transform = ""; });
      });
      all("[data-tilt]").forEach((el) => {
        on(el, "pointermove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
          el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -8}deg`);
        });
        on(el, "pointerleave", () => { el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); });
      });
      all("[data-pointer]").forEach((el) => {
        on(el, "pointermove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        });
      });
    }

    return () => {
      reveal.disconnect(); counters.disconnect();
      if (raf) cancelAnimationFrame(raf);
      removeEventListener("scroll", req); removeEventListener("resize", onResize);
      cleanups.forEach((c) => c());
    };
  }, [pathname]);

  return null;
}

/** Trailing ring cursor that grows over links and shows a label over [data-cursor] targets. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      root.classList.add("cursor-on");
      const target = e.target instanceof Element ? e.target : null;
      const hover = target?.closest("a,button,[data-cursor]");
      const text = target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
      ring.current?.classList.toggle("is-hover", !!hover);
      ring.current?.classList.toggle("has-label", !!text);
      if (label.current && text) label.current.textContent = text;
    };
    const leave = () => root.classList.remove("cursor-on");
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", move); root.removeEventListener("pointerleave", leave); };
  }, []);

  return <div ref={ring} className="cursor-ring" aria-hidden="true"><span ref={label} /></div>;
}
