import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin/server-auth';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const reference =
      typeof body.reference === 'string' ? body.reference.trim() : '';

    if (!reference || reference.length > 200) {
      return NextResponse.json(
        { error: 'A valid booking reference is required.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc(reference);
    const eventRef = bookingRef.collection('paymentEvents').doc();
    const now = new Date().toISOString();

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);

      if (!snapshot.exists) {
        return { error: 'BOOKING_NOT_FOUND' as const };
      }

      const booking = snapshot.data()!;

      if (booking.paymentStatus === 'paid') {
        return { error: 'ALREADY_PAID' as const };
      }

      if (booking.status !== 'approved') {
        return { error: 'BOOKING_NOT_APPROVED' as const };
      }

      if (
        booking.reservationStatus === 'expired' ||
        booking.status === 'expired' ||
        booking.status === 'cancelled' ||
        booking.status === 'rejected'
      ) {
        return { error: 'BOOKING_NOT_PAYABLE' as const };
      }

      transaction.update(bookingRef, {
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        paymentVerificationSource: 'manual_admin',
        paymentVerifiedAt: now,
        paymentVerifiedBy: admin.uid,
        paymentVerifiedByEmail: admin.email ?? null,
        updatedAt: now,
      });

      transaction.set(eventRef, {
        type: 'payment_verified',
        paymentMethod: 'bank_transfer',
        amount: booking.total ?? null,
        currency: 'GBP',
        verifiedAt: now,
        verifiedBy: admin.uid,
        verifiedByEmail: admin.email ?? null,
      });

      return {
        success: true as const,
        reference,
        paymentStatus: 'paid',
        paymentVerifiedAt: now,
      };
    });

    if ('error' in result) {
      if (result.error === 'BOOKING_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Booking not found.' },
          { status: 404 }
        );
      }

      if (result.error === 'ALREADY_PAID') {
        return NextResponse.json(
          { error: 'This booking has already been marked as paid.' },
          { status: 409 }
        );
      }

      if (result.error === 'BOOKING_NOT_APPROVED') {
        return NextResponse.json(
          { error: 'Only approved bookings can be marked as paid.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'This booking is no longer eligible for payment verification.' },
        { status: 409 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    console.error('Payment verification API error:', error);

    return NextResponse.json(
      { error: 'Unable to verify payment.' },
      { status: 500 }
    );
  }
}
