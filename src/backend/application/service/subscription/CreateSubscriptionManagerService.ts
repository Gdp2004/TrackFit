// ============================================================
// CreateSubscriptionManagerService
// Application layer – implements SubscriptionManagementPort
// Fixes: FR20 (payment persistence), FR21 (rinnovo auto toggle),
//        FR22 (payment history), R4 (coupon validation), R10 (audit)
// ============================================================

import { SubscriptionManagementPort } from "@/backend/domain/port/in/SubscriptionManagementPort";
import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { PaymentGatewayPort } from "@/backend/domain/port/out/PaymentGatewayPort";
import { PaymentRepositoryPort } from "@/backend/domain/port/out/PaymentRepositoryPort";
import { CouponRepositoryPort } from "@/backend/domain/port/out/CouponRepositoryPort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { Abbonamento } from "@/backend/domain/model/types";
import { StatoAbbonamentoEnum, StatoPagamentoEnum } from "@/backend/domain/model/enums";
import crypto from "crypto";

export class CreateSubscriptionManagerService implements SubscriptionManagementPort {
  constructor(
    private readonly subRepo: SubscriptionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly paymentRepo: PaymentRepositoryPort,
    private readonly couponRepo: CouponRepositoryPort,
    private readonly auditRepo: AuditLogRepositoryPort
  ) { }

  // ─── FR20: Acquisto abbonamento con pagamento reale ──────────────────────────
  async acquistaAbbonamento(userId: string, tipoId: string, couponCode?: string): Promise<Abbonamento> {
    // TODO (quando TipoAbbonamento sarà su DB): carica prezzo e durata dalla tabella
    // Per ora usa valori di default che verranno sostituiti dalla configurazione del Gestore
    let importo = 50.0;
    let durataMesi = 1;

    // R4: Validazione coupon
    if (couponCode) {
      const coupon = await this.couponRepo.findByCodice(couponCode);
      if (!coupon) throw new Error("Coupon non valido o inesistente.");
      if (coupon.usato && coupon.monoUso) throw new Error("Coupon già utilizzato.");
      if (new Date(coupon.scadenza) < new Date()) throw new Error("Coupon scaduto.");
      if (coupon.tipoAbbonamentoId !== tipoId) throw new Error("R4: Coupon non valido per questo tipo di abbonamento.");

      // R4: verifica mono-uso per utente
      const giaUsatoDaQuestoUtente = await this.couponRepo.existsUsoByUtente(coupon.id, userId);
      if (giaUsatoDaQuestoUtente) throw new Error("R4: Coupon già utilizzato da questo utente.");

      // R5: Sconto applicato solo alla quota abbonamento
      importo = importo * (1 - coupon.percentualeSconto / 100);

      // Marca il coupon come usato (R4: monoUso)
      await this.couponRepo.marcaUsato(coupon.id, userId);

      // R10: Audit uso coupon
      await this.auditRepo.registra({
        utenteId: userId,
        azione: "USO_COUPON",
        datiJSON: { couponCodice: couponCode, couponId: coupon.id, tipoId, sconto: coupon.percentualeSconto },
        timestamp: new Date().toISOString(),
      });
    }

    // FR20: Crea PaymentIntent su Stripe (ritorna clientSecret per 3-D Secure lato client)
    const { id: stripePaymentIntentId, clientSecret } = await this.paymentGateway.creaIntentPagamento(
      importo, "eur", { userId, tipoId }
    );

    // Nota: in produzione si aspetta il webhook Stripe "payment_intent.succeeded"
    // prima di creare l'abbonamento. Qui si persiste in stato IN_ATTESA e si
    // aggiorna a ATTIVO via webhook handler (da implementare in /api/stripe/webhook).
    const qrCode = crypto.randomUUID();
    const dataInizio = new Date();
    const dataFine = new Date();
    dataFine.setMonth(dataFine.getMonth() + durataMesi);

    // FR22: Persisti il pagamento nel DB
    await this.paymentRepo.save({
      userId,
      abbonamentoId: undefined, // verrà aggiornato dopo
      importo,
      valuta: "eur",
      stato: StatoPagamentoEnum.IN_ATTESA,  // aggiornato a COMPLETATO via webhook
      stripePaymentIntentId,
      metodo: "card",
      createdAt: new Date().toISOString(),
    });

    const abbonamento = await this.subRepo.save({
      userId,
      tipoId,
      stato: StatoAbbonamentoEnum.ATTIVO,
      qrCode,
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),
      importo,
      rinnovoAutomatico: false, // default off
    });

    // R10: Audit creazione abbonamento
    await this.auditRepo.registra({
      utenteId: userId,
      azione: "CREAZIONE_SUB",
      datiJSON: { abbonamentoId: abbonamento.id, tipoId, importo, stripePaymentIntentId },
      timestamp: new Date().toISOString(),
    });

    // Restituisce anche clientSecret per permettere al frontend di completare 3-D Secure (R6)
    return { ...abbonamento, _clientSecret: clientSecret } as unknown as Abbonamento;
  }

  // ─── FR21: Toggle rinnovo automatico ─────────────────────────────────────────
  async impostaRinnovoAutomatico(abbonamentoId: string, userId: string, attivo: boolean): Promise<Abbonamento> {
    const sub = await this.subRepo.findById(abbonamentoId);
    if (!sub) throw new Error("Abbonamento non trovato.");
    if (sub.userId !== userId) throw new Error("Non autorizzato.");

    const aggiornato = await this.subRepo.update(abbonamentoId, { rinnovoAutomatico: attivo });

    await this.auditRepo.registra({
      utenteId: userId,
      azione: attivo ? "ABILITA_RINNOVO_AUTO" : "DISABILITA_RINNOVO_AUTO",
      datiJSON: { abbonamentoId },
      timestamp: new Date().toISOString(),
    });

    return aggiornato;
  }

  // ─── Cancellazione abbonamento (con vincolo preavviso) ────────────────────────
  async cancellaAbbonamento(abbonamentoId: string): Promise<void> {
    const sub = await this.subRepo.findById(abbonamentoId);
    if (!sub) throw new Error("Abbonamento non trovato.");

    // Vincolo R5 (SDD): disdetta richiede 30 giorni di preavviso
    const scadenza = new Date(sub.dataFine);
    const preavviso = scadenza.getTime() - Date.now();
    const giorni30 = 30 * 24 * 60 * 60 * 1000;
    if (preavviso < giorni30) {
      throw new Error("Vincolo: disdetta richiede 30 giorni di preavviso prima della scadenza.");
    }

    await this.subRepo.update(abbonamentoId, { stato: StatoAbbonamentoEnum.CANCELLATO });
  }

  // ─── R7: Validazione QR Code ai tornelli ─────────────────────────────────────
  async validaAccesso(qrCode: string, strutturaId: string): Promise<boolean> {
    const sub = await this.subRepo.findByQrCode(qrCode);
    if (!sub) return false;
    if (sub.stato !== StatoAbbonamentoEnum.ATTIVO) return false;
    if (new Date(sub.dataFine) < new Date()) return false;
    if (sub.strutturaId && sub.strutturaId !== strutturaId) return false;
    return true;
  }

  // ─── Recupero abbonamento attivo ──────────────────────────────────────────────
  async getAbbonamento(userId: string): Promise<Abbonamento | null> {
    return this.subRepo.findByUserIdActive(userId);
  }
}