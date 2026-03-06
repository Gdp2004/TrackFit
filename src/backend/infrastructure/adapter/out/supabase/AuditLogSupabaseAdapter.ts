// ============================================================
// AuditLogSupabaseAdapter
// Infrastructure layer – implements AuditLogRepositoryPort
// R10: Registrazione audit di tutte le operazioni amministrative
// ============================================================

import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { AuditLogOperazione } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class AuditLogSupabaseAdapter implements AuditLogRepositoryPort {
    async registra(log: Omit<AuditLogOperazione, "id">): Promise<AuditLogOperazione> {
        const supabase = createSupabaseServerClient();

        // Estrai un risorsaid valido dal payload, o usa l'id utente come fallback
        const risorsaid = log.datiJSON?.abbonamentoid || log.datiJSON?.couponid || log.datiJSON?.strutturaid || log.utenteId;

        const dbPayload = {
            operazione: log.azione,
            attoreid: log.utenteId,
            risorsaid: risorsaid,
            dettagli: log.datiJSON,
            timestamp: log.timestamp || new Date().toISOString()
        };

        const { data, error } = await supabase
            .from("audit_log")
            .insert(dbPayload)
            .select()
            .single();

        if (error) {
            // Il fallimento del log non deve bloccare l'operazione principale
            console.error(`[AuditLog] Errore registrazione: ${error.message}`, log);
            return { id: "error", ...log };
        }
        return this.mapToDomain(data);
    }

    async findByUtenteId(utenteId: string): Promise<AuditLogOperazione[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("audit_log")
            .select("*")
            .eq("attoreid", utenteId)
            .order("timestamp", { ascending: false });
        if (error) return [];
        return (data ?? []).map(this.mapToDomain);
    }

    async findRecenti(limit = 50): Promise<AuditLogOperazione[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("audit_log")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(limit);
        if (error) return [];
        return (data ?? []).map(this.mapToDomain);
    }

    private mapToDomain(row: any): AuditLogOperazione {
        return {
            id: row.id,
            utenteId: row.attoreid,
            azione: row.operazione,
            datiJSON: row.dettagli,
            timestamp: row.timestamp
        };
    }
}
