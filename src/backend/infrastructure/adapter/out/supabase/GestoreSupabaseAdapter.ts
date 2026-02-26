// ============================================================
// GestoreSupabaseAdapter
// Infrastructure layer – implements GestoreRepositoryPort
// ============================================================

import { GestoreRepositoryPort } from "@/backend/domain/port/out/GestoreRepositoryPort";
import { Gestore } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class GestoreSupabaseAdapter implements GestoreRepositoryPort {
    async save(gestore: Partial<Gestore>): Promise<Gestore> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("gestori").insert(gestore).select().single();
        if (error) throw new Error(error.message);
        return data as Gestore;
    }

    async update(id: string, dataUpdate: Partial<Gestore>): Promise<Gestore> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("gestori").update(dataUpdate).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data as Gestore;
    }

    async findById(id: string): Promise<Gestore | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("gestori").select("*").eq("id", id).single();
        if (error) return null;
        return data as Gestore;
    }

    async findByUserId(userid: string): Promise<Gestore | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("gestori").select("*").eq("userid", userid).single();
        if (error) return null;
        return data as Gestore;
    }

    async findByStrutturaId(strutturaid: string): Promise<Gestore | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("gestori").select("*").eq("strutturaid", strutturaid).single();
        if (error) return null;
        return data as Gestore;
    }
}
