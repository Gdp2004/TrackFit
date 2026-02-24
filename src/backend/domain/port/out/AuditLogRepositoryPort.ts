// ============================================================
// Port/out – AuditLogRepositoryPort
// R10: Tutte le operazioni amministrative registrano un audit
// (coupon, pagamento, creazione SUB, fattura, modifica piano)
// ============================================================

import { AuditLogOperazione } from "@/backend/domain/model/types";

export interface AuditLogRepositoryPort {
    registra(log: Omit<AuditLogOperazione, "id">): Promise<AuditLogOperazione>;
    findByUtenteId(utenteId: string): Promise<AuditLogOperazione[]>;
    findRecenti(limit?: number): Promise<AuditLogOperazione[]>;
}
