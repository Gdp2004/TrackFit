// ============================================================
// Port/in – UserManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.1 (UC1)
// ============================================================

import { User } from "@/backend/domain/model/types";
import { RuoloEnum } from "@/backend/domain/model/enums";

export interface UserManagementPort {
    registraUtente(email: string, password: string, nome: string, cognome: string, ruolo: RuoloEnum): Promise<User>;
    getUtente(userid: string): Promise<User>;
    aggiornaUtente(userid: string, aggiornamenti: Partial<User>): Promise<User>;
    eliminaUtente(userid: string): Promise<void>;
    associaCoach(userid: string, coachid: string): Promise<void>;
    aggiornaParametriFisici(userid: string, peso: number, altezza: number): Promise<User>;
    // ─── Admin ────────────────────────────────────────────────────────────────
    getListaUtenti(ruolo?: RuoloEnum): Promise<User[]>;  // FR15
    cambiaRuolo(userid: string, ruolo: RuoloEnum): Promise<User>; // Admin: cambio ruolo
}
