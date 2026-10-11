import Link from "next/link";
import type { Product } from "@/types/booking";
import { activePromo, unitPrice } from "@/lib/pricing";

export default function ProductCard({ p }: { p: Product }) {
  const promo = activePromo(p);
  const image = p.image || p.images?.[0];

  return (
    <article className="card reis-product-card">
      <Link className="reis-product-photo" href={p.type === "tent" ? `/booking/tents/${p.slug}` : `/booking/rentals/${p.slug}`} aria-label={`View ${p.name}`}>
        {image
          ? <img src={image} alt={p.name} loading="lazy" />
          : <span className="reis-product-no-image">REIS EVENT</span>}
        {p.featured && <span className="reis-product-featured">Featured</span>}
      </Link>
      <div className="reis-product-body">
        <p className="eyebrow">{p.type === "tent" ? "MARQUEES & TENTS" : "EVENT RENTAL"}</p>
        <h2><Link href={p.type === "tent" ? `/booking/tents/${p.slug}` : `/booking/rentals/${p.slug}`}>{p.name}</Link></h2>
        <p className="reis-product-description">{p.description}</p>
        <div className="reis-product-bottom">
          <div className="reis-product-price">
            <strong>{new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(unitPrice(p))}</strong>
            <small>per item</small>
            {promo && <del>{new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p.price)}</del>}
          </div>
          <Link className="reis-product-link" href={p.type === "tent" ? `/booking/tents/${p.slug}` : `/booking/rentals/${p.slug}`} aria-label={`View ${p.name}`}>View item <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}
