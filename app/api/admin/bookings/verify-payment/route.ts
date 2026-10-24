import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSiteUrl } from '@/lib/site-url';
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
    const receiptVerificationToken = randomBytes(32).toString('hex');

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
        ['expired', 'cancelled', 'rejected'].includes(
          String(booking.reservationStatus || '').toLowerCase(),
        ) ||
        ['expired', 'cancelled', 'rejected'].includes(
          String(booking.status || '').toLowerCase(),
        )
      ) {
        return { error: 'BOOKING_NOT_PAYABLE' as const };
      }

      transaction.update(bookingRef, {
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        paymentVerificationSource: 'manual_admin',
        paymentVerifiedAt: now,
        receiptVerificationToken,
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

      const customer =
        booking.customer && typeof booking.customer === 'object'
          ? booking.customer as Record<string, unknown>
          : {};

      return {
        success: true as const,
        reference,
        paymentStatus: 'paid',
        paymentVerifiedAt: now,
        receiptVerificationToken,
        customerEmail:
          typeof customer.email === 'string' ? customer.email.trim() : '',
        customerName:
          typeof customer.name === 'string' ? customer.name.trim() : '',
        amount: booking.total ?? null,
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

    let emailNotification: 'sent' | 'skipped' | 'failed' = 'skipped';

    const emailApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.REIS_FROM_EMAIL;
    const customerEmail = result.customerEmail;

    if (emailApiKey && emailFrom && customerEmail) {
      try {
        const amount =
          typeof result.amount === 'number'
            ? new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(result.amount)
            : 'the amount recorded on your booking';

        const greeting = result.customerName
          ? `Dear ${result.customerName},`
          : 'Hello,';

        const emailResponse = await fetch(
          'https://api.resend.com/emails',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: emailFrom,
              to: [customerEmail],
              subject: `Payment confirmed — REIS booking ${result.reference}`,
              text: [
                greeting,
                '',
                'REIS Event Services has verified your bank transfer.',
                '',
                `Booking reference: ${result.reference}`,
                `Verify payment receipt: ${getSiteUrl()}/booking/verify?token=${encodeURIComponent(result.receiptVerificationToken)}`,
                `Payment status: Paid`,
                `Booking total: ${amount}`,
                `Verified at: ${result.paymentVerifiedAt}`,
                '',
                'Please keep this email for your records.',
                '',
                'We style your event, you create memories.',
                'REIS Event Services',
              ].join('\n'),
            }),
            signal: AbortSignal.timeout(10000),
          },
        );

        if (!emailResponse.ok) {
          console.error(
            'Payment confirmation email failed:',
            emailResponse.status,
          );
          emailNotification = 'failed';
        } else {
          emailNotification = 'sent';
        }
      } catch (emailError) {
        console.error(
          'Payment confirmation email could not be sent:',
          emailError instanceof Error ? emailError.message : 'Unknown error',
        );
        emailNotification = 'failed';
      }
    }

    return NextResponse.json({
      success: true,
      reference: result.reference,
      paymentStatus: result.paymentStatus,
      paymentVerifiedAt: result.paymentVerifiedAt,
      emailNotification,
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

    console.error('Payment verification API error:', error);

    return NextResponse.json(
      { error: 'Unable to verify payment.' },
      { status: 500 }
    );
  }
}
