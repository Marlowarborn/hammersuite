import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marto.io, dossiers, inventaires et actes des études",
  description:
    "Logiciel de gestion pour commissaires de justice et maisons de vente : répertoire, dossiers judiciaires, courriers et actes. En construction avec des études pilotes.",
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