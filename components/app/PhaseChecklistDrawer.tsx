"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button, Badge, useToast } from "@/components/ui";
import type { ChecklistKind, PhaseDef } from "@/lib/checklists";
import { seedChecklist } from "@/lib/checklists";
import { signedUrls } from "@/lib/storage";

export type ChecklistItem = {
  id: string;
  phase: string;
  label: string;
  ordre: number;
  is_done: boolean;
  completed_at: string | null;
  completed_by: string | null;
  // Ancien enregistrement : URL signée 1 an, qui expire.
  doc_url: string | null;
  // Chemin du justificatif dans le bucket privé dossier-docs.
  doc_path: string | null;
  notes: string | null;
};

type Props = {
  kind: ChecklistKind;
  phase: PhaseDef;
  organisationId: string;
  dossierId?: string;
  venteId?: string;
  items: ChecklistItem[];
  onClose: () => void;
  onChange: () => void;
};

export default function PhaseChecklistDrawer({
  kind,
  phase,
  organisationId,
  dossierId,
  venteId,
  items,
  onClose,
  onChange,
}: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Liens signés des justificatifs, par id d'item (1 h).
  const [docHrefs, setDocHrefs] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Les items arrivent en props avec leur doc_path : on signe tous les chemins en un appel
  // à chaque nouvelle liste (ouverture du tiroir, rafraîchissement après upload).
  useEffect(() => {
    let annule = false;
    const avecDoc = items.filter((i) => i.doc_path);
    signedUrls(createClient(), "dossier-docs", avecDoc.map((i) => i.doc_path)).then((urls) => {
      if (annule) return;
      const parId: Record<string, string> = {};
      for (const i of avecDoc) {
        const url = i.doc_path ? urls[i.doc_path] : undefined;
        if (url) parId[i.id] = url;
      }
      setDocHrefs(parId);
    });
    return () => {
      annule = true;
    };
  }, [items]);

  // Lien à afficher : chemin signé, sinon ancienne URL.
  const docHref = (item: ChecklistItem): string | null => docHrefs[item.id] || item.doc_url;
  const aUnDoc = (item: ChecklistItem): boolean => Boolean(item.doc_path || item.doc_url);

  const phaseItems = items.filter((i) => i.phase === phase.id).sort((a, b) => a.ordre - b.ordre);
  const total = phaseItems.length;
  const done = phaseItems.filter((i) => i.is_done).length;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const toggleItem = async (item: ChecklistItem) => {
    const next = !item.is_done;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("checklist_items")
      .update({
        is_done: next,
        completed_at: next ? new Date().toISOString() : null,
        completed_by: next ? user?.id || null : null,
      })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange();
  };

  const saveNotes = async (item: ChecklistItem, notes: string) => {
    const { error } = await supabase.from("checklist_items").update({ notes }).eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange();
  };

  const uploadDoc = async (item: ChecklistItem, file: File) => {
    const scope = dossierId ? `dossiers/${dossierId}` : `ventes/${venteId}`;
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${organisationId}/${scope}/checklists/${item.id}.${ext}`;
    const { error } = await supabase.storage.from("dossier-docs").upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    // Bucket privé : on enregistre le chemin, signé à l'affichage.
    const { error: updateError } = await supabase.from("checklist_items").update({ doc_path: path }).eq("id", item.id);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success("Document joint.");
    onChange();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,15,14,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 999,
        }}
      />
      <aside
        role="dialog"
        aria-label={`Checklist ${phase.label}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(480px, 100%)",
          background: "var(--white)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 4 }}>Checklist</p>
            <h3 className="serif" style={{ fontSize: "var(--text-xl)", fontWeight: 500, color: "var(--ink)" }}>{phase.label}</h3>
            <p style={{ marginTop: 6, fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
              {done}/{total} item{total > 1 ? "s" : ""} complétés
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: 20, padding: 4 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {phaseItems.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--ink-2)", fontSize: "var(--text-md)" }}>
              Aucun item dans cette phase.
            </div>
          ) : (
            phaseItems.map((item) => {
              const expanded = expandedId === item.id;
              const href = docHref(item);
              return (
                <div key={item.id} style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <button
                      onClick={() => toggleItem(item)}
                      aria-label={item.is_done ? "Marquer non fait" : "Marquer fait"}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `1.5px solid ${item.is_done ? "var(--status-success)" : "var(--border-strong)"}`,
                        background: item.is_done ? "var(--status-success)" : "var(--white)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                        padding: 0,
                      }}
                    >
                      {item.is_done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "var(--text-md)",
                          color: item.is_done ? "var(--ink-2)" : "var(--ink)",
                          textDecoration: item.is_done ? "line-through" : "none",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.label}
                      </p>
                      <div style={{ marginTop: 4, display: "flex", gap: 12, alignItems: "center", fontSize: "var(--text-xs)", color: "var(--ink-3)", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                          style={{ background: "none", border: "none", padding: 0, fontSize: "var(--text-xs)", color: "var(--ink-2)", cursor: "pointer", textDecoration: "underline" }}
                        >
                          {expanded ? "Replier" : "Détails"}
                        </button>
                        {item.notes && <Badge variant="neutral" size="sm">Note</Badge>}
                        {href && (
                          <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-xs)", color: "var(--accent-dark)" }}>
                            📎 Document
                          </a>
                        )}
                        {item.completed_at && (
                          <span>Fait le {new Date(item.completed_at).toLocaleDateString("fr-FR")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {expanded && (
                    <div style={{ marginTop: 12, paddingLeft: 30, display: "flex", flexDirection: "column", gap: 10 }}>
                      <NoteEditor initial={item.notes || ""} onSave={(v) => saveNotes(item, v)} />
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          ref={(el) => {
                            fileRefs.current[item.id] = el;
                          }}
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadDoc(item, file);
                          }}
                          style={{ display: "none" }}
                        />
                        <Button variant="secondary" size="sm" type="button" onClick={() => fileRefs.current[item.id]?.click()}>
                          {aUnDoc(item) ? "Remplacer le document" : "Joindre un document"}
                        </Button>
                        {href && (
                          <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-sm)", color: "var(--accent-dark)" }}>
                            Voir le document
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
            Modèle {kind === "judiciaire" ? "judiciaire" : "vente volontaire"}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
        </div>
      </aside>
    </>
  );
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(e.target.value !== initial);
        }}
        placeholder="Notes (optionnel)…"
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
          minHeight: 60,
          background: "var(--white)",
        }}
      />
      {dirty && (
        <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onSave(value);
              setDirty(false);
            }}
          >
            Enregistrer la note
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper réutilisable — crée les checklist_items à partir des templates si elles manquent.
// Utilisé pour seeder à la création d'un dossier/vente ou en lazy quand on ouvre le drawer
// sur un dossier legacy sans checklist.
export async function ensureChecklist(
  organisationId: string,
  kind: ChecklistKind,
  target: { dossierId: string } | { venteId: string },
): Promise<void> {
  const supabase = createClient();
  const isDossier = "dossierId" in target;
  const filterCol = isDossier ? "dossier_id" : "vente_id";
  const filterValue = isDossier ? target.dossierId : target.venteId;
  const { data: existing } = await supabase
    .from("checklist_items")
    .select("id")
    .eq(filterCol, filterValue)
    .limit(1);
  if (existing && existing.length > 0) return;
  if (isDossier) {
    await seedChecklist(supabase, organisationId, { kind, dossierId: target.dossierId });
  } else {
    await seedChecklist(supabase, organisationId, { kind, venteId: target.venteId });
  }
}
