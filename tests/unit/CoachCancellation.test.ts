import { CreateCoachManagerService } from "../../src/backend/application/service/coach/CreateCoachManagerService";
import { mockDeep } from "jest-mock-extended";
import { CoachRepositoryPort } from "../../src/backend/domain/port/out/CoachRepositoryPort";
import { UserRepositoryPort } from "../../src/backend/domain/port/out/UserRepositoryPort";
import { NotificationServicePort } from "../../src/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "../../src/backend/domain/port/out/AuditLogRepositoryPort";
import { StatoPrenotazioneEnum } from "../../src/backend/domain/model/enums";

describe("Coach Cancellation Logic", () => {
    const coachRepo = mockDeep<CoachRepositoryPort>();
    const userRepo = mockDeep<UserRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    const auditRepo = mockDeep<AuditLogRepositoryPort>();
    const service = new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo);

    const NOW = Date.now();
    const IN_50H = new Date(NOW + 50 * 3600000).toISOString();
    const IN_24H = new Date(NOW + 24 * 3600000).toISOString();
    const BASE_PRENOT = { id: "p1", userid: "u1", coachid: "c1", dataora: IN_50H, stato: StatoPrenotazioneEnum.CONFERMATA, importototale: 50 };
    const BASE_USER = { id: "u1", email: "atleta@test.com", nome: "Atleta", cognome: "Test" };

    it("should cancel session if > 48h and notify athlete", async () => {
        coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
        userRepo.findById.mockResolvedValue(BASE_USER as any);

        await service.annullaSessione("c1", "p1", "Impegno coach");

        expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { stato: StatoPrenotazioneEnum.CANCELLATA });
        expect(notificationService.inviaEmail).toHaveBeenCalledWith("atleta@test.com", expect.any(String), expect.any(Object));
        expect(notificationService.inviaNotificaRealtime).toHaveBeenCalledWith("u1", expect.objectContaining({ tipo: "annullamento_piano" }));
    });

    it("should throw error if session is < 48h away", async () => {
        coachRepo.findPrenotazioneById.mockResolvedValue({ ...BASE_PRENOT, dataora: IN_24H } as any);

        await expect(service.annullaSessione("c1", "p1", "Late cancel"))
            .rejects.toThrow("Vincolo R1");
    });
});
