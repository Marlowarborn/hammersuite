"use client";
import Link from "next/link";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

/**
 * Page « Pilotes ». La grille tarifaire publique viendra après les premières études pilotes :
 * aucun prix n'est affiché tant qu'il n'a pas été validé avec elles.
 */
export default function PilotesPage() {
  const engagements = [
    { titre: "Un outil construit avec vous", desc: "Chaque acte, chaque calcul et chaque écran est relu par des praticiens avant d'être mis en service. Vous voyez ce qui change, et pourquoi." },
    { titre: "Vos données restent les vôtres", desc: "Hébergement en Europe, une étude par espace, export complet à tout moment. Aucune donnée n'est partagée entre études." },
    { titre: "Tarif pilote connu à l'avance", desc: "Le tarif est fixé par écrit avec chaque étude pilote avant le démarrage. La grille publique sera publiée ensuite." },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <Header />
      <section style={{ padding: "120px 24px 100px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>Programme pilote</h1>
            <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
              Marto.io est en construction avec un petit nombre d&apos;études de commissaires de justice et de maisons de vente. Il n&apos;y a pas encore de grille tarifaire publique.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 48 }}>
            {engagements.map((e) => (
              <div key={e.titre} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "28px 28px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: "var(--black)" }}>{e.titre}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{e.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            {CONTACT ? (
              <a href={`mailto:${CONTACT}?subject=Programme%20pilote%20Marto.io`} style={{ display: "inline-block", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, background: "var(--black)", color: "white", textDecoration: "none" }}>
                Écrire à {CONTACT}
              </a>
            ) : (
              <Link href="/login" style={{ display: "inline-block", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, background: "var(--black)", color: "white", textDecoration: "none" }}>
                Accéder à mon espace
              </Link>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
