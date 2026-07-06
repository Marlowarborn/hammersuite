"use client";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";

export default function PricingPage() {
  const plans = [
    { name: "Atelier", price: "490", desc: "Pour les commissaires-priseurs seuls et les petites études.", features: ["Jusqu’à 3 utilisateurs", "500 lots / mois", "Générateur de catalogue", "Gestion des lots", "Gestion des ventes", "Support par email"], accent: false },
    { name: "Maison", price: "990", desc: "Pour les maisons de vente établies avec des équipes actives.", features: ["Jusqu’à 12 utilisateurs", "Lots illimités", "Générateur de catalogue", "Module CRM complet", "Module estimations", "Tableau de bord analytique", "Support prioritaire"], accent: true },
    { name: "Institution", price: "Custom", desc: "Pour les grandes maisons aux besoins complexes.", features: ["Utilisateurs illimités", "Intégrations sur mesure", "Interlocuteur dédié", "Garanties de niveau de service", "Contrat sur mesure", "Prise en main sur site"], accent: false },
  ];
  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <Header />
      <section style={{ padding: "120px 24px 100px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>Des tarifs transparents.</h1>
            <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>Aucuns frais d’installation. Aucun coût caché. Résiliable à tout moment.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{ background: plan.accent ? "var(--black)" : "var(--white)", color: plan.accent ? "white" : "var(--black)", border: plan.accent ? "none" : "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "36px 32px", position: "relative" }}>
                {plan.accent && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 99, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Le plus choisi</div>}
                <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.5, marginBottom: 12 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  {plan.price !== "Custom" && <span style={{ fontSize: 14, opacity: 0.5 }}>EUR</span>}
                  <span className="serif" style={{ fontSize: 48, fontWeight: 500 }}>{plan.price === "Custom" ? "Sur devis" : plan.price}</span>
                  {plan.price !== "Custom" && <span style={{ fontSize: 14, opacity: 0.5 }}>/mois</span>}
                </div>
                <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.6, marginBottom: 28 }}>{plan.desc}</p>
                <div style={{ marginBottom: 32 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <span style={{ color: plan.accent ? "rgba(255,255,255,0.5)" : "var(--accent)" }}>✓</span>
                      <span style={{ fontSize: 14, opacity: 0.8 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="/dashboard" style={{ display: "block", width: "100%", padding: "12px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, background: plan.accent ? "white" : "var(--black)", color: plan.accent ? "var(--black)" : "white", border: "none", cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
                  {plan.price === "Custom" ? "Nous contacter" : "Commencer"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
