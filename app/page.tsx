"use client";

import { useState } from "react";

const categories = [
  { name: "Marquee", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85" },
  { name: "Foldable Chairs", image: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85" },
  { name: "Chiavari Chairs", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85" },
  { name: "Tables", image: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85" },
  { name: "Arches & Florals", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85" },
  { name: "Catering Hire", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85" },
];

const services = [
  { title: "Event Rentals", text: "Thoughtfully selected pieces for weddings, celebrations and memorable gatherings." },
  { title: "Event Styling", text: "Bring your vision together with coordinated furniture, décor, florals and finishing details." },
  { title: "Event Essentials", text: "From cooking equipment and tableware to marquees and covers, hire what your occasion needs." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main>
      <div className="announcement">Event rentals & styling across the UK <span>✦</span> We style your event, You create memories!</div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label="Reis Invent Service home">
          <span className="brand-mark">RIS</span>
          <span className="brand-copy">
            <strong>REIS INVENT</strong>
            <small>SERVICE</small>
          </span>
        </a>

        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#rentals" onClick={() => setMenuOpen(false)}>Rentals</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#work" onClick={() => setMenuOpen(false)}>Our Work</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>Talk to us</a>
        </nav>
      </header>

      <section id="home" className="hero">
        <div className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow light">EVENT RENTALS · STYLING · DETAILS</p>
          <h1>We style your event.<br /><em>You create memories.</em></h1>
          <p className="hero-text">
            Beautifully considered rentals and event essentials for celebrations
            that deserve to feel unforgettable.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#rentals">Explore rentals</a>
            <a className="text-link light-link" href="#contact">Talk to us <span>↗</span></a>
          </div>
        </div>
        <div className="hero-note">CURATED FOR YOUR MOMENT</div>
      </section>

      <section id="rentals" className="section cream">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>Everything your<br /><em>event needs.</em></h2>
          </div>
          <p className="section-intro">
            Explore a growing collection of event furniture, décor, catering
            essentials and finishing touches. Our catalogue will be fully
            managed from the Reis Invent admin studio.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <a className={`category-card card-${index + 1}`} href="#contact" key={category.name}>
              <img src={category.image} alt="" />
              <div className="category-shade" />
              <div className="category-content">
                <span>0{index + 1}</span>
                <h3>{category.name}</h3>
                <b>View collection ↗</b>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="services" className="dark-section">
        <div className="dark-intro">
          <p className="eyebrow light">THE REIS INVENT APPROACH</p>
          <h2>Beautiful details.<br /><em>Thoughtfully arranged.</em></h2>
          <p>
            Whether you are planning an intimate celebration or a larger event,
            we help you create an atmosphere your guests will remember.
          </p>
          <a className="button button-outline" href="#contact">Start planning</a>
        </div>

        <div className="service-list">
          {services.map((service, index) => (
            <article className="service-item" key={service.title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
              <i>↗</i>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className="section work-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">OUR WORK</p>
            <h2>Moments, <em>beautifully set.</em></h2>
          </div>
          <p className="section-intro">A place for the owner to showcase real events, styled tablescapes, furniture and décor. This gallery will later be controlled completely from the CMS.</p>
        </div>

        <div className="editorial-gallery">
          <div className="gallery-tall gallery-image g1" />
          <div className="gallery-image g2" />
          <div className="gallery-image g3" />
          <div className="gallery-image g4" />
          <div className="gallery-image g5" />
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-image" />
        <div className="about-copy">
          <p className="eyebrow">ABOUT REIS INVENT</p>
          <h2>Set the scene.<br /><em>Make it yours.</em></h2>
          <p>
            Reis Invent Service is being designed around one simple idea:
            event hire should feel as considered as the event itself.
          </p>
          <p>
            From furniture and table settings to florals, marquees and
            catering essentials, the collection will grow with the needs of
            the business.
          </p>
          <a className="text-link dark-link" href="#contact">Discover more <span>↗</span></a>
        </div>
      </section>

      <section id="contact" className="cta-section">
        <p className="eyebrow">LET&apos;S CREATE SOMETHING BEAUTIFUL</p>
        <h2>Ready to style<br /><em>your event?</em></h2>
        <p>Tell us what you are planning and let&apos;s make the details memorable.</p>
        <div className="cta-actions">
          <a className="button button-dark" href="tel:07470532855">Call us</a>
          <a className="button button-dark" href="https://wa.me/447470532855" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark">RIS</span>
          <div>
            <strong>REIS INVENT</strong>
            <small>SERVICE</small>
          </div>
        </div>
        <p>We style your event, You create memories!</p>
        <div className="footer-contact">
          <a href="tel:07470532855">07470 532855</a>
          <a href="tel:07961399636">07961 399636</a>
          <span>Mhiz services@gmail.com</span>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Reis Invent Service</span>
          <span>Event rentals & styling</span>
        </div>
      </footer>
    </main>
  );
}