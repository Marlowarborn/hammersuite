"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/app/Modal";
import { createClient } from "@/lib/supabase";

type Dossier = {
  id: string;
  numero: string;
  nature: string;
  statut: string;
  date_ouverture: string;
  date_vente: string | null;
  debiteur_nom: string;
  debiteur_forme_juridique: string;
  debiteur_adresse: string;
  debiteur_ville: string;
  correspondant: string;
  signataire: string;
  collaborateur: string;
  tribunal: string;
  juge_commissaire: string;
  administrateur: string;
  mandataire: string;
  numero_greffe: string;
  date_jugement: string | null;
  decret: string;
  commentaires: string;
};

const NATURES = [
  "Liquidation Judiciaire",
  "Redressement Judiciaire",
  "Sauvegarde",
  "Cession d'actifs",
  "Vente judiciaire diverse",
];

const STATUTS: Record<string, { bg: string; color: string; label: string }> = {
  en_cours: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "En cours" },
  cloture: { bg: "var(--cream)", color: "var(--muted)", label: "Clôturé" },
  suspendu: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "Suspendu" },
};

const emptyForm = () => ({
  numero: "",
  nature: "Liquidation Judiciaire",
  date_ouverture: new Date().toISOString().split("T")[0],
  date_vente: "",
  debiteur_nom: "",
  debiteur_forme_juridique: "",
  debiteur_adresse: "",
  debiteur_ville: "",
  debiteur_code_postal: "",
  correspondant: "",
  correspondant_email: "",
  signataire: "",
  collaborateur: "",
  tribunal: "",
  juge_commissaire: "",
  administrateur: "",
  mandataire: "",
  numero_greffe: "",
  date_jugement: "",
  decret: "",
  commentaires: "",
});

export default function DossiersPage() {
  const supabase = createClient();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Dossier | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
    if (!profile?.organisation_id) return;
    setOrgId(profile.organisation_id);
    const { data } = await supabase.from("dossiers").select("*").eq("organisation_id", profile.organisation_id).order("created_at", { ascending: false });
    setDossiers(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.numero || !form.debiteur_nom || !orgId) return;
    const { data, error } = await supabase.from("dossiers").insert({
      organisation_id: orgId,
      ...form,
      statut: "en_cours",
      date_vente: form.date_vente || null,
      date_jugement: form.date_jugement || null,
    }).select().single();
    if (!error && data) {
      setDossiers([data, ...dossiers]);
      setSelected(data);
      setShowCreate(false);
      setForm(emptyForm());
    }
  };

  const filtered = dossiers.filter(d => {
    const matchSearch = search === "" ||
      d.numero?.toLowerCase().includes(search.toLowerCase()) ||
      d.debiteur_nom?.toLowerCase().includes(search.toLowerCase()) ||
      d.tribunal?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const f = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const Field = ({ label, k, type = "text", placeholder = "" }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input type={type} placeholder={placeholder} value={(form as any)[k]} onChange={e => f(k, e.target.value)}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)" }} />
    </div>
  );

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Dossiers judiciaires</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} · {dossiers.filter(d => d.statut === "en_cours").length} en cours</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setShowCreate(true); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500 }}>
          + Nouveau dossier
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[["all", "Tous", dossiers.length], ["en_cours", "En cours", dossiers.filter(d => d.statut === "en_cours").length], ["suspendu", "Suspendus", dossiers.filter(d => d.statut === "suspendu").length], ["cloture", "Clôturés", dossiers.filter(d => d.statut === "cloture").length]].map(([key, label, count]) => (
            <button key={key} onClick={() => setFilterStatut(key as string)}
              style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, border: "1px solid", borderColor: filterStatut === key ? "var(--black)" : "var(--border)", background: filterStatut === key ? "var(--black)" : "transparent", color: filterStatut === key ? "white" : "var(--muted)", cursor: "pointer" }}>
              {label} <span style={{ opacity: 0.6 }}>({count})</span>
            </button>
          ))}
        </div>
        <input placeholder="Rechercher N° dossier, débiteur, tribunal..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", background: "var(--white)", color: "var(--ink)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 20 }}>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "120px 1fr 160px 140px 100px", gap: 12 }}>
            {["N° Dossier", "Débiteur", "Nature", "Tribunal", "Statut"].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
            ))}
          </div>
          {loading && <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)" }}>Chargement...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              {dossiers.length === 0 ? "Aucun dossier. Créez votre premier dossier judiciaire." : "Aucun dossier trouvé."}
            </div>
          )}
          {filtered.map((d, i) => {
            const s = STATUTS[d.statut] || STATUTS.en_cours;
            return (
              <div key={d.id} onClick={() => setSelected(selected?.id === d.id ? null : d)}
                style={{ padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "120px 1fr 160px 140px 100px", gap: 12, alignItems: "center", cursor: "pointer", background: selected?.id === d.id ? "var(--accent-light)" : "transparent", transition: "background var(--transition)" }}
                onMouseEnter={e => { if (selected?.id !== d.id) e.currentTarget.style.background = "var(--surface)"; }}
                onMouseLeave={e => { if (selected?.id !== d.id) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{d.numero}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 1 }}>{d.debiteur_nom}</p>
                  {d.debiteur_forme_juridique && <p style={{ fontSize: 11, color: "var(--muted)" }}>{d.debiteur_forme_juridique}</p>}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>{d.nature}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.tribunal || "—"}</p>
                <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {selected && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--ink)", marginBottom: 4 }}>{selected.numero}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: (STATUTS[selected.statut] || STATUTS.en_cours).bg, color: (STATUTS[selected.statut] || STATUTS.en_cours).color }}>
                  {(STATUTS[selected.statut] || STATUTS.en_cours).label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>

            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{selected.debiteur_nom}</h3>
              {selected.debiteur_forme_juridique && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{selected.debiteur_forme_juridique}</p>}
              {selected.debiteur_adresse && <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{selected.debiteur_adresse}, {selected.debiteur_ville}</p>}

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Nature du dossier</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{selected.nature}</p>
              </div>

              {[
                ["Tribunal", selected.tribunal],
                ["Juge commissaire", selected.juge_commissaire],
                ["Administrateur", selected.administrateur],
                ["Mandataire", selected.mandataire],
                ["N° greffe", selected.numero_greffe],
                ["Décret", selected.decret],
                ["Date jugement", selected.date_jugement ? new Date(selected.date_jugement).toLocaleDateString("fr-FR") : null],
                ["Date ouverture", new Date(selected.date_ouverture).toLocaleDateString("fr-FR")],
                ["Date vente prévue", selected.date_vente ? new Date(selected.date_vente).toLocaleDateString("fr-FR") : null],
                ["Correspondant", selected.correspondant],
                ["Signataire", selected.signataire],
                ["Collaborateur", selected.collaborateur],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right", maxWidth: 200 }}>{value}</span>
                </div>
              ))}

              {selected.commentaires && (
                <div style={{ marginTop: 16, padding: "12px", background: "var(--surface)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
                  {selected.commentaires}
                </div>
              )}
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "8px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                Voir les objets
              </button>
              <button style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, cursor: "pointer" }}>
                Modifier
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
  <Modal
    title="Nouveau dossier judiciaire"
    onClose={() => setShowCreate(false)}
    onConfirm={handleCreate}
    confirmLabel="Créer le dossier"
    size="lg"
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 12 }}>Identification</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="N° Dossier *" k="numero" placeholder="ex. TC21136" />
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nature *</label>
            <select value={form.nature} onChange={e => f("nature", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)" }}>
              {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Field label="Date d'ouverture" k="date_ouverture" type="date" />
          <Field label="Date de vente prévue" k="date_vente" type="date" />
        </div>
      </div>
      <div style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 12 }}>Débiteur / Vendeur</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Nom / Raison sociale *" k="debiteur_nom" placeholder="ex. LA PETITE GROSSE" /></div>
          <Field label="Forme juridique" k="debiteur_forme_juridique" placeholder="ex. SARL" />
          <Field label="Adresse" k="debiteur_adresse" placeholder="ex. 8 rue Sofia" />
          <Field label="Code postal" k="debiteur_code_postal" placeholder="75018" />
          <Field label="Ville" k="debiteur_ville" placeholder="PARIS" />
        </div>
      </div>
      <div style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 12 }}>Judiciaire</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Tribunal" k="tribunal" placeholder="ex. Tribunal de Commerce de Paris" />
          <Field label="Juge commissaire" k="juge_commissaire" placeholder="ex. Antoine GUINET" />
          <Field label="Administrateur judiciaire" k="administrateur" />
          <Field label="Mandataire judiciaire" k="mandataire" />
          <Field label="N° greffe" k="numero_greffe" placeholder="ex. P202400429" />
          <Field label="Date jugement" k="date_jugement" type="date" />
          <div style={{ gridColumn: "1 / -1" }}><Field label="Décret" k="decret" placeholder="ex. Arrêté du 28/02/2020" /></div>
        </div>
      </div>
      <div style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 12 }}>Intervenants</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Correspondant" k="correspondant" placeholder="ex. Me. Julie PERROT" />
          <Field label="Email correspondant" k="correspondant_email" />
          <Field label="Signataire" k="signataire" placeholder="ex. Emmanuel FARRANDO" />
          <Field label="Collaborateur" k="collaborateur" />
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Commentaires</label>
        <textarea placeholder="Notes internes..." value={form.commentaires} onChange={e => f("commentaires", e.target.value)}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 70 }} />
      </div>
    </div>
  </Modal>
)}

    </div>
  );
}
