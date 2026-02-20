import React from "react";

type BadgeColor = "blue" | "green" | "red" | "yellow" | "purple" | "gray";

interface BadgeProps {
    children: React.ReactNode;
    color?: BadgeColor;
    className?: string;
}

const colorMap: Record<BadgeColor, { bg: string; text: string; border?: string }> = {
    blue: { bg: "hsl(25 95% 53%/.15)", text: "hsl(25 95% 68%)", border: "1px solid hsl(25 95% 53%/.25)" },
    green: { bg: "hsl(142 60% 45%/.15)", text: "hsl(142 60% 58%)", border: "1px solid hsl(142 60% 45%/.25)" },
    red: { bg: "hsl(0 84% 56%/.15)", text: "hsl(0 84% 70%)", border: "1px solid hsl(0 84% 56%/.25)" },
    yellow: { bg: "hsl(38 92% 50%/.15)", text: "hsl(38 92% 65%)", border: "1px solid hsl(38 92% 50%/.25)" },
    purple: { bg: "hsl(38 100% 60%/.12)", text: "hsl(38 100% 68%)", border: "1px solid hsl(38 100% 60%/.2)" },
    gray: { bg: "hsl(25 6% 20%/.6)", text: "hsl(25 8% 60%)", border: "1px solid hsl(25 6% 28%)" },
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
                border: c.border,
            }}
        >
            {children}
        </span>
    );
}
