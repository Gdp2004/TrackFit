// ============================================================
// SupabaseRealtimeNotificationAdapter
// Infrastructure/out – implements NotificationServicePort
// Uses Supabase Realtime (Broadcast) for in-app notifications
// Web-only – no Firebase, no FCM
// ============================================================
//
// COME FUNZIONA:
//   Server → pubblica un evento su canale "notifiche:{userid}"
//   Client → si iscrive con supabase.channel('notifiche:{userid}')
//            e riceve l'evento in tempo reale (WebSocket)
//
// ESEMPIO CLIENT (da usare nei componenti React):
//
//   const channel = supabase
//     .channel(`notifiche:${userid}`)
//     .on('broadcast', { event: 'notifica' }, ({ payload }) => {
//       console.log('Nuova notifica:', payload)
//       // → mostra un toast / aggiorna il bell badge
//     })
//     .subscribe()
//
// ============================================================

import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import {
    NotificationServicePort,
    NotificationPayload,
} from "@/backend/domain/port/out/NotificationServicePort";
import nodemailer from "nodemailer";

export class SupabaseRealtimeNotificationAdapter implements NotificationServicePort {

    // ─── Supabase Realtime Broadcast ─────────────────────────────────────────
    async inviaNotificaRealtime(userid: string, payload: NotificationPayload): Promise<void> {
        const supabase = createSupabaseServerClient();

        const status = await supabase
            .channel(`notifiche:${userid}`)          // canale privato per utente
            .send({
                type: "broadcast",
                event: "notifica",
                payload: {
                    titolo: payload.titolo,
                    messaggio: payload.messaggio,
                    tipo: payload.tipo,
                    dati: payload.dati ?? {},
                    timestamp: new Date().toISOString(),
                },
            });

        if (status !== "ok") {
            console.error("[Realtime] Errore invio notifica, status:", status);
            throw new Error(`Notifica Realtime fallita: ${status}`);
        }
    }

    // ─── Reminder programmato (SDD UC3: 10 min prima) ────────────────────────
    async programmaReminder(userid: string, dataora: Date): Promise<void> {
        const msAllerta = dataora.getTime() - Date.now() - 10 * 60 * 1000;

        if (msAllerta <= 0) {
            console.warn("[Reminder] dataora troppo vicina, reminder ignorato.");
            return;
        }

        // Scheduling in-process (OK per dev/monolitico).
        // In produzione: sostituire con Supabase pg_cron o una Edge Function schedulata.
        setTimeout(async () => {
            await this.inviaNotificaRealtime(userid, {
                titolo: "Allenamento tra 10 minuti! 🏃",
                messaggio: "Il tuo allenamento inizia tra 10 minuti. Preparati!",
                tipo: "promemoria",
            });
        }, msAllerta);

        console.info(`[Reminder] Programmato per userid=${userid} tra ${Math.round(msAllerta / 60000)} min`);
    }

    // ─── Email via Nodemailer (SMTP) ─────────────────────────────────────────
    async inviaEmail(
        destinatario: string,
        template: string,
        payload: Record<string, unknown>
    ): Promise<void> {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Template minimale – in produzione usa HTML con handlebars o react-email
        await transporter.sendMail({
            from: `"TrackFit" <${process.env.SMTP_USER}>`,
            to: destinatario,
            subject: `TrackFit – ${template}`,
            text: JSON.stringify(payload, null, 2),
        });

        console.info(`[Email] Inviata template="${template}" a "${destinatario}"`);
    }
}
