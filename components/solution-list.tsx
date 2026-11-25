"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Roll, v } from "./ui";

type Item = { n: string; title: string; desc: string; href: string; image: string };

/** Hover list with a floating image preview that trails the cursor. */
export function SolutionList({ items }: { items: Item[] }) {
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0, fresh: true });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = pos.current;
      p.cx += (p.x - p.cx) * 0.12;
      p.cy += (p.y - p.cy) * 0.12;
      if (preview.current) preview.current.style.transform = `translate3d(${p.cx}px,${p.cy}px,0) rotate(${(p.x - p.cx) * 0.03}deg)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const track = (e: React.PointerEvent) => {
    const r = list.current!.getBoundingClientRect();
    const p = pos.current;
    p.x = e.clientX - r.left; p.y = e.clientY - r.top;
    if (p.fresh) { p.cx = p.x; p.cy = p.y; p.fresh = false; }
  };

  return <div className="sol" ref={list} onPointerMove={track} onPointerLeave={() => { setActive(-1); pos.current.fresh = true; }}>
    <div className={`sol-preview ${active >= 0 ? "is-on" : ""}`} ref={preview} aria-hidden="true">
      {items.map((it, i) => <div key={it.n} className={i === active ? "is-active" : ""} style={{ backgroundImage: `url(${it.image})` }} />)}
    </div>
    {items.map((it, i) => <Link href={it.href} key={it.n} className="sol-row" data-reveal="up" style={v({ "--rd": `${i * 80}ms` })} onPointerEnter={() => setActive(i)}>
      <span className="sol-num">{it.n}</span>
      <strong className="sol-title"><Roll>{it.title}</Roll></strong>
      <span className="sol-desc">{it.desc}</span>
      <span className="sol-arrow"><ArrowUpRight size={22} strokeWidth={1.8} aria-hidden="true" /></span>
    </Link>)}
  </div>;
}
