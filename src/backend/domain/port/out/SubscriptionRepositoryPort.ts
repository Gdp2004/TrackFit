// ============================================================
// Port/out – SubscriptionRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Abbonamento } from "@/backend/domain/model/types";
import { StatoAbbonamentoEnum } from "@/backend/domain/model/enums";

export interface SubscriptionRepositoryPort {
    save(abbonamento: Partial<Abbonamento>): Promise<Abbonamento>;
    findById(id: string): Promise<Abbonamento | null>;
    findByUserIdActive(userid: string): Promise<Abbonamento | null>;
    findByQrCode(qrcode: string): Promise<Abbonamento | null>;
    update(id: string, data: Partial<Abbonamento>): Promise<Abbonamento>;
    existsActiveByUserId(userid: string): Promise<boolean>;
}
