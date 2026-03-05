"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@frontend/contexts/AuthContext";
import { Card } from "@frontend/components/ui/Card";
import { ReportChart } from "@frontend/components/report/ReportChart";
import { ReportFilter } from "@frontend/components/report/ReportFilter";
import type { Report } from "@backend/domain/model/types";

type Period = "7" | "30" | "90";

const MOCK_REPORT: Report = {
    id: "r1", userid: "u1",
    periodo: "Ultimi 30 giorni",
    tipo: "UTENTE",
    distanzatotale: 61.5,
    tempototaleminuti: 420,
    ritmomedio: 5.12,
    formato: "PDF",
    generatoat: new Date().toISOString(),
};

export default function ReportsPage() {
    const { user, ruolo } = useAuth();
    const [period, setPeriod] = useState<Period>("30");
    const [report, setReport] = useState<Report>(MOCK_REPORT);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!user || !ruolo) return;
        setLoading(true);
        const labels: Record<Period, string> = { "7": "Ultimi 7 giorni", "30": "Ultimi 30 giorni", "90": "Ultimi 90 giorni" };

        const query = ruolo === "COACH"
            ? `coachid=${user.id}&periodo=${period}&tipo=COACH`
            : `userid=${user.id}&periodo=${period}&tipo=UTENTE`;

        fetch(`/api/reports?${query}`)
            .then((r) => r.json())
            .then((d: Report) => setReport({ ...MOCK_REPORT, ...d, periodo: labels[period] }))
            .catch(() => setReport({ ...MOCK_REPORT, periodo: labels[period] }))
            .finally(() => setLoading(false));
    }, [user, ruolo, period]);

    const handleExport = (format: "PDF" | "CSV") => {
        setExporting(true);
        setTimeout(() => setExporting(false), 1200);
    };

    return (
        <div style={{ maxWidth: 860, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Report</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Analizza le tue performance nel tempo
                </p>
            </div>

            {/* Filter bar */}
            <div style={{ marginBottom: "1.25rem" }}>
                <ReportFilter
                    period={period}
                    onPeriodChange={setPeriod}
                    onExportPDF={() => handleExport("PDF")}
                    onExportCSV={() => handleExport("CSV")}
                    loading={exporting}
                />
            </div>

            {/* Chart + stats */}
            {loading ? (
                <div className="tf-card animate-pulse" style={{ height: 320 }} />
            ) : (
                <Card title={`Riepilogo – ${report.periodo}`}>
                    <ReportChart report={report} />
                </Card>
            )}

            {/* Additional info card */}
            {!loading && (
                <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <Card title="Distribuzione per tipo">
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                            {[
                                { tipo: "🏃 Corsa", pct: 45 },
                                { tipo: "🏋️ Palestra", pct: 25 },
                                { tipo: "🚴 Ciclismo", pct: 20 },
                                { tipo: "🧘 Altro", pct: 10 },
                            ].map(({ tipo, pct }) => (
                                <div key={tipo}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
                                        <span>{tipo}</span>
                                        <span style={{ color: "hsl(var(--tf-text-muted))" }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: "hsl(var(--tf-surface-2))" }}>
                                        <div style={{
                                            width: `${pct}%`, height: "100%", borderRadius: 3,
                                            background: "linear-gradient(90deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Obiettivi mensili">
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {[
                                { label: "100 km al mese", current: 61.5, target: 100 },
                                { label: "500 minuti al mese", current: 420, target: 500 },
                                { label: "12 sessioni al mese", current: 9, target: 12 },
                            ].map(({ label, current, target }) => {
                                const pct = Math.min(100, (current / target) * 100);
                                return (
                                    <div key={label}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                                            <span>{label}</span>
                                            <span style={{ color: "hsl(var(--tf-text-muted))" }}>{current}/{target}</span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 3, background: "hsl(var(--tf-surface-2))" }}>
                                            <div style={{
                                                width: `${pct}%`, height: "100%", borderRadius: 3,
                                                background: pct >= 80 ? "hsl(var(--tf-accent))" : pct >= 50 ? "hsl(38 92% 50%)" : "hsl(var(--tf-primary))",
                                                transition: "width 0.5s ease",
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
