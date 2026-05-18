"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Badge, Button, EmptyState, Tabs, Modal } from "@/components/ui";
import ObjetJudiciaireForm, { RUBRIQUES, RUBRIQUE_LABELS, RubriqueValue } from "@/components/app/ObjetJudiciaireForm";
import DossierForm, { dossierToForm, DossierFormValues } from "@/components/app/DossierForm";
import ContratsSection from "@/components/app/ContratsSection";
import LieuxSection from "@/components/app/LieuxSection";

type Dossier = {
  id: string;
  organisation_id: string;
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
  juge_commissaire_adresse: string | null;
  administrateur: string;
  administrateur_adresse: string | null;
  mandataire: string;
  mandataire_adresse: string | null;
  greffe_adresse: string | null;
  numero_greffe: string;
  date_jugement: string | null;
  decret: string;
  securigreffe_id: string | null;
  societe_assujettie_tva: boolean | null;
  conseil_nom: string | null;
  autres_membres: string | null;
  gerant_nom: string | null;
  gerant_adresse: string | null;
  gerant_telephone: string | null;
  gerant_email: string | null;
  declaration_honneur_signee: boolean | null;
  declaration_honneur_url: string | null;
  commentaires: string;
};

type Objet = {
  id: string;
  numero_repertoire: string;
  titre: string | null;
  description: string | null;
  artiste: string | null;
  technique: string | null;
  rubrique: string | null;
  etat: string | null;
  valeur_exploitation: number | null;
  valeur_reprise: number | null;
  estimation_basse: number | null;
  estimation_haute: number | null;
  status: string;
  photo_url: string | null;
  numero_lot: string | null;
};

const STATUTS: Record<string, { label: string; variant: "success" | "neutral" | "warning" }> = {
  en_cours: { label: "En cours", variant: "success" },
  cloture: { label: "Clôturé", variant: "neutral" },
  suspendu: { label: "Suspendu", variant: "warning" },
};

const formatEuro = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toLocaleString("fr-FR")} €`;

export default function DossierDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const dossierId = String(id);
  const supabase = createClient();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);
  const initialTab = (searchParams.get("tab") as "infos" | "objets" | "annexes" | "courriers" | null) || "infos";
  const [activeTab, setActiveTab] = useState<"infos" | "objets" | "annexes" | "courriers">(initialTab);

  const [rubriqueFilter, setRubriqueFilter] = useState<"all" | RubriqueValue>("all");
  const [showCreateObjet, setShowCreateObjet] = useState(false);
  const [showAddFromRepertoire, setShowAddFromRepertoire] = useState(false);
  const [disponibles, setDisponibles] = useState<Objet[]>([]);
  const [selectedRepertoire, setSelectedRepertoire] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const loadData = async () => {
    setLoading(true);
    const { data: dossierData } = await supabase.from("dossiers").select("*").eq("id", dossierId).single();
    setDossier(dossierData);
    const { data: objetsData } = await supabase
      .from("objets")
      .select("*")
      .eq("dossier_id", dossierId)
      .order("numero_repertoire", { ascending: true });
    setObjets(objetsData || []);
    setLoading(false);
  };

  const loadDisponibles = async () => {
    if (!dossier) return;
    const { data } = await supabase
      .from("objets")
      .select("*")
      .eq("organisation_id", dossier.organisation_id)
      .is("dossier_id", null)
      .eq("status", "en_attente");
    setDisponibles(data || []);
  };

  const handleAddFromRepertoire = async () => {
    if (selectedRepertoire.length === 0) return;
    await supabase.from("objets").update({ dossier_id: dossierId, status: "attribue" }).in("id", selectedRepertoire);
    await loadData();
    setShowAddFromRepertoire(false);
    setSelectedRepertoire([]);
  };

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: objets.length };
    for (const r of RUBRIQUES) base[r.value] = 0;
    for (const o of objets) {
      const k = o.rubrique || "_sans_";
      base[k] = (base[k] || 0) + 1;
    }
    return base;
  }, [objets]);

  const filteredObjets = useMemo(() => {
    if (rubriqueFilter === "all") return objets;
    return objets.filter((o) => o.rubrique === rubriqueFilter);
  }, [objets, rubriqueFilter]);

  if (loading) return <div style={{ padding: 32, color: "var(--ink-2)" }}>Chargement…</div>;
  if (!dossier) return <div style={{ padding: 32, color: "var(--ink-2)" }}>Dossier introuvable</div>;

  const statut = STATUTS[dossier.statut] || STATUTS.en_cours;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/dashboard/dossiers" style={{ fontSize: "var(--text-base)", color: "var(--ink-2)", textDecoration: "none" }}>← Dossiers</Link>
        <span style={{ color: "var(--border-dark)" }}>·</span>
        <span style={{ fontFamily: "monospace", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink)" }}>{dossier.numero}</span>
        <Badge variant={statut.variant} size="md">{statut.label}</Badge>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16 }}>
        <div>
          <h1 className="serif" style={{ fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>{dossier.debiteur_nom}</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)" }}>
            {[dossier.nature, dossier.debiteur_forme_juridique, dossier.debiteur_ville].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => setShowEdit(true)}>Modifier</Button>
      </div>

      <Tabs
        items={[
          { id: "infos", label: "Informations" },
          { id: "objets", label: `Objets (${objets.length})` },
          { id: "annexes", label: "Annexes" },
          { id: "courriers", label: "Courriers" },
        ] as const}
        active={activeTab}
        onChange={(t) => setActiveTab(t as "infos" | "objets" | "annexes" | "courriers")}
        style={{ marginBottom: 24 }}
      />

      {activeTab === "infos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            {
              title: "Débiteur",
              fields: [
                ["Raison sociale", dossier.debiteur_nom],
                ["Forme juridique", dossier.debiteur_forme_juridique],
                ["Adresse", dossier.debiteur_adresse],
                ["Code postal", dossier.debiteur_code_postal],
                ["Ville", dossier.debiteur_ville],
              ],
            },
            {
              title: "Procédure judiciaire",
              fields: [
                ["Nature", dossier.nature],
                ["Tribunal", dossier.tribunal],
                ["N° greffe", dossier.numero_greffe],
                ["Securigreffe", dossier.securigreffe_id],
                ["Décret", dossier.decret],
                ["Date jugement", dossier.date_jugement ? new Date(dossier.date_jugement).toLocaleDateString("fr-FR") : ""],
                ["Date d'ouverture", new Date(dossier.date_ouverture).toLocaleDateString("fr-FR")],
                ["Date de vente prévue", dossier.date_vente ? new Date(dossier.date_vente).toLocaleDateString("fr-FR") : "Non définie"],
              ],
            },
            {
              title: "Coordonnées intervenants",
              fields: [
                ["Juge commissaire", dossier.juge_commissaire],
                ["Adresse juge", dossier.juge_commissaire_adresse],
                ["Mandataire", dossier.mandataire],
                ["Adresse mandataire", dossier.mandataire_adresse],
                ["Administrateur", dossier.administrateur],
                ["Adresse administrateur", dossier.administrateur_adresse],
                ["Adresse greffe", dossier.greffe_adresse],
              ],
            },
            {
              title: "Gérant",
              fields: [
                ["Nom", dossier.gerant_nom],
                ["Téléphone", dossier.gerant_telephone],
                ["Email", dossier.gerant_email],
                ["Adresse", dossier.gerant_adresse],
              ],
            },
            {
              title: "Société",
              fields: [
                ["Assujettie TVA", dossier.societe_assujettie_tva == null ? "" : dossier.societe_assujettie_tva ? "Oui" : "Non"],
                ["Conseil", dossier.conseil_nom],
                ["Autres membres", dossier.autres_membres],
              ],
            },
            {
              title: "Correspondants étude",
              fields: [
                ["Correspondant", dossier.correspondant],
                ["Email", dossier.correspondant_email],
                ["Signataire", dossier.signataire],
                ["Collaborateur", dossier.collaborateur],
              ],
            },
          ].map((section) => {
            const visible = section.fields.filter(([, v]) => v);
            if (visible.length === 0) return null;
            return (
              <div key={section.title} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{section.title}</p>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {visible.map(([label, value]) => (
                    <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px", fontSize: "var(--text-base)", gap: 12 }}>
                      <span style={{ color: "var(--ink-2)" }}>{label}</span>
                      <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right", maxWidth: 240, wordBreak: "break-word" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>Déclaration sur l&apos;honneur</p>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <Badge variant={dossier.declaration_honneur_signee ? "success" : "warning"} size="md">
                {dossier.declaration_honneur_signee ? "Signée" : "Non signée"}
              </Badge>
              {dossier.declaration_honneur_url && (
                <a
                  href={dossier.declaration_honneur_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "var(--text-sm)", color: "var(--accent-dark)" }}
                >
                  Ouvrir le document
                </a>
              )}
            </div>
          </div>

          {dossier.commentaires && (
            <div style={{ gridColumn: "1 / -1", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Commentaires</p>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink)", lineHeight: 1.6 }}>{dossier.commentaires}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "objets" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => setRubriqueFilter("all")}
                style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: "var(--text-sm)", fontWeight: 500,
                  border: "1px solid", borderColor: rubriqueFilter === "all" ? "var(--black)" : "var(--border)",
                  background: rubriqueFilter === "all" ? "var(--black)" : "transparent",
                  color: rubriqueFilter === "all" ? "var(--white)" : "var(--ink-2)", cursor: "pointer",
                }}
              >
                Tous <span style={{ opacity: 0.6 }}>({counts.all})</span>
              </button>
              {RUBRIQUES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRubriqueFilter(r.value)}
                  style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: "var(--text-sm)", fontWeight: 500,
                    border: "1px solid", borderColor: rubriqueFilter === r.value ? "var(--black)" : "var(--border)",
                    background: rubriqueFilter === r.value ? "var(--black)" : "transparent",
                    color: rubriqueFilter === r.value ? "var(--white)" : "var(--ink-2)", cursor: "pointer",
                  }}
                >
                  {r.label} <span style={{ opacity: 0.6 }}>({counts[r.value] || 0})</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => { loadDisponibles(); setShowAddFromRepertoire(true); }}>
                Depuis le répertoire
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowCreateObjet(true)}>
                + Ajouter un objet
              </Button>
            </div>
          </div>

          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {filteredObjets.length === 0 ? (
              <EmptyState
                title={objets.length === 0 ? "Aucun objet dans ce dossier" : "Aucun objet dans cette rubrique"}
                description={objets.length === 0 ? "Inventorier les objets par rubrique (matériel, mobilier, véhicule…) ou importer un inventaire PDF déjà rédigé." : undefined}
                action={objets.length === 0 ? <Button variant="primary" size="md" onClick={() => setShowCreateObjet(true)}>Ajouter manuellement</Button> : undefined}
                secondaryAction={objets.length === 0 ? <Button variant="secondary" size="md" disabled title="Bientôt disponible">Importer un inventaire (PDF)</Button> : undefined}
              />
            ) : (
              <>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "60px 80px 1fr 120px 80px 100px 100px 120px", gap: 12, alignItems: "center" }}>
                  {["Photo", "N°", "Description", "Rubrique", "État", "Val. expl.", "Val. reprise", "Estimation"].map((h) => (
                    <p key={h} style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-2)" }}>{h}</p>
                  ))}
                </div>
                {filteredObjets.map((objet, i) => (
                  <div key={objet.id} style={{ padding: "10px 20px", borderBottom: i < filteredObjets.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "60px 80px 1fr 120px 80px 100px 100px 120px", gap: 12, alignItems: "center" }}>
                    {objet.photo_url ? (
                      <img src={objet.photo_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: "var(--radius)", background: "var(--cream)", border: "1px solid var(--border)" }} />
                    )}
                    <span style={{ fontFamily: "monospace", fontSize: "var(--text-sm)", color: "var(--ink-2)", fontWeight: 600 }}>{objet.numero_repertoire}</span>
                    <div>
                      <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
                        {objet.description || objet.titre || "—"}
                      </p>
                      {objet.artiste && <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{objet.artiste}</p>}
                    </div>
                    <span>
                      {objet.rubrique ? (
                        <Badge variant="neutral" size="sm">{RUBRIQUE_LABELS[objet.rubrique] || objet.rubrique}</Badge>
                      ) : (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>—</span>
                      )}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{objet.etat || "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--ink)", textAlign: "right" }}>{formatEuro(objet.valeur_exploitation)}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--ink)", textAlign: "right" }}>{formatEuro(objet.valeur_reprise)}</span>
                    <span style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-serif)", color: "var(--ink)", textAlign: "right" }}>
                      {objet.estimation_basse || objet.estimation_haute
                        ? `${(objet.estimation_basse || 0).toLocaleString("fr-FR")} – ${(objet.estimation_haute || 0).toLocaleString("fr-FR")} €`
                        : "—"}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "annexes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ContratsSection dossierId={dossierId} organisationId={dossier.organisation_id} />
          <LieuxSection dossierId={dossierId} organisationId={dossier.organisation_id} />
        </div>
      )}

      {activeTab === "courriers" && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "48px 24px", textAlign: "center" }}>
          <p className="serif" style={{ fontSize: "var(--text-xl)", fontWeight: 500, marginBottom: 8 }}>Courriers automatiques</p>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)", marginBottom: 24 }}>
            Génération automatique des courriers types — ordonnance, demande d&apos;évaluation, note d&apos;honoraires, envoi inventaire.
          </p>
          <Badge variant="accent" size="md">En développement</Badge>
        </div>
      )}

      {showCreateObjet && (
        <ObjetJudiciaireForm
          dossierId={dossierId}
          organisationId={dossier.organisation_id}
          defaultRubrique={rubriqueFilter === "all" ? "materiel" : (rubriqueFilter as RubriqueValue)}
          onClose={() => setShowCreateObjet(false)}
          onCreated={loadData}
        />
      )}

      {showEdit && dossier && (
        <DossierForm
          mode="edit"
          organisationId={dossier.organisation_id}
          dossierId={dossier.id}
          initialValues={dossierToForm(dossier as unknown as Partial<DossierFormValues> & Record<string, unknown>)}
          onClose={() => setShowEdit(false)}
          onSaved={(d) => setDossier(d as Dossier)}
        />
      )}

      {showAddFromRepertoire && (
        <Modal
          title="Ajouter depuis le répertoire"
          subtitle={`${disponibles.length} objet${disponibles.length > 1 ? "s" : ""} disponible${disponibles.length > 1 ? "s" : ""}`}
          onClose={() => setShowAddFromRepertoire(false)}
          onConfirm={handleAddFromRepertoire}
          confirmLabel={`Ajouter${selectedRepertoire.length > 0 ? ` (${selectedRepertoire.length})` : ""}`}
          confirmDisabled={selectedRepertoire.length === 0}
          size="md"
        >
          {disponibles.length === 0 ? (
            <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)", textAlign: "center", padding: "24px 0" }}>
              Aucun objet disponible dans le répertoire.
            </p>
          ) : (
            disponibles.map((objet, i) => (
              <div
                key={objet.id}
                onClick={() => setSelectedRepertoire((s) => (s.includes(objet.id) ? s.filter((x) => x !== objet.id) : [...s, objet.id]))}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0",
                  borderBottom: i < disponibles.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" checked={selectedRepertoire.includes(objet.id)} readOnly style={{ width: 16, height: 16 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--ink)" }}>{objet.titre || objet.description || "—"}</p>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{objet.numero_repertoire} · {objet.technique || "—"}</p>
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
                  {(objet.estimation_basse || 0).toLocaleString("fr-FR")} – {(objet.estimation_haute || 0).toLocaleString("fr-FR")} €
                </p>
              </div>
            ))
          )}
        </Modal>
      )}
    </div>
  );
}
