import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";
import { Abbonamento } from "@backend/domain/model/types";
import { StatoAbbonamentoEnum } from "@backend/domain/model/enums";
import crypto from "crypto";

/** CreateSubscriptionManagerService â€“ acquisto e gestione abbonamento (UC8, UC9). */
export class CreateSubscriptionManagerService {
  async acquistaAbbonamento(userId: string, tipoId: string, couponCode?: string): Promise<Abbonamento> {
    if (!userId || !tipoId) throw new Error("userId e tipoId sono obbligatori.");
    const supabase = createSupabaseServerClient();

    // Verifica coupon (SDD Â§3.3)
    let sconto = 0;
    if (couponCode) {
      const { data: coupon } = await supabase.from("coupon").select("*").eq("codice", couponCode).single();
      if (!coupon || coupon.rimosso) throw new Error("Coupon non valido o giÃ  utilizzato.");
      sconto = coupon.sconto;
    }

    // Genera QR code univoco
    const qrCode = crypto.randomUUID();

    const { data, error } = await supabase.from("abbonamenti").insert({
      userId, tipoId, stato: StatoAbbonamentoEnum.ATTIVO,
      qrCode, dataInizio: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return data as Abbonamento;
  }

  async validaAccesso(qrCode: string, strutturaId: string): Promise<boolean> {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.from("abbonamenti").select("*")
      .eq("qrCode", qrCode).eq("strutturaId", strutturaId).eq("stato", StatoAbbonamentoEnum.ATTIVO).single();
    if (!data || new Date(data.dataFine) < new Date()) return false;
    await supabase.from("accessi").insert({ qrCode, strutturaId, timestamp: new Date().toISOString() });
    return true;
  }
}