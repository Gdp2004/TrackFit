// ============================================================
// Port/out – StorageLocalePort
// Outbound storage interface (Hexagonal Architecture)
// ============================================================

import { Workout } from "@/backend/domain/model/types";

export interface StorageLocalePort {
    salva(workoutId: string, workout: Workout): void;
    carica(workoutId: string): Workout | null;
    exists(workoutId: string): boolean;
    anomaliaRilevata(workoutId: string): boolean;
    elimina(workoutId: string): void;
}
