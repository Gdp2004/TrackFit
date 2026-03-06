// ============================================================
// WorkoutSupabaseAdapter
// Infrastructure/out – implements WorkoutRepositoryPort
// Uses Supabase (postgres) as persistence layer
// ============================================================

import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { WorkoutRepositoryPort } from "@/backend/domain/port/out/WorkoutRepositoryPort";
import { Workout } from "@/backend/domain/model/types";
import { WorkoutStatoEnum } from "@/backend/domain/model/enums";

export class WorkoutSupabaseAdapter implements WorkoutRepositoryPort {
    private get db() {
        return createSupabaseServerClient();
    }

    async save(workout: Omit<Workout, "id">): Promise<Workout> {
        const { data, error } = await this.db
            .from("workouts")
            .insert(workout)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as Workout;
    }

    async findById(id: string): Promise<Workout | null> {
        const { data, error } = await this.db
            .from("workouts")
            .select("*")
            .eq("id", id)
            .single();
        if (error) return null;
        return data as Workout;
    }

    async findByUserId(userid: string): Promise<Workout[]> {
        const { data: workoutsData, error } = await this.db
            .from("workouts")
            .select("*")
            .eq("userid", userid);
        if (error) throw new Error(error.message);

        // Recupera anche le prenotazioni confermate ai corsi e trasformale in finti "workkout"
        const { data: prenotazioniData } = await this.db
            .from("prenotazioni")
            .select("*, corsi(nome, dataora, durata)")
            .eq("userid", userid)
            .eq("stato", "CONFERMATA");

        const corsiWorkouts: Workout[] = (prenotazioniData || []).map((p: any) => {
            const dataOra = p.corsi?.dataora || p.dataora;
            const isPast = new Date(dataOra) <= new Date();
            return {
                id: p.id,
                userid: p.userid,
                tipo: `📍 Corso: ${p.corsi?.nome || "Palestra"}`,
                dataora: dataOra,
                durata: p.corsi?.durata || 60,
                stato: isPast ? WorkoutStatoEnum.CONSOLIDATA : WorkoutStatoEnum.PIANIFICATA,
                sorgente: "IMPORT",
                obiettivo: "Prenotazione",
            } as unknown as Workout;
        });

        const merged = [...(workoutsData as Workout[]), ...corsiWorkouts];
        merged.sort((a, b) => new Date(b.dataora).getTime() - new Date(a.dataora).getTime());

        return merged;
    }

    async findByUserIdAndStato(userid: string, stato: WorkoutStatoEnum): Promise<Workout[]> {
        const { data, error } = await this.db
            .from("workouts")
            .select("*")
            .eq("userid", userid)
            .eq("stato", stato);
        if (error) throw new Error(error.message);
        return (data as Workout[]) ?? [];
    }

    async update(id: string, data: Partial<Workout>): Promise<Workout> {
        const { data: updated, error } = await this.db
            .from("workouts")
            .update(data)
            .eq("id", id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return updated as Workout;
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.db.from("workouts").delete().eq("id", id);
        if (error) throw new Error(error.message);
    }

    async existsById(id: string): Promise<boolean> {
        const { count } = await this.db
            .from("workouts")
            .select("id", { count: "exact", head: true })
            .eq("id", id);
        return (count ?? 0) > 0;
    }

    async findByStravaId(stravaid: string): Promise<Workout | null> {
        const { data, error } = await this.db
            .from("workouts")
            .select("*")
            .eq("stravaid", stravaid)
            .single();
        if (error) return null;
        return data as Workout;
    }

    async findByCoachId(coachid: string): Promise<Workout[]> {
        const { data: users, error: errUsers } = await this.db
            .from("users")
            .select("id, nome, cognome")
            .eq("coachid", coachid);

        if (errUsers) throw new Error(errUsers.message);

        const userIds = (users ?? []).map((u) => u.id);
        if (userIds.length === 0) return [];

        const userMap = new Map<string, string>();
        users?.forEach(u => {
            userMap.set(u.id, (`${u.nome || ""} ${u.cognome || ""}`).trim() || "Atleta");
        });

        const { data, error } = await this.db
            .from("workouts")
            .select("*")
            .in("userid", userIds)
            .order("dataora", { ascending: false });

        if (error) throw new Error(error.message);

        const workouts = (data as Workout[]) ?? [];
        return workouts.map(w => ({
            ...w,
            athleteName: userMap.get(w.userid)
        }));
    }
}
