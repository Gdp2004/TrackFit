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
  async prenotaSlotCoach(userid: string, coachid: string, dataora: Date): Promise<Prenotazione> {
    if (dataora <= new Date()) throw new Error("dataora deve essere nel futuro.");

    const slotEsistente = await this.coachRepo.findPrenotazioneAttivaBySlot(coachid, dataora);
    if (slotEsistente) throw new Error("Slot già occupato per questo coach.");

    return this.coachRepo.savePrenotazione({
      userid,
      coachid,
      dataora: dataora.toISOString(),
      stato: StatoPrenotazioneEnum.CONFERMATA,
      importototale: 30.0,
    });
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
    await this.coachRepo.saveAuditLog(
      coachid,
      sessioneid,
      vecchiadataora,
      nuovadataora,
      motivazione
    );
    await this.auditRepo.registra({
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
    const atleta = await this.userRepo.findById(prenotazione.userid!);
    if (atleta) {
      await this.notificationService.inviaEmail(
        atleta.email,
        "Modifica piano allenamento",
        {
          atletaNome: `${atleta.nome} ${atleta.cognome}`,
          vecchiadataora: vecchiadataora.toISOString(),
          nuovadataora: nuovadataora.toISOString(),
          motivazione,
          riferimentoPiano: sessioneid,
        }
      );

      // Notifica in-app
      await this.notificationService.inviaNotificaRealtime(prenotazione.userid!, {
        titolo: "Piano allenamento modificato",
        messaggio: `Il tuo allenamento è stato spostato al ${nuovadataora.toLocaleDateString("it-IT")}. Motivazione: ${motivazione}`,
        tipo: "modifica_piano",
        dati: { nuovadataora: nuovadataora.toISOString(), motivazione },
      });
    }
  }

  // ─── FR13: Roster atleti del coach ───────────────────────────────────────────
  async getRosterAtleti(coachid: string): Promise<User[]> {
    return this.userRepo.findByCoachId(coachid);
  }
}