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
import { Prenotazione, User } from "@/backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";

export class CreateCoachManagerService implements CoachManagementPort {
  constructor(
    private readonly coachRepo: CoachRepositoryPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly notificationService: NotificationServicePort,
    private readonly auditRepo: AuditLogRepositoryPort
  ) { }

  // ─── Prenotazione slot coach ──────────────────────────────────────────────────
  async prenotaSlotCoach(userId: string, coachId: string, dataOra: Date): Promise<Prenotazione> {
    if (dataOra <= new Date()) throw new Error("dataOra deve essere nel futuro.");

    const slotEsistente = await this.coachRepo.findPrenotazioneAttivaBySlot(coachId, dataOra);
    if (slotEsistente) throw new Error("Slot già occupato per questo coach.");

    return this.coachRepo.savePrenotazione({
      userId,
      coachId,
      dataOra: dataOra.toISOString(),
      stato: StatoPrenotazioneEnum.CONFERMATA,
      importoTotale: 30.0,
    });
  }

  // ─── R1 + R2: Modifica piano atleta ──────────────────────────────────────────
  async modificaPianoAtleta(
    coachId: string,
    sessioneId: string,
    nuovaDataOra: Date,
    motivazione: string
  ): Promise<void> {
    // R1: La sessione è modificabile SOLO se l'ora di INIZIO dista ≥ 48h dal momento
    // della modifica (non dalla nuova dataOra, ma dalla VECCHIA dataOra della sessione).
    // NB: il workoutRepo non è iniettato qui; il checkdeve avvenire sulla vecchia dataOra.
    // Recuperiamo la prenotazione tramite sessioneId per ottenere la vecchia dataOra.
    const prenotazione = await this.coachRepo.findPrenotazioneById(sessioneId);
    if (!prenotazione) throw new Error("Sessione non trovata.");

    const ore48Ms = 48 * 60 * 60 * 1000;
    const vecchiaDataOra = new Date(prenotazione.dataOra);
    const msAllaSessione = vecchiaDataOra.getTime() - Date.now();

    if (msAllaSessione < ore48Ms) {
      throw new Error(
        "Vincolo R1: La sessione può essere modificata solo se mancano ancora ≥ 48 ore al suo inizio."
      );
    }

    // Aggiorna la prenotazione con la nuova dataOra
    await this.coachRepo.updatePrenotazione(sessioneId, {
      dataOra: nuovaDataOra.toISOString(),
    });

    // R10: Salva audit log della modifica
    await this.coachRepo.saveAuditLog(
      coachId,
      sessioneId,
      vecchiaDataOra,
      nuovaDataOra,
      motivazione
    );
    await this.auditRepo.registra({
      utenteId: coachId,
      azione: "MODIFICA_PIANO_ATLETA",
      datiJSON: {
        sessioneId,
        vecchiaDataOra: vecchiaDataOra.toISOString(),
        nuovaDataOra: nuovaDataOra.toISOString(),
        motivazione,
      },
      timestamp: new Date().toISOString(),
    });

    // R2: Invia email all'atleta con riepilogo della modifica
    const atleta = await this.userRepo.findById(prenotazione.userId!);
    if (atleta) {
      await this.notificationService.inviaEmail(
        atleta.email,
        "Modifica piano allenamento",
        {
          atletaNome: `${atleta.nome} ${atleta.cognome}`,
          vecchiaDataOra: vecchiaDataOra.toISOString(),
          nuovaDataOra: nuovaDataOra.toISOString(),
          motivazione,
          riferimentoPiano: sessioneId,
        }
      );

      // Notifica in-app
      await this.notificationService.inviaNotificaRealtime(prenotazione.userId!, {
        titolo: "Piano allenamento modificato",
        messaggio: `Il tuo allenamento è stato spostato al ${nuovaDataOra.toLocaleDateString("it-IT")}. Motivazione: ${motivazione}`,
        tipo: "modifica_piano",
        dati: { nuovaDataOra: nuovaDataOra.toISOString(), motivazione },
      });
    }
  }

  // ─── FR13: Roster atleti del coach ───────────────────────────────────────────
  async getRosterAtleti(coachId: string): Promise<User[]> {
    return this.userRepo.findByCoachId(coachId);
  }
}