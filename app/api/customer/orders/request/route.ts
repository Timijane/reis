import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const genericMessage =
  'If an order exists for that email address, a secure access link will be sent shortly. Check your inbox.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.REIS_FROM_EMAIL;

    if (!apiKey || !emailFrom) {
      return NextResponse.json(
        { error: 'Customer email verification is not configured yet.' },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const now = Date.now();

    // Apply the per-email rate limit before querying bookings.
    const rateRef = db
      .collection('customerOrderAccessRequests')
      .doc(hash(email));

    const allowed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateRef);
      const lastSentAt = snapshot.data()?.lastSentAt;

      if (
        typeof lastSentAt === 'number' &&
        now - lastSentAt < 60_000
      ) {
        return false;
      }

      transaction.set(rateRef, { lastSentAt: now });
      return true;
    });

    if (!allowed) {
      return NextResponse.json({ message: genericMessage });
    }

    // Include normalized bookings and matching legacy bookings.
    const normalizedBookings = await db
      .collection('bookings')
      .where('customerEmailNormalized', '==', email)
      .get();

    const allBookings = await db.collection('bookings').get();

    const matchingDocs = allBookings.docs.filter((doc) => {
      const customerEmail = doc.data().customer?.email;

      return (
        typeof customerEmail === 'string' &&
        customerEmail.trim().toLowerCase() === email
      );
    });

    const matchingRefs = new Map(
      normalizedBookings.docs.map((doc) => [doc.id, doc.ref]),
    );

    for (const doc of matchingDocs) {
      matchingRefs.set(doc.id, doc.ref);
    }

    // Backfill matching legacy records in batches.
    for (let i = 0; i < matchingDocs.length; i += 400) {
      const batch = db.batch();
      let hasUpdates = false;

      for (const doc of matchingDocs.slice(i, i + 400)) {
        if (doc.data().customerEmailNormalized !== email) {
          batch.update(doc.ref, {
            customerEmailNormalized: email,
          });
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await batch.commit();
      }
    }

    if (matchingRefs.size === 0) {
      return NextResponse.json({ message: genericMessage });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = hash(token);

    await db
      .collection('customerOrderAccessTokens')
      .doc(tokenHash)
      .set({
        emailNormalized: email,
        createdAt: now,
        expiresAt: now + 15 * 60_000,
        usedAt: null,
      });

    const verificationLink =
      `${getSiteUrl()}/api/customer/orders/verify?token=${encodeURIComponent(token)}`;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: 'Access your REIS order history',
          text: [
            'Hello,',
            '',
            'Use the secure link below to access your REIS order history.',
            '',
            verificationLink,
            '',
            'This link expires in 15 minutes and can only be used once.',
            'If you did not request this email, you can ignore it.',
            '',
            'REIS Event Services',
          ].join('\n'),
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        console.error(
          'Order-history email failed:',
          response.status,
        );

        await db
          .collection('customerOrderAccessTokens')
          .doc(tokenHash)
          .delete();

        return NextResponse.json(
          { error: 'We could not send the access email. Please try again shortly.' },
          { status: 503 },
        );
      }
    } catch (error) {
      console.error(
        'Order-history email could not be sent:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      await db
        .collection('customerOrderAccessTokens')
        .doc(tokenHash)
        .delete();

      return NextResponse.json(
        { error: 'We could not send the access email. Please try again shortly.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error('Order-history access request failed:', error);

    return NextResponse.json(
      { error: 'Unable to process your request right now.' },
      { status: 500 },
    );
  }
}
