import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin/server-auth';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const snap = await getAdminDb()
      .collection('bookings')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const bookings = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ bookings });
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

    console.error('Admin bookings API error:', error);

    return NextResponse.json(
      { error: 'Unable to load bookings.' },
      { status: 500 }
    );
  }
}
