import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function isValidRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "super_admin";
}

function toAdminUser(
  uid: string,
  data: DocumentData | undefined
): AdminUser | null {
  if (!data) return null;

  if (
    typeof data.email !== "string" ||
    typeof data.displayName !== "string" ||
    typeof data.active !== "boolean" ||
    !isValidRole(data.role)
  ) {
    return null;
  }

  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    active: data.active,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getAuthorizedAdmin(
  user: User
): Promise<AdminUser | null> {
  const snapshot = await getDoc(doc(db, "adminUsers", user.uid));

  if (!snapshot.exists()) {
    return null;
  }

  const admin = toAdminUser(user.uid, snapshot.data());

  if (!admin || !admin.active) {
    return null;
  }

  return admin;
}

export function watchAdminAuth(
  callback: (
    user: User | null,
    admin: AdminUser | null,
    loading: boolean
  ) => void
) {
  let active = true;

  callback(null, null, true);

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!active) return;

    if (!user) {
      callback(null, null, false);
      return;
    }

    try {
      const admin = await getAuthorizedAdmin(user);

      if (!active) return;

      if (!admin) {
        await signOut(auth);
        callback(null, null, false);
        return;
      }

      callback(user, admin, false);
    } catch (error) {
      console.error("Admin authorization check failed:", error);

      if (active) {
        await signOut(auth);
        callback(null, null, false);
      }
    }
  });

  return () => {
    active = false;
    unsubscribe();
  };
}

export function isAdminRole(role: AdminRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: AdminRole): boolean {
  return role === "super_admin";
}
