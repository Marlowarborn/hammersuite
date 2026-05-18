"use client";

import React, { CSSProperties } from "react";

type Props = {
  children: React.ReactNode;
  padding?: number | string;
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  as?: "div" | "section" | "article";
  className?: string;
};

export default function Card({ children, padding = 20, hover = false, onClick, style, as = "div", className }: Props) {
  const Comp = as;
  return (
    <Comp
      onClick={onClick}
      className={className}
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding,
        transition: hover ? "background var(--transition), border-color var(--transition), box-shadow var(--transition)" : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        if (hover) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ title, subtitle, actions, style }: { title: string; subtitle?: string; actions?: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", ...style }}>
      <div>
        <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink)" }}>{title}</p>
        {subtitle && <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
