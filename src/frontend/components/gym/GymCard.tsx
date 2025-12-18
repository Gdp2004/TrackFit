import { Badge } from "@frontend/components/ui/Badge";
import type { Struttura } from "@backend/domain/model/types";

interface GymCardProps { struttura: Struttura; corsiCount?: number; }

export function GymCard({ struttura, corsiCount }: GymCardProps) {
  const isAttiva = struttura.stato === "Attiva";
  return (
    <div className="tf-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: "hsl(var(--tf-text))" }}>
              {struttura.denominazione}
            </p>
            <Badge color={isAttiva ? "green" : "gray"}>{struttura.stato}</Badge>
          </div>
          <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>📍</span> {struttura.indirizzo}
          </p>
          {corsiCount !== undefined && (
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", marginTop: 4 }}>
              🏃 {corsiCount} corsi disponibili
            </p>
          )}
        </div>
      </div>
      <p style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "hsl(var(--tf-border))", fontFamily: "monospace" }}>
        P.IVA: {struttura.piva}
      </p>
    </div>
  );
}