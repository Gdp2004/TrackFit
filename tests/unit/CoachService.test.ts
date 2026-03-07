/**
 * Unit Test – CreateCoachManagerService
 * Covers ALL methods:
 *   prenotaSlotCoach, confermaPagamentoPrenotazione,
 *   modificaPianoAtleta (R1 48h + R2 email),
 *   getRosterAtleti, rimuoviAtletaDalRoster,
 *   getProfiloCoach, aggiornaProfiloCoach,
 *   getCoachStats, getPrenotazioniCoach,
 *   getCoachesByStruttura, getTuttiCoachesWithDetails
 */
import { CreateCoachManagerService } from "@/backend/application/service/coach/CreateCoachManagerService";
import { mockDeep, mockReset } from "jest-mock-extended";
import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { PaymentGatewayPort } from "@/backend/domain/port/out/PaymentGatewayPort";
import { PaymentRepositoryPort } from "@/backend/domain/port/out/PaymentRepositoryPort";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";
import { CoachStats } from "@/backend/domain/model/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
const NOW = Date.now();
const IN_50H = new Date(NOW + 50 * 3600000).toISOString();
const IN_24H = new Date(NOW + 24 * 3600000).toISOString();
const IN_72H = new Date(NOW + 72 * 3600000);

const BASE_COACH = { id: "c1", userid: "u1", specializzazione: "Yoga", strutturaid: "gym-1", disponibilita: [] };
const BASE_USER = { id: "u1", email: "a@a.com", nome: "Mario", cognome: "Rossi", coachid: "c1" };
const BASE_STATS: CoachStats = { atleti_seguiti: 10, sessioni_oggi: 2, sessioni_mese: 20, rating_medio: 4.5 };
const BASE_PRENOT = { id: "p1", userid: "u1", coachid: "c1", dataora: IN_50H, stato: StatoPrenotazioneEnum.CONFERMATA, importototale: 50 };

// ── Suite ─────────────────────────────────────────────────────────────────────
describe("CreateCoachManagerService – All Methods", () => {
    const coachRepo = mockDeep<CoachRepositoryPort>();
    const userRepo = mockDeep<UserRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    const auditRepo = mockDeep<AuditLogRepositoryPort>();
    const paymentGateway = mockDeep<PaymentGatewayPort>();
    const paymentRepo = mockDeep<PaymentRepositoryPort>();
    let service: CreateCoachManagerService;

    beforeEach(() => {
        mockReset(coachRepo); mockReset(userRepo);
        mockReset(notificationService); mockReset(auditRepo);
        mockReset(paymentGateway); mockReset(paymentRepo);
        service = new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo, paymentGateway, paymentRepo);
        auditRepo.registra.mockResolvedValue(undefined);
    });

    // ── prenotaSlotCoach ──────────────────────────────────────────────────────
    describe("prenotaSlotCoach", () => {
        it("prenota slot senza pagamento gateway → stato CONFERMATA", async () => {
            const noPaySvc = new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo);
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            coachRepo.findPrenotazioniAttiveInIntervallo.mockResolvedValue([]);
            coachRepo.savePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.IN_ATTESA } as any);
            coachRepo.updatePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CONFERMATA } as any);

            const result = await noPaySvc.prenotaSlotCoach("u1", "c1", new Date(IN_50H), 60);
            expect(result.stato).toBe(StatoPrenotazioneEnum.CONFERMATA);
        });

        it("prenota slot con Stripe e restituisce clientSecret", async () => {
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            coachRepo.findPrenotazioniAttiveInIntervallo.mockResolvedValue([]);
            coachRepo.savePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.IN_ATTESA } as any);
            paymentGateway.creaIntentPagamento.mockResolvedValue({ id: "pi_1", clientSecret: "secret_123" });
            paymentRepo.save.mockResolvedValue({ id: "pay-1" } as any);

            const result = await service.prenotaSlotCoach("u1", "c1", new Date(IN_50H), 60);
            expect(result.clientSecret).toBe("secret_123");
            expect(paymentGateway.creaIntentPagamento).toHaveBeenCalled();
        });

        it("lancia errore se coach non trovato", async () => {
            coachRepo.findById.mockResolvedValue(null);
            await expect(service.prenotaSlotCoach("u1", "c999", new Date(IN_50H), 60))
                .rejects.toThrow("Coach non trovato");
        });

        it("lancia errore se slot già occupato (collisione)", async () => {
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            coachRepo.findPrenotazioniAttiveInIntervallo.mockResolvedValue([BASE_PRENOT] as any);
            await expect(service.prenotaSlotCoach("u1", "c1", new Date(IN_50H), 60))
                .rejects.toThrow("già parzialmente occupato");
        });

        it("lancia errore se dataora è nel passato", async () => {
            const past = new Date(Date.now() - 3600000);
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            await expect(service.prenotaSlotCoach("u1", "c1", past, 60))
                .rejects.toThrow("futuro");
        });
    });

    // ── confermaPagamentoPrenotazione ─────────────────────────────────────────
    describe("confermaPagamentoPrenotazione", () => {
        it("success=true → stato CONFERMATA", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
            coachRepo.updatePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CONFERMATA } as any);

            await service.confermaPagamentoPrenotazione("p1", true);
            expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { stato: StatoPrenotazioneEnum.CONFERMATA });
        });

        it("success=false → stato CANCELLATA", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
            coachRepo.updatePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CANCELLATA } as any);

            await service.confermaPagamentoPrenotazione("p1", false);
            expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { stato: StatoPrenotazioneEnum.CANCELLATA });
        });

        it("lancia errore se prenotazione non trovata", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(null);
            await expect(service.confermaPagamentoPrenotazione("p999", true)).rejects.toThrow("non trovata");
        });
    });

    // ── modificaPianoAtleta (R1 + R2) ─────────────────────────────────────────
    describe("modificaPianoAtleta", () => {
        it("R1: modifica con ≥48h rimanenti → successo", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any); // IN_50H
            coachRepo.updatePrenotazione.mockResolvedValue({} as any);
            coachRepo.saveAuditLog.mockResolvedValue(undefined);
            userRepo.findById.mockResolvedValue(BASE_USER as any);
            notificationService.inviaEmail.mockResolvedValue(undefined);
            notificationService.inviaNotificaRealtime.mockResolvedValue(undefined);

            await service.modificaPianoAtleta("c1", "p1", IN_72H, "Motivazione");
            expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { dataora: IN_72H.toISOString() });
            expect(auditRepo.registra).toHaveBeenCalledWith(expect.objectContaining({ azione: "MODIFICA_PIANO_ATLETA" }));
        });

        it("R1: blocca se restano <48h alla sessione", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue({ ...BASE_PRENOT, dataora: IN_24H } as any);
            await expect(service.modificaPianoAtleta("c1", "p1", IN_72H, "Motivo")).rejects.toThrow("R1");
        });

        it("R2: invia email + notifica realtime all'atleta", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
            coachRepo.updatePrenotazione.mockResolvedValue({} as any);
            coachRepo.saveAuditLog.mockResolvedValue(undefined);
            userRepo.findById.mockResolvedValue(BASE_USER as any);
            notificationService.inviaEmail.mockResolvedValue(undefined);
            notificationService.inviaNotificaRealtime.mockResolvedValue(undefined);

            await service.modificaPianoAtleta("c1", "p1", IN_72H, "Cambio orario");
            expect(notificationService.inviaEmail).toHaveBeenCalledWith("a@a.com", expect.any(String), expect.any(Object));
            expect(notificationService.inviaNotificaRealtime).toHaveBeenCalledWith("u1", expect.any(Object));
        });

        it("lancia errore se sessione non trovata", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(null);
            await expect(service.modificaPianoAtleta("c1", "p999", IN_72H, "Motivo")).rejects.toThrow("non trovata");
        });
    });

    // ── getRosterAtleti ───────────────────────────────────────────────────────
    describe("getRosterAtleti", () => {
        it("restituisce atleti del coach", async () => {
            userRepo.findByCoachId.mockResolvedValue([BASE_USER] as any);
            const result = await service.getRosterAtleti("c1");
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("u1");
        });

        it("restituisce array vuoto se nessun atleta", async () => {
            userRepo.findByCoachId.mockResolvedValue([]);
            const result = await service.getRosterAtleti("c1");
            expect(result).toHaveLength(0);
        });
    });

    // ── rimuoviAtletaDalRoster ────────────────────────────────────────────────
    describe("rimuoviAtletaDalRoster", () => {
        it("rimuove atleta e registra audit log", async () => {
            userRepo.findById.mockResolvedValue(BASE_USER as any);
            userRepo.update.mockResolvedValue({ ...BASE_USER, coachid: undefined } as any);

            await service.rimuoviAtletaDalRoster("c1", "u1");
            expect(userRepo.update).toHaveBeenCalledWith("u1", { coachid: undefined });
            expect(auditRepo.registra).toHaveBeenCalledWith(expect.objectContaining({ azione: "RIMOZIONE_ATLETA_ROSTER" }));
        });

        it("lancia errore se atleta non trovato", async () => {
            userRepo.findById.mockResolvedValue(null);
            await expect(service.rimuoviAtletaDalRoster("c1", "u999")).rejects.toThrow("non trovato");
        });

        it("lancia errore se atleta appartiene ad altro coach", async () => {
            userRepo.findById.mockResolvedValue({ ...BASE_USER, coachid: "altro-coach" } as any);
            await expect(service.rimuoviAtletaDalRoster("c1", "u1")).rejects.toThrow("non è nel tuo roster");
        });
    });

    // ── CRUD semplici ─────────────────────────────────────────────────────────
    describe("CRUD semplici", () => {
        it("getProfiloCoach – delega a coachRepo.findByUserId", async () => {
            coachRepo.findByUserId.mockResolvedValue(BASE_COACH as any);
            const result = await service.getProfiloCoach("u1");
            expect(result?.id).toBe("c1");
        });

        it("aggiornaProfiloCoach – aggiorna e restituisce", async () => {
            coachRepo.update.mockResolvedValue({ ...BASE_COACH, specializzazione: "Pilates" } as any);
            const result = await service.aggiornaProfiloCoach("c1", { specializzazione: "Pilates" });
            expect(result.specializzazione).toBe("Pilates");
        });

        it("getCoachStats – delega a coachRepo.getStats", async () => {
            coachRepo.getStats.mockResolvedValue(BASE_STATS);
            const result = await service.getCoachStats("c1");
            expect(result.atleti_seguiti).toBe(10);
            expect(result.rating_medio).toBe(4.5);
        });

        it("getPrenotazioniCoach – delega a coachRepo.findPrenotazioniByCoachId", async () => {
            coachRepo.findPrenotazioniByCoachId.mockResolvedValue([BASE_PRENOT] as any);
            const result = await service.getPrenotazioniCoach("c1");
            expect(result).toHaveLength(1);
        });

        it("getCoachesByStruttura – delega a coachRepo.findByStrutturaId", async () => {
            coachRepo.findByStrutturaId.mockResolvedValue([{ ...BASE_COACH, user: BASE_USER }] as any);
            const result = await service.getCoachesByStruttura("gym-1");
            expect(result).toHaveLength(1);
        });

        it("getTuttiCoachesWithDetails – delega a coachRepo.findAllWithUserDetails", async () => {
            coachRepo.findAllWithUserDetails.mockResolvedValue([{ ...BASE_COACH, user: BASE_USER }] as any);
            const result = await service.getTuttiCoachesWithDetails();
            expect(result).toHaveLength(1);
        });
    });
});
