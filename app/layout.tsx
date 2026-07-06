import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marto.io, le système d’exploitation moderne des maisons de vente",
  description:
    "Gérez vos ventes, vos lots, vos catalogues et vos échanges clients dans un seul outil pensé pour votre étude. Conçu pour les commissaires-priseurs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}