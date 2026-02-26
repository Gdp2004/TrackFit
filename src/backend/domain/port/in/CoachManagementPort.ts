// ============================================================
// Port/in – CoachManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.4 (UC6/UC7)
// ============================================================

import { Prenotazione, User, Coach, CoachStats } from "@/backend/domain/model/types";

export interface CoachManagementPort {
    prenotaSlotCoach(userid: string, coachid: string, dataora: Date): Promise<Prenotazione & { clientSecret?: string }>;
    modificaPianoAtleta(coachid: string, sessioneid: string, nuovadataora: Date, motivazione: string): Promise<void>; // OCL R1
    getRosterAtleti(coachid: string): Promise<User[]>;
    confermaPagamentoPrenotazione(sessioneid: string, success: boolean): Promise<void>; // UC7 / UC16
    // ─── Coach profile & stats ──────────────────────────────────────────────────
    getProfiloCoach(userid: string): Promise<Coach | null>;
    aggiornaProfiloCoach(coachid: string, data: Partial<Coach>): Promise<Coach>;
    getCoachStats(coachid: string): Promise<CoachStats>;
    getPrenotazioniCoach(coachid: string): Promise<Prenotazione[]>;
    getCoachesByStruttura(strutturaid: string): Promise<Coach[]>;
}
