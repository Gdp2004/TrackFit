// ============================================================
// Port/in – CoachManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.4 (UC6/UC7)
// ============================================================

import { Prenotazione, User } from "@/backend/domain/model/types";

export interface CoachManagementPort {
    prenotaSlotCoach(userId: string, coachId: string, dataOra: Date): Promise<Prenotazione>;
    modificaPianoAtleta(coachId: string, sessioneId: string, nuovaDataOra: Date, motivazione: string): Promise<void>; // OCL R1
    getRosterAtleti(coachId: string): Promise<User[]>;
}
