// ============================================================
// Port/in – GymManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.5 (UC2)
// ============================================================

import { Struttura, Prenotazione, Corso } from "@/backend/domain/model/types";

export interface GymManagementPort {
    creaStruttura(piva: string, cun: string, denominazione: string, indirizzo: string, gestoreId: string): Promise<Struttura>; // R8, R9
    prenotaCorsoPalestra(userId: string, corsoId: string): Promise<Prenotazione>; // R6 capacity check, waiting list fallback
    cancellaPrenotazione(prenotazioneId: string): Promise<void>; // R3 cancellation window
    getCorsiStruttura(strutturaId: string): Promise<Corso[]>;
}
