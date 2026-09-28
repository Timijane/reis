import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BrandSettings {
  logoUrl: string;
  brandName: string;
  brandSubtext: string;
  tagline: string;
  shortDescription: string;
  browserTitle: string;
  browserDescription: string;
  footerBrandName: string;
  footerTagline: string;
}

export const defaultBrandSettings: BrandSettings = {
  logoUrl: "",
  brandName: "REIS EVENT",
  brandSubtext: "SERVICES",
  tagline: "We style your event, You create memories!",
  shortDescription:
    "Event rentals, styling and essentials for beautifully planned celebrations across the UK.",
  browserTitle: "REIS EVENT | Event Rentals & Styling",
  browserDescription:
    "REIS Event Services provides event rentals, styling and event essentials across the UK.",
  footerBrandName: "REIS Event Services",
  footerTagline: "We style your event, You create memories!",
};

const brandRef = doc(db, "siteContent", "brand");

export async function getBrandSettings(): Promise<BrandSettings> {
  const snapshot = await getDoc(brandRef);

  if (!snapshot.exists()) {
    return defaultBrandSettings;
  }

  const data = snapshot.data() as Partial<BrandSettings>;

  return {
    ...defaultBrandSettings,
    ...data,
  };
}

export async function saveBrandSettings(
  settings: BrandSettings
): Promise<void> {
  await setDoc(
    brandRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
