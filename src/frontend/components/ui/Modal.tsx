import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    if (!open || !mounted) return null;

    return createPortal(
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,.75)",
                backdropFilter: "blur(8px)",
                padding: "1rem",
            }}
            className="animate-fadeIn"
        >
            <div
                ref={ref}
                style={{
                    background: "rgba(26, 23, 20, 0.9)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "var(--tf-radius-lg)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                    padding: "2.5rem",
                    width: "100%",
                    maxWidth: "500px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    position: "relative",
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: "1.25rem", right: "1.25rem",
                        background: "rgba(255,255,255,0.05)", border: "none",
                        color: "hsl(var(--tf-text-muted))", fontSize: "1rem",
                        cursor: "pointer", lineHeight: 1, width: 32, height: 32,
                        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                >
                    ✕
                </button>
                {title && (
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.75rem", color: "hsl(var(--tf-text))", letterSpacing: "-0.02em" }}>
                        {title}
                    </h2>
                )}
                {children}
            </div>
        </div>,
        document.body
    );
}

