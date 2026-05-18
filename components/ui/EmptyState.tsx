"use client";

import React, { CSSProperties } from "react";

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  style?: CSSProperties;
};

export default function EmptyState({ icon, title, description, action, secondaryAction, style }: Props) {
  return (
    <div
      style={{
        padding: "var(--space-12) var(--space-6)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
        ...style,
      }}
    >
      {icon && (
        <div style={{ color: "var(--ink-3)", marginBottom: 4 }}>
          {icon}
        </div>
      )}
      <p className="serif" style={{ fontSize: "var(--text-xl)", fontWeight: 500, color: "var(--ink)", margin: 0 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)", maxWidth: 440, lineHeight: 1.5, margin: 0 }}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
