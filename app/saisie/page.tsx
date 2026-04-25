"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

type Step = "photo" | "analyzing" | "form" | "saving" | "done";
type TypeEntree = "volontaire" | "judiciaire" | "depot";

export default function SaisiePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("photo");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    titre: "",
    technique: "",
    epoque: "",
    description: "",
    consignateur: "",
    estimation_basse: "",
    estimation_haute: "",
    type_entree: "volontaire" as TypeEntree,
    notes: "",
  });
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("medium");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setStep("analyzing");
    setError("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Analyse impossible. Remplissez manuellement.");
        setStep("form");
        return;
      }

      setForm(f => ({
        ...f,
        titre: data.titre || "",
        technique: data.technique || "",
        epoque: data.epoque || "",
        description: data.description || "",
      }));
      setConfidence(data.confidence || "medium");
      setStep("form");
    } catch {
      setError("Erreur d'analyse. Remplissez manuellement.");
      setStep("form");
    }
  };

  const handleSave = async () => {
    if (!form.titre) return;
    setStep("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
    if (!profile?.organisation_id) { setError("Organisation introuvable"); setStep("form"); return; }

    const { data: existing } = await supabase.from("objets").select("numero_repertoire").eq("organisation_id", profile.organisation_id).order("created_at", { ascending: false }).limit(1).single();

    const year = new Date().getFullYear();
    const lastNum = existing?.numero_repertoire ? parseInt(existing.numero_repertoire.split("-")[1]) || 0 : 0;
    const numero = `${year}-${String(lastNum + 1).padStart(3, "0")}`;

    const { error: insertError } = await supabase.from("objets").insert({
      organisation_id: profile.organisation_id,
      numero_repertoire: numero,
      date_entree: new Date().toISOString().split("T")[0],
      type_entree: form.type_entree,
      titre: form.titre,
      technique: form.technique,
      epoque: form.epoque,
      description: form.description,
      consignateur: form.consignateur,
      estimation_basse: parseInt(form.estimation_basse) || 0,
      estimation_haute: parseInt(form.estimation_haute) || 0,
      status: "en_attente",
      notes: form.notes,
    });

    if (insertError) {
      setError("Erreur d'enregistrement: " + insertError.message);
      setStep("form");
      return;
    }

    setStep("done");
  };

  const confidenceColors = {
    high: { bg: "rgba(61,122,94,0.1)", color: "#3d7a5e", label: "Identification fiable" },
    medium: { bg: "rgba(154,111,46,0.1)", color: "#9a6f2e", label: "Identification probable" },
    low: { bg: "rgba(139,58,58,0.1)", color: "#8b3a3a", label: "Vérifiez les informations" },
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--surface)",
      fontFamily: "var(--font-sans)",
      maxWidth: 480,
      margin: "0 auto",
      padding: "0 0 80px",
    }}>
      {/* Header */}
      <div style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← Retour</Link>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600 }}>Saisie rapide</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Step: Photo */}
      {step === "photo" && (
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Photographiez l&apos;objet</p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>Prenez une photo claire — l&apos;IA identifie automatiquement l&apos;objet et pré-remplit la fiche.</p>
          </div>

          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={handlePhoto} style={{ display: "none" }} />

          <button onClick={() => fileRef.current?.click()} style={{
            width: "100%", aspectRatio: "4/3",
            background: "var(--white)",
            border: "2px dashed var(--border-dark)",
            borderRadius: "var(--radius-lg)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, cursor: "pointer",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 48 }}>📷</span>
            <p style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>Prendre une photo</p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>ou choisir depuis la galerie</p>
          </button>

          <button onClick={() => setStep("form")} style={{
            width: "100%", padding: "14px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 14, color: "var(--muted)",
            cursor: "pointer",
          }}>
            Saisir manuellement sans photo
          </button>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === "analyzing" && (
        <div style={{ padding: 20 }}>
          {photoUrl && (
            <img src={photoUrl} alt="Photo" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: 24 }} />
          )}
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Analyse en cours...</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>L&apos;IA identifie l&apos;objet</p>
            <div style={{ width: "60%", height: 4, background: "var(--cream)", borderRadius: 99, margin: "0 auto", overflow: "hidden" }}>
              <div className="shimmer" style={{ height: "100%", width: "70%", borderRadius: 99 }} />
            </div>
          </div>
        </div>
      )}

      {/* Step: Form */}
      {step === "form" && (
        <div style={{ padding: 20 }}>
          {photoUrl && (
            <div style={{ position: "relative", marginBottom: 20 }}>
              <img src={photoUrl} alt="Photo" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: "var(--radius-lg)" }} />
              <button onClick={() => { setPhotoUrl(null); setStep("photo"); }}
                style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "white", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          )}

          {confidence && photoUrl && (
            <div style={{ marginBottom: 20, padding: "10px 14px", background: confidenceColors[confidence].bg, borderRadius: "var(--radius)", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{confidence === "high" ? "✓" : confidence === "medium" ? "~" : "!"}</span>
              <p style={{ fontSize: 13, fontWeight: 500, color: confidenceColors[confidence].color }}>{confidenceColors[confidence].label} — vérifiez et complétez</p>
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(139,58,58,0.08)", border: "1px solid rgba(139,58,58,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--error)" }}>
              {error}
            </div>
          )}

          {/* Type entree */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Type d&apos;entrée</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["volontaire", "judiciaire", "depot"] as TypeEntree[]).map(t => (
                <button key={t} onClick={() => setForm({ ...form, type_entree: t })}
                  style={{ flex: 1, padding: "10px 4px", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1.5px solid", borderColor: form.type_entree === t ? "var(--black)" : "var(--border)", background: form.type_entree === t ? "var(--black)" : "transparent", color: form.type_entree === t ? "white" : "var(--muted)" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "Titre / désignation *", key: "titre", placeholder: "ex. Tableau huile sur toile" },
            { label: "Technique / matière", key: "technique", placeholder: "ex. Huile sur toile" },
            { label: "Époque / période", key: "epoque", placeholder: "ex. XIXe siècle" },
            { label: "Consignateur", key: "consignateur", placeholder: "ex. Mme. Dupont" },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
              <input type="text" placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 15, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)" }} />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Estimation basse (€)", key: "estimation_basse" },
              { label: "Estimation haute (€)", key: "estimation_haute" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
                <input type="number" placeholder="0"
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 15, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)" }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
            <textarea placeholder="Description de l'objet..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 15, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", background: "var(--white)", resize: "vertical", minHeight: 80 }} />
          </div>

          <button onClick={handleSave} disabled={!form.titre}
            style={{ width: "100%", padding: "16px", background: form.titre ? "var(--black)" : "var(--cream)", color: form.titre ? "white" : "var(--muted)", border: "none", borderRadius: "var(--radius)", fontSize: 16, fontWeight: 600, cursor: form.titre ? "pointer" : "not-allowed" }}>
            Enregistrer dans le répertoire
          </button>
        </div>
      )}

      {/* Step: Saving */}
      {step === "saving" && (
        <div style={{ padding: 20, textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Enregistrement...</p>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>Ajout au répertoire en cours</p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div style={{ padding: 20, textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✓</div>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Enregistré !</p>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 40, lineHeight: 1.6 }}>
            L&apos;objet a été ajouté au répertoire avec succès.
          </p>
          <button onClick={() => { setStep("photo"); setPhotoUrl(null); setPhotoFile(null); setForm({ titre: "", technique: "", epoque: "", description: "", consignateur: "", estimation_basse: "", estimation_haute: "", type_entree: "volontaire", notes: "" }); }}
            style={{ width: "100%", padding: "16px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
            Saisir un autre objet
          </button>
          <Link href="/dashboard/lots" style={{ display: "block", width: "100%", padding: "16px", background: "var(--white)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 16, fontWeight: 500, textDecoration: "none", textAlign: "center" }}>
            Voir le répertoire
          </Link>
        </div>
      )}
    </div>
  );
}
// saisie
