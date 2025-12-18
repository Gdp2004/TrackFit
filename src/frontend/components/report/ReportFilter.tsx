"use client";

import { useState } from "react";
import { Button } from "@frontend/components/ui/Button";

type Period = "7" | "30" | "90";

interface ReportFilterProps {
    period: Period;
    onPeriodChange: (p: Period) => void;
    onExportPDF: () => void;
    onExportCSV: () => void;
    loading?: boolean;
}

const PERIODS: { value: Period; label: string }[] = [
    { value: "7", label: "7 giorni" },
    { value: "30", label: "30 giorni" },
    { value: "90", label: "90 giorni" },
];

export function ReportFilter({ period, onPeriodChange, onExportPDF, onExportCSV, loading }: ReportFilterProps) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
            background: "hsl(var(--tf-surface))",
            border: "1px solid hsl(var(--tf-border))",
            borderRadius: "var(--tf-radius)",
            padding: "1rem 1.25rem",
        }}>
            {/* Period pills */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
                {PERIODS.map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => onPeriodChange(value)}
                        style={{
                            padding: "0.3rem 0.875rem", borderRadius: 999,
                            fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer",
                            background: period === value ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface-2))",
                            color: period === value ? "#fff" : "hsl(var(--tf-text-muted))",
                            transition: "all var(--tf-transition)",
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Export buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button variant="secondary" size="sm" onClick={onExportPDF} isLoading={loading}>
                    📄 PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={onExportCSV} isLoading={loading}>
                    📊 CSV
                </Button>
            </div>
        </div>
    );
}
