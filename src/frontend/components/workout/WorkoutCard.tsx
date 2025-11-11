import { Workout } from "@backend/domain/model/types";
import { Card } from "@frontend/components/ui/Card";

interface WorkoutCardProps { workout: Workout; }

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const statoColor: Record<string, string> = {
    PIANIFICATA: "text-yellow-500",
    IN_CORSO: "text-green-500",
    CONSOLIDATA: "text-blue-600",
    INTERROTTA: "text-red-500",
  };
  return (
    <Card className="hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-900 text-lg">{workout.tipo}</p>
          <p className="text-sm text-gray-500">{new Date(workout.dataOra).toLocaleString("it-IT")}</p>
        </div>
        <span className={`text-xs font-semibold ${statoColor[workout.stato] ?? "text-gray-400"}`}>{workout.stato}</span>
      </div>
      <div className="mt-3 flex gap-4 text-sm text-gray-600">
        <span>â± {workout.durata} min</span>
        {workout.distanza && <span>ðŸ“ {workout.distanza.toFixed(2)} km</span>}
      </div>
    </Card>
  );
}