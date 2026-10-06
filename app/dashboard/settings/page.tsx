"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Badge, Button, Input, Tabs, useToast } from "@/components/ui";

type Organisation = {
  id: string;
  name: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  siret: string | null;
  iban: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  qualite: string | null;
  role: string | null;
  organisation_id: string | null;
};

type SettingsTab = "organisation" | "membres" | "profil";

const ORG_FIELDS: { key: keyof Organisation; label: string; span?: boolean }[] = [
  { key: "name", label: "Nom de l'étude", span: true },
  { key: "adresse", label: "Adresse", span: true },
  { key: "code_postal", label: "Code postal" },
  { key: "ville", label: "Ville" },
  { key: "telephone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "siret", label: "SIRET" },
  { key: "iban", label: "IBAN" },
];

const ROLE_BADGE: Record<string, { label: string; variant: "success" | "neutral" }> = {
  admin: { label: "Admin", variant: "success" },
  member: { label: "Membre", variant: "neutral" },
  user: { label: "Membre", variant: "neutral" },
};

function Panel({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{title}</p>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
      {footer && <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>{footer}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SettingsTab>("organisation");

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);

  const [savingOrg, setSavingOrg] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, email, qualite, role, organisation_id")
        .eq("id", user.id)
        .single();
      setProfile((prof as Profile) || null);

      const orgId = prof?.organisation_id;
      if (orgId) {
        const { data: orgData } = await supabase
          .from("organisations")
          .select("id, name, adresse, code_postal, ville, telephone, email, siret, iban")
          .eq("id", orgId)
          .single();
        setOrg((orgData as Organisation) || null);

        const { data: memberData } = await supabase
          .from("profiles")
          .select("id, full_name, email, qualite, role, organisation_id")
          .eq("organisation_id", orgId)
          .order("full_name", { ascending: true });
        setMembers((memberData as Profile[]) || []);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setOrgField = (key: keyof Organisation, value: string) =>
    setOrg((prev) => (prev ? { ...prev, [key]: value } : prev));

  const saveOrg = async () => {
    if (!org) return;
    setSavingOrg(true);
    const { error } = await supabase
      .from("organisations")
      .update({
        name: org.name,
        adresse: org.adresse,
        code_postal: org.code_postal,
        ville: org.ville,
        telephone: org.telephone,
        email: org.email,
        siret: org.siret,
        iban: org.iban,
      })
      .eq("id", org.id);
    setSavingOrg(false);
    if (error) toast.error(`Enregistrement impossible : ${error.message}`);
    else toast.success("Organisation mise à jour.");
  };

  const saveProfile = async () => {
    if (!profile || !userId) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, qualite: profile.qualite })
      .eq("id", userId);
    setSavingProfile(false);
    if (error) { toast.error(`Enregistrement impossible : ${error.message}`); return; }
    toast.success("Profil mis à jour.");
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, full_name: profile.full_name, qualite: profile.qualite } : m)));
  };

  const invite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Adresse email invalide."); return; }
    if (!profile?.organisation_id) { toast.error("Organisation introuvable."); return; }
    setInviting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        data: { organisation_id: profile.organisation_id, invited_by: userId, role: "member" },
      },
    });
    setInviting(false);
    if (error) toast.error(`Invitation impossible : ${error.message}`);
    else { toast.success(`Lien d'invitation envoyé à ${email}.`); setInviteEmail(""); }
  };

  const tabs = useMemo(
    () => [
      { id: "organisation" as const, label: "Organisation" },
      { id: "membres" as const, label: `Membres${members.length ? ` (${members.length})` : ""}` },
      { id: "profil" as const, label: "Profil" },
    ],
    [members.length],
  );

  return (
    <div className="fade-up" style={{ maxWidth: 720 }}>
      <h1 className="serif" style={{ fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 24 }}>Paramètres</h1>

      <Tabs items={tabs} active={tab} onChange={(t) => setTab(t as SettingsTab)} style={{ marginBottom: 24 }} />

      {loading && <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-2)" }}>Chargement…</div>}

      {!loading && tab === "organisation" && (
        org ? (
          <Panel
            title="Maison de vente"
            footer={<Button variant="primary" size="md" onClick={saveOrg} loading={savingOrg}>Enregistrer</Button>}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {ORG_FIELDS.map((field) => (
                <div key={field.key} style={field.span ? { gridColumn: "1 / -1" } : undefined}>
                  <Input
                    label={field.label}
                    value={org[field.key] ?? ""}
                    onChange={(e) => setOrgField(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Maison de vente"><p style={{ fontSize: "var(--text-base)", color: "var(--ink-2)" }}>Aucune organisation rattachée à votre compte.</p></Panel>
        )
      )}

      {!loading && tab === "membres" && (
        <>
          {isAdmin && (
            <Panel title="Inviter un membre">
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="collaborateur@etude.fr"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") invite(); }}
                  />
                </div>
                <Button variant="primary" size="md" onClick={invite} loading={inviting}>Inviter</Button>
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 8 }}>
                Un lien de connexion (magic link) est envoyé par email. Le membre rejoint l&apos;organisation à sa première connexion.
              </p>
            </Panel>
          )}
          <Panel title="Membres de l'organisation">
            {members.length === 0 ? (
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-2)" }}>Aucun membre.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {members.map((m, i) => {
                  const badge = ROLE_BADGE[m.role || "member"] || ROLE_BADGE.member;
                  return (
                    <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div>
                        <p style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--ink)" }}>
                          {m.full_name || m.email || "—"}{m.id === userId && <span style={{ color: "var(--ink-3)", fontWeight: 400 }}> · vous</span>}
                        </p>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>
                          {m.email}{m.qualite ? ` · ${m.qualite}` : ""}
                        </p>
                      </div>
                      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}

      {!loading && tab === "profil" && (
        profile ? (
          <Panel
            title="Mon profil"
            footer={<Button variant="primary" size="md" onClick={saveProfile} loading={savingProfile}>Enregistrer</Button>}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Nom complet" value={profile.full_name ?? ""} onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))} />
              </div>
              <Input label="Qualité / Fonction" value={profile.qualite ?? ""} onChange={(e) => setProfile((p) => (p ? { ...p, qualite: e.target.value } : p))} placeholder="ex. Commissaire-priseur" />
              <Input label="Email" value={profile.email ?? ""} disabled readOnly />
            </div>
          </Panel>
        ) : (
          <Panel title="Mon profil"><p style={{ fontSize: "var(--text-base)", color: "var(--ink-2)" }}>Profil introuvable.</p></Panel>
        )
      )}
    </div>
  );
}
