import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "REIS Event Services",
    short_name: "REIS",
    description: "Premium event rentals, styling and event services.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f4ed",
    theme_color: "#354737",
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
