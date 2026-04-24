"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = ["Product", "Solutions", "Pricing", "Company"];

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(250,249,247,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 300ms ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--black)",
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
              color: "var(--black)",
              letterSpacing: "-0.01em",
            }}
          >
            Marto.io
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navLinks.map((link) => (
            <Link
              key={link}
              href={link === "Pricing" ? "/pricing" : "/"}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink)",
                textDecoration: "none",
                transition: "background var(--transition)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--cream)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {link}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/login"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 14px",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/pricing"
            style={{
              background: "var(--black)",
              color: "white",
              padding: "8px 18px",
              borderRadius: "var(--radius)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              transition: "opacity var(--transition)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Book a demo
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              color: "var(--ink)",
              display: "none",
            }}
            className="mobile-menu-btn"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: "var(--white)",
            borderTop: "1px solid var(--border)",
            padding: "16px 24px 24px",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link}
              href={link === "Pricing" ? "/pricing" : "/"}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--ink)",
                borderBottom: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              {link}
            </Link>
          ))}
          <Link
            href="/login"
            style={{
              display: "block",
              marginTop: 16,
              width: "100%",
              background: "var(--black)",
              color: "white",
              padding: "12px",
              borderRadius: "var(--radius)",
              fontSize: 15,
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}