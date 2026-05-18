"use client";

import React, { CSSProperties, forwardRef } from "react";

export type SelectOption = { value: string; label: string };

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "style" | "children"> & {
  label?: string;
  helper?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  block?: boolean;
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
};

const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, helper, error, options, placeholder, block = true, style, wrapperStyle, ...rest },
  ref,
) {
  const borderColor = error ? "var(--status-danger)" : "var(--border)";
  return (
    <div style={{ display: block ? "block" : "inline-block", width: block ? "100%" : undefined, ...wrapperStyle }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--ink-2)",
            marginBottom: 5,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <select
          ref={ref}
          {...rest}
          style={{
            width: block ? "100%" : undefined,
            padding: "8px 32px 8px 10px",
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius)",
            fontSize: "var(--text-base)",
            fontFamily: "var(--font-sans)",
            outline: "none",
            color: "var(--ink)",
            background: "var(--white)",
            appearance: "none",
            cursor: "pointer",
            ...style,
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 10, color: "var(--ink-3)", pointerEvents: "none", display: "inline-flex" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {(helper || error) && (
        <p
          style={{
            marginTop: 4,
            fontSize: "var(--text-xs)",
            color: error ? "var(--status-danger)" : "var(--ink-3)",
          }}
        >
          {error || helper}
        </p>
      )}
    </div>
  );
});

export default Select;
