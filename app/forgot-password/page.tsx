"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    });
    setLoading(false);
    if (resetError) {
      setError("Envoi impossible. Vérifiez l'adresse et réessayez.");
      return;
    }
    setSent(true);
  };

  const field: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    outline: "none",
    color: "var(--ink)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 40, width: "100%", maxWidth: 440, boxShadow: "var(--shadow-lg)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Mot de passe oublié</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>
          Indiquez votre adresse : vous recevrez un lien pour ouvrir votre espace et choisir un nouveau mot de passe.
        </p>

        {sent ? (
          <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 24 }}>
            Si un compte existe pour cette adresse, un lien vient d&apos;être envoyé. Pensez à vérifier vos courriers indésirables.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="forgot-email" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Email
            </label>
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@etude.fr" style={{ ...field, marginBottom: 16 }} />
            {error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(139,58,58,0.08)", border: "1px solid rgba(139,58,58,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--error)" }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 24 }}>
          <Link href="/login" style={{ color: "var(--ink)" }}>Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
