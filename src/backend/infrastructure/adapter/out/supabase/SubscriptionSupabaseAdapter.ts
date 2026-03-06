// ============================================================
// SubscriptionSupabaseAdapter
// Infrastructure layer – implements SubscriptionRepositoryPort
// ============================================================

import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { Abbonamento } from "@/backend/domain/model/types";
import { StatoAbbonamentoEnum } from "@/backend/domain/model/enums";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class SubscriptionSupabaseAdapter implements SubscriptionRepositoryPort {
    async save(abbonamento: Partial<Abbonamento>): Promise<Abbonamento> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("abbonamenti").insert(abbonamento).select().single();
        if (error) throw new Error(`DB Error (save sub): ${error.message}`);
        return data as Abbonamento;
    }

    async findById(id: string): Promise<Abbonamento | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("abbonamenti").select("*").eq("id", id).single();
        if (error) return null;
        return data as Abbonamento;
    }

    async findByUserIdActive(userid: string): Promise<Abbonamento | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("abbonamenti")
            .select("*")
            .eq("userid", userid)
            .eq("stato", StatoAbbonamentoEnum.ATTIVO)
            .single();
        if (error) return null;
        return data as Abbonamento;
    }

    async findByQrCode(qrcode: string): Promise<Abbonamento | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("abbonamenti").select("*").eq("qrcode", qrcode).single();
        if (error) return null;
        return data as Abbonamento;
    }

    async update(id: string, payload: Partial<Abbonamento>): Promise<Abbonamento> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("abbonamenti").update(payload).eq("id", id).select().single();
        if (error) throw new Error(`DB Error (update sub): ${error.message}`);
        return data as Abbonamento;
    }

    async existsActiveByUserId(userid: string): Promise<boolean> {
        const sub = await this.findByUserIdActive(userid);
        return sub !== null;
    }
}
