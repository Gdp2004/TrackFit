/**
 * Unit Test – CreateWorkoutManagerService
 * TC_6: Modifica sessione coach (data nel futuro, preavviso implicito)
 * TC_9: Pianificazione sessione con promemoria push -10 min
 */
import { CreateWorkoutManagerService } from "./CreateWorkoutManagerService";
import { mockDeep, mockReset } from "jest-mock-extended";
import { WorkoutRepositoryPort } from "@/backend/domain/port/out/WorkoutRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { WorkoutStatoEnum } from "@/backend/domain/model/enums";

describe("CreateWorkoutManagerService", () => {
    const workoutRepo = mockDeep<WorkoutRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    let service: CreateWorkoutManagerService;

    const FUTURE_DATE = new Date(Date.now() + 86400000 * 2); // +2 giorni

    const BASE_WORKOUT = {
        id: "w1",
        userid: "u1",
        tipo: "PALESTRA",
        dataora: FUTURE_DATE.toISOString(),
        durata: 60,
        stato: WorkoutStatoEnum.PIANIFICATA,
        sorgente: "TRACKING" as const,
    };

    beforeEach(() => {
        mockReset(workoutRepo);
        mockReset(notificationService);
        service = new CreateWorkoutManagerService(workoutRepo, notificationService);
    });

    // ─── TC_9: Pianificazione sessione con promemoria ─────────────────────────
    describe("pianificaSessione (TC_9)", () => {
        it("TC_9.1 – pianifica sessione futura e schedula reminder a -10 min", async () => {
            workoutRepo.save.mockResolvedValue(BASE_WORKOUT as any);
            notificationService.programmaReminder.mockResolvedValue(undefined);

            await service.pianificaSessione("u1", "PALESTRA", FUTURE_DATE, 60);

            expect(workoutRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ userid: "u1", tipo: "PALESTRA", stato: WorkoutStatoEnum.PIANIFICATA })
            );

            // Verifica che il reminder sia schedulato esattamente 10 minuti prima
            const expectedReminder = new Date(FUTURE_DATE.getTime() - 10 * 60 * 1000);
            expect(notificationService.programmaReminder).toHaveBeenCalledWith("u1", expectedReminder);
        });

        it("TC_9.2 – rifiuta sessione con data nel passato → errore", async () => {
            const pastDate = new Date(Date.now() - 3600000); // 1 ora fa
            await expect(service.pianificaSessione("u1", "CORSA", pastDate, 30))
                .rejects.toThrow("dataora deve essere nel futuro.");
        });

        it("TC_9.3 – rifiuta parametri non validi (durata 0) → errore", async () => {
            await expect(service.pianificaSessione("u1", "CORSA", FUTURE_DATE, 0))
                .rejects.toThrow("Parametri non validi per pianificare la sessione.");
        });

        it("TC_9.4 – rifiuta userid vuoto → errore", async () => {
            await expect(service.pianificaSessione("", "CORSA", FUTURE_DATE, 30))
                .rejects.toThrow("Parametri non validi per pianificare la sessione.");
        });
    });

    // ─── TC_6: Modifica data sessione (aggiornaDataOra) ──────────────────────
    describe("aggiornaDataOra (TC_6)", () => {
        it("TC_6.1 – aggiorna data sessione a data futura con successo", async () => {
            const nuovaData = new Date(Date.now() + 86400000 * 3); // +3 giorni
            workoutRepo.update.mockResolvedValue({ ...BASE_WORKOUT, dataora: nuovaData.toISOString() } as any);

            const result = await service.aggiornaDataOra("w1", nuovaData);

            expect(workoutRepo.update).toHaveBeenCalledWith("w1", { dataora: nuovaData.toISOString() });
            expect(result.dataora).toBe(nuovaData.toISOString());
        });

        it("TC_6.2 – rifiuta modifica a data nel passato → errore (TC_6: preavviso obbligatorio)", async () => {
            const pastDate = new Date(Date.now() - 3600000);
            await expect(service.aggiornaDataOra("w1", pastDate))
                .rejects.toThrow("La nuova data deve essere nel futuro.");
        });
    });

    // ─── TC_5 (parziale): Terminazione sessione ───────────────────────────────
    describe("terminaSessione (TC_5 partial)", () => {
        it("TC_5.1 – termina sessione esistente correttamente", async () => {
            workoutRepo.existsById.mockResolvedValue(true);
            workoutRepo.update.mockResolvedValue({
                ...BASE_WORKOUT, stato: WorkoutStatoEnum.COMPLETATA_LOCALMENTE,
            } as any);

            const result = await service.terminaSessione("w1", 7, "Ottima sessione");

            expect(workoutRepo.update).toHaveBeenCalledWith("w1", {
                stato: WorkoutStatoEnum.COMPLETATA_LOCALMENTE,
                percezionessforzo: 7,
                note: "Ottima sessione",
            });
        });

        it("TC_5.2 – errore se sessione non trovata", async () => {
            workoutRepo.existsById.mockResolvedValue(false);
            await expect(service.terminaSessione("not-found"))
                .rejects.toThrow("non trovato");
        });
    });
});
