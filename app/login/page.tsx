"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Waves from "@/components/marketing/Waves";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Waves />
      <div style={{ position: "relative", zIndex: 1, background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "40px", width: "100%", maxWidth: 400, boxShadow: "var(--shadow-lg)" }}>

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, background: "var(--black)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
              <path d="M17.64 15L22 10.64" />
              <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--black)" }}>Marto.io</span>
        </Link>

        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Connexion</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>
          Bienvenue. Connectez-vous à votre espace.
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input type="email" placeholder="vous@maisonduventes.fr"
              value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mot de passe</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>Oublié ?</Link>
            </div>
            <input type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(139,58,58,0.08)", border: "1px solid rgba(139,58,58,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--error)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Connexion..." : "Se connecter →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/signup" style={{ color: "var(--black)", fontWeight: 500, textDecoration: "none" }}>Créer votre espace</Link>
        </p>
      </div>
    </div>
  );
}
