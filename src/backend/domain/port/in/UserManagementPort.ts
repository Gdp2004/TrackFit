// ============================================================
// Port/in – UserManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.1 (UC1)
// ============================================================

import { User } from "@/backend/domain/model/types";
import { RuoloEnum } from "@/backend/domain/model/enums";

export interface UserManagementPort {
    registraUtente(email: string, password: string, nome: string, cognome: string, ruolo: RuoloEnum): Promise<User>;
    getUtente(userId: string): Promise<User>;
    aggiornaUtente(userId: string, aggiornamenti: Partial<User>): Promise<User>;
    eliminaUtente(userId: string): Promise<void>;
    associaCoach(userId: string, coachId: string): Promise<void>;
    aggiornaParametriFisici(userId: string, peso: number, altezza: number): Promise<User>;
}
