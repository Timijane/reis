import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MediaAsset {
  id: string;
  publicId: string;
  secureUrl: string;
  originalFilename: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  resourceType?: string;
  createdAt?: unknown;
  uploadedBy?: string;
}

export async function getMediaAssets(): Promise<MediaAsset[]> {
  const snapshot = await getDocs(collection(db, "media"));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<MediaAsset, "id">),
  }));
}

export async function saveMediaAsset(
  asset: MediaAsset,
  uploadedBy: string
) {
  await setDoc(doc(db, "media", asset.id), {
    ...asset,
    uploadedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMediaAsset(id: string) {
  await deleteDoc(doc(db, "media", id));
}

export async function assignHomepageImage(
  field:
    | "logoUrl"
    | "rental1Image"
    | "rental2Image"
    | "rental3Image"
    | "rental4Image"
    | "rental5Image"
    | "rental6Image"
    | "gallery1Image"
    | "gallery2Image"
    | "gallery3Image"
    | "gallery4Image"
    | "gallery5Image"
    | "aboutImage",
  secureUrl: string
) {
  await setDoc(
    doc(db, "siteContent", "homepage"),
    {
      [field]: secureUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
