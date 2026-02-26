// ============================================================
// Port/in – GymManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.5 (UC2)
// ============================================================

import { Struttura, Prenotazione, Corso, Coach, TipoAbbonamento, GestoreStats } from "@/backend/domain/model/types";

export interface GymManagementPort {
    creaStruttura(piva: string, cun: string, denominazione: string, indirizzo: string, gestoreid: string): Promise<Struttura>;
    creaCorso(corso: Omit<Corso, "id" | "postioccupati">): Promise<Corso>;            // FR6
    aggiornaCorso(corsoid: string, data: Partial<Corso>): Promise<Corso>;
    cancellaCorso(corsoid: string, gestoreid: string): Promise<void>;                  // FR26
    prenotaCorsoPalestra(userid: string, corsoid: string): Promise<Prenotazione>;
    cancellaPrenotazione(prenotazioneId: string): Promise<void>;
    getCorsiStruttura(strutturaid: string): Promise<Corso[]>;
    onboardCoach(strutturaid: string, emailGestore: string, emailCoach: string): Promise<void>; // UC2
    // ─── Gestore dashboard ──────────────────────────────────────────────────────
    getStrutturaGestore(gestoreid: string): Promise<Struttura | null>;
    aggiornaStruttura(strutturaid: string, data: Partial<Struttura>): Promise<Struttura>;
    getGestoreStats(strutturaid: string): Promise<GestoreStats>;
    getCoachesStruttura(strutturaid: string): Promise<Coach[]>;
    creaTipoAbbonamento(tipo: Omit<TipoAbbonamento, "id" | "createdat">): Promise<TipoAbbonamento>;
    getTipiAbbonamento(strutturaid: string): Promise<TipoAbbonamento[]>;
    eliminaTipoAbbonamento(id: string): Promise<void>;
}
