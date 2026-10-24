import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyCustomerToken } from '@/lib/customer/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const identity = await verifyCustomerToken(request);

    if (!identity?.uid || !identity?.email) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const snapshot = await db.collection('customers').doc(identity.uid).get();
    const saved = snapshot.exists ? snapshot.data() : undefined;

    return NextResponse.json({
      success: true,
      profile: {
        uid: identity.uid,
        name: typeof saved?.name === 'string' ? saved.name : '',
        email: identity.email,
        phone: typeof saved?.phone === 'string' ? saved.phone : '',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to retrieve the customer profile.' },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const identity = await verifyCustomerToken(request);

    if (!identity || !identity.uid || !identity.email) {
      return NextResponse.json(
        { error: 'Please sign in with a valid customer account.' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid profile information.' },
        { status: 400 },
      );
    }

    const name =
      typeof body.name === 'string' ? body.name.trim() : '';

    const phone =
      typeof body.phone === 'string' ? body.phone.trim() : '';

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { error: 'Please provide your full name.' },
        { status: 400 },
      );
    }

    if (phone.length < 7 || phone.length > 40) {
      return NextResponse.json(
        { error: 'Please provide a valid phone number.' },
        { status: 400 },
      );
    }

    const email = identity.email.trim().toLowerCase();
    const db = getAdminDb();
    const profileRef = db.collection('customers').doc(identity.uid);
    const existingProfile = await profileRef.get();

    const profile = {
      uid: identity.uid,
      name,
      email,
      phone,
      updatedAt: FieldValue.serverTimestamp(),
      ...(!existingProfile.exists
        ? { createdAt: FieldValue.serverTimestamp() }
        : {}),
    };

    await profileRef.set(profile, { merge: true });

    return NextResponse.json(
      {
        success: true,
        profile: {
          uid: identity.uid,
          name,
          email,
          phone,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Customer profile save failed:', error);

    return NextResponse.json(
      { error: 'We could not save your customer profile. Please try again.' },
      { status: 500 },
    );
  }
}
