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

export type CatalogueSection = "rentals" | "tents" | "portfolio";

export interface RentalCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
  featuredOnHomepage: boolean;
  homepageOrder: number;
  section?: CatalogueSection;
  destinationType: "category" | "rental" | "custom";
  destination: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function inferCategorySection(category: {
  name?: string;
  slug?: string;
  section?: CatalogueSection;
}): CatalogueSection {
  if (category.section) return category.section;

  const text = `${category.name ?? ""} ${category.slug ?? ""}`.toLowerCase();

  if (
    text.includes("marquee") ||
    text.includes("tent")
  ) {
    return "tents";
  }

  return "rentals";
}

export const catalogueSections: {
  value: CatalogueSection;
  label: string;
  description: string;
}[] = [
  {
    value: "rentals",
    label: "Rentals",
    description: "Chairs, tables, tableware, decorations and equipment.",
  },
  {
    value: "tents",
    label: "Tents & Marquees",
    description: "Tents, marquees and related tent-hire items.",
  },
  {
    value: "portfolio",
    label: "Styling & Portfolio",
    description: "Styling inspiration and completed-event projects.",
  },
];

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
].map(([name, slug], index) => {
  const section: CatalogueSection =
    slug === "marquee" ? "tents" : "rentals";

  return {
    name,
    slug,
    description: "",
    imageUrl: "",
    active: true,
    featuredOnHomepage: index < 8,
    homepageOrder: index < 8 ? index + 1 : 999,
    section,
    destinationType: "category" as const,
    destination:
      section === "tents"
        ? `/booking/tents?category=${slug}`
        : `/booking/rentals?category=${slug}`,
  };
});

export async function getCategories(): Promise<RentalCategory[]> {
  const snapshot = await getDocs(
    query(collection(db, "categories"), orderBy("homepageOrder", "asc"))
  );

  return snapshot.docs.map((item) => {
    const data = item.data() as Omit<RentalCategory, "id">;

    return {
      ...data,
      id: item.id,
      section: inferCategorySection({
        name: data.name,
        slug: data.slug,
        section: data.section,
      }),
    };
  });
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
