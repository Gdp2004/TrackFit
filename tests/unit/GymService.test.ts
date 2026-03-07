/**
 * Unit Test – CreateGymManagerService
 * Covers ALL methods: creaStruttura, creaCorso, cancellaCorso,
 * prenotaCorsoPalestra, cancellaPrenotazione, getCorsiStruttura,
 * aggiornaCorso, getStrutturaGestore, aggiornaStruttura,
 * getGestoreStats, getCoachesStruttura, creaTipoAbbonamento,
 * getTipiAbbonamento, eliminaTipoAbbonamento
 * 
 * Note: onboardCoach uses Supabase directly – tested in integration tests
 */

jest.mock("@/backend/infrastructure/config/supabase", () => ({
    createSupabaseServerClient: jest.fn(),
}));

import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { mockDeep, mockReset } from "jest-mock-extended";
import { GymRepositoryPort } from "@/backend/domain/port/out/GymRepositoryPort";
import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { StatoAbbonamentoEnum, StatoPrenotazioneEnum } from "@/backend/domain/model/enums";

const NOW = new Date();
const FUTURE = new Date(NOW.getTime() + 86400000 * 3).toISOString(); // +3 giorni

const BASE_STRUTTURA = { id: "gym-1", piva: "12345678901", cun: "CUN001", denominazione: "Palestra Test", indirizzo: "Via Roma 1", gestoreid: "g1", stato: "Attiva" };
const BASE_CORSO = { id: "c1", strutturaid: "gym-1", nome: "Yoga", dataora: FUTURE, posti: 10, postioccupati: 0, durataMinuti: 60 };
const BASE_SUB = { id: "sub-1", userid: "u1", tipoid: "t1", strutturaid: "gym-1", stato: StatoAbbonamentoEnum.ATTIVO, datafine: FUTURE };
const BASE_PRENOT = { id: "p1", userid: "u1", corsoid: "c1", strutturaid: "gym-1", dataora: FUTURE, stato: StatoPrenotazioneEnum.CONFERMATA, importototale: 0 };

describe("CreateGymManagerService – All Methods", () => {
    const gymRepo = mockDeep<GymRepositoryPort>();
    const subRepo = mockDeep<SubscriptionRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    const auditRepo = mockDeep<AuditLogRepositoryPort>();
    const coachRepo = mockDeep<CoachRepositoryPort>();
    let service: CreateGymManagerService;

    beforeEach(() => {
        mockReset(gymRepo); mockReset(subRepo);
        mockReset(notificationService); mockReset(auditRepo); mockReset(coachRepo);
        service = new CreateGymManagerService(gymRepo, subRepo, notificationService, auditRepo, coachRepo);
        auditRepo.registra.mockResolvedValue(undefined);
    });

    // ── creaStruttura ─────────────────────────────────────────────────────────
    describe("creaStruttura", () => {
        it("crea struttura quando P.IVA e CUN sono liberi e nessun fuzzy match", async () => {
            gymRepo.existsStrutturaByPivaOrCun.mockResolvedValue(false);
            gymRepo.matchStruttureFuzzy.mockResolvedValue([]);
            gymRepo.saveStruttura.mockResolvedValue(BASE_STRUTTURA as any);

            const result = await service.creaStruttura("12345678901", "CUN001", "Palestra Test", "Via Roma 1", "g1");

            expect(result.id).toBe("gym-1");
            expect(auditRepo.registra).toHaveBeenCalledWith(expect.objectContaining({ azione: "CREAZIONE_STRUTTURA" }));
        });

        it("lancia R8 se P.IVA o CUN già registrati", async () => {
            gymRepo.existsStrutturaByPivaOrCun.mockResolvedValue(true);
            await expect(service.creaStruttura("12345678901", "CUN001", "X", "Y", "g1"))
                .rejects.toThrow("R8");
        });

        it("lancia R9 se denominazione troppo simile a esistente", async () => {
            gymRepo.existsStrutturaByPivaOrCun.mockResolvedValue(false);
            gymRepo.matchStruttureFuzzy.mockResolvedValue([BASE_STRUTTURA] as any);

            await expect(service.creaStruttura("00000000000", "NEW", "Palestra Test", "Via Diversa", "g1"))
                .rejects.toThrow("R9");
        });
    });

    // ── creaCorso ─────────────────────────────────────────────────────────────
    describe("creaCorso", () => {
        it("crea e restituisce il corso", async () => {
            gymRepo.saveCorso.mockResolvedValue(BASE_CORSO as any);
            const result = await service.creaCorso({ strutturaid: "gym-1", nome: "Yoga", dataora: FUTURE, posti: 10, durataMinuti: 60 } as any);
            expect(result.id).toBe("c1");
            expect(gymRepo.saveCorso).toHaveBeenCalled();
        });
    });

    // ── cancellaCorso ─────────────────────────────────────────────────────────
    describe("cancellaCorso", () => {
        it("cancella corso e notifica iscritti", async () => {
            gymRepo.findCorsoById.mockResolvedValue(BASE_CORSO as any);
            gymRepo.findUserIdsByCorsoId.mockResolvedValue(["u1"]);
            gymRepo.findUserIdsInListaAttesa.mockResolvedValue(["u2"]);
            gymRepo.deleteCorso.mockResolvedValue(undefined);
            notificationService.inviaNotificaRealtime.mockResolvedValue(undefined);

            await service.cancellaCorso("c1", "g1");

            expect(gymRepo.deleteCorso).toHaveBeenCalledWith("c1");
            expect(notificationService.inviaNotificaRealtime).toHaveBeenCalledTimes(2);
        });

        it("lancia errore se corso non trovato", async () => {
            gymRepo.findCorsoById.mockResolvedValue(null);
            await expect(service.cancellaCorso("c999", "g1")).rejects.toThrow("non trovato");
        });
    });

    // ── prenotaCorsoPalestra ──────────────────────────────────────────────────
    describe("prenotaCorsoPalestra", () => {
        it("prenota corso con abbonamento attivo e posto disponibile", async () => {
            gymRepo.findCorsoById.mockResolvedValue(BASE_CORSO as any);
            subRepo.findByUserIdActive.mockResolvedValue(BASE_SUB as any);
            gymRepo.findPrenotazioneByUtenteAndCorso.mockResolvedValue(null);
            gymRepo.incrementaPostiOccupati.mockResolvedValue(true);
            gymRepo.savePrenotazioneCorso.mockResolvedValue(BASE_PRENOT as any);

            const result = await service.prenotaCorsoPalestra("u1", "c1");
            expect(result.stato).toBe(StatoPrenotazioneEnum.CONFERMATA);
        });

        it("lancia errore se corso non trovato", async () => {
            gymRepo.findCorsoById.mockResolvedValue(null);
            await expect(service.prenotaCorsoPalestra("u1", "c999")).rejects.toThrow("Corso non trovato");
        });

        it("lancia FR8 se abbonamento non attivo", async () => {
            gymRepo.findCorsoById.mockResolvedValue(BASE_CORSO as any);
            subRepo.findByUserIdActive.mockResolvedValue(null);
            await expect(service.prenotaCorsoPalestra("u1", "c1")).rejects.toThrow("FR8");
        });

        it("lancia errore se già prenotato", async () => {
            gymRepo.findCorsoById.mockResolvedValue(BASE_CORSO as any);
            subRepo.findByUserIdActive.mockResolvedValue(BASE_SUB as any);
            gymRepo.findPrenotazioneByUtenteAndCorso.mockResolvedValue(BASE_PRENOT as any);
            await expect(service.prenotaCorsoPalestra("u1", "c1")).rejects.toThrow("già una prenotazione");
        });

        it("mette in lista d'attesa se posto non disponibile", async () => {
            gymRepo.findCorsoById.mockResolvedValue(BASE_CORSO as any);
            subRepo.findByUserIdActive.mockResolvedValue(BASE_SUB as any);
            gymRepo.findPrenotazioneByUtenteAndCorso.mockResolvedValue(null);
            gymRepo.incrementaPostiOccupati.mockResolvedValue(false);
            gymRepo.addToListaAttesa.mockResolvedValue({ userid: "u1", corsoid: "c1", posizione: 1 } as any);
            notificationService.inviaNotificaRealtime.mockResolvedValue(undefined);

            await expect(service.prenotaCorsoPalestra("u1", "c1")).rejects.toThrow("lista d'attesa");
            expect(gymRepo.addToListaAttesa).toHaveBeenCalled();
        });
    });

    // ── cancellaPrenotazione ──────────────────────────────────────────────────
    describe("cancellaPrenotazione", () => {
        it("cancella prenotazione senza penale se > 24h", async () => {
            gymRepo.findPrenotazioneCorsoById.mockResolvedValue(BASE_PRENOT as any);
            gymRepo.savePrenotazioneCorso.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CANCELLATA } as any);
            gymRepo.decrementaPostiOccupati.mockResolvedValue(undefined);
            gymRepo.popFromListaAttesa.mockResolvedValue(null);

            await service.cancellaPrenotazione("p1");
            expect(gymRepo.savePrenotazioneCorso).toHaveBeenCalledWith(
                expect.objectContaining({ stato: StatoPrenotazioneEnum.CANCELLATA })
            );
        });

        it("applica penale 50% se cancellazione entro 24h", async () => {
            const soon = new Date(Date.now() + 3600000).toISOString(); // +1 ora
            gymRepo.findPrenotazioneCorsoById.mockResolvedValue({ ...BASE_PRENOT, dataora: soon, importototale: 100 } as any);
            gymRepo.savePrenotazioneCorso.mockResolvedValue({ ...BASE_PRENOT, rimborso: 50 } as any);
            gymRepo.decrementaPostiOccupati.mockResolvedValue(undefined);
            gymRepo.popFromListaAttesa.mockResolvedValue(null);

            await service.cancellaPrenotazione("p1");
            expect(gymRepo.savePrenotazioneCorso).toHaveBeenCalledWith(
                expect.objectContaining({ rimborso: 50 }) // 50% di 100
            );
        });

        it("promuove prossimo in lista d'attesa quando libera posto", async () => {
            gymRepo.findPrenotazioneCorsoById.mockResolvedValue(BASE_PRENOT as any);
            gymRepo.savePrenotazioneCorso.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CANCELLATA } as any);
            gymRepo.decrementaPostiOccupati.mockResolvedValue(undefined);
            gymRepo.popFromListaAttesa.mockResolvedValue({ userid: "u2", corsoid: "c1", posizione: 1 } as any);
            gymRepo.incrementaPostiOccupati.mockResolvedValue(true);
            notificationService.inviaNotificaRealtime.mockResolvedValue(undefined);

            await service.cancellaPrenotazione("p1");
            expect(notificationService.inviaNotificaRealtime).toHaveBeenCalledWith("u2", expect.anything());
        });

        it("lancia errore se prenotazione non trovata", async () => {
            gymRepo.findPrenotazioneCorsoById.mockResolvedValue(null);
            await expect(service.cancellaPrenotazione("p999")).rejects.toThrow("non trovata");
        });
    });

    // ── Metodi semplici (delegano al repo) ───────────────────────────────────
    describe("Metodi CRUD semplici", () => {
        it("getCorsiStruttura – delega a gymRepo.findCorsiByStrutturaId", async () => {
            gymRepo.findCorsiByStrutturaId.mockResolvedValue([BASE_CORSO] as any);
            const result = await service.getCorsiStruttura("gym-1");
            expect(result).toHaveLength(1);
        });

        it("aggiornaCorso – delega a gymRepo.updateCorso", async () => {
            gymRepo.updateCorso.mockResolvedValue({ ...BASE_CORSO, nome: "Pilates" } as any);
            const result = await service.aggiornaCorso("c1", { nome: "Pilates" });
            expect(result.nome).toBe("Pilates");
        });

        it("getStrutturaGestore – restituisce la struttura del gestore", async () => {
            gymRepo.findStrutturaByGestoreId.mockResolvedValue(BASE_STRUTTURA as any);
            const result = await service.getStrutturaGestore("g1");
            expect(result?.id).toBe("gym-1");
        });

        it("aggiornaStruttura – aggiorna i dati della struttura", async () => {
            gymRepo.updateStruttura.mockResolvedValue({ ...BASE_STRUTTURA, denominazione: "Nuova" } as any);
            const result = await service.aggiornaStruttura("gym-1", { denominazione: "Nuova" });
            expect(result.denominazione).toBe("Nuova");
        });

        it("getGestoreStats – delega a gymRepo.getStats", async () => {
            gymRepo.getStats.mockResolvedValue({ abbonamenti_attivi: 5 } as any);
            const result = await service.getGestoreStats("gym-1");
            expect(result.abbonamenti_attivi).toBe(5);
        });

        it("getCoachesStruttura – delega a coachRepo.findByStrutturaId", async () => {
            coachRepo.findByStrutturaId.mockResolvedValue([{ id: "coach-1" }] as any);
            const result = await service.getCoachesStruttura("gym-1");
            expect(result).toHaveLength(1);
        });

        it("creaTipoAbbonamento – crea un tipo abbonamento", async () => {
            gymRepo.saveTipoAbbonamento.mockResolvedValue({ id: "t1", nome: "Mensile" } as any);
            const result = await service.creaTipoAbbonamento({ nome: "Mensile" } as any);
            expect(result.id).toBe("t1");
        });

        it("getTipiAbbonamento – lista tipi abbonamento", async () => {
            gymRepo.findTipiAbbonamentoByStrutturaId.mockResolvedValue([{ id: "t1" }] as any);
            const result = await service.getTipiAbbonamento("gym-1");
            expect(result).toHaveLength(1);
        });

        it("eliminaTipoAbbonamento – elimina tipo", async () => {
            gymRepo.deleteTipoAbbonamento.mockResolvedValue(undefined);
            await service.eliminaTipoAbbonamento("t1");
            expect(gymRepo.deleteTipoAbbonamento).toHaveBeenCalledWith("t1");
        });
    });
});
