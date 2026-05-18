"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";

const NATURES = [
  "Liquidation Judiciaire",
  "Redressement Judiciaire",
  "Sauvegarde",
  "Cession d'actifs",
  "Vente judiciaire diverse",
];

export type DossierFormValues = {
  numero: string;
  nature: string;
  date_ouverture: string;
  date_vente: string;
  debiteur_nom: string;
  debiteur_forme_juridique: string;
  debiteur_adresse: string;
  debiteur_code_postal: string;
  debiteur_ville: string;
  correspondant: string;
  correspondant_email: string;
  signataire: string;
  collaborateur: string;
  tribunal: string;
  juge_commissaire: string;
  juge_commissaire_adresse: string;
  administrateur: string;
  administrateur_adresse: string;
  mandataire: string;
  mandataire_adresse: string;
  greffe_adresse: string;
  numero_greffe: string;
  date_jugement: string;
  decret: string;
  securigreffe_id: string;
  societe_assujettie_tva: boolean;
  conseil_nom: string;
  autres_membres: string;
  gerant_nom: string;
  gerant_adresse: string;
  gerant_telephone: string;
  gerant_email: string;
  declaration_honneur_signee: boolean;
  declaration_honneur_url: string | null;
  commentaires: string;
};

export const emptyDossierForm = (): DossierFormValues => ({
  numero: "",
  nature: "Liquidation Judiciaire",
  date_ouverture: new Date().toISOString().split("T")[0],
  date_vente: "",
  debiteur_nom: "",
  debiteur_forme_juridique: "",
  debiteur_adresse: "",
  debiteur_code_postal: "",
  debiteur_ville: "",
  correspondant: "",
  correspondant_email: "",
  signataire: "",
  collaborateur: "",
  tribunal: "",
  juge_commissaire: "",
  juge_commissaire_adresse: "",
  administrateur: "",
  administrateur_adresse: "",
  mandataire: "",
  mandataire_adresse: "",
  greffe_adresse: "",
  numero_greffe: "",
  date_jugement: "",
  decret: "",
  securigreffe_id: "",
  societe_assujettie_tva: false,
  conseil_nom: "",
  autres_membres: "",
  gerant_nom: "",
  gerant_adresse: "",
  gerant_telephone: "",
  gerant_email: "",
  declaration_honneur_signee: false,
  declaration_honneur_url: null,
  commentaires: "",
});

export function dossierToForm(d: Partial<DossierFormValues> & Record<string, unknown>): DossierFormValues {
  const base = emptyDossierForm();
  const out: DossierFormValues = { ...base };
  (Object.keys(base) as (keyof DossierFormValues)[]).forEach((k) => {
    const v = d[k as string];
    if (v == null) return;
    if (typeof base[k] === "boolean") {
      // @ts-expect-error narrow at runtime
      out[k] = Boolean(v);
    } else if (typeof base[k] === "string") {
      // @ts-expect-error narrow at runtime
      out[k] = String(v);
    } else {
      // @ts-expect-error narrow at runtime
      out[k] = v;
    }
  });
  return out;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
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
        {title}
      </p>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "var(--text-base)", color: "var(--ink)" }}>
      <span
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: 34,
          height: 20,
          background: checked ? "var(--black)" : "var(--border-strong)",
          borderRadius: 99,
          transition: "background var(--transition)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 16 : 2,
            width: 16,
            height: 16,
            background: "var(--white)",
            borderRadius: "50%",
            transition: "left var(--transition)",
            boxShadow: "var(--shadow-sm)",
          }}
        />
      </span>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
    </label>
  );
}

type Props = {
  mode: "create" | "edit";
  initialValues?: Partial<DossierFormValues>;
  organisationId: string;
  dossierId?: string;
  onClose: () => void;
  onSaved: (dossier: Record<string, unknown>) => void;
};

export default function DossierForm({ mode, initialValues, organisationId, dossierId, onClose, onSaved }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [form, setForm] = useState<DossierFormValues>(() => ({ ...emptyDossierForm(), ...(initialValues || {}) } as DossierFormValues));
  const [loading, setLoading] = useState(false);
  const [declarationFile, setDeclarationFile] = useState<File | null>(null);
  const declarationInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({ ...prev, ...initialValues } as DossierFormValues));
    }
  }, [initialValues]);

  const f = <K extends keyof DossierFormValues>(k: K, v: DossierFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const uploadDeclaration = async (id: string): Promise<string | null> => {
    if (!declarationFile) return null;
    const ext = declarationFile.name.split(".").pop() || "pdf";
    const path = `${organisationId}/${id}/declaration_honneur.${ext}`;
    const { error } = await supabase.storage
      .from("dossier-docs")
      .upload(path, declarationFile, { upsert: true });
    if (error) {
      toast.error(`Déclaration honneur : ${error.message}`);
      return null;
    }
    const { data } = await supabase.storage.from("dossier-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl || null;
  };

  const handleSubmit = async () => {
    if (!form.numero.trim() || !form.debiteur_nom.trim()) {
      toast.error("Numéro et nom du débiteur sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        organisation_id: organisationId,
        date_vente: form.date_vente || null,
        date_jugement: form.date_jugement || null,
      };
      delete payload.declaration_honneur_url;

      let saved: Record<string, unknown> | null = null;

      if (mode === "create") {
        payload.statut = "en_cours";
        const { data, error } = await supabase.from("dossiers").insert(payload).select().single();
        if (error || !data) {
          toast.error(error?.message || "Erreur lors de la création.");
          return;
        }
        saved = data as Record<string, unknown>;
      } else {
        if (!dossierId) return;
        const { data, error } = await supabase
          .from("dossiers")
          .update(payload)
          .eq("id", dossierId)
          .select()
          .single();
        if (error || !data) {
          toast.error(error?.message || "Erreur lors de la mise à jour.");
          return;
        }
        saved = data as Record<string, unknown>;
      }

      if (declarationFile && saved && saved.id) {
        const url = await uploadDeclaration(String(saved.id));
        if (url) {
          const { data: updated } = await supabase
            .from("dossiers")
            .update({ declaration_honneur_url: url, declaration_honneur_signee: true })
            .eq("id", String(saved.id))
            .select()
            .single();
          if (updated) saved = updated as Record<string, unknown>;
        }
      } else if (form.declaration_honneur_url !== undefined && saved && saved.id && mode === "edit") {
        const { data: updated } = await supabase
          .from("dossiers")
          .update({ declaration_honneur_url: form.declaration_honneur_url })
          .eq("id", String(saved.id))
          .select()
          .single();
        if (updated) saved = updated as Record<string, unknown>;
      }

      toast.success(mode === "create" ? "Dossier créé." : "Dossier mis à jour.");
      onSaved(saved!);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === "create" ? "Nouveau dossier judiciaire" : "Modifier le dossier"}
      onClose={onClose}
      onConfirm={handleSubmit}
      confirmLabel={mode === "create" ? "Créer le dossier" : "Enregistrer"}
      confirmLoading={loading}
      confirmDisabled={!form.numero.trim() || !form.debiteur_nom.trim()}
      size="xl"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Section title="Identification">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="N° Dossier *" value={form.numero} onChange={(e) => f("numero", e.target.value)} placeholder="ex. TC21136" />
            <Select label="Nature *" value={form.nature} onChange={(e) => f("nature", e.target.value)} options={NATURES.map((n) => ({ value: n, label: n }))} />
            <Input label="Date d'ouverture" type="date" value={form.date_ouverture} onChange={(e) => f("date_ouverture", e.target.value)} />
            <Input label="Date de vente prévue" type="date" value={form.date_vente} onChange={(e) => f("date_vente", e.target.value)} />
          </div>
        </Section>

        <Section title="Débiteur / Vendeur">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Nom / Raison sociale *" value={form.debiteur_nom} onChange={(e) => f("debiteur_nom", e.target.value)} placeholder="ex. LA PETITE GROSSE" />
            </div>
            <Input label="Forme juridique" value={form.debiteur_forme_juridique} onChange={(e) => f("debiteur_forme_juridique", e.target.value)} placeholder="ex. SARL" />
            <Input label="Adresse" value={form.debiteur_adresse} onChange={(e) => f("debiteur_adresse", e.target.value)} />
            <Input label="Code postal" value={form.debiteur_code_postal} onChange={(e) => f("debiteur_code_postal", e.target.value)} />
            <Input label="Ville" value={form.debiteur_ville} onChange={(e) => f("debiteur_ville", e.target.value)} />
          </div>
        </Section>

        <Section title="Procédure judiciaire">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Tribunal" value={form.tribunal} onChange={(e) => f("tribunal", e.target.value)} />
            <Input label="N° greffe" value={form.numero_greffe} onChange={(e) => f("numero_greffe", e.target.value)} placeholder="ex. P202400429" />
            <Input label="Date jugement" type="date" value={form.date_jugement} onChange={(e) => f("date_jugement", e.target.value)} />
            <Input label="ID Securigreffe" value={form.securigreffe_id} onChange={(e) => f("securigreffe_id", e.target.value)} placeholder="référence du suivi" />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Décret" value={form.decret} onChange={(e) => f("decret", e.target.value)} placeholder="ex. Arrêté du 28/02/2020" />
            </div>
          </div>
        </Section>

        <Section title="Coordonnées intervenants">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Juge commissaire" value={form.juge_commissaire} onChange={(e) => f("juge_commissaire", e.target.value)} />
            <Input label="Adresse juge commissaire" value={form.juge_commissaire_adresse} onChange={(e) => f("juge_commissaire_adresse", e.target.value)} />
            <Input label="Mandataire judiciaire" value={form.mandataire} onChange={(e) => f("mandataire", e.target.value)} />
            <Input label="Adresse mandataire" value={form.mandataire_adresse} onChange={(e) => f("mandataire_adresse", e.target.value)} />
            <Input label="Administrateur" value={form.administrateur} onChange={(e) => f("administrateur", e.target.value)} />
            <Input label="Adresse administrateur" value={form.administrateur_adresse} onChange={(e) => f("administrateur_adresse", e.target.value)} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Adresse du greffe" value={form.greffe_adresse} onChange={(e) => f("greffe_adresse", e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Gérant / Représentant">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Nom du gérant" value={form.gerant_nom} onChange={(e) => f("gerant_nom", e.target.value)} />
            <Input label="Téléphone" value={form.gerant_telephone} onChange={(e) => f("gerant_telephone", e.target.value)} placeholder="06 12 34 56 78" />
            <Input label="Email" type="email" value={form.gerant_email} onChange={(e) => f("gerant_email", e.target.value)} />
            <Input label="Adresse" value={form.gerant_adresse} onChange={(e) => f("gerant_adresse", e.target.value)} />
          </div>
        </Section>

        <Section title="Société">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle
              checked={form.societe_assujettie_tva}
              onChange={(v) => f("societe_assujettie_tva", v)}
              label="Société assujettie à la TVA"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Conseil" value={form.conseil_nom} onChange={(e) => f("conseil_nom", e.target.value)} placeholder="Avocat, expert-comptable…" />
              <Input label="Autres membres" value={form.autres_membres} onChange={(e) => f("autres_membres", e.target.value)} placeholder="associés, etc." />
            </div>
          </div>
        </Section>

        <Section title="Correspondants étude">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Correspondant" value={form.correspondant} onChange={(e) => f("correspondant", e.target.value)} placeholder="ex. Me. Julie PERROT" />
            <Input label="Email correspondant" type="email" value={form.correspondant_email} onChange={(e) => f("correspondant_email", e.target.value)} />
            <Input label="Signataire" value={form.signataire} onChange={(e) => f("signataire", e.target.value)} />
            <Input label="Collaborateur" value={form.collaborateur} onChange={(e) => f("collaborateur", e.target.value)} />
          </div>
        </Section>

        <Section title="Déclaration sur l'honneur">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle
              checked={form.declaration_honneur_signee}
              onChange={(v) => f("declaration_honneur_signee", v)}
              label="Déclaration sur l'honneur signée"
            />
            {form.declaration_honneur_signee && (
              <div>
                <input
                  ref={declarationInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setDeclarationFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Button variant="secondary" size="sm" type="button" onClick={() => declarationInputRef.current?.click()}>
                    {declarationFile ? "Changer le document" : form.declaration_honneur_url ? "Remplacer le document" : "Téléverser le PDF"}
                  </Button>
                  {declarationFile && (
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{declarationFile.name}</span>
                  )}
                  {!declarationFile && form.declaration_honneur_url && (
                    <a
                      href={form.declaration_honneur_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "var(--text-sm)", color: "var(--accent-dark)" }}
                    >
                      Voir le document actuel
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Commentaires">
          <textarea
            value={form.commentaires}
            onChange={(e) => f("commentaires", e.target.value)}
            placeholder="Notes internes…"
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
              minHeight: 70,
              background: "var(--white)",
            }}
          />
        </Section>
      </div>
    </Modal>
  );
}
