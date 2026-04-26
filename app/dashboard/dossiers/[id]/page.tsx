"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

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
  debiteur_code_postal: string;
  correspondant: string;
  correspondant_email: string;
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

type Objet = {
  id: string;
  numero_repertoire: string;
  titre: string;
  artiste: string;
  technique: string;
  estimation_basse: number;
  estimation_haute: number;
  status: string;
  numero_lot: string | null;
};

const STATUTS: Record<string, { bg: string; color: string; label: string }> = {
  en_cours: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "En cours" },
  cloture: { bg: "var(--cream)", color: "var(--muted)", label: "Clôturé" },
  suspendu: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "Suspendu" },
};

export default function DossierDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "objets" | "courriers">("infos");
  const [showAddObjet, setShowAddObjet] = useState(false);
  const [disponibles, setDisponibles] = useState<Objet[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    const { data: dossierData } = await supabase.from("dossiers").select("*").eq("id", id).single();
    setDossier(dossierData);
    const { data: objetsData } = await supabase.from("objets").select("*").eq("dossier_id", id);
    setObjets(objetsData || []);
    setLoading(false);
  };

  const loadDisponibles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
    if (!profile?.organisation_id) return;
    const { data } = await supabase.from("objets").select("*")
      .eq("organisation_id", profile.organisation_id)
      .is("dossier_id", null)
      .eq("status", "en_attente");
    setDisponibles(data || []);
  };

  const handleAddObjets = async () => {
    if (selected.length === 0) return;
    await supabase.from("objets").update({ dossier_id: id, status: "attribue" }).in("id", selected);
    await loadData();
    setShowAddObjet(false);
    setSelected([]);
  };

  if (loading) return <div style={{ padding: 32, color: "var(--muted)" }}>Chargement...</div>;
  if (!dossier) return <div style={{ padding: 32, color: "var(--muted)" }}>Dossier introuvable</div>;

  const statut = STATUTS[dossier.statut] || STATUTS.en_cours;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/dashboard/dossiers" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← Dossiers</Link>
        <span style={{ color: "var(--border-dark)" }}>·</span>
        <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{dossier.numero}</span>
        <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: statut.bg, color: statut.color }}>{statut.label}</span>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>{dossier.debiteur_nom}</h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>{dossier.nature} · {dossier.debiteur_forme_juridique} · {dossier.debiteur_ville}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        {([["infos", "Informations"], ["objets", `Objets (${objets.length})`], ["courriers", "Courriers"]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid var(--black)" : "2px solid transparent", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "var(--black)" : "var(--muted)", marginBottom: -1, fontFamily: "var(--font-sans)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Infos */}
      {activeTab === "infos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { title: "Débiteur", fields: [["Raison sociale", dossier.debiteur_nom], ["Forme juridique", dossier.debiteur_forme_juridique], ["Adresse", dossier.debiteur_adresse], ["Code postal", dossier.debiteur_code_postal], ["Ville", dossier.debiteur_ville]] },
            { title: "Procédure judiciaire", fields: [["Nature", dossier.nature], ["Tribunal", dossier.tribunal], ["Juge commissaire", dossier.juge_commissaire], ["Administrateur", dossier.administrateur], ["Mandataire", dossier.mandataire], ["N° greffe", dossier.numero_greffe], ["Décret", dossier.decret], ["Date jugement", dossier.date_jugement ? new Date(dossier.date_jugement).toLocaleDateString("fr-FR") : ""]] },
            { title: "Dates", fields: [["Date d'ouverture", new Date(dossier.date_ouverture).toLocaleDateString("fr-FR")], ["Date de vente prévue", dossier.date_vente ? new Date(dossier.date_vente).toLocaleDateString("fr-FR") : "Non définie"]] },
            { title: "Intervenants", fields: [["Correspondant", dossier.correspondant], ["Email", dossier.correspondant_email], ["Signataire", dossier.signataire], ["Collaborateur", dossier.collaborateur]] },
          ].map(section => (
            <div key={section.title} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{section.title}</p>
              </div>
              <div style={{ padding: "8px 0" }}>
                {section.fields.filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>{label}</span>
                    <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right", maxWidth: 220 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {dossier.commentaires && (
            <div style={{ gridColumn: "1 / -1", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Commentaires</p>
              <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>{dossier.commentaires}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Objets */}
      {activeTab === "objets" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>{objets.length} objet{objets.length > 1 ? "s" : ""} dans ce dossier</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { loadDisponibles(); setShowAddObjet(true); }}
                style={{ padding: "8px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>
                Ajouter depuis le répertoire
              </button>
              <Link href={`/dashboard/lots`}
                style={{ padding: "8px 16px", background: "var(--black)", color: "white", borderRadius: "var(--radius)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
                + Nouvel objet
              </Link>
            </div>
          </div>

          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {objets.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                Aucun objet dans ce dossier. Ajoutez des objets depuis le répertoire.
              </div>
            ) : (
              <>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "100px 1fr 140px 160px 100px", gap: 12 }}>
                  {["N° Rép.", "Objet", "Technique", "Estimation", "Statut"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
                  ))}
                </div>
                {objets.map((objet, i) => (
                  <div key={objet.id} style={{ padding: "14px 20px", borderBottom: i < objets.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "100px 1fr 140px 160px 100px", gap: 12, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{objet.numero_repertoire}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)" }}>{objet.titre}</p>
                      {objet.artiste && <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.artiste}</p>}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.technique || "—"}</p>
                    <p style={{ fontSize: 12, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>{objet.estimation_basse?.toLocaleString()} – {objet.estimation_haute?.toLocaleString()} €</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--success)" }}>Attribué</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: Courriers */}
      {activeTab === "courriers" && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "48px 24px", textAlign: "center" }}>
          <p className="serif" style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>Courriers automatiques</p>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Génération automatique des courriers types — ordonnance, demande d'évaluation, note d'honoraires, envoi inventaire.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "5px 14px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" }}>EN DÉVELOPPEMENT</span>
          </div>
        </div>
      )}

      {/* Modal: Ajouter objets */}
      {showAddObjet && (
        <div onClick={() => setShowAddObjet(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: 600, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="serif" style={{ fontSize: 20, fontWeight: 500 }}>Ajouter depuis le répertoire</h2>
              <button onClick={() => setShowAddObjet(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {disponibles.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>Aucun objet disponible dans le répertoire.</p>
              ) : disponibles.map((objet, i) => (
                <div key={objet.id} onClick={() => setSelected(s => s.includes(objet.id) ? s.filter(x => x !== objet.id) : [...s, objet.id])}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < disponibles.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
                  <input type="checkbox" checked={selected.includes(objet.id)} readOnly style={{ width: 16, height: 16 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)" }}>{objet.titre}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.numero_repertoire} · {objet.technique || "—"}</p>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.estimation_basse?.toLocaleString()} – {objet.estimation_haute?.toLocaleString()} €</p>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddObjet(false)} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleAddObjets} disabled={selected.length === 0}
                style={{ padding: "9px 18px", background: selected.length === 0 ? "var(--cream)" : "var(--black)", color: selected.length === 0 ? "var(--muted)" : "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}>
                Ajouter {selected.length > 0 ? `(${selected.length})` : ""} objet{selected.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
