/**
 * Unit Test – CreateWorkoutManagerService
 * TC_6: Modifica sessione (data nel futuro)
 * TC_9: Pianificazione sessione con promemoria push -10 min
 */
import { CreateWorkoutManagerService } from "@/backend/application/service/workout/CreateWorkoutManagerService";
import { mockDeep, mockReset } from "jest-mock-extended";
import { WorkoutRepositoryPort } from "@/backend/domain/port/out/WorkoutRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { WorkoutStatoEnum } from "@/backend/domain/model/enums";

describe("CreateWorkoutManagerService – Sessioni (TC_5, TC_6, TC_9)", () => {
    const workoutRepo = mockDeep<WorkoutRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    let service: CreateWorkoutManagerService;

    const FUTURE = new Date(Date.now() + 86400000 * 2); // +2 giorni

    const BASE_W = {
        id: "w1", userid: "u1", tipo: "PALESTRA",
        dataora: FUTURE.toISOString(), durata: 60,
        stato: WorkoutStatoEnum.PIANIFICATA, sorgente: "TRACKING" as const,
    };

    beforeEach(() => {
        mockReset(workoutRepo);
        mockReset(notificationService);
        service = new CreateWorkoutManagerService(workoutRepo, notificationService);
    });

    // ── TC_9: Pianificazione ──────────────────────────────────────────────────
    describe("pianificaSessione (TC_9)", () => {
        it("TC_9.1 – pianifica sessione futura e schedula reminder -10 min", async () => {
            workoutRepo.save.mockResolvedValue(BASE_W as any);
            notificationService.programmaReminder.mockResolvedValue(undefined);

            await service.pianificaSessione("u1", "PALESTRA", FUTURE, 60);

            expect(workoutRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ userid: "u1", stato: WorkoutStatoEnum.PIANIFICATA })
            );
            expect(notificationService.programmaReminder).toHaveBeenCalledWith(
                "u1", new Date(FUTURE.getTime() - 10 * 60 * 1000)
            );
        });

        it("TC_9.2 – data nel passato → errore", async () => {
            const past = new Date(Date.now() - 3600000);
            await expect(service.pianificaSessione("u1", "CORSA", past, 30))
                .rejects.toThrow("dataora deve essere nel futuro.");
        });

        it("TC_9.3 – durata 0 → errore", async () => {
            await expect(service.pianificaSessione("u1", "CORSA", FUTURE, 0))
                .rejects.toThrow("Parametri non validi");
        });

        it("TC_9.4 – userid vuoto → errore", async () => {
            await expect(service.pianificaSessione("", "CORSA", FUTURE, 30))
                .rejects.toThrow("Parametri non validi");
        });
    });

    // ── TC_6: Modifica data ───────────────────────────────────────────────────
    describe("aggiornaDataOra (TC_6)", () => {
        it("TC_6.1 – data futura accettata", async () => {
            const nuova = new Date(Date.now() + 86400000 * 3);
            workoutRepo.update.mockResolvedValue({ ...BASE_W, dataora: nuova.toISOString() } as any);

            const result = await service.aggiornaDataOra("w1", nuova);
            expect(workoutRepo.update).toHaveBeenCalledWith("w1", { dataora: nuova.toISOString() });
            expect(result.dataora).toBe(nuova.toISOString());
        });

        it("TC_6.2 – data nel passato → errore (preavviso non rispettato)", async () => {
            const past = new Date(Date.now() - 3600000);
            await expect(service.aggiornaDataOra("w1", past))
                .rejects.toThrow("La nuova data deve essere nel futuro.");
        });
    });

    // ── TC_5 (parziale): Terminazione ────────────────────────────────────────
    describe("terminaSessione (TC_5)", () => {
        it("TC_5.1 – termina sessione esistente", async () => {
            workoutRepo.existsById.mockResolvedValue(true);
            workoutRepo.update.mockResolvedValue({ ...BASE_W, stato: WorkoutStatoEnum.COMPLETATA_LOCALMENTE } as any);

            await service.terminaSessione("w1", 7, "Ottima sessione");

            expect(workoutRepo.update).toHaveBeenCalledWith("w1", {
                stato: WorkoutStatoEnum.COMPLETATA_LOCALMENTE,
                percezionessforzo: 7,
                note: "Ottima sessione",
            });
        });

        it("TC_5.2 – sessione non esistente → errore", async () => {
            workoutRepo.existsById.mockResolvedValue(false);
            await expect(service.terminaSessione("not-found"))
                .rejects.toThrow("non trovato");
        });
    });
});
