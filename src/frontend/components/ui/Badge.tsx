import React from "react";

type BadgeColor = "blue" | "green" | "red" | "yellow" | "purple" | "gray";

interface BadgeProps {
    children: React.ReactNode;
    color?: BadgeColor;
    className?: string;
}

const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
    blue: { bg: "hsl(220 90% 56%/.15)", text: "hsl(220 90% 70%)" },
    green: { bg: "hsl(142 70% 45%/.15)", text: "hsl(142 70% 55%)" },
    red: { bg: "hsl(4 86% 58%/.15)", text: "hsl(4 86% 70%)" },
    yellow: { bg: "hsl(38 92% 50%/.15)", text: "hsl(38 92% 65%)" },
    purple: { bg: "hsl(280 70% 60%/.15)", text: "hsl(280 70% 72%)" },
    gray: { bg: "hsl(215 20% 30%/.4)", text: "hsl(215 20% 65%)" },
};

export function Badge({ children, color = "gray", className = "" }: BadgeProps) {
    const c = colorMap[color];
    return (
        <span
            className={className}
            style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.15rem 0.6rem",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                background: c.bg,
                color: c.text,
            }}
        >
            {children}
        </span>
    );
}
