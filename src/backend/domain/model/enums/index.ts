// ============================================================
// TrackFit – Domain Enums
// Source: SDD section 4.5 (State Pattern) + RAD §2
// ============================================================

/** Stato macchina (SDD §4.5) – ciclo di vita di una sessione allenamento */
export enum WorkoutStatoEnum {
    PIANIFICATA = "PIANIFICATA",
    IN_CORSO = "IN_CORSO",
    IN_PAUSA = "IN_PAUSA",
    INTERROTTA = "INTERROTTA",
    COMPLETATA_LOCALMENTE = "COMPLETATA_LOCALMENTE",
    IN_ATTESA_DI_RETE = "IN_ATTESA_DI_RETE",
    IN_SINCRONIZZAZIONE = "IN_SINCRONIZZAZIONE",
    CONSOLIDATA = "CONSOLIDATA",
}

/** Ruoli RBAC (SDD – Access Control Matrix) */
export enum RuoloEnum {
    UTENTE = "UTENTE",
    COACH = "COACH",
    GESTORE = "GESTORE",
    ADMIN = "ADMIN",
}

/** Stato abbonamento – lifecycle (SDD §3.3) */
export enum StatoAbbonamentoEnum {
    ATTIVO = "ATTIVO",
    SOSPESO = "SOSPESO",
    SCADUTO = "SCADUTO",
    CANCELLATO = "CANCELLATO",
}

/** Stato prenotazione corso/coach (SDD §3.5) */
export enum StatoPrenotazioneEnum {
    CONFERMATA = "CONFERMATA",
    CANCELLATA = "CANCELLATA",
    IN_ATTESA = "IN_ATTESA",   // lista d'attesa (R6)
}

/** Stato pagamento Stripe (SDD §4.4) */
export enum StatoPagamentoEnum {
    IN_ATTESA = "IN_ATTESA",
    COMPLETATO = "COMPLETATO",
    FALLITO = "FALLITO",
    RIMBORSATO = "RIMBORSATO",
}

/** Tipologie di allenamento supportate (RAD §2 – Workout domain) */
export enum TipoWorkoutEnum {
    CORSA = "CORSA",
    CICLISMO = "CICLISMO",
    NUOTO = "NUOTO",
    PALESTRA = "PALESTRA",
    YOGA = "YOGA",
    CAMMINO = "CAMMINO",
    ALTRO = "ALTRO",
}
