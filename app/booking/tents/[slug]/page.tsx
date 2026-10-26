'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRentalBySlug } from '@/lib/cms/rentals';
import { unitPrice, activePromo } from '@/lib/pricing';
import type { Product } from '@/types/booking';

export default function TentDetailPage({
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
        const tent = await getRentalBySlug(slug);

        if (mounted) {
          setProduct(tent?.type === 'tent' ? tent : null);

          if (tent?.minimumQuantity) {
            setQuantity(tent.minimumQuantity);
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
      <main className="container reis-tent-detail">
        <section style={{ padding: '60px 0' }}>
          <p className="muted">Loading marquee...</p>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container">
        <section style={{ padding: '60px 0' }}>
          <div className="eyebrow">MARQUEES & TENTS</div>

          <h1>Tent not found</h1>

          <p className="muted">
            This marquee or tent may have been removed or is no longer
            available.
          </p>

          <div style={{ marginTop: 24 }}>
            <Link className="btn" href="/booking/tents">
              Back to Tents
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const tent = product;

  const minimum = tent.minimumQuantity ?? 1;

  const maximum =
    tent.maximumQuantity ??
    tent.quantityAvailable ??
    999999;

  const promo = activePromo(tent);
  const price = unitPrice(tent);
  const today = new Date();
  const minimumDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);

  function addToCart() {
    if (!eventDate) {
      setMessage('Please select your event date.');
      return;
    }

    if (eventDate < minimumDate) {
      setMessage('Please select today or a future event date.');
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < minimum ||
      quantity > maximum
    ) {
      setMessage(
        `Please choose a quantity between ${minimum} and ${maximum}.`
      );
      return;
    }

    const item = {
      productId: tent.id,
      name: tent.name,
      type: tent.type,
      quantity,
      unitPrice: price,
      promoDiscount: Math.max(0, tent.price - price) * quantity,
      total: price * quantity,
      eventDate,
      durationDays: 1,
      image: tent.image,
    };

    let existingCart: unknown[] = [];

    try {
      const storedCart = localStorage.getItem('reis-cart');
      const parsedCart: unknown = storedCart ? JSON.parse(storedCart) : [];

      if (Array.isArray(parsedCart)) {
        existingCart = parsedCart;
      }
    } catch {
      setMessage('Your saved cart could not be read. Please check your cart before continuing.');
      return;
    }

    localStorage.setItem(
      'reis-cart',
      JSON.stringify([...existingCart, item])
    );
    window.dispatchEvent(new Event('reis-cart-updated'));

    window.location.href = '/cart';
  }

  return (
    <main className="container reis-tent-detail">
      <section
        style={{
          padding: '48px 0 60px',
          maxWidth: 900,
        }}
      >
        <Link className="muted" href="/booking/tents">
          ← Back to Tents
        </Link>

        <div style={{ marginTop: 30 }}>
          <div className="eyebrow">MARQUEE / TENT</div>

          <h1>{tent.name}</h1>

          <p className="muted">
            {tent.description ||
              'Professional marquee and tent hire from REIS EVENT.'}
          </p>

          {tent.dimensions && (
            <p className="muted">
              Dimensions: {tent.dimensions}
            </p>
          )}

          {tent.capacity && (
            <p className="muted">
              Capacity: {tent.capacity}
            </p>
          )}

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
                Promotion active · regular £{tent.price.toFixed(2)}
              </p>
            )}

            <div style={{ marginTop: 28 }}>
              <label>
                Event date
                <input
                  type="date"
                  min={minimumDate}
                  value={eventDate}
                  onChange={(event) =>
                    setEventDate(event.target.value)
                  }
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

              {tent.quantityAvailable !== undefined && (
                <p className="muted">
                  Available quantity: {tent.quantityAvailable}
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
              Continue with this tent
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
