import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const decoded = await getAuthToken(token);

  const adminSnapshot = await getAdminDb()
    .collection('adminUsers')
    .doc(decoded.uid)
    .get();

  if (!adminSnapshot.exists) {
    throw new Error('FORBIDDEN');
  }

  const data = adminSnapshot.data();

  if (
    data?.active !== true ||
    (data?.role !== 'admin' && data?.role !== 'super_admin')
  ) {
    throw new Error('FORBIDDEN');
  }

  return decoded;
}

async function getAuthToken(token: string): Promise<DecodedIdToken> {
  try {
    const adminAuth = getAuth();
    return await adminAuth.verifyIdToken(token);
  } catch {
    throw new Error('UNAUTHORIZED');
  }
}
