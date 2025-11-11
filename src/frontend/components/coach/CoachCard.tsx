import { User } from "@backend/domain/model/types";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";

interface CoachCardProps { coach: User; onPrenota: (coachId: string) => void; }

export function CoachCard({ coach, onPrenota }: CoachCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
          {coach.nome[0]}{coach.cognome[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{coach.nome} {coach.cognome}</p>
          <p className="text-xs text-gray-400">{coach.email}</p>
        </div>
      </div>
      <Button variant="primary" className="w-full" onClick={() => onPrenota(coach.id)}>
        Prenota slot
      </Button>
    </Card>
  );
}