"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
  type HomepageImageItem,
} from "@/lib/cms/homepage";

function getSocialHref(platform: string, value: string): string {
  const destination = value.trim();

  if (!destination) return "";

  if (platform === "phone") {
    const number = destination.replace(/[^+\d]/g, "");
    return number ? `tel:${number}` : "";
  }

  if (platform === "email") {
    if (!destination.includes("@") || /\s/.test(destination)) return "";
    return `mailto:${destination}`;
  }

  if (platform === "whatsapp") {
    if (/^https?:\/\//i.test(destination)) return destination;
    const number = destination.replace(/\D/g, "");
    return number ? `https://wa.me/${number}` : "";
  }

  return /^https?:\/\//i.test(destination)
    ? destination
    : `https://${destination}`;
}


function SocialIcon({ platform }: { platform: string }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "currentColor",
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.2" />
        </svg>
      );

    case "facebook":
      return (
        <svg {...common}>
          <path d="M13.5 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5V10H7v3h2.8v8z" />
        </svg>
      );

    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.1Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.1 7.5c-.3.4-.6.9-.6 1.5 0 2.4 3.1 5.6 5.7 6.5.8.3 1.5.2 2-.3l.8-1.1-2.3-1.1-.8.9c-1.1-.5-2.1-1.4-2.7-2.5l.8-.9-1.1-2.3z" />
        </svg>
      );

    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 3h3c.2 2 1.3 3.5 3 4.2v3.1a8.5 8.5 0 0 1-3-1v6.2a5.7 5.7 0 1 1-5.7-5.7c.4 0 .8 0 1.2.1V13a2.7 2.7 0 1 0 1.5 2.5z" />
        </svg>
      );

    case "youtube":
      return (
        <svg {...common}>
          <path d="M23 7.1a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.5 15.5v-7l6 3.5z" />
        </svg>
      );

    case "linkedin":
      return (
        <svg {...common}>
          <path d="M5.2 8.5A1.9 1.9 0 1 0 5.2 4.7a1.9 1.9 0 0 0 0 3.8ZM3.5 10h3.4v10.5H3.5zM9 10h3.3v1.4h.1a3.6 3.6 0 0 1 3.2-1.7c3.4 0 4 2.2 4 5v5.8h-3.4v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9z" />
        </svg>
      );

    case "pinterest":
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.7l1.3-5.5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.6 2 1.7 2 2 0 3.4-2.5 3.4-5.4 0-2.2-1.5-3.9-4.2-3.9-3.1 0-5 2.3-5 4.8 0 .9.3 1.8.8 2.3.2.2.2.4.2.7l-.3 1.1c0 .3-.3.4-.6.3-1.5-.6-2.2-2.2-2.2-4 0-3 2.5-6.6 7.6-6.6 4.1 0 6.8 3 6.8 6.2 0 4.3-2.4 7.5-5.9 7.5-1.2 0-2.3-.7-2.7-1.4l-.8 3a9.7 9.7 0 0 1-1.4 2.5A10 10 0 1 0 12 2Z" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-7-6.1 7H2.9l7.3-8.4L2 2h6.3l4.4 6.5ZM17.8 20h1.7L7.3 3.9H5.5Z" />
        </svg>
      );

    case "email":
      return (
        <svg {...common}>
          <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 8L4 7v10h16V7Zm0-2 7-4H5Z" />
        </svg>
      );

    case "phone":
      return (
        <svg {...common}>
          <path d="M6.6 2h3l1.5 5-2 1.5a15 15 0 0 0 6.4 6.4l1.5-2 5 1.5v3c0 1.1-.9 2-2 2C10 19.4 4.6 14 4.6 7c0-1.1.9-2 2-2Z" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14zM5 5h6v2H5v12h12v-6h2v8H3V5z" />
        </svg>
      );
  }
}

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

  // Keep the loading screen logo-only while CMS content loads.
  if (!contentLoaded) {
    return (
      <main className="homepage-loading" aria-busy="true">
        <img
          src="/api/pwa/icon?size=192"
          alt=""
          className="homepage-loading-logo"
        />
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
        href="/shop"
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
              href="/shop"
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

      <section className="social-section" id="social">
        <div className="social-section-heading">
          <p className="eyebrow">STAY CONNECTED</p>
          <h2>Connect with REIS</h2>
          <p>Follow our channels or get in touch with our team.</p>
        </div>

        <div className="social-links">
          {content.socialLinks
            .filter(
              (item) =>
                item.visible &&
                (item.placement === "landing" || item.placement === "both")
            )
            .map((item) => {
              const href = getSocialHref(item.platform, item.url);
              if (!href) return null;

              const external = !["phone", "email"].includes(item.platform);

              return (
                <a
                  key={item.id}
                  className={`social-link social-${item.style}`}
                  data-platform={item.platform}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                >
                  {item.style !== "text" && <SocialIcon platform={item.platform} />}
                  {item.style !== "logo" && item.style !== "icon" && (
                    <span>{item.label}</span>
                  )}
                </a>
              );
            })}
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
          {(() => {
            const phone = content.socialLinks.find(
              (item) => item.visible && item.platform === "phone"
            );
            const href = phone ? getSocialHref(phone.platform, phone.url) : "";

            return href ? (
              <a className="button button-dark" href={href}>
                {content.finalCtaCall}
              </a>
            ) : null;
          })()}

          {(() => {
            const whatsapp = content.socialLinks.find(
              (item) => item.visible && item.platform === "whatsapp"
            );
            const href = whatsapp
              ? getSocialHref(whatsapp.platform, whatsapp.url)
              : "";

            return href ? (
              <a
                className="button button-dark"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.finalCtaWhatsapp}
              </a>
            ) : null;
          })()}
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
          {content.socialLinks
            .filter(
              (item) =>
                item.visible &&
                (item.placement === "footer" || item.placement === "both")
            )
            .map((item) => {
              const href = getSocialHref(item.platform, item.url);
              if (!href) return null;

              const external = !["phone", "email"].includes(item.platform);

              return (
                <a
                  key={item.id}
                  className={`social-link social-${item.style}`}
                  data-platform={item.platform}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                >
                  {item.style !== "text" && <SocialIcon platform={item.platform} />}
                  {item.style !== "logo" && item.style !== "icon" && (
                    <span>{item.label}</span>
                  )}
                </a>
              );
            })}
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
