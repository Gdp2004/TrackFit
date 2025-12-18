import React from "react";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const sizeMap: Record<Size, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: "0 0.75rem", fontSize: "0.8rem", height: "32px" },
  md: { padding: "0 1.25rem", fontSize: "0.875rem", height: "40px" },
  lg: { padding: "0 1.75rem", fontSize: "1rem", height: "48px" },
};

const variantMap: Record<Variant, { background: string; color: string; border: string }> = {
  primary: { background: "hsl(var(--tf-primary))", color: "#fff", border: "none" },
  secondary: { background: "hsl(var(--tf-surface-2))", color: "hsl(var(--tf-text))", border: "1px solid hsl(var(--tf-border))" },
  danger: { background: "hsl(var(--tf-danger))", color: "#fff", border: "none" },
  ghost: { background: "transparent", color: "hsl(var(--tf-text-muted))", border: "1px solid hsl(var(--tf-border))" },
};

export function Button({
  children, variant = "primary", size = "md", isLoading, disabled, className = "", style, ...props
}: ButtonProps) {
  const s = sizeMap[size];
  const v = variantMap[variant];
  return (
    <button
      className={`tf-btn ${className}`}
      disabled={disabled || isLoading}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        height: s.height,
        background: v.background,
        color: v.color,
        border: v.border,
        borderRadius: "var(--tf-radius-sm)",
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        transition: "all var(--tf-transition)",
        opacity: (disabled || isLoading) ? 0.5 : 1,
        ...style,
      }}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )}
      {isLoading ? "Caricamento..." : children}
    </button>
  );
}