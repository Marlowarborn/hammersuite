"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Topbar() {
  const router = useRouter();
  const supabase = createClient();
  const [orgName, setOrgName] = useState("Chargement...");
  const [userName, setUserName] = useState("");
  const [initials, setInitials] = useState("--");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, organisation_id, organisations(name)")
      .eq("id", user.id)
      .single();

    if (profile) {
      const name = profile.full_name || user.email || "";
      setUserName(name);
      setInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
      const org = profile.organisations as any;
      if (org?.name) setOrgName(org.name);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header style={{ height: 56, background: "var(--white)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", marginRight: 8 }}>
        <span style={{ fontWeight: 600, color: "var(--black)" }}>{orgName}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input placeholder="Rechercher lots, ventes, clients…"
          style={{ width: "100%", padding: "7px 12px 7px 32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink)", fontFamily: "var(--font-sans)", outline: "none" }} />
      </div>

      <div style={{ flex: 1 }} />

      <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 8, borderRadius: "var(--radius)", position: "relative" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <div style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "var(--accent)", borderRadius: "50%", border: "2px solid white" }} />
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", cursor: "pointer" }}>
          <div style={{ width: 24, height: 24, background: "var(--charcoal)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "white" }}>{initials}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{userName.split(" ")[0]}</span>
        </button>

        {showMenu && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", minWidth: 180, zIndex: 100, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--black)" }}>{userName}</p>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{orgName}</p>
            </div>
            <button onClick={handleLogout}
              style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--error)", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
