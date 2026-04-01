import { MOCK_SALES, MOCK_ACTIVITY } from "@/data/mock";

export default function DashboardPage() {
  const stats = [
    { label: "Active Sales", value: "5", sub: "+2 this month" },
    { label: "Total Lots", value: "503", sub: "84 pending catalogue" },
    { label: "Est. GMV", value: "€2.3M", sub: "Current calendar" },
    { label: "Catalogues", value: "3", sub: "1 in progress" },
  ];
  const typeColors: Record<string, string> = {
    sale: "var(--accent)",
    catalogue: "var(--success)",
    client: "var(--warning)",
  };
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Good morning, Diane.
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Here is what is happening at Maison Durand et Associes.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 16 }}>
              {s.label}
            </p>
            <p className="serif" style={{ fontSize: 36, fontWeight: 500, color: "var(--black)", marginBottom: 6 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Upcoming Sales</h2>
            <a href="/dashboard/sales" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>View all</a>
          </div>
          <div>
            {MOCK_SALES.filter((s) => s.status !== "completed").map((sale, i) => (
              <div key={sale.id} style={{ padding: "16px 24px", borderBottom: i < 3 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sale.status === "active" ? "var(--success)" : "var(--border-dark)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 2 }}>{sale.name}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{sale.location}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{sale.lots} lots</p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(sale.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent Activity</h2>
          </div>
          <div style={{ padding: "8px 0" }}>
            {MOCK_ACTIVITY.map((a) => (
              <div key={a.id} style={{ padding: "12px 24px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColors[a.type] || "var(--border-dark)", flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--black)" }}>{a.action}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{a.detail}</p>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, whiteSpace: "nowrap" }}>{a.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
