// ============================================================
// Port/out – GymRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Struttura, Corso, Prenotazione, ListaAttesa, TipoAbbonamento, GestoreStats } from "@/backend/domain/model/types";

export interface GymRepositoryPort {
    saveStruttura(struttura: Partial<Struttura>): Promise<Struttura>;
    findStrutturaById(id: string): Promise<Struttura | null>;
    findStrutturaByGestoreId(gestoreid: string): Promise<Struttura | null>;
    findStruttureByGestoreId(gestoreid: string): Promise<Struttura[]>;   // multi-struttura
    updateStruttura(id: string, data: Partial<Struttura>): Promise<Struttura>;
    matchStruttureFuzzy(denominazione: string, indirizzo: string): Promise<Struttura[]>; // R9: pg_trgm fuzzy dedup
    existsStrutturaByPivaOrCun(piva: string, cun: string): Promise<boolean>;
    getStats(strutturaid: string): Promise<GestoreStats>;

    saveCorso(corso: Partial<Corso>): Promise<Corso>;
    findCorsoById(id: string): Promise<Corso | null>;
    findCorsiByStrutturaId(strutturaid: string): Promise<Corso[]>;                    // FR6: lista corsi
    deleteCorso(corsoid: string): Promise<void>;                                       // FR26
    updateCorso(corsoid: string, data: Partial<Corso>): Promise<Corso>;
    incrementaPostiOccupati(corsoid: string): Promise<boolean>; // Returns true if successful (capacity allowed)
    decrementaPostiOccupati(corsoid: string): Promise<void>;

    savePrenotazioneCorso(prenotazione: Partial<Prenotazione>): Promise<Prenotazione>;
    findPrenotazioneCorsoById(id: string): Promise<Prenotazione | null>;
    findUserIdsByCorsoId(corsoid: string): Promise<string[]>;                         // FR26: utenti prenotati
    findUserIdsInListaAttesa(corsoid: string): Promise<string[]>;                     // FR26: utenti in attesa

    addToListaAttesa(corsoid: string, userid: string): Promise<ListaAttesa>;
    popFromListaAttesa(corsoid: string): Promise<ListaAttesa | null>;
    findPrenotazioneByUtenteAndCorso(userid: string, corsoid: string): Promise<Prenotazione | null>;

    saveTipoAbbonamento(tipo: Partial<TipoAbbonamento>): Promise<TipoAbbonamento>;
    findTipiAbbonamentoByStrutturaId(strutturaid: string): Promise<TipoAbbonamento[]>;
    deleteTipoAbbonamento(id: string): Promise<void>;
}
