import Link from "next/link";

type Props = {
  titre: string;
  description: string;
  prevu: string[];
};

/**
 * Page d'attente honnête pour un module non encore construit.
 * Remplace les anciennes maquettes à données fictives.
 */
export default function ModuleEnPreparation({ titre, description, prevu }: Props) {
  return (
    <div className="fade-up" style={{ maxWidth: 720 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,111,71,0.1)", border: "1px solid rgba(139,111,71,0.2)", borderRadius: 99, padding: "4px 12px", marginBottom: 20 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Module en préparation</span>
      </div>
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 10 }}>{titre}</h1>
      <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.7, marginBottom: 28 }}>{description}</p>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 12 }}>Ce qui est prévu</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--ink)", lineHeight: 1.8 }}>
          {prevu.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        En attendant, les modules opérationnels sont le <Link href="/dashboard/lots" style={{ color: "var(--ink)" }}>répertoire</Link>, les{" "}
        <Link href="/dashboard/dossiers" style={{ color: "var(--ink)" }}>dossiers judiciaires</Link> et la{" "}
        <Link href="/saisie" style={{ color: "var(--ink)" }}>saisie rapide</Link>.
      </p>
    </div>
  );
}
