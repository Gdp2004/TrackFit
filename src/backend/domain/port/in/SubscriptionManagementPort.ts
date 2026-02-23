// ============================================================
// Port/in – SubscriptionManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.3 (UC8/UC9)
// ============================================================

import { Abbonamento } from "@/backend/domain/model/types";

export interface SubscriptionManagementPort {
    acquistaAbbonamento(userid: string, tipoid: string, couponCode?: string): Promise<Abbonamento>;
    cancellaAbbonamento(abbonamentoid: string): Promise<void>;
    validaAccesso(qrCode: string, strutturaid: string): Promise<boolean>;
    getAbbonamento(userid: string): Promise<Abbonamento | null>;
    impostaRinnovoAutomatico(abbonamentoid: string, userid: string, attivo: boolean): Promise<Abbonamento>; // FR21
}
