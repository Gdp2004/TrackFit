// ============================================================
// UserSupabaseAdapter
// Infrastructure layer – implements UserRepositoryPort
// ============================================================

import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { User } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class UserSupabaseAdapter implements UserRepositoryPort {
    async save(user: Partial<User>): Promise<User> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("users").insert(user).select().single();
        if (error) throw new Error(`DB Error (save user): ${error.message}`);
        return data as User;
    }

    async findById(id: string): Promise<User | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
        if (error) return null;
        return data as User;
    }

    async findByEmail(email: string): Promise<User | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
        if (error) return null;
        return data as User;
    }

    async update(id: string, aggiornamenti: Partial<User>): Promise<User> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("users").update(aggiornamenti).eq("id", id).select().single();
        if (error) throw new Error(`DB Error (update user): ${error.message}`);
        return data as User;
    }

    async delete(id: string): Promise<void> {
        const supabase = createSupabaseServerClient();
        const { error } = await supabase.from("users").delete().eq("id", id);
        if (error) throw new Error(`DB Error (delete user): ${error.message}`);
    }

    async existsById(id: string): Promise<boolean> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("users").select("id").eq("id", id).single();
        return !error && data !== null;
    }

    async findByCoachId(coachid: string): Promise<User[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("coachid", coachid);
        if (error) return [];
        return (data ?? []) as User[];
    }

    async countAll(): Promise<number> {
        const supabase = createSupabaseServerClient();
        const { count, error } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true });
        if (error) return 0;
        return count ?? 0;
    }
}
