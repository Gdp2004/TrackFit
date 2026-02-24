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
        const { data, error } = await supabase
            .from("audit_log")
            .insert(log)
            .select()
            .single();
        if (error) {
            // Il fallimento del log non deve bloccare l'operazione principale
            console.error(`[AuditLog] Errore registrazione: ${error.message}`, log);
            return { id: "error", ...log };
        }
        return data as AuditLogOperazione;
    }

    async findByUtenteId(utenteId: string): Promise<AuditLogOperazione[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("audit_log")
            .select("*")
            .eq("utenteId", utenteId)
            .order("timestamp", { ascending: false });
        if (error) return [];
        return (data ?? []) as AuditLogOperazione[];
    }

    async findRecenti(limit = 50): Promise<AuditLogOperazione[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("audit_log")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(limit);
        if (error) return [];
        return (data ?? []) as AuditLogOperazione[];
    }
}
