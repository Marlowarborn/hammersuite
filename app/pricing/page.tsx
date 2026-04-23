"use client";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";

export default function PricingPage() {
  const plans = [
    { name: "Atelier", price: "490", desc: "For solo commissaires-priseurs and small etudes.", features: ["Up to 3 users", "500 lots / month", "Catalogue generator", "Lot management", "Sales management", "Email support"], accent: false },
    { name: "Maison", price: "990", desc: "For established maisons de vente with active teams.", features: ["Up to 12 users", "Unlimited lots", "Catalogue generator", "Full CRM module", "Estimates module", "Analytics dashboard", "Priority support"], accent: true },
    { name: "Institution", price: "Custom", desc: "For large houses with complex needs.", features: ["Unlimited users", "Custom integrations", "Dedicated success manager", "SLA guarantees", "Custom contract", "On-site onboarding"], accent: false },
  ];
  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <Header />
      <section style={{ padding: "120px 24px 100px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>Transparent pricing.</h1>
            <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>No setup fees. No hidden costs. Cancel any time.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{ background: plan.accent ? "var(--black)" : "var(--white)", color: plan.accent ? "white" : "var(--black)", border: plan.accent ? "none" : "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "36px 32px", position: "relative" }}>
                {plan.accent && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 99, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Most popular</div>}
                <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.5, marginBottom: 12 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  {plan.price !== "Custom" && <span style={{ fontSize: 14, opacity: 0.5 }}>EUR</span>}
                  <span className="serif" style={{ fontSize: 48, fontWeight: 500 }}>{plan.price}</span>
                  {plan.price !== "Custom" && <span style={{ fontSize: 14, opacity: 0.5 }}>/month</span>}
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
                  {plan.price === "Custom" ? "Contact us" : "Get started"}
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
