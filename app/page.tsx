"use client";
import Link from "next/link";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import Waves from "@/components/marketing/Waves";

export default function HomePage() {
  const features = [
    { title: "Catalogue Generator", desc: "Upload your house template, map placeholders, process images automatically, and export print-ready catalogues in minutes." },
    { title: "Lot Management", desc: "Centralise every detail of every lot. Provenance, dimensions, condition reports, estimates, and images — structured and searchable." },
    { title: "Sales Management", desc: "Plan and track every sale from first estimate to final adjudication. Full lifecycle visibility across your entire calendar." },
    { title: "Client CRM", desc: "Maintain rich profiles for buyers, sellers, estates, and dealers. Track consignments, correspondence, and buying preferences." },
    { title: "Estimates", desc: "Produce formal estimate letters and access market comparables. Keep a consistent record of every valuation." },
    { title: "Analytics", desc: "Understand sell-through rates, estimate accuracy, category performance, and client activity — without a single spreadsheet." },
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
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.04em" }}>Now available for French maisons de vente</span>
            </div>
            <h1 className="fade-up-1 serif" style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--black)", marginBottom: 28 }}>
              Software built for<br />modern auction houses.
            </h1>
            <p className="fade-up-2" style={{ fontSize: "clamp(16px, 1.8vw, 20px)", color: "var(--muted)", lineHeight: 1.65, marginBottom: 44, maxWidth: 520 }}>
              Manage sales, lots, catalogues, and client workflows in one refined operating system. Designed for commissaires-priseurs who expect their tools to match their standards.
            </p>
            <div className="fade-up-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/login" style={{ background: "var(--black)", color: "white", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Explore the Platform →
              </Link>
              <Link href="/pricing" style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--border-dark)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--white)", padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>
              One platform.<br />Every workflow.
            </h2>
            <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
              From first estimate to final export — HammerSuite handles the operational complexity so your team can focus on what matters.
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
            Ready to modernise<br />your operations?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 44 }}>
            Join the auction houses that have replaced their legacy workflows with a single, coherent platform.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "var(--white)", color: "var(--black)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Explore the Platform →
            </Link>
            <Link href="/pricing" style={{ background: "transparent", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", padding: "14px 28px", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
