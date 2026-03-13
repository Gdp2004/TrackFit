/**
 * Test unitari sul servizio CreateCoachManagerService.
 * Qui andiamo a testare a fondo tutte le casistiche previste per la gestione dei coach:
 *  - Prenotazioni slot con e senza Stripe
 *  - Conferma o annullamento pagamento
 *  - Modifica orari da parte del coach (con check sulle 48h di preavviso)
 *  - Lettura e rimozione atleti dal roster associato
 *  - Gestione CRUD di base per il profilo del coach e relative stats
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

// ── Helpers & Test Data ───────────────────────────────────────────────────────
// Usiamo dei timestamp dinamici basati sull'orario corrente per evitare test friabili (flaky)
const NOW = Date.now();
const IN_50H = new Date(NOW + 50 * 3600000).toISOString();
const IN_24H = new Date(NOW + 24 * 3600000).toISOString();
const IN_72H = new Date(NOW + 72 * 3600000);

// Oggetti "finti" di base validi per la maggior parte dei test
const BASE_COACH = { id: "c1", userid: "u1", specializzazione: "Yoga", strutturaid: "gym-1", disponibilita: [] };
const BASE_USER = { id: "u1", email: "a@a.com", nome: "Mario", cognome: "Rossi", coachid: "c1" };
const BASE_STATS: CoachStats = { atleti_seguiti: 10, sessioni_oggi: 2, sessioni_mese: 20, rating_medio: 4.5 };
const BASE_PRENOT = { id: "p1", userid: "u1", coachid: "c1", dataora: IN_50H, stato: StatoPrenotazioneEnum.CONFERMATA, importototale: 50 };

// ── Suite Principale ──────────────────────────────────────────────────────────
describe("CreateCoachManagerService – Metodi principali", () => {
    // Predisponiamo i mock di tutte le dipendenze verso l'esterno
    const coachRepo = mockDeep<CoachRepositoryPort>();
    const userRepo = mockDeep<UserRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    const auditRepo = mockDeep<AuditLogRepositoryPort>();
    const paymentGateway = mockDeep<PaymentGatewayPort>();
    const paymentRepo = mockDeep<PaymentRepositoryPort>();
    let service: CreateCoachManagerService;

    // Reset dei mock prima di ogni esecuzione per evitare che le asserzioni di un test inquinino gli altri
    beforeEach(() => {
        mockReset(coachRepo); mockReset(userRepo);
        mockReset(notificationService); mockReset(auditRepo);
        mockReset(paymentGateway); mockReset(paymentRepo);
        
        service = new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo, paymentGateway, paymentRepo);
        
        // Risolutori fittizi standard per far scorrere la logica se non c'e' roba complessa
        auditRepo.registra.mockResolvedValue(undefined);
        userRepo.findById.mockResolvedValue(null);
        notificationService.inviaNotificaRealtime.mockResolvedValue(undefined);
    });

    // ── prenotaSlotCoach ──────────────────────────────────────────────────────
    describe("prenotaSlotCoach", () => {
        it("dovrebbe prenotare lo slot aggirando il pagamento e settare subito lo stato su CONFERMATA", async () => {
            // Istanzio un servizio ad-hoc senza includere i gateway pagamenti, in ottica di test "pacchetto free"
            const noPaySvc = new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo);
            
            // Fingo l'esistenza del coach richiesto e verifico che non ci siano intoppi col calendario
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            coachRepo.findPrenotazioniAttiveInIntervallo.mockResolvedValue([]);
            coachRepo.savePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.IN_ATTESA } as any);
            coachRepo.updatePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CONFERMATA } as any);

            const result = await noPaySvc.prenotaSlotCoach("u1", "c1", new Date(IN_50H), 60);
            
            // Il check di idratazione ci conferma che l'assenza gateway garantisca validazione immediata
            expect(result.stato).toBe(StatoPrenotazioneEnum.CONFERMATA); 
        });

        it("dovrebbe passare il transato formale a Stripe e passarti in automatico il clientSecret", async () => {
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            coachRepo.findPrenotazioniAttiveInIntervallo.mockResolvedValue([]);
            coachRepo.savePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.IN_ATTESA } as any);
            
            // Simulo il momento d'oro in cui Stripe mi dice che la sessionazione intento pag. va a buon fine
            paymentGateway.creaIntentPagamento.mockResolvedValue({ id: "pi_1", clientSecret: "secret_123" });
            paymentRepo.save.mockResolvedValue({ id: "pay-1" } as any);

            const result = await service.prenotaSlotCoach("u1", "c1", new Date(IN_50H), 60);
            
            // Appuro che il pass-through della secret arrivi senza manipolazioni fino a frontend
            expect(result.clientSecret).toBe("secret_123"); 
            expect(paymentGateway.creaIntentPagamento).toHaveBeenCalled();
        });

        it("dovrebbe sbroccarsela se si accorge l'id del coach è farlocco", async () => {
            coachRepo.findById.mockResolvedValue(null); // restituisci un bel niente
            
            // Mi aspetto il botto palese su questo promise all'invocazione
            await expect(service.prenotaSlotCoach("u1", "c999", new Date(IN_50H), 60))
                .rejects.toThrow("Coach non trovato");
        });

        it("dovrebbe fermare tutto se incrociando l'agenda del tizio emerge sovrapposizione d'orari", async () => {
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            // Ci dice il dB mockato che l'invervallo ha già una tupla prenotata
            coachRepo.findPrenotazioniAttiveInIntervallo.mockResolvedValue([BASE_PRENOT] as any);
            
            await expect(service.prenotaSlotCoach("u1", "c1", new Date(IN_50H), 60))
                .rejects.toThrow("già parzialmente occupato");
        });

        it("dovrebbe buttare fuori gli orari passatisti prima un eventuale salvataggio", async () => {
            // Sfalso di un colpo l'ora indietro del giorno di un'unità, creiamo un caso da macchina del tempo
            const past = new Date(Date.now() - 3600000);
            coachRepo.findById.mockResolvedValue(BASE_COACH as any);
            
            await expect(service.prenotaSlotCoach("u1", "c1", past, 60))
                .rejects.toThrow("futuro");
        });
    });

    // ── confermaPagamentoPrenotazione ─────────────────────────────────────────
    describe("confermaPagamentoPrenotazione", () => {
        it("dovrebbe validare il pending a CONFERMATA sentendo Stripe", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
            coachRepo.updatePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CONFERMATA } as any);

            await service.confermaPagamentoPrenotazione("p1", true); // successo manuale per il test
            // Assicuro la chiamata pulita al mock update
            expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { stato: StatoPrenotazioneEnum.CONFERMATA });
        });

        it("dovrebbe tirare giù il deal in CANCELLATA se il cash faila", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
            coachRepo.updatePrenotazione.mockResolvedValue({ ...BASE_PRENOT, stato: StatoPrenotazioneEnum.CANCELLATA } as any);

            await service.confermaPagamentoPrenotazione("p1", false); // falso d'autore sul pagato
            expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { stato: StatoPrenotazioneEnum.CANCELLATA });
        });

        it("dovrebbe stoppare a monte il tentativo se la prenotazione è sparita dal database", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(null);
            await expect(service.confermaPagamentoPrenotazione("p999", true)).rejects.toThrow("non trovata");
        });
    });

    // ── modificaPianoAtleta (R1 + R2) ─────────────────────────────────────────
    describe("modificaPianoAtleta", () => {
        it("dovrebbe far scivolare senza problemi il cambio se fatto con larghissimo preavviso", async () => {
            // Fingo di avere una prenotazione base che avverra in futuro remoto 
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any); 
            coachRepo.updatePrenotazione.mockResolvedValue({} as any);
            coachRepo.saveAuditLog.mockResolvedValue(undefined);
            userRepo.findById.mockResolvedValue(BASE_USER as any);
            notificationService.inviaEmail.mockResolvedValue(undefined);

            // Sposto spudoratamente da 50h a 72h 
            await service.modificaPianoAtleta("c1", "p1", IN_72H, "Motivi aziendali");
            
            // Aspettativa di verifica sull'avvenuto cambio nel Db e tracking audit
            expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { dataora: IN_72H.toISOString() });
            expect(auditRepo.registra).toHaveBeenCalledWith(expect.objectContaining({ azione: "MODIFICA_PIANO_ATLETA" }));
        });

        it("R1: fa muro di gomma stroncando tentativi di modifica vicini alle 48 ore classiche", async () => {
            // Mettiamogli fretta settandolo a IN_24H da adesso 
            coachRepo.findPrenotazioneById.mockResolvedValue({ ...BASE_PRENOT, dataora: IN_24H } as any);
            await expect(service.modificaPianoAtleta("c1", "p1", IN_72H, "Emergenza di un oretta"))
                .rejects.toThrow("R1");
        });

        it("R2: se passa la variazione di orario, l'atleta dev'essere spammato subito per avvisarlo del disagio", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
            coachRepo.updatePrenotazione.mockResolvedValue({} as any);
            coachRepo.saveAuditLog.mockResolvedValue(undefined);
            userRepo.findById.mockResolvedValue(BASE_USER as any);
            notificationService.inviaEmail.mockResolvedValue(undefined);

            // Trigger logica servizio 
            await service.modificaPianoAtleta("c1", "p1", IN_72H, "Cambio dell'ultimo minuto");
            
            // Check esplicito per assicurarsi che nessuno salti la chiamata al port adapter per mail+push
            expect(notificationService.inviaEmail).toHaveBeenCalledWith("a@a.com", expect.any(String), expect.any(Object));
            expect(notificationService.inviaNotificaRealtime).toHaveBeenCalledWith("u1", expect.any(Object));
        });

        it("esplode lanciando uno skip se cerchi variazioni su turni spariti e irreperibili", async () => {
            coachRepo.findPrenotazioneById.mockResolvedValue(null);
            await expect(service.modificaPianoAtleta("c1", "p999", IN_72H, "Fancazzismo scusanto")).rejects.toThrow("non trovata");
        });
    });

    // ── getRosterAtleti & rimuoviAtletaDalRoster ──────────────────────────────
    describe("Gestione Roster e Dissociazioni", () => {
        it("getRosterAtleti - pesca dal cappello la carrellata degli allievi agganciati", async () => {
            userRepo.findByCoachId.mockResolvedValue([BASE_USER] as any);
            const result = await service.getRosterAtleti("c1");
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("u1");
        });

        it("getRosterAtleti - non rompe con array isNull ma mi rilascia un sano array sbiancato (0 length)", async () => {
            userRepo.findByCoachId.mockResolvedValue([]);
            const result = await service.getRosterAtleti("c1");
            expect(result).toHaveLength(0);
        });

        it("rimuoviAtletaDalRoster - spacca e distrugge il collegamento utente annullandolo al nullo", async () => {
            userRepo.findById.mockResolvedValue(BASE_USER as any);
            userRepo.update.mockResolvedValue({ ...BASE_USER, coachid: undefined } as any);

            await service.rimuoviAtletaDalRoster("c1", "u1");
            
            // Sicurezze del database che fa null cascade 
            expect(userRepo.update).toHaveBeenCalledWith("u1", { coachid: null as any });
            expect(auditRepo.registra).toHaveBeenCalledWith(expect.objectContaining({ azione: "RIMOZIONE_ATLETA_ROSTER" }));
        });

        it("rimuoviAtletaDalRoster - si ferma strillando se cerchi dissociazioni in base a ID inventati", async () => {
            userRepo.findById.mockResolvedValue(null);
            await expect(service.rimuoviAtletaDalRoster("c1", "u777")).rejects.toThrow("non trovato");
        });

        it("rimuoviAtletaDalRoster - rispetta i limiti giurisdizionali, impedendo furti sul roster tra allenatori rivali", async () => {
            // Lavorerà per "rivale-1", qui l'incastro
            userRepo.findById.mockResolvedValue({ ...BASE_USER, coachid: "rivale-1" } as any);
            await expect(service.rimuoviAtletaDalRoster("c1", "u1")).rejects.toThrow("non è nel tuo roster");
        });
    });

    // ── Queries e CRUD banali ad accesso rapido ───────────────────────────────
    // Qua girano fondamentalmetne wrapper e getters base che non meritano sudore extra nel testing
    describe("Banalità Varie / Getters Diretti", () => {
        it("getProfiloCoach fa match 1 a 1 dal repo sputando l'info", async () => {
            coachRepo.findByUserId.mockResolvedValue(BASE_COACH as any);
            const result = await service.getProfiloCoach("u1");
            expect(result?.id).toBe("c1");
        });

        it("aggiornaProfiloCoach passa piallando il parziale e ci recapita la versione montata pulita", async () => {
            coachRepo.update.mockResolvedValue({ ...BASE_COACH, specializzazione: "Crossfit" } as any);
            const result = await service.aggiornaProfiloCoach("c1", { specializzazione: "Crossfit" });
            expect(result.specializzazione).toBe("Crossfit");
        });

        it("getCoachStats chiama l'aggregator per srotolare i numeri sulla dashboard del tizio", async () => {
            coachRepo.getStats.mockResolvedValue(BASE_STATS);
            const result = await service.getCoachStats("c1");
            expect(result.atleti_seguiti).toBe(10);
            expect(result.rating_medio).toBe(4.5); // non male per Mario
        });

        it("getPrenotazioniCoach prende di peso tutte le sessionature dell'istruttore", async () => {
            coachRepo.findPrenotazioniByCoachId.mockResolvedValue([BASE_PRENOT] as any);
            const result = await service.getPrenotazioniCoach("c1");
            expect(result).toHaveLength(1);
        });

        it("getCoachesByStruttura agguanta in blocco la gang dell'accademia sportiva e te lo sputa via", async () => {
            coachRepo.findByStrutturaId.mockResolvedValue([{ ...BASE_COACH, user: BASE_USER }] as any);
            const result = await service.getCoachesByStruttura("gym-1");
            expect(result).toHaveLength(1);
        });

        it("getTuttiCoachesWithDetails tira via la vista aggregata complessiva a scopo backend", async () => {
            coachRepo.findAllWithUserDetails.mockResolvedValue([{ ...BASE_COACH, user: BASE_USER }] as any);
            const result = await service.getTuttiCoachesWithDetails();
            expect(result).toHaveLength(1);
        });
    });
});
