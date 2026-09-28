import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const provided =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.headers.get('x-cron-secret');

  return provided === secret;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const db = getAdminDb();

    const snap = await db
      .collection('bookings')
      .where('reservationStatus', '==', 'held')
      .get();

    let expired = 0;
    const now = Date.now();
    const batch = db.batch();

    for (const doc of snap.docs) {
      const data = doc.data();

      if (
        data.holdExpiresAt &&
        new Date(data.holdExpiresAt).getTime() <= now &&
        data.paymentStatus !== 'paid'
      ) {
        batch.update(doc.ref, {
          reservationStatus: 'expired',
          status: 'expired',
          updatedAt: new Date().toISOString(),
        });

        expired++;
      }
    }

    if (expired > 0) {
      await batch.commit();
    }

    return NextResponse.json({ expired });
  } catch (error) {
    console.error('Booking expiry failed:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to expire holds.',
      },
      { status: 500 }
    );
  }
}
