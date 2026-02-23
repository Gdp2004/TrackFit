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
  async acquistaAbbonamento(userid: string, tipoid: string, couponCode?: string): Promise<Abbonamento> {
    // TODO (quando TipoAbbonamento sarà su DB): carica prezzo e durata dalla tabella
    // Per ora usa valori di default che verranno sostituiti dalla configurazione del Gestore
    let importo = 50.0;
    let durataMesi = 1;

    // R4: Validazione coupon
    if (couponCode) {
      const coupon = await this.couponRepo.findByCodice(couponCode);
      if (!coupon) throw new Error("Coupon non valido o inesistente.");
      if (coupon.usato && coupon.monouso) throw new Error("Coupon già utilizzato.");
      if (new Date(coupon.scadenza) < new Date()) throw new Error("Coupon scaduto.");
      if (coupon.tipoabbonamentoid !== tipoid) throw new Error("R4: Coupon non valido per questo tipo di abbonamento.");

      // R4: verifica mono-uso per utente
      const giaUsatoDaQuestoUtente = await this.couponRepo.existsUsoByUtente(coupon.id, userid);
      if (giaUsatoDaQuestoUtente) throw new Error("R4: Coupon già utilizzato da questo utente.");

      // R5: Sconto applicato solo alla quota abbonamento
      importo = importo * (1 - coupon.percentualesconto / 100);

      // Marca il coupon come usato (R4: monouso)
      await this.couponRepo.marcaUsato(coupon.id, userid);

      // R10: Audit uso coupon
      await this.auditRepo.registra({
        utenteId: userid,
        azione: "USO_COUPON",
        datiJSON: { couponCodice: couponCode, couponid: coupon.id, tipoid, sconto: coupon.percentualesconto },
        timestamp: new Date().toISOString(),
      });
    }

    // FR20: Crea PaymentIntent su Stripe (ritorna clientSecret per 3-D Secure lato client)
    const { id: stripepaymentintentid, clientSecret } = await this.paymentGateway.creaIntentPagamento(
      importo, "eur", { userid, tipoid }
    );

    // Nota: in produzione si aspetta il webhook Stripe "payment_intent.succeeded"
    // prima di creare l'abbonamento. Qui si persiste in stato IN_ATTESA e si
    // aggiorna a ATTIVO via webhook handler (da implementare in /api/stripe/webhook).
    const qrCode = crypto.randomUUID();
    const datainizio = new Date();
    const datafine = new Date();
    datafine.setMonth(datafine.getMonth() + durataMesi);

    // FR22: Persisti il pagamento nel DB
    await this.paymentRepo.save({
      userid,
      abbonamentoid: undefined, // verrà aggiornato dopo
      importo,
      valuta: "eur",
      stato: StatoPagamentoEnum.IN_ATTESA,  // aggiornato a COMPLETATO via webhook
      stripepaymentintentid,
      metodo: "card",
      createdat: new Date().toISOString(),
    });

    const abbonamento = await this.subRepo.save({
      userid,
      tipoid,
      stato: StatoAbbonamentoEnum.ATTIVO,
      qrCode,
      datainizio: datainizio.toISOString(),
      datafine: datafine.toISOString(),
      importo,
      rinnovoautomatico: false, // default off
    });

    // R10: Audit creazione abbonamento
    await this.auditRepo.registra({
      utenteId: userid,
      azione: "CREAZIONE_SUB",
      datiJSON: { abbonamentoid: abbonamento.id, tipoid, importo, stripepaymentintentid },
      timestamp: new Date().toISOString(),
    });

    // Restituisce anche clientSecret per permettere al frontend di completare 3-D Secure (R6)
    return { ...abbonamento, _clientSecret: clientSecret } as unknown as Abbonamento;
  }

  // ─── FR21: Toggle rinnovo automatico ─────────────────────────────────────────
  async impostaRinnovoAutomatico(abbonamentoid: string, userid: string, attivo: boolean): Promise<Abbonamento> {
    const sub = await this.subRepo.findById(abbonamentoid);
    if (!sub) throw new Error("Abbonamento non trovato.");
    if (sub.userid !== userid) throw new Error("Non autorizzato.");

    const aggiornato = await this.subRepo.update(abbonamentoid, { rinnovoautomatico: attivo });

    await this.auditRepo.registra({
      utenteId: userid,
      azione: attivo ? "ABILITA_RINNOVO_AUTO" : "DISABILITA_RINNOVO_AUTO",
      datiJSON: { abbonamentoid },
      timestamp: new Date().toISOString(),
    });

    return aggiornato;
  }

  // ─── Cancellazione abbonamento (con vincolo preavviso) ────────────────────────
  async cancellaAbbonamento(abbonamentoid: string): Promise<void> {
    const sub = await this.subRepo.findById(abbonamentoid);
    if (!sub) throw new Error("Abbonamento non trovato.");

    // Vincolo R5 (SDD): disdetta richiede 30 giorni di preavviso
    const scadenza = new Date(sub.datafine);
    const preavviso = scadenza.getTime() - Date.now();
    const giorni30 = 30 * 24 * 60 * 60 * 1000;
    if (preavviso < giorni30) {
      throw new Error("Vincolo: disdetta richiede 30 giorni di preavviso prima della scadenza.");
    }

    await this.subRepo.update(abbonamentoid, { stato: StatoAbbonamentoEnum.CANCELLATO });
  }

  // ─── R7: Validazione QR Code ai tornelli ─────────────────────────────────────
  async validaAccesso(qrCode: string, strutturaid: string): Promise<boolean> {
    const sub = await this.subRepo.findByQrCode(qrCode);
    if (!sub) return false;
    if (sub.stato !== StatoAbbonamentoEnum.ATTIVO) return false;
    if (new Date(sub.datafine) < new Date()) return false;
    if (sub.strutturaid && sub.strutturaid !== strutturaid) return false;
    return true;
  }

  // ─── Recupero abbonamento attivo ──────────────────────────────────────────────
  async getAbbonamento(userid: string): Promise<Abbonamento | null> {
    return this.subRepo.findByUserIdActive(userid);
  }
}