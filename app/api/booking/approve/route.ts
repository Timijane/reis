import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin/server-auth';
import { paymentCode } from '@/lib/refs';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const { reference, adminNote } = await request.json();

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { error: 'Reference is required.' },
        { status: 400 }
      );
    }

    const ref = getAdminDb()
      .collection('bookings')
      .doc(reference);

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      );
    }

    const data = snap.data()!;

    const code =
      typeof data.paymentCode === 'string' && data.paymentCode
        ? data.paymentCode
        : paymentCode();

    const now = new Date().toISOString();

    await ref.update({
      status: 'approved',
      reservationStatus: 'confirmed',
      paymentStatus: 'unpaid',
      paymentCode: code,
      adminNote:
        typeof adminNote === 'string'
          ? adminNote.trim()
          : '',
      updatedAt: now,
    });

    return NextResponse.json({
      reference,
      paymentCode: code,
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
