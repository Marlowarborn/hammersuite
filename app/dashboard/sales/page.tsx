"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

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

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "Active" },
  upcoming: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "À venir" },
  completed: { bg: "var(--cream)", color: "var(--muted)", label: "Terminée" },
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
  const supabase = createClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "", category: "", notes: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
    if (!profile?.organisation_id) return;
    setOrgId(profile.organisation_id);
    const { data } = await supabase.from("ventes").select("*").eq("organisation_id", profile.organisation_id).order("created_at", { ascending: false });
    setSales((data || []).map((v: any) => ({ ...v, lots: v.lots || 0, estimate: v.estimate || "—" })));
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.date || !orgId) return;
    const { data, error } = await supabase.from("ventes").insert({
      organisation_id: orgId,
      name: form.name,
      date: form.date,
      location: form.location,
      category: form.category,
      notes: form.notes,
      status: "upcoming",
      lots: 0,
      estimate: "—",
    }).select().single();
    if (!error && data) {
      setSales([{ ...data, lots: 0, estimate: "—" }, ...sales]);
      setShowCreate(false);
      setForm({ name: "", date: "", location: "", category: "", notes: "" });
    }
  };

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
        {loading && <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)" }}>Chargement...</div>}
        {!loading && sales.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
            Aucune vente. Créez votre première vente.
          </div>
        )}
        {sales.map((sale, i) => {
          const s = STATUS_STYLES[sale.status] || STATUS_STYLES.upcoming;
          return (
            <div key={sale.id} style={{ padding: "16px 20px", borderBottom: i < sales.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "1fr 140px 180px 80px 100px", gap: 16, alignItems: "center", cursor: "pointer", transition: "background var(--transition)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
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
        <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", padding: 32, width: "100%", maxWidth: 520, boxShadow: "var(--shadow-lg)", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 className="serif" style={{ fontSize: 22, fontWeight: 500 }}>Nouvelle vente</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20 }}>×</button>
            </div>
            {[
              { label: "Nom de la vente *", key: "name", type: "text", placeholder: "ex. Art Moderne & Contemporain" },
              { label: "Date *", key: "date", type: "date", placeholder: "" },
              { label: "Lieu", key: "location", type: "text", placeholder: "ex. Paris — Salle Drouot" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Catégorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)" }}>
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
              <textarea placeholder="Notes internes..." value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 80 }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleCreate} disabled={!form.name || !form.date}
                style={{ padding: "9px 18px", background: (!form.name || !form.date) ? "var(--cream)" : "var(--black)", color: (!form.name || !form.date) ? "var(--muted)" : "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Créer la vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
