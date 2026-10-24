'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function Checkout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    try {
      const fd = new FormData(e.currentTarget);
      const storedCart = localStorage.getItem('reis-cart') || '[]';
      const cart = JSON.parse(storedCart);

      if (!Array.isArray(cart) || cart.length === 0) {
        setMsg('Your basket is empty. Please select your rentals before continuing.');
        return;
      }

      const items = cart.map((item: {
        productId?: string;
        quantity?: number;
        eventDate?: string;
        endDate?: string;
        tentSize?: string;
      }) => ({
        productId: item.productId,
        quantity: item.quantity,
        eventDate: item.eventDate,
        ...(item.endDate ? { endDate: item.endDate } : {}),
        ...(item.tentSize ? { tentSize: item.tentSize } : {}),
      }));

      const body = {
        customer: {
          name: String(fd.get('name') || '').trim(),
          email: String(fd.get('email') || '').trim(),
          phone: String(fd.get('phone') || '').trim(),
        },
        event: {},
        items,
      };

      const user = auth.currentUser;

      if (!user) {
        router.replace(
          `/account/login?next=${encodeURIComponent('/checkout')}`
        );
        return;
      }

      const idToken = await user.getIdToken();

      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(
          data.error ||
            'Unable to create your booking request. Please try again.'
        );
        return;
      }

      localStorage.removeItem('reis-cart');

      router.push(
        `/booking/confirmation?reference=${encodeURIComponent(data.reference)}`
      );
    } catch {
      setMsg(
        'We could not complete your request. Please check your internet connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reis-checkout-page">
      <div className="reis-checkout-container">
        <header className="reis-checkout-header">
          <div className="reis-checkout-eyebrow">
            <span className="reis-checkout-eyebrow-line" />
            REIS EVENT SERVICES
          </div>

          <p className="reis-checkout-kicker">
            YOUR RENTALS, ONE STEP CLOSER
          </p>

          <h1>
            Your event.
            <br />
            <span>Your perfect setting.</span>
          </h1>

          <p className="reis-checkout-intro">
            Share your contact details to submit your rental request.
            We&apos;ll review availability and guide you through the next steps.
          </p>
        </header>

        <div className="reis-checkout-layout">
          <section className="reis-checkout-form-panel">
            <div className="reis-checkout-panel-heading">
              <div>
                <span className="reis-checkout-step">
                  BOOKING REQUEST · 01
                </span>
                <h2>Your contact details</h2>
                <p>
                  Just three details to get your rental request started.
                </p>
              </div>

              <span className="reis-checkout-heading-mark" aria-hidden="true">
                REIS
              </span>
            </div>

            <form className="reis-checkout-form" onSubmit={submit}>
              <fieldset className="reis-checkout-fieldset">
                <legend>
                  <span className="reis-checkout-section-number">01</span>
                  Your details
                </legend>

                <div className="reis-checkout-fields">
                  <div className="reis-checkout-field">
                    <label htmlFor="reis-name">
                      Full name <span>*</span>
                    </label>
                    <input
                      id="reis-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="reis-checkout-field">
                    <label htmlFor="reis-email">
                      Email address <span>*</span>
                    </label>
                    <input
                      id="reis-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="reis-checkout-field">
                    <label htmlFor="reis-phone">
                      Phone number <span>*</span>
                    </label>
                    <input
                      id="reis-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Your contact number"
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <div className="reis-checkout-hold-notice">
                <span
                  className="reis-checkout-notice-icon"
                  aria-hidden="true"
                >
                  i
                </span>
                <div>
                  <h3>Your 24-hour reservation hold</h3>
                  <p>
                    Submitting this request does not charge you. Your requested
                    rentals are temporarily held for 24 hours while REIS reviews
                    your booking. If the booking is not approved and payment is
                    not confirmed within the applicable period, the hold may
                    expire and the dates may become available again.
                  </p>
                </div>
              </div>

              {msg && (
                <div className="reis-checkout-error" role="alert">
                  <strong>We couldn&apos;t complete your request.</strong>
                  <p>{msg}</p>
                </div>
              )}

              <div className="reis-checkout-submit-area">
                <button
                  className="reis-checkout-submit"
                  type="submit"
                  disabled={busy}
                >
                  <span>
                    {busy ? 'Submitting your request…' : 'Submit booking request'}
                  </span>
                  {!busy && <span aria-hidden="true">↗</span>}
                </button>

                <p>
                  No payment is taken at this stage. Your booking remains
                  subject to REIS review and approval.
                </p>
              </div>
            </form>
          </section>

          <aside className="reis-checkout-sidebar">
            <div className="reis-checkout-sidebar-top">
              <span className="reis-checkout-sidebar-label">
                THE REIS EXPERIENCE
              </span>
              <h2>Thoughtfully planned. Beautifully celebrated.</h2>
              <p>
                Discover the right rentals for your occasion. We&apos;ll help
                bring your setting together, one detail at a time.
              </p>
            </div>

            <div className="reis-checkout-process">
              <h3>What happens next?</h3>

              <div className="reis-checkout-process-item">
                <span>01</span>
                <div>
                  <h4>Send your request</h4>
                  <p>
                    Submit your contact details and selected rental items.
                  </p>
                </div>
              </div>

              <div className="reis-checkout-process-item">
                <span>02</span>
                <div>
                  <h4>REIS reviews it</h4>
                  <p>
                    Our team checks your request and rental availability.
                  </p>
                </div>
              </div>

              <div className="reis-checkout-process-item">
                <span>03</span>
                <div>
                  <h4>Receive the next steps</h4>
                  <p>
                    If approved, follow the payment instructions provided for
                    your booking.
                  </p>
                </div>
              </div>
            </div>

            <div className="reis-checkout-sidebar-footer">
              <span className="reis-checkout-footer-rule" />
              <p>WE STYLE YOUR EVENT, YOU CREATE MEMORIES.</p>
              <span className="reis-checkout-footer-brand">REIS</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
