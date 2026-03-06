// ============================================================
// GymSupabaseAdapter
// Infrastructure layer – implements GymRepositoryPort
// ============================================================

import { GymRepositoryPort } from "@/backend/domain/port/out/GymRepositoryPort";
import { Struttura, Corso, Prenotazione, ListaAttesa, TipoAbbonamento, GestoreStats } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class GymSupabaseAdapter implements GymRepositoryPort {
    async saveStruttura(s: Partial<Struttura>): Promise<Struttura> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("strutture").insert(s).select().single();
        if (error) throw new Error(error.message);
        return data as Struttura;
    }

    async findStrutturaById(id: string): Promise<Struttura | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("strutture").select("*").eq("id", id).single();
        return error ? null : data as Struttura;
    }

    async findStrutturaByGestoreId(gestoreid: string): Promise<Struttura | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("strutture").select("*").eq("gestoreid", gestoreid).single();
        return error ? null : data as Struttura;
    }

    async findStruttureByGestoreId(gestoreid: string): Promise<Struttura[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("strutture").select("*").eq("gestoreid", gestoreid);
        if (error) return [];
        return (data ?? []) as Struttura[];
    }

    async updateStruttura(id: string, updateData: Partial<Struttura>): Promise<Struttura> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("strutture").update(updateData).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data as Struttura;
    }

    async getStats(strutturaid: string): Promise<GestoreStats> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.rpc("get_gestore_stats", { p_struttura_id: strutturaid });
        if (error || !data) {
            return { abbonamenti_attivi: 0, corsi_settimana: 0, accessi_oggi: 0, incasso_mese: 0 };
        }
        return data as GestoreStats;
    }

    async existsStrutturaByPivaOrCun(piva: string, cun: string): Promise<boolean> {
        const supabase = createSupabaseServerClient();
        const { data } = await supabase.from("strutture").select("id").or(`piva.eq.${piva},cun.eq.${cun}`).limit(1);
        return (data && data.length > 0) ? true : false;
    }

    async saveCorso(c: Partial<Corso>): Promise<Corso> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("corsi").insert(c).select().single();
        if (error) throw new Error(error.message);
        return data as Corso;
    }

    async findCorsoById(id: string): Promise<Corso | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("corsi").select("*").eq("id", id).single();
        return error ? null : data as Corso;
    }

    async incrementaPostiOccupati(corsoid: string): Promise<boolean> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.rpc('incrementa_posti_corso', { p_corso_id: corsoid });
        if (error) {
            console.warn("RPC incrementa_posti_corso non eseguito (forse non creato?). Fallback su memoria.", error);
            // Fallback for development if schema is not applied
            const { data: c } = await supabase.from("corsi").select("postioccupati, capacitamassima").eq("id", corsoid).single();
            if (c && c.postioccupati < c.capacitamassima) {
                await supabase.from("corsi").update({ postioccupati: c.postioccupati + 1 }).eq("id", corsoid);
                return true;
            }
            return false;
        }
        return data as boolean;
    }

    async decrementaPostiOccupati(corsoid: string): Promise<void> {
        const supabase = createSupabaseServerClient();
        const { data } = await supabase.from("corsi").select("postioccupati").eq("id", corsoid).single();
        if (data && data.postioccupati > 0) {
            await supabase.from("corsi").update({ postioccupati: data.postioccupati - 1 }).eq("id", corsoid);
        }
    }

    async savePrenotazioneCorso(p: Partial<Prenotazione>): Promise<Prenotazione> {
        const supabase = createSupabaseServerClient();
        // Upsert based on id if it exists
        if (p.id) {
            const { data, error } = await supabase.from("prenotazioni").update(p).eq("id", p.id).select().single();
            if (error) throw new Error(error.message);
            return data as Prenotazione;
        } else {
            const { data, error } = await supabase.from("prenotazioni").insert(p).select().single();
            if (error) throw new Error(error.message);
            return data as Prenotazione;
        }
    }

    async findPrenotazioneCorsoById(id: string): Promise<Prenotazione | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("prenotazioni").select("*").eq("id", id).single();
        return error ? null : data as Prenotazione;
    }

    async addToListaAttesa(corsoid: string, userid: string): Promise<ListaAttesa> {
        const supabase = createSupabaseServerClient();
        // find max position
        const { data: q } = await supabase.from("lista_attesa").select("posizione").eq("corsoid", corsoid).order("posizione", { ascending: false }).limit(1);
        const pos = (q && q.length > 0) ? q[0].posizione + 1 : 1;

        const { data, error } = await supabase.from("lista_attesa").insert({
            corsoid,
            userid,
            posizione: pos
        }).select().single();
        if (error) throw new Error(error.message);
        return data as ListaAttesa;
    }

    async popFromListaAttesa(corsoid: string): Promise<ListaAttesa | null> {
        const supabase = createSupabaseServerClient();
        // Prendi il primo in coda
        const { data } = await supabase.from("lista_attesa").select("*").eq("corsoid", corsoid).order("posizione", { ascending: true }).limit(1);
        if (!data || data.length === 0) return null;

        const top = data[0];
        // Rimuovilo
        await supabase.from("lista_attesa").delete().eq("id", top.id);
        return top as ListaAttesa;
    }

    // R9: Carica strutture fuzzy
    async matchStruttureFuzzy(denominazione: string, indirizzo: string): Promise<Struttura[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.rpc('match_strutture', {
            str_denominazione: denominazione,
            str_indirizzo: indirizzo,
            similarity_threshold: 0.85
        });
        if (error) return [];
        return (data ?? []) as Struttura[];
    }

    // FR6: Lista corsi per struttura
    async findCorsiByStrutturaId(strutturaid: string): Promise<Corso[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("corsi").select("*").eq("strutturaid", strutturaid).order("dataora", { ascending: true });
        if (error) return [];
        return (data ?? []) as Corso[];
    }

    // FR26: Elimina corso
    async deleteCorso(corsoid: string): Promise<void> {
        const supabase = createSupabaseServerClient();
        await supabase.from("corsi").delete().eq("id", corsoid);
    }

    async updateCorso(corsoid: string, updateData: Partial<Corso>): Promise<Corso> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("corsi").update(updateData).eq("id", corsoid).select().single();
        if (error) throw new Error(error.message);
        return data as Corso;
    }

    // FR26: ID utenti con prenotazione confermata sul corso
    async findUserIdsByCorsoId(corsoid: string): Promise<string[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("prenotazioni")
            .select("userid")
            .eq("corsoid", corsoid)
            .eq("stato", "CONFERMATA");
        if (error) return [];
        return (data ?? []).map((r: { userid: string }) => r.userid);
    }

    // FR26: ID utenti in lista d'attesa per il corso
    async findUserIdsInListaAttesa(corsoid: string): Promise<string[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("lista_attesa")
            .select("userid")
            .eq("corsoid", corsoid);
        if (error) return [];
        return (data ?? []).map((r: { userid: string }) => r.userid);
    }

    // FR7: Tipi abbonamento
    async saveTipoAbbonamento(tipo: Partial<TipoAbbonamento>): Promise<TipoAbbonamento> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("tipi_abbonamento").insert(tipo).select().single();
        if (error) throw new Error(error.message);
        return data as TipoAbbonamento;
    }

    async findTipiAbbonamentoByStrutturaId(strutturaid: string): Promise<TipoAbbonamento[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("tipi_abbonamento").select("*").eq("strutturaid", strutturaid).order("prezzo", { ascending: true });
        if (error) return [];
        return (data ?? []) as TipoAbbonamento[];
    }

    async deleteTipoAbbonamento(id: string): Promise<void> {
        const supabase = createSupabaseServerClient();
        await supabase.from("tipi_abbonamento").delete().eq("id", id);
    }
}
