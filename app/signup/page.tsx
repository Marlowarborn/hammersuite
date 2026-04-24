"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Waves from "@/components/marketing/Waves";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"account" | "organisation">("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    organisation_name: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la creation du compte");

      const slug = form.organisation_name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").trim();
      const { data: orgData, error: orgError } = await supabase.from("organisations").insert({ name: form.organisation_name, slug }).select().single();
      if (orgError) throw orgError;

      const { error: profileError } = await supabase.from("profiles").update({ organisation_id: orgData.id, role: "admin", full_name: form.full_name }).eq("id", authData.user.id);
      if (profileError) throw profileError;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Waves />
      <div style={{ position: "relative", zIndex: 1, background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "40px", width: "100%", maxWidth: 440, boxShadow: "var(--shadow-lg)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, background: "var(--black)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" /><path d="M17.64 15L22 10.64" /><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--black)" }}>Marto.io</span>
        </Link>

        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Créer votre espace</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Configurez votre maison de vente en 2 minutes.</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[["account", "Votre compte"], ["organisation", "Votre maison"]].map(([s, label]) => (
            <div key={s} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 3, borderRadius: 99, background: s === "account" || step === "organisation" ? "var(--black)" : "var(--border)", marginBottom: 6 }} />
              <p style={{ fontSize: 11, color: step === s ? "var(--black)" : "var(--muted)", fontWeight: step === s ? 600 : 400 }}>{label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSignup}>
          {step === "account" && (
            <>
              {[
                { label: "Nom complet", key: "full_name", type: "text", placeholder: "Diane Aumont" },
                { label: "Email professionnel", key: "email", type: "email", placeholder: "d.aumont@maisonduventes.fr" },
                { label: "Mot de passe", key: "password", type: "password", placeholder: "••••••••" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(form as any)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
                </div>
              ))}
              <button type="button" onClick={() => setStep("organisation")} disabled={!form.email || !form.password || !form.full_name}
                style={{ width: "100%", padding: "12px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 8, opacity: (!form.email || !form.password || !form.full_name) ? 0.4 : 1 }}>
                Continuer →
              </button>
            </>
          )}

          {step === "organisation" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nom de votre maison de vente</label>
                <input type="text" placeholder="Maison Dupont et Associes" value={form.organisation_name} onChange={e => setForm({ ...form, organisation_name: e.target.value })} required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
                {form.organisation_name && (
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                    Votre URL : <strong>{form.organisation_name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}.marto.io</strong>
                  </p>
                )}
              </div>
              {error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(139,58,58,0.08)", border: "1px solid rgba(139,58,58,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--error)" }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={!form.organisation_name || loading}
                style={{ width: "100%", padding: "12px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: (!form.organisation_name || loading) ? 0.4 : 1 }}>
                {loading ? "Creation en cours..." : "Creer mon espace →"}
              </button>
              <button type="button" onClick={() => setStep("account")}
                style={{ width: "100%", padding: "10px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
                ← Retour
              </button>
            </>
          )}
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          Deja un compte ?{" "}
          <Link href="/login" style={{ color: "var(--black)", fontWeight: 500, textDecoration: "none" }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
