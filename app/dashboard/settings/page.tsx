export default function SettingsPage() {
  const groups = [
    { section: "Maison de vente", fields: [{ label: "Nom de l’étude", value: "Maison Durand et Associés" }, { label: "Numéro d’agrément", value: "SVV-2019-0847" }, { label: "Ville principale", value: "Paris" }] },
    { section: "Compte", fields: [{ label: "Nom complet", value: "Diane Aumont" }, { label: "Email", value: "d.aumont@maison-durand.fr" }, { label: "Fonction", value: "Commissaire-priseur" }] },
  ];
  return (
    <div className="fade-up" style={{ maxWidth: 640 }}>
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 28 }}>Paramètres</h1>
      {groups.map(group => (
        <div key={group.section} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: 20, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{group.section}</p>
          </div>
          {group.fields.map(field => (
            <div key={field.label} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ fontSize: 13, color: "var(--muted)", minWidth: 180 }}>{field.label}</label>
              <input defaultValue={field.value} style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--ink)", background: "var(--surface)", outline: "none", maxWidth: 320 }} />
            </div>
          ))}
        </div>
      ))}
      <button style={{ padding: "10px 24px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Enregistrer les modifications</button>
    </div>
  );
}
