import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getActiveRentals } from '@/lib/cms/rentals';

export const dynamic = 'force-dynamic';

export default async function RentalsPage() {
  const rentals = await getActiveRentals();

  return (
    <main className="container">
      <header style={{ padding: '48px 0 28px' }}>
        <div className="eyebrow">REIS EVENT</div>
        <h1>Event Rentals</h1>
        <p className="muted">
          Browse our event rental collection and choose what you need for your
          occasion.
        </p>

        <div style={{ marginTop: 20 }}>
          <Link className="btn" href="/booking">
            Back to Booking
          </Link>
        </div>
      </header>

      {rentals.length === 0 ? (
        <section style={{ padding: '40px 0' }}>
          <p className="muted">
            No rental items are currently available.
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
          {rentals.map((rental) => (
            <ProductCard key={rental.id} p={rental} />
          ))}
        </section>
      )}
    </main>
  );
}
