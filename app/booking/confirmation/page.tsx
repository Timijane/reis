import Link from 'next/link';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSiteUrl } from '@/lib/site-url';
import QRCode from 'qrcode';
import CopyReferenceButton from './CopyReferenceButton';
import PrintReceiptButton from './PrintReceiptButton';

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

function formatDateTime(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(date);
}

function getBookingStatus(booking: Record<string, any> | null) {
  if (!booking) {
    return {
      title: 'Booking status unavailable',
      description:
        'We could not confirm your booking status. Please check your booking reference or contact REIS.',
      background: '#f1eee7',
      color: '#625947',
    };
  }

  const status = String(booking.status || '').toLowerCase();
  const reservationStatus = String(
    booking.reservationStatus || '',
  ).toLowerCase();
  const paymentStatus = String(
    booking.paymentStatus || 'unpaid',
  ).toLowerCase();

  if (
    status === 'cancelled' ||
    reservationStatus === 'cancelled'
  ) {
    return {
      title: 'Booking cancelled',
      description:
        'This booking has been cancelled. Please contact REIS if you need assistance.',
      background: '#f8e8e6',
      color: '#8a3029',
    };
  }

  if (
    status === 'rejected' ||
    status === 'declined'
  ) {
    return {
      title: 'Booking not approved',
      description:
        'REIS has not approved this booking. Please contact our team if you need further information.',
      background: '#f8e8e6',
      color: '#8a3029',
    };
  }

  if (
    status === 'expired' ||
    reservationStatus === 'expired'
  ) {
    return {
      title: 'Booking expired',
      description:
        'This booking has expired. Please contact REIS to discuss availability before making any payment.',
      background: '#f8e8e6',
      color: '#8a3029',
    };
  }

  if (paymentStatus === 'paid') {
    return {
      title: 'Payment received',
      description:
        'REIS has recorded this booking as paid. Your payment has been marked as received.',
      background: '#e5f1e5',
      color: '#285c35',
    };
  }

  if (status === 'approved' && paymentStatus === 'pending') {
    return {
      title: 'Booking approved — payment pending verification',
      description:
        'Your booking has been approved. Payment is recorded as pending and has not yet been confirmed as received.',
      background: '#f7efda',
      color: '#795719',
    };
  }

  if (status === 'approved') {
    return {
      title: 'Booking approved — payment outstanding',
      description:
        'Your booking has been approved. Follow the payment instructions provided by REIS. Your payment will remain outstanding until the funds are verified.',
      background: '#e5f1e5',
      color: '#285c35',
    };
  }

  if (status === 'pending_review') {
    return {
      title: 'Awaiting booking review',
      description:
        'Thank you for choosing REIS. Our team is reviewing your rental request and will confirm whether your booking can proceed.',
      background: '#f1eee7',
      color: '#625947',
    };
  }

  return {
    title: 'Booking status being checked',
    description:
      'Your booking has been found, but its current status needs confirmation from REIS. Please contact our team if you need assistance.',
    background: '#f1eee7',
    color: '#625947',
  };
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

  const bookingStatus = getBookingStatus(booking);
  const currentStatus = String(booking?.status || '').toLowerCase();
  const paymentStatus = String(
    booking?.paymentStatus || 'unpaid',
  ).toLowerCase();

  const isApproved = currentStatus === 'approved';
  const isPaid = paymentStatus === 'paid';

  const paymentCode =
    isApproved && typeof booking?.paymentCode === 'string'
      ? booking.paymentCode
      : '';

  const paymentVerifiedAt =
    typeof booking?.paymentVerifiedAt === 'string'
      ? booking.paymentVerifiedAt
      : '';

  const receiptVerificationToken =
    typeof booking?.receiptVerificationToken === 'string'
      ? booking.receiptVerificationToken
      : '';

  let receiptQrDataUrl = '';

  if (isPaid && /^[a-f0-9]{64}$/.test(receiptVerificationToken)) {
    try {
      const siteUrl = getSiteUrl();

      receiptQrDataUrl = await QRCode.toDataURL(
        `${siteUrl}/booking/verify?token=${encodeURIComponent(receiptVerificationToken)}`,
        {
          width: 220,
          margin: 2,
          errorCorrectionLevel: 'M',
        },
      );
    } catch (error) {
      console.error('Unable to generate receipt QR code:', error);
    }
  }

  // Read public bank-transfer details only for eligible bookings.
  let bankTransfer: Record<string, string> | null = null;

  const reservationStatus = String(
    booking?.reservationStatus || '',
  ).toLowerCase();

  const canShowBankTransfer =
    isApproved &&
    !isPaid &&
    paymentStatus === 'unpaid' &&
    !['expired', 'cancelled'].includes(reservationStatus) &&
    !['expired', 'cancelled', 'rejected', 'declined'].includes(
      currentStatus,
    );

  if (canShowBankTransfer) {
    try {
      const commerceSnapshot = await getAdminDb()
        .collection('siteSettings')
        .doc('commerce')
        .get();

      const commerce = commerceSnapshot.exists
        ? commerceSnapshot.data() ?? {}
        : {};

      const payments =
        commerce.payments &&
        typeof commerce.payments === 'object'
          ? commerce.payments as Record<string, unknown>
          : {};

      const transfer =
        payments.ukBankTransfer &&
        typeof payments.ukBankTransfer === 'object'
          ? payments.ukBankTransfer as Record<string, unknown>
          : {};

      const publicFields = [
        'displayName',
        'instructions',
        'accountName',
        'bankName',
        'sortCode',
        'accountNumber',
        'iban',
        'swiftBic',
      ];

      const safeDetails: Record<string, string> = {};

      for (const field of publicFields) {
        const value = transfer[field];

        if (typeof value === 'string' && value.trim()) {
          safeDetails[field] = value.trim();
        }
      }

      if (
        transfer.enabled === true &&
        (
          safeDetails.accountName ||
          safeDetails.bankName ||
          safeDetails.accountNumber ||
          safeDetails.iban
        )
      ) {
        bankTransfer = safeDetails;
      }
    } catch (error) {
      console.error('Unable to load bank-transfer instructions:', error);
    }
  }

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
            {isPaid
              ? 'Payment confirmed.'
              : isApproved
                ? 'Your booking is approved.'
                : 'Your request is received.'}
          </h1>

          <p
            className="muted"
            style={{
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.8,
            }}
          >
            {isPaid
              ? 'Thank you. Your payment has been recorded by REIS.'
              : isApproved
                ? 'Your booking has been approved. Check the status and payment information below.'
                : 'Thank you for choosing REIS. Your booking information is shown below.'}
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
            booking when you contact us.
          </p>

          <div
            role="status"
            style={{
              background: bookingStatus.background,
              color: bookingStatus.color,
              padding: '20px',
              marginTop: 26,
              borderLeft: '4px solid currentColor',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                lineHeight: 1.5,
                margin: '0 0 8px',
              }}
            >
              {bookingStatus.title}
            </h2>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {bookingStatus.description}
            </p>
          </div>

          {paymentCode && (
            <div
              style={{
                border: '1px solid #dcdad1',
                padding: 20,
                marginTop: 22,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  color: '#687765',
                  margin: '0 0 10px',
                }}
              >
                PAYMENT AUTHORIZATION CODE
              </p>

              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: 'clamp(21px, 4vw, 28px)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  overflowWrap: 'anywhere',
                  margin: 0,
                  color: '#282d27',
                }}
              >
                {paymentCode}
              </p>

              <p
                className="muted"
                style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                  margin: '12px 0 0',
                }}
              >
                Keep this code for payment identification. It is not proof
                of payment. REIS must verify receipt of the funds.
              </p>
            </div>
          )}

          {bankTransfer && (
            <div
              style={{
                marginTop: 24,
                padding: '24px clamp(18px, 4vw, 28px)',
                background: '#f7f6f2',
                border: '1px solid #dcdad1',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                  color: '#586b54',
                  margin: '0 0 10px',
                }}
              >
                PAYMENT INSTRUCTIONS
              </p>

              <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>
                Pay by bank transfer
              </h2>

              <p
                className="muted"
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  margin: '0 0 20px',
                }}
              >
                Your booking has been approved. Use the bank details below
                and include your payment reference when making the transfer.
                Your booking will remain unpaid until REIS verifies receipt
                of the funds.
              </p>

              {bankTransfer.displayName && (
                <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
                  {bankTransfer.displayName}
                </p>
              )}

              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 18,
                  margin: 0,
                }}
              >
                {[
                  ['Account name', bankTransfer.accountName],
                  ['Bank', bankTransfer.bankName],
                  ['Sort code', bankTransfer.sortCode],
                  ['Account number', bankTransfer.accountNumber],
                  ['IBAN', bankTransfer.iban],
                  ['SWIFT / BIC', bankTransfer.swiftBic],
                ]
                  .filter((entry) => Boolean(entry[1]))
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt
                        className="muted"
                        style={{ fontSize: 12, marginBottom: 5 }}
                      >
                        {label}
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>

              {bankTransfer.instructions && (
                <div
                  style={{
                    borderTop: '1px solid #dcdad1',
                    marginTop: 22,
                    paddingTop: 18,
                  }}
                >
                  <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>
                    Additional instructions
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {bankTransfer.instructions}
                  </p>
                </div>
              )}

              <div
                style={{
                  background: '#fff',
                  border: '1px solid #dcdad1',
                  padding: 16,
                  marginTop: 22,
                }}
              >
                <p
                  className="muted"
                  style={{ fontSize: 12, margin: '0 0 7px' }}
                >
                  PAYMENT REFERENCE — INCLUDE THIS WITH YOUR TRANSFER
                </p>
                <p
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 20,
                    fontWeight: 700,
                    overflowWrap: 'anywhere',
                    margin: 0,
                  }}
                >
                  {paymentCode || reference}
                </p>
              </div>

              <p
                className="muted"
                style={{ fontSize: 12, lineHeight: 1.8, margin: '16px 0 0' }}
              >
                Please verify the account details before transferring money.
                Do not make another payment if you have already transferred
                the funds. Contact REIS if you need assistance.
              </p>
            </div>
          )}

          {isPaid && paymentVerifiedAt && (
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.8,
                margin: '18px 0 0',
                color: '#405641',
              }}
            >
              Payment verification recorded:{' '}
              <strong>{formatDateTime(paymentVerifiedAt)}</strong>
            </p>
          )}

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
                {isPaid
                  ? 'This is the booking total recorded by REIS.'
                  : 'This is the total currently recorded for your request. Check the booking status above before proceeding with payment.'}
              </p>
            </div>
          )}
        </section>


        {isPaid && (
          <section
            className="reis-print-receipt"
            aria-label="Official payment receipt"
            style={{
              marginTop: 24,
              padding: 'clamp(20px, 4vw, 32px)',
              border: '1px solid #dcdad1',
              background: '#fff',
              color: '#282d27',
            }}
          >
            <div style={{ borderBottom: '2px solid #405641', paddingBottom: 18, marginBottom: 22 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, color: '#586b54', margin: '0 0 8px' }}>
                REIS EVENT SERVICES
              </p>
              <h2 style={{ fontSize: 28, margin: '0 0 8px' }}>Payment receipt</h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                This receipt records the payment verified for your booking.
              </p>
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, margin: '0 0 26px' }}>
              <div>
                <dt className="muted" style={{ fontSize: 12, marginBottom: 5 }}>Booking reference</dt>
                <dd style={{ fontFamily: 'monospace', fontWeight: 700, overflowWrap: 'anywhere', margin: 0 }}>{reference}</dd>
              </div>
              <div>
                <dt className="muted" style={{ fontSize: 12, marginBottom: 5 }}>Customer</dt>
                <dd style={{ fontWeight: 600, overflowWrap: 'anywhere', margin: 0 }}>
                  {typeof booking?.customer?.name === 'string' && booking.customer.name.trim()
                    ? booking.customer.name.trim()
                    : 'Customer'}
                </dd>
                {typeof booking?.customer?.email === 'string' && booking.customer.email.trim() && (
                  <dd style={{ fontSize: 13, overflowWrap: 'anywhere', margin: '5px 0 0' }}>
                    {booking.customer.email.trim()}
                  </dd>
                )}
              </div>
              <div>
                <dt className="muted" style={{ fontSize: 12, marginBottom: 5 }}>Payment method</dt>
                <dd style={{ fontWeight: 600, margin: 0 }}>
                  {String(booking?.paymentMethod || '').toLowerCase() === 'bank_transfer'
                    ? 'Bank transfer'
                    : String(booking?.paymentMethod || 'Recorded payment').replace(/_/g, ' ')}
                </dd>
              </div>
              <div>
                <dt className="muted" style={{ fontSize: 12, marginBottom: 5 }}>Payment status</dt>
                <dd style={{ fontWeight: 700, color: '#285c35', margin: 0 }}>PAID — VERIFIED BY REIS</dd>
              </div>
              <div>
                <dt className="muted" style={{ fontSize: 12, marginBottom: 5 }}>Payment verified</dt>
                <dd style={{ fontWeight: 600, margin: 0 }}>{formatDateTime(paymentVerifiedAt) || 'Verification recorded'}</dd>
              </div>
            </dl>

            <h3 style={{ fontSize: 16, margin: '0 0 12px' }}>Booking summary</h3>

            {items.map((item, index) => (
              <div
                key={`receipt-${item.productId || item.name || 'item'}-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: '1px solid #e8e6df',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{item.name || 'Rental item'}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    Quantity: {Number(item.quantity) || 0}
                    {item.tentSize ? ` · Size: ${item.tentSize}` : ''}
                    {item.eventDate ? ` · Date: ${formatDate(item.eventDate)}` : ''}
                  </p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', margin: 0 }}>
                  {formatMoney(item.total)}
                </p>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '2px solid #405641', paddingTop: 18, marginTop: 12 }}>
              <strong>Total paid</strong>
              <strong style={{ fontSize: 20 }}>{formatMoney(booking?.total)}</strong>
            </div>

            {receiptQrDataUrl && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  flexWrap: 'wrap',
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid #dcdad1',
                }}
              >
                <img
                  src={receiptQrDataUrl}
                  alt="Scan to verify this receipt"
                  width={180}
                  height={180}
                  style={{ width: 180, height: 180, objectFit: 'contain' }}
                />
                <div style={{ maxWidth: 300 }}>
                  <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>
                    Verify this receipt
                  </h3>
                  <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    Scan this QR code to check the payment record directly with
                    REIS Event Services. The verification page does not display
                    your personal or bank details.
                  </p>
                </div>
              </div>
            )}

            <p style={{ fontSize: 12, lineHeight: 1.7, color: '#586b54', margin: '22px 0 0' }}>
              Keep this receipt for your records. It confirms that REIS has recorded payment for this booking.
            </p>

            <div className="reis-receipt-print-control" style={{ marginTop: 22 }}>
              <PrintReceiptButton />
            </div>
          </section>
        )}

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

              <p style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
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

              <p style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                Once approved, your booking status and payment authorization
                code will appear here.
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
                03 — PAYMENT
              </p>

              <p style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                Follow REIS payment instructions. Your payment is confirmed
                only after the funds have been verified.
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

      <style>{`
        @media print {
          @page { margin: 14mm; }

          body * {
            visibility: hidden !important;
          }

          .reis-print-receipt,
          .reis-print-receipt * {
            visibility: visible !important;
          }

          .reis-print-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            background: #fff !important;
            color: #000 !important;
            box-sizing: border-box !important;
          }

          .reis-receipt-print-control {
            display: none !important;
          }
        }
      `}</style>

</main>
  );
}
