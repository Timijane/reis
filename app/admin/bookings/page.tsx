'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type B = {
  id: string;
  reference: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  event: {
    date: string;
    venue: string;
  };
  total: number;
  status: string;
  reservationStatus: string;
  paymentStatus: string;
  holdExpiresAt?: string;
  paymentCode?: string;
};

export default function Bookings() {
  const [items, setItems] = useState<B[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Please sign in as an authorized admin.');
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();

        const response = await fetch('/api/admin/bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || 'Unable to load bookings.'
          );
        }

        setItems(data.bookings || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load bookings.'
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="admin">
      <div className="adminnav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/bookings">Bookings</Link>
        <Link href="/admin/products">Products</Link>
      </div>

      <div className="section">
        <div className="wrap">
          <h1>Bookings</h1>

          {loading && (
            <div className="notice">
              Loading bookings…
            </div>
          )}

          {!loading && error && (
            <div className="notice">
              {error}
            </div>
          )}

          {!loading && !error && !items.length && (
            <div className="notice">
              No live bookings are available yet.
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Hold</th>
                </tr>
              </thead>

              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>{b.reference}</td>

                    <td>
                      {b.customer.name}
                      <br />
                      <span className="muted">
                        {b.customer.email}
                      </span>
                    </td>

                    <td>{b.event.date}</td>

                    <td>{b.status}</td>

                    <td>{b.paymentStatus}</td>

                    <td>
                      {b.holdExpiresAt || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
