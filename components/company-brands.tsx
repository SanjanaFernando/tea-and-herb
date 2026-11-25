import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Coffee, Compass, FlaskConical, Mountain, PackageCheck, PenTool, Sprout, Store, Truck } from "lucide-react";
import { v } from "./ui";

const houseBrands = [
  { name: "Silkenty", href: "/silkenty", image: "/images/brands/silkenty.webp" },
  { name: "Thé-Kola", href: "/the-kola", image: "/images/brands/the-kola.webp" },
  { name: "Trinity", href: "/trinity", image: "/images/brands/trinity.webp" },
];

const partnerTypes = [
  { name: "Tea distributors", Mark: Truck },
  { name: "Retail tea brands", Mark: Store },
  { name: "Hospitality teams", Mark: Coffee },
];

const mockPartners = [
  { name: "Juniper House", Mark: Sprout },
  { name: "Meridian Pantry", Mark: Compass },
  { name: "Alder Ridge", Mark: Mountain },
];

const privateLabelSteps = [
  { name: "Blend development", description: "Tea and infusion recipes for your market.", Icon: FlaskConical },
  { name: "Packaging design", description: "Artwork and print for your brand.", Icon: PenTool },
  { name: "Production & packing", description: "Blended, filled and packed in Sri Lanka.", Icon: PackageCheck },
];

export function CompanyBrands() {
  const showMockPartners = process.env.NODE_ENV === "development";
  const partners = showMockPartners ? mockPartners : partnerTypes;

  return <div className="company-brands">
    <section className="company-brand-row" aria-labelledby="company-brands-title">
      <h2 id="company-brands-title">Our brands</h2>
      <ul className="company-brand-items">
        {houseBrands.map(({ name, href, image }, index) => (
          <li key={href} data-reveal="up" style={v({ "--rd": `${index * 85}ms` })}>
            <Link className="company-brand-card" href={href}>
              <div className="company-brand-art">
                <Image src={image} alt="" width={750} height={300} unoptimized />
              </div>
              <span className="company-brand-caption">
                {name}<ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
    <div className="company-partnerships">
      <section className="company-partnership-panel company-trusted-partners" aria-labelledby="company-partners-title">
        <div>
          <h2 id="company-partners-title">Trusted partners</h2>
          {showMockPartners && <p className="company-brand-note">Mock logos for development</p>}
        </div>
        <ul className="company-partner-items">
          {partners.map(({ name, Mark }, index) => (
            <li key={name}>
              <div className="company-partner-mark" data-reveal="up" style={v({ "--rd": `${index * 85}ms` })}>
                <Mark size={30} strokeWidth={1.45} aria-hidden="true" />
                <span>{name}</span>
              </div>
            </li>
          ))}
        </ul>
        <Link className="tlink company-partnership-link" href="/contact">
          Partner with us<ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </section>
      <section className="company-partnership-panel company-private-labels" aria-labelledby="company-private-labels-title">
        <h2 id="company-private-labels-title">Private labels</h2>
        <ol className="company-label-steps">
          {privateLabelSteps.map(({ name, description, Icon }, index) => (
            <li key={name} data-reveal="up" style={v({ "--rd": `${index * 85}ms` })}>
              <span className="company-label-icon"><Icon size={25} strokeWidth={1.5} aria-hidden="true" /></span>
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link className="tlink company-partnership-link" href="/private-label">
          Explore private label services<ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </section>
    </div>
  </div>;
}
