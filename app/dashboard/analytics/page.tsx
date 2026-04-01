export default function AnalyticsPage() {
  const kpis = [
    { label: "Sell-through rate", value: "78%", sub: "Last 12 months" },
    { label: "Avg. estimate accuracy", value: "+12%", sub: "Above low estimate" },
    { label: "Total revenue", value: "€4.2M", sub: "YTD 2026" },
    { label: "Active clients", value: "142", sub: "+18 this quarter" },
  ];
  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>Performance data across all sales, lots, and clients</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "5px 14px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" }}>IN DEVELOPMENT</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", opacity: 0.7 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 16 }}>{k.label}</p>
            <p className="serif" style={{ fontSize: 36, fontWeight: 500, color: "var(--black)", marginBottom: 6 }}>{k.value}</p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{k.sub}</p>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 48, textAlign: "center", opacity: 0.5 }}>
        <p className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>Charts coming soon</p>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Sell-through rates, estimate accuracy, category performance, and client activity.</p>
      </div>
    </div>
  );
}
