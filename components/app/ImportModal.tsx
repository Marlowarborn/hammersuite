"use client";

import { useState, useCallback } from "react";

type ExtractedObjet = {
  titre: string;
  artiste: string;
  description: string;
  technique: string;
  dimensions: string;
  epoque: string;
  provenance: string;
  consignateur: string;
  estimation_basse: number;
  estimation_haute: number;
  notes: string;
  selected: boolean;
};

type Props = {
  onClose: () => void;
  onImport: (objets: Omit<ExtractedObjet, "selected">[]) => void;
};

export default function ImportModal({ onClose, onImport }: Props) {
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objets, setObjets] = useState<ExtractedObjet[]>([]);
  const [fileName, setFileName] = useState("");

  const processFile = async (file: File) => {
    setFileName(file.name);
    setStep("processing");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'extraction");
        setStep("upload");
        return;
      }

      if (data.count === 0) {
        setError("Aucun objet trouvé dans ce document. Essayez avec un autre fichier.");
        setStep("upload");
        return;
      }

      setObjets(data.objets.map((o: any) => ({ ...o, selected: true })));
      setStep("review");
    } catch (err) {
      setError("Erreur de connexion. Réessayez.");
      setStep("upload");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const toggleAll = (val: boolean) => {
    setObjets(objets.map(o => ({ ...o, selected: val })));
  };

  const handleImport = () => {
    const selected = objets.filter(o => o.selected).map(({ selected, ...o }) => o);
    onImport(selected);
    onClose();
  };

  const selectedCount = objets.filter(o => o.selected).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, padding: "40px 24px", overflowY: "auto" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", padding: 32, width: "100%", maxWidth: step === "review" ? 800 : 560, boxShadow: "var(--shadow-lg)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>
              Import par document
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              {step === "upload" && "Déposez n'importe quel document — l'IA extrait automatiquement les objets."}
              {step === "processing" && `Analyse de ${fileName} en cours...`}
              {step === "review" && `${objets.length} objet${objets.length > 1 ? "s" : ""} détecté${objets.length > 1 ? "s" : ""} — vérifiez avant d'importer.`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20, marginLeft: 16 }}>×</button>
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              style={{
                border: `2px dashed ${dragOver ? "var(--black)" : "var(--border-dark)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "48px 32px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "var(--surface)" : "transparent",
                transition: "all var(--transition)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Déposez votre document ici</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>ou cliquez pour parcourir</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {["PDF", "JPG", "PNG"].map(fmt => (
                  <span key={fmt} style={{ padding: "3px 10px", background: "var(--cream)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{fmt}</span>
                ))}
              </div>
              <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} style={{ display: "none" }} />
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(139,58,58,0.08)", border: "1px solid rgba(139,58,58,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--error)" }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Documents acceptés</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  "📋 Liste de consignation (PDF ou photo)",
                  "⚖️ Saisie judiciaire (PDF tribunal)",
                  "📸 Photo d'une liste manuscrite",
                  "📊 Export E-Auction ou Excel",
                  "✉️ Email de consignateur (copié en PDF)",
                ].map(item => (
                  <p key={item} style={{ fontSize: 12, color: "var(--muted)" }}>{item}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Analyse en cours...</p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>L&apos;IA lit votre document et extrait les objets</p>
            <div style={{ maxWidth: 300, margin: "0 auto", height: 4, background: "var(--cream)", borderRadius: 99, overflow: "hidden" }}>
              <div className="shimmer" style={{ height: "100%", width: "60%", borderRadius: 99 }} />
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleAll(true)} style={{ padding: "5px 12px", fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer", background: "var(--surface)" }}>
                  Tout sélectionner
                </button>
                <button onClick={() => toggleAll(false)} style={{ padding: "5px 12px", fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer", background: "var(--surface)" }}>
                  Tout désélectionner
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{selectedCount} objet{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}</p>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 20, maxHeight: 400, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 140px 160px 80px", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                {["", "Titre / Artiste", "Technique", "Estimation", ""].map((h, i) => (
                  <p key={i} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>{h}</p>
                ))}
              </div>

              {objets.map((objet, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "32px 1fr 140px 160px 80px",
                  gap: 12, padding: "12px 16px",
                  borderBottom: i < objets.length - 1 ? "1px solid var(--border)" : "none",
                  background: objet.selected ? "transparent" : "rgba(0,0,0,0.02)",
                  opacity: objet.selected ? 1 : 0.4,
                  alignItems: "center",
                }}>
                  <input type="checkbox" checked={objet.selected}
                    onChange={e => setObjets(objets.map((o, j) => j === i ? { ...o, selected: e.target.checked } : o))}
                    style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <div>
                    <input value={objet.titre}
                      onChange={e => setObjets(objets.map((o, j) => j === i ? { ...o, titre: e.target.value } : o))}
                      style={{ width: "100%", fontSize: 13, fontWeight: 500, border: "none", outline: "none", background: "transparent", color: "var(--black)", fontFamily: "var(--font-sans)", marginBottom: 2 }} />
                    {objet.artiste && (
                      <input value={objet.artiste}
                        onChange={e => setObjets(objets.map((o, j) => j === i ? { ...o, artiste: e.target.value } : o))}
                        style={{ width: "100%", fontSize: 11, border: "none", outline: "none", background: "transparent", color: "var(--muted)", fontFamily: "var(--font-sans)", fontStyle: "italic" }} />
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.technique || "—"}</p>
                  <p style={{ fontSize: 12, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>
                    {objet.estimation_basse > 0 ? `${objet.estimation_basse.toLocaleString()} – ${objet.estimation_haute.toLocaleString()} €` : "—"}
                  </p>
                  <button onClick={() => setObjets(objets.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => { setStep("upload"); setObjets([]); setError(null); }}
                style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>
                ← Nouveau document
              </button>
              <button onClick={handleImport} disabled={selectedCount === 0}
                style={{ padding: "9px 24px", background: selectedCount === 0 ? "var(--cream)" : "var(--black)", color: selectedCount === 0 ? "var(--muted)" : "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: selectedCount === 0 ? "not-allowed" : "pointer" }}>
                Importer {selectedCount} objet{selectedCount > 1 ? "s" : ""} dans le répertoire
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
