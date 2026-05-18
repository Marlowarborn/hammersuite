"use client";

import React from "react";

export type PhaseTrackerItem = {
  id: string;
  label: string;
  total?: number;
  done?: number;
};

type Props = {
  phases: PhaseTrackerItem[];
  activePhase: string;
  onSelect?: (phaseId: string) => void;
};

export default function PhaseTracker({ phases, activePhase, onSelect }: Props) {
  const activeIndex = phases.findIndex((p) => p.id === activePhase);

  return (
    <div
      role="navigation"
      aria-label="Phases du dossier"
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        padding: 0,
      }}
    >
      {phases.map((phase, i) => {
        const isActive = phase.id === activePhase;
        const isPast = activeIndex > i;
        const total = phase.total ?? 0;
        const done = phase.done ?? 0;
        const allDone = total > 0 && done >= total;
        const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

        const bg = isActive
          ? "var(--cream)"
          : allDone
            ? "var(--status-success-bg)"
            : isPast
              ? "var(--surface)"
              : "var(--white)";

        const dotBg = allDone
          ? "var(--status-success)"
          : isActive
            ? "var(--black)"
            : "var(--border-strong)";

        const indexColor = allDone || isActive ? "var(--white)" : "var(--ink-2)";

        return (
          <button
            key={phase.id}
            onClick={() => onSelect?.(phase.id)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 14px",
              background: bg,
              border: "none",
              borderRight: i < phases.length - 1 ? "1px solid var(--border)" : "none",
              cursor: onSelect ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 6,
              textAlign: "left",
              transition: "background var(--transition)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: dotBg,
                  color: indexColor,
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {allDone ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--ink)" : "var(--ink-2)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {phase.label}
              </span>
            </div>
            {total > 0 && (
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background: "var(--border)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: "100%",
                      background: allDone ? "var(--status-success)" : "var(--accent)",
                      transition: "width var(--transition)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>
                  {done}/{total}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
