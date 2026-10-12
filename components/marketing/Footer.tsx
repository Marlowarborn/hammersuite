import Link from "next/link";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Footer() {
  const columns = [
    {
      title: "Disponible",
      links: [
        { label: "Répertoire et inventaire", href: "/dashboard/lots" },
        { label: "Dossiers judiciaires", href: "/dashboard/dossiers" },
        { label: "Courriers et actes", href: "/dashboard/dossiers" },
        { label: "Saisie rapide par photo", href: "/saisie" },
      ],
    },
    {
      title: "En préparation",
      links: [
        { label: "Catalogues", href: "/dashboard/catalogue" },
        { label: "Clients et vigilance", href: "/dashboard/crm" },
        { label: "Estimations", href: "/dashboard/estimates" },
        { label: "Analytiques", href: "/dashboard/analytics" },
      ],
    },
    {
      title: "Projet",
      links: [
        { label: "Programme pilote", href: "/pricing" },
        { label: "Se connecter", href: "/login" },
        ...(CONTACT ? [{ label: "Contact", href: `mailto:${CONTACT}` }] : []),
      ],
    },
  ];

  return (
    <footer style={{ background: "var(--black)", color: "var(--white)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48, marginBottom: 64 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
                  <path d="M17.64 15L22 10.64" />
                  <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600 }}>Marto.io</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, maxWidth: 300 }}>
              Logiciel de gestion pour commissaires de justice et maisons de vente, en construction avec des études pilotes.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>{col.title}</p>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} style={{ display: "block", padding: "6px 0", fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>© 2026 Marto.io. Version de travail, sans client en production.</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Hébergé en Europe</p>
        </div>
      </div>
    </footer>
  );
}
