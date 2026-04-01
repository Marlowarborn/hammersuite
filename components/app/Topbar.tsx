"use client";

export default function Topbar() {
  return (
    <header
      style={{
        height: 56,
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "var(--muted)",
          marginRight: 8,
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--black)" }}>
          Maison Durand & Associés
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          placeholder="Search lots, sales, clients…"
          style={{
            width: "100%",
            padding: "7px 12px 7px 32px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 13,
            color: "var(--ink)",
            fontFamily: "var(--font-sans)",
            outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      <button
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--muted)",
          padding: 8,
          borderRadius: "var(--radius)",
          position: "relative",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 7, right: 7,
            width: 7, height: 7,
            background: "var(--accent)",
            borderRadius: "50%",
            border: "2px solid white",
          }}
        />
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 12px",
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 24, height: 24,
            background: "var(--charcoal)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: "white" }}>DA</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          D. Aumont
        </span>
      </div>
    </header>
  );
}