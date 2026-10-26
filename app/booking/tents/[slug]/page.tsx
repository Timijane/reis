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
      <section className="reis-tent-page">
        <nav className="reis-tent-breadcrumb" aria-label="Breadcrumb">
          <Link href="/booking/tents">← Back to Tents</Link>
          <span>REIS EVENT SERVICES</span>
        </nav>

        <header className="reis-tent-heading">
          <p className="eyebrow">MARQUEES &amp; TENTS</p>
          <h1>{tent.name}</h1>
          <p className="reis-tent-description">
            {tent.description ||
              'Professional marquee and tent hire from REIS EVENT.'}
          </p>
        </header>

        <div className="reis-tent-booking-layout">
          <div className="reis-tent-product-panel">
            {tent.image ? (
              <div className="reis-tent-image-wrap">
                <img
                  className="reis-tent-product-image"
                  src={tent.image}
                  alt={tent.name}
                />
              </div>
            ) : (
              <div className="reis-tent-image-placeholder">
                <span>REIS EVENT SERVICES</span>
                <p>{tent.name}</p>
              </div>
            )}

            <div className="reis-tent-product-details">
              <p className="eyebrow">PRODUCT DETAILS</p>

              {tent.dimensions && (
                <div className="reis-tent-detail-row">
                  <span>Dimensions</span>
                  <strong>{tent.dimensions}</strong>
                </div>
              )}

              {tent.capacity && (
                <div className="reis-tent-detail-row">
                  <span>Capacity</span>
                  <strong>{tent.capacity}</strong>
                </div>
              )}

              {tent.quantityAvailable !== undefined && (
                <div className="reis-tent-detail-row">
                  <span>Availability</span>
                  <strong>{tent.quantityAvailable} available</strong>
                </div>
              )}
            </div>
          </div>

          <div className="reis-tent-form-panel">
            <div className="reis-tent-price-block">
              <p className="eyebrow">YOUR HIRE SELECTION</p>

              <div className="reis-tent-price">
                £{price.toFixed(2)}
                <span> / item</span>
              </div>

              {promo && (
                <p className="reis-tent-promotion">
                  Promotional price · Regular price £{tent.price.toFixed(2)}
                </p>
              )}

              <p className="reis-tent-price-note">
                Select your event date and quantity to continue.
              </p>
            </div>

            <div className="reis-tent-form-divider" />

            <div className="reis-tent-field">
              <label htmlFor="reis-tent-event-date">Event date</label>
              <input
                id="reis-tent-event-date"
                type="date"
                min={minimumDate}
                value={eventDate}
                onChange={(event) => {
                  setEventDate(event.target.value);
                  setMessage('');
                }}
                required
              />
              <span className="reis-tent-field-hint">
                Choose today or a future date.
              </span>
            </div>

            <div className="reis-tent-field">
              <label htmlFor="reis-tent-quantity">Quantity required</label>
              <input
                id="reis-tent-quantity"
                type="number"
                min={minimum}
                max={maximum}
                step={1}
                value={quantity}
                onChange={(event) => {
                  setQuantity(Number(event.target.value));
                  setMessage('');
                }}
                required
              />
              <span className="reis-tent-field-hint">
                Minimum quantity: {minimum}
                {maximum !== 999999 ? ` · Maximum: ${maximum}` : ''}
              </span>
            </div>

            {message && (
              <p className="reis-tent-form-message" role="alert">
                {message}
              </p>
            )}

            <button
              type="button"
              className="btn reis-tent-submit"
              onClick={addToCart}
            >
              Continue with this tent <span aria-hidden="true">→</span>
            </button>

            <p className="reis-tent-form-footnote">
              Your selection will be added to your booking cart.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
