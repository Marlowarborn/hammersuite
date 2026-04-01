"use client";
import { useState } from "react";
import { MOCK_LOTS } from "@/data/mock";

export default function LotsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    catalogued: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "Catalogued" },
    pending: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "Pending" },
    sold: { bg: "var(--cream)", color: "var(--muted)", label: "Sold" },
  };
  const selectedLot = MOCK_LOTS.find(l => l.id === selected);
  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Lots</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{MOCK_LOTS.length} lots in database</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--white)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer", padding: "9px 16px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>Import CSV</button>
          <button style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>+ Add Lot</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 20 }}>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "60px 1fr 140px 160px 100px", gap: 16 }}>
            {["Lot", "Title", "Category", "Estimate", "Status"].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
            ))}
          </div>
          {MOCK_LOTS.map((lot, i) => {
            const s = statusStyles[lot.status];
            return (
              <div key={lot.id} onClick={() => setSelected(lot.id === selected ? null : lot.id)} style={{ padding: "14px 20px", borderBottom: i < MOCK_LOTS.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "60px 1fr 140px 160px 100px", gap: 16, alignItems: "center", cursor: "pointer", background: selected === lot.id ? "var(--accent-light)" : "transparent" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 500, color: "var(--muted)" }}>{lot.number}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 1 }}>{lot.title}</p>
                  {lot.artist && <p style={{ fontSize: 12, color: "var(--muted)" }}>{lot.artist}</p>}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>{lot.category}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-serif)" }}>{lot.estLow.toLocaleString()} – {lot.estHigh.toLocaleString()} EUR</p>
                <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
              </div>
            );
          })}
        </div>
        {selectedLot && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Lot {selectedLot.number}</p>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>
            <div style={{ background: "var(--cream)", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>No image attached</p>
              <button style={{ padding: "6px 14px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, cursor: "pointer" }}>Upload image</button>
            </div>
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--black)", marginBottom: 6, lineHeight: 1.4 }}>{selectedLot.title}</h3>
              {selectedLot.artist && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>{selectedLot.artist}</p>}
              {[["Category", selectedLot.category], ["Estimate low", selectedLot.estLow.toLocaleString() + " EUR"], ["Estimate high", selectedLot.estHigh.toLocaleString() + " EUR"], ["Provenance", selectedLot.provenance], ["Dimensions", selectedLot.dimensions]].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right", maxWidth: 200 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
