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
        const { data, error } = await this.db
            .from("workouts")
            .select("*")
            .eq("userid", userid)
            .order("dataora", { ascending: false });
        if (error) throw new Error(error.message);
        return (data as Workout[]) ?? [];
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
}
