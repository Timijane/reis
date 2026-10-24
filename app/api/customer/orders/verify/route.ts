import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const destination = new URL('/orders', request.url);

  if (!/^[a-f0-9]{64}$/.test(token)) {
    destination.searchParams.set('access', 'invalid');
    return NextResponse.redirect(destination);
  }

  try {
    const db = getAdminDb();
    const tokenRef = db.collection('customerOrderAccessTokens').doc(hash(token));
    const sessionToken = randomBytes(32).toString('hex');
    const sessionRef = db
      .collection('customerOrderSessions')
      .doc(hash(sessionToken));

    const now = Date.now();

    const verified = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tokenRef);

      if (!snapshot.exists) return false;

      const data = snapshot.data()!;

      if (
        data.usedAt !== null ||
        typeof data.expiresAt !== 'number' ||
        data.expiresAt <= now ||
        typeof data.emailNormalized !== 'string'
      ) {
        return false;
      }

      transaction.update(tokenRef, { usedAt: now });

      transaction.set(sessionRef, {
        emailNormalized: data.emailNormalized,
        createdAt: now,
        expiresAt: now + 7 * 24 * 60 * 60_000,
      });

      return true;
    });

    if (!verified) {
      destination.searchParams.set('access', 'invalid');
      return NextResponse.redirect(destination);
    }

    const response = NextResponse.redirect(destination);

    response.cookies.set('reis_customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Order-history link verification failed:', error);
    destination.searchParams.set('access', 'error');
    return NextResponse.redirect(destination);
  }
}
