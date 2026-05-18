"use client";

import { useEffect } from "react";
import Button from "./Button";

export type ModalSize = "sm" | "md" | "lg" | "xl";

type Props = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  cancelLabel?: string;
  size?: ModalSize;
  hideFooter?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

const SIZE_WIDTHS: Record<ModalSize, number> = {
  sm: 480,
  md: 600,
  lg: 760,
  xl: 960,
};

export default function Modal({
  title,
  subtitle,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  confirmLoading,
  cancelLabel = "Annuler",
  size = "md",
  hideFooter = false,
  footer,
  children,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxWidth = SIZE_WIDTHS[size];
  const showFooter = !hideFooter && (footer !== undefined || onConfirm !== undefined);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,14,0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        paddingTop: "5vh",
        justifyContent: "center",
        zIndex: 1000,
        padding: "5vh 24px 24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth,
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              className="serif"
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                marginBottom: subtitle ? 4 : 0,
              }}
            >
              {title}
            </h2>
            {subtitle && <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-2)",
              fontSize: 20,
              lineHeight: 1,
              padding: "2px 4px",
              marginLeft: 16,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>{children}</div>

        {showFooter && (
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              background: "var(--white)",
              borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            }}
          >
            {footer !== undefined ? (
              footer
            ) : (
              <>
                <Button variant="secondary" size="md" onClick={onClose}>
                  {cancelLabel}
                </Button>
                {onConfirm && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                    loading={confirmLoading}
                  >
                    {confirmLabel || "Confirmer"}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
