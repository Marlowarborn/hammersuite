"use client";

import { useState } from "react";
import { MOCK_SALES } from "@/data/mock";

type Sale = {
  id: string;
  name: string;
  date: string;
  location: string;
  category: string;
  status: "active" | "upcoming" | "completed";
  lots: number;
  estimate: string;
  notes: string;
};

type Lot = {
  number: string;
  title: string;
  artist: string;
  description: string;
  dimensions: string;
  provenance: string;
  medium: string;
  period: string;
  estLow: number;
  estHigh: number;
  image_url: string;
};

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "Active" },
  upcoming: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "Upcoming" },
  completed: { bg: "var(--cream)", color: "var(--muted)", label: "Completed" },
};

const CATEGORIES = [
  "Art moderne & contemporain",
  "Peinture ancienne",
  "Joaillerie & Argenterie",
  "Design & Arts décoratifs",
  "Art asiatique",
  "Mobilier & Objets d'art",
  "Livres & Manuscrits",
  "Vins & Spiritueux",
  "Automobiles de collection",
  "Autre",
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [lots, setLots] = useState<Lot[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newSale, setNewSale] = useState({
    name: "",
    date: "",
    location: "",
    category: "",
    notes: "",
  });

  const handleCreateSale = () => {
    if (!newSale.name || !newSale.date) return;
    const sale: Sale = {
      id: `s${Date.now()}`,
      name: newSale.name,
      date: newSale.date,
      location: newSale.location,
      category: newSale.category,
      status: "upcoming",
      lots: 0,
      estimate: "—",
      notes: newSale.notes,
    };
    setSales([sale, ...sales]);
    setNewSale({ name: "", date: "", location: "", category: "", notes: "" });
    setShowCreate(false);
    setSelectedSale(sale);
    setView("detail");
  };

  const parseCSV = (text: string): Lot[] => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
    return lines.slice(1).map((line, i) => {
      const values = line.split(",").map(v => v.trim().replace(/['"]/g, ""));
      const obj: any = {};
      headers.forEach((h, idx) => { obj[h] = values[idx] || ""; });
      return {
        number: obj.number || obj["lot number"] || obj.lot || String(i + 1).padStart(3, "0"),
        title: obj.title || obj.titre || "",
        artist: obj.artist || obj.artiste || "",
        description: obj.description || "",
        dimensions: obj.dimensions || "",
        provenance: obj.provenance || "",
        medium: obj.medium || obj.technique || "",
        period: obj.period || obj.epoque || "",
        estLow: parseInt(obj.estimate_low || obj.estimation_basse || "0") || 0,
        estHigh: parseInt(obj.estimate_high || obj.estimation_haute || "0") || 0,
        image_url: obj.image_url || obj.image || "",
      };
    });
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newLots: Lot[] = [...lots];

    for (const file of files) {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const parsed = parseCSV(text);
        parsed.forEach(lot => {
          const existing = newLots.findIndex(l => l.number === lot.number);
          if (existing >= 0) newLots[existing] = { ...newLots[existing], ...lot };
          else newLots.push(lot);
        });
      }
    }
    setLots(newLots);
    if (selectedSale) {
      setSales(sales.map(s => s.id === selectedSale.id ? { ...s, lots: newLots.length } : s));
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedSale || lots.length === 0) return;
    setGenerating(true);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/generate-catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale: selectedSale, lots }),
      });
      const data = await res.json();
      if (data.url) setPdfUrl(data.url);
      else alert("Erreur: " + data.error);
    } catch (err) {
      alert("Erreur de génération");
    }
    setGenerating(false);
  };

  if (view === "detail" && selectedSale) {
    return (
      <div className="fade-up">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={() => { setView("list"); setSelectedSale(null); setLots([]); setPdfUrl(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            ← Retour
          </button>
          <span style={{ color: "var(--border-dark)" }}>·</span>
          <h1 className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>
            {selectedSale.name}
          </h1>
          <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: statusStyles[selectedSale.status].bg, color: statusStyles[selectedSale.status].color }}>
            {statusStyles[selectedSale.status].label}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            ["Date", new Date(selectedSale.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })],
            ["Lieu", selectedSale.location || "—"],
            ["Catégorie", selectedSale.category || "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Upload zone */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Lots</h2>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{lots.length} lots importés</p>
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            style={{
              margin: 20,
              border: `2px dashed ${dragOver ? "var(--black)" : "var(--border-dark)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "40px 24px",
              textAlign: "center",
              background: dragOver ? "var(--surface)" : "transparent",
              transition: "all var(--transition)",
              cursor: "pointer",
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Déposez vos fichiers ici</p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>CSV avec les données des lots</p>
            <p style={{ fontSize: 11, color: "var(--muted)", opacity: 0.7 }}>
              Colonnes attendues: number, title, artist, description, dimensions, provenance, estimate_low, estimate_high, image_url
            </p>
          </div>

          {lots.length > 0 && (
            <div style={{ margin: "0 20px 20px" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "60px 1fr 140px 160px", gap: 12 }}>
                  {["Lot", "Titre", "Artiste", "Estimation"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
                  ))}
                </div>
                {lots.map((lot, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: i < lots.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "60px 1fr 140px 160px", gap: 12, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--muted)" }}>{lot.number}</span>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--black)" }}>{lot.title}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{lot.artist || "—"}</p>
                    <p style={{ fontSize: 12, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>
                      {lot.estLow.toLocaleString()} – {lot.estHigh.toLocaleString()} €
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate PDF */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Générer le catalogue</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            {lots.length === 0
              ? "Importez des lots avant de générer le catalogue."
              : `${lots.length} lots prêts · PDF print-ready généré via HammerSuite`}
          </p>

          {!pdfUrl ? (
            <button
              onClick={handleGeneratePDF}
              disabled={lots.length === 0 || generating}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: lots.length === 0 ? "var(--cream)" : "var(--black)",
                color: lots.length === 0 ? "var(--muted)" : "white",
                border: "none", cursor: lots.length === 0 ? "not-allowed" : "pointer",
                padding: "11px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500,
              }}
            >
              {generating ? "Génération en cours..." : "Générer le catalogue PDF"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ padding: "14px 16px", background: "rgba(61,122,94,0.06)", border: "1px solid rgba(61,122,94,0.2)", borderRadius: "var(--radius)", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "var(--success)", fontSize: 18 }}>✓</span>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--success)" }}>Catalogue généré avec succès</p>
              </div>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", padding: "11px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                Télécharger le PDF
              </a>
              <button onClick={() => setPdfUrl(null)}
                style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", padding: "11px 16px", borderRadius: "var(--radius)", fontSize: 13, color: "var(--muted)" }}>
                Regénérer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Ventes</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{sales.length} ventes · {sales.filter(s => s.status === "active").length} actives</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>
          + Nouvelle vente
        </button>
      </div>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 140px 180px 80px 100px", gap: 16 }}>
          {["Vente", "Date", "Lieu", "Lots", "Statut"].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
          ))}
        </div>
        {sales.map((sale, i) => {
          const s = statusStyles[sale.status];
          return (
            <div key={sale.id}
              onClick={() => { setSelectedSale(sale); setView("detail"); setLots([]); setPdfUrl(null); }}
              style={{ padding: "16px 20px", borderBottom: i < sales.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "1fr 140px 180px 80px 100px", gap: 16, alignItems: "center", cursor: "pointer", transition: "background var(--transition)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 2 }}>{sale.name}</p>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>{sale.category || "—"}</p>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink)" }}>{new Date(sale.date).toLocaleDateString("fr-FR")}</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>{sale.location || "—"}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{sale.lots}</p>
              <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", padding: 32, width: "100%", maxWidth: 520, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 className="serif" style={{ fontSize: 24, fontWeight: 500 }}>Nouvelle vente</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20 }}>×</button>
            </div>

            {[
              { label: "Nom de la vente", key: "name", type: "text", placeholder: "ex. Art Moderne & Contemporain" },
              { label: "Date", key: "date", type: "date", placeholder: "" },
              { label: "Lieu", key: "location", type: "text", placeholder: "ex. Paris — Salle Drouot" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder}
                  value={(newSale as any)[field.key]}
                  onChange={e => setNewSale({ ...newSale, [field.key]: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Catégorie</label>
              <select value={newSale.category} onChange={e => setNewSale({ ...newSale, category: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)" }}>
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
              <textarea placeholder="Notes internes..." value={newSale.notes}
                onChange={e => setNewSale({ ...newSale, notes: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 80 }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleCreateSale} style={{ padding: "9px 18px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Créer la vente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
