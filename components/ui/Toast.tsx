"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const VARIANT_STYLES: Record<ToastVariant, { bg: string; color: string; border: string }> = {
  success: { bg: "var(--status-success-bg)", color: "var(--status-success)", border: "var(--status-success)" },
  error: { bg: "var(--status-danger-bg)", color: "var(--status-danger)", border: "var(--status-danger)" },
  info: { bg: "var(--status-info-bg)", color: "var(--status-info)", border: "var(--status-info)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 2000,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const v = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: "auto",
                minWidth: 240,
                maxWidth: 360,
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${v.border}`,
                borderRadius: "var(--radius)",
                padding: "12px 14px",
                fontSize: "var(--text-base)",
                color: "var(--ink)",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                animation: "toastIn 200ms ease",
              }}
            >
              <span style={{ color: v.color, marginTop: 1, flexShrink: 0 }}>
                {t.variant === "success" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {t.variant === "error" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                {t.variant === "info" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Fermer"
                style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
