import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reis Invent Service | Event Rentals & Styling",
  description:
    "We style your event, You create memories! Premium event rentals and styling.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}