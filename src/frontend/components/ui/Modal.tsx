"use client";

import React, { useEffect, useRef } from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    if (!open) return null;

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,.65)",
                backdropFilter: "blur(4px)",
            }}
            className="animate-fadeIn"
        >
            <div
                ref={ref}
                style={{
                    background: "hsl(var(--tf-surface))",
                    border: "1px solid hsl(var(--tf-border))",
                    borderRadius: "var(--tf-radius)",
                    boxShadow: "var(--tf-shadow-lg)",
                    padding: "1.75rem",
                    width: "100%",
                    maxWidth: "480px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    position: "relative",
                }}
                className="animate-fadeIn"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: "1rem", right: "1rem",
                        background: "none", border: "none",
                        color: "hsl(var(--tf-text-muted))", fontSize: "1.2rem",
                        cursor: "pointer", lineHeight: 1,
                    }}
                >
                    ✕
                </button>
                {title && (
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "hsl(var(--tf-text))" }}>
                        {title}
                    </h2>
                )}
                {children}
            </div>
        </div>
    );
}
