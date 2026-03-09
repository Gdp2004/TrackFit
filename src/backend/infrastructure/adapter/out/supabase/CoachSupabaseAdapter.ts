// ============================================================
// CoachSupabaseAdapter – aggiornato con metodi estesi
// Infrastructure layer – implements CoachRepositoryPort
// ============================================================

import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { Coach, Prenotazione, CoachStats, CoachWithUser, PrenotazioneWithUser } from "@/backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class CoachSupabaseAdapter implements CoachRepositoryPort {
    async save(coach: Partial<Coach>): Promise<Coach> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("coaches").insert(coach).select().single();
        if (error) throw new Error(error.message);
        return data as Coach;
    }

    async update(id: string, data: Partial<Coach>): Promise<Coach> {
        const supabase = createSupabaseServerClient();
        const { data: updated, error } = await supabase.from("coaches").update(data).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return updated as Coach;
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

    async findAll(): Promise<Coach[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("coaches").select("*").order("rating", { ascending: false });
        if (error) return [];
        return (data ?? []) as Coach[];
    }

    async findAllWithUserDetails(): Promise<CoachWithUser[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("coaches")
            .select("*, user:users!userid(*)")
            .order("rating", { ascending: false });

        if (error) {
            console.error("Errore fetch coach con utenti:", error.message);
            return [];
        }
        return (data ?? []) as CoachWithUser[];
    }

    async findByStrutturaId(strutturaid: string): Promise<CoachWithUser[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("coaches")
            .select("*, user:users!userid(*)")
            .eq("strutturaid", strutturaid);
        if (error) return [];
        return (data ?? []) as CoachWithUser[];
    }

    async getStats(coachid: string): Promise<CoachStats> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.rpc("get_coach_stats", { p_coach_id: coachid });
        if (error || !data) {
            console.error("[getStats] Errore RPC get_coach_stats:", error);
            return { atleti_seguiti: 0, sessioni_oggi: 0, sessioni_mese: 0, rating_medio: 0 };
        }
        return data as CoachStats;
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

    async findPrenotazioniAttiveInIntervallo(coachid: string, inizio: Date, fine: Date): Promise<Prenotazione[]> {
        const supabase = createSupabaseServerClient();

        // Per semplicità e precisione, recuperiamo le prenotazioni del giorno e filtriamo l'overlap
        const giornoInizio = new Date(inizio);
        giornoInizio.setHours(0, 0, 0, 0);
        const giornoFine = new Date(inizio);
        giornoFine.setHours(23, 59, 59, 999);

        const { data, error } = await supabase.from("prenotazioni")
            .select("*")
            .eq("coachid", coachid)
            .in("stato", [StatoPrenotazioneEnum.CONFERMATA, StatoPrenotazioneEnum.IN_ATTESA])
            .gte("dataora", giornoInizio.toISOString())
            .lte("dataora", giornoFine.toISOString());

        if (error || !data) return [];

        // Filtro overlap in memoria
        return (data as Prenotazione[]).filter(p => {
            const pInizio = new Date(p.dataora).getTime();
            const pFine = pInizio + (p.durata * 60 * 1000);
            const reqInizio = inizio.getTime();
            const reqFine = fine.getTime();

            return (pInizio < reqFine && pFine > reqInizio);
        });
    }

    async findPrenotazioniByCoachId(coachid: string): Promise<PrenotazioneWithUser[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("prenotazioni")
            .select("*, user:users!userid(nome, cognome, email, datanascita, peso, altezza)")
            .eq("coachid", coachid)
            .order("dataora", { ascending: true });
        if (error) {
            console.error("[findPrenotazioniByCoachId] DB Error:", error.message);
            return [];
        }
        return (data ?? []) as unknown as PrenotazioneWithUser[];
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
            operazione: "MODIFICA_PIANO",
            risorsaid: sessioneid,
            attoreid: coachid,
            dettagli: {
                coachid,
                sessioneid,
                vecchiadataora: vecchiadataora.toISOString(),
                nuovadataora: nuovadataora.toISOString(),
                motivazione,
            },
        });
    }
}
