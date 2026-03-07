// ============================================================
// Port/out – CoachRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Coach, CoachWithUser, Prenotazione, CoachStats } from "@/backend/domain/model/types";

export interface CoachRepositoryPort {
    save(coach: Partial<Coach>): Promise<Coach>;
    update(id: string, data: Partial<Coach>): Promise<Coach>;
    findById(id: string): Promise<Coach | null>;
    findByUserId(userid: string): Promise<Coach | null>;
    findAll(): Promise<Coach[]>;
    findAllWithUserDetails(): Promise<CoachWithUser[]>;
    findByStrutturaId(strutturaid: string): Promise<CoachWithUser[]>;
    getStats(coachid: string): Promise<CoachStats>;
    savePrenotazione(prenotazione: Partial<Prenotazione>): Promise<Prenotazione>;
    findPrenotazioneById(id: string): Promise<Prenotazione | null>;         // R1: legge vecchia dataora
    findPrenotazioniAttiveInIntervallo(coachid: string, inizio: Date, fine: Date): Promise<Prenotazione[]>;
    findPrenotazioniByCoachId(coachid: string): Promise<Prenotazione[]>;
    updatePrenotazione(id: string, data: Partial<Prenotazione>): Promise<Prenotazione>;
    saveAuditLog(coachid: string, sessioneid: string, vecchiadataora: Date, nuovadataora: Date, motivazione: string): Promise<void>;
}
