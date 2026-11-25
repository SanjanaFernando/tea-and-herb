import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AboutSection } from "@/components/about-section";
import { BackgroundVideo } from "@/components/background-video";
import { SolutionList } from "@/components/solution-list";
import { Badge, Leaves, Lines, Marquee, Roll, v } from "@/components/ui";

const photo = (id: string, width = 1800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const IMG = {
  house: "photo-1544787219-7f47ccb76574",
  leaf: "photo-1576092768241-dec231879fc3",
  label: "photo-1597318181409-cf64d0b5d8a2",
  place: "photo-1513836279014-a89f7a76ae86",
};

const grades = ["Orthodox", "CTC", "Green", "White", "Silver Tips", "Single Estate", "Flavoured", "Herbal infusions"];

const journey = [
  ["01", "Bush", "Selected from Ceylon’s high, mid and low-grown regions.", "/images/journey/bush.webp"],
  ["02", "Taste", "Forty years of tasting experience guide every single lot.", "/images/journey/taste.webp"],
  ["03", "Blend", "Custom blending and flavouring, shaped around your brief.", "/images/journey/blend.webp"],
  ["04", "Pack", "Tea bags, pouches, tins and cartons — packed in-house.", "/images/journey/pack.webp"],
  ["05", "Ship", "Minutes from the Port of Colombo and Bandaranaike airport.", "/images/journey/ship.webp"],
];

const solutions = [
  { n: "01", title: "Bulk tea", desc: "Carefully sourced Ceylon grades, ready for your market.", href: "/bulk-tea", image: photo(IMG.leaf, 700) },
  { n: "02", title: "Private label", desc: "From first blend to a finished product under your name.", href: "/private-label", image: photo(IMG.label, 700) },
  { n: "03", title: "Tea blends", desc: "Signature blends, flavour and format, made around you.", href: "/tea-blends", image: photo(IMG.house, 700) },
  { n: "04", title: "Our own brands", desc: "Distinctive tea houses with stories of their own.", href: "/brands", image: "/images/brands/trinity.webp" },
];

const paths = [
  ["Our house", "A Colombo tea house built around care, craft and consistency.", "/who-we-are", IMG.house, "THE COMPANY"],
  ["Tea, made possible", "From garden teas to considered blends and finished formats.", "/tea-solutions", IMG.leaf, "SOLUTIONS"],
  ["Made for your name", "A thoughtful partner for every step of private label development.", "/private-label", IMG.label, "PRIVATE LABEL"],
];

export default function Home() {
  return <main>
    {/* HERO */}
    <section className="hero" data-pointer>
      <div className="hero-media"><div className="hero-image" style={{ backgroundImage: "url(/images/journey/hero.webp)" }} /></div>
      <div className="hero-shade" />
      <Leaves />
      <div className="hero-meta" data-reveal="fade"><span>SRI LANKAN TEA EXPORTER · REGISTERED 1998</span><span>06°56′ N / 79°52′ E</span></div>
      <div className="hero-content" data-parallax="-0.25">
        <h1 className="display split" data-reveal="split"><Lines lines={["Rooted in", <>the <em>island.</em></>, "Made for the world."]} /></h1>
        <div className="hero-bottom" data-reveal="up" style={v({ "--rd": ".55s" })}>
          <p>Bulk Ceylon tea, speciality blends and private label production from Sri Lanka.</p>
          <Link className="btn btn-light" href="/who-we-are" data-magnetic><Roll>Discover our house</Roll><span className="btn-ico"><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" /></span></Link>
        </div>
      </div>
      <Badge id="hero-badge" className="hero-badge" text="CEYLON TEA ✳ WHOLE LEAF & HERBAL INFUSIONS ✳ " center={<>T<i>&amp;</i>H</>} />
      <div className="hero-scroll"><i />SCROLL</div>
    </section>

    <Marquee items={grades} speed={45} />

    {/* ABOUT — GSAP scroll scenes + Framer Motion state transitions */}
    <AboutSection />

    {/* JOURNEY — pinned horizontal scroll */}
    <section className="journey" data-hscroll>
      <div className="journey-sticky">
        <div className="journey-head">
          <div><span className="eyebrow light">02 / One house, many hands</span><h2 className="display split" data-reveal="split"><Lines lines={[<>Bush to cup, <em>under</em></>, <em key="r">one roof.</em>]} /></h2></div>
          <div className="journey-progress"><small>SCROLL THE JOURNEY</small><span><i /></span></div>
        </div>
        <div className="journey-track" data-track>
          <div className="j-intro">
            <p>Care you can see. <em>Quality you can taste.</em></p>
            <Link className="btn btn-light" href="/capabilities" data-magnetic><Roll>Inside our house</Roll><span className="btn-ico"><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" /></span></Link>
          </div>
          {journey.map(([n, title, desc, img]) => <article className="j-card" key={n} data-cursor="Explore">
            <div className="j-img" style={{ backgroundImage: `url(${img})` }} />
            <span className="j-num">{n}</span>
            <div className="j-body"><h3>{title}</h3><p>{desc}</p></div>
          </article>)}
        </div>
      </div>
    </section>

    {/* SOLUTIONS */}
    <section className="section solutions">
      <div className="section-label" data-reveal="line"><span>03 / What we make possible</span><span>For partners, brands & curious minds</span></div>
      <div className="solutions-head">
        <h2 className="display split" data-reveal="split"><Lines lines={["Many ways to", <em key="m">make it yours.</em>]} /></h2>
        <p data-reveal="up">From a single grade to a complete brand, we bring the experience, people and production together to move your idea forward.</p>
      </div>
      <SolutionList items={solutions} />
    </section>

    {/* BRANDS */}
    <section className="brand">
      <BackgroundVideo src="/media/hibiscus-tea.mp4" poster="/media/hibiscus-tea.webp" />
      <div className="brand-content">
        <span className="eyebrow light" data-reveal="up">04 / Made here, shared everywhere</span>
        <h2 className="display split" data-reveal="split"><Lines lines={["Different", <em key="b">by nature.</em>]} /></h2>
        <div className="brand-row" data-reveal="up" style={v({ "--rd": ".3s" })}>
          <p>A portfolio with personality — tea houses with stories of their own.</p>
          <div className="brand-chips">
            {[["Silkenty", "/silkenty"], ["Trinity", "/trinity"], ["Thé-Kola", "/the-kola"]].map(([n, h]) => <Link className="chip" href={h} key={h}>{n}</Link>)}
            <Link className="chip chip-solid" href="/brands">All brands<ArrowUpRight className="inline-arrow" size={15} strokeWidth={1.8} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>

    {/* PATHS */}
    <section className="section paths">
      <div className="paths-head">
        <h2 className="display split" data-reveal="split"><Lines lines={["Find your", <em key="w">way in.</em>]} /></h2>
        <Badge id="paths-badge" className="badge-dark" text="DISCOVER ✳ OUR HOUSE ✳ OUR TEA ✳ " center={<ArrowDown size={26} strokeWidth={1.8} aria-hidden="true" />} />
      </div>
      <div className="cards">
        {paths.map(([title, desc, href, img, tag], i) => <div key={href} data-reveal="up" style={v({ "--rd": `${i * 120}ms` })}>
          <Link className="card" href={href} data-tilt data-cursor="View">
            <div className="card-img"><div style={{ backgroundImage: `url(${photo(img, 1000)})` }} /><span className="card-tag">0{i + 1} · {tag}</span></div>
            <h3>{title}</h3><p>{desc}</p><span className="tlink">Explore<ArrowUpRight className="inline-arrow" size={14} strokeWidth={1.8} aria-hidden="true" /></span>
          </Link>
        </div>)}
      </div>
    </section>

    {/* TOUR */}
    <section className="section tour">
      <div className="tour-media">
        <div className="img-wrap" data-reveal="img"><div className="img" data-parallax="0.1" style={{ backgroundImage: `url(${photo(IMG.house, 1400)})` }} /></div>
        <Badge id="tour-badge" className="tour-badge" text="THE COLOMBO TEA & HERB TOUR ✳ " center="✳" />
      </div>
      <div className="tour-copy">
        <span className="eyebrow" data-reveal="up">05 / Come a little closer</span>
        <h2 className="display split" data-reveal="split"><Lines lines={["Some things", "are better", <em key="t">tasted.</em>]} /></h2>
        <p data-reveal="up">Step into our Colombo home. Meet the people behind the cup, explore the craft and take a little piece of Ceylon with you.</p>
        <div data-reveal="up" style={v({ "--rd": ".15s" })}><Link className="btn btn-dark" href="/tea-tour" data-magnetic><Roll>Discover the tour</Roll><span className="btn-ico"><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" /></span></Link></div>
      </div>
    </section>

    {/* CLOSING */}
    <section className="closing closing-with-video">
      <BackgroundVideo src="/media/tea-bloom.mp4" poster="/media/tea-bloom.webp" />
      <span className="eyebrow light" data-reveal="up">The next good thing starts here</span>
      <h2 className="display split" data-reveal="split"><Lines lines={["What are you", <em key="i">imagining?</em>]} /></h2>
      <Link className="round-cta" href="/contact" data-magnetic><span>Tell us<br />about it<ArrowUpRight className="inline-arrow" size={16} strokeWidth={1.8} aria-hidden="true" /></span></Link>
      <Marquee items={["Ceylon, considered", "Rooted in the island", "Made for the world", "From bush to cup"]} reverse speed={55} className="marquee-dark" />
    </section>
  </main>;
}
