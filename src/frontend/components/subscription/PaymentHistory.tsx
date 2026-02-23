"use client";

import type { Pagamento } from "@backend/domain/model/types";
import { StatoPagamentoEnum } from "@backend/domain/model/enums";
import { Badge } from "@frontend/components/ui/Badge";

interface PaymentHistoryProps { payments: Pagamento[]; }

type BadgeColor = "green" | "red" | "yellow" | "gray" | "blue" | "purple";
const STATO_BADGE: Record<string, { color: BadgeColor; label: string }> = {
    COMPLETATO: { color: "green", label: "Completato" },
    IN_ATTESA: { color: "yellow", label: "In attesa" },
    FALLITO: { color: "red", label: "Fallito" },
    RIMBORSATO: { color: "blue", label: "Rimborsato" },
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
    if (payments.length === 0) {
        return (
            <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem" }}>
                Nessun pagamento registrato
            </p>
        );
    }

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                    <tr>
                        {["Data", "Importo", "Metodo", "Stato"].map((h) => (
                            <th key={h} style={{
                                textAlign: "left", padding: "0.625rem 0.75rem",
                                color: "hsl(var(--tf-text-muted))", fontWeight: 600, fontSize: "0.75rem",
                                borderBottom: "1px solid hsl(var(--tf-border))",
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p) => {
                        const badge = STATO_BADGE[p.stato] ?? { color: "gray" as BadgeColor, label: p.stato };
                        return (
                            <tr key={p.id} style={{ borderBottom: "1px solid hsl(var(--tf-border)/.5)" }}>
                                <td style={{ padding: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
                                    {new Date(p.createdat).toLocaleDateString("it-IT")}
                                </td>
                                <td style={{ padding: "0.75rem", fontWeight: 700 }}>€{p.importo.toFixed(2)}</td>
                                <td style={{ padding: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
                                    {p.metodo ?? "—"}
                                </td>
                                <td style={{ padding: "0.75rem" }}>
                                    <Badge color={badge.color}>{badge.label}</Badge>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
