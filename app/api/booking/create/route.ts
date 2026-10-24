import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { bookingReference, holdUntil } from '@/lib/refs';
import { calculate, unitPrice, validateQuantity } from '@/lib/pricing';
import { assertAvailability } from '@/lib/availability';
import type { Booking, Product } from '@/types/booking';

interface BookingRequestItem {
  productId: string;
  quantity: number;
  eventDate?: string;
  endDate?: string;
  tentSize?: string;
}

interface BookingRequestBody {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  event?: {
    date?: string;
    endDate?: string;
    eventType?: string;
    venue?: string;
    postcode?: string;
    guestCount?: number;
  };
  items?: BookingRequestItem[];
  site?: Booking['site'];
  serviceDescription?: string;
  servicePhotos?: string[];
}

function isValidItem(item: BookingRequestItem): boolean {
  return (
    typeof item.productId === 'string' &&
    item.productId.trim().length > 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    (item.eventDate === undefined ||
      /^\d{4}-\d{2}-\d{2}$/.test(item.eventDate)) &&
    (item.endDate === undefined ||
      /^\d{4}-\d{2}-\d{2}$/.test(item.endDate))
  );
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingRequestBody;
    const customer = body.customer;
    const event = body.event || {};
    const requestItems = body.items;

    if (
      !customer?.name?.trim() ||
      !customer.email?.trim() ||
      !customer.phone?.trim() ||
      !Array.isArray(requestItems) ||
      requestItems.length === 0
    ) {
      return NextResponse.json(
        { error: 'Please provide your name, email, phone number and booking items.' },
        { status: 400 }
      );
    }

    if (!requestItems.every(isValidItem)) {
      return NextResponse.json(
        { error: 'One or more booking items are invalid.' },
        { status: 400 }
      );
    }

    const items = requestItems.map((item) => {
      const eventDate = item.eventDate?.trim() || event.date?.trim() || '';
      const endDate = item.endDate?.trim() || event.endDate?.trim() || eventDate;

      if (!validDate(eventDate) || !validDate(endDate) || endDate < eventDate) {
        throw new Error(
          'Each booking item must have a valid event date and end date.'
        );
      }

      return {
        ...item,
        productId: item.productId.trim(),
        eventDate,
        endDate,
      };
    });

    const requestedIds = [...new Set(items.map((item) => item.productId))];

    const productSnaps = await Promise.all(
      requestedIds.map((id) =>
        getAdminDb().collection('products').doc(id).get()
      )
    );

    const products: Array<Product | null> = productSnaps.map((snap) =>
      snap.exists ? ({ id: snap.id, ...snap.data() } as Product) : null
    );

    if (products.some((product) => !product || !product.active)) {
      return NextResponse.json(
        { error: 'One or more products are no longer available.' },
        { status: 409 }
      );
    }

    const validProducts = products as Product[];

    const priced = items.map((source) => {
      const product = validProducts.find(
        (entry) => entry.id === source.productId
      );

      if (!product) {
        throw new Error('One of the requested products could not be found.');
      }

      validateQuantity(product, source.quantity);

      return {
        product,
        quantity: source.quantity,
        eventDate: source.eventDate,
        endDate: source.endDate,
        tentSize: source.tentSize,
      };
    });

    await assertAvailability(
      validProducts,
      priced.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        eventDate: item.eventDate,
        endDate: item.endDate,
      }))
    );

    const pricing = calculate(
      priced.map(({ product, quantity }) => ({ product, quantity })),
      0,
      0,
      0,
      0
    );

    const bookingItems = priced.map(
      ({ product, quantity, eventDate, endDate, tentSize }) => {
        const normalTotal = product.price * quantity;
        const actualUnitPrice = unitPrice(product);
        const actualTotal = actualUnitPrice * quantity;
        const promoDiscount = Math.max(0, normalTotal - actualTotal);

        const durationDays = Math.max(
          1,
          Math.ceil(
            (new Date(`${endDate}T00:00:00.000Z`).getTime() -
              new Date(`${eventDate}T00:00:00.000Z`).getTime()) /
              86400000
          ) + 1
        );

        return {
          productId: product.id,
          name: product.name,
          type: product.type,
          quantity,
          unitPrice: actualUnitPrice,
          promoDiscount,
          total: actualTotal,
          eventDate,
          endDate,
          durationDays,
          ...(product.image ? { image: product.image } : {}),
          ...(tentSize ? { tentSize } : {}),
        };
      }
    );

    const dates = bookingItems.map((item) => item.eventDate);
    const endDates = bookingItems.map((item) => item.endDate);
    const startDate = dates.reduce((a, b) => a < b ? a : b);
    const endDate = endDates.reduce((a, b) => a > b ? a : b);

    const now = new Date().toISOString();
    const reference = bookingReference();

    const booking: Booking = {
      id: reference,
      reference,

      customerEmailNormalized: customer.email.trim().toLowerCase(),
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        ...(customer.whatsapp?.trim()
          ? { whatsapp: customer.whatsapp.trim() }
          : {}),
      },

      event: {
        date: startDate,
        endDate,
        eventType: event.eventType?.trim() || '',
        venue: event.venue?.trim() || '',
        ...(event.postcode?.trim()
          ? { postcode: event.postcode.trim() }
          : {}),
        ...(typeof event.guestCount === 'number'
          ? { guestCount: event.guestCount }
          : {}),
      },

      items: bookingItems,
      productIds: requestedIds,

      ...(body.site !== undefined ? { site: body.site } : {}),
      ...(body.serviceDescription !== undefined
        ? { serviceDescription: body.serviceDescription }
        : {}),
      ...(body.servicePhotos !== undefined
        ? { servicePhotos: body.servicePhotos }
        : {}),

      pricing: {
        ...pricing,
        quoteVersion: 1,
      },

      subtotal: pricing.subtotal,
      discount: pricing.discount,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,

      status: 'pending_review',
      reservationStatus: 'held',
      paymentStatus: 'unpaid',

      fulfilmentStatus: 'not_scheduled',

      depositStatus:
        pricing.deposit > 0 ? 'required' : 'not_required',

      holdExpiresAt: holdUntil(24),
      createdAt: now,
      updatedAt: now,
    };

    await getAdminDb()
      .collection('bookings')
      .doc(reference)
      .create(booking);

    return NextResponse.json({
      reference,
      holdExpiresAt: booking.holdExpiresAt,
      total: booking.total,
      currency: 'GBP',
    });
  } catch (error) {
    console.error('Booking creation failed:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create booking.',
      },
      { status: 500 }
    );
  }
}
