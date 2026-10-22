import { getAdminDb } from './firebase-admin';
import type { Product } from '@/types/booking';

function overlaps(
  start: string,
  end: string,
  otherStart: string,
  otherEnd: string
) {
  return otherStart <= end && otherEnd >= start;
}

function isExpiredHold(booking: any) {
  return (
    booking.reservationStatus === 'held' &&
    booking.holdExpiresAt &&
    new Date(booking.holdExpiresAt).getTime() <= Date.now()
  );
}

function bookingLines(booking: any, productId: string) {
  return (booking.items || [])
    .filter((line: any) => line.productId === productId)
    .map((line: any) => ({
      quantity: Number(line.quantity || 0),
      start: line.eventDate || booking.event?.date || '',
      end:
        line.endDate ||
        line.eventDate ||
        booking.event?.endDate ||
        booking.event?.date ||
        '',
    }));
}

export async function getProductReservations(
  productId: string,
  startDate: string,
  endDate: string
) {
  const snap = await getAdminDb()
    .collection('bookings')
    .where('productIds', 'array-contains', productId)
    .where('reservationStatus', 'in', ['held', 'confirmed'])
    .get();

  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((booking: any) => {
      if (isExpiredHold(booking)) return false;

      return bookingLines(booking, productId).some(
        (line: any) =>
          line.start &&
          overlaps(startDate, endDate, line.start, line.end || line.start)
      );
    });
}

export interface AvailabilityRequestItem {
  productId: string;
  quantity: number;
  eventDate: string;
  endDate?: string;
}

function datesBetween(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export async function assertAvailability(
  products: Product[],
  items: AvailabilityRequestItem[]
) {
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product || !product.active) {
      throw new Error(
        'One of the requested products is no longer available.'
      );
    }

    if (!item.eventDate) {
      throw new Error(`Please select an event date for ${product.name}.`);
    }

    const startDate = item.eventDate;
    const endDate = item.endDate || startDate;

    if (endDate < startDate) {
      throw new Error(
        `The end date cannot be before the event date for ${product.name}.`
      );
    }
  }

  const productIds = [...new Set(items.map((item) => item.productId))];

  for (const productId of productIds) {
    const product = products.find((entry) => entry.id === productId);

    if (!product || product.inventoryMode !== 'quantity_controlled') {
      continue;
    }

    const productItems = items.filter((item) => item.productId === productId);
    const earliest = productItems.reduce(
      (date, item) => item.eventDate < date ? item.eventDate : date,
      productItems[0].eventDate
    );
    const latest = productItems.reduce((date, item) => {
      const end = item.endDate || item.eventDate;
      return end > date ? end : date;
    }, productItems[0].endDate || productItems[0].eventDate);

    const reservations = await getProductReservations(
      productId,
      earliest,
      latest
    );

    for (const day of datesBetween(earliest, latest)) {
      const requested = productItems.reduce((sum, item) => {
        const start = item.eventDate;
        const end = item.endDate || start;
        return day >= start && day <= end ? sum + item.quantity : sum;
      }, 0);

      if (requested === 0) continue;

      const reserved = reservations.reduce((sum: number, booking: any) => {
        const quantityForDay = bookingLines(booking, productId).reduce(
          (lineSum: number, line: any) =>
            day >= line.start && day <= line.end
              ? lineSum + line.quantity
              : lineSum,
          0
        );

        return sum + quantityForDay;
      }, 0);

      const available = Number(product.quantityAvailable || 0) - reserved;

      if (requested > available) {
        throw new Error(
          `${product.name} is not available in the requested quantity for ${day}.`
        );
      }
    }
  }
}
