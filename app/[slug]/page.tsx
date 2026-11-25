import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Lines, Marquee, Roll, v, Words } from "@/components/ui";

const teaFieldsImage = "/images/journey/hero.webp";

const pages: Record<string, { title: string; italic: string; intro: string; image: string; label: string; sections: [string, string, string][] }> = {
  "who-we-are": { label: "THE COMPANY", title: "A house built", italic: "around tea.", intro: "A vertically integrated Ceylon tea house in Colombo, bringing tasting, blending, making and export together under one roof.", image: "photo-1544787219-7f47ccb76574", sections: [["A Colombo beginning", "Nearly 30 years of bringing Ceylon tea to the world.", "Our roots are in Sri Lanka and our perspective is global. We bring people, craft and production together in one connected home."], ["Experience in every cup", "A leadership and tasting team with deep industry knowledge.", "Our experienced tea tasters guide each blend with care, helping every partner find the right character, consistency and finish."], ["Closer to the world", "A connected house, positioned for global trade.", "From Colombo, our team works close to the port and airport, connecting the craft of Ceylon tea with partners around the world."]] },
  capabilities: { label: "OUR HOUSE", title: "One roof.", italic: "Many hands.", intro: "Tasting, blending, flavouring, packaging, warehousing and quality assurance work side by side in our Colombo facility.", image: "photo-1565610222536-ef125c59da2e", sections: [["Tea tasting", "Expertise begins with knowing the leaf.", "Our tasting team evaluates teas and guides the work from first selection through final blend."], ["Blending & flavouring", "Create a profile made for your market.", "We bring sourcing and blending together to develop teas around a brief, an audience and an occasion."], ["Making & quality", "Care continues through every detail.", "In-house packing, quality assurance and warehousing keep the journey connected from bush to cup."]] },
  "tea-solutions": { label: "TEA SOLUTIONS", title: "A world of", italic: "tea, considered.", intro: "From carefully selected Ceylon grades to a finished blend or a complete private label programme, our Colombo house brings the pieces together.", image: "photo-1576092768241-dec231879fc3", sections: [["Bulk tea", "Ceylon grades for global markets.", "Explore orthodox, CTC, green, white and specialty teas, sourced and prepared for your requirements."], ["Private label", "Your idea, made ready for the world.", "From custom blending and product development to packaging and production, we help bring your brand to life."], ["Tea blends", "Distinctive blends, made around you.", "A considered approach to flavour, format and finish, guided by the people who know tea best."]] },
  "bulk-tea": { label: "BULK TEA", title: "Good tea,", italic: "well chosen.", intro: "A considered source for Ceylon teas across orthodox, CTC, green, white and specialty grades.", image: "photo-1576092768241-dec231879fc3", sections: [["A breadth of Ceylon", "Character shaped by origin and craft.", "Our portfolio spans familiar favourites and distinctive teas, selected with the needs of your market in mind."], ["A dependable partner", "Consistency starts with experience.", "Our tasting and quality teams work closely across selection, evaluation and preparation."], ["Start a conversation", "Tell us what your market needs.", "Share the grades, format and destination you have in mind. Our team will help shape the next step."]] },
  "private-label": { label: "PRIVATE LABEL", title: "Your vision,", italic: "made possible.", intro: "An end-to-end partner for developing, blending and packing tea under your name, from first conversation to finished product.", image: "photo-1597318181409-cf64d0b5d8a2", sections: [["Discover", "Start with your idea and your market.", "We learn about your audience, positioning, target format and the experience you want to create."], ["Develop", "Shape a tea that feels like yours.", "Our team supports blending, flavour development, product formats and packaging direction."], ["Make", "Bring every detail together.", "Production, packing and quality assurance are connected under one roof in Colombo."]] },
  "tea-blends": { label: "TEA BLENDS", title: "A blend of", italic: "your own.", intro: "Thoughtful tea blends, developed with a deep understanding of leaf, flavour and the moments people make their own.", image: "photo-1544787219-7f47ccb76574", sections: [["Begin with the cup", "What should it feel like?", "We start with the occasion, audience and character you want your tea to hold."], ["Find the balance", "Expertly blended in Colombo.", "Our tasters bring ingredients and tea together to find the right aromatic and flavour profile."], ["Make it yours", "From loose leaf to finished formats.", "A blend can become part of a broader range, with flavour and format shaped around your brand."]] },
  brands: { label: "OUR BRANDS", title: "Different by", italic: "nature.", intro: "A portfolio of tea brands, each with a distinct point of view and a shared connection to the craft of Ceylon tea.", image: "photo-1594631252845-2fb3deeda6f1", sections: [["Silkenty", "A softer side of tea.", "Discover a distinctive expression from our house."], ["Trinity", "Rooted in the island.", "A brand inspired by the character and heritage of Ceylon."], ["Thé-Kola", "A little unexpected.", "A playful addition to our growing family of tea brands."]] },
  "silkenty": { label: "OUR BRANDS / SILKENTY", title: "Meet", italic: "Silkenty.", intro: "A distinctive tea brand from The Tea & Herb Company, made with care in Colombo.", image: "photo-1594631252845-2fb3deeda6f1", sections: [["A house original", "Made here, shared everywhere.", "Explore the character and story behind Silkenty."], ["Craft in every detail", "Connected to our Colombo house.", "Our tasting, blending and production experience brings this brand to life."], ["For partners", "Discover possibilities together.", "Contact us to explore distribution and brand partnership opportunities."]] },
  "trinity": { label: "OUR BRANDS / TRINITY", title: "Meet", italic: "Trinity.", intro: "A distinctive tea brand from The Tea & Herb Company, made with care in Colombo.", image: teaFieldsImage, sections: [["A house original", "Made here, shared everywhere.", "Explore the character and story behind Trinity."], ["Craft in every detail", "Connected to our Colombo house.", "Our tasting, blending and production experience brings this brand to life."], ["For partners", "Discover possibilities together.", "Contact us to explore distribution and brand partnership opportunities."]] },
  "the-kola": { label: "OUR BRANDS / THÉ-KOLA", title: "Meet", italic: "Thé-Kola.", intro: "A distinctive tea brand from The Tea & Herb Company, made with care in Colombo.", image: "photo-1576092768241-dec231879fc3", sections: [["A house original", "Made here, shared everywhere.", "Explore the character and story behind Thé-Kola."], ["Craft in every detail", "Connected to our Colombo house.", "Our tasting, blending and production experience brings this brand to life."], ["For partners", "Discover possibilities together.", "Contact us to explore distribution and brand partnership opportunities."]] },
  projects: { label: "SELECTED WORK", title: "Good things", italic: "grow together.", intro: "A look at the places, people and partnerships connected to our work in tea and hospitality.", image: "photo-1513836279014-a89f7a76ae86", sections: [["Kalametiya", "A coastal place with a sense of calm.", "A hospitality project that shares the slower side of Sri Lanka."], ["Tangalle", "A stay shaped by its surroundings.", "Explore selected work and collaborations from our wider house."], ["Shangrila", "Tea and hospitality, brought together.", "Our projects connect the world of tea with experiences across Sri Lanka."]] },
  kalametiya: { label: "SELECTED WORK / KALAMETIYA", title: "A place to", italic: "slow down.", intro: "Discover one of the hospitality projects connected to The Tea & Herb Company.", image: "photo-1513836279014-a89f7a76ae86", sections: [["A sense of place", "Sri Lanka, at a gentler pace.", "Explore a considered hospitality experience shaped by its surroundings."], ["Our connection", "From tea to a warm welcome.", "A project that shares our appreciation for thoughtful experiences."], ["Explore more", "Discover our wider house.", "See our capabilities and the people behind the work."]] },
  "tea-tour": { label: "THE COLOMBO TEA & HERB TOUR", title: "Some things", italic: "are better tasted.", intro: "Step into our Colombo home. Meet the people behind the cup, explore the craft and take a little piece of Ceylon with you.", image: "photo-1544787219-7f47ccb76574", sections: [["Meet the makers", "A welcome into our house.", "Get to know tea through the people who taste, blend and make it every day."], ["Follow the journey", "From leaf to finished pack.", "Experience the work behind tea, from tasting and blending to the details of production."], ["Plan your visit", "Individuals, groups and travel partners.", "Contact us to discuss a visit and the experience that is right for your group."]] },
  contact: { label: "CONTACT", title: "The next good thing", italic: "starts here.", intro: "Tell us what you are imagining. Our team in Colombo would love to hear about your market, your brand or your next visit.", image: teaFieldsImage, sections: [["Export & tea partnerships", "Bulk tea, blends and private label.", "Share your destination market, preferred formats and goals with our team."], ["Brands & distribution", "Bring a Ceylon tea story to your market.", "Get in touch to explore our own brands and potential partnerships."], ["Visit our house", "The Colombo Tea & Herb Tour.", "Ask us about a visit for individuals, corporate groups or travel partners."]] },
};

export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }

export default async function EditorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  const imageUrl = page.image.startsWith("/")
    ? page.image
    : `https://images.unsplash.com/${page.image}?auto=format&fit=crop&w=2200&q=85`;
  const others = Object.entries(pages).filter(([s]) => s !== slug).slice(0, 8).map(([, p]) => `${p.title} ${p.italic}`);
  return <main className="editorial-page">
    <section className="p-hero" data-pointer>
      <div className="p-hero-img" data-parallax="0.2" style={{ backgroundImage: `url(${imageUrl})` }} />
      <div className="hero-shade" />
      <div className="p-hero-content">
        <div>
          <span className="eyebrow light" data-reveal="up" style={v({ "--rd": ".3s" })}>{page.label} · Colombo, Sri Lanka</span>
          <h1 className="display split" data-reveal="split" style={v({ "--rd": ".35s" })}><Lines lines={[page.title, <em key="i">{page.italic}</em>]} /></h1>
        </div>
        <p data-reveal="up" style={v({ "--rd": ".7s" })}>{page.intro}</p>
      </div>
      <div className="hero-scroll"><i />SCROLL</div>
    </section>

    <section className="section p-intro">
      <div className="section-label" data-reveal="line"><span>Our house / {page.label}</span><span>From bush to cup</span></div>
      <p className="scrub" data-scrub><Words text="Craft, care and a connection to Ceylon. We bring people and process together to create good tea experiences for the world." /></p>
      <div className="p-cards">{page.sections.map(([title, kicker, text], i) =>
        <div key={title} data-reveal="up" style={v({ "--rd": `${i * 120}ms` })}>
          <article className="p-card" data-tilt>
            <span className="p-num">0{i + 1}</span>
            <span className="eyebrow">{page.label}</span>
            <h2>{title}</h2><h3>{kicker}</h3><p>{text}</p>
          </article>
        </div>)}
      </div>
    </section>

    <Marquee items={others} speed={60} />

    <section className="closing">
      <span className="eyebrow light" data-reveal="up">Let’s make something meaningful</span>
      <h2 className="display split" data-reveal="split"><Lines lines={["Good tea starts", <>with a <em>conversation.</em></>]} /></h2>
      <Link className="btn btn-light" href="/contact" data-magnetic><Roll>Talk with our team</Roll><span className="btn-ico"><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" /></span></Link>
    </section>
  </main>;
}
