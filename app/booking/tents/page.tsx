import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getActiveRentals } from '@/lib/cms/rentals';

export const dynamic = 'force-dynamic';

export default async function TentsPage() {
  const rentals = await getActiveRentals();
  const tents = rentals.filter((product) => product.type === 'tent');

  return (
    <main className="container">
      <header style={{ padding: '48px 0 28px' }}>
        <div className="eyebrow">MARQUEES & TENTS</div>

        <h1>Choose your tent</h1>

        <p className="muted">
          Select a marquee or tent. After it enters your booking,
          we can collect the site photographs, measurements and
          installation details required for your event.
        </p>

        <div style={{ marginTop: 20 }}>
          <Link className="btn" href="/booking">
            Back to Booking
          </Link>
        </div>
      </header>

      {tents.length === 0 ? (
        <section style={{ padding: '40px 0 60px' }}>
          <p className="muted">
            No marquee or tent products are currently available.
          </p>
        </section>
      ) : (
        <section
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            paddingBottom: 60,
          }}
        >
          {tents.map((tent) => (
            <ProductCard key={tent.id} p={tent} />
          ))}
        </section>
      )}
    </main>
  );
}
