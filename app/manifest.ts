import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let backgroundColor = "#faf9f6";
  let themeColor = "#68765b";

  try {
    const snapshot = await getAdminDb().doc("siteContent/homepage").get();
    const palette = snapshot.data()?.palette;

    if (palette && typeof palette === "object") {
      if (typeof palette.paper === "string" && palette.paper.trim()) {
        backgroundColor = palette.paper.trim();
      }

      if (typeof palette.olive === "string" && palette.olive.trim()) {
        themeColor = palette.olive.trim();
      }
    }
  } catch (error) {
    console.error("Unable to load CMS palette for PWA manifest:", error);
  }

  return {
    id: "/",
    name: "REIS Event Services",
    short_name: "REIS",
    description: "Premium event rentals, styling and event services.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    orientation: "portrait-primary",
    icons: [
      {
        src: "/api/pwa/icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
