import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { bookingReference, holdUntil } from '@/lib/refs';
import { calculate, unitPrice, validateQuantity } from '@/lib/pricing';
import { assertAvailability } from '@/lib/availability';
import type { Booking, Product } from '@/types/booking';

interface BookingRequestItem {
  productId: string;
  quantity: number;
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
    item.quantity > 0
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingRequestBody;

    const customer = body.customer;
    const event = body.event;
    const requestItems = body.items;

    if (
      !customer?.name?.trim() ||
      !customer.email?.trim() ||
      !customer.phone?.trim() ||
      !event?.date?.trim() ||
      !event.venue?.trim() ||
      !Array.isArray(requestItems) ||
      requestItems.length === 0
    ) {
      return NextResponse.json(
        { error: 'Required booking information is missing.' },
        { status: 400 }
      );
    }

    const items = requestItems.filter(isValidItem);

    if (!items.length || items.length !== requestItems.length) {
      return NextResponse.json(
        { error: 'One or more booking items are invalid.' },
        { status: 400 }
      );
    }

    const startDate = event.date.trim();
    const endDate = (event.endDate || event.date).trim();

    if (endDate < startDate) {
      return NextResponse.json(
        {
          error:
            'The event end date cannot be before the start date.',
        },
        { status: 400 }
      );
    }

    const requestedIds = Array.from(
      new Set(items.map((item) => item.productId.trim()))
    );

    if (!requestedIds.length) {
      return NextResponse.json(
        { error: 'No valid products were supplied.' },
        { status: 400 }
      );
    }

    const productSnaps = await Promise.all(
      requestedIds.map((id) =>
        getAdminDb().collection('products').doc(id).get()
      )
    );

    const products: Array<Product | null> = productSnaps.map((snap) =>
      snap.exists
        ? ({ id: snap.id, ...snap.data() } as Product)
        : null
    );

    if (products.some((product) => !product || !product.active)) {
      return NextResponse.json(
        {
          error:
            'One or more products are no longer available.',
        },
        { status: 409 }
      );
    }

    const validProducts = products as Product[];

    const quantities = items.map((item) => ({
      productId: item.productId.trim(),
      quantity: item.quantity,
    }));

    await assertAvailability(
      validProducts,
      quantities,
      startDate,
      endDate
    );

    const priced = validProducts.map((product) => {
      const source = items.find(
        (item) => item.productId.trim() === product.id
      );

      if (!source) {
        throw new Error(
          `Product ${product.name} was not included in the request.`
        );
      }

      validateQuantity(product, source.quantity);

      return {
        product,
        quantity: source.quantity,
      };
    });

    const pricing = calculate(priced, 0, 0, 0, 0);

    const durationDays =
      Math.max(
        1,
        Math.ceil(
          (new Date(endDate).getTime() -
            new Date(startDate).getTime()) /
            86400000
        ) + 1
      );

    const bookingItems = priced.map(({ product, quantity }) => {
      const normalTotal = product.price * quantity;
      const actualUnitPrice = unitPrice(product);
      const actualTotal = actualUnitPrice * quantity;
      const promoDiscount = Math.max(
        0,
        normalTotal - actualTotal
      );

      const source = items.find(
        (item) => item.productId.trim() === product.id
      );

      return {
        productId: product.id,
        name: product.name,
        type: product.type,
        quantity,
        unitPrice: actualUnitPrice,
        promoDiscount,
        total: actualTotal,
        eventDate: startDate,
        endDate,
        durationDays,
        image: product.image,
        tentSize: source?.tentSize,
      };
    });

    const now = new Date().toISOString();
    const reference = bookingReference();

    const booking: Booking = {
      id: reference,
      reference,

      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        whatsapp: customer.whatsapp?.trim() || undefined,
      },

      event: {
        date: startDate,
        endDate,
        eventType: event.eventType?.trim() || '',
        venue: event.venue.trim(),
        postcode: event.postcode?.trim() || undefined,
        guestCount:
          typeof event.guestCount === 'number'
            ? event.guestCount
            : undefined,
      },

      items: bookingItems,
      productIds: requestedIds,

      site: body.site,
      serviceDescription: body.serviceDescription,
      servicePhotos: body.servicePhotos,

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
        pricing.deposit > 0
          ? 'required'
          : 'not_required',

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
