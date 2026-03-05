// ============================================================
// Port/out – WorkoutRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// Implemented by WorkoutSupabaseAdapter
// ============================================================

import { Workout } from "@/backend/domain/model/types";
import { WorkoutStatoEnum } from "@/backend/domain/model/enums";

export interface WorkoutRepositoryPort {
    save(workout: Omit<Workout, "id">): Promise<Workout>;
    findById(id: string): Promise<Workout | null>;
    findByUserId(userid: string): Promise<Workout[]>;
    findByUserIdAndStato(userid: string, stato: WorkoutStatoEnum): Promise<Workout[]>;
    update(id: string, data: Partial<Workout>): Promise<Workout>;
    delete(id: string): Promise<void>;
    existsById(id: string): Promise<boolean>;
    findByStravaId(stravaid: string): Promise<Workout | null>;
    findByCoachId(coachid: string): Promise<Workout[]>;
}
