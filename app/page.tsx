"use client";
import Link from "next/link";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import Waves from "@/components/marketing/Waves";

export default function HomePage() {
  const features = [
    { title: "Générateur de catalogue", desc: "Importez la trame de votre étude, associez les champs, traitez les images automatiquement et exportez des catalogues prêts à imprimer en quelques minutes." },
    { title: "Gestion des lots", desc: "Centralisez chaque détail de chaque lot. Provenance, dimensions, rapports d’état, estimations et images, structurés et faciles à retrouver." },
    { title: "Gestion des ventes", desc: "Planifiez et suivez chaque vente, de la première estimation à l’adjudication finale. Une vue complète sur tout votre calendrier." },
    { title: "CRM clients", desc: "Tenez des profils détaillés pour vos acheteurs, vendeurs, successions et marchands. Suivez les mandats, les échanges et les préférences d’achat." },
    { title: "Estimations", desc: "Rédigez des lettres d’estimation formelles et consultez des comparables de marché. Gardez une trace cohérente de chaque estimation." },
    { title: "Analytiques", desc: "Comprenez vos taux de vente, la justesse de vos estimations, la performance par catégorie et l’activité de vos clients, sans le moindre tableur." },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <Header />

      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "transparent" }}>
        <Waves />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", width: "100%" }}>
          <div style={{ maxWidth: 680 }}>
            <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "5px 14px", marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.04em" }}>Désormais disponible pour les maisons de vente françaises</span>
            </div>
            <h1 className="fade-up-1 serif" style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--black)", marginBottom: 28 }}>
              Le logiciel des<br />maisons de vente modernes.
            </h1>
            <p className="fade-up-2" style={{ fontSize: "clamp(16px, 1.8vw, 20px)", color: "var(--muted)", lineHeight: 1.65, marginBottom: 44, maxWidth: 520 }}>
              Gérez vos ventes, vos lots, vos catalogues et vos échanges clients dans un seul outil soigné. Conçu pour les commissaires-priseurs qui attendent de leurs outils le niveau de leur étude.
            </p>
            <div className="fade-up-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/login" style={{ background: "var(--black)", color: "white", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Découvrir la plateforme →
              </Link>
              <Link href="/pricing" style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--border-dark)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
                Demander une démo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--white)", padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>
              Une plateforme.<br />Tous vos processus.
            </h2>
            <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
              De la première estimation à l’export final, Marto.io absorbe la complexité opérationnelle pour que votre équipe se concentre sur l’essentiel.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1, background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: "var(--white)", padding: "36px 32px", transition: "background var(--transition)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--white)")}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: "var(--black)" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: "relative", background: "var(--black)", padding: "100px 24px", overflow: "hidden" }}>
        <Waves dark />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 500, color: "var(--white)", letterSpacing: "-0.02em", marginBottom: 20 }}>
            Prêt à moderniser<br />votre organisation ?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 44 }}>
            Rejoignez les maisons de vente qui ont remplacé leurs anciens outils par une plateforme unique et cohérente.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "var(--white)", color: "var(--black)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Découvrir la plateforme →
            </Link>
            <Link href="/pricing" style={{ background: "transparent", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
              Demander une démo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
