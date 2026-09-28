import { getAdminDb } from './firebase-admin';
import type { Product } from '@/types/booking';

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) {
  return bookingStart <= end && bookingEnd >= start;
}

export async function getProductReservations(productId: string, startDate: string, endDate: string) {
  const snap = await getAdminDb().collection('bookings')
    .where('productIds', 'array-contains', productId)
    .where('reservationStatus', 'in', ['held', 'confirmed'])
    .get();

  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((booking: any) => {
      const bookingStart = booking.event?.date;
      const bookingEnd = booking.event?.endDate || bookingStart;
      if (!bookingStart) return false;
      if (booking.reservationStatus === 'held' && booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() <= Date.now()) return false;
      return overlaps(startDate, endDate, bookingStart, bookingEnd);
    });
}

export async function assertAvailability(products: Product[], items: { productId: string; quantity: number }[], startDate: string, endDate: string) {
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.active) throw new Error('One of the requested products is no longer available.');
    if (product.inventoryMode !== 'quantity_controlled') continue;

    const reservations = await getProductReservations(item.productId, startDate, endDate);
    const reserved = reservations.reduce((sum: number, booking: any) => {
      return sum + (booking.items || [])
        .filter((line: any) => line.productId === item.productId)
        .reduce((lineSum: number, line: any) => lineSum + Number(line.quantity || 0), 0);
    }, 0);

    const available = Number(product.quantityAvailable || 0) - reserved;
    if (item.quantity > available) {
      throw new Error(`${product.name} is not available in the requested quantity for those dates.`);
    }
  }
}

