// ============================================================
// TrackFit – Domain Model Types
// Source: SDD sections 3.x and 4.x
// ============================================================

import { WorkoutStatoEnum, RuoloEnum, StatoAbbonamentoEnum, StatoPrenotazioneEnum } from "./enums";

export interface User {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: RuoloEnum;
    dataNascita?: string; // ISO date
    fcmToken?: string;
    createdAt: string;
}

export interface Workout {
    id: string;
    userId: string;
    tipo: string;
    dataOra: string; // ISO datetime
    durata: number; // minutes
    obiettivo?: string;
    stato: WorkoutStatoEnum;
    percezionesSforzo?: number;
    note?: string;
    distanza?: number; // km
    sorgente: "TRACKING" | "IMPORT";
}

export interface Abbonamento {
    id: string;
    userId: string;
    strutturaId?: string;
    stato: StatoAbbonamentoEnum;
    qrCode?: string;
    dataInizio: string;
    dataFine: string;
    importo: number;
}

export interface Struttura {
    id: string;
    piva: string;
    cun: string;
    denominazione: string;
    indirizzo: string;
    stato: "Attiva" | "Sospesa";
    gestoreId: string;
}

export interface Prenotazione {
    id: string;
    userId: string;
    coachId?: string;
    corsoId?: string;
    dataOra: string;
    stato: StatoPrenotazioneEnum;
    importoTotale: number;
    rimborso?: number;
}

export interface Corso {
    id: string;
    strutturaId: string;
    coachId?: string;
    nome: string;
    dataOra: string;
    capacitaMassima: number;
    postiOccupati: number;
    durata: number; // minutes
}

export interface Report {
    id: string;
    userId?: string;
    strutturaId?: string;
    periodo: string;
    tipo: "UTENTE" | "COACH" | "GESTORE";
    distanzaTotale?: number;
    tempoTotaleMinuti?: number;
    ritmoMedio?: number;
    formato: "PDF" | "CSV";
    generatoAt: string;
}
