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
    dataNascita?: string;       // ISO date
    peso?: number;              // kg – parametri fisici SDD §3.1
    altezza?: number;           // cm
    coachId?: string;           // associazione coach (UC1)
    createdAt: string;
}

export interface Coach {
    id: string;
    userId: string;             // FK → users
    strutturaId?: string;       // palestra di riferimento
    specializzazione: string;
    rating?: number;            // 0-5
    disponibilita?: SlotDisponibilita[];
}

export interface SlotDisponibilita {
    giornoSettimana: number;    // 0 = domenica
    oraInizio: string;          // "HH:MM"
    oraFine: string;
}

// ─── Workouts ────────────────────────────────────────────────
export interface Workout {
    id: string;
    userId: string;
    tipo: TipoWorkoutEnum | string;
    dataOra: string;            // ISO datetime
    durata: number;             // minuti
    obiettivo?: string;
    stato: WorkoutStatoEnum;
    percezionesSforzo?: number; // RPE 1-10
    note?: string;
    distanza?: number;          // km
    frequenzaCardiacaMedia?: number;
    calorie?: number;
    gpxTrace?: string;          // URL file GPX (Supabase Storage)
    stravaId?: string;          // deduplication UC5
    sorgente: "TRACKING" | "IMPORT";
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
    userId: string;
    strutturaId?: string;
    tipoId?: string;
    stato: StatoAbbonamentoEnum;
    qrCode?: string;
    dataInizio: string;
    dataFine: string;
    importo: number;
    rinnovoAutomatico?: boolean;    // FR21: auto-renewal toggle
}

/** FR7: Tipo abbonamento configurabile dal Gestore */
export interface TipoAbbonamento {
    id: string;
    strutturaId: string;
    nome: string;                   // es. "Mensile", "Annuale"
    durataMesi: number;
    prezzo: number;
    rinnovabile: boolean;
}

/** R4: Coupon promozionale */
export interface Coupon {
    id: string;
    codice: string;                 // es. "PROMO2025"
    strutturaId: string;            // R4: valido solo per struttura specifica
    tipoAbbonamentoId: string;      // R4: valido solo per piano specifico
    percentualeSconto: number;      // R4: sconto percentuale (es. 50)
    monoUso: boolean;               // R4: un solo utilizzo per utente
    scadenza: string;               // R4: data di scadenza (ISO date)
    utenteId?: string;              // popolato quando riscattato
    usato: boolean;
}

export interface Pagamento {
    id: string;
    userId: string;
    abbonamentoId?: string;
    importo: number;
    valuta: string;             // default "eur"
    stato: StatoPagamentoEnum;
    stripePaymentIntentId?: string;
    metodo?: string;            // "card", "sepa_debit"
    createdAt: string;
}

// ─── Gym / Struttura ─────────────────────────────────────────
export interface Struttura {
    id: string;
    piva: string;               // R8: unico
    cun: string;                // R9: unico (Codice Univoco Nazionale)
    denominazione: string;
    indirizzo: string;
    stato: "Attiva" | "Sospesa";
    gestoreId: string;
}

export interface Corso {
    id: string;
    strutturaId: string;
    coachId?: string;
    nome: string;
    dataOra: string;
    capacitaMassima: number;
    postiOccupati: number;
    durata: number;             // minuti
}

/** Lista d'attesa automatica quando corso è pieno (SDD §3.5 R6) */
export interface ListaAttesa {
    id: string;
    corsoId: string;
    userId: string;
    posizione: number;          // posizione in coda (1-based)
    timestamp: string;
}

export interface Prenotazione {
    id: string;
    userId: string;
    coachId?: string;
    corsoId?: string;
    strutturaId?: string;
    dataOra: string;
    stato: StatoPrenotazioneEnum;
    importoTotale: number;
    rimborso?: number;
}

// ─── Audit / Reports ─────────────────────────────────────────
/** Log modifiche del coach al piano atleta (R1 obbligatorio) */
export interface AuditLog {
    id: string;
    coachId: string;
    sessioneId: string;
    vecchiaDataOra: string;
    nuovaDataOra: string;
    motivazione: string;
    timestamp: string;
}

export interface Report {
    id: string;
    userId?: string;
    strutturaId?: string;
    periodo: string;
    tipo: "UTENTE" | "COACH" | "GESTORE" | "ADMIN";
    distanzaTotale?: number;            // UTENTE
    tempoTotaleMinuti?: number;         // UTENTE/COACH
    ritmoMedio?: number;                // UTENTE
    utentiSeguiti?: number;             // COACH
    frequenzaMediaCorsi?: number;       // COACH
    incassoTotale?: number;             // GESTORE
    accessiGiornalieri?: number;        // GESTORE
    abbonamentiAttivi?: number;         // GESTORE/ADMIN
    totaleStrutture?: number;           // ADMIN
    totaleUtenti?: number;              // ADMIN
    ricavoAggregato?: number;           // ADMIN
    formato: "PDF" | "CSV";
    generatoAt: string;
}

/** R10: Audit log per tutte le operazioni amministrative */
export interface AuditLogOperazione {
    id: string;
    utenteId: string;                   // chi ha eseguito l'operazione
    azione: string;                     // es. "CREAZIONE_SUB", "USO_COUPON", "PAGAMENTO"
    datiJSON: Record<string, unknown>;  // payload dell'operazione
    timestamp: string;
}
