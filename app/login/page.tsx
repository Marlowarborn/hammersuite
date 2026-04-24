"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Waves from "@/components/marketing/Waves";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
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

        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Sign in</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Welcome back. Enter your credentials to continue.</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input
              type="email"
              placeholder="you@maisonduventes.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
            />
          </div>
          <button type="submit" style={{ width: "100%", padding: "12px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Sign in →
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          Any email and password works for the demo.
        </p>

        <Link href="/" style={{ display: "block", textAlign: "center", marginTop: 12, fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
          ← Back to homepage
        </Link>
      </div>
    </div>
  );
}
