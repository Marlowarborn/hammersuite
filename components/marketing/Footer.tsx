import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "var(--black)", color: "var(--white)" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "64px 24px 48px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 64,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
                  <path d="M17.64 15L22 10.64" />
                  <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                HammerSuite
              </span>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 280,
              }}
            >
              The modern operating system for auction houses. Built for
              commissaires-priseurs who demand precision.
            </p>
          </div>

          {/* Link columns */}
          {[
            {
              title: "Product",
              links: [
                { label: "Catalogue Generator", href: "/dashboard/catalogue" },
                { label: "Sales Management", href: "/dashboard/sales" },
                { label: "Lot Management", href: "/dashboard/lots" },
                { label: "Client CRM", href: "/dashboard/crm" },
                { label: "Analytics", href: "/dashboard/analytics" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "/" },
                { label: "Customer Stories", href: "/" },
                { label: "Security", href: "/" },
                { label: "Contact", href: "/" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Terms of Service", href: "/" },
                { label: "Privacy Policy", href: "/" },
                { label: "Help Centre", href: "/" },
                { label: "Book a Demo", href: "/pricing" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 20,
                }}
              >
                {col.title}
              </p>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    display: "block",
                    padding: "6px 0",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "none",
                    transition: "color var(--transition)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "white")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            © 2026 HammerSuite. All rights reserved.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            Paris · Lyon · Bordeaux
          </p>
        </div>
      </div>
    </footer>
  );
}