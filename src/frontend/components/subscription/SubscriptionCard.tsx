"use client";

import { Badge } from "@frontend/components/ui/Badge";
import type { Abbonamento } from "@backend/domain/model/types";
import { StatoAbbonamentoEnum } from "@backend/domain/model/enums";

interface SubscriptionCardProps { abbonamento: Abbonamento; }

type BadgeColor = "green" | "red" | "yellow" | "gray" | "blue" | "purple";
const STATO_BADGE: Record<string, { color: BadgeColor; label: string }> = {
  ATTIVO: { color: "green", label: "Attivo" },
  SOSPESO: { color: "yellow", label: "Sospeso" },
  SCADUTO: { color: "red", label: "Scaduto" },
  CANCELLATO: { color: "gray", label: "Cancellato" },
};

export function SubscriptionCard({ abbonamento }: SubscriptionCardProps) {
  const badge = STATO_BADGE[abbonamento.stato] ?? { color: "gray" as BadgeColor, label: abbonamento.stato };
  const now = new Date();
  const inizio = new Date(abbonamento.datainizio);
  const fine = new Date(abbonamento.datafine);
  const total = fine.getTime() - inizio.getTime();
  const elapsed = now.getTime() - inizio.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const remaining = Math.max(0, Math.ceil((fine.getTime() - now.getTime()) / 86400000));
  const isAttivo = abbonamento.stato === StatoAbbonamentoEnum.ATTIVO;

  return (
    <div className="tf-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: isAttivo ? "hsl(var(--tf-accent)/.2)" : "hsl(var(--tf-border)/.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
        }}>
          🎫
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Piano Abbonamento</h3>
            <Badge color={badge.color}>{badge.label}</Badge>
          </div>
          <p style={{ fontSize: "0.78rem", color: "hsl(var(--tf-text-muted))", marginTop: 2 }}>
            {inizio.toLocaleDateString("it-IT")} → {fine.toLocaleDateString("it-IT")}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 800, fontSize: "1.2rem" }}>€{abbonamento.importo.toFixed(0)}</p>
          <p style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))" }}>importo pagato</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginBottom: "0.375rem" }}>
          <span>Periodo</span>
          <span>{isAttivo ? `${remaining} giorni rimanenti` : badge.label}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "hsl(var(--tf-surface-2))" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: `${pct}%`,
            background: isAttivo
              ? `linear-gradient(90deg, hsl(var(--tf-accent)), hsl(var(--tf-primary)))`
              : "hsl(var(--tf-border))",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* QR code area */}
      {abbonamento.qrCode && (
        <div style={{
          padding: "1rem",
          borderRadius: "var(--tf-radius-sm)",
          background: "hsl(var(--tf-surface-2))",
          border: "1px dashed hsl(var(--tf-border))",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))", marginBottom: "0.5rem" }}>
            📱 Codice QR accesso struttura
          </p>
          <div style={{
            fontFamily: "monospace", fontSize: "0.65rem",
            wordBreak: "break-all", color: "hsl(var(--tf-text-muted))", lineHeight: 1.4,
            maxWidth: 300, margin: "0 auto",
          }}>
            {abbonamento.qrCode}
          </div>
        </div>
      )}
    </div>
  );
}