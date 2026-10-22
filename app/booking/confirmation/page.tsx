import Link from 'next/link';
import { getAdminDb } from '@/lib/firebase-admin';
import CopyReferenceButton from './CopyReferenceButton';

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

function formatMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '£0.00';

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return 'To be confirmed';

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default async function Confirmation({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const params = await searchParams;
  const reference = (params.reference || '').trim();

  let booking: Record<string, any> | null = null;

  if (reference && reference.length <= 150) {
    try {
      const snapshot = await getAdminDb()
        .collection('bookings')
        .doc(reference)
        .get();

      if (snapshot.exists) {
        const data = snapshot.data();

        if (data?.reference === reference) {
          booking = data;
        }
      }
    } catch (error) {
      console.error('Unable to load booking confirmation:', error);
    }
  }

  const items: BookingItem[] = Array.isArray(booking?.items)
    ? booking.items
    : [];

  return (
    <main
      className="section"
      style={{
        minHeight: '75vh',
        background: '#f7f6f2',
        padding: '64px 20px 80px',
      }}
    >
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              border: '1px solid #9aa992',
              background: '#e8eee5',
              color: '#405641',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 22px',
              fontSize: 27,
            }}
            aria-hidden="true"
          >
            ✓
          </div>

          <p className="eyebrow">REIS EVENT SERVICES</p>

          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              lineHeight: 1.15,
              margin: '12px 0',
            }}
          >
            Your request is received.
          </h1>

          <p
            className="muted"
            style={{
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.8,
            }}
          >
            Thank you for choosing REIS. Your rental request has been
            submitted and is awaiting review by our team.
          </p>
        </div>

        <section
          style={{
            background: '#fff',
            border: '1px solid #e3e1d9',
            padding: 'clamp(22px, 5vw, 38px)',
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              marginBottom: 22,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  color: '#687765',
                  margin: '0 0 9px',
                }}
              >
                YOUR BOOKING REFERENCE
              </p>

              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 'clamp(22px, 5vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  overflowWrap: 'anywhere',
                  color: '#282d27',
                }}
              >
                {reference || 'Unavailable'}
              </div>
            </div>

            {reference && <CopyReferenceButton reference={reference} />}
          </div>

          <p
            className="muted"
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Keep this reference safe. It helps our team identify your
            booking when you contact us. It is not a payment code.
          </p>

          {items.length > 0 && (
            <div
              style={{
                borderTop: '1px solid #e8e6df',
                marginTop: 28,
                paddingTop: 24,
              }}
            >
              <h2 style={{ fontSize: 21, margin: '0 0 20px' }}>
                Your requested rentals
              </h2>

              <div>
                {items.map((item, index) => (
                  <div
                    key={`${item.productId || item.name || 'item'}-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      gap: 16,
                      padding: '17px 0',
                      borderBottom:
                        index === items.length - 1
                          ? 'none'
                          : '1px solid #eeece6',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          margin: '0 0 7px',
                        }}
                      >
                        {item.name || 'Rental item'}
                      </h3>

                      <p
                        className="muted"
                        style={{
                          fontSize: 13,
                          lineHeight: 1.8,
                          margin: 0,
                        }}
                      >
                        Quantity: {Number(item.quantity) || 0}
                        {item.tentSize ? ` · Size: ${item.tentSize}` : ''}
                        <br />
                        Rental date: {formatDate(item.eventDate)}
                        {item.endDate &&
                        item.endDate !== item.eventDate ? (
                          <>
                            <br />
                            Return date: {formatDate(item.endDate)}
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatMoney(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  borderTop: '1px solid #dcdad1',
                  paddingTop: 20,
                  marginTop: 6,
                  fontWeight: 700,
                }}
              >
                <span>Current booking total</span>
                <span>{formatMoney(booking?.total)}</span>
              </div>

              <p
                className="muted"
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  margin: '12px 0 0',
                }}
              >
                This is the total recorded for your request. REIS will confirm
                the final arrangements and payment instructions after review.
              </p>
            </div>
          )}
        </section>

        <section
          style={{
            background: '#edf0e9',
            borderLeft: '4px solid #75866e',
            padding: '24px clamp(20px, 4vw, 30px)',
            marginBottom: 28,
          }}
        >
          <h2 style={{ fontSize: 20, margin: '0 0 16px' }}>
            What happens next?
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 22,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  margin: '0 0 8px',
                  color: '#586b54',
                }}
              >
                01 — REVIEW
              </p>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                Our team checks your requested items and availability.
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  margin: '0 0 8px',
                  color: '#586b54',
                }}
              >
                02 — APPROVAL
              </p>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                We confirm the booking and provide the applicable payment
                instructions.
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  margin: '0 0 8px',
                  color: '#586b54',
                }}
              >
                03 — RESERVATION
              </p>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                Your reservation is held temporarily for 24 hours. Follow
                the instructions provided to complete payment within the
                applicable period.
              </p>
            </div>
          </div>
        </section>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Link className="btn" href="/">
            Back to homepage
          </Link>

          <Link className="btn alt" href="/booking">
            Explore more rentals
          </Link>
        </div>

        <p
          className="muted"
          style={{
            textAlign: 'center',
            fontSize: 12,
            lineHeight: 1.8,
            marginTop: 28,
          }}
        >
          We style your event, you create memories.
        </p>
      </div>
    </main>
  );
}
