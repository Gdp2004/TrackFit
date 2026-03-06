"use client";

import { Badge } from "@frontend/components/ui/Badge";
import type { Abbonamento } from "@backend/domain/model/types";
import { StatoAbbonamentoEnum } from "@backend/domain/model/enums";
import QRCode from "react-qr-code";
import { memo } from "react";

interface SubscriptionCardProps {
  abbonamento: Abbonamento;
  onCancel?: (id: string) => void;
}

type BadgeColor = "green" | "red" | "yellow" | "gray" | "blue" | "purple";
const STATO_BADGE: Record<string, { color: BadgeColor; label: string }> = {
  ATTIVO: { color: "green", label: "Attivo" },
  SOSPESO: { color: "yellow", label: "Sospeso" },
  SCADUTO: { color: "red", label: "Scaduto" },
  CANCELLATO: { color: "gray", label: "Cancellato" },
};

export const SubscriptionCard = memo(function SubscriptionCard({ abbonamento, onCancel }: SubscriptionCardProps) {
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

      {/* Action Buttons */}
      {isAttivo && onCancel && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button
            onClick={() => onCancel(abbonamento.id)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--tf-radius-sm)",
              border: "1px solid hsl(var(--tf-danger))",
              background: "transparent",
              color: "hsl(var(--tf-danger))",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "hsl(var(--tf-danger)/.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Cancella Abbonamento
          </button>
        </div>
      )}

      {/* QR code area */}
      {abbonamento.qrcode && (
        <div style={{
          padding: "1.5rem",
          borderRadius: "var(--tf-radius-sm)",
          background: "#ffffff", // Il QR code necessita di buon contrasto, sfondo bianco
          border: "1px dashed hsl(var(--tf-border))",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem" }}>
            📱 Mostra questo codice all'ingresso
          </p>
          <div style={{ padding: "0.5rem", background: "#fff", borderRadius: "8px" }}>
            <QRCode
              value={abbonamento.qrcode}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
            />
          </div>
          <p style={{
            fontFamily: "monospace", fontSize: "0.65rem",
            wordBreak: "break-all", color: "#64748b", lineHeight: 1.4,
            maxWidth: 300, margin: "0 auto",
          }}>
            {abbonamento.qrcode}
          </p>
        </div>
      )}
    </div>
  );
});