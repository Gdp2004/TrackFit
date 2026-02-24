// ============================================================
// Port/out – CoachRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Coach, Prenotazione } from "@/backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";

export interface CoachRepositoryPort {
    save(coach: Partial<Coach>): Promise<Coach>;
    findById(id: string): Promise<Coach | null>;
    findByUserId(userid: string): Promise<Coach | null>;
    savePrenotazione(prenotazione: Partial<Prenotazione>): Promise<Prenotazione>;
    findPrenotazioneById(id: string): Promise<Prenotazione | null>;         // R1: legge vecchia dataora
    findPrenotazioneAttivaBySlot(coachid: string, dataora: Date): Promise<Prenotazione | null>;
    updatePrenotazione(id: string, data: Partial<Prenotazione>): Promise<Prenotazione>;
    saveAuditLog(coachid: string, sessioneid: string, vecchiadataora: Date, nuovadataora: Date, motivazione: string): Promise<void>;
}
