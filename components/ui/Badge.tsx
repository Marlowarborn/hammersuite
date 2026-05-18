"use client";

import React, { CSSProperties } from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "accent";
export type BadgeSize = "sm" | "md";

type Props = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: CSSProperties;
  title?: string;
};

const VARIANTS: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: "var(--status-success-bg)", color: "var(--status-success)" },
  warning: { bg: "var(--status-warning-bg)", color: "var(--status-warning)" },
  danger: { bg: "var(--status-danger-bg)", color: "var(--status-danger)" },
  info: { bg: "var(--status-info-bg)", color: "var(--status-info)" },
  neutral: { bg: "var(--cream)", color: "var(--ink-2)" },
  accent: { bg: "var(--accent-light)", color: "var(--accent-dark)" },
};

const SIZES: Record<BadgeSize, CSSProperties> = {
  sm: { padding: "2px 7px", fontSize: 10 },
  md: { padding: "3px 10px", fontSize: "var(--text-xs)" },
};

export default function Badge({ variant = "neutral", size = "md", children, style, title }: Props) {
  const v = VARIANTS[variant];
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: 99,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: v.bg,
        color: v.color,
        ...SIZES[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
