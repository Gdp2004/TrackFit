// ============================================================
// CreateUserManagerService
// Application layer – implements UserManagementPort (UC1)
// ============================================================

import { UserManagementPort } from "@/backend/domain/port/in/UserManagementPort";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { User } from "@/backend/domain/model/types";
import { RuoloEnum } from "@/backend/domain/model/enums";
// Note: For full Hexagonal strictness, Supabase Auth should be behind an AuthPort.
// Consolidating here for simplicity as agreed in the plan.
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class CreateUserManagerService implements UserManagementPort {
  constructor(private readonly userRepo: UserRepositoryPort) { }

  async registraUtente(email: string, password: string, nome: string, cognome: string, ruolo: RuoloEnum): Promise<User> {
    if (!email || !password || !nome || !cognome) throw new Error("Tutti i campi sono obbligatori.");

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      email_confirm: true,
      user_metadata: { nome, cognome, ruolo },
    });

    if (error) throw new Error(error.message);

    // Let userRepo sync the user table if needed, though Supabase triggers might handle it
    const user = await this.userRepo.findById(data.user.id);
    if (!user) {
      return this.userRepo.save({ id: data.user.id, email, nome, cognome, ruolo, createdat: new Date().toISOString() });
    }
    return user;
  }

  async getUtente(userid: string): Promise<User> {
    const user = await this.userRepo.findById(userid);
    if (!user) throw new Error("Utente non trovato");
    return user;
  }

  async aggiornaUtente(userid: string, aggiornamenti: Partial<User>): Promise<User> {
    return this.userRepo.update(userid, aggiornamenti);
  }

  async eliminaUtente(userid: string): Promise<void> {
    const supabase = createSupabaseServerClient();
    await supabase.auth.admin.deleteUser(userid);
    await this.userRepo.delete(userid);
  }

  async associaCoach(userid: string, coachid: string): Promise<void> {
    await this.userRepo.update(userid, { coachid });
  }

  async aggiornaParametriFisici(userid: string, peso: number, altezza: number): Promise<User> {
    return this.userRepo.update(userid, { peso, altezza });
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────
  async getListaUtenti(ruolo?: RuoloEnum): Promise<User[]> {
    if (ruolo) return this.userRepo.findByRuolo(ruolo);
    return this.userRepo.findAll();
  }

  async cambiaRuolo(userid: string, ruolo: RuoloEnum): Promise<User> {
    const supabase = createSupabaseServerClient();

    const aggiornato = await this.userRepo.updateRuolo(userid, ruolo);

    // Auto-crea profilo nella tabella corretta se si assegna un ruolo speciale
    if (ruolo === RuoloEnum.COACH) {
      const { data: existing } = await supabase.from("coaches").select("id").eq("userid", userid).single();
      if (!existing) {
        await supabase.from("coaches").insert({ userid, specializzazione: "Da definire" }).select().single();
      }
    } else if (ruolo === RuoloEnum.GESTORE) {
      const { data: existing } = await supabase.from("gestori").select("id").eq("userid", userid).single();
      if (!existing) {
        await supabase.from("gestori").insert({ userid }).select().single();
      }
    }

    return aggiornato;
  }
}