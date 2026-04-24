"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import ImportModal from "@/components/app/ImportModal";

type TypeEntree = "volontaire" | "judiciaire" | "depot";
type StatusObjet = "en_attente" | "attribue" | "vendu" | "invendu" | "restitue";

type Objet = {
  id: string;
  numero_repertoire: string;
  date_entree: string;
  type_entree: TypeEntree;
  titre: string;
  description: string;
  artiste: string;
  dimensions: string;
  technique: string;
  epoque: string;
  provenance: string;
  consignateur: string;
  estimation_basse: number;
  estimation_haute: number;
  status: StatusObjet;
  vente_id: string | null;
  numero_lot: string | null;
  prix_adjudication: number | null;
  notes: string;
};

const STATUS_STYLES: Record<StatusObjet, { bg: string; color: string; label: string }> = {
  en_attente: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "En attente" },
  attribue: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "Attribué" },
  vendu: { bg: "var(--cream)", color: "var(--muted)", label: "Vendu" },
  invendu: { bg: "rgba(139,58,58,0.1)", color: "var(--error)", label: "Invendu" },
  restitue: { bg: "var(--surface)", color: "var(--muted)", label: "Restitué" },
};

const TYPE_STYLES: Record<TypeEntree, { label: string; color: string }> = {
  volontaire: { label: "Volontaire", color: "var(--accent)" },
  judiciaire: { label: "Judiciaire", color: "var(--ink)" },
  depot: { label: "Dépôt", color: "var(--muted)" },
};

const emptyForm = () => ({
  titre: "", artiste: "", description: "",
  type_entree: "volontaire" as TypeEntree,
  date_entree: new Date().toISOString().split("T")[0],
  consignateur: "", estimation_basse: "", estimation_haute: "",
  technique: "", dimensions: "", epoque: "", provenance: "", notes: "",
});

export default function LotsPage() {
  const supabase = createClient();
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Objet | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filter, setFilter] = useState<StatusObjet | "all">("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
    if (!profile?.organisation_id) return;

    setOrgId(profile.organisation_id);

    const { data } = await supabase.from("objets").select("*").eq("organisation_id", profile.organisation_id).order("created_at", { ascending: false });
    setObjets(data || []);
    setLoading(false);
  };

  const getNextNumero = () => {
    const year = new Date().getFullYear();
    const max = objets.filter(o => o.numero_repertoire?.startsWith(String(year))).map(o => parseInt(o.numero_repertoire.split("-")[1]) || 0).reduce((a, b) => Math.max(a, b), 0);
    return `${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const handleCreate = async () => {
    if (!form.titre || !orgId) return;
    const objet = {
      organisation_id: orgId,
      numero_repertoire: getNextNumero(),
      date_entree: form.date_entree,
      type_entree: form.type_entree,
      titre: form.titre,
      description: form.description,
      artiste: form.artiste,
      dimensions: form.dimensions,
      technique: form.technique,
      epoque: form.epoque,
      provenance: form.provenance,
      consignateur: form.consignateur,
      estimation_basse: parseInt(form.estimation_basse) || 0,
      estimation_haute: parseInt(form.estimation_haute) || 0,
      status: "en_attente",
      notes: form.notes,
    };
    const { data, error } = await supabase.from("objets").insert(objet).select().single();
    if (!error && data) {
      setObjets([data, ...objets]);
      setSelected(data);
      setShowCreate(false);
      setForm(emptyForm());
    }
  };

  const handleEdit = async () => {
    if (!selected || !form.titre) return;
    const updates = {
      titre: form.titre, artiste: form.artiste, description: form.description,
      type_entree: form.type_entree, date_entree: form.date_entree,
      consignateur: form.consignateur,
      estimation_basse: parseInt(form.estimation_basse) || 0,
      estimation_haute: parseInt(form.estimation_haute) || 0,
      technique: form.technique, dimensions: form.dimensions,
      epoque: form.epoque, provenance: form.provenance, notes: form.notes,
    };
    const { data, error } = await supabase.from("objets").update(updates).eq("id", selected.id).select().single();
    if (!error && data) {
      setObjets(objets.map(o => o.id === selected.id ? data : o));
      setSelected(data);
      setShowEdit(false);
    }
  };

  const handleBulkImport = async (newObjets: any[]) => {
    if (!orgId) return;
    const year = new Date().getFullYear();
    const maxExisting = objets.filter(o => o.numero_repertoire?.startsWith(String(year))).map(o => parseInt(o.numero_repertoire.split("-")[1]) || 0).reduce((a, b) => Math.max(a, b), 0);

    const toInsert = newObjets.map((o, i) => ({
      organisation_id: orgId,
      numero_repertoire: `${year}-${String(maxExisting + i + 1).padStart(3, "0")}`,
      date_entree: new Date().toISOString().split("T")[0],
      type_entree: "volontaire",
      titre: o.titre || "Sans titre",
      description: o.description || "",
      artiste: o.artiste || "",
      dimensions: o.dimensions || "",
      technique: o.technique || "",
      epoque: o.epoque || "",
      provenance: o.provenance || "",
      consignateur: o.consignateur || "",
      estimation_basse: o.estimation_basse || 0,
      estimation_haute: o.estimation_haute || 0,
      status: "en_attente",
      notes: o.notes || "",
    }));

    const { data, error } = await supabase.from("objets").insert(toInsert).select();
    if (!error && data) setObjets([...data, ...objets]);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      titre: selected.titre, artiste: selected.artiste, description: selected.description,
      type_entree: selected.type_entree, date_entree: selected.date_entree,
      consignateur: selected.consignateur,
      estimation_basse: String(selected.estimation_basse),
      estimation_haute: String(selected.estimation_haute),
      technique: selected.technique, dimensions: selected.dimensions,
      epoque: selected.epoque, provenance: selected.provenance, notes: selected.notes,
    });
    setShowEdit(true);
  };

  const filtered = objets.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = search === "" || o.titre?.toLowerCase().includes(search.toLowerCase()) || o.artiste?.toLowerCase().includes(search.toLowerCase()) || o.numero_repertoire?.toLowerCase().includes(search.toLowerCase()) || o.consignateur?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: objets.length,
    en_attente: objets.filter(o => o.status === "en_attente").length,
    attribue: objets.filter(o => o.status === "attribue").length,
    vendu: objets.filter(o => o.status === "vendu").length,
    invendu: objets.filter(o => o.status === "invendu").length,
    restitue: objets.filter(o => o.status === "restitue").length,
  };

  const FormFields = () => (
    <>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Type d&apos;entrée</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["volontaire", "judiciaire", "depot"] as TypeEntree[]).map(t => (
            <button key={t} onClick={() => setForm({ ...form, type_entree: t })}
              style={{ flex: 1, padding: "8px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1.5px solid", borderColor: form.type_entree === t ? "var(--black)" : "var(--border)", background: form.type_entree === t ? "var(--black)" : "transparent", color: form.type_entree === t ? "white" : "var(--muted)" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: "Titre / désignation *", key: "titre", placeholder: "ex. Tableau huile sur toile", full: true },
          { label: "Artiste / auteur", key: "artiste", placeholder: "ex. Joan Miró" },
          { label: "Date d'entrée", key: "date_entree", type: "date" },
          { label: "Consignateur", key: "consignateur", placeholder: "ex. Mme. Dupont" },
          { label: "Technique", key: "technique", placeholder: "ex. Huile sur toile" },
          { label: "Dimensions", key: "dimensions", placeholder: "ex. 46 × 61 cm" },
          { label: "Époque / période", key: "epoque", placeholder: "ex. XIXe siècle" },
          { label: "Estimation basse (€)", key: "estimation_basse", type: "number", placeholder: "0" },
          { label: "Estimation haute (€)", key: "estimation_haute", type: "number", placeholder: "0" },
        ].map((field: any) => (
          <div key={field.key} style={{ gridColumn: field.full ? "1 / -1" : "auto" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
            <input type={field.type || "text"} placeholder={field.placeholder || ""}
              value={(form as any)[field.key]}
              onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
          </div>
        ))}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
          <textarea placeholder="Description détaillée..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 70 }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Provenance</label>
          <input placeholder="ex. Collection particulière, Paris" value={form.provenance} onChange={e => setForm({ ...form, provenance: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes internes</label>
          <textarea placeholder="Notes, dossier judiciaire..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 50 }} />
        </div>
      </div>
    </>
  );

  const Modal = ({ title, subtitle, onClose, onConfirm, confirmLabel, children }: any) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, padding: "40px 24px", overflowY: "auto", overflowX: "hidden", alignItems: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", padding: 32, width: "100%", maxWidth: 600, boxShadow: "var(--shadow-lg)", maxHeight: "80vh", overflowY: "auto", position: "relative",  }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20 }}>×</button>
        </div>
        {children}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: "9px 18px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Répertoire</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{objets.length} objets · {counts.en_attente} en attente</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowImport(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--white)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>
            Import document ↑
          </button>
          <button onClick={() => { setForm(emptyForm()); setShowCreate(true); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>
            + Enregistrer un objet
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {([["all", "Tous"], ["en_attente", "En attente"], ["attribue", "Attribués"], ["vendu", "Vendus"], ["invendu", "Invendus"], ["restitue", "Restitués"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, border: "1px solid", borderColor: filter === key ? "var(--black)" : "var(--border)", background: filter === key ? "var(--black)" : "transparent", color: filter === key ? "white" : "var(--muted)", cursor: "pointer" }}>
              {label} <span style={{ opacity: 0.6 }}>({counts[key as keyof typeof counts]})</span>
            </button>
          ))}
        </div>
        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", background: "var(--white)", color: "var(--ink)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: 20 }}>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "110px 1fr 120px 140px 100px 100px", gap: 12 }}>
            {["N° Répertoire", "Objet", "Type", "Consignateur", "Estimation", "Statut"].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
            ))}
          </div>
          {loading && <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Chargement...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              {objets.length === 0 ? "Aucun objet enregistré. Commencez par importer un document ou enregistrer un objet." : "Aucun objet trouvé."}
            </div>
          )}
          {filtered.map((objet, i) => {
            const s = STATUS_STYLES[objet.status];
            const t = TYPE_STYLES[objet.type_entree];
            return (
              <div key={objet.id} onClick={() => setSelected(selected?.id === objet.id ? null : objet)}
                style={{ padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "110px 1fr 120px 140px 100px 100px", gap: 12, alignItems: "center", cursor: "pointer", background: selected?.id === objet.id ? "var(--accent-light)" : "transparent", transition: "background var(--transition)" }}
                onMouseEnter={e => { if (selected?.id !== objet.id) e.currentTarget.style.background = "var(--surface)"; }}
                onMouseLeave={e => { if (selected?.id !== objet.id) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{objet.numero_repertoire}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 1 }}>{objet.titre}</p>
                  {objet.artiste && <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.artiste}</p>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.color }}>{t.label}</span>
                <p style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{objet.consignateur || "—"}</p>
                <p style={{ fontSize: 12, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>{objet.estimation_basse?.toLocaleString()} – {objet.estimation_haute?.toLocaleString()} €</p>
                <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {selected && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Répertoire {selected.numero_repertoire}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: STATUS_STYLES[selected.status].bg, color: STATUS_STYLES[selected.status].color }}>{STATUS_STYLES[selected.status].label}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>
            <div style={{ background: "var(--cream)", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Aucune photo</p>
              <button style={{ padding: "6px 14px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, cursor: "pointer" }}>+ Ajouter des photos</button>
            </div>
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--black)", marginBottom: 4, lineHeight: 1.3 }}>{selected.titre}</h3>
              {selected.artiste && <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginBottom: 12 }}>{selected.artiste}</p>}
              {selected.description && <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, marginBottom: 16 }}>{selected.description}</p>}
              {([
                ["Date d'entrée", selected.date_entree ? new Date(selected.date_entree).toLocaleDateString("fr-FR") : "—"],
                ["Type", TYPE_STYLES[selected.type_entree]?.label],
                ["Consignateur", selected.consignateur],
                ["Technique", selected.technique],
                ["Dimensions", selected.dimensions],
                ["Époque", selected.epoque],
                ["Estimation", `${selected.estimation_basse?.toLocaleString()} – ${selected.estimation_haute?.toLocaleString()} €`],
                ...(selected.notes ? [["Notes", selected.notes]] : []),
              ] as [string, string][]).filter(([, v]) => v && v !== "—" && v !== " – ").map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)", flexShrink: 0, marginRight: 12 }}>{label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <button onClick={openEdit} style={{ flex: 1, padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, cursor: "pointer" }}>
                Modifier
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title={`Enregistrer un objet — ${getNextNumero()}`} onClose={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Enregistrer">
          <FormFields />
        </Modal>
      )}

      {showEdit && selected && (
        <Modal title={`Modifier — ${selected.numero_repertoire}`} onClose={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Enregistrer les modifications">
          <FormFields />
        </Modal>
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleBulkImport} />
      )}
    </div>
  );
}
