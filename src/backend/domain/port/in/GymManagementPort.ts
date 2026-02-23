// ============================================================
// Port/in – GymManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.5 (UC2)
// ============================================================

import { Struttura, Prenotazione, Corso } from "@/backend/domain/model/types";

export interface GymManagementPort {
    creaStruttura(piva: string, cun: string, denominazione: string, indirizzo: string, gestoreid: string): Promise<Struttura>;
    creaCorso(corso: Omit<Corso, "id" | "postioccupati">): Promise<Corso>;            // FR6
    cancellaCorso(corsoid: string, gestoreid: string): Promise<void>;                  // FR26
    prenotaCorsoPalestra(userid: string, corsoid: string): Promise<Prenotazione>;
    cancellaPrenotazione(prenotazioneId: string): Promise<void>;
    getCorsiStruttura(strutturaid: string): Promise<Corso[]>;
}
