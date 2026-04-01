import { MOCK_CLIENTS } from "@/data/mock";

export default function CRMPage() {
  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Client CRM</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{MOCK_CLIENTS.length} clients · Full module in development</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "5px 14px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" }}>IN DEVELOPMENT</span>
        </div>
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 120px 160px 80px", gap: 16 }}>
          {["Client", "Type", "Email", "Lots"].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
          ))}
        </div>
        {MOCK_CLIENTS.map((client, i) => (
          <div key={client.id} style={{ padding: "16px 20px", borderBottom: i < MOCK_CLIENTS.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "1fr 120px 160px 80px", gap: 16, alignItems: "center", opacity: 0.6 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)" }}>{client.name}</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{client.contact}</p>
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{client.type}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{client.email}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{client.lots}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>Full CRM functionality — rich client profiles, consignment history, buying preferences, and correspondence logs — is available in early access for Maison and Institution plan clients.</p>
      </div>
    </div>
  );
}
