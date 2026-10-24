'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface OrderItem {
  name: string;
  quantity: number;
  total: number;
  eventDate: string;
  endDate: string;
  tentSize: string;
}

interface CustomerOrder {
  type: 'booking' | 'styling_enquiry';
  reference: string;
  createdAt: string;
  status: string;
  reservationStatus?: string;
  paymentStatus?: string;
  fulfilmentStatus?: string;
  paymentVerifiedAt?: string;
  event: {
    date: string;
    endDate: string;
    eventType: string;
    venue?: string;
  };
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  description?: string;
}

function formatDate(value: string) {
  if (!value) return 'Not specified';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
}

function orderStatus(order: CustomerOrder) {
  if (order.type === 'styling_enquiry') {
    if (order.status === 'completed') {
      return { label: 'Completed', type: 'success' };
    }

    if (['cancelled', 'rejected'].includes(order.status)) {
      return { label: 'Closed', type: 'muted' };
    }

    return { label: 'Enquiry received', type: 'warning' };
  }

  if (
    order.status === 'cancelled' ||
    order.reservationStatus === 'expired' ||
    order.status === 'expired'
  ) {
    return { label: 'Cancelled or expired', type: 'muted' };
  }

  if (order.status === 'rejected') {
    return { label: 'Request declined', type: 'danger' };
  }

  if (
    order.status === 'completed' ||
    order.fulfilmentStatus === 'completed'
  ) {
    return { label: 'Completed', type: 'success' };
  }

  if (
    order.status === 'in_fulfilment' ||
    ['out_for_delivery', 'delivered', 'collected', 'returned'].includes(
        order.fulfilmentStatus ?? '',
      )
  ) {
    return { label: 'In fulfilment', type: 'success' };
  }

  if (order.paymentStatus === 'paid') {
    return { label: 'Payment confirmed', type: 'success' };
  }

  if (order.status === 'approved') {
    return { label: 'Approved · Payment pending', type: 'warning' };
  }

  if (order.status === 'awaiting_customer') {
    return { label: 'Awaiting your response', type: 'warning' };
  }

  return { label: 'Pending approval', type: 'warning' };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [verified, setVerified] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadOrders(user: User) {
    setLoadingOrders(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/customer/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (response.status === 401) {
        setVerified(false);
        setOrders([]);
        setError('Your session has expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load your orders.');
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setVerified(true);
      setError('');
    } catch {
      setError('We could not load your orders. Please try again.');
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('access') === 'invalid') {
      setError('That access link is invalid or expired. Please sign in to your account.');
    } else if (params.get('access') === 'error') {
      setError('We could not verify that link. Please sign in to your account.');
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        void loadOrders(user);
      } else {
        setVerified(false);
        setOrders([]);
        setLoadingOrders(false);
      }
    });

    return unsubscribe;
  }, []);

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      setVerified(false);
      setOrders([]);
      setMessage('');
      setError('');
    } catch {
      setError('Unable to sign out. Please try again.');
    }
  }

  return (
    <main className="reis-orders">
      <header className="orders-header">
        <Link href="/shop" className="orders-brand">
          REIS <span>EVENT SERVICES</span>
        </Link>

        <Link href="/shop" className="orders-back">
          ← Return to shop
        </Link>
      </header>

      <section className="orders-intro">
        <span className="orders-eyebrow">YOUR REIS EXPERIENCE</span>
        <h1>
          Every detail,
          <br />
          <em>in one place.</em>
        </h1>
        <p>
          Revisit your bookings, follow their progress, and review your
          styling enquiries. Sign in to your REIS account to see your history.
        </p>
      </section>

      {loadingOrders ? (
        <section className="orders-loading" aria-live="polite">
          <span className="orders-spinner" />
          <p>Checking your order history…</p>
        </section>
      ) : verified ? (
        <section className="orders-content">
          <div className="orders-section-heading">
            <div>
              <span className="orders-eyebrow">YOUR BOOKINGS</span>
              <h2>Order history</h2>
            </div>

            <button
              type="button"
              className="orders-signout"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="orders-empty">
              <span className="orders-empty-mark" aria-hidden="true">
                ↗
              </span>
              <h3>No order history yet.</h3>
              <p>
                You don’t have any bookings or styling enquiries in this account
                address. When you place an order, you’ll be able to follow
                its progress here.
              </p>
              <Link href="/shop" className="orders-primary">
                Go make an order <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <>
              <p className="orders-count">
                {orders.length} {orders.length === 1 ? 'booking' : 'bookings'}{' '}
                found
              </p>

              <div className="orders-list">
                {orders.map((order) => {
                  const status = orderStatus(order);

                  return (
                    <article
                      className="order-card"
                      key={order.reference}
                    >
                      <div className="order-card-top">
                        <div>
                          <span className="order-reference-label">
                            {order.type === 'booking' ? 'BOOKING REFERENCE' : 'STYLING REFERENCE'}
                          </span>
                          <h3>{order.reference}</h3>
                        </div>

                        <span
                          className={`order-status order-status-${status.type}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="order-details-grid">
                        <div>
                          <span>Event date</span>
                          <strong>
                            {formatDate(order.event.date)}
                          </strong>
                        </div>

                        <div>
                          <span>Booking placed</span>
                          <strong>
                            {formatDate(order.createdAt)}
                          </strong>
                        </div>

                        {order.type === 'booking' && (
                          <>
                            <div>
                              <span>Payment</span>
                              <strong>
                                {order.paymentStatus === 'paid'
                                  ? 'Paid'
                                  : order.paymentStatus === 'partially_paid'
                                    ? 'Partially paid'
                                    : order.paymentStatus === 'refunded'
                                      ? 'Refunded'
                                      : order.paymentStatus === 'failed'
                                        ? 'Failed'
                                        : order.paymentStatus === 'pending'
                                          ? 'Pending'
                                          : 'Not paid'}
                              </strong>
                            </div>

                            <div>
                              <span>Order total</span>
                              <strong className="order-total">
                                {formatMoney(order.total ?? 0)}
                              </strong>
                            </div>
                          </>
                        )}

                      {order.type === 'styling_enquiry' && (
                        <div className="order-items">
                          <span className="order-items-heading">
                            STYLING ENQUIRY
                          </span>
                          {order.event.venue && (
                            <p><strong>Venue:</strong> {order.event.venue}</p>
                          )}
                          {order.description && <p>{order.description}</p>}
                        </div>
                      )}
                  </div>

                      {order.items && order.items.length > 0 && (
                        <div className="order-items">
                          <span className="order-items-heading">
                            BOOKED ITEMS
                          </span>

                          {order.items.map((item, index) => (
                            <div
                              className="order-item"
                              key={`${order.reference}-${index}`}
                            >
                              <div>
                                <strong>{item.name}</strong>
                                <span>
                                  Quantity: {item.quantity}
                                  {item.tentSize
                                    ? ` · ${item.tentSize}`
                                    : ''}
                                </span>
                              </div>

                              <strong>{formatMoney(item.total)}</strong>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="order-card-footer">
                        <span>
                        {order.type === 'styling_enquiry'
                          ? 'Your styling enquiry has been received. The REIS team will review your brief.'
                          : order.status === 'pending_review'
                            ? 'Your booking is awaiting review by our team.'
                            : order.status === 'approved' &&
                                order.paymentStatus !== 'paid'
                              ? 'Your booking has been approved. Check your confirmation for payment instructions.'
                              : order.paymentStatus === 'paid'
                                ? 'Your payment has been recorded.'
                                : order.status === 'completed'
                                  ? 'This booking has been completed.'
                                  : 'Check back here for booking updates.'}
                      </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="orders-bottom-action">
            <p>Planning another occasion?</p>
            <Link href="/shop" className="orders-secondary">
              Explore the REIS collection ↗
            </Link>
          </div>
        </section>
      ) : (
        <section className="orders-access">
          <div className="orders-access-heading">
            <span className="orders-lock" aria-hidden="true">✳</span>
            <h2>Access your orders</h2>
            <p>
              Sign in to your REIS customer account to view your rental
              and tent bookings, payment progress, and styling enquiries.
            </p>
          </div>

          <div className="orders-form">
            <Link
              href="/account/login?next=%2Forders"
              className="orders-primary"
            >
              Sign in to your account <span aria-hidden="true">↗</span>
            </Link>

            <Link
              href="/account/register?next=%2Forders"
              className="orders-secondary"
            >
              Create a customer account
            </Link>
          </div>

          {message && (
            <p className="orders-message" role="status">{message}</p>
          )}

          {error && (
            <p className="orders-error" role="alert">{error}</p>
          )}

          <p className="orders-privacy">
            Your order history is private and is retrieved using your
            authenticated customer account.
          </p>
        </section>
      )}

      {!verified && error && (
        <p className="orders-error orders-global-error" role="alert">
          {error}
        </p>
      )}

      <footer className="orders-footer">
        <span>REIS EVENT SERVICES</span>
        <span>We style your event, You create memories!</span>
      </footer>

      <style jsx>{`
        .reis-orders {
          --orders-bg: var(--cream, #f3f0ea);
          --orders-paper: var(--paper, #faf9f6);
          --orders-ink: var(--ink, #161614);
          --orders-muted: var(--muted, #77756e);
          --orders-olive: var(--olive, #68765b);
          min-height: 100vh;
          padding: 0 6%;
          background: var(--orders-bg);
          color: var(--orders-ink);
          font-family: var(--sans, Arial, sans-serif);
        }

        .orders-header {
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(22, 22, 20, 0.13);
        }

        .orders-brand {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: var(--orders-ink);
          text-decoration: none;
          font-family: var(--serif, Georgia, serif);
          font-size: 25px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .orders-brand span {
          font-family: var(--sans, Arial, sans-serif);
          font-size: 9px;
          letter-spacing: 0.2em;
        }

        .orders-back,
        .orders-secondary {
          color: var(--orders-ink);
          font-size: 13px;
          text-decoration: none;
        }

        .orders-back:hover,
        .orders-secondary:hover {
          color: var(--orders-olive);
        }

        .orders-intro {
          max-width: 750px;
          margin: 76px auto 48px;
          text-align: center;
        }

        .orders-eyebrow {
          color: var(--orders-olive);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
        }

        .orders-intro h1 {
          margin: 20px 0;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(44px, 7vw, 76px);
          font-weight: 400;
          letter-spacing: -0.045em;
          line-height: 1.04;
        }

        .orders-intro h1 em {
          color: var(--orders-olive);
          font-weight: 400;
        }

        .orders-intro > p,
        .orders-access-heading > p {
          max-width: 550px;
          margin: 0 auto;
          color: var(--orders-muted);
          font-size: 14px;
          line-height: 1.9;
        }

        .orders-access {
          width: 100%;
          max-width: 500px;
          margin: 0 auto 90px;
          padding: 38px;
          border: 1px solid rgba(22, 22, 20, 0.12);
          background: var(--orders-paper);
        }

        .orders-access-heading {
          text-align: center;
        }

        .orders-lock {
          display: grid;
          width: 45px;
          height: 45px;
          margin: 0 auto 17px;
          place-items: center;
          border-radius: 50%;
          background: #e8eadf;
          color: var(--orders-olive);
          font-size: 22px;
        }

        .orders-access-heading h2,
        .orders-section-heading h2 {
          margin: 0 0 13px;
          font-family: var(--serif, Georgia, serif);
          font-size: 34px;
          font-weight: 400;
        }

        .orders-access-heading > p {
          font-size: 13px;
        }

        .orders-form {
          display: grid;
          gap: 11px;
          margin-top: 28px;
        }

        .orders-form label {
          font-size: 12px;
          font-weight: 600;
        }

        .orders-form input {
          width: 100%;
          min-height: 49px;
          padding: 12px 14px;
          border: 1px solid #d9d6ce;
          border-radius: 0;
          outline: none;
          background: white;
          color: var(--orders-ink);
          font: inherit;
          font-size: 14px;
        }

        .orders-form input:focus {
          border-color: var(--orders-olive);
          box-shadow: 0 0 0 2px rgba(104, 118, 91, 0.13);
        }

        .orders-primary {
          display: inline-flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 14px 21px;
          border: 1px solid var(--orders-ink);
          background: var(--orders-ink);
          color: white;
          font: inherit;
          font-size: 12px;
          text-align: center;
          text-decoration: none;
          transition:
            background 160ms ease,
            color 160ms ease;
        }

        .orders-primary:hover:not(:disabled) {
          border-color: var(--orders-olive);
          background: var(--orders-olive);
        }

        .orders-submit {
          width: 100%;
          margin-top: 8px;
          cursor: pointer;
        }

        .orders-submit:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .orders-message,
        .orders-error {
          margin: 18px 0 0;
          font-size: 12px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .orders-message {
          color: #426342;
        }

        .orders-error {
          color: #a02f2f;
        }

        .orders-privacy {
          margin: 24px 0 0;
          color: var(--orders-muted);
          font-size: 11px;
          line-height: 1.8;
          text-align: center;
        }

        .orders-loading {
          display: flex;
          min-height: 180px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--orders-muted);
          font-size: 13px;
        }

        .orders-spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #d9d6ce;
          border-top-color: var(--orders-olive);
          border-radius: 50%;
          animation: orders-spin 700ms linear infinite;
        }

        @keyframes orders-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .orders-content {
          max-width: 950px;
          margin: 0 auto 90px;
        }

        .orders-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .orders-section-heading h2 {
          margin: 9px 0 0;
          font-size: 38px;
        }

        .orders-signout {
          padding: 10px 13px;
          border: 1px solid #d4d0c7;
          background: transparent;
          color: var(--orders-ink);
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .orders-count {
          margin: 0 0 14px;
          color: var(--orders-muted);
          font-size: 12px;
        }

        .orders-list {
          display: grid;
          gap: 18px;
        }

        .order-card {
          padding: 27px;
          border: 1px solid rgba(22, 22, 20, 0.13);
          background: var(--orders-paper);
        }

        .order-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 21px;
          border-bottom: 1px solid #e8e4dc;
        }

        .order-reference-label,
        .order-items-heading {
          color: var(--orders-muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.15em;
        }

        .order-card-top h3 {
          margin: 8px 0 0;
          font-family: var(--serif, Georgia, serif);
          font-size: 23px;
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        .order-status {
          display: inline-block;
          max-width: 220px;
          padding: 8px 10px;
          font-size: 10px;
          line-height: 1.4;
          text-align: center;
        }

        .order-status-warning {
          background: #f2ead6;
          color: #795b20;
        }

        .order-status-success {
          background: #e5ebdf;
          color: #42613d;
        }

        .order-status-danger {
          background: #f5e5e2;
          color: #963f35;
        }

        .order-status-muted {
          background: #e9e7e2;
          color: #68665f;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          padding: 23px 0;
        }

        .order-details-grid > div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 9px;
        }

        .order-details-grid span {
          color: var(--orders-muted);
          font-size: 10px;
        }

        .order-details-grid strong {
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .order-details-grid .order-total {
          font-family: var(--serif, Georgia, serif);
          font-size: 19px;
        }

        .order-items {
          padding: 19px 0;
          border-top: 1px solid #e8e4dc;
        }

        .order-items-heading {
          display: block;
          margin-bottom: 15px;
        }

        .order-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 10px 0;
        }

        .order-item > div {
          display: grid;
          gap: 5px;
        }

        .order-item strong {
          font-size: 12px;
          line-height: 1.5;
        }

        .order-item span {
          color: var(--orders-muted);
          font-size: 11px;
        }

        .order-card-footer {
          padding-top: 16px;
          border-top: 1px solid #e8e4dc;
          color: var(--orders-muted);
          font-size: 11px;
          line-height: 1.8;
        }

        .orders-empty {
          padding: 60px 25px;
          border: 1px solid rgba(22, 22, 20, 0.13);
          background: var(--orders-paper);
          text-align: center;
        }

        .orders-empty-mark {
          display: grid;
          width: 53px;
          height: 53px;
          margin: 0 auto 23px;
          place-items: center;
          border: 1px solid #d8d5cc;
          border-radius: 50%;
          color: var(--orders-olive);
          font-size: 23px;
        }

        .orders-empty h3 {
          margin: 0 0 13px;
          font-family: var(--serif, Georgia, serif);
          font-size: 31px;
          font-weight: 400;
        }

        .orders-empty p {
          max-width: 470px;
          margin: 0 auto 25px;
          color: var(--orders-muted);
          font-size: 13px;
          line-height: 1.9;
        }

        .orders-bottom-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid rgba(22, 22, 20, 0.13);
        }

        .orders-bottom-action p {
          color: var(--orders-muted);
          font-size: 12px;
        }

        .orders-secondary {
          padding-bottom: 5px;
          border-bottom: 1px solid var(--orders-olive);
        }

        .orders-global-error {
          max-width: 500px;
          margin: -55px auto 60px;
          text-align: center;
        }

        .orders-footer {
          display: flex;
          min-height: 85px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid rgba(22, 22, 20, 0.13);
          color: var(--orders-muted);
          font-size: 10px;
        }

        .orders-footer span:first-child {
          color: var(--orders-ink);
          font-weight: 700;
          letter-spacing: 0.15em;
        }

        @media (max-width: 650px) {
          .reis-orders {
            padding: 0 5%;
          }

          .orders-header {
            min-height: 72px;
          }

          .orders-brand {
            font-size: 21px;
          }

          .orders-back {
            font-size: 11px;
          }

          .orders-intro {
            margin: 54px auto 35px;
          }

          .orders-intro h1 {
            font-size: 49px;
          }

          .orders-intro > p {
            font-size: 13px;
          }

          .orders-access {
            padding: 27px 20px;
            margin-bottom: 60px;
          }

          .orders-section-heading h2 {
            font-size: 31px;
          }

          .order-card {
            padding: 19px;
          }

          .order-card-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 13px;
          }

          .order-status {
            max-width: 100%;
          }

          .order-details-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 15px;
          }

          .orders-empty {
            padding: 45px 20px;
          }

          .orders-empty h3 {
            font-size: 27px;
          }

          .orders-bottom-action {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .orders-footer {
            align-items: flex-start;
            flex-direction: column;
            justify-content: center;
            gap: 9px;
            padding: 22px 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orders-spinner {
            animation: none;
          }

          .orders-primary {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
