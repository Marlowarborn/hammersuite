import { MOCK_SALES } from "@/data/mock";

export default function SalesPage() {
  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "Active" },
    upcoming: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "Upcoming" },
    completed: { bg: "var(--cream)", color: "var(--muted)", label: "Completed" },
  };
  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Sales</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{MOCK_SALES.length} sales · {MOCK_SALES.filter(s => s.status === "active").length} active</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>
          + New Sale
        </button>
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 140px 140px 100px 80px", gap: 16 }}>
          {["Sale", "Date", "Location", "Lots", "Status"].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
          ))}
        </div>
        {MOCK_SALES.map((sale, i) => {
          const s = statusStyles[sale.status];
          return (
            <div key={sale.id} style={{ padding: "16px 20px", borderBottom: i < MOCK_SALES.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "1fr 140px 140px 100px 80px", gap: 16, alignItems: "center", cursor: "pointer" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 2 }}>{sale.name}</p>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Est. {sale.estimate} EUR</p>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink)" }}>{new Date(sale.date).toLocaleDateString("fr-FR")}</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>{sale.location}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{sale.lots}</p>
              <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
