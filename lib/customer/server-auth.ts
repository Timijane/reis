import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function verifyCustomerToken(
  request: Request,
): Promise<DecodedIdToken | null> {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    return null;
  }

  try {
    return await getAuth(getAdminApp()).verifyIdToken(token);
  } catch {
    return null;
  }
}
