// ============================================================
// Port/in – WorkoutManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.2
// ============================================================

import { Workout } from "@/backend/domain/model/types";

export interface WorkoutManagementPort {
    /**
     * UC3 – Pianifica una nuova sessione di allenamento.
     * Il sistema programma un push-reminder 10 minuti prima.
     */
    pianificaSessione(
        userid: string,
        tipo: string,
        dataora: Date,
        durata: number,
        obiettivo?: string
    ): Promise<Workout>;

    /** UC4 – Termina una sessione attiva e salva in locale. */
    terminaSessione(
        workoutId: string,
        percezione?: number,
        note?: string
    ): Promise<Workout>;

    /** UC4 alt – Recupera sessione dopo crash del dispositivo. */
    recuperaSessione(workoutId: string): Promise<Workout>;

    /** UC5 – Sincronizza sessione locale con il backend Supabase. */
    sincronizzaSessione(workoutId: string): Promise<void>;

    getSessioniUtente(userid: string): Promise<Workout[]>;

    getSessioniCoach(coachid: string): Promise<Workout[]>;
}
