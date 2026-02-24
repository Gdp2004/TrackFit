// ============================================================
// Port/out – PaymentGatewayPort
// Outbound payment interface (Hexagonal Architecture)
// ============================================================

import { Pagamento } from "@/backend/domain/model/types";

export interface PaymentGatewayPort {
    creaIntentPagamento(importo: number, valuta: string, metadata: Record<string, string>): Promise<{ clientSecret: string, id: string }>;
    verificaPagamento(paymentId: string): Promise<Pagamento>;
    rimborsaPagamento(paymentId: string, importo?: number): Promise<void>;
}
