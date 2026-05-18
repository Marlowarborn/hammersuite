"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";

export const RUBRIQUES = [
  { value: "materiel", label: "Matériel" },
  { value: "mobilier", label: "Mobilier" },
  { value: "vehicule", label: "Véhicule" },
  { value: "stock", label: "Stock" },
  { value: "leasing", label: "Leasing" },
  { value: "location", label: "Location" },
  { value: "depot", label: "Dépôt" },
] as const;

export type RubriqueValue = (typeof RUBRIQUES)[number]["value"];

export const RUBRIQUE_LABELS: Record<string, string> = Object.fromEntries(
  RUBRIQUES.map((r) => [r.value, r.label]),
);

type VehiculeDocKey =
  | "non_gage_url"
  | "cg_url"
  | "fiv_url"
  | "controle_technique_url"
  | "certificat_vente_url"
  | "certificat_cession_url";

const VEHICULE_DOCS: { key: VehiculeDocKey; label: string }[] = [
  { key: "non_gage_url", label: "Non-gage" },
  { key: "cg_url", label: "Carte grise" },
  { key: "fiv_url", label: "FIV" },
  { key: "controle_technique_url", label: "Contrôle technique" },
  { key: "certificat_vente_url", label: "Certificat de vente" },
  { key: "certificat_cession_url", label: "Certificat de cession" },
];

type Form = {
  rubrique: RubriqueValue;
  description: string;
  etat: string;
  valeur_exploitation: string;
  valeur_reprise: string;
  estimation_basse: string;
  estimation_haute: string;
};

const emptyForm = (): Form => ({
  rubrique: "materiel",
  description: "",
  etat: "",
  valeur_exploitation: "",
  valeur_reprise: "",
  estimation_basse: "",
  estimation_haute: "",
});

type Props = {
  dossierId: string;
  organisationId: string;
  defaultRubrique?: RubriqueValue;
  onClose: () => void;
  onCreated: () => void;
};

export default function ObjetJudiciaireForm({ dossierId, organisationId, defaultRubrique, onClose, onCreated }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [form, setForm] = useState<Form>(() => ({ ...emptyForm(), rubrique: defaultRubrique ?? "materiel" }));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [vehiculeFiles, setVehiculeFiles] = useState<Partial<Record<VehiculeDocKey, File>>>({});
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setForm((prev) => ({ ...prev, [k]: v }));

  const getNextNumero = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("objets")
      .select("numero_repertoire")
      .eq("organisation_id", organisationId)
      .like("numero_repertoire", `${year}-%`);
    const max = (data || []).reduce((acc, row) => {
      const n = parseInt(String(row.numero_repertoire).split("-")[1]) || 0;
      return Math.max(acc, n);
    }, 0);
    return `${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const uploadPhoto = async (objetId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop() || "jpg";
    const path = `${organisationId}/${objetId}.${ext}`;
    const { error } = await supabase.storage.from("objet-photos").upload(path, photoFile, { upsert: true });
    if (error) {
      toast.error(`Photo : ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from("objet-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadVehiculeDocs = async (objetId: string): Promise<Partial<Record<VehiculeDocKey, string>>> => {
    const result: Partial<Record<VehiculeDocKey, string>> = {};
    for (const doc of VEHICULE_DOCS) {
      const file = vehiculeFiles[doc.key];
      if (!file) continue;
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${organisationId}/${objetId}/${doc.key}.${ext}`;
      const { error } = await supabase.storage.from("vehicule-docs").upload(path, file, { upsert: true });
      if (error) {
        toast.error(`${doc.label} : ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("vehicule-docs").createSignedUrl
        ? await supabase.storage.from("vehicule-docs").createSignedUrl(path, 60 * 60 * 24 * 365)
        : { data: { signedUrl: path } as { signedUrl: string } };
      result[doc.key] = data?.signedUrl || path;
    }
    return result;
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast.error("La description est obligatoire.");
      return;
    }
    setLoading(true);
    try {
      const numero = await getNextNumero();
      const insertPayload = {
        organisation_id: organisationId,
        dossier_id: dossierId,
        numero_repertoire: numero,
        date_entree: new Date().toISOString().split("T")[0],
        type_entree: "judiciaire",
        rubrique: form.rubrique,
        titre: form.description.slice(0, 80),
        description: form.description,
        etat: form.etat || null,
        valeur_exploitation: form.valeur_exploitation ? Number(form.valeur_exploitation) : null,
        valeur_reprise: form.valeur_reprise ? Number(form.valeur_reprise) : null,
        estimation_basse: form.estimation_basse ? Number(form.estimation_basse) : 0,
        estimation_haute: form.estimation_haute ? Number(form.estimation_haute) : 0,
        status: "attribue",
      };

      const { data: created, error } = await supabase.from("objets").insert(insertPayload).select().single();
      if (error || !created) {
        toast.error(error?.message || "Erreur lors de la création.");
        return;
      }

      if (photoFile) {
        const url = await uploadPhoto(created.id);
        if (url) {
          await supabase.from("objets").update({ photo_url: url }).eq("id", created.id);
        }
      }

      if (form.rubrique === "vehicule") {
        const docs = await uploadVehiculeDocs(created.id);
        if (Object.keys(docs).length > 0) {
          await supabase.from("vehicule_docs").insert({
            objet_id: created.id,
            organisation_id: organisationId,
            ...docs,
          });
        }
      }

      toast.success(`Objet ${numero} ajouté.`);
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nouvel objet"
      subtitle="Ajout dans l'inventaire du dossier"
      onClose={onClose}
      onConfirm={handleSubmit}
      confirmLabel="Ajouter l'objet"
      confirmLoading={loading}
      confirmDisabled={!form.description.trim()}
      size="lg"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select
            label="Rubrique *"
            value={form.rubrique}
            onChange={(e) => setF("rubrique", e.target.value as RubriqueValue)}
            options={RUBRIQUES.map((r) => ({ value: r.value, label: r.label }))}
          />
          <Input label="État" value={form.etat} onChange={(e) => setF("etat", e.target.value)} placeholder="ex. bon, usagé, neuf" />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--ink-2)",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setF("description", e.target.value)}
            placeholder="Description détaillée de l'objet…"
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
          <Input label="Valeur d'exploitation (€)" type="number" inputMode="numeric" value={form.valeur_exploitation} onChange={(e) => setF("valeur_exploitation", e.target.value)} />
          <Input label="Valeur de reprise (€)" type="number" inputMode="numeric" value={form.valeur_reprise} onChange={(e) => setF("valeur_reprise", e.target.value)} />
          <Input label="Estimation basse (€)" type="number" inputMode="numeric" value={form.estimation_basse} onChange={(e) => setF("estimation_basse", e.target.value)} />
          <Input label="Estimation haute (€)" type="number" inputMode="numeric" value={form.estimation_haute} onChange={(e) => setF("estimation_haute", e.target.value)} />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--ink-2)",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Photo
          </label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => photoInputRef.current?.click()}>
              {photoFile ? "Changer la photo" : "Choisir une photo"}
            </Button>
            {photoFile && (
              <>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{photoFile.name}</span>
                <Button variant="ghost" size="sm" type="button" onClick={() => setPhotoFile(null)}>
                  Retirer
                </Button>
              </>
            )}
          </div>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Aperçu"
              style={{ marginTop: 8, maxHeight: 120, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
            />
          )}
        </div>

        {form.rubrique === "vehicule" && (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 16 }}>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-2)",
                marginBottom: 12,
              }}
            >
              Documents véhicule
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {VEHICULE_DOCS.map((doc) => (
                <div key={doc.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{doc.label}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) =>
                      setVehiculeFiles((prev) => {
                        const file = e.target.files?.[0];
                        const next = { ...prev };
                        if (file) next[doc.key] = file;
                        else delete next[doc.key];
                        return next;
                      })
                    }
                    style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
