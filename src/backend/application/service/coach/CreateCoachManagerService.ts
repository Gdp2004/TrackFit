// ============================================================
// CreateCoachManagerService
// Application layer – implements CoachManagementPort (UC6/UC7)
// ============================================================

import { CoachManagementPort } from "@/backend/domain/port/in/CoachManagementPort";
import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { Prenotazione, User } from "@/backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";
// Used for fetching users
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";

export class CreateCoachManagerService implements CoachManagementPort {
  constructor(
    private readonly coachRepo: CoachRepositoryPort,
    private readonly userRepo: UserRepositoryPort
  ) { }

  async prenotaSlotCoach(userId: string, coachId: string, dataOra: Date): Promise<Prenotazione> {
    if (dataOra <= new Date()) throw new Error("dataOra deve essere nel futuro.");

    // Pre-condition: Check if slot is already taken
    const slotEsistente = await this.coachRepo.findPrenotazioneAttivaBySlot(coachId, dataOra);
    if (slotEsistente) throw new Error("Slot già occupato per questo coach.");

    return this.coachRepo.savePrenotazione({
      userId,
      coachId,
      dataOra: dataOra.toISOString(),
      stato: StatoPrenotazioneEnum.CONFERMATA,
      importoTotale: 30.0 // Default fee
    });
  }

  async modificaPianoAtleta(coachId: string, sessioneId: string, nuovaDataOra: Date, motivazione: string): Promise<void> {
    // SDD OCL Vincolo R1: preavviso minimo 48h
    // In this implementation, we simulate fetching the old workout (or session) to check the 48h constraint
    // Wait, the Workout Repo manages workouts. For the sake of the Coach Port handling audit, we log it.
    const ore48 = 48 * 60 * 60 * 1000;
    const diff = nuovaDataOra.getTime() - Date.now();
    if (diff < ore48 && nuovaDataOra.getTime() > Date.now()) {
      throw new Error("Vincolo R1: Le modifiche al piano richiedono 48 ore di preavviso.");
    }

    // Save modification to Audit Log
    await this.coachRepo.saveAuditLog(coachId, sessioneId, new Date(), nuovaDataOra, motivazione);

    // Notice: Actual workout update would be handled via Workout port or triggering a domain event
  }

  async getRosterAtleti(coachId: string): Promise<User[]> {
    // Coach can only see users who are associated with them
    // As a simplification, we might need a `findUsersByCoachId` in userRepo
    // For now, this is a conceptual implementation of the port
    throw new Error("Method not properly supported by UserRepositoryPort yet.");
  }
}