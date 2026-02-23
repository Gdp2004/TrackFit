// ============================================================
// Port/in – CoachManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.4 (UC6/UC7)
// ============================================================

import { Prenotazione, User } from "@/backend/domain/model/types";

export interface CoachManagementPort {
    prenotaSlotCoach(userid: string, coachid: string, dataora: Date): Promise<Prenotazione>;
    modificaPianoAtleta(coachid: string, sessioneid: string, nuovadataora: Date, motivazione: string): Promise<void>; // OCL R1
    getRosterAtleti(coachid: string): Promise<User[]>;
}
