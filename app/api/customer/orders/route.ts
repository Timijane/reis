import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

function dateValue(value: unknown): string {
  if (typeof value === 'string') return value;

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString();
  }

  return '';
}

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers
      .get('cookie')
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('reis_customer_session='))
      ?.slice('reis_customer_session='.length);

    if (!sessionToken || !/^[a-f0-9]{64}$/.test(sessionToken)) {
      return NextResponse.json(
        { error: 'Verify your email to access your orders.' },
        { status: 401 },
      );
    }

    const db = getAdminDb();
    const sessionRef = db
      .collection('customerOrderSessions')
      .doc(hash(sessionToken));

    const session = await sessionRef.get();
    const sessionData = session.data();
    const now = Date.now();

    if (
      !session.exists ||
      !sessionData ||
      typeof sessionData.emailNormalized !== 'string' ||
      sessionData.emailNormalized.trim().length === 0 ||
      typeof sessionData.expiresAt !== 'number' ||
      sessionData.expiresAt <= now
    ) {
      const response = NextResponse.json(
        { error: 'Your access has expired. Verify your email again.' },
        { status: 401 },
      );

      response.cookies.delete('reis_customer_session');
      return response;
    }

    const snapshot = await db
      .collection('bookings')
      .where('customerEmailNormalized', '==', sessionData.emailNormalized)
      .get();

    const orders = snapshot.docs.map((doc) => {
      const booking = doc.data();
      const event = booking.event || {};

      return {
        reference:
          typeof booking.reference === 'string' ? booking.reference : doc.id,
        createdAt: dateValue(booking.createdAt),
        status: String(booking.status || 'pending_review').toLowerCase(),
        reservationStatus: String(
          booking.reservationStatus || 'held',
        ).toLowerCase(),
        paymentStatus: String(
          booking.paymentStatus || 'unpaid',
        ).toLowerCase(),
        fulfilmentStatus: String(
          booking.fulfilmentStatus || 'not_scheduled',
        ).toLowerCase(),
        paymentVerifiedAt: dateValue(booking.paymentVerifiedAt),
        event: {
          date: typeof event.date === 'string' ? event.date : '',
          endDate: typeof event.endDate === 'string' ? event.endDate : '',
          eventType:
            typeof event.eventType === 'string' ? event.eventType : '',
        },
        items: Array.isArray(booking.items)
          ? booking.items.map((item: Record<string, unknown>) => ({
              name: typeof item.name === 'string' ? item.name : 'Item',
              quantity:
                typeof item.quantity === 'number' ? item.quantity : 1,
              total: typeof item.total === 'number' ? item.total : 0,
              eventDate:
                typeof item.eventDate === 'string' ? item.eventDate : '',
              endDate:
                typeof item.endDate === 'string' ? item.endDate : '',
              tentSize:
                typeof item.tentSize === 'string' ? item.tentSize : '',
            }))
          : [],
        subtotal: typeof booking.subtotal === 'number' ? booking.subtotal : 0,
        discount: typeof booking.discount === 'number' ? booking.discount : 0,
        deliveryFee:
          typeof booking.deliveryFee === 'number' ? booking.deliveryFee : 0,
        total: typeof booking.total === 'number' ? booking.total : 0,
      };
    });

    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const response = NextResponse.json({ orders });
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Customer order-history lookup failed:', error);

    return NextResponse.json(
      { error: 'Unable to load your orders right now.' },
      { status: 500 },
    );
  }
}
