import Link from "next/link";

const shoppingPaths = [
  {
    number: "01",
    title: "Event Rentals",
    subtitle: "The details that make the difference.",
    description:
      "Discover elegant tableware, furniture, decorative pieces, flowers and event essentials to bring your celebration together.",
    image: "/images/commerce-rentals.jpg",
    href: "/booking/rentals",
    action: "Explore rentals",
  },
  {
    number: "02",
    title: "Tents & Marquees",
    subtitle: "Room for every kind of celebration.",
    description:
      "Explore tent and marquee options for weddings, private parties, corporate occasions and outdoor gatherings.",
    image: "/images/commerce-tents.jpg",
    href: "/booking/tents",
    action: "Discover tents",
  },
  {
    number: "03",
    title: "Portfolio",
    subtitle: "A glimpse of celebrations we've helped create.",
    description:
      "Explore our event styling and previous work.",
    image: "/images/commerce-styling.jpg",
    href: "/#work",
    action: "Explore our work",
  },
];

export default function ShopPage() {
  return (
    <main className="reis-shop">
      <section className="reis-shop-hero">
        <div className="reis-shop-hero-content">
          <span className="reis-shop-eyebrow">
            REIS EVENT SERVICES
          </span>

          <h1>
            Thoughtfully chosen.
            <br />
            Beautifully celebrated.
          </h1>

          <p>
            From the finishing touches to the setting itself, discover
            everything you need to create an occasion worth remembering.
          </p>

          <Link
            href="#collections"
            className="reis-shop-primary-button"
          >
            Explore our services <span aria-hidden="true">↗</span>
          </Link>

          <div className="reis-shop-hero-note">
            We style your event, You create memories!
          </div>
        </div>

        <div className="reis-shop-hero-art" aria-hidden="true">
          <div className="reis-shop-art-frame">
            <span className="reis-shop-art-top">THE ART OF GATHERING</span>

            <div className="reis-shop-art-center">
              <span>Make</span>
              <span>it</span>
              <span>memorable.</span>
            </div>

            <span className="reis-shop-art-bottom">
              DETAILS · ATMOSPHERE · MEMORIES
            </span>
          </div>
        </div>
      </section>

      <section
        className="reis-shop-introduction"
        id="collections"
      >
        <span className="reis-shop-eyebrow">THE REIS EXPERIENCE</span>

        <h2>
          Every occasion deserves
          <br />
          a considered touch.
        </h2>

        <p>
          Whether you are planning an intimate gathering or a grand
          celebration, find the right pieces and services to bring your
          ideas to life.
        </p>
      </section>

      <section className="reis-shop-triangle" aria-label="Explore REIS">
        <div className="reis-shop-triangle-heading">
          <span className="reis-shop-eyebrow">EXPLORE REIS</span>
          <h2>Choose your experience.</h2>
          <p>Select a circle to continue.</p>
        </div>

        <div className="reis-shop-triangle-diagram">
          <svg
            className="reis-shop-triangle-lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="50" y1="17" x2="25" y2="72" />
            <line x1="50" y1="17" x2="75" y2="72" />
            <line x1="25" y1="72" x2="75" y2="72" />
          </svg>

          {shoppingPaths.map((item, index) => (
            <Link
              key={item.number}
              href={item.href}
              className={`reis-shop-triangle-node reis-shop-triangle-node-${index + 1}`}
              aria-label={`Explore ${item.title}`}
            >
              <span className="reis-shop-node-number">{item.number}</span>
              <span className="reis-shop-node-title">{item.title}</span>
              <span className="reis-shop-node-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="reis-shop-closing">
        <span className="reis-shop-eyebrow">LET'S CREATE SOMETHING SPECIAL</span>

        <h2>
          Your occasion.
          <br />
          Your vision.
          <br />
          Our attention to detail.
        </h2>

        <p>
          Tell us what you are planning, and let us help you make it
          memorable.
        </p>

        <Link
          href="/booking/styling"
          className="reis-shop-primary-button"
        >
          Start planning <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <style>{`
        .reis-shop {
          --shop-bg: var(--cream, #f3f0ea);
          --shop-paper: var(--paper, #faf9f6);
          --shop-ink: var(--ink, #161614);
          --shop-muted: var(--muted, #77756e);
          --shop-accent: var(--olive, #68765b);
          background: var(--shop-bg);
          color: var(--shop-ink);
          font-family: var(--sans, Arial, sans-serif);
        }

        .reis-shop * {
          box-sizing: border-box;
        }

        .reis-shop-hero {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          min-height: 610px;
          padding: 72px 7%;
          gap: 55px;
          align-items: center;
        }

        .reis-shop-hero-content {
          max-width: 610px;
          padding: 20px 0;
        }

        .reis-shop-eyebrow {
          display: block;
          font-size: 10px;
          letter-spacing: 0.2em;
          line-height: 1.8;
          text-transform: uppercase;
          color: var(--shop-accent);
        }

        .reis-shop-hero h1,
        .reis-shop-introduction h2,
        .reis-shop-collection h3,
        .reis-shop-closing h2 {
          font-family: var(--serif, Georgia, serif);
          font-weight: 400;
          letter-spacing: -0.035em;
        }

        .reis-shop-hero h1 {
          margin: 25px 0;
          font-size: clamp(42px, 5.4vw, 76px);
          line-height: 0.99;
        }

        .reis-shop-hero-content > p {
          max-width: 450px;
          color: var(--shop-muted);
          font-size: 14px;
          line-height: 1.9;
        }

        .reis-shop-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          margin-top: 22px;
          padding: 16px 21px;
          background: var(--shop-ink);
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.04em;
          transition: background 180ms ease;
        }

        .reis-shop-primary-button:hover {
          background: var(--shop-accent);
        }

        .reis-shop-hero-note {
          margin-top: 38px;
          color: var(--shop-muted);
          font-family: var(--serif, Georgia, serif);
          font-size: 17px;
          font-style: italic;
        }

        .reis-shop-hero-art {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 440px;
          padding: 25px;
          background: #e5e1d7;
        }

        .reis-shop-art-frame {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 410px;
          min-height: 390px;
          padding: 25px 15px;
          border: 1px solid rgba(22, 22, 20, 0.35);
          text-align: center;
        }

        .reis-shop-art-top,
        .reis-shop-art-bottom {
          font-size: 9px;
          letter-spacing: 0.18em;
        }

        .reis-shop-art-center {
          display: flex;
          flex-direction: column;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(48px, 6vw, 76px);
          line-height: 0.95;
        }

        .reis-shop-art-center span:nth-child(2) {
          font-style: italic;
        }

        .reis-shop-art-center span:nth-child(3) {
          font-size: 0.65em;
        }

        .reis-shop-introduction {
          padding: 90px 24px 65px;
          text-align: center;
        }

        .reis-shop-introduction h2,
        .reis-shop-closing h2 {
          margin: 20px 0;
          font-size: clamp(36px, 4.5vw, 57px);
          line-height: 1.04;
        }

        .reis-shop-introduction > p,
        .reis-shop-closing > p {
          max-width: 510px;
          margin: 0 auto;
          color: var(--shop-muted);
          font-size: 13px;
          line-height: 1.9;
        }

        .reis-shop-collections {
          padding: 10px 7% 90px;
        }

        .reis-shop-collection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 9%;
          padding: 40px 0;
          border-bottom: 1px solid var(--line, rgba(22, 22, 20, 0.15));
        }

        .reis-shop-collection:nth-child(even) .reis-shop-collection-image {
          order: 2;
        }

        .reis-shop-collection-image {
          min-height: 320px;
          background: #e5e1d7;
        }

        .reis-shop-image-placeholder {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 320px;
          padding: 24px;
          border: 1px solid rgba(22, 22, 20, 0.12);
        }

        .reis-shop-image-placeholder > span {
          font-size: 11px;
          letter-spacing: 0.15em;
        }

        .reis-shop-image-placeholder > p {
          margin: 0;
          font-family: var(--serif, Georgia, serif);
          font-size: 35px;
        }

        .reis-shop-collection-content {
          max-width: 440px;
          padding: 25px 0;
        }

        .reis-shop-collection h3 {
          margin: 15px 0;
          font-size: clamp(35px, 4vw, 49px);
          line-height: 1.05;
        }

        .reis-shop-collection-content > p {
          color: var(--shop-muted);
          font-size: 13px;
          line-height: 1.9;
        }

        .reis-shop-text-link {
          display: inline-flex;
          align-items: center;
          gap: 22px;
          margin-top: 18px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--shop-accent);
          color: var(--shop-ink);
          text-decoration: none;
          font-size: 11px;
        }

        .reis-shop-closing {
          padding: 95px 24px 110px;
          background: #e5e1d7;
          text-align: center;
        }

        .reis-shop-closing .reis-shop-primary-button {
          margin-top: 28px;
        }

        @media (max-width: 760px) {
          .reis-shop-hero {
            grid-template-columns: 1fr;
            min-height: auto;
            gap: 35px;
            padding: 60px 6% 40px;
          }

          .reis-shop-hero h1 {
            font-size: clamp(43px, 12vw, 65px);
          }

          .reis-shop-hero-art {
            min-height: 340px;
            padding: 18px;
          }

          .reis-shop-art-frame {
            min-height: 305px;
          }

          .reis-shop-art-center {
            font-size: 58px;
          }

          .reis-shop-introduction {
            padding: 70px 22px 40px;
          }

          .reis-shop-collections {
            padding: 10px 6% 65px;
          }

          .reis-shop-collection {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 25px 0 35px;
          }

          .reis-shop-collection:nth-child(even) .reis-shop-collection-image {
            order: 0;
          }

          .reis-shop-collection-image,
          .reis-shop-image-placeholder {
            min-height: 260px;
          }

          .reis-shop-collection-content {
            padding: 18px 0 5px;
          }

          .reis-shop-closing {
            padding: 75px 22px 85px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reis-shop-primary-button {
            transition: none;
          }
        }
        .reis-shop-triangle {
          padding: 38px 20px 76px;
          overflow: hidden;
        }

        .reis-shop-triangle-heading {
          text-align: center;
          margin: 0 auto 20px;
        }

        .reis-shop-triangle-heading h2 {
          margin: 12px 0 8px;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(30px, 4vw, 46px);
          font-weight: 400;
          letter-spacing: -0.035em;
        }

        .reis-shop-triangle-heading p {
          margin: 0;
          color: var(--shop-muted);
          font-size: 14px;
        }

        .reis-shop-triangle-diagram {
          position: relative;
          width: min(100%, 820px);
          height: clamp(350px, 43vw, 460px);
          margin: 0 auto;
        }

        .reis-shop-triangle-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }

        .reis-shop-triangle-lines line {
          stroke: var(--shop-accent);
          stroke-width: 0.35;
          vector-effect: non-scaling-stroke;
          opacity: 0.8;
        }

        .reis-shop-triangle-node {
          position: absolute;
          z-index: 1;
          width: clamp(108px, 18vw, 158px);
          aspect-ratio: 1;
          border: 1px solid var(--shop-accent);
          border-radius: 50%;
          background: var(--shop-paper);
          color: var(--shop-ink);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 12px;
          text-align: center;
          text-decoration: none;
          box-shadow: 0 8px 24px rgb(22 22 20 / 7%);
          transition: background 180ms ease, color 180ms ease,
            transform 180ms ease, box-shadow 180ms ease;
        }

        .reis-shop-triangle-node-1 {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }

        .reis-shop-triangle-node-2 {
          top: 55%;
          left: 25%;
          transform: translate(-50%, -50%);
        }

        .reis-shop-triangle-node-3 {
          top: 55%;
          left: 75%;
          transform: translate(-50%, -50%);
        }

        .reis-shop-node-number {
          font-size: 10px;
          letter-spacing: 0.16em;
          color: var(--shop-accent);
        }

        .reis-shop-node-title {
          max-width: 120px;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(14px, 1.8vw, 19px);
          line-height: 1.15;
        }

        .reis-shop-node-arrow {
          font-size: 16px;
          line-height: 1;
          color: var(--shop-accent);
        }

        .reis-shop-triangle-node:hover,
        .reis-shop-triangle-node:focus-visible {
          background: var(--shop-accent);
          color: #fff;
          box-shadow: 0 14px 30px rgb(22 22 20 / 14%);
        }

        .reis-shop-triangle-node:hover .reis-shop-node-number,
        .reis-shop-triangle-node:hover .reis-shop-node-arrow,
        .reis-shop-triangle-node:focus-visible .reis-shop-node-number,
        .reis-shop-triangle-node:focus-visible .reis-shop-node-arrow {
          color: #fff;
        }

        .reis-shop-triangle-node-1:hover,
        .reis-shop-triangle-node-1:focus-visible {
          transform: translateX(-50%) scale(1.04);
        }

        .reis-shop-triangle-node-2:hover,
        .reis-shop-triangle-node-2:focus-visible,
        .reis-shop-triangle-node-3:hover,
        .reis-shop-triangle-node-3:focus-visible {
          transform: translate(-50%, -50%) scale(1.04);
        }

        @media (max-width: 480px) {
          .reis-shop-triangle {
            padding: 28px 12px 48px;
          }

          .reis-shop-triangle-diagram {
            height: 340px;
          }

          .reis-shop-triangle-node {
            width: clamp(100px, 31vw, 124px);
            padding: 9px;
            gap: 6px;
          }

          .reis-shop-node-title {
            font-size: 14px;
          }

          .reis-shop-triangle-node-2,
          .reis-shop-triangle-node-3 {
            top: 57%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reis-shop-triangle-node {
            transition: none;
          }
        }
      `}
      </style>
    </main>
  );
}
