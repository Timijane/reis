import type { Metadata } from "next";
import Script from "next/script";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reis Invent Service | Event Rentals & Styling",
  description:
    "We style your event, You create memories! Premium event rentals and styling.",
  applicationName: "REIS Event Services",
  appleWebApp: {
    capable: true,
    title: "REIS",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/api/pwa/icon?size=192",
    apple: "/api/pwa/icon?size=192",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <InstallPrompt />
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}