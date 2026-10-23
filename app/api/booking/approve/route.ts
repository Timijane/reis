import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin/server-auth';
import { paymentCode } from '@/lib/refs';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const reference =
      typeof body.reference === 'string' ? body.reference.trim() : '';

    const adminNote =
      typeof body.adminNote === 'string'
        ? body.adminNote.trim().slice(0, 2000)
        : '';

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc(reference);

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);

      if (!snapshot.exists) {
        return { error: 'BOOKING_NOT_FOUND' as const };
      }

      const booking = snapshot.data()!;

      if (booking.status === 'approved') {
        return {
          error: 'ALREADY_APPROVED' as const,
          approvedAt: booking.approvedAt ?? null,
        };
      }

      if (booking.status !== 'pending_review') {
        return {
          error: 'INVALID_STATUS' as const,
          status: booking.status ?? 'unknown',
        };
      }

      if (
        booking.reservationStatus === 'expired' ||
        booking.status === 'expired' ||
        booking.status === 'cancelled' ||
        booking.status === 'rejected'
      ) {
        return { error: 'BOOKING_NOT_APPROVABLE' as const };
      }

      const now = new Date().toISOString();
      const code =
        typeof booking.paymentCode === 'string' && booking.paymentCode.trim()
          ? booking.paymentCode
          : paymentCode();

      transaction.update(bookingRef, {
        status: 'approved',
        reservationStatus: 'confirmed',
        paymentStatus: booking.paymentStatus ?? 'unpaid',
        paymentCode: code,
        approvedAt: now,
        approvedBy: admin.uid,
        adminNote,
        updatedAt: now,
      });

      return {
        success: true as const,
        reference,
        paymentCode: code,
        approvedAt: now,
        approvedBy: admin.uid,
      };
    });

    if ('error' in result) {
      if (result.error === 'BOOKING_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Booking not found.' },
          { status: 404 }
        );
      }

      if (result.error === 'ALREADY_APPROVED') {
        return NextResponse.json(
          {
            error: 'This booking has already been approved.',
            approvedAt: result.approvedAt,
          },
          { status: 409 }
        );
      }

      if (result.error === 'INVALID_STATUS') {
        return NextResponse.json(
          {
            error: 'Only bookings awaiting review can be approved.',
            status: result.status,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'This booking can no longer be approved.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      reference: result.reference,
      paymentCode: result.paymentCode,
      approvedAt: result.approvedAt,
      approvedBy: result.approvedBy,
    });
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

    console.error('Booking approval API error:', error);

    return NextResponse.json(
      { error: 'Unable to approve booking.' },
      { status: 500 }
    );
  }
}
