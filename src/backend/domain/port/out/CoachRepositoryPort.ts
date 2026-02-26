// ============================================================
// Port/out – CoachRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Coach, Prenotazione, CoachStats } from "@/backend/domain/model/types";

export interface CoachRepositoryPort {
    save(coach: Partial<Coach>): Promise<Coach>;
    update(id: string, data: Partial<Coach>): Promise<Coach>;
    findById(id: string): Promise<Coach | null>;
    findByUserId(userid: string): Promise<Coach | null>;
    findAll(): Promise<Coach[]>;
    findByStrutturaId(strutturaid: string): Promise<Coach[]>;
    getStats(coachid: string): Promise<CoachStats>;
    savePrenotazione(prenotazione: Partial<Prenotazione>): Promise<Prenotazione>;
    findPrenotazioneById(id: string): Promise<Prenotazione | null>;         // R1: legge vecchia dataora
    findPrenotazioneAttivaBySlot(coachid: string, dataora: Date): Promise<Prenotazione | null>;
    findPrenotazioniByCoachId(coachid: string): Promise<Prenotazione[]>;
    updatePrenotazione(id: string, data: Partial<Prenotazione>): Promise<Prenotazione>;
    saveAuditLog(coachid: string, sessioneid: string, vecchiadataora: Date, nuovadataora: Date, motivazione: string): Promise<void>;
}
