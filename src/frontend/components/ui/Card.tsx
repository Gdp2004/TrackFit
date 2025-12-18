import React from "react";

type CardVariant = "default" | "glass" | "elevated";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  style?: React.CSSProperties;
}

export function Card({ title, children, className = "", variant = "default", style }: CardProps) {
  const base: React.CSSProperties = {
    borderRadius: "var(--tf-radius)",
    padding: "1.5rem",
    transition: "all var(--tf-transition)",
  };

  const variantStyle: Record<CardVariant, React.CSSProperties> = {
    default: {
      background: "hsl(var(--tf-surface))",
      border: "1px solid hsl(var(--tf-border))",
      boxShadow: "var(--tf-shadow)",
    },
    glass: {
      background: "rgba(255,255,255,.05)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,.12)",
    },
    elevated: {
      background: "hsl(var(--tf-surface))",
      border: "1px solid hsl(var(--tf-border))",
      boxShadow: "var(--tf-shadow-lg)",
    },
  };

  return (
    <div
      className={`tf-card ${className}`}
      style={{ ...base, ...variantStyle[variant], ...style }}
    >
      {title && (
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "hsl(var(--tf-text))" }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}