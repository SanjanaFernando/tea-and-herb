// Terrace rows: gently curved lines clipped to each hill.
const rows = (y0: number, n: number, gap: number, bend: number) =>
  Array.from({ length: n }, (_, i) => {
    const y = y0 + i * gap;
    return `M-20 ${y} C 360 ${y - bend} 720 ${y + bend} 1100 ${y - bend * 0.6} S 1460 ${y + bend * 0.4} 1460 ${y}`;
  }).join(" ");

export function FooterHills() {
  return <svg className="footer-hills" viewBox="0 0 1440 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <radialGradient id="fh-sun" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="var(--gold-2)" stopOpacity=".95" />
        <stop offset=".55" stopColor="var(--gold-2)" stopOpacity=".45" />
        <stop offset="1" stopColor="var(--gold-2)" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="fh-mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--paper)" stopOpacity="0" />
        <stop offset=".6" stopColor="var(--paper)" stopOpacity=".85" />
        <stop offset="1" stopColor="var(--paper)" stopOpacity="0" />
      </linearGradient>
      <clipPath id="fh-mid"><path d="M0 230 C 180 170 330 160 520 200 S 860 270 1040 215 S 1320 150 1440 190 V380 H0Z" /></clipPath>
      <clipPath id="fh-near"><path d="M0 300 C 220 250 420 245 640 280 S 1060 330 1240 285 S 1400 260 1440 268 V380 H0Z" /></clipPath>
    </defs>

    {/* sun + far ranges */}
    <circle cx="1080" cy="196" r="92" fill="url(#fh-sun)" />
    <circle cx="1080" cy="196" r="34" fill="var(--gold-2)" opacity=".9" />
    <path d="M0 190 L120 150 L210 168 L330 112 L420 140 L520 128 L610 160 L720 120 L790 82 L860 128 L980 150 L1100 132 L1220 160 L1330 138 L1440 156 V380 H0Z" fill="#cfd3bf" />
    <path d="M0 210 C 140 180 260 170 400 188 S 700 150 860 170 S 1200 196 1440 172 V380 H0Z" fill="#b2baa0" />
    <rect x="0" y="150" width="1440" height="90" fill="url(#fh-mist)" />

    {/* mid hill with tea rows + shade trees */}
    <path d="M0 230 C 180 170 330 160 520 200 S 860 270 1040 215 S 1320 150 1440 190 V380 H0Z" fill="var(--sage)" />
    <g clipPath="url(#fh-mid)"><path d={rows(176, 14, 13, 18)} fill="none" stroke="#6f7f62" strokeWidth="2.2" strokeLinecap="round" /></g>
    <g fill="#55664a">
      {[[300, 172], [362, 170], [930, 236], [1220, 172], [1268, 166]].map(([x, y]) =>
        <g key={x}><rect x={x - 1.2} y={y} width="2.4" height="20" /><ellipse cx={x} cy={y} rx="9" ry="13" /></g>)}
    </g>

    {/* near hill */}
    <path d="M0 300 C 220 250 420 245 640 280 S 1060 330 1240 285 S 1400 260 1440 268 V380 H0Z" fill="var(--green-2)" />
    <g clipPath="url(#fh-near)"><path d={rows(256, 10, 14, 14)} fill="none" stroke="#3b5845" strokeWidth="3" strokeLinecap="round" /></g>

    {/* ground that meets the footer base */}
    <path d="M0 352 C 300 330 560 338 820 350 S 1240 336 1440 344 V380 H0Z" fill="var(--green)" />
  </svg>;
}
