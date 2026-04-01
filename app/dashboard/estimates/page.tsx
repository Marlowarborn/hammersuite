export default function EstimatesPage() {
  const items = [
    { ref: "EST-2026-041", client: "Mme. Fontaine-Roux", item: "Tableau huile sur toile, XIXe", submitted: "28 mars 2026", status: "pending" },
    { ref: "EST-2026-038", client: "Galerie Marchetti", item: "Mobilier Louis XVI, paire de fauteuils", submitted: "24 mars 2026", status: "complete" },
    { ref: "EST-2026-035", client: "Succession Moreau-Valentin", item: "Service en argent, 48 pieces", submitted: "19 mars 2026", status: "complete" },
  ];
  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Estimates</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>Estimate requests and comparable sales</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "5px 14px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" }}>IN DEVELOPMENT</span>
        </div>
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "120px 1fr 1fr 120px 100px", gap: 16 }}>
          {["Reference", "Client", "Item", "Submitted", "Status"].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
          ))}
        </div>
        {items.map((item, i) => (
          <div key={item.ref} style={{ padding: "16px 20px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "120px 1fr 1fr 120px 100px", gap: 16, alignItems: "center", opacity: 0.7 }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--muted)" }}>{item.ref}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--black)" }}>{item.client}</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{item.item}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.submitted}</span>
            <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: item.status === "complete" ? "rgba(61,122,94,0.1)" : "rgba(154,111,46,0.1)", color: item.status === "complete" ? "var(--success)" : "var(--warning)" }}>{item.status === "complete" ? "Complete" : "Pending"}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>Full estimates module — formal estimate letters, comparable sales database, and client-facing portal — is available in early access for Maison and Institution plan clients.</p>
      </div>
    </div>
  );
}
