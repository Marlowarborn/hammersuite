"use client";

import React, { CSSProperties } from "react";

export type TabItem<T extends string = string> = {
  id: T;
  label: React.ReactNode;
  disabled?: boolean;
};

type Props<T extends string> = {
  items: ReadonlyArray<TabItem<T>>;
  active: T;
  onChange: (id: T) => void;
  style?: CSSProperties;
};

export default function Tabs<T extends string>({ items, active, onChange, style }: Props<T>) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid var(--border)",
        ...style,
      }}
    >
      {items.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--black)" : "2px solid transparent",
              cursor: tab.disabled ? "not-allowed" : "pointer",
              fontSize: "var(--text-md)",
              fontWeight: isActive ? 600 : 400,
              color: tab.disabled ? "var(--ink-3)" : isActive ? "var(--black)" : "var(--ink-2)",
              marginBottom: -1,
              fontFamily: "var(--font-sans)",
              transition: "color var(--transition), border-color var(--transition)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
