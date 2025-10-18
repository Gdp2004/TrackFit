// ============================================================
// TrackFit – Domain Enums
// Source: SDD section 4.5 (State Pattern – Workout lifecycle)
// ============================================================

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

export enum RuoloEnum {
    UTENTE = "UTENTE",
    COACH = "COACH",
    GESTORE = "GESTORE",
    ADMIN = "ADMIN",
}

export enum StatoAbbonamentoEnum {
    ATTIVO = "ATTIVO",
    SOSPESO = "SOSPESO",
    SCADUTO = "SCADUTO",
    CANCELLATO = "CANCELLATO",
}

export enum StatoPrenotazioneEnum {
    CONFERMATA = "CONFERMATA",
    CANCELLATA = "CANCELLATA",
    IN_ATTESA = "IN_ATTESA",
}
