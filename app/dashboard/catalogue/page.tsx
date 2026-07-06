"use client";
import { useState } from "react";
import { MOCK_SALES, MOCK_LOTS } from "@/data/mock";

const STEPS = ["Vente", "Modèle", "Mappage", "Images", "Traitement", "Génération", "Aperçu", "Export"];

export default function CataloguePage() {
  const [step, setStep] = useState(0);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [templateUploaded, setTemplateUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [done, setDone] = useState(false);

  const startProcessing = () => {
    setProcessing(true);
    setProcessProgress(0);
    const timer = setInterval(() => {
      setProcessProgress(p => {
        if (p >= 100) { clearInterval(timer); setProcessing(false); return 100; }
        return Math.min(p + Math.random() * 8 + 2, 100);
      });
    }, 200);
  };

  const startGenerating = () => {
    setGenerating(true);
    setGenerateProgress(0);
    const timer = setInterval(() => {
      setGenerateProgress(p => {
        if (p >= 100) { clearInterval(timer); setGenerating(false); setDone(true); return 100; }
        return Math.min(p + Math.random() * 5 + 2, 100);
      });
    }, 200);
  };

  const canContinue = () => {
    if (step === 0) return selectedSale !== null;
    if (step === 4) return processProgress >= 100;
    if (step === 5) return done;
    return true;
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>Générateur de catalogue</h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Générez un catalogue prêt pour l’impression à partir du modèle de votre maison.</p>
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <button onClick={() => i <= step && setStep(i)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: i <= step ? "pointer" : "default", padding: "4px 0", flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: i < step ? "var(--accent)" : i === step ? "var(--black)" : "var(--cream)", transition: "all 200ms" }}>
                  {i < step ? <span style={{ color: "white", fontSize: 11 }}>✓</span> : <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? "white" : "var(--muted)" }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? "var(--black)" : i < step ? "var(--accent)" : "var(--muted)", whiteSpace: "nowrap" }}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? "var(--accent)" : "var(--border)", margin: "0 8px" }} />}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
        {step === 0 && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Sélectionner une vente</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Choisissez la vente pour laquelle vous souhaitez générer un catalogue.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MOCK_SALES.filter(s => s.status !== "completed").map(sale => (
                <div key={sale.id} onClick={() => setSelectedSale(sale.id)} style={{ padding: "16px 20px", borderRadius: "var(--radius)", border: selectedSale === sale.id ? "1.5px solid var(--black)" : "1.5px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, background: selectedSale === sale.id ? "var(--surface)" : "transparent" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: selectedSale === sale.id ? "var(--black)" : "var(--border)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)" }}>{sale.name}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{sale.lots} lots · {sale.location}</p>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(sale.date).toLocaleDateString("fr-FR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Importer votre modèle</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Marto.io utilise le modèle existant de votre maison et y injecte directement le contenu des lots. Votre marque, votre mise en page.</p>
            {!templateUploaded ? (
              <div onClick={() => setTemplateUploaded(true)} style={{ border: "2px dashed var(--border-dark)", borderRadius: "var(--radius-lg)", padding: 48, textAlign: "center", cursor: "pointer" }}>
                <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Déposez votre modèle ici</p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>ou cliquez pour parcourir vos fichiers PDF, XML, DOCX</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ width: 36, height: 36, background: "var(--accent-light)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "var(--accent)", fontSize: 16 }}>📄</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>catalogue-template-durand.pdf</p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>842 Ko · Importé</p>
                </div>
                <span style={{ marginLeft: "auto", color: "var(--success)" }}>✓</span>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Mapper les balises</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Associez chaque balise de votre modèle à un champ Marto.io.</p>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {["Balise du modèle", "Champ Marto.io"].map(h => (
                  <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>{h}</p>
                ))}
              </div>
              {[["lot_number", "lot_number"], ["title", "title"], ["description", "description"], ["estimate_low", "estimate_low"], ["estimate_high", "estimate_high"], ["image_1", "image_1"]].map(([ph, field], i) => (
                <div key={ph} style={{ padding: "12px 20px", borderBottom: i < 5 ? "1px solid var(--border)" : "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
                  <code style={{ fontSize: 13, background: "var(--cream)", padding: "4px 10px", borderRadius: "var(--radius)", color: "var(--ink)" }}>{`{{${ph}}}`}</code>
                  <select defaultValue={field} style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--ink)", background: "var(--white)", outline: "none" }}>
                    {["lot_number", "title", "description", "estimate_low", "estimate_high", "image_1"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Vérifier les images</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Vérifiez les images associées à chaque lot avant le traitement.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {MOCK_LOTS.slice(0, 8).map((lot, i) => (
                <div key={lot.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  <div style={{ aspectRatio: "1", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 24, opacity: 0.3 }}>🖼</span>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)" }}>Lot {lot.number}</p>
                    <p style={{ fontSize: 11, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lot.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Traitement des images</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Détourage de l’arrière-plan, centrage du sujet et normalisation des marges.</p>
            {processProgress === 0 && !processing && (
              <button onClick={startProcessing} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "11px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500 }}>
                Démarrer le traitement
              </button>
            )}
            {(processing || processProgress > 0) && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{processing ? "Traitement des images..." : "Terminé"}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{Math.min(Math.round(processProgress), 100)}%</span>
                </div>
                <div style={{ height: 6, background: "var(--cream)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: processProgress >= 100 ? "var(--success)" : "var(--black)", borderRadius: 99, width: `${Math.min(processProgress, 100)}%`, transition: "width 200ms ease" }} />
                </div>
                {processProgress >= 100 && (
                  <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(61,122,94,0.08)", border: "1px solid rgba(61,122,94,0.2)", borderRadius: "var(--radius)" }}>
                    <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>8 images traitées avec succès.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {step === 5 && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Générer le catalogue</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Injectez toutes les données et images des lots dans votre modèle.</p>
            {!generating && !done && (
              <button onClick={startGenerating} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--black)", color: "white", border: "none", cursor: "pointer", padding: "11px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500 }}>
                Générer le catalogue
              </button>
            )}
            {generating && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Génération...</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{Math.min(Math.round(generateProgress), 100)}%</span>
                </div>
                <div style={{ height: 6, background: "var(--cream)", borderRadius: 99 }}>
                  <div style={{ height: "100%", background: "var(--black)", borderRadius: 99, width: `${Math.min(generateProgress, 100)}%`, transition: "width 200ms ease" }} />
                </div>
              </div>
            )}
            {done && (
              <div style={{ padding: "20px", background: "rgba(61,122,94,0.06)", border: "1px solid rgba(61,122,94,0.2)", borderRadius: "var(--radius)", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "var(--success)", fontSize: 20 }}>✓</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--success)" }}>Catalogue généré</p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>84 lots · 47 pages · Prêt à prévisualiser</p>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 6 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Aperçu du catalogue</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Vérifiez votre catalogue avant de l’exporter.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {["Couverture", "Sommaire", "Lot 001 à 010", "Lot 011 à 020", "Lot 021 à 030", "Pages de fin"].map((page, i) => (
                <div key={page} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  <div style={{ aspectRatio: "3/4", background: i === 0 ? "var(--charcoal)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                    {i === 0 ? (
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "white", fontWeight: 500 }}>Art moderne</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.1em" }}>MAISON DURAND</p>
                      </div>
                    ) : (
                      [...Array(4)].map((_, j) => <div key={j} style={{ width: "70%", height: 6, background: "var(--border)", borderRadius: 4 }} />)
                    )}
                  </div>
                  <div style={{ padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{page}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 7 && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Export</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Votre catalogue est prêt.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[{ label: "PDF prêt pour l’impression", sub: "Haute résolution · CMJN · Traits de coupe · 47 pages", tag: "Recommandé" }, { label: "PDF web", sub: "Optimisé pour la diffusion numérique · RVB · 8,4 Mo", tag: null }, { label: "Paquet InDesign", sub: "Liens, polices et ressources · Pour édition ultérieure", tag: null }].map(exp => (
                <div key={exp.label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{exp.label}</p>
                      {exp.tag && <span style={{ fontSize: 10, fontWeight: 600, background: "var(--accent-light)", color: "var(--accent)", padding: "2px 8px", borderRadius: 99 }}>{exp.tag}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{exp.sub}</p>
                  </div>
                  <button style={{ padding: "8px 16px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Télécharger</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: "9px 20px", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: step === 0 ? "not-allowed" : "pointer", color: step === 0 ? "var(--muted)" : "var(--ink)" }}>Retour</button>
          {step < STEPS.length - 1 && (
            <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()} style={{ padding: "9px 24px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: canContinue() ? "pointer" : "not-allowed", opacity: canContinue() ? 1 : 0.4 }}>Continuer →</button>
          )}
        </div>
      </div>
    </div>
  );
}
