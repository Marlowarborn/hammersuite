"use client";
import Link from "next/link";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import Waves from "@/components/marketing/Waves";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function HomePage() {
  const disponibles = [
    { title: "Répertoire et inventaire", desc: "Chaque objet avec son entrée (volontaire, judiciaire, dépôt), sa rubrique, ses valeurs d'exploitation et de reprise, ses photos et ses documents." },
    { title: "Dossiers judiciaires", desc: "Débiteur, tribunal, juge-commissaire, mandataire, lieux de stockage et contrats, avec une checklist par phase de l'ouverture à la clôture." },
    { title: "Courriers et actes", desc: "Requête, ordonnance, inventaire, courrier d'envoi et note d'honoraires générés à partir du dossier, prêts à relire et signer." },
    { title: "Saisie rapide par photo", desc: "Depuis un téléphone, une photo suffit pour pré-remplir la désignation, la technique et l'époque d'un objet. Chaque description générée est signalée comme telle." },
  ];
  const enPreparation = ["Catalogues", "Clients et vigilance", "Bordereaux et règlements", "Estimations", "Analytiques"];

  const cta = CONTACT ? (
    <a href={`mailto:${CONTACT}?subject=Programme%20pilote%20Marto.io`} style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--border-dark)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
      Rejoindre le programme pilote
    </a>
  ) : (
    <Link href="/pricing" style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--border-dark)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
      Le programme pilote
    </Link>
  );

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <Header />

      <section style={{ position: "relative", minHeight: "80vh", display: "flex", alignItems: "center", overflow: "hidden", background: "transparent" }}>
        <Waves />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", width: "100%" }}>
          <div style={{ maxWidth: 680 }}>
            <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "5px 14px", marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.04em" }}>En construction avec des études pilotes</span>
            </div>
            <h1 className="fade-up-1 serif" style={{ fontSize: "clamp(44px, 6vw, 76px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--black)", marginBottom: 28 }}>
              Les dossiers, les inventaires<br />et les actes, au même endroit.
            </h1>
            <p className="fade-up-2" style={{ fontSize: "clamp(16px, 1.8vw, 20px)", color: "var(--muted)", lineHeight: 1.65, marginBottom: 44, maxWidth: 560 }}>
              Un outil de gestion pour les commissaires de justice et les maisons de vente qui traitent des inventaires et des ventes judiciaires. Construit avec des praticiens, acte par acte.
            </p>
            <div className="fade-up-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/login" style={{ background: "var(--black)", color: "white", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Accéder à mon espace
              </Link>
              {cta}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--white)", padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>
              Ce qui existe aujourd&apos;hui
            </h2>
            <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
              Quatre modules utilisables, relus par des personnes du métier. Le reste est annoncé comme en préparation, pas comme disponible.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {disponibles.map((f) => (
              <div key={f.title} style={{ background: "var(--white)", padding: "36px 32px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: "var(--black)" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)", marginTop: 28 }}>
            En préparation : {enPreparation.join(", ")}.
          </p>
        </div>
      </section>

      <section style={{ position: "relative", background: "var(--black)", padding: "100px 24px", overflow: "hidden" }}>
        <Waves dark />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 500, color: "var(--white)", letterSpacing: "-0.02em", marginBottom: 20 }}>
            Construit avec les études,<br />pas à leur place.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 44 }}>
            Nous cherchons quelques études pilotes pour valider chaque acte et chaque calcul avant toute mise en service. Le tarif pilote est fixé par écrit, à l&apos;avance.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pricing" style={{ background: "var(--white)", color: "var(--black)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Le programme pilote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
