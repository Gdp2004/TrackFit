// ============================================================
// Port/in – SubscriptionManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.3 (UC8/UC9)
// ============================================================

import { Abbonamento } from "@/backend/domain/model/types";

export interface SubscriptionManagementPort {
    acquistaAbbonamento(userId: string, tipoId: string, couponCode?: string): Promise<Abbonamento>;
    cancellaAbbonamento(abbonamentoId: string): Promise<void>;
    validaAccesso(qrCode: string, strutturaId: string): Promise<boolean>;
    getAbbonamento(userId: string): Promise<Abbonamento | null>;
    impostaRinnovoAutomatico(abbonamentoId: string, userId: string, attivo: boolean): Promise<Abbonamento>; // FR21
}
