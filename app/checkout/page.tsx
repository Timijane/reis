'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Checkout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    const fd = new FormData(e.currentTarget);
    const items = JSON.parse(localStorage.getItem('reis-cart') || '[]');

    const body = {
      customer: {
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        whatsapp: fd.get('whatsapp'),
      },
      event: {
        date: fd.get('date'),
        eventType: fd.get('eventType'),
        venue: fd.get('venue'),
        guestCount: Number(fd.get('guests') || 0),
      },
      items,
    };

    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || 'Unable to create your booking request. Please try again.');
        return;
      }

      localStorage.removeItem('reis-cart');
      router.push(
        `/booking/confirmation?reference=${encodeURIComponent(data.reference)}`
      );
    } catch {
      setMsg('We could not connect to REIS. Please check your internet connection and try again.');
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

          <p className="reis-checkout-kicker">LET&apos;S PLAN SOMETHING MEMORABLE</p>

          <h1>
            Your event.
            <br />
            <span>Your perfect setting.</span>
          </h1>

          <p className="reis-checkout-intro">
            Tell us a little about your occasion and the rentals you need.
            We&apos;ll review your request and guide you through the next steps.
          </p>
        </header>

        <div className="reis-checkout-layout">
          <section className="reis-checkout-form-panel">
            <div className="reis-checkout-panel-heading">
              <div>
                <span className="reis-checkout-step">BOOKING REQUEST · 01</span>
                <h2>Tell us about your event</h2>
                <p>Complete the details below to submit your request.</p>
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

                <div className="reis-checkout-fields reis-checkout-two-columns">
                  <div className="reis-checkout-field">
                    <label htmlFor="reis-name">Full name <span>*</span></label>
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
                    <label htmlFor="reis-email">Email address <span>*</span></label>
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
                    <label htmlFor="reis-phone">Phone number <span>*</span></label>
                    <input
                      id="reis-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Your contact number"
                      required
                    />
                  </div>

                  <div className="reis-checkout-field">
                    <label htmlFor="reis-whatsapp">
                      WhatsApp number <small>OPTIONAL</small>
                    </label>
                    <input
                      id="reis-whatsapp"
                      name="whatsapp"
                      type="tel"
                      autoComplete="tel"
                      placeholder="If different from your phone"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="reis-checkout-fieldset">
                <legend>
                  <span className="reis-checkout-section-number">02</span>
                  Event details
                </legend>

                <div className="reis-checkout-fields reis-checkout-two-columns">
                  <div className="reis-checkout-field">
                    <label htmlFor="reis-date">Event date <span>*</span></label>
                    <input
                      id="reis-date"
                      name="date"
                      type="date"
                      required
                    />
                  </div>

                  <div className="reis-checkout-field">
                    <label htmlFor="reis-event-type">Type of event <span>*</span></label>
                    <select id="reis-event-type" name="eventType" required defaultValue="">
                      <option value="" disabled>Select your occasion</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday">Birthday celebration</option>
                      <option value="Corporate event">Corporate event</option>
                      <option value="Private party">Private party</option>
                      <option value="Engagement">Engagement</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Graduation">Graduation</option>
                      <option value="Church event">Church event</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="reis-checkout-field reis-checkout-full-width">
                    <label htmlFor="reis-guests">Expected number of guests</label>
                    <input
                      id="reis-guests"
                      name="guests"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Approximately how many guests?"
                    />
                    <small className="reis-checkout-hint">
                      This helps us understand the scale of your event.
                    </small>
                  </div>

                  <div className="reis-checkout-field reis-checkout-full-width">
                    <label htmlFor="reis-venue">Event venue or address <span>*</span></label>
                    <textarea
                      id="reis-venue"
                      name="venue"
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Enter the venue name, address, town or postcode"
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <div className="reis-checkout-hold-notice">
                <span className="reis-checkout-notice-icon" aria-hidden="true">i</span>
                <div>
                  <h3>Your 24-hour reservation hold</h3>
                  <p>
                    Submitting this request does not charge you. Your requested
                    rental is temporarily held for 24 hours while REIS reviews
                    your booking. If it is not approved and paid according to
                    the final instructions within that period, the hold may
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
                  <span>{busy ? 'Submitting your request…' : 'Submit booking request'}</span>
                  {!busy && <span aria-hidden="true">↗</span>}
                </button>

                <p>
                  No payment is taken at this stage. Your booking remains subject
                  to REIS review and approval.
                </p>
              </div>
            </form>
          </section>

          <aside className="reis-checkout-sidebar">
            <div className="reis-checkout-sidebar-top">
              <span className="reis-checkout-sidebar-label">THE REIS EXPERIENCE</span>
              <h2>Thoughtfully planned. Beautifully celebrated.</h2>
              <p>
                We help you bring your occasion together with event rentals
                and styling tailored to your plans.
              </p>
            </div>

            <div className="reis-checkout-process">
              <h3>What happens next?</h3>

              <div className="reis-checkout-process-item">
                <span>01</span>
                <div>
                  <h4>Send your request</h4>
                  <p>Tell us about your event and the rentals you have selected.</p>
                </div>
              </div>

              <div className="reis-checkout-process-item">
                <span>02</span>
                <div>
                  <h4>REIS reviews it</h4>
                  <p>Our team checks your request and rental availability.</p>
                </div>
              </div>

              <div className="reis-checkout-process-item">
                <span>03</span>
                <div>
                  <h4>Receive the next steps</h4>
                  <p>If approved, follow the payment instructions provided for your booking.</p>
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
