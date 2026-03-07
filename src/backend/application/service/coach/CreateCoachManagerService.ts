// ============================================================
// CreateCoachManagerService
// Application layer – implements CoachManagementPort
// Fixes: R1 (corretta guardia 48h), R2 (email post-modifica)
// ============================================================

import { CoachManagementPort } from "@/backend/domain/port/in/CoachManagementPort";
import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { PaymentGatewayPort } from "@/backend/domain/port/out/PaymentGatewayPort";
import { PaymentRepositoryPort } from "@/backend/domain/port/out/PaymentRepositoryPort";
import { Prenotazione, User, Coach, CoachStats, CoachWithUser } from "@/backend/domain/model/types";
import { StatoPagamentoEnum, StatoPrenotazioneEnum } from "@/backend/domain/model/enums";

export class CreateCoachManagerService implements CoachManagementPort {
  constructor(
    private readonly coachRepo: CoachRepositoryPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly notificationService: NotificationServicePort,
    private readonly auditRepo: AuditLogRepositoryPort,
    private readonly paymentGateway?: PaymentGatewayPort,
    private readonly paymentRepo?: PaymentRepositoryPort
  ) { }

  // ─── UC7/UC16: Prenotazione slot coach (con Pagamento) ──────────────────────
  async prenotaSlotCoach(userid: string, coachid: string, dataora: Date, durata: number): Promise<Prenotazione & { clientSecret?: string }> {
    if (dataora <= new Date()) throw new Error("dataora deve essere nel futuro.");

    const fine = new Date(dataora.getTime() + durata * 60 * 1000);

    // Recupera dettaglio coach per orari (disponibilita)
    const coach = await this.coachRepo.findById(coachid);
    if (!coach) throw new Error("Coach non trovato.");

    if (coach.disponibilita && coach.disponibilita.length > 0) {
      const day = dataora.getDay(); // 0 = domenica
      const startTimeStr = dataora.toTimeString().slice(0, 5); // "HH:MM inizio"
      const endTimeStr = fine.toTimeString().slice(0, 5); // "HH:MM fine"

      const isAvailable = coach.disponibilita.some(s =>
        s.giornoSettimana === day &&
        startTimeStr >= s.oraInizio &&
        endTimeStr <= s.oraFine
      );

      if (!isAvailable) {
        throw new Error("L'intervallo scelto non rientra pienamente negli orari di lavoro del coach.");
      }
    }

    const collisioni = await this.coachRepo.findPrenotazioniAttiveInIntervallo(coachid, dataora, fine);
    if (collisioni.length > 0) throw new Error("Lo slot è già parzialmente occupato da un'altra prenotazione.");

    const importo = (durata / 60) * 30.0; // Costo proporzionale (es. 30€/ora)

    const prenotazione = await this.coachRepo.savePrenotazione({
      userid,
      coachid,
      dataora: dataora.toISOString(),
      durata,
      stato: StatoPrenotazioneEnum.IN_ATTESA, // UC7: Wait for payment
      importototale: importo,
    });

    let clientSecret: string | undefined;

    // Genera l'intento di pagamento
    if (this.paymentGateway && this.paymentRepo) {
      const intent = await this.paymentGateway.creaIntentPagamento(importo, 'eur', {
        userid,
        coachid,
        prenotazioneId: prenotazione.id!
      });

      await this.paymentRepo.save({
        userid,
        importo,
        valuta: 'eur',
        stato: StatoPagamentoEnum.IN_ATTESA,
        stripepaymentintentid: intent.id,
        metodo: 'card'
      });

      clientSecret = intent.clientSecret;
    } else {
      // Fallback for testing without Stripe: auto-confirm
      await this.coachRepo.updatePrenotazione(prenotazione.id!, { stato: StatoPrenotazioneEnum.CONFERMATA });
      prenotazione.stato = StatoPrenotazioneEnum.CONFERMATA;
    }

    return { ...prenotazione, clientSecret };
  }

  // ─── UC7/UC16: Conferma/Annulla Pagamento ──────────────────────────────────
  async confermaPagamentoPrenotazione(sessioneid: string, success: boolean): Promise<void> {
    const prenotazione = await this.coachRepo.findPrenotazioneById(sessioneid);
    if (!prenotazione) throw new Error("Prenotazione non trovata.");

    if (success) {
      // UC7: Transazione approvata
      await this.coachRepo.updatePrenotazione(sessioneid, { stato: StatoPrenotazioneEnum.CONFERMATA });
      // TODO: Update Payment in paymentRepo (handled by webhook usually, but mocked here)
    } else {
      // UC16: Transazione negata -> libera le risorse
      await this.coachRepo.updatePrenotazione(sessioneid, { stato: StatoPrenotazioneEnum.CANCELLATA });
    }
  }

  // ─── R1 + R2: Modifica piano atleta ──────────────────────────────────────────
  async modificaPianoAtleta(
    coachid: string,
    sessioneid: string,
    nuovadataora: Date,
    motivazione: string
  ): Promise<void> {
    // R1: La sessione è modificabile SOLO se l'ora di INIZIO dista ≥ 48h dal momento
    // della modifica (non dalla nuova dataora, ma dalla VECCHIA dataora della sessione).
    // NB: il workoutRepo non è iniettato qui; il checkdeve avvenire sulla vecchia dataora.
    // Recuperiamo la prenotazione tramite sessioneid per ottenere la vecchia dataora.
    const prenotazione = await this.coachRepo.findPrenotazioneById(sessioneid);
    if (!prenotazione) throw new Error("Sessione non trovata.");

    const ore48Ms = 48 * 60 * 60 * 1000;
    const vecchiadataora = new Date(prenotazione.dataora);
    const msAllaSessione = vecchiadataora.getTime() - Date.now();

    if (msAllaSessione < ore48Ms) {
      throw new Error(
        "Vincolo R1: La sessione può essere modificata solo se mancano ancora ≥ 48 ore al suo inizio."
      );
    }

    // Aggiorna la prenotazione con la nuova dataora
    await this.coachRepo.updatePrenotazione(sessioneid, {
      dataora: nuovadataora.toISOString(),
    });

    // R10: Salva audit log della modifica
    const auditLogPromise = this.coachRepo.saveAuditLog(
      coachid,
      sessioneid,
      vecchiadataora,
      nuovadataora,
      motivazione
    );

    const auditSystemPromise = this.auditRepo.registra({
      utenteId: coachid,
      azione: "MODIFICA_PIANO_ATLETA",
      datiJSON: {
        sessioneid,
        vecchiadataora: vecchiadataora.toISOString(),
        nuovadataora: nuovadataora.toISOString(),
        motivazione,
      },
      timestamp: new Date().toISOString(),
    });

    // R2: Invia email all'atleta con riepilogo della modifica
    const notifyPromise = this.userRepo.findById(prenotazione.userid!).then(atleta => {
      if (atleta) {
        return Promise.all([
          this.notificationService.inviaEmail(
            atleta.email,
            "Modifica piano allenamento",
            {
              atletaNome: `${atleta.nome} ${atleta.cognome}`,
              vecchiadataora: vecchiadataora.toISOString(),
              nuovadataora: nuovadataora.toISOString(),
              motivazione,
              riferimentoPiano: sessioneid,
            }
          ),
          this.notificationService.inviaNotificaRealtime(prenotazione.userid!, {
            titolo: "Piano allenamento modificato",
            messaggio: `Il tuo allenamento è stato spostato al ${nuovadataora.toLocaleDateString("it-IT")}. Motivazione: ${motivazione}`,
            tipo: "modifica_piano",
            dati: { nuovadataora: nuovadataora.toISOString(), motivazione },
          })
        ]);
      }
    });

    // Esegui tutte le operazioni di I/O indipendenti in parallelo
    await Promise.all([auditLogPromise, auditSystemPromise, notifyPromise]);
  }

  // ─── FR13: Roster atleti del coach ───────────────────────────────────────────
  async getRosterAtleti(coachid: string): Promise<User[]> {
    return this.userRepo.findByCoachId(coachid);
  }

  async rimuoviAtletaDalRoster(coachId: string, atletaId: string): Promise<void> {
    const atleta = await this.userRepo.findById(atletaId);
    if (!atleta) throw new Error("Atleta non trovato");

    // Verifica che l'atleta sia effettivamente seguito da questo coach (se ha un coachid impostato)
    if (atleta.coachid && atleta.coachid !== coachId) {
      throw new Error("L'atleta non è nel tuo roster diretto");
    }

    // Scollega l'atleta
    await this.userRepo.update(atletaId, { coachid: undefined as any });

    // Audit Log
    await this.auditRepo.registra({
      utenteId: coachId,
      azione: "RIMOZIONE_ATLETA_ROSTER",
      datiJSON: { atletaId, email: atleta.email },
      timestamp: new Date().toISOString()
    });
  }

  // ─── Coach profilo ───────────────────────────────────────────────────────────
  async getProfiloCoach(userid: string): Promise<Coach | null> {
    return this.coachRepo.findByUserId(userid);
  }

  async aggiornaProfiloCoach(coachid: string, data: Partial<Coach>): Promise<Coach> {
    return this.coachRepo.update(coachid, data);
  }

  async getCoachStats(coachid: string): Promise<CoachStats> {
    return this.coachRepo.getStats(coachid);
  }

  async getPrenotazioniCoach(coachid: string): Promise<Prenotazione[]> {
    return this.coachRepo.findPrenotazioniByCoachId(coachid);
  }

  async getCoachesByStruttura(strutturaid: string): Promise<Coach[]> {
    return this.coachRepo.findByStrutturaId(strutturaid);
  }

  async getTuttiCoachesWithDetails(): Promise<CoachWithUser[]> {
    return this.coachRepo.findAllWithUserDetails();
  }
}