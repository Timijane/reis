import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyCustomerToken } from '@/lib/customer/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dateValue(value: unknown): string {
  if (typeof value === 'string') return value;

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    try {
      return value.toDate().toISOString();
    } catch {
      return '';
    }
  }

  return '';
}

export async function GET(request: Request) {
  const identity = await verifyCustomerToken(request);

  if (!identity?.uid) {
    return NextResponse.json(
      { error: 'Please sign in to access your orders.' },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  try {
    const db = getAdminDb();

    // Retrieve bookings belonging to this authenticated customer only.
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('customerUid', '==', identity.uid)
      .get();

    const bookingOrders = bookingsSnapshot.docs.map((doc) => {
      const booking = doc.data();
      const event = booking.event || {};

      return {
        type: 'booking' as const,
        reference:
          typeof booking.reference === 'string'
            ? booking.reference
            : doc.id,
        createdAt: dateValue(booking.createdAt),
        status: String(
          booking.status || 'pending_review'
        ).toLowerCase(),
        reservationStatus: String(
          booking.reservationStatus || 'held'
        ).toLowerCase(),
        paymentStatus: String(
          booking.paymentStatus || 'unpaid'
        ).toLowerCase(),
        fulfilmentStatus: String(
          booking.fulfilmentStatus || 'not_scheduled'
        ).toLowerCase(),
        paymentVerifiedAt: dateValue(booking.paymentVerifiedAt),
        event: {
          date: typeof event.date === 'string' ? event.date : '',
          endDate:
            typeof event.endDate === 'string' ? event.endDate : '',
          eventType:
            typeof event.eventType === 'string'
              ? event.eventType
              : '',
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
        subtotal:
          typeof booking.subtotal === 'number' ? booking.subtotal : 0,
        discount:
          typeof booking.discount === 'number' ? booking.discount : 0,
        deliveryFee:
          typeof booking.deliveryFee === 'number'
            ? booking.deliveryFee
            : 0,
        total: typeof booking.total === 'number' ? booking.total : 0,
      };
    });

    // Retrieve styling enquiries belonging to the same customer.
    const stylingSnapshot = await db
      .collection('stylingEnquiries')
      .where('customerUid', '==', identity.uid)
      .get();

    const stylingOrders = stylingSnapshot.docs.map((doc) => {
      const enquiry = doc.data();

      return {
        type: 'styling_enquiry' as const,
        reference:
          typeof enquiry.reference === 'string'
            ? enquiry.reference
            : doc.id,
        createdAt: dateValue(enquiry.createdAt),
        status: String(enquiry.status || 'new').toLowerCase(),
        event: {
          date:
            typeof enquiry.eventDate === 'string'
              ? enquiry.eventDate
              : '',
          endDate: '',
          eventType:
            typeof enquiry.eventType === 'string'
              ? enquiry.eventType
              : 'Other',
          venue:
            typeof enquiry.venue === 'string' ? enquiry.venue : '',
        },
        description:
          typeof enquiry.description === 'string'
            ? enquiry.description
            : '',
      };
    });

    const orders = [...bookingOrders, ...stylingOrders].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );

    return NextResponse.json(
      { orders },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Customer order-history lookup failed:', error);

    return NextResponse.json(
      { error: 'Unable to load your orders right now.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
