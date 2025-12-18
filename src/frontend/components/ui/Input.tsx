import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export function Input({ label, error, icon, id, className = "", ...props }: InputProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {label && (
                <label
                    htmlFor={id}
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))" }}
                >
                    {label}
                </label>
            )}
            <div style={{ position: "relative" }}>
                {icon && (
                    <span style={{
                        position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
                        color: "hsl(var(--tf-text-muted))", fontSize: "0.9rem",
                        pointerEvents: "none",
                    }}>
                        {icon}
                    </span>
                )}
                <input
                    id={id}
                    className={`tf-input${error ? " error" : ""} ${className}`}
                    style={icon ? { paddingLeft: "2.25rem" } : {}}
                    {...props}
                />
            </div>
            {error && (
                <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-danger))" }}>{error}</p>
            )}
        </div>
    );
}
