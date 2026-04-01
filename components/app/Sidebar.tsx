"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "sales", label: "Sales", href: "/dashboard/sales" },
  { id: "lots", label: "Lots", href: "/dashboard/lots" },
  { id: "catalogue", label: "Catalogue", href: "/dashboard/catalogue" },
  { id: "crm", label: "CRM", href: "/dashboard/crm" },
  { id: "estimates", label: "Estimates", href: "/dashboard/estimates" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside style={{ width: collapsed ? 60 : 220, flexShrink: 0, background: "var(--white)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "width 200ms ease", overflow: "hidden", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--border)", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, background: "var(--black)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
            <path d="M17.64 15L22 10.64" />
            <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
          </svg>
        </div>
        {!collapsed && <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 600, color: "var(--black)", whiteSpace: "nowrap" }}>HammerSuite</span>}
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.id} href={item.href} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px" : "9px 12px", borderRadius: "var(--radius)", background: active ? "var(--cream)" : "transparent", color: active ? "var(--black)" : "var(--muted)", marginBottom: 2, justifyContent: collapsed ? "center" : "flex-start", transition: "all var(--transition)", textDecoration: "none", fontSize: 13.5, fontWeight: active ? 600 : 400 }}>
              <span>{item.label}</span>
              {!collapsed && active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "10px" : "9px 12px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)" }}>
          <span>{collapsed ? ">" : "Collapse"}</span>
        </button>
      </div>
    </aside>
  );
}
