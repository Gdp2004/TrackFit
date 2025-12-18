"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Report } from "@backend/domain/model/types";

interface ReportChartProps { report: Report }

// Mock weekly data for chart
const MOCK_WEEKLY = [
  { settimana: "W1", km: 12, minuti: 85 },
  { settimana: "W2", km: 18, minuti: 120 },
  { settimana: "W3", km: 9, minuti: 65 },
  { settimana: "W4", km: 22, minuti: 145 },
];

export function ReportChart({ report }: ReportChartProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stat cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "km totali", value: report.distanzaTotale?.toFixed(1) ?? "—", color: "hsl(var(--tf-primary))", bg: "hsl(var(--tf-primary)/.1)" },
          { label: "minuti tot.", value: String(report.tempoTotaleMinuti ?? "—"), color: "hsl(var(--tf-accent))", bg: "hsl(var(--tf-accent)/.1)" },
          { label: "min/km medio", value: report.ritmoMedio?.toFixed(2) ?? "—", color: "hsl(38 92% 50%)", bg: "hsl(38 92% 50%/.1)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: "var(--tf-radius-sm)", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontWeight: 900, fontSize: "2rem", color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "0.7rem", color: "hsl(var(--tf-text-muted))", marginTop: "0.25rem" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Recharts line chart */}
      <div>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--tf-text-muted))", marginBottom: "0.75rem" }}>
          Andamento settimanale
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={MOCK_WEEKLY} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="settimana" tick={{ fontSize: 11, fill: "hsl(var(--tf-text-muted))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--tf-text-muted))" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--tf-surface))",
                border: "1px solid hsl(var(--tf-border))",
                borderRadius: "8px",
                color: "hsl(var(--tf-text))",
                fontSize: "0.8rem",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
            <Line type="monotone" dataKey="km" stroke="hsl(220 90% 56%)" strokeWidth={2.5} dot={{ r: 4 }} name="km" />
            <Line type="monotone" dataKey="minuti" stroke="hsl(158 64% 52%)" strokeWidth={2.5} dot={{ r: 4 }} name="minuti" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}