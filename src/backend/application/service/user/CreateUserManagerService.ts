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
      user_metadata: { nome, cognome, ruolo },
    });

    if (error) throw new Error(error.message);

    // Let userRepo sync the user table if needed, though Supabase triggers might handle it
    const user = await this.userRepo.findById(data.user.id);
    if (!user) {
      return this.userRepo.save({ id: data.user.id, email, nome, cognome, ruolo, createdAt: new Date().toISOString() });
    }
    return user;
  }

  async getUtente(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("Utente non trovato");
    return user;
  }

  async aggiornaUtente(userId: string, aggiornamenti: Partial<User>): Promise<User> {
    return this.userRepo.update(userId, aggiornamenti);
  }

  async eliminaUtente(userId: string): Promise<void> {
    const supabase = createSupabaseServerClient();
    await supabase.auth.admin.deleteUser(userId);
    await this.userRepo.delete(userId);
  }

  async associaCoach(userId: string, coachId: string): Promise<void> {
    await this.userRepo.update(userId, { coachId });
  }

  async aggiornaParametriFisici(userId: string, peso: number, altezza: number): Promise<User> {
    return this.userRepo.update(userId, { peso, altezza });
  }
}