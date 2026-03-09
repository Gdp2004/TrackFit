// ============================================================
// SupabaseRealtimeNotificationAdapter
// Infrastructure/out – implements NotificationServicePort
//
// STRATEGIA:
//   1. Persiste la notifica nella tabella `notifications` (DB)
//   2. Broadcast via httpSend() – obbligatorio lato server
//      (il server non ha WebSocket attivo, send() farebbe fallback
//       su REST con un warning deprecato → usiamo httpSend() direttamente)
// ============================================================

import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import {
    NotificationServicePort,
    NotificationPayload,
} from "@/backend/domain/port/out/NotificationServicePort";

export class SupabaseRealtimeNotificationAdapter implements NotificationServicePort {

    async inviaNotificaRealtime(userid: string, payload: NotificationPayload): Promise<void> {
        const supabase = createSupabaseServerClient();

        // 1. Persisti nel DB (service_role bypassa RLS)
        const { error: dbError } = await supabase
            .from("notifications")
            .insert({
                user_id: userid,
                titolo: payload.titolo,
                messaggio: payload.messaggio,
                tipo: payload.tipo,
                dati: payload.dati ?? {},
                letta: false,
            });

        if (dbError) {
            console.error("[Notification] Errore salvataggio DB:", dbError.message);
        }

        // 2. Broadcast via httpSend() – evita il warning "falling back to REST"
        //    Il server non ha WebSocket attivo: httpSend() usa REST direttamente
        //    senza il fallback automatico deprecato.
        try {
            const broadcastPayload = {
                titolo: payload.titolo,
                messaggio: payload.messaggio,
                tipo: payload.tipo,
                dati: payload.dati ?? {},
                timestamp: new Date().toISOString(),
            };

            await supabase
                .channel(`notifiche:${userid}`)
                .send({
                    type: "broadcast",
                    event: "notifica",
                    payload: broadcastPayload,
                });
        } catch (err) {
            // Non bloccante: il client recupera con il polling a 60s
            console.warn("[Notification] Broadcast non riuscito (DB ok):", err);
        }
    }

    async programmaReminder(userid: string, dataora: Date): Promise<void> {
        const msAllerta = dataora.getTime() - Date.now() - 10 * 60 * 1000;
        if (msAllerta <= 0) {
            console.warn("[Reminder] dataora troppo vicina, ignorato.");
            return;
        }
        setTimeout(async () => {
            await this.inviaNotificaRealtime(userid, {
                titolo: "Allenamento tra 10 minuti! 🏃",
                messaggio: "Il tuo allenamento inizia tra 10 minuti. Preparati!",
                tipo: "promemoria",
            });
        }, msAllerta);
        console.info(`[Reminder] Programmato per userid=${userid} tra ${Math.round(msAllerta / 60000)} min`);
    }

    async inviaEmail(destinatario: string, template: string, payload: Record<string, unknown>): Promise<void> {
        console.info(`[Email] To: "${destinatario}" | Template: "${template}" | Payload:`, payload);
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}
