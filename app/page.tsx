"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
  type HomepageImageItem,
} from "@/lib/cms/homepage";

const galleryClasses = [
  "gallery-tall gallery-image g1",
  "gallery-image g2",
  "gallery-image g3",
  "gallery-image g4",
  "gallery-image g5",
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [content, setContent] =
    useState<HomepageContent>(defaultHomepageContent);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    getHomepageContent()
      .then((savedContent) => {
        if (active) setContent(savedContent);
      })
      .catch((error) => {
        console.error("Failed to load homepage CMS content:", error);

        if (active) setContent(defaultHomepageContent);
      })
      .finally(() => {
        if (active) setContentLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // Do not render the default hero before the saved CMS content is loaded.
  if (!contentLoaded) {
    return (
      <main className="homepage-loading" aria-busy="true">
        <div className="homepage-loading-mark">REIS</div>
        <div className="homepage-loading-line" />
        <p>Preparing something beautiful</p>
      </main>
    );
  }

  const visibleRentals = content.rentalCards.filter(
    (item) => item.visible && item.image.trim()
  );

  const visibleGallery = content.galleryItems.filter(
    (item) => item.visible && item.image.trim()
  );

  const services = [
    [content.service1Title, content.service1Text],
    [content.service2Title, content.service2Text],
    [content.service3Title, content.service3Text],
  ];

  const homepageStyle = {
    "--cream": content.palette.cream,
    "--paper": content.palette.paper,
    "--ink": content.palette.ink,
    "--muted": content.palette.muted,
    "--olive": content.palette.olive,
    "--footer": content.palette.footer,
    "--line": `color-mix(in srgb, ${content.palette.ink} 15%, transparent)`,
  } as CSSProperties;

  function renderImageCard(
    item: HomepageImageItem,
    index: number
  ) {
    const cardContent = (
      <>
        <img src={item.image} alt={item.alt || item.title} loading="lazy" />
        <div className="category-shade" />
        <div className="category-content">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{item.title}</h3>
          <b>{content.rentalViewText}</b>
        </div>
      </>
    );

    return (
      <a
        className={`category-card card-${index + 1}`}
        href={item.href || content.rentalsHref || "#contact"}
        key={item.id}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <main className="site-homepage" style={homepageStyle}>
      <div className="announcement">{content.announcement}</div>

      <header className="site-header">
        <a
          className="brand"
          href="#home"
          aria-label={`${content.brandName} home`}
        >
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
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
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
                  index === visibleItems.length - 1 ? "nav-cta" : undefined
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
            backgroundImage: content.heroImage
              ? `url("${content.heroImage}")`
              : "none",
          }}
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="eyebrow light">{content.heroEyebrow}</p>
          <h1>{content.heroTitle}</h1>
          <p className="hero-text">{content.heroDescription}</p>

          <div className="hero-actions">
            <a
              className="button button-light"
              href={content.heroPrimaryHref || "/explore"}
            >
              {content.heroPrimaryCta}
            </a>

            <a
              className="text-link light-link"
              href={content.heroSecondaryHref || "#contact"}
            >
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

          <p className="section-intro">{content.featuredDescription}</p>
        </div>

        {visibleRentals.length > 0 ? (
          <div className="category-grid">
            {visibleRentals.map((item, index) =>
              renderImageCard(item, index)
            )}
          </div>
        ) : (
          <p className="homepage-empty-message">
            Our rental collection is being prepared. Please check back soon.
          </p>
        )}
      </section>

      <section id="services" className="dark-section">
        <div className="dark-intro">
          <p className="eyebrow light">{content.servicesEyebrow}</p>
          <h2>{content.servicesTitle}</h2>
          <p>{content.servicesDescription}</p>

          <a
            className="button button-outline"
            href={content.servicesCtaHref || "#contact"}
          >
            {content.servicesCta}
          </a>
        </div>

        <div className="service-list">
          {services.map(([title, text], index) => (
            <article className="service-item" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>

              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>

              <i aria-hidden="true">↗</i>
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

          <p className="section-intro">{content.galleryDescription}</p>
        </div>

        {visibleGallery.length > 0 ? (
          <div className="editorial-gallery">
            {visibleGallery.map((item, index) => {
              const className =
                galleryClasses[index % galleryClasses.length];

              const layoutClasses = className
                .split(" ")
                .filter((name) => name !== "gallery-image")
                .join(" ");

              const image = (
                <div
                  className="gallery-image"
                  role="img"
                  aria-label={item.alt || item.title}
                  style={{
                    backgroundImage: `url("${item.image}")`,
                  }}
                />
              );

              return item.href.trim() ? (
                <a
                  className={`gallery-link ${layoutClasses}`}
                  href={item.href}
                  key={item.id}
                  aria-label={`View ${item.title}`}
                >
                  {image}
                </a>
              ) : (
                <div
                  className={`gallery-static ${layoutClasses}`}
                  key={item.id}
                >
                  {image}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="homepage-empty-message">
            Our event gallery will be available soon.
          </p>
        )}
      </section>

      <section id="about" className="about-section">
        <div
          className="about-image"
          style={{
            backgroundImage: content.aboutImage
              ? `url("${content.aboutImage}")`
              : "none",
          }}
          role="img"
          aria-label="REIS event styling"
        />

        <div className="about-copy">
          <p className="eyebrow">{content.aboutEyebrow}</p>
          <h2>{content.aboutTitle}</h2>
          <p>{content.aboutText1}</p>
          <p>{content.aboutText2}</p>

          <a
            className="text-link dark-link"
            href={content.aboutCtaHref || "#contact"}
          >
            {content.aboutCta} <span>↗</span>
          </a>
        </div>
      </section>

      <section
        id="contact"
        className="cta-section"
        style={
          content.homepageGradient.enabled &&
          content.homepageGradient.mode === "gradient" &&
          content.homepageGradient.target === "cta"
            ? { background: `linear-gradient(${content.homepageGradient.direction}, ${content.homepageGradient.start}, ${content.homepageGradient.end})` }
            : undefined
        }
      >
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
            href="https://wa.me/447470532855"
            target="_blank"
            rel="noreferrer"
          >
            {content.finalCtaWhatsapp}
          </a>
        </div>
      </section>

      <footer
        className="footer"
        style={
          content.homepageGradient.enabled &&
          content.homepageGradient.mode === "gradient" &&
          content.homepageGradient.target === "footer"
            ? { background: `linear-gradient(${content.homepageGradient.direction}, ${content.homepageGradient.start}, ${content.homepageGradient.end})` }
            : undefined
        }
      >
        {content.footerImage.trim() && (
          <div className="footer-image-wrap">
            <img
              className="footer-image"
              src={content.footerImage}
              alt={`${content.brandName} event styling`}
              loading="lazy"
            />
          </div>
        )}

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
          <a href={`mailto:${content.email}`}>{content.email}</a>
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
