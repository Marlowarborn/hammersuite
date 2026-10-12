"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Counts = {
  dossiersEnCours: number;
  objetsEnAttente: number;
  ventesAVenir: number;
  courriers: number;
};

type Welcome = { prenom: string; etude: string };

/**
 * Tableau de bord : compteurs réels de l'étude connectée.
 * Les compteurs sont des `count` côté Supabase, filtrés par organisation.
 */
export default function DashboardPage() {
  const supabase = createClient();
  const [welcome, setWelcome] = useState<Welcome>({ prenom: "", etude: "" });
  const [counts, setCounts] = useState<Counts | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, organisation_id")
        .eq("id", user.id)
        .single();
      if (!profile?.organisation_id) {
        if (!cancelled) setErreur("Votre compte n'est rattaché à aucune étude.");
        return;
      }
      const orgId = profile.organisation_id;

      const { data: org } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", orgId)
        .single();

      const [dossiersEnCours, objetsEnAttente, ventesAVenir, courriers] = await Promise.all([
        supabase.from("dossiers").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).eq("statut", "en_cours").then((r) => r.count ?? 0),
        supabase.from("objets").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).eq("status", "en_attente").then((r) => r.count ?? 0),
        supabase.from("ventes").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).in("status", ["upcoming", "active"]).then((r) => r.count ?? 0),
        supabase.from("courriers").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).then((r) => r.count ?? 0),
      ]);
      if (cancelled) return;
      setWelcome({
        prenom: (profile.full_name || user.email || "").split(" ")[0],
        etude: org?.name || "",
      });
      setCounts({ dossiersEnCours, objetsEnAttente, ventesAVenir, courriers });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiles = [
    { label: "Dossiers en cours", value: counts?.dossiersEnCours, href: "/dashboard/dossiers" },
    { label: "Objets en attente", value: counts?.objetsEnAttente, href: "/dashboard/lots" },
    { label: "Ventes à venir", value: counts?.ventesAVenir, href: "/dashboard/sales" },
    { label: "Courriers générés", value: counts?.courriers, href: "/dashboard/dossiers" },
  ];

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
          {welcome.prenom ? `Bonjour ${welcome.prenom}.` : "Bonjour."}
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          {welcome.etude ? `Voici l'activité de ${welcome.etude}.` : "Voici l'activité de votre étude."}
        </p>
      </div>

      {erreur && (
        <div style={{ marginBottom: 24, padding: "10px 14px", background: "rgba(139,58,58,0.08)", border: "1px solid rgba(139,58,58,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--error)" }}>
          {erreur}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} style={{ textDecoration: "none", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 16 }}>{t.label}</p>
            <p className="serif" style={{ fontSize: 36, fontWeight: 500, color: "var(--black)" }}>{t.value ?? "…"}</p>
          </Link>
        ))}
      </div>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", maxWidth: 720 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 12 }}>Par où commencer</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--ink)", lineHeight: 1.9 }}>
          <li><Link href="/dashboard/dossiers" style={{ color: "var(--ink)" }}>Ouvrir un dossier judiciaire</Link> et suivre ses phases.</li>
          <li><Link href="/saisie" style={{ color: "var(--ink)" }}>Saisir des objets par photo</Link> depuis un téléphone.</li>
          <li><Link href="/dashboard/lots" style={{ color: "var(--ink)" }}>Importer un inventaire</Link> depuis un PDF ou une image.</li>
          <li><Link href="/dashboard/settings" style={{ color: "var(--ink)" }}>Compléter l&apos;étude</Link> (coordonnées, SIRET, IBAN) pour les courriers.</li>
        </ul>
      </div>
    </div>
  );
}
