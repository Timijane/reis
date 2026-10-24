import Link from 'next/link';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export default async function VerifyReceipt({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = (params.token || '').trim();

  let valid = false;
  let reference = '';
  let verifiedAt = '';

  if (/^[a-f0-9]{64}$/.test(token)) {
    try {
      const snapshot = await getAdminDb()
        .collection('bookings')
        .where('receiptVerificationToken', '==', token)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const booking = snapshot.docs[0].data();
        const status = String(booking.status || '').toLowerCase();
        const reservationStatus = String(
          booking.reservationStatus || '',
        ).toLowerCase();

        valid =
          String(booking.paymentStatus || '').toLowerCase() === 'paid' &&
          !['expired', 'cancelled', 'rejected', 'declined'].includes(status) &&
          !['expired', 'cancelled', 'rejected', 'declined'].includes(
            reservationStatus,
          );

        if (valid) {
          reference =
            typeof booking.reference === 'string' ? booking.reference : '';
          verifiedAt =
            typeof booking.paymentVerifiedAt === 'string'
              ? booking.paymentVerifiedAt
              : '';
        }
      }
    } catch (error) {
      console.error('Receipt verification lookup failed:', error);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f7f6f1',
        color: '#282d27',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 560,
          padding: 'clamp(24px, 5vw, 40px)',
          background: '#fff',
          border: '1px solid #dcdad1',
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.16em',
            fontWeight: 700,
            color: '#586b54',
          }}
        >
          REIS EVENT SERVICES
        </p>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Receipt verification
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: valid ? '#285c35' : '#8a3028',
            fontWeight: 700,
          }}
        >
          {valid
            ? 'VALID — PAYMENT RECORDED'
            : 'UNVERIFIED — NO VALID PAYMENT RECEIPT FOUND'}
        </p>
        {valid && (
          <dl style={{ fontSize: 14, lineHeight: 1.8 }}>
            <dt style={{ color: '#625947' }}>Booking reference</dt>
            <dd
              style={{
                margin: '0 0 16px',
                fontWeight: 700,
                overflowWrap: 'anywhere',
              }}
            >
              {reference || 'Unavailable'}
            </dd>
            <dt style={{ color: '#625947' }}>Payment verified</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              {verifiedAt || 'Verification recorded'}
            </dd>
          </dl>
        )}
        <p style={{ fontSize: 13, lineHeight: 1.8, color: '#625947' }}>
          This page checks the payment record held by REIS. It does not display
          customer contact details, booking items, or bank information.
        </p>
        <Link href="/" style={{ color: '#405641', fontWeight: 700 }}>
          Return to REIS
        </Link>
      </section>
    </main>
  );
}
