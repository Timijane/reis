import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}