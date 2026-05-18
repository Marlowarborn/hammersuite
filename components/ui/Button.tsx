"use client";

import React, { CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  block?: boolean;
  style?: CSSProperties;
};

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "5px 10px", fontSize: "var(--text-sm)", borderRadius: "var(--radius)", gap: 6 },
  md: { padding: "8px 14px", fontSize: "var(--text-base)", borderRadius: "var(--radius)", gap: 8 },
  lg: { padding: "10px 18px", fontSize: "var(--text-md)", borderRadius: "var(--radius)", gap: 10 },
};

function variantStyle(variant: ButtonVariant, disabled: boolean): CSSProperties {
  if (disabled) {
    return {
      background: "var(--cream)",
      color: "var(--ink-3)",
      border: "1px solid var(--border)",
      cursor: "not-allowed",
    };
  }
  switch (variant) {
    case "primary":
      return { background: "var(--black)", color: "var(--white)", border: "1px solid var(--black)", cursor: "pointer" };
    case "secondary":
      return { background: "var(--white)", color: "var(--ink)", border: "1px solid var(--border)", cursor: "pointer" };
    case "ghost":
      return { background: "transparent", color: "var(--ink)", border: "1px solid transparent", cursor: "pointer" };
    case "danger":
      return { background: "var(--status-danger-bg)", color: "var(--status-danger)", border: "1px solid transparent", cursor: "pointer" };
  }
}

export default function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  block = false,
  disabled,
  children,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        lineHeight: 1.2,
        transition: "background var(--transition), color var(--transition), border-color var(--transition)",
        outline: "none",
        whiteSpace: "nowrap",
        width: block ? "100%" : undefined,
        ...SIZES[size],
        ...variantStyle(variant, isDisabled),
        ...style,
      }}
    >
      {loading ? (
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}
