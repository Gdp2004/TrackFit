// ============================================================
// PaymentSupabaseAdapter
// Infrastructure layer – implements PaymentRepositoryPort
// FR22: Storico pagamenti e fatturazione
// ============================================================

import { PaymentRepositoryPort } from "@/backend/domain/port/out/PaymentRepositoryPort";
import { Pagamento } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class PaymentSupabaseAdapter implements PaymentRepositoryPort {
    async save(pagamento: Partial<Pagamento>): Promise<Pagamento> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("pagamenti").insert(pagamento).select().single();
        if (error) throw new Error(`DB Error (save payment): ${error.message}`);
        return data as Pagamento;
    }

    async update(id: string, pagamento: Partial<Pagamento>): Promise<Pagamento> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("pagamenti").update(pagamento).eq("id", id).select().single();
        if (error) throw new Error(`DB Error (update payment): ${error.message}`);
        return data as Pagamento;
    }

    async findById(id: string): Promise<Pagamento | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("pagamenti").select("*").eq("id", id).single();
        return error ? null : data as Pagamento;
    }

    async findByUserId(userid: string): Promise<Pagamento[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("pagamenti")
            .select("*")
            .eq("userid", userid)
            .order("createdat", { ascending: false });
        if (error) throw new Error(`DB Error (findByUserId payments): ${error.message}`);
        return (data ?? []) as Pagamento[];
    }

    async findByAbbonamentoId(abbonamentoid: string): Promise<Pagamento[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("pagamenti")
            .select("*")
            .eq("abbonamentoid", abbonamentoid);
        if (error) throw new Error(`DB Error (findByAbbonamentoId): ${error.message}`);
        return (data ?? []) as Pagamento[];
    }
}
