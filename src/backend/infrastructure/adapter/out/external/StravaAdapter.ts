// ============================================================
// StravaAdapter
// Infrastructure layer – Handles 3rd party import (UC5)
// ============================================================

import { Workout } from "@/backend/domain/model/types";
import { TipoWorkoutEnum, WorkoutStatoEnum } from "@/backend/domain/model/enums";

// Mocking the Strava API Type for demonstration
interface StravaActivity {
  id: number;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_heartrate?: number;
}

export class StravaAdapter {
  static mappaAttivita(stravaActivity: StravaActivity, userid: string): Partial<Workout> {
    // Mappa Strava "Run", "Ride" ai nostri enum
    let tipo = TipoWorkoutEnum.ALTRO;
    if (stravaActivity.type === "Run") tipo = TipoWorkoutEnum.CORSA;
    if (stravaActivity.type === "Ride") tipo = TipoWorkoutEnum.CICLISMO;
    if (stravaActivity.type === "Swim") tipo = TipoWorkoutEnum.NUOTO;

    return {
      userid,
      tipo,
      dataora: new Date(stravaActivity.start_date).toISOString(),
      durata: Math.round(stravaActivity.moving_time / 60), // min
      distanza: stravaActivity.distance / 1000, // km
      frequenzacardiacamedia: stravaActivity.average_heartrate,
      sorgente: "IMPORT",
      stato: WorkoutStatoEnum.CONSOLIDATA, // From external = completed
      stravaid: stravaActivity.id.toString()
    };
  }
}