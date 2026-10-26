'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRentalBySlug } from '@/lib/cms/rentals';
import { unitPrice, activePromo } from '@/lib/pricing';
import type { CartItem, Product } from '@/types/booking';

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function readCart(): CartItem[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem('reis-cart') || '[]'
    );

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

const gbp = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);

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
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let mounted = true;

    params
      .then(async ({ slug }) => {
        const rental = await getRentalBySlug(slug);

        if (mounted) {
          setProduct(rental);

          if (rental?.minimumQuantity) {
            setQuantity(rental.minimumQuantity);
          }
        }
      })
      .catch((error: unknown) => {
        console.error("[REIS rental detail] Failed to load product:", error);
        if (mounted) {
          setProduct(null);
          setMessage(
            error instanceof Error
              ? error.message
              : "An unknown error occurred while loading this rental."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="container reis-rental-detail">
        <section style={{ padding: '60px 0' }}>
          <p className="muted">Loading rental...</p>
        </section>
      </main>
    );
  }

  if (!product || !product.active) {
    return (
      <main className="container">
        <section style={{ padding: '60px 0' }}>
          <div className="eyebrow">REIS EVENT RENTALS</div>
          <h1>Rental unavailable</h1>
          <p className="muted">
            This item may have been removed or is no longer available.
          </p>
          {message && (
            <p
              role="alert"
              style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #c8943e",
                overflowWrap: "anywhere",
                fontSize: 13,
              }}
            >
              Diagnostic: {message}
            </p>
          )}
          {message && (
            <p
              role="alert"
              style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #c8943e",
                overflowWrap: "anywhere",
                fontSize: 13,
              }}
            >
              Diagnostic: {message}
            </p>
          )}
          <Link className="btn" href="/booking/rentals">
            Browse available rentals
          </Link>
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

  const price = unitPrice(rental);
  const promo = activePromo(rental);
  const image = rental.image || rental.images?.[0] || '';
  const lineTotal = price * quantity;
  const minimumDate = todayLocal();

  function addToCart() {
    setMessage('');

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
        `Please choose a whole-number quantity between ${minimum} and ${maximum}.`
      );
      return;
    }

    if (
      rental.inventoryMode === 'quantity_controlled' &&
      rental.quantityAvailable !== undefined &&
      quantity > rental.quantityAvailable
    ) {
      setMessage(
        `Only ${rental.quantityAvailable} units are currently listed as available.`
      );
      return;
    }

    try {
      const cart = readCart();

      const existingIndex = cart.findIndex(
        (item) =>
          item.productId === rental.id &&
          item.eventDate === eventDate &&
          item.type === 'rental' &&
          !item.tentSize
      );

      const newItem: CartItem = {
        productId: rental.id,
        name: rental.name,
        type: rental.type,
        quantity,
        unitPrice: price,
        promoDiscount: Math.max(0, rental.price - price) * quantity,
        total: lineTotal,
        eventDate,
        durationDays: 1,
        image,
      };

      if (existingIndex >= 0) {
        const existing = cart[existingIndex];
        const combinedQuantity = existing.quantity + quantity;

        if (combinedQuantity > maximum) {
          setMessage(
            `Adding this quantity would exceed the maximum of ${maximum}.`
          );
          return;
        }

        if (
          rental.inventoryMode === 'quantity_controlled' &&
          rental.quantityAvailable !== undefined &&
          combinedQuantity > rental.quantityAvailable
        ) {
          setMessage(
            `The combined quantity cannot exceed ${rental.quantityAvailable} available units.`
          );
          return;
        }

        cart[existingIndex] = {
          ...existing,
          quantity: combinedQuantity,
          unitPrice: price,
          promoDiscount:
            Math.max(0, rental.price - price) * combinedQuantity,
          total: price * combinedQuantity,
          image,
        };
      } else {
        cart.push(newItem);
      }

      localStorage.setItem('reis-cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('reis-cart-updated'));
      setAdding(true);
      window.location.href = '/cart';
    } catch {
      setMessage(
        'Unable to update your cart. Please check your browser storage and try again.'
      );
      setAdding(false);
    }
  }

  return (
    <main className="container reis-rental-detail">
      <section
        style={{
          padding: '32px 0 76px',
          maxWidth: 1180,
          margin: '0 auto',
        }}
      >
        <Link className="muted" href="/booking/rentals">
          ← Back to rentals
        </Link>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'clamp(28px, 5vw, 72px)',
            alignItems: 'start',
            marginTop: 28,
          }}
        >
          <div>
            <div
              style={{
                position: 'relative',
                background: 'var(--cream)',
                minHeight: 320,
                aspectRatio: '4 / 4.5',
                overflow: 'hidden',
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt={rental.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    inset: 0,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--muted)',
                    letterSpacing: '.2em',
                    fontSize: 11,
                  }}
                >
                  REIS EVENT RENTALS
                </div>
              )}
            </div>

            {rental.images && rental.images.length > 1 && (
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                Additional product images are available in our collection.
              </p>
            )}
          </div>

          <div style={{ paddingTop: 8 }}>
            <div className="eyebrow">THE REIS RENTAL COLLECTION</div>

            <h1
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: 500,
                fontSize: 'clamp(38px, 5vw, 64px)',
                lineHeight: 0.98,
                letterSpacing: '-.025em',
                margin: '0 0 20px',
              }}
            >
              {rental.name}
            </h1>

            <p
              className="muted"
              style={{
                fontSize: 14,
                lineHeight: 1.9,
                marginBottom: 28,
              }}
            >
              {rental.description ||
                'A considered addition to your event, selected from the REIS rental collection.'}
            </p>

            <div
              style={{
                padding: '22px 0',
                borderTop: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <strong
                  style={{
                    fontSize: 29,
                    fontWeight: 500,
                    letterSpacing: '-.03em',
                  }}
                >
                  {gbp(price)}
                </strong>

                <span className="muted" style={{ fontSize: 12 }}>
                  per item
                </span>

                {promo && (
                  <del className="muted" style={{ fontSize: 13 }}>
                    {gbp(rental.price)}
                  </del>
                )}
              </div>

              {promo && (
                <p
                  style={{
                    color: 'var(--olive)',
                    fontSize: 12,
                    marginBottom: 0,
                  }}
                >
                  Promotional price available
                </p>
              )}

              {rental.inventoryMode === 'enquiry' && (
                <p className="muted" style={{ fontSize: 12 }}>
                  Availability and final arrangements will be confirmed by REIS.
                </p>
              )}
            </div>

            <div style={{ marginTop: 28 }}>
              <label
                htmlFor="rental-event-date"
                style={{ display: 'block', fontSize: 12, fontWeight: 600 }}
              >
                Event date
              </label>

              <input
                id="rental-event-date"
                type="date"
                min={minimumDate}
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 9,
                  padding: 14,
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  font: 'inherit',
                }}
              />
            </div>

            <div style={{ marginTop: 22 }}>
              <label
                htmlFor="rental-quantity"
                style={{ display: 'block', fontSize: 12, fontWeight: 600 }}
              >
                Quantity
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginTop: 9,
                }}
              >
                <input
                  id="rental-quantity"
                  type="number"
                  inputMode="numeric"
                  min={minimum}
                  max={maximum}
                  step={1}
                  value={quantity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuantity(value === '' ? 0 : Number(value));
                  }}
                  style={{
                    width: 120,
                    padding: 13,
                    border: '1px solid var(--line)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    font: 'inherit',
                  }}
                />

                <span className="muted" style={{ fontSize: 12 }}>
                  Minimum: {minimum}
                  {rental.quantityAvailable !== undefined
                    ? ` · Listed availability: ${rental.quantityAvailable}`
                    : ''}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'baseline',
                borderTop: '1px solid var(--line)',
                marginTop: 28,
                paddingTop: 20,
              }}
            >
              <span className="muted" style={{ fontSize: 13 }}>
                Estimated item total
              </span>
              <strong style={{ fontSize: 22 }}>{gbp(lineTotal)}</strong>
            </div>

            {message && (
              <p
                role="alert"
                style={{
                  marginTop: 18,
                  color: '#a33b32',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {message}
              </p>
            )}

            <button
              type="button"
              className="btn"
              onClick={addToCart}
              disabled={adding}
              style={{
                marginTop: 18,
                width: '100%',
                minHeight: 52,
                cursor: adding ? 'wait' : 'pointer',
              }}
            >
              {adding ? 'Opening your cart…' : 'Add to booking'}
            </button>

            <p
              className="muted"
              style={{
                fontSize: 11,
                lineHeight: 1.8,
                marginTop: 16,
              }}
            >
              Your booking request is subject to availability and REIS approval.
              Submitting a request does not charge you.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
