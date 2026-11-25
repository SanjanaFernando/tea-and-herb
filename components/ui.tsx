import type { CSSProperties, ReactNode } from "react";

/** Cast an object containing CSS custom properties to a style prop. */
export const v = (o: Record<string, string | number>) => o as CSSProperties;

/** Masked lines that slide up when their `.split[data-reveal]` parent enters view. */
export function Lines({ lines, start = 0 }: { lines: ReactNode[]; start?: number }) {
  return <>{lines.map((l, i) => <span className="line" key={i}><span style={v({ "--d": i + start })}>{l}</span></span>)}</>;
}

/** Words that light up one by one as their `[data-scrub]` ancestor scrolls through the viewport. */
export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return <span className="scrub-words" style={v({ "--n": words.length })}>{words.map((w, i) => <span className="w" key={i} style={v({ "--i": i })}>{w} </span>)}</span>;
}

/** Text that rolls up to a duplicate of itself on hover of the closest link/button. */
export function Roll({ children }: { children: ReactNode }) {
  return <span className="roll"><span className="roll-a">{children}</span><span className="roll-b" aria-hidden="true">{children}</span></span>;
}

/** A rotating circular text badge. */
export function Badge({ id, text, center, className = "" }: { id: string; text: string; center: ReactNode; className?: string }) {
  return <div className={`badge ${className}`} aria-hidden="true">
    <svg viewBox="0 0 120 120"><defs><path id={id} d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs><text><textPath href={`#${id}`} textLength="292" lengthAdjust="spacing">{text}</textPath></text></svg>
    <span>{center}</span>
  </div>;
}

/** Infinite horizontal ticker. */
export function Marquee({ items, reverse, speed = 40, className = "" }: { items: string[]; reverse?: boolean; speed?: number; className?: string }) {
  const group = (k: string) => <div className="marquee-group" aria-hidden={k === "b" ? true : undefined} key={k}>
    {items.map((t, i) => <span className="marquee-item" key={i}>{i % 2 ? <em>{t}</em> : t}<i>✳</i></span>)}
  </div>;
  return <div className={`marquee ${reverse ? "reverse" : ""} ${className}`} style={v({ "--speed": `${speed}s` })}><div className="marquee-track">{group("a")}{group("b")}</div></div>;
}

// The first 8 also show on phones. `blur` gives depth: large soft leaves feel close to the camera,
// tiny sharp ones far away. `tone` picks gold / pale sage / deep green.
type Leaf = { x: string; y: string; size: number; depth: number; dur: number; r0: number; r1: number; o?: number; blur?: number; tone?: "gold" | "sage" | "green" };
const leaves: Leaf[] = [
  { x: "62%", y: "18%", size: 46, depth: 1.4, dur: 6, r0: -18, r1: 12 },
  { x: "78%", y: "62%", size: 30, depth: 2.2, dur: 7.5, r0: 30, r1: 60, tone: "sage" },
  { x: "88%", y: "28%", size: 22, depth: 0.8, dur: 5.5, r0: -50, r1: -20 },
  { x: "52%", y: "74%", size: 18, depth: 2.8, dur: 8, r0: 70, r1: 110 },
  { x: "70%", y: "40%", size: 14, depth: 3.2, dur: 6.5, r0: 10, r1: 45, tone: "sage" },
  { x: "92%", y: "78%", size: 88, depth: 3.6, dur: 9, r0: 150, r1: 175, o: 0.55, blur: 5, tone: "green" },
  { x: "84%", y: "8%", size: 26, depth: 1.8, dur: 7, r0: 200, r1: 230 },
  { x: "44%", y: "12%", size: 16, depth: 1.1, dur: 6.8, r0: -80, r1: -40, tone: "sage" },
  { x: "58%", y: "48%", size: 10, depth: 0.6, dur: 5.2, r0: 20, r1: 80, o: 0.5 },
  { x: "66%", y: "86%", size: 36, depth: 2.6, dur: 8.4, r0: -120, r1: -95, tone: "sage" },
  { x: "96%", y: "46%", size: 18, depth: 1.5, dur: 6.2, r0: 95, r1: 130 },
  { x: "74%", y: "24%", size: 12, depth: 0.9, dur: 5.8, r0: -10, r1: 40, o: 0.6 },
  { x: "36%", y: "6%", size: 64, depth: 3.2, dur: 10, r0: 40, r1: 62, o: 0.45, blur: 4, tone: "green" },
  { x: "81%", y: "50%", size: 20, depth: 2, dur: 7.2, r0: -160, r1: -130 },
  { x: "48%", y: "34%", size: 8, depth: 0.5, dur: 4.8, r0: 0, r1: 90, o: 0.45 },
  { x: "60%", y: "64%", size: 24, depth: 1.7, dur: 6.6, r0: 220, r1: 250, tone: "sage" },
  { x: "-1%", y: "58%", size: 110, depth: 4, dur: 11, r0: -35, r1: -18, o: 0.4, blur: 7, tone: "green" },
  { x: "90%", y: "92%", size: 14, depth: 1.2, dur: 5.6, r0: 60, r1: 100 },
];

/** Floating tea leaves that drift and respond to the pointer. */
export function Leaves() {
  return <div className="leaves" aria-hidden="true">{leaves.map((l, i) =>
    <span className={`leaf ${l.tone ?? "gold"}`} key={i} style={v({ left: l.x, top: l.y, "--size": `${l.size}px`, "--depth": l.depth, "--dur": `${l.dur}s`, "--r0": `${l.r0}deg`, "--r1": `${l.r1}deg`, "--li": i, "--o": l.o ?? 0.75, "--blur": `${l.blur ?? 0}px` })}>
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5C12 3 5 7.5 4 15.5c-.2 1.6 0 3.2.5 5 1.7-.6 3.3-1.4 4.6-2.6C15.6 12.4 19.6 9 20.5 3.5Z" /><path d="M4.6 20.4C8 14.5 12 10 17 6.5" stroke="#1f3326" strokeOpacity=".35" strokeWidth=".8" fill="none" /></svg>
    </span>)}</div>;
}
