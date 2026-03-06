// ============================================================
// UserSupabaseAdapter
// Infrastructure layer – implements UserRepositoryPort
// ============================================================

import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { User } from "@/backend/domain/model/types";
import { RuoloEnum } from "@/backend/domain/model/enums";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { createClient } from "@supabase/supabase-js";

// Admin client – uses SERVICE_ROLE_KEY per aggiornare auth.users
function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

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

        // 1. Atleti assegnati direttamente nel profilo user
        const { data: assigned, error: err1 } = await supabase
            .from("users")
            .select("*")
            .eq("coachid", coachid);

        // 2. Atleti che hanno prenotato sessioni con questo coach
        const { data: bookings, error: err2 } = await supabase
            .from("prenotazioni")
            .select("userid")
            .eq("coachid", coachid);

        if (err1 && err2) return [];

        const userIdsFromBookings = Array.from(new Set((bookings ?? []).map(b => b.userid)));

        // Se non ci sono prenotazioni, restituiamo solo gli assegnati
        if (userIdsFromBookings.length === 0) return (assigned ?? []) as User[];

        // Recuperiamo i profili degli utenti che hanno prenotato ma non sono necessariamente "assegnati"
        const { data: bookedUsers, error: err3 } = await supabase
            .from("users")
            .select("*")
            .in("id", userIdsFromBookings);

        // Uniamo le liste ed eliminiamo i duplicati
        const allUsersMap = new Map<string, User>();
        (assigned ?? []).forEach(u => allUsersMap.set(u.id, u as User));
        (bookedUsers ?? []).forEach(u => allUsersMap.set(u.id, u as User));

        return Array.from(allUsersMap.values());
    }

    async countAll(): Promise<number> {
        const admin = createAdminClient();
        const { count, error } = await admin
            .from("users")
            .select("id", { count: "exact", head: true });
        if (error) return 0;
        return count ?? 0;
    }

    async findAll(): Promise<User[]> {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("users")
            .select("*")
            .order("createdat", { ascending: false });
        if (error) return [];
        return (data ?? []) as User[];
    }

    async findByRuolo(ruolo: RuoloEnum): Promise<User[]> {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("users")
            .select("*")
            .eq("ruolo", ruolo)
            .order("createdat", { ascending: false });
        if (error) return [];
        return (data ?? []) as User[];
    }

    /**
     * Aggiorna il ruolo sia nella tabella `users` che in `auth.users.user_metadata`.
     * Il middleware legge il ruolo dal JWT (user_metadata), quindi entrambi vanno aggiornati.
     */
    async updateRuolo(userid: string, ruolo: RuoloEnum): Promise<User> {
        const supabase = createSupabaseServerClient();
        const admin = createAdminClient();

        // 1. Aggiorna auth.users.user_metadata (fonte del JWT)
        const { error: authError } = await admin.auth.admin.updateUserById(userid, {
            user_metadata: { ruolo },
        });
        if (authError) throw new Error(`Auth update failed: ${authError.message}`);

        // 2. Sincronizza tabella users
        const { data, error } = await supabase
            .from("users")
            .update({ ruolo })
            .eq("id", userid)
            .select()
            .single();
        if (error) throw new Error(`DB Error (updateRuolo): ${error.message}`);
        return data as User;
    }
}
