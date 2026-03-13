import { CreateCoachManagerService } from "../../src/backend/application/service/coach/CreateCoachManagerService";
import { mockDeep } from "jest-mock-extended";
import { CoachRepositoryPort } from "../../src/backend/domain/port/out/CoachRepositoryPort";
import { UserRepositoryPort } from "../../src/backend/domain/port/out/UserRepositoryPort";
import { NotificationServicePort } from "../../src/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "../../src/backend/domain/port/out/AuditLogRepositoryPort";
import { StatoPrenotazioneEnum } from "../../src/backend/domain/model/enums";

// Testa la logica di annullamento di una sessione da parte del coach
describe("Logica di Cancellazione Sessione Coach", () => {
    // Inizializziamo tutti i mock necessari per isolare il servizio
    const coachRepo = mockDeep<CoachRepositoryPort>();
    const userRepo = mockDeep<UserRepositoryPort>();
    const notificationService = mockDeep<NotificationServicePort>();
    const auditRepo = mockDeep<AuditLogRepositoryPort>();
    
    // Creiamo un'istanza del servizio iniettando le dipendenze finte (senza modulo pagamenti qui)
    const service = new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo);

    // Variabili di appoggio per simulare lo scorrere del tempo calcolando gli scarti in millisecondi
    const NOW = Date.now();
    const IN_50H = new Date(NOW + 50 * 3600000).toISOString();
    const IN_24H = new Date(NOW + 24 * 3600000).toISOString();
    
    // Setup di base per emulare una prenotazione e un utente già caricati nel DB
    const BASE_PRENOT = { id: "p1", userid: "u1", coachid: "c1", dataora: IN_50H, stato: StatoPrenotazioneEnum.CONFERMATA, importototale: 50 };
    const BASE_USER = { id: "u1", email: "atleta@test.com", nome: "Atleta", cognome: "Test" };

    it("dovrebbe annullare la sessione pacifica se mancano più di 48h e notificare tempestivamente l'atleta", async () => {
        // Configuriamo i mock per comportarsi normalmente intercettando la query al db
        coachRepo.findPrenotazioneById.mockResolvedValue(BASE_PRENOT as any);
        userRepo.findById.mockResolvedValue(BASE_USER as any);

        // Chiamiamo il metodo del servizio passandogli un valido preavviso e il motivo
        await service.annullaSessione("c1", "p1", "Piccolo imprevisto personale");

        // Assicuriamoci che abbia effettivamente scritto il nuovo status a DB e non l'abbia solo finto
        expect(coachRepo.updatePrenotazione).toHaveBeenCalledWith("p1", { stato: StatoPrenotazioneEnum.CANCELLATA });
        
        // E che siano partiti i due trigger di notifica push-email verso la persona che l'ha subìto
        expect(notificationService.inviaEmail).toHaveBeenCalledWith("atleta@test.com", expect.any(String), expect.any(Object));
        expect(notificationService.inviaNotificaRealtime).toHaveBeenCalledWith("u1", expect.objectContaining({ tipo: "annullamento_piano" }));
    });

    it("dovrebbe bloccare severamente l'operazione a causa del preavviso ristretto (Vincolo aziendale 48h)", async () => {
        // Costruiamo una prenotazione clonata ma le accorciamo appositamente l'orario a meno di 48 ore (solo 24)
        coachRepo.findPrenotazioneById.mockResolvedValue({ ...BASE_PRENOT, dataora: IN_24H } as any);

        // Cerchiamo di triggerare l'annullamento aspettandoci per forza un eccezione esplosiva che fermi il tutto
        await expect(service.annullaSessione("c1", "p1", "Ritardo dell'ultimo secondo"))
            .rejects.toThrow("Vincolo R1"); // Il vincolo "R1" è esplicitamente ricercato nel messaggio d'errore lanciato
    });
});
