// ============================================================
// CreateWorkoutManagerService
// Application layer – implements WorkoutManagementPort (UC3)
// Source: SDD section 3.2 / section 4.1 (Facade + Hexagonal)
// ============================================================

import { WorkoutManagementPort } from "@/domain/port/in/WorkoutManagementPort";
import { WorkoutRepositoryPort } from "@/domain/port/out/WorkoutRepositoryPort";
import { NotificationServicePort } from "@/domain/port/out/NotificationServicePort";
import { Workout } from "@/domain/model/types";
import { WorkoutStatoEnum } from "@/domain/model/enums";

export class CreateWorkoutManagerService implements WorkoutManagementPort {
    constructor(
        private readonly workoutRepo: WorkoutRepositoryPort,
        private readonly notificationService: NotificationServicePort
    ) { }

    async pianificaSessione(
        userId: string,
        tipo: string,
        dataOra: Date,
        durata: number,
        obiettivo?: string
    ): Promise<Workout> {
        if (!userId || !tipo || !dataOra || durata <= 0) {
            throw new Error("Parametri non validi per pianificare la sessione.");
        }
        if (dataOra <= new Date()) {
            throw new Error("dataOra deve essere nel futuro.");
        }

        const workout = await this.workoutRepo.save({
            userId,
            tipo,
            dataOra: dataOra.toISOString(),
            durata,
            obiettivo,
            stato: WorkoutStatoEnum.PIANIFICATA,
            sorgente: "TRACKING",
        });

        // UC3: programma promemoria push 10 min prima
        const reminderTime = new Date(dataOra.getTime() - 10 * 60 * 1000);
        await this.notificationService.programmaReminder(userId, reminderTime);

        return workout;
    }

    async terminaSessione(workoutId: string, percezione?: number, note?: string): Promise<Workout> {
        const exists = await this.workoutRepo.existsById(workoutId);
        if (!exists) throw new Error(`Workout ${workoutId} non trovato.`);

        return this.workoutRepo.update(workoutId, {
            stato: WorkoutStatoEnum.COMPLETATA_LOCALMENTE,
            percezionesSforzo: percezione,
            note,
        });
    }

    async recuperaSessione(workoutId: string): Promise<Workout> {
        const workout = await this.workoutRepo.findById(workoutId);
        if (!workout) throw new Error(`Workout ${workoutId} non trovato in locale.`);
        return { ...workout, stato: WorkoutStatoEnum.IN_CORSO };
    }

    async sincronizzaSessione(workoutId: string): Promise<void> {
        await this.workoutRepo.update(workoutId, { stato: WorkoutStatoEnum.CONSOLIDATA });
    }

    async getSessioniUtente(userId: string): Promise<Workout[]> {
        return this.workoutRepo.findByUserId(userId);
    }
}
