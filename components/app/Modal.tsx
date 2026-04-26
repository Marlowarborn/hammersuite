"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
};

export default function Modal({ title, subtitle, onClose, onConfirm, confirmLabel, confirmDisabled, size = "md", children }: Props) {
  const maxWidth = size === "sm" ? 480 : size === "lg" ? 720 : 600;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,14,0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--white)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth,
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(15,15,14,0.2)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header fixe */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: subtitle ? 4 : 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: "var(--muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20, lineHeight: 1, padding: "2px 4px", marginLeft: 16, flexShrink: 0 }}>×</button>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {children}
        </div>

        {/* Footer fixe */}
        {onConfirm && (
          <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", flexShrink: 0, display: "flex", gap: 10, justifyContent: "flex-end", background: "var(--white)", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              Annuler
            </button>
            <button onClick={onConfirm} disabled={confirmDisabled}
              style={{ padding: "9px 20px", background: confirmDisabled ? "var(--cream)" : "var(--black)", color: confirmDisabled ? "var(--muted)" : "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: confirmDisabled ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
              {confirmLabel || "Confirmer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
