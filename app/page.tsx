"use client";

import { useEffect, useState } from "react";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
} from "@/lib/cms/homepage";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [content, setContent] =
    useState<HomepageContent>(defaultHomepageContent);

  useEffect(() => {
    getHomepageContent()
      .then(setContent)
      .catch((error) =>
        console.error("Failed to load homepage CMS content:", error)
      );
  }, []);

  const rentals = [
    [content.rental1Name, content.rental1Image],
    [content.rental2Name, content.rental2Image],
    [content.rental3Name, content.rental3Image],
    [content.rental4Name, content.rental4Image],
    [content.rental5Name, content.rental5Image],
    [content.rental6Name, content.rental6Image],
  ];

  const services = [
    [content.service1Title, content.service1Text],
    [content.service2Title, content.service2Text],
    [content.service3Title, content.service3Text],
  ];

  return (
    <main>
      <div className="announcement">
        {content.announcement}
      </div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label={`${content.brandName} home`}>
          {content.logoUrl ? (
            <img
              src={content.logoUrl}
              alt={content.brandName}
              className="brand-logo"
            />
          ) : (
            <span className="brand-mark">RIS</span>
          )}

          <span className="brand-copy">
            <strong>{content.brandName}</strong>
            <small>{content.brandSubtext}</small>
          </span>
        </a>

        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "nav open" : "nav"}>
              {content.navItems
                .filter((item) => item.visible)
                .map((item, index, visibleItems) => (
                  <a
                    key={item.id}
                    className={
                      index === visibleItems.length - 1
                        ? "nav-cta"
                        : undefined
                    }
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
            </nav>
      </header>

      <section id="home" className="hero">
        <div
          className="hero-image"
          style={{
            backgroundImage: `url("${content.heroImage}")`,
          }}
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="eyebrow light">{content.heroEyebrow}</p>

          <h1>{content.heroTitle}</h1>

          <p className="hero-text">{content.heroDescription}</p>

          <div className="hero-actions">
            <a className="button button-light" href="#rentals">
              {content.heroPrimaryCta}
            </a>

            <a className="text-link light-link" href="#contact">
              {content.heroSecondaryCta} <span>↗</span>
            </a>
          </div>
        </div>

        <div className="hero-note">{content.heroNote}</div>
      </section>

      <section id="rentals" className="section cream">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{content.featuredEyebrow}</p>
            <h2>{content.featuredTitle}</h2>
          </div>

          <p className="section-intro">
            {content.featuredDescription}
          </p>
        </div>

        <div className="category-grid">
          {rentals.map(([name, image], index) => (
            <a
              className={`category-card card-${index + 1}`}
              href="#contact"
              key={`${name}-${index}`}
            >
              <img src={image} alt={name} />
              <div className="category-shade" />

              <div className="category-content">
                <span>0{index + 1}</span>
                <h3>{name}</h3>
                <b>{content.rentalViewText}</b>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="services" className="dark-section">
        <div className="dark-intro">
          <p className="eyebrow light">{content.servicesEyebrow}</p>

          <h2>{content.servicesTitle}</h2>

          <p>{content.servicesDescription}</p>

          <a className="button button-outline" href="#contact">
            {content.servicesCta}
          </a>
        </div>

        <div className="service-list">
          {services.map(([title, text], index) => (
            <article className="service-item" key={title}>
              <span>0{index + 1}</span>

              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>

              <i>↗</i>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className="section work-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">{content.galleryEyebrow}</p>
            <h2>{content.galleryTitle}</h2>
          </div>

          <p className="section-intro">
            {content.galleryDescription}
          </p>
        </div>

        <div className="editorial-gallery">
          <div
            className="gallery-tall gallery-image g1"
            style={{ backgroundImage: `url("${content.gallery1Image}")` }}
          />
          <div
            className="gallery-image g2"
            style={{ backgroundImage: `url("${content.gallery2Image}")` }}
          />
          <div
            className="gallery-image g3"
            style={{ backgroundImage: `url("${content.gallery3Image}")` }}
          />
          <div
            className="gallery-image g4"
            style={{ backgroundImage: `url("${content.gallery4Image}")` }}
          />
          <div
            className="gallery-image g5"
            style={{ backgroundImage: `url("${content.gallery5Image}")` }}
          />
        </div>
      </section>

      <section id="about" className="about-section">
        <div
          className="about-image"
          style={{
            backgroundImage: `url("${content.aboutImage}")`,
          }}
        />

        <div className="about-copy">
          <p className="eyebrow">{content.aboutEyebrow}</p>

          <h2>{content.aboutTitle}</h2>

          <p>{content.aboutText1}</p>

          <p>{content.aboutText2}</p>

          <a className="text-link dark-link" href="#contact">
            {content.aboutCta} <span>↗</span>
          </a>
        </div>
      </section>

      <section id="contact" className="cta-section">
        <p className="eyebrow">{content.finalCtaEyebrow}</p>

        <h2>{content.finalCtaTitle}</h2>

        <p>{content.finalCtaDescription}</p>

        <div className="cta-actions">
          <a
            className="button button-dark"
            href={`tel:${content.phone1.replace(/\s/g, "")}`}
          >
            {content.finalCtaCall}
          </a>

          <a
            className="button button-dark"
            href={`https://wa.me/447470532855`}
            target="_blank"
            rel="noreferrer"
          >
            {content.finalCtaWhatsapp}
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          {content.logoUrl ? (
            <img
              src={content.logoUrl}
              alt={content.brandName}
              className="brand-logo"
            />
          ) : (
            <span className="brand-mark">RIS</span>
          )}

          <div>
            <strong>{content.brandName}</strong>
            <small>{content.brandSubtext}</small>
          </div>
        </div>

        <p>{content.footerTagline}</p>

        <div className="footer-contact">
          <a href={`tel:${content.phone1.replace(/\s/g, "")}`}>
            {content.phone1}
          </a>

          <a href={`tel:${content.phone2.replace(/\s/g, "")}`}>
            {content.phone2}
          </a>

          <span>{content.email}</span>
        </div>

        <div className="footer-bottom">
          <span>
            {content.footerYearPrefix} {new Date().getFullYear()}{" "}
            {content.copyrightName}
          </span>

          <span>{content.footerCategory}</span>
        </div>
      </footer>
    </main>
  );
}
