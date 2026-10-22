'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CartItem, SiteDetails } from '@/types/booking';

const gbp = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);

function readCart(): CartItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem('reis-cart') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [site, setSite] = useState<SiteDetails>({
    photos: [],
    knowsTentSize: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  function saveItems(nextItems: CartItem[]) {
    setItems(nextItems);

    try {
      localStorage.setItem('reis-cart', JSON.stringify(nextItems));
    } catch {
      // Keep the current page usable if browser storage is unavailable.
    }
  }

  function changeQuantity(index: number, nextQuantity: number) {
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) return;

    const nextItems = [...items];
    const item = nextItems[index];

    if (!item) return;

    const discountPerUnit =
      item.quantity > 0 ? item.promoDiscount / item.quantity : 0;

    nextItems[index] = {
      ...item,
      quantity: nextQuantity,
      total: item.unitPrice * nextQuantity,
      promoDiscount: discountPerUnit * nextQuantity,
    };

    saveItems(nextItems);
  }

  function removeItem(index: number) {
    saveItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  const subtotal = items.reduce(
    (total, item) => total + item.total,
    0
  );

  const discount = items.reduce(
    (total, item) => total + item.promoDiscount,
    0
  );

  const isTent = items.some((item) => item.type === 'tent');

  if (!ready) {
    return (
      <main className="section">
        <div className="wrap">
          <p className="muted">Loading your cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="wrap" style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div className="eyebrow">YOUR CART</div>

        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: 500,
            fontSize: 'clamp(38px, 5vw, 64px)',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          Review your event.
        </h1>

        <p className="muted" style={{ marginBottom: 36, lineHeight: 1.8 }}>
          Review your selected rentals and quantities before submitting your
          booking request.
        </p>

        {items.length === 0 ? (
          <div
            style={{
              padding: '36px 24px',
              borderTop: '1px solid var(--line)',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 500 }}>
              Your cart is empty.
            </h2>

            <p className="muted">
              Explore our collection and add the items you need for your event.
            </p>

            <Link
              className="btn"
              href="/booking/rentals"
              style={{ display: 'inline-block', marginTop: 12 }}
            >
              Explore rentals
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: 36,
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--line)',
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 13 }}>
                  Selected items ({items.length})
                </strong>

                <Link
                  href="/booking/rentals"
                  className="muted"
                  style={{ fontSize: 12 }}
                >
                  + Add more rentals
                </Link>
              </div>

              {items.map((item, index) => (
                <article
                  key={`${item.productId}-${item.eventDate}-${item.tentSize || ''}-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px minmax(0, 1fr)',
                    gap: 18,
                    padding: '22px 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4 / 5',
                      background: 'var(--cream)',
                      overflow: 'hidden',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
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
                          fontSize: 9,
                          letterSpacing: '.12em',
                          color: 'var(--muted)',
                        }}
                      >
                        REIS
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontSize: 17,
                            fontWeight: 500,
                            margin: '0 0 8px',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.name}
                        </h2>

                        <p
                          className="muted"
                          style={{ fontSize: 12, margin: '0 0 6px' }}
                        >
                          {gbp(item.unitPrice)} per item
                        </p>
                      </div>

                      <strong style={{ whiteSpace: 'nowrap', fontSize: 15 }}>
                        {gbp(item.total)}
                      </strong>
                    </div>

                    <p
                      className="muted"
                      style={{ fontSize: 12, margin: '8px 0' }}
                    >
                      Event date: {item.eventDate || 'Not specified'}
                    </p>

                    {item.endDate && (
                      <p
                        className="muted"
                        style={{ fontSize: 12, margin: '8px 0' }}
                      >
                        Return / end date: {item.endDate}
                      </p>
                    )}

                    {item.tentSize && (
                      <p
                        className="muted"
                        style={{ fontSize: 12, margin: '8px 0' }}
                      >
                        Tent size: {item.tentSize}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            changeQuantity(index, item.quantity - 1)
                          }
                          style={{
                            width: 38,
                            height: 38,
                            border: 0,
                            background: 'transparent',
                            color: 'var(--ink)',
                            fontSize: 19,
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            opacity: item.quantity <= 1 ? 0.4 : 1,
                          }}
                        >
                          −
                        </button>

                        <span
                          aria-live="polite"
                          style={{
                            minWidth: 30,
                            textAlign: 'center',
                            fontSize: 13,
                          }}
                        >
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() =>
                            changeQuantity(index, item.quantity + 1)
                          }
                          style={{
                            width: 38,
                            height: 38,
                            border: 0,
                            background: 'transparent',
                            color: 'var(--ink)',
                            fontSize: 19,
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        style={{
                          border: 0,
                          padding: '8px 0',
                          background: 'transparent',
                          color: 'var(--muted)',
                          textDecoration: 'underline',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {isTent && (
                <section
                  style={{
                    marginTop: 28,
                    padding: 24,
                    border: '1px solid var(--line)',
                  }}
                >
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 500 }}>
                    Tell us about the tent site
                  </h2>

                  <p className="muted" style={{ lineHeight: 1.8 }}>
                    Upload clear photos of the installation area and provide
                    measurements if known. This information helps the team
                    recommend the correct tent.
                  </p>

                  <div className="form">
                    <div className="field">
                      <label>Site photos</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setSite({
                            ...site,
                            photos: Array.from(
                              event.target.files || []
                            ).map((file) => file.name),
                          })
                        }
                      />
                    </div>

                    <div className="three">
                      <div className="field">
                        <label>Length (m)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          onChange={(event) =>
                            setSite({
                              ...site,
                              lengthM: Number(event.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="field">
                        <label>Width (m)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          onChange={(event) =>
                            setSite({
                              ...site,
                              widthM: Number(event.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="field">
                        <label>Height (m)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          onChange={(event) =>
                            setSite({
                              ...site,
                              heightM: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Site notes</label>
                      <textarea
                        rows={4}
                        placeholder="Access, ground type, obstacles, parking, etc."
                        value={site.notes || ''}
                        onChange={(event) =>
                          setSite({ ...site, notes: event.target.value })
                        }
                      />
                    </div>
                  </div>

                  <p className="muted" style={{ fontSize: 11, lineHeight: 1.7 }}>
                    Note: the existing checkout does not yet submit these site
                    details or upload the selected files. We have preserved
                    this section without changing the tent workflow.
                  </p>
                </section>
              )}
            </div>

            <aside
              style={{
                border: '1px solid var(--line)',
                padding: '26px 22px',
                position: 'sticky',
                top: 24,
              }}
            >
              <div className="eyebrow">ORDER SUMMARY</div>

              <h2
                style={{
                  fontFamily: 'var(--serif)',
                  fontWeight: 500,
                  fontSize: 30,
                  marginTop: 10,
                }}
              >
                Your event
              </h2>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 13,
                }}
              >
                <span className="muted">Items</span>
                <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 13,
                }}
              >
                <span className="muted">Rental subtotal</span>
                <strong>{gbp(subtotal)}</strong>
              </div>

              {discount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '16px 0',
                    borderBottom: '1px solid var(--line)',
                    fontSize: 13,
                  }}
                >
                  <span className="muted">Promotional savings</span>
                  <strong>{gbp(discount)}</strong>
                </div>
              )}

              <p
                className="muted"
                style={{ fontSize: 12, lineHeight: 1.8, marginTop: 18 }}
              >
                Delivery, setup charges, deposits and final availability are
                confirmed by REIS during booking review.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'baseline',
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: '1px solid var(--line)',
                }}
              >
                <span style={{ fontSize: 13 }}>Current estimate</span>
                <strong style={{ fontSize: 23 }}>{gbp(subtotal)}</strong>
              </div>

              <Link
                className="btn"
                href="/checkout"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 22,
                  opacity: items.length ? 1 : 0.5,
                  pointerEvents: items.length ? 'auto' : 'none',
                }}
                aria-disabled={!items.length}
              >
                Continue to checkout
              </Link>

              <Link
                href="/booking/rentals"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
