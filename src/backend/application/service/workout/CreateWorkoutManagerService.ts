// ============================================================
// CreateWorkoutManagerService
// Application layer – implements WorkoutManagementPort (UC3)
// Source: SDD section 3.2 / section 4.1 (Facade + Hexagonal)
// ============================================================

import { WorkoutManagementPort } from "@/backend/domain/port/in/WorkoutManagementPort";
import { WorkoutRepositoryPort } from "@/backend/domain/port/out/WorkoutRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { StorageLocalePort } from "@/backend/domain/port/out/StorageLocalePort";
import { Workout } from "@/backend/domain/model/types";
import { WorkoutStatoEnum } from "@/backend/domain/model/enums";

export class CreateWorkoutManagerService implements WorkoutManagementPort {
    constructor(
        private readonly workoutRepo: WorkoutRepositoryPort,
        private readonly notificationService: NotificationServicePort,
        private readonly storageLocale?: StorageLocalePort
    ) { }

    async pianificaSessione(
        userid: string,
        tipo: string,
        dataora: Date,
        durata: number,
        obiettivo?: string
    ): Promise<Workout> {
        if (!userid || !tipo || !dataora || durata <= 0) {
            throw new Error("Parametri non validi per pianificare la sessione.");
        }
        if (dataora <= new Date()) {
            throw new Error("dataora deve essere nel futuro.");
        }

        const workout = await this.workoutRepo.save({
            userid,
            tipo,
            dataora: dataora.toISOString(),
            durata,
            obiettivo,
            stato: WorkoutStatoEnum.PIANIFICATA,
            sorgente: "TRACKING",
        });

        // UC3: programma promemoria push 10 min prima
        const reminderTime = new Date(dataora.getTime() - 10 * 60 * 1000);
        await this.notificationService.programmaReminder(userid, reminderTime);

        return workout;
    }

    async terminaSessione(workoutId: string, percezione?: number, note?: string): Promise<Workout> {
        const exists = await this.workoutRepo.existsById(workoutId);
        if (!exists) throw new Error(`Workout ${workoutId} non trovato.`);

        return this.workoutRepo.update(workoutId, {
            stato: WorkoutStatoEnum.COMPLETATA_LOCALMENTE,
            percezionessforzo: percezione,
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

    async avviaSessione(workoutId: string): Promise<Workout> {
        return this.workoutRepo.update(workoutId, { stato: WorkoutStatoEnum.IN_CORSO });
    }

    async salvaSnapshot(workoutId: string, datiRimasti: Record<string, unknown>): Promise<void> {
        if (!this.storageLocale) return;
        // Crash recovery UC4
        const workout = await this.workoutRepo.findById(workoutId);
        if (workout) {
            this.storageLocale.salva(workoutId, { ...workout, percezionessforzo: 0, note: JSON.stringify(datiRimasti) });
        }
    }

    async importaAttivitaEsterna(userid: string, source: string, externalId: string, data: Partial<Workout>): Promise<Workout> {
        // UC5 External Import Deduplication spostata dal server a DB
        const duplicato = await this.workoutRepo.findByStravaId(externalId);
        if (duplicato) throw new Error("Attività già importata nel sistema.");

        return this.workoutRepo.save({
            ...data,
            userid,
            tipo: data.tipo ?? "ALTRO",
            dataora: data.dataora ?? new Date().toISOString(),
            durata: data.durata ?? 0,
            stato: WorkoutStatoEnum.CONSOLIDATA, // Already completed externally
            sorgente: "IMPORT",
            stravaid: externalId
        });
    }

    async getSessioniUtente(userid: string): Promise<Workout[]> {
        return this.workoutRepo.findByUserId(userid);
    }

    async getSessioniCoach(coachid: string): Promise<Workout[]> {
        return this.workoutRepo.findByCoachId(coachid);
    }
}
