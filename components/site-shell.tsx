"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowUpRight, ChevronDown } from "lucide-react";
import { FooterBirds } from "./footer-birds";
import { FooterHills } from "./footer-scene";
import { Lines, Roll, v } from "./ui";

const teaLinks = [
  ["Bulk tea", "/bulk-tea", "Ceylon grades for global markets."],
  ["Private label", "/private-label", "Your idea, made ready for the world."],
  ["Tea blends", "/tea-blends", "Blended, flavoured and finished in Colombo."],
];
const navLinks = [["Our story", "/who-we-are"], ["Our brands", "/brands"], ["Selected work", "/projects"], ["Tea & Herb Tour", "/tea-tour"]];
const mobileLinks = [["Our story", "/who-we-are"], ["Tea solutions", "/tea-solutions"], ["Private label", "/private-label"], ["Our brands", "/brands"], ["Selected work", "/projects"], ["Tea & Herb Tour", "/tea-tour"], ["Contact", "/contact"]];

const Wordmark = () => <><span className="mark">T<span>&amp;</span>H</span><span className="wordmark-copy">THE TEA & HERB COMPANY<small>COLOMBO · SRI LANKA</small></span></>;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [teaOpen, setTeaOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMenuOpen(false); setTeaOpen(false); }, [pathname]);
  useEffect(() => { document.documentElement.classList.toggle("menu-open", menuOpen); }, [menuOpen]);

  const isActive = (href: string) => pathname === href;

  return <>
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="The Tea and Herb Company home"><Wordmark /></Link>
        <nav className="desk-nav" aria-label="Main">
          <Link href="/who-we-are" className={`nav-link ${isActive("/who-we-are") ? "is-active" : ""}`}><Roll>Our story</Roll></Link>
          <div className="nav-dropdown" onMouseEnter={() => setTeaOpen(true)} onMouseLeave={() => setTeaOpen(false)}>
            <button className={`nav-link nav-trigger ${teaOpen ? "is-open" : ""}`} onClick={() => setTeaOpen(!teaOpen)} aria-expanded={teaOpen}><Roll>Tea solutions</Roll><ChevronDown className="chev" size={14} strokeWidth={1.8} aria-hidden="true" /></button>
            <div className={`mega ${teaOpen ? "is-open" : ""}`}>
              <Link href="/tea-solutions" className="mega-feature" style={{ backgroundImage: "linear-gradient(0deg,#13211acc,#13211a22),url(https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80)" }}>
                <span className="eyebrow light">MADE FOR YOUR NEXT CHAPTER</span>
                <p>One house.<br /><em>Every tea possibility.</em></p>
              </Link>
              <div className="mega-links">{teaLinks.map(([label, href, copy], i) =>
                <Link key={href} href={href} style={v({ "--i": i })}><strong>{label}</strong><small>{copy}</small><span className="mega-link-icon"><ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" /></span></Link>)}
              </div>
            </div>
          </div>
          {navLinks.slice(1).map(([label, href]) => <Link key={href} href={href} className={`nav-link ${isActive(href) ? "is-active" : ""}`}><Roll>{label}</Roll></Link>)}
        </nav>
        <Link className="nav-cta" href="/contact" data-magnetic><Roll>Start a conversation</Roll><span className="nav-cta-icon"><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" /></span></Link>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation"><span /><span /></button>
      </div>
    </header>

    <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
      <nav aria-label="Mobile">{mobileLinks.map(([label, href], i) =>
        <Link key={href} href={href} className="mm-link" style={v({ "--i": i })} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{label}<small>0{i + 1}</small></Link>)}
      </nav>
      <div className="mm-foot"><span>Colombo, Sri Lanka</span><span>From bush to cup, with care.</span></div>
    </div>
  </>;
}

export function Footer() {
  const giant = ["T", "e", "a", "&", "H", "e", "r", "b"];
  return <footer className="footer">
    <div className="footer-top">
      <div>
        <span className="eyebrow">A GOOD PLACE TO BEGIN</span>
        <h2 className="display split" data-reveal="split"><Lines lines={["Let’s make", <em key="e">something meaningful.</em>]} /></h2>
      </div>
      <div className="footer-cols">
        <div><h4>Explore</h4><Link className="tlink" href="/who-we-are">Our story</Link><Link className="tlink" href="/capabilities">Capabilities</Link><Link className="tlink" href="/brands">Our brands</Link><Link className="tlink" href="/projects">Selected work</Link></div>
        <div><h4>Solutions</h4><Link className="tlink" href="/bulk-tea">Bulk tea</Link><Link className="tlink" href="/private-label">Private label</Link><Link className="tlink" href="/tea-blends">Tea blends</Link><Link className="tlink" href="/tea-tour">Tea & Herb Tour</Link></div>
        <div><h4>Visit</h4><p>Colombo, Sri Lanka</p><p>Minutes from the Port<br />of Colombo & BIA</p><Link className="tlink" href="/contact">Start a conversation<ArrowUpRight className="inline-arrow" size={14} strokeWidth={1.8} aria-hidden="true" /></Link></div>
      </div>
    </div>
    <div className="footer-land">
      <FooterBirds />
      <div className="footer-giant split" data-reveal="split" aria-label="Tea & Herb">
        {giant.map((c, i) => <span className={c === "&" ? "line footer-ampersand" : "line"} key={i}><span style={v({ "--d": i })}>{c === "&" ? <em>&</em> : c}</span></span>)}
      </div>
      <FooterHills />
    </div>
    <div className="footer-bottom">
      <Link className="wordmark footer-wordmark" href="/"><Wordmark /></Link>
      <span>From bush to cup, with care.</span>
      <small>© 2026 THE TEA & HERB COMPANY</small>
      <button className="to-top" onClick={() => scrollTo({ top: 0, behavior: "smooth" })} data-magnetic aria-label="Back to top"><ArrowUp size={20} strokeWidth={1.8} aria-hidden="true" /></button>
    </div>
  </footer>;
}
