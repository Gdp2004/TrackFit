// ============================================================
// CreateSubscriptionManagerService
// Application layer – implements SubscriptionManagementPort (UC8/UC9)
// ============================================================

import { SubscriptionManagementPort } from "@/backend/domain/port/in/SubscriptionManagementPort";
import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { PaymentGatewayPort } from "@/backend/domain/port/out/PaymentGatewayPort";
import { Abbonamento } from "@/backend/domain/model/types";
import { StatoAbbonamentoEnum } from "@/backend/domain/model/enums";
import crypto from "crypto";

export class CreateSubscriptionManagerService implements SubscriptionManagementPort {
  constructor(
    private readonly subRepo: SubscriptionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort
  ) { }

  async acquistaAbbonamento(userId: string, tipoId: string, couponCode?: string): Promise<Abbonamento> {
    // Mock payment intent creation (in real life, we check standard pricing from config/db)
    const importo = couponCode === "SCONTO50" ? 25.0 : 50.0;

    await this.paymentGateway.creaIntentPagamento(importo, "eur", { userId, tipoId });

    // Assuming payment succeeds synchronously for this facade (usually async via webhook)
    const qrCode = crypto.randomUUID();
    const dataInizio = new Date();
    const dataFine = new Date();
    dataFine.setMonth(dataFine.getMonth() + 1);

    const abbonamento = await this.subRepo.save({
      userId,
      tipoId,
      stato: StatoAbbonamentoEnum.ATTIVO,
      qrCode,
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),
      importo
    });

    return abbonamento;
  }

  async cancellaAbbonamento(abbonamentoId: string): Promise<void> {
    const sub = await this.subRepo.findById(abbonamentoId);
    if (!sub) throw new Error("Abbonamento non trovato.");

    // OCL Vincolo R5: 30 days notice required
    const scadenza = new Date(sub.dataFine);
    const preavviso = scadenza.getTime() - Date.now();
    const giorni30 = 30 * 24 * 60 * 60 * 1000;

    if (preavviso < giorni30) {
      throw new Error("Vincolo R5: disdetta richiede 30 giorni di preavviso sulla scadenza.");
    }

    await this.subRepo.update(abbonamentoId, { stato: StatoAbbonamentoEnum.CANCELLATO });
  }

  async validaAccesso(qrCode: string, strutturaId: string): Promise<boolean> {
    const sub = await this.subRepo.findByQrCode(qrCode);
    if (!sub) return false;

    if (sub.stato !== StatoAbbonamentoEnum.ATTIVO) return false;
    if (new Date(sub.dataFine) < new Date()) return false;
    if (sub.strutturaId && sub.strutturaId !== strutturaId) return false; // Fixed gym limit check

    return true;
  }

  async getAbbonamento(userId: string): Promise<Abbonamento | null> {
    return this.subRepo.findByUserIdActive(userId);
  }
}