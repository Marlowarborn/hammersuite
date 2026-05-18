"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button, Badge, Modal, Select, Input, useToast } from "@/components/ui";
import {
  COURRIER_TYPE_META,
  COURRIER_TYPES,
  DESTINATAIRES,
  DESTINATAIRE_LABELS,
  type CourrierType,
  type DestinataireValue,
} from "@/lib/labels";

type Courrier = {
  id: string;
  type: CourrierType;
  destinataire: string | null;
  reference: string | null;
  pdf_url: string | null;
  pdfmonkey_doc_id: string | null;
  status: string;
  created_at: string;
  generated_at: string | null;
  sent_at: string | null;
};

type Options = {
  objet?: string;
  corps?: string;
  description_prestation?: string;
  montant_ht?: string;
  taux_tva?: string;
  mode_reglement?: string;
};

type GenerateParams = {
  type: CourrierType;
  destinataire?: DestinataireValue;
  options?: Options;
};

const STATUS_VARIANT: Record<string, "neutral" | "success" | "info"> = {
  draft: "neutral",
  generated: "info",
  sent: "success",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  generated: "Généré",
  sent: "Envoyé",
};

function dateFr(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

type Props = {
  dossierId: string;
};

export default function CourriersTab({ dossierId }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [configType, setConfigType] = useState<CourrierType | null>(null);
  const [configOptions, setConfigOptions] = useState<Options>({});
  const [configDestinataire, setConfigDestinataire] = useState<DestinataireValue>("juge_commissaire");
  const [generating, setGenerating] = useState<CourrierType | null>(null);
  const [previewCourrier, setPreviewCourrier] = useState<Courrier | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refreshingPreview, setRefreshingPreview] = useState(false);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("courriers")
      .select("*")
      .eq("dossier_id", dossierId)
      .order("generated_at", { ascending: false, nullsFirst: false });
    setCourriers((data || []) as Courrier[]);
    setLoading(false);
  };

  const lastByType = useMemo(() => {
    const map: Partial<Record<CourrierType, Courrier>> = {};
    for (const c of courriers) {
      if (!map[c.type]) map[c.type] = c;
    }
    return map;
  }, [courriers]);

  const callGenerate = async (params: GenerateParams) => {
    setGenerating(params.type);
    try {
      const cleanedOptions: Options | undefined = params.options
        ? Object.fromEntries(
            Object.entries(params.options).filter(([, v]) => v !== undefined && v !== ""),
          )
        : undefined;
      const res = await fetch("/api/generate-courrier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossier_id: dossierId,
          type: params.type,
          destinataire: params.destinataire,
          options: cleanedOptions,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur génération courrier.");
        return;
      }
      toast.success("Courrier généré.");
      await load();
      const courrier = json.courrier as Courrier;
      setPreviewCourrier(courrier);
      setPreviewUrl(courrier.pdf_url);
    } finally {
      setGenerating(null);
      setConfigType(null);
      setConfigOptions({});
    }
  };

  const handleCardClick = (type: CourrierType) => {
    if (type === "ordonnance" || type === "der" || type === "inventaire_judiciaire") {
      callGenerate({ type });
      return;
    }
    setConfigOptions({});
    setConfigDestinataire("juge_commissaire");
    setConfigType(type);
  };

  const submitConfig = () => {
    if (!configType) return;
    callGenerate({
      type: configType,
      destinataire: configType === "courrier_envoi" ? configDestinataire : undefined,
      options: configOptions,
    });
  };

  const openPreview = async (courrier: Courrier) => {
    setPreviewCourrier(courrier);
    setPreviewUrl(courrier.pdf_url);
    setRefreshingPreview(true);
    try {
      const res = await fetch("/api/courriers/refresh-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courrier_id: courrier.id }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setPreviewUrl(json.url);
      }
    } finally {
      setRefreshingPreview(false);
    }
  };

  const markSent = async (courrier: Courrier) => {
    const { data, error } = await supabase
      .from("courriers")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", courrier.id)
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message || "Erreur mise à jour.");
      return;
    }
    toast.success("Marqué comme envoyé.");
    setCourriers((prev) => prev.map((c) => (c.id === courrier.id ? (data as Courrier) : c)));
    if (previewCourrier?.id === courrier.id) setPreviewCourrier(data as Courrier);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {COURRIER_TYPES.map((type) => {
          const meta = COURRIER_TYPE_META[type];
          const last = lastByType[type];
          const isGenerating = generating === type;
          return (
            <div
              key={type}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 160,
              }}
            >
              <div>
                <p style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                  {meta.label}
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{meta.subtitle}</p>
              </div>
              {last && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                  <span>Dernière génération : {dateFr(last.generated_at)}</span>
                  {last.reference && <span>Réf. {last.reference}</span>}
                  {last.destinataire && <span>Pour : {DESTINATAIRE_LABELS[last.destinataire] || last.destinataire}</span>}
                </div>
              )}
              <div style={{ marginTop: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <Button variant="primary" size="sm" loading={isGenerating} onClick={() => handleCardClick(type)}>
                  Générer
                </Button>
                {last && (
                  <Button variant="ghost" size="sm" onClick={() => openPreview(last)}>
                    Voir le dernier
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>Historique</p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
            {courriers.length} courrier{courriers.length > 1 ? "s" : ""}
          </p>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-2)" }}>Chargement…</div>
        ) : courriers.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-2)", fontSize: "var(--text-md)" }}>
            Aucun courrier généré pour ce dossier.
          </div>
        ) : (
          <>
            <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "180px 140px 120px 140px 110px 1fr", gap: 12 }}>
              {["Type", "Référence", "Pour", "Généré le", "Statut", ""].map((h, i) => (
                <p key={i} style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-2)" }}>{h}</p>
              ))}
            </div>
            {courriers.map((c, i) => (
              <div
                key={c.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: i < courriers.length - 1 ? "1px solid var(--border)" : "none",
                  display: "grid",
                  gridTemplateColumns: "180px 140px 120px 140px 110px 1fr",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "var(--text-base)", color: "var(--ink)" }}>{COURRIER_TYPE_META[c.type]?.label || c.type}</span>
                <span style={{ fontSize: "var(--text-sm)", fontFamily: "monospace", color: "var(--ink-2)" }}>{c.reference || "—"}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
                  {c.destinataire ? DESTINATAIRE_LABELS[c.destinataire] || c.destinataire : "—"}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{dateFr(c.generated_at)}</span>
                <Badge variant={STATUS_VARIANT[c.status] || "neutral"} size="sm">
                  {STATUS_LABEL[c.status] || c.status}
                </Badge>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button variant="secondary" size="sm" onClick={() => openPreview(c)}>Voir</Button>
                  {c.status !== "sent" && (
                    <Button variant="ghost" size="sm" onClick={() => markSent(c)}>Marquer envoyé</Button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {configType && (
        <Modal
          title={`Générer : ${COURRIER_TYPE_META[configType].label}`}
          subtitle={COURRIER_TYPE_META[configType].subtitle}
          onClose={() => setConfigType(null)}
          onConfirm={submitConfig}
          confirmLabel="Générer le PDF"
          confirmLoading={generating === configType}
          size="md"
        >
          <ConfigForm
            type={configType}
            options={configOptions}
            setOptions={setConfigOptions}
            destinataire={configDestinataire}
            setDestinataire={setConfigDestinataire}
          />
        </Modal>
      )}

      {previewCourrier && (
        <Modal
          title={`${COURRIER_TYPE_META[previewCourrier.type]?.label || previewCourrier.type}`}
          subtitle={
            [
              previewCourrier.reference,
              previewCourrier.destinataire
                ? `Pour : ${DESTINATAIRE_LABELS[previewCourrier.destinataire] || previewCourrier.destinataire}`
                : null,
              `Généré le ${dateFr(previewCourrier.generated_at)}`,
            ]
              .filter(Boolean)
              .join(" · ")
          }
          onClose={() => {
            setPreviewCourrier(null);
            setPreviewUrl(null);
          }}
          size="xl"
          footer={
            <>
              {previewCourrier.status !== "sent" && (
                <Button variant="secondary" size="md" onClick={() => markSent(previewCourrier)}>
                  Marquer comme envoyé
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (previewUrl) window.open(previewUrl, "_blank");
                }}
                disabled={!previewUrl}
              >
                Télécharger le PDF
              </Button>
            </>
          }
        >
          {refreshingPreview && !previewUrl ? (
            <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)", textAlign: "center", padding: 32 }}>
              Chargement de l&apos;aperçu…
            </p>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              title="Aperçu du courrier"
              style={{
                width: "100%",
                height: "70vh",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--surface)",
              }}
            />
          ) : (
            <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)", textAlign: "center", padding: 32 }}>
              Aperçu indisponible. Régénérez le courrier.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function ConfigForm({
  type,
  options,
  setOptions,
  destinataire,
  setDestinataire,
}: {
  type: CourrierType;
  options: Options;
  setOptions: (o: Options) => void;
  destinataire: DestinataireValue;
  setDestinataire: (v: DestinataireValue) => void;
}) {
  const f = <K extends keyof Options>(k: K, v: string) => setOptions({ ...options, [k]: v });

  if (type === "requete") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input
          label="Objet"
          value={options.objet || ""}
          onChange={(e) => f("objet", e.target.value)}
          placeholder="Requête aux fins de vente aux enchères publiques"
        />
        <div>
          <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Corps de la requête</label>
          <textarea
            value={options.corps || ""}
            onChange={(e) => f("corps", e.target.value)}
            placeholder="Texte de la requête (visible dans le PDF)…"
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: "var(--text-base)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              color: "var(--ink)",
              resize: "vertical",
              minHeight: 160,
            }}
          />
        </div>
      </div>
    );
  }

  if (type === "note_honoraires") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description de la prestation *</label>
          <textarea
            value={options.description_prestation || ""}
            onChange={(e) => f("description_prestation", e.target.value)}
            placeholder="ex. Inventaire judiciaire et vente aux enchères publiques"
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: "var(--text-base)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              color: "var(--ink)",
              resize: "vertical",
              minHeight: 80,
            }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Montant HT (€) *"
            type="number"
            inputMode="decimal"
            value={options.montant_ht || ""}
            onChange={(e) => f("montant_ht", e.target.value)}
          />
          <Input
            label="Taux TVA (%)"
            type="number"
            inputMode="decimal"
            value={options.taux_tva ?? "20"}
            onChange={(e) => f("taux_tva", e.target.value)}
            placeholder="20"
          />
        </div>
        <Select
          label="Mode de règlement"
          value={options.mode_reglement || "virement"}
          onChange={(e) => f("mode_reglement", e.target.value)}
          options={[
            { value: "virement", label: "Virement" },
            { value: "cheque", label: "Chèque" },
          ]}
        />
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
          Le numéro de facture est généré automatiquement (format NH-{new Date().getFullYear()}-NNN).
        </p>
      </div>
    );
  }

  if (type === "courrier_envoi") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Select
          label="Destinataire *"
          value={destinataire}
          onChange={(e) => setDestinataire(e.target.value as DestinataireValue)}
          options={DESTINATAIRES.map((d) => ({ value: d.value, label: d.label }))}
        />
        <Input
          label="Objet"
          value={options.objet || ""}
          onChange={(e) => f("objet", e.target.value)}
          placeholder="Communication concernant le dossier…"
        />
        <div>
          <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Corps du courrier *</label>
          <textarea
            value={options.corps || ""}
            onChange={(e) => f("corps", e.target.value)}
            placeholder="Texte du courrier…"
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: "var(--text-base)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              color: "var(--ink)",
              resize: "vertical",
              minHeight: 160,
            }}
          />
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
          Le nom et l&apos;adresse du destinataire sont automatiquement repris depuis les coordonnées du dossier.
        </p>
      </div>
    );
  }

  return null;
}
