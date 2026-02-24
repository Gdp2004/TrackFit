// ============================================================
// Port/out – NotificationServicePort
// Outbound notification interface (Hexagonal Architecture)
// Web-only: Supabase Realtime for in-app, Nodemailer for email
// ============================================================

export interface NotificationPayload {
    titolo: string;
    messaggio: string;
    tipo: "promemoria" | "modifica_piano" | "conferma" | "lista_attesa" | "cancellazione";
    dati?: Record<string, unknown>;
}

export interface NotificationServicePort {
    /**
     * Invia una notifica in-app via Supabase Realtime.
     * Il client React si iscrive al canale dell'utente e la riceve live.
     */
    inviaNotificaRealtime(userid: string, payload: NotificationPayload): Promise<void>;

    /**
     * Programma una notifica Realtime (SDD UC3: 10 min prima dell'allenamento).
     * Usa un timeout lato server o un Supabase Cron job.
     */
    programmaReminder(userid: string, dataora: Date): Promise<void>;

    /** Invia email tramite SMTP (Nodemailer). */
    inviaEmail(destinatario: string, template: string, payload: Record<string, unknown>): Promise<void>;
}
