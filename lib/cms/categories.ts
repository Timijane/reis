import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RentalCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
  featuredOnHomepage: boolean;
  homepageOrder: number;
  destinationType: "category" | "rental" | "custom";
  destination: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultCategories: Omit<
  RentalCategory,
  "id" | "createdAt" | "updatedAt"
>[] = [
  ["Marquee", "marquee"],
  ["Foldable Chairs", "foldable-chairs"],
  ["Chiavari Chairs", "chiavari-chairs"],
  ["Kids Chiavari Chairs & Tables", "kids-chiavari-chairs-tables"],
  ["5ft/6ft Rectangular Tables", "5ft-6ft-rectangular-tables"],
  ["4ft Rectangular Tables", "4ft-rectangular-tables"],
  ["Chair Covers", "chair-covers"],
  ["Table Covers", "table-covers"],
  ["Table Runners", "table-runners"],
  ["Chair Sashes", "chair-sashes"],
  ["Arches", "arches"],
  ["Flowers for Arches", "flowers-for-arches"],
  ["Centrepieces", "centrepieces"],
  ["Flowers for Centrepieces", "flowers-for-centrepieces"],
  ["Gas Burners", "gas-burners"],
  ["Gas Cylinders", "gas-cylinders"],
  ["Large Cooking Utensils", "large-cooking-utensils"],
  ["Chafing Dishes", "chafing-dishes"],
  ["Charger Plates", "charger-plates"],
  ["Coolers", "coolers"],
  ["Cocktail Jars", "cocktail-jars"],
  ["Champagne & Wine Cups", "champagne-wine-cups"],
  ["Drapes", "drapes"],
  ["Ceiling Pleats", "ceiling-pleats"],
  ["Cake Tables", "cake-tables"],
  ["Chaise Chairs", "chaise-chairs"],
  ["Crockery", "crockery"],
  ["Kids Soft Play", "kids-soft-play"],
  ["Lighting", "lighting"],
  ["Flooring", "flooring"],
].map(([name, slug], index) => ({
  name,
  slug,
  description: "",
  imageUrl: "",
  active: true,
  featuredOnHomepage: index < 8,
  homepageOrder: index < 8 ? index + 1 : 999,
  destinationType: "category" as const,
  destination: `/rentals?category=${slug}`,
}));

export async function getCategories(): Promise<RentalCategory[]> {
  const snapshot = await getDocs(
    query(collection(db, "categories"), orderBy("homepageOrder", "asc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<RentalCategory, "id">),
  }));
}

export async function createCategory(
  category: Omit<RentalCategory, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(collection(db, "categories"), {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<RentalCategory, "id" | "createdAt">>
) {
  return updateDoc(doc(db, "categories", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string) {
  return deleteDoc(doc(db, "categories", id));
}
