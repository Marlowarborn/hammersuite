"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button, Badge, EmptyState, Input, Select, useToast } from "@/components/ui";
import { signedUrls } from "@/lib/storage";

export type Contrat = {
  id: string;
  type: string;
  description: string | null;
  // Ancien enregistrement : URL signée 1 an, qui expire.
  fichier_url: string | null;
  // Chemin du fichier dans le bucket privé dossier-docs.
  fichier_path: string | null;
  restituer_avant: string | null;
  created_at: string;
};

// Contrat tel qu'affiché : lien prêt à ouvrir, signé au chargement (1 h).
type ContratAffiche = Contrat & { fichier_href: string | null };

const TYPES = [
  { value: "location", label: "Location" },
  { value: "leasing", label: "Leasing" },
  { value: "depot", label: "Dépôt" },
  { value: "cg", label: "Conditions générales" },
  { value: "autre", label: "Autre" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

type Props = {
  dossierId: string;
  organisationId: string;
};

export default function ContratsSection({ dossierId, organisationId }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [contrats, setContrats] = useState<ContratAffiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState("location");
  const [description, setDescription] = useState("");
  const [restituerAvant, setRestituerAvant] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dossier_contrats")
      .select("*")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });
    const rows = (data || []) as Contrat[];
    // Une seule requête de signature pour tous les fichiers ; repli sur l'ancienne URL.
    const urls = await signedUrls(supabase, "dossier-docs", rows.map((c) => c.fichier_path));
    setContrats(
      rows.map((c) => ({
        ...c,
        fichier_href: (c.fichier_path && urls[c.fichier_path]) || c.fichier_url,
      })),
    );
    setLoading(false);
  };

  const reset = () => {
    setType("location");
    setDescription("");
    setRestituerAvant("");
    setFile(null);
    setAdding(false);
  };

  const uploadFile = async (contratId: string): Promise<string | null> => {
    if (!file) return null;
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${organisationId}/${dossierId}/contrats/${contratId}.${ext}`;
    const { error } = await supabase.storage.from("dossier-docs").upload(path, file, { upsert: true });
    if (error) {
      toast.error(`Fichier : ${error.message}`);
      return null;
    }
    // Bucket privé : on renvoie le chemin, signé à chaque chargement de la liste.
    return path;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: created, error } = await supabase
        .from("dossier_contrats")
        .insert({
          dossier_id: dossierId,
          organisation_id: organisationId,
          type,
          description: description || null,
          restituer_avant: restituerAvant || null,
        })
        .select()
        .single();
      if (error || !created) {
        toast.error(error?.message || "Erreur enregistrement.");
        return;
      }
      if (file) {
        const path = await uploadFile(created.id);
        if (path) {
          const { error: fichierError } = await supabase
            .from("dossier_contrats")
            .update({ fichier_path: path })
            .eq("id", created.id);
          if (fichierError) toast.error(`Fichier : ${fichierError.message}`);
        }
      }
      toast.success("Contrat ajouté.");
      reset();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce contrat ?")) return;
    const { error } = await supabase.from("dossier_contrats").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setContrats((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>Contrats annexes</p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>
            Location, leasing, dépôt, CG — à demander au gérant
          </p>
        </div>
        {!adding && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>+ Ajouter</Button>
        )}
      </div>

      {adding && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", gap: 12, marginBottom: 12 }}>
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={TYPES} />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex. véhicule Renault Master en leasing" />
            <Input label="Restituer avant" type="date" value={restituerAvant} onChange={(e) => setRestituerAvant(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <Button variant="secondary" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
              {file ? "Changer le fichier" : "Joindre un fichier"}
            </Button>
            {file && <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{file.name}</span>}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={reset}>Annuler</Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--ink-2)" }}>Chargement…</div>
      ) : contrats.length === 0 ? (
        <EmptyState
          title="Aucun contrat enregistré"
          description="Ajoutez les contrats de location, leasing, dépôt ou conditions générales attachés à ce dossier."
          action={!adding ? <Button variant="primary" size="md" onClick={() => setAdding(true)}>+ Ajouter un contrat</Button> : undefined}
        />
      ) : (
        <div>
          <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "140px 1fr 140px 100px 80px", gap: 12 }}>
            {["Type", "Description", "Restitution", "Fichier", ""].map((h, i) => (
              <p key={i} style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-2)" }}>{h}</p>
            ))}
          </div>
          {contrats.map((c, i) => (
            <div key={c.id} style={{ padding: "12px 20px", borderBottom: i < contrats.length - 1 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "140px 1fr 140px 100px 80px", gap: 12, alignItems: "center" }}>
              <Badge variant="neutral" size="sm">{TYPE_LABELS[c.type] || c.type}</Badge>
              <span style={{ fontSize: "var(--text-base)", color: "var(--ink)" }}>{c.description || "—"}</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
                {c.restituer_avant ? new Date(c.restituer_avant).toLocaleDateString("fr-FR") : "—"}
              </span>
              {c.fichier_href ? (
                <a href={c.fichier_href} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-sm)", color: "var(--accent-dark)" }}>
                  Ouvrir
                </a>
              ) : (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>—</span>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                Supprimer
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
