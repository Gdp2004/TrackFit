import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";
import { User } from "@backend/domain/model/types";
import { RuoloEnum } from "@backend/domain/model/enums";

/** CreateUserManagerService â€“ gestione registrazione e profilo (UC1). */
export class CreateUserManagerService {
  async registraUtente(email: string, password: string, nome: string, cognome: string, ruolo: RuoloEnum): Promise<User> {
    if (!email || !password || !nome || !cognome) throw new Error("Tutti i campi sono obbligatori.");
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { nome, cognome, ruolo },
    });
    if (error) throw new Error(error.message);
    return data.user as unknown as User;
  }

  async getUtente(userId: string): Promise<User> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error) throw new Error(error.message);
    return data as User;
  }

  async aggiornaUtente(userId: string, aggiornamenti: Partial<User>): Promise<User> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from("users").update(aggiornamenti).eq("id", userId).select().single();
    if (error) throw new Error(error.message);
    return data as User;
  }

  async eliminaUtente(userId: string): Promise<void> {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  }
}