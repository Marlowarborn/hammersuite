"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button, EmptyState, Input, useToast } from "@/components/ui";

export type Lieu = {
  id: string;
  adresse: string;
  contact_nom: string | null;
  contact_telephone: string | null;
  notes: string | null;
  created_at: string;
};

type Props = {
  dossierId: string;
  organisationId: string;
};

export default function LieuxSection({ dossierId, organisationId }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [adresse, setAdresse] = useState("");
  const [contactNom, setContactNom] = useState("");
  const [contactTel, setContactTel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dossier_lieux")
      .select("*")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });
    setLieux((data || []) as Lieu[]);
    setLoading(false);
  };

  const reset = () => {
    setAdresse("");
    setContactNom("");
    setContactTel("");
    setNotes("");
    setAdding(false);
  };

  const handleSave = async () => {
    if (!adresse.trim()) {
      toast.error("L'adresse est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const { data: created, error } = await supabase
        .from("dossier_lieux")
        .insert({
          dossier_id: dossierId,
          organisation_id: organisationId,
          adresse,
          contact_nom: contactNom || null,
          contact_telephone: contactTel || null,
          notes: notes || null,
        })
        .select()
        .single();
      if (error || !created) {
        toast.error(error?.message || "Erreur enregistrement.");
        return;
      }
      toast.success("Lieu de stockage ajouté.");
      reset();
      setLieux((prev) => [created as Lieu, ...prev]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lieu ?")) return;
    const { error } = await supabase.from("dossier_lieux").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLieux((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>Lieux de stockage</p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>
            Sites où sont entreposés les biens (siège, entrepôts, points de vente…)
          </p>
        </div>
        {!adding && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>+ Ajouter</Button>
        )}
      </div>

      {adding && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Adresse *" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="ex. 8 rue Sofia, 75018 PARIS" />
            </div>
            <Input label="Contact sur place" value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Nom" />
            <Input label="Téléphone" value={contactTel} onChange={(e) => setContactTel(e.target.value)} />
            <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Accès, horaires…" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={reset}>Annuler</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--ink-2)" }}>Chargement…</div>
      ) : lieux.length === 0 ? (
        <EmptyState
          title="Aucun lieu enregistré"
          description="Documentez les sites où sont stockés les biens : siège, entrepôts, dépôts, ateliers…"
          action={!adding ? <Button variant="primary" size="md" onClick={() => setAdding(true)}>+ Ajouter un lieu</Button> : undefined}
        />
      ) : (
        <div>
          {lieux.map((l, i) => (
            <div key={l.id} style={{ padding: "14px 20px", borderBottom: i < lieux.length - 1 ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>{l.adresse}</p>
                <div style={{ display: "flex", gap: 16, fontSize: "var(--text-sm)", color: "var(--ink-2)", flexWrap: "wrap" }}>
                  {l.contact_nom && <span>Contact : {l.contact_nom}</span>}
                  {l.contact_telephone && <span>Tél : {l.contact_telephone}</span>}
                </div>
                {l.notes && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>{l.notes}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)}>Supprimer</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
