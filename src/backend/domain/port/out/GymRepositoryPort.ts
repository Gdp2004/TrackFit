// ============================================================
// Port/out – GymRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Struttura, Corso, Prenotazione, ListaAttesa } from "@/backend/domain/model/types";

export interface GymRepositoryPort {
    saveStruttura(struttura: Partial<Struttura>): Promise<Struttura>;
    findStrutturaById(id: string): Promise<Struttura | null>;
    matchStruttureFuzzy(denominazione: string, indirizzo: string): Promise<Struttura[]>; // R9: pg_trgm fuzzy dedup
    existsStrutturaByPivaOrCun(piva: string, cun: string): Promise<boolean>;

    saveCorso(corso: Partial<Corso>): Promise<Corso>;
    findCorsoById(id: string): Promise<Corso | null>;
    findCorsiByStrutturaId(strutturaid: string): Promise<Corso[]>;                    // FR6: lista corsi
    deleteCorso(corsoid: string): Promise<void>;                                       // FR26
    incrementaPostiOccupati(corsoid: string): Promise<boolean>; // Returns true if successful (capacity allowed)
    decrementaPostiOccupati(corsoid: string): Promise<void>;

    savePrenotazioneCorso(prenotazione: Partial<Prenotazione>): Promise<Prenotazione>;
    findPrenotazioneCorsoById(id: string): Promise<Prenotazione | null>;
    findUserIdsByCorsoId(corsoid: string): Promise<string[]>;                         // FR26: utenti prenotati
    findUserIdsInListaAttesa(corsoid: string): Promise<string[]>;                     // FR26: utenti in attesa

    addToListaAttesa(corsoid: string, userid: string): Promise<ListaAttesa>;
    popFromListaAttesa(corsoid: string): Promise<ListaAttesa | null>;
}
