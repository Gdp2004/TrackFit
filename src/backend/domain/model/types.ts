// ============================================================
// TrackFit – Domain Model Types
// Source: SDD sections 3.x, 4.x – RAD entities
// ============================================================

import {
    WorkoutStatoEnum, RuoloEnum, StatoAbbonamentoEnum,
    StatoPrenotazioneEnum, StatoPagamentoEnum, TipoWorkoutEnum
} from "./enums";

// ─── Users ───────────────────────────────────────────────────
export interface User {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: RuoloEnum;
    datanascita?: string;       // ISO date
    peso?: number;              // kg – parametri fisici SDD §3.1
    altezza?: number;           // cm
    coachid?: string;           // associazione coach (UC1)
    createdat: string;
}

export interface Coach {
    id: string;
    userid: string;             // FK → users
    strutturaid?: string;       // palestra di riferimento
    specializzazione: string;
    rating?: number;            // 0-5
    bio?: string;
    telefono?: string;
    disponibilita?: SlotDisponibilita[];
}

export interface SlotDisponibilita {
    giornoSettimana: number;    // 0 = domenica
    oraInizio: string;          // "HH:MM"
    oraFine: string;
}

export interface Gestore {
    id: string;
    userid: string;             // FK → users
    strutturaid?: string;       // palestra gestita
    telefono?: string;
    bio?: string;
    createdat: string;
}

/** Statistiche real-time Coach (da RPC get_coach_stats) */
export interface CoachStats {
    atleti_seguiti: number;
    sessioni_oggi: number;
    sessioni_mese: number;
    rating_medio: number;
}

/** Statistiche real-time Gestore (da RPC get_gestore_stats) */
export interface GestoreStats {
    abbonamenti_attivi: number;
    corsi_settimana: number;
    accessi_oggi: number;
    incasso_mese: number;
}

// ─── Workouts ────────────────────────────────────────────────
export interface Workout {
    id: string;
    userid: string;
    tipo: TipoWorkoutEnum | string;
    dataora: string;            // ISO datetime
    durata: number;             // minuti
    obiettivo?: string;
    stato: WorkoutStatoEnum;
    percezionessforzo?: number; // RPE 1-10
    note?: string;
    distanza?: number;          // km
    frequenzacardiacamedia?: number;
    calorie?: number;
    gpxtrace?: string;          // URL file GPX (Supabase Storage)
    stravaid?: string;          // deduplication UC5
    sorgente: "TRACKING" | "IMPORT";
    athleteName?: string;       // added for coach sessions view
}

/** Snapshot locale per crash recovery – salvato ogni 30s (SDD UC4) */
export interface Snapshot {
    id: string;
    workoutId: string;
    datiJSON: Record<string, unknown>;  // metriche parziali
    timestamp: string;
}

// ─── Subscriptions ───────────────────────────────────────────
export interface Abbonamento {
    id: string;
    userid: string;
    strutturaid?: string;
    tipoid?: string;
    stato: StatoAbbonamentoEnum;
    qrCode?: string;
    datainizio: string;
    datafine: string;
    importo: number;
    rinnovoautomatico?: boolean;    // FR21: auto-renewal toggle
}

/** FR7: Tipo abbonamento configurabile dal Gestore */
export interface TipoAbbonamento {
    id: string;
    strutturaid: string;
    nome: string;                   // es. "Mensile", "Annuale"
    duratamesi: number;
    prezzo: number;
    rinnovabile: boolean;
    descrizione?: string;
    createdat?: string;
}

/** R4: Coupon promozionale */
export interface Coupon {
    id: string;
    codice: string;                 // es. "PROMO2025"
    strutturaid: string;            // R4: valido solo per struttura specifica
    tipoabbonamentoid: string;      // R4: valido solo per piano specifico
    percentualesconto: number;      // R4: sconto percentuale (es. 50)
    monouso: boolean;               // R4: un solo utilizzo per utente
    scadenza: string;               // R4: data di scadenza (ISO date)
    utenteId?: string;              // popolato quando riscattato
    usato: boolean;
}

export interface Pagamento {
    id: string;
    userid: string;
    abbonamentoid?: string;
    importo: number;
    valuta: string;             // default "eur"
    stato: StatoPagamentoEnum;
    stripepaymentintentid?: string;
    metodo?: string;            // "card", "sepa_debit"
    createdat: string;
}

// ─── Gym / Struttura ─────────────────────────────────────────
export interface Struttura {
    id: string;
    piva: string;               // R8: unico
    cun: string;                // R9: unico (Codice Univoco Nazionale)
    denominazione: string;
    indirizzo: string;
    telefono?: string;
    email?: string;
    sito?: string;
    descrizione?: string;
    stato: "Attiva" | "Sospesa";
    gestoreid: string;
}

export interface Corso {
    id: string;
    strutturaid: string;
    coachid?: string;
    nome: string;
    dataora: string;
    capacitamassima: number;
    postioccupati: number;
    durata: number;             // minuti
}

/** Lista d'attesa automatica quando corso è pieno (SDD §3.5 R6) */
export interface ListaAttesa {
    id: string;
    corsoid: string;
    userid: string;
    posizione: number;          // posizione in coda (1-based)
    timestamp: string;
}

export interface Prenotazione {
    id: string;
    userid: string;
    coachid?: string;
    corsoid?: string;
    strutturaid?: string;
    dataora: string;
    stato: StatoPrenotazioneEnum;
    importototale: number;
    rimborso?: number;
}

// ─── Audit / Reports ─────────────────────────────────────────
/** Log modifiche del coach al piano atleta (R1 obbligatorio) */
export interface AuditLog {
    id: string;
    coachid: string;
    sessioneid: string;
    vecchiadataora: string;
    nuovadataora: string;
    motivazione: string;
    timestamp: string;
}

export interface Report {
    id: string;
    userid?: string;
    strutturaid?: string;
    periodo: string;
    tipo: "UTENTE" | "COACH" | "GESTORE" | "ADMIN";
    distanzatotale?: number;            // UTENTE
    tempototaleminuti?: number;         // UTENTE/COACH
    ritmomedio?: number;                // UTENTE
    utentiSeguiti?: number;             // COACH
    frequenzaMediaCorsi?: number;       // COACH
    incassototale?: number;             // GESTORE
    accessigiornalieri?: number;        // GESTORE
    abbonamentiattivi?: number;         // GESTORE/ADMIN
    totaleStrutture?: number;           // ADMIN
    totaleUtenti?: number;              // ADMIN
    ricavoAggregato?: number;           // ADMIN
    formato: "PDF" | "CSV";
    generatoat: string;
}

/** R10: Audit log per tutte le operazioni amministrative */
export interface AuditLogOperazione {
    id: string;
    utenteId: string;                   // chi ha eseguito l'operazione
    azione: string;                     // es. "CREAZIONE_SUB", "USO_COUPON", "PAGAMENTO"
    datiJSON: Record<string, unknown>;  // payload dell'operazione
    timestamp: string;
}
