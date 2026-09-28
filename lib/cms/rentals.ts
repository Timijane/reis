import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/booking";

export type Rental = Product;

export async function getRentals(): Promise<Rental[]> {
  const snapshot = await getDocs(
    query(collection(db, "products"), orderBy("name", "asc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Rental, "id">),
  }));
}

export async function getRental(id: string): Promise<Rental | null> {
  const snapshot = await getDoc(doc(db, "products", id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Rental, "id">),
  };
}

export async function getRentalBySlug(
  slug: string
): Promise<Rental | null> {
  const snapshot = await getDocs(
    query(collection(db, "products"))
  );

  const match = snapshot.docs.find(
    (item) => item.data().slug === slug
  );

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    ...(match.data() as Omit<Rental, "id">),
  };
}

export async function getActiveRentals(): Promise<Rental[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "products"),
      where("active", "==", true),
      orderBy("name", "asc")
    )
  );

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Rental, "id">),
    }))
    .filter((rental) => rental.type === "rental");
}

export async function getRentalsByCategory(
  categoryId: string
): Promise<Rental[]> {
  const rentals = await getActiveRentals();

  return rentals.filter(
    (rental) => rental.categoryId === categoryId
  );
}

export async function createRental(
  rental: Omit<Rental, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(collection(db, "products"), {
    ...rental,
    type: "rental",
    currency: "GBP",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRental(
  id: string,
  updates: Partial<Omit<Rental, "id" | "createdAt">>
) {
  return updateDoc(doc(db, "products", id), {
    ...updates,
    type: "rental",
    currency: "GBP",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRental(id: string) {
  return deleteDoc(doc(db, "products", id));
}
