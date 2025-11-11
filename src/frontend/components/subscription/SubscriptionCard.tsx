import { Abbonamento } from "@backend/domain/model/types";
import { Card } from "@frontend/components/ui/Card";

interface SubscriptionCardProps { abbonamento: Abbonamento; }

export function SubscriptionCard({ abbonamento }: SubscriptionCardProps) {
  const isAttivo = abbonamento.stato === "ATTIVO";
  return (
    <Card title="Il tuo abbonamento">
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${isAttivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {abbonamento.stato}
        </span>
      </div>
      <p className="text-sm text-gray-600">Scade il: <strong>{abbonamento.dataFine ? new Date(abbonamento.dataFine).toLocaleDateString("it-IT") : "â€”"}</strong></p>
      {abbonamento.qrCode && (
        <p className="mt-3 text-xs text-gray-400 font-mono break-all">QR: {abbonamento.qrCode}</p>
      )}
    </Card>
  );
}