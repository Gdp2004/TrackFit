// ============================================================
// StripeAdapter
// Infrastructure layer – implements PaymentGatewayPort
// ============================================================

import { PaymentGatewayPort } from "@/backend/domain/port/out/PaymentGatewayPort";
import { Pagamento } from "@/backend/domain/model/types";
import { StatoPagamentoEnum } from "@/backend/domain/model/enums";
import Stripe from "stripe";

export class StripeAdapter implements PaymentGatewayPort {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia", // Current stable version
    });
  }

  async creaIntentPagamento(importo: number, valuta: string, metadata: Record<string, string>): Promise<{ clientSecret: string; id: string; }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(importo * 100), // Stripe expects cents
      currency: valuta,
      metadata,
    });

    if (!paymentIntent.client_secret) throw new Error("Errore Stripe: client_secret non generato.");

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    };
  }

  async verificaPagamento(paymentId: string): Promise<Pagamento> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentId);

    let stato = StatoPagamentoEnum.IN_ATTESA;
    if (intent.status === "succeeded") stato = StatoPagamentoEnum.COMPLETATO;
    if (intent.status === "requires_payment_method" || intent.status === "canceled") stato = StatoPagamentoEnum.FALLITO;

    return {
      id: paymentId,
      userid: intent.metadata.userid || "unknown",
      importo: intent.amount / 100,
      valuta: intent.currency,
      stato,
      stripepaymentintentid: paymentId,
      createdat: new Date().toISOString()
    };
  }

  async rimborsaPagamento(paymentId: string, importo?: number): Promise<void> {
    await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: importo ? Math.round(importo * 100) : undefined
    });
  }
}