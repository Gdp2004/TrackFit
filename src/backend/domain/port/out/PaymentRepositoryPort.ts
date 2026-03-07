// ============================================================
// Port/out – PaymentRepositoryPort
// FR22: Persistenza storico pagamenti
// R10: Ogni pagamento viene registrato nell'audit
// ============================================================

import { Pagamento } from "@/backend/domain/model/types";

export interface PaymentRepositoryPort {
    save(pagamento: Partial<Pagamento>): Promise<Pagamento>;
    update(id: string, pagamento: Partial<Pagamento>): Promise<Pagamento>;
    findById(id: string): Promise<Pagamento | null>;
    findByUserId(userid: string): Promise<Pagamento[]>;
    findByAbbonamentoId(abbonamentoid: string): Promise<Pagamento[]>;
}
