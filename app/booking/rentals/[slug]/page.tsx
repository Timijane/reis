'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRentalBySlug } from '@/lib/cms/rentals';
import { unitPrice, activePromo } from '@/lib/pricing';
import type { Product } from '@/types/booking';

export default function RentalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventDate, setEventDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    params.then(async ({ slug }) => {
      try {
        const rental = await getRentalBySlug(slug);

        if (mounted) {
          setProduct(rental);
          if (rental?.minimumQuantity) {
            setQuantity(rental.minimumQuantity);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="container">
        <section style={{ padding: '60px 0' }}>
          <p className="muted">Loading rental...</p>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container">
        <section style={{ padding: '60px 0' }}>
          <div className="eyebrow">REIS EVENT</div>
          <h1>Rental not found</h1>
          <p className="muted">
            This rental item may have been removed or is no longer available.
          </p>

          <div style={{ marginTop: 24 }}>
            <Link className="btn" href="/booking/rentals">
              Back to Rentals
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const rental = product;

  const minimum = rental.minimumQuantity ?? 1;
  const maximum =
    rental.maximumQuantity ??
    rental.quantityAvailable ??
    999999;

  const promo = activePromo(rental);
  const price = unitPrice(rental);

  function addToCart() {
    if (!eventDate) {
      setMessage('Please select your event date.');
      return;
    }

    if (quantity < minimum || quantity > maximum) {
      setMessage(
        `Please choose a quantity between ${minimum} and ${maximum}.`
      );
      return;
    }

    const item = {
      productId: rental.id,
      name: rental.name,
      type: rental.type,
      quantity,
      unitPrice: price,
      promoDiscount: Math.max(0, rental.price - price) * quantity,
      total: price * quantity,
      eventDate,
      durationDays: 1,
      image: rental.image,
    };

    localStorage.setItem(
      'reis-cart',
      JSON.stringify([item])
    );

    window.location.href = '/cart';
  }

  return (
    <main className="container">
      <section
        style={{
          padding: '48px 0 60px',
          maxWidth: 900,
        }}
      >
        <Link className="muted" href="/booking/rentals">
          ← Back to Rentals
        </Link>

        <div style={{ marginTop: 30 }}>
          <div className="eyebrow">RENTAL</div>

          <h1>{rental.name}</h1>

          <p className="muted">
            {rental.description || 'Quality event rental from REIS EVENT.'}
          </p>

          <div
            style={{
              marginTop: 24,
              padding: 24,
              border: '1px solid rgba(0,0,0,.12)',
            }}
          >
            <div className="price">
              £{price.toFixed(2)}{' '}
              <small className="muted">/ item</small>
            </div>

            {promo && (
              <p className="muted">
                Promotion active · regular £{rental.price.toFixed(2)}
              </p>
            )}

            <div style={{ marginTop: 28 }}>
              <label>
                Event date
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 360,
                    marginTop: 8,
                    padding: 12,
                  }}
                />
              </label>
            </div>

            <div style={{ marginTop: 20 }}>
              <label>
                Quantity
                <input
                  type="number"
                  min={minimum}
                  max={maximum}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Number(event.target.value))
                  }
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 160,
                    marginTop: 8,
                    padding: 12,
                  }}
                />
              </label>

              {rental.quantityAvailable !== undefined && (
                <p className="muted">
                  Available quantity: {rental.quantityAvailable}
                </p>
              )}
            </div>

            {message && (
              <p
                style={{
                  marginTop: 20,
                  fontWeight: 600,
                }}
              >
                {message}
              </p>
            )}

            <button
              type="button"
              className="btn"
              onClick={addToCart}
              style={{ marginTop: 24 }}
            >
              Add to booking
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
