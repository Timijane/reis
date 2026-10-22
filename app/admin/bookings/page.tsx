'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type BookingItem = {
  productId?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  eventDate?: string;
  endDate?: string;
  durationDays?: number;
  tentSize?: string;
};

type B = {
  id: string;
  reference: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  event?: {
    date?: string;
    endDate?: string;
    venue?: string;
    eventType?: string;
  };
  items?: BookingItem[];
  total?: number;
  subtotal?: number;
  discount?: number;
  status?: string;
  reservationStatus?: string;
  paymentStatus?: string;
  holdExpiresAt?: string;
  paymentCode?: string;
  createdAt?: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f6f6f2',
    color: '#292d28',
    paddingBottom: 64,
  },
  container: {
    width: '100%',
    maxWidth: 1440,
    margin: '0 auto',
    padding: '30px clamp(16px, 3vw, 38px)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 20,
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.17em',
    color: '#70806b',
    margin: '0 0 10px',
  },
  title: {
    fontSize: 'clamp(30px, 4vw, 42px)',
    letterSpacing: '-0.035em',
    lineHeight: 1.15,
    margin: 0,
  },
  subtitle: {
    color: '#73776f',
    fontSize: 14,
    lineHeight: 1.7,
    margin: '10px 0 0',
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '12px 0 22px',
    borderBottom: '1px solid #e3e4dc',
    marginBottom: 28,
  },
  navLink: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 14px',
    color: '#555d51',
    textDecoration: 'none',
    fontSize: 13,
    border: '1px solid #e0e2d9',
    background: '#fff',
  },
  activeNav: {
    background: '#354737',
    borderColor: '#354737',
    color: '#fff',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
    gap: 14,
    marginBottom: 24,
  },
  stat: {
    background: '#fff',
    border: '1px solid #e5e5de',
    padding: '21px 22px',
    minWidth: 0,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#777c73',
    margin: '0 0 13px',
  },
  statValue: {
    fontSize: 29,
    fontWeight: 650,
    letterSpacing: '-0.035em',
    margin: 0,
    overflowWrap: 'anywhere',
  },
  panel: {
    background: '#fff',
    border: '1px solid #e4e5dd',
    marginBottom: 22,
  },
  panelHeader: {
    padding: '21px 22px',
    borderBottom: '1px solid #e8e9e2',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  panelTitle: {
    fontSize: 18,
    margin: 0,
    fontWeight: 650,
  },
  tools: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: '18px 22px',
    borderBottom: '1px solid #ecece6',
  },
  input: {
    minWidth: 0,
    width: '100%',
    maxWidth: 380,
    padding: '12px 13px',
    border: '1px solid #dcded5',
    background: '#fff',
    color: '#292d28',
    fontSize: 14,
    borderRadius: 0,
  },
  select: {
    padding: '12px 13px',
    border: '1px solid #dcded5',
    background: '#fff',
    color: '#292d28',
    fontSize: 13,
    borderRadius: 0,
    maxWidth: '100%',
  },
  card: {
    borderBottom: '1px solid #ecece6',
    padding: '23px 22px',
  },
  reference: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 700,
    overflowWrap: 'anywhere',
    letterSpacing: '0.025em',
    color: '#354737',
  },
  muted: {
    color: '#777b73',
    fontSize: 13,
    lineHeight: 1.75,
    overflowWrap: 'anywhere',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.13em',
    color: '#7a8075',
    margin: '0 0 9px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 9px',
    fontSize: 11,
    fontWeight: 650,
    border: '1px solid #e0e2d9',
    background: '#f4f5f0',
    color: '#50574c',
    overflowWrap: 'anywhere',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
    gap: '22px 28px',
    marginTop: 24,
  },
  itemRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid #eeeee8',
  },
  empty: {
    textAlign: 'center',
    padding: '54px 22px',
    color: '#73776f',
  },
  notice: {
    padding: '17px 20px',
    background: '#f0f2ec',
    border: '1px solid #dce2d7',
    color: '#3e4d3b',
    lineHeight: 1.7,
    fontSize: 14,
    marginBottom: 20,
    overflowWrap: 'anywhere',
  },
};

function money(value: unknown) {
  const amount = Number(value);

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Number.isFinite(amount) ? amount : 0);
}

function dateTime(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function dateOnly(value?: string) {
  if (!value) return 'Not recorded';

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function badgeStyle(value?: string): React.CSSProperties {
  const normalized = (value || '').toLowerCase();

  if (
    normalized.includes('approved') ||
    normalized.includes('confirmed') ||
    normalized === 'paid' ||
    normalized === 'completed'
  ) {
    return {
      background: '#e9f2e8',
      borderColor: '#cbdcc8',
      color: '#365b36',
    };
  }

  if (
    normalized.includes('cancel') ||
    normalized.includes('expired') ||
    normalized.includes('failed') ||
    normalized.includes('reject')
  ) {
    return {
      background: '#f8eae7',
      borderColor: '#e9d0ca',
      color: '#87473d',
    };
  }

  if (
    normalized.includes('pending') ||
    normalized === 'held' ||
    normalized === 'unpaid'
  ) {
    return {
      background: '#f7f0df',
      borderColor: '#e9ddbd',
      color: '#795f28',
    };
  }

  return {};
}

function StatusBadge({ value }: { value?: string }) {
  const label = (value || 'Not recorded').replace(/_/g, ' ');

  return (
    <span style={{ ...styles.badge, ...badgeStyle(value) }}>
      {label}
    </span>
  );
}

function BookingCard({ booking }: { booking: B }) {
  const [copied, setCopied] = useState(false);

  const items = Array.isArray(booking.items) ? booking.items : [];
  const customer = booking.customer || {};
  const event = booking.event || {};

  async function copyReference() {
    const reference = booking.reference || booking.id;

    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article style={styles.card}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 230px' }}>
          <p style={styles.sectionLabel}>BOOKING REFERENCE</p>
          <div style={styles.reference}>
            {booking.reference || booking.id || 'Unavailable'}
          </div>

          <button
            type="button"
            onClick={copyReference}
            style={{
              marginTop: 9,
              padding: '5px 0',
              border: 0,
              background: 'transparent',
              color: '#5c7157',
              fontSize: 12,
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : 'Copy reference'}
          </button>

          <p style={{ ...styles.muted, margin: '4px 0 0' }}>
            Submitted: {dateTime(booking.createdAt)}
          </p>
        </div>

        <div
          style={{
            textAlign: 'right',
            flex: '0 1 180px',
            minWidth: 0,
          }}
        >
          <p style={styles.sectionLabel}>BOOKING TOTAL</p>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              overflowWrap: 'anywhere',
            }}
          >
            {money(booking.total)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 19,
        }}
      >
        <StatusBadge value={booking.status} />
        <StatusBadge value={booking.reservationStatus} />
        <StatusBadge value={booking.paymentStatus} />
      </div>

      <div style={styles.grid}>
        <section>
          <p style={styles.sectionLabel}>CUSTOMER</p>

          <div style={{ fontSize: 15, fontWeight: 650 }}>
            {customer.name || 'Name not recorded'}
          </div>

          <div style={styles.muted}>
            {customer.email || 'Email not recorded'}
          </div>

          <div style={styles.muted}>
            {customer.phone || 'Phone not recorded'}
          </div>
        </section>

        <section>
          <p style={styles.sectionLabel}>EVENT & RESERVATION</p>

          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {dateOnly(event.date)}
          </div>

          {event.endDate && event.endDate !== event.date && (
            <div style={styles.muted}>
              Overall end date: {dateOnly(event.endDate)}
            </div>
          )}

          {event.eventType && (
            <div style={styles.muted}>{event.eventType}</div>
          )}

          {event.venue && (
            <div style={styles.muted}>{event.venue}</div>
          )}

          <div style={{ ...styles.muted, marginTop: 8 }}>
            Hold expires: {dateTime(booking.holdExpiresAt)}
          </div>
        </section>

        <section>
          <p style={styles.sectionLabel}>RENTAL ITEMS ({items.length})</p>

          {items.length === 0 ? (
            <div style={styles.muted}>Item details unavailable.</div>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.productId || item.name || 'item'}-${index}`}
                style={styles.itemRow}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 650 }}>
                    {item.name || 'Rental item'}
                  </div>

                  <div style={styles.muted}>
                    Qty: {Number(item.quantity) || 0}
                    {item.tentSize ? ` · ${item.tentSize}` : ''}
                  </div>

                  <div style={styles.muted}>
                    {dateOnly(item.eventDate || event.date)}
                    {item.endDate &&
                    item.endDate !== (item.eventDate || event.date)
                      ? ` – ${dateOnly(item.endDate)}`
                      : ''}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 650,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {money(item.total)}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {booking.paymentCode && (
        <div
          style={{
            ...styles.notice,
            marginTop: 22,
            marginBottom: 0,
          }}
        >
          <strong>Payment authorization code:</strong>{' '}
          {booking.paymentCode}
        </div>
      )}
    </article>
  );
}

export default function Bookings() {
  const [items, setItems] = useState<B[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  async function loadBookings(
    user: import('firebase/auth').User,
    isRefresh = false
  ) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/admin/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load bookings.');
      }

      setItems(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load bookings.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Please sign in as an authorized admin.');
        setLoading(false);
        return;
      }

      await loadBookings(user);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((booking) => {
      const customer = booking.customer || {};
      const reference = booking.reference || booking.id || '';

      const searchable = [
        reference,
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        ...(booking.items || []).map((item) => item.name || ''),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' &&
          (booking.status || '').toLowerCase().includes('pending')) ||
        (statusFilter === 'approved' &&
          (booking.status || '').toLowerCase().includes('approved')) ||
        (statusFilter === 'paid' &&
          (booking.paymentStatus || '').toLowerCase() === 'paid') ||
        (statusFilter === 'unpaid' &&
          (booking.paymentStatus || '').toLowerCase() === 'unpaid') ||
        (statusFilter === 'held' &&
          (booking.reservationStatus || '').toLowerCase() === 'held');

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const pendingCount = items.filter((booking) =>
    (booking.status || '').toLowerCase().includes('pending')
  ).length;

  const unpaidCount = items.filter(
    (booking) =>
      (booking.paymentStatus || '').toLowerCase() === 'unpaid'
  ).length;

  const totalValue = items.reduce(
    (sum, booking) => sum + (Number(booking.total) || 0),
    0
  );

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <nav style={styles.nav} aria-label="Admin navigation">
          <Link href="/admin" style={styles.navLink}>
            Dashboard
          </Link>
          <Link
            href="/admin/bookings"
            style={{ ...styles.navLink, ...styles.activeNav }}
            aria-current="page"
          >
            Bookings
          </Link>
          <Link href="/admin/products" style={styles.navLink}>
            Products
          </Link>
        </nav>

        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>REIS EVENT SERVICES · ADMINISTRATION</p>
            <h1 style={styles.title}>Booking management</h1>
            <p style={styles.subtitle}>
              Review customer requests, rental details and reservation
              statuses in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const user = auth.currentUser;

              if (user) {
                void loadBookings(user, true);
              }
            }}
            disabled={loading || refreshing || !auth.currentUser}
            style={{
              padding: '12px 17px',
              border: '1px solid #354737',
              background: loading || refreshing ? '#e5e7e0' : '#354737',
              color: loading || refreshing ? '#5e665a' : '#fff',
              fontSize: 13,
              fontWeight: 650,
              cursor: loading || refreshing ? 'wait' : 'pointer',
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh bookings ↻'}
          </button>
        </header>

        {error && (
          <div role="alert" style={styles.notice}>
            <strong>Unable to load bookings.</strong>
            <div>{error}</div>
          </div>
        )}

        <section style={styles.stats} aria-label="Booking overview">
          <div style={styles.stat}>
            <p style={styles.statLabel}>TOTAL BOOKINGS LOADED</p>
            <p style={styles.statValue}>{items.length}</p>
          </div>

          <div style={styles.stat}>
            <p style={styles.statLabel}>PENDING REVIEW</p>
            <p style={styles.statValue}>{pendingCount}</p>
          </div>

          <div style={styles.stat}>
            <p style={styles.statLabel}>UNPAID BOOKINGS</p>
            <p style={styles.statValue}>{unpaidCount}</p>
          </div>

          <div style={styles.stat}>
            <p style={styles.statLabel}>TOTAL VALUE LOADED</p>
            <p style={{ ...styles.statValue, fontSize: 25 }}>
              {money(totalValue)}
            </p>
          </div>
        </section>

        <section style={styles.panel}>
          <header style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Booking records</h2>
              <p style={{ ...styles.muted, margin: '6px 0 0' }}>
                {loading
                  ? 'Loading booking records…'
                  : `${filteredItems.length} of ${items.length} bookings shown`}
              </p>
            </div>
          </header>

          <div style={styles.tools}>
            <input
              type="search"
              aria-label="Search bookings"
              placeholder="Search reference, customer, email, phone or item"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.input}
            />

            <select
              aria-label="Filter bookings by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={styles.select}
            >
              <option value="all">All bookings</option>
              <option value="pending">Pending review</option>
              <option value="approved">Approved</option>
              <option value="held">Reservation held</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {loading && (
            <div style={styles.empty} role="status">
              Loading your booking records…
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div style={styles.empty}>
              <h3 style={{ color: '#343a32', fontSize: 19 }}>
                No bookings yet
              </h3>
              <p style={styles.muted}>
                New customer booking requests will appear here.
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
            <div style={styles.empty}>
              <h3 style={{ color: '#343a32', fontSize: 19 }}>
                No matching bookings
              </h3>
              <p style={styles.muted}>
                Try another search term or change the status filter.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredItems.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
        </section>

        <p style={{ ...styles.muted, fontSize: 12 }}>
          This page displays booking information returned by the existing
          admin API. It does not approve bookings, change payment statuses,
          or issue payment codes.
        </p>
      </div>
    </main>
  );
}
