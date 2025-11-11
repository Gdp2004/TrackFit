import { Struttura } from "@backend/domain/model/types";
import { Card } from "@frontend/components/ui/Card";

interface GymCardProps { struttura: Struttura; }

export function GymCard({ struttura }: GymCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-900 text-lg">{struttura.denominazione}</p>
          <p className="text-sm text-gray-500">ðŸ“ {struttura.indirizzo}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${struttura.stato === "Attiva" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
          {struttura.stato}
        </span>
      </div>
      <div className="mt-3 text-xs text-gray-400">P.IVA: {struttura.piva}</div>
    </Card>
  );
}