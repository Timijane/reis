import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function adminApp() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    '\n'
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin environment variables are missing.'
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

let firestoreInstance:
  | ReturnType<typeof getFirestore>
  | null = null;

export function getAdminDb() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(adminApp());
  }

  return firestoreInstance;
}
