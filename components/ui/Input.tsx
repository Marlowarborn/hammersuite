"use client";

import React, { CSSProperties, forwardRef } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> & {
  label?: string;
  helper?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  block?: boolean;
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, helper, error, leadingIcon, trailingIcon, block = true, style, wrapperStyle, ...rest },
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
        {leadingIcon && (
          <span style={{ position: "absolute", left: 10, color: "var(--ink-3)", display: "inline-flex" }}>{leadingIcon}</span>
        )}
        <input
          ref={ref}
          {...rest}
          style={{
            width: block ? "100%" : undefined,
            padding: leadingIcon ? "8px 10px 8px 32px" : trailingIcon ? "8px 32px 8px 10px" : "8px 10px",
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius)",
            fontSize: "var(--text-base)",
            fontFamily: "var(--font-sans)",
            outline: "none",
            color: "var(--ink)",
            background: "var(--white)",
            transition: "border-color var(--transition)",
            ...style,
          }}
        />
        {trailingIcon && (
          <span style={{ position: "absolute", right: 10, color: "var(--ink-3)", display: "inline-flex" }}>{trailingIcon}</span>
        )}
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

export default Input;
