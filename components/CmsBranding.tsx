"use client";

import { useEffect } from "react";
import { getHomepageContent } from "@/lib/cms/homepage";

export default function CmsBranding() {
  useEffect(() => {
    let active = true;

    getHomepageContent()
      .then((content) => {
        if (!active) return;

        const root = document.documentElement;
        const palette = content.palette;

        root.style.setProperty("--cream", palette.cream);
        root.style.setProperty("--paper", palette.paper);
        root.style.setProperty("--ink", palette.ink);
        root.style.setProperty("--muted", palette.muted);
        root.style.setProperty("--olive", palette.olive);
        root.style.setProperty("--footer", palette.footer);
        root.style.setProperty(
          "--line",
          `color-mix(in srgb, ${palette.ink} 15%, transparent)`
        );
      })
      .catch((error) => {
        console.error("Failed to load global REIS CMS branding:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
