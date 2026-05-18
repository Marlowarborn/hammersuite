"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Badge, Button, Input } from "@/components/ui";
import DossierForm, { dossierToForm, DossierFormValues } from "@/components/app/DossierForm";

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
} & Partial<DossierFormValues>;

const STATUTS: Record<string, { label: string; variant: "success" | "neutral" | "warning" }> = {
  en_cours: { label: "En cours", variant: "success" },
  cloture: { label: "Clôturé", variant: "neutral" },
  suspendu: { label: "Suspendu", variant: "warning" },
};

export default function DossiersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Dossier | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");

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
    const { data } = await supabase.from("dossiers").select("*").eq("organisation_id", profile.organisation_id).order("created_at", { ascending: false });
    setDossiers(data || []);
    setLoading(false);
  };

  const filtered = dossiers.filter((d) => {
    const matchSearch = search === "" ||
      d.numero?.toLowerCase().includes(search.toLowerCase()) ||
      d.debiteur_nom?.toLowerCase().includes(search.toLowerCase()) ||
      d.tribunal?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="serif" style={{ fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Dossiers judiciaires</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)" }}>
            {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} · {dossiers.filter((d) => d.statut === "en_cours").length} en cours
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Nouveau dossier</Button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[["all", "Tous", dossiers.length], ["en_cours", "En cours", dossiers.filter((d) => d.statut === "en_cours").length], ["suspendu", "Suspendus", dossiers.filter((d) => d.statut === "suspendu").length], ["cloture", "Clôturés", dossiers.filter((d) => d.statut === "cloture").length]].map(([key, label, count]) => (
            <button
              key={String(key)}
              onClick={() => setFilterStatut(key as string)}
              style={{
                padding: "5px 12px",
                borderRadius: 99,
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                border: "1px solid",
                borderColor: filterStatut === key ? "var(--black)" : "var(--border)",
                background: filterStatut === key ? "var(--black)" : "transparent",
                color: filterStatut === key ? "var(--white)" : "var(--ink-2)",
                cursor: "pointer",
              }}
            >
              {label} <span style={{ opacity: 0.6 }}>({count})</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input
            placeholder="Rechercher N° dossier, débiteur, tribunal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperStyle={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 20 }}>
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "120px 1fr 160px 140px 100px", gap: 12 }}>
            {["N° Dossier", "Débiteur", "Nature", "Tribunal", "Statut"].map((h) => (
              <p key={h} style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-2)" }}>{h}</p>
            ))}
          </div>
          {loading && <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-2)" }}>Chargement…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-2)", fontSize: "var(--text-md)" }}>
              {dossiers.length === 0 ? "Aucun dossier. Créez votre premier dossier judiciaire." : "Aucun dossier trouvé."}
            </div>
          )}
          {filtered.map((d, i) => {
            const s = STATUTS[d.statut] || STATUTS.en_cours;
            return (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  display: "grid",
                  gridTemplateColumns: "120px 1fr 160px 140px 100px",
                  gap: 12,
                  alignItems: "center",
                  cursor: "pointer",
                  background: selected?.id === d.id ? "var(--accent-light)" : "transparent",
                  transition: "background var(--transition)",
                }}
                onMouseEnter={(e) => {
                  if (selected?.id !== d.id) e.currentTarget.style.background = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  if (selected?.id !== d.id) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink)" }}>{d.numero}</span>
                <div>
                  <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--ink)", marginBottom: 1 }}>{d.debiteur_nom}</p>
                  {d.debiteur_forme_juridique && <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{d.debiteur_forme_juridique}</p>}
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{d.nature}</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.tribunal || "—"}</p>
                <Badge variant={s.variant} size="md">{s.label}</Badge>
              </div>
            );
          })}
        </div>

        {selected && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, fontFamily: "monospace", color: "var(--ink)", marginBottom: 4 }}>{selected.numero}</p>
                <Badge variant={(STATUTS[selected.statut] || STATUTS.en_cours).variant} size="sm">
                  {(STATUTS[selected.statut] || STATUTS.en_cours).label}
                </Badge>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: 18 }}>×</button>
            </div>

            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: 2 }}>{selected.debiteur_nom}</h3>
              {selected.debiteur_forme_juridique && (
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-2)", marginBottom: 4 }}>{selected.debiteur_forme_juridique}</p>
              )}
              {selected.debiteur_adresse && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", marginBottom: 16 }}>
                  {selected.debiteur_adresse}, {selected.debiteur_ville}
                </p>
              )}

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-2)", marginBottom: 8 }}>Nature du dossier</p>
                <p style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--ink)" }}>{selected.nature}</p>
              </div>

              {[
                ["Tribunal", selected.tribunal],
                ["Juge commissaire", selected.juge_commissaire],
                ["Administrateur", selected.administrateur],
                ["Mandataire", selected.mandataire],
                ["Gérant", selected.gerant_nom],
                ["Téléphone gérant", selected.gerant_telephone],
                ["Email gérant", selected.gerant_email],
                ["N° greffe", selected.numero_greffe],
                ["Securigreffe", selected.securigreffe_id],
                ["Assujettie TVA", selected.societe_assujettie_tva === undefined ? null : selected.societe_assujettie_tva ? "Oui" : "Non"],
                ["Déclaration honneur", selected.declaration_honneur_signee === undefined ? null : selected.declaration_honneur_signee ? "Signée" : "Non signée"],
                ["Décret", selected.decret],
                ["Date jugement", selected.date_jugement ? new Date(selected.date_jugement).toLocaleDateString("fr-FR") : null],
                ["Date ouverture", new Date(selected.date_ouverture).toLocaleDateString("fr-FR")],
                ["Date vente prévue", selected.date_vente ? new Date(selected.date_vente).toLocaleDateString("fr-FR") : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div
                  key={label as string}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "var(--text-base)",
                  }}
                >
                  <span style={{ color: "var(--ink-2)" }}>{label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right", maxWidth: 200 }}>{value}</span>
                </div>
              ))}

              {selected.commentaires && (
                <div style={{ marginTop: 16, padding: 12, background: "var(--surface)", borderRadius: "var(--radius)", fontSize: "var(--text-base)", color: "var(--ink)", lineHeight: 1.6 }}>
                  {selected.commentaires}
                </div>
              )}
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <Button
                variant="primary"
                size="sm"
                block
                onClick={() => router.push(`/dashboard/dossiers/${selected.id}?tab=objets`)}
              >
                Voir les objets
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditingDossier(selected)}>
                Modifier
              </Button>
            </div>
          </div>
        )}
      </div>

      {showCreate && orgId && (
        <DossierForm
          mode="create"
          organisationId={orgId}
          onClose={() => setShowCreate(false)}
          onSaved={(d) => {
            const created = d as Dossier;
            setDossiers((prev) => [created, ...prev]);
            setSelected(created);
          }}
        />
      )}

      {editingDossier && orgId && (
        <DossierForm
          mode="edit"
          organisationId={orgId}
          dossierId={editingDossier.id}
          initialValues={dossierToForm(editingDossier as unknown as Partial<DossierFormValues> & Record<string, unknown>)}
          onClose={() => setEditingDossier(null)}
          onSaved={(d) => {
            const updated = d as Dossier;
            setDossiers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
