// ============================================================
// CoachSupabaseAdapter
// Infrastructure layer – implements CoachRepositoryPort
// ============================================================

import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { Coach, Prenotazione } from "@/backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class CoachSupabaseAdapter implements CoachRepositoryPort {
    async save(coach: Partial<Coach>): Promise<Coach> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("coaches").insert(coach).select().single();
        if (error) throw new Error(error.message);
        return data as Coach;
    }

    async findById(id: string): Promise<Coach | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("coaches").select("*").eq("id", id).single();
        if (error) return null;
        return data as Coach;
    }

    async findByUserId(userid: string): Promise<Coach | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("coaches").select("*").eq("userid", userid).single();
        if (error) return null;
        return data as Coach;
    }

    async savePrenotazione(p: Partial<Prenotazione>): Promise<Prenotazione> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("prenotazioni").insert(p).select().single();
        if (error) throw new Error(error.message);
        return data as Prenotazione;
    }

    async findPrenotazioneById(id: string): Promise<Prenotazione | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("prenotazioni").select("*").eq("id", id).single();
        return error ? null : data as Prenotazione;
    }

    async findPrenotazioneAttivaBySlot(coachid: string, dataora: Date): Promise<Prenotazione | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("prenotazioni")
            .select("*")
            .eq("coachid", coachid)
            .eq("dataora", dataora.toISOString())
            .eq("stato", StatoPrenotazioneEnum.CONFERMATA)
            .single();
        if (error) return null;
        return data as Prenotazione;
    }

    async updatePrenotazione(id: string, p: Partial<Prenotazione>): Promise<Prenotazione> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("prenotazioni").update(p).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data as Prenotazione;
    }

    async saveAuditLog(coachid: string, sessioneid: string, vecchiadataora: Date, nuovadataora: Date, motivazione: string): Promise<void> {
        const supabase = createSupabaseServerClient();
        await supabase.from("audit_log").insert({
            coachid,
            sessioneid,
            vecchiadataora: vecchiadataora.toISOString(),
            nuovadataora: nuovadataora.toISOString(),
            motivazione,
        });
    }
}
