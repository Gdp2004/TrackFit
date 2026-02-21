// ============================================================
// Port/in – GymManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.5 (UC2)
// ============================================================

import { Struttura, Prenotazione, Corso } from "@/backend/domain/model/types";

export interface GymManagementPort {
    creaStruttura(piva: string, cun: string, denominazione: string, indirizzo: string, gestoreId: string): Promise<Struttura>;
    creaCorso(corso: Omit<Corso, "id" | "postiOccupati">): Promise<Corso>;            // FR6
    cancellaCorso(corsoId: string, gestoreId: string): Promise<void>;                  // FR26
    prenotaCorsoPalestra(userId: string, corsoId: string): Promise<Prenotazione>;
    cancellaPrenotazione(prenotazioneId: string): Promise<void>;
    getCorsiStruttura(strutturaId: string): Promise<Corso[]>;
}
