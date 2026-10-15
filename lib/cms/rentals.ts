import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, ProductType } from "@/types/booking";

export type Rental = Product;

const productsCollection = collection(db, "products");

export async function getRentals(): Promise<Rental[]> {
  const snapshot = await getDocs(
    query(productsCollection, orderBy("name", "asc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Rental, "id">),
  }));
}

export async function getRental(id: string): Promise<Rental | null> {
  const snapshot = await getDoc(doc(db, "products", id));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Rental, "id">),
  };
}

export async function getRentalBySlug(
  slug: string
): Promise<Rental | null> {
  const snapshot = await getDocs(
    query(productsCollection, where("slug", "==", slug))
  );

  const match = snapshot.docs[0];

  if (!match) return null;

  return {
    id: match.id,
    ...(match.data() as Omit<Rental, "id">),
  };
}

export async function getActiveProductsByType(
  type: ProductType
): Promise<Rental[]> {
  const snapshot = await getDocs(
    query(
      productsCollection,
      where("active", "==", true),
      orderBy("name", "asc")
    )
  );

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Rental, "id">),
    }))
    .filter((product) => product.type === type);
}

export async function getActiveRentals(): Promise<Rental[]> {
  return getActiveProductsByType("rental");
}

export async function getActiveTents(): Promise<Rental[]> {
  return getActiveProductsByType("tent");
}

export async function getActiveProducts(): Promise<Rental[]> {
  const snapshot = await getDocs(
    query(
      productsCollection,
      where("active", "==", true),
      orderBy("name", "asc")
    )
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Rental, "id">),
  }));
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
  return addDoc(productsCollection, {
    ...rental,
    type: rental.type || "rental",
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
    currency: "GBP",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRental(id: string) {
  return deleteDoc(doc(db, "products", id));
}
