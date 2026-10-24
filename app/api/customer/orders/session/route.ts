import { NextResponse } from 'next/server';

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('reis_customer_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}
