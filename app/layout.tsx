import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HammerSuite — The modern operating system for auction houses",
  description:
    "Manage sales, lots, catalogues, and client workflows in one refined operating system. Designed for commissaires-priseurs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}