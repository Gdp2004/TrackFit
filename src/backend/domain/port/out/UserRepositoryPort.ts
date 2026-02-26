// ============================================================
// Port/out – UserRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { User } from "@/backend/domain/model/types";
import { RuoloEnum } from "@/backend/domain/model/enums";

export interface UserRepositoryPort {
    save(user: Partial<User>): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByCoachId(coachid: string): Promise<User[]>;   // FR13: roster atleti del coach
    findAll(): Promise<User[]>;                         // Admin: lista tutti gli utenti
    findByRuolo(ruolo: RuoloEnum): Promise<User[]>;     // Admin: filtra per ruolo
    update(id: string, data: Partial<User>): Promise<User>;
    updateRuolo(userid: string, ruolo: RuoloEnum): Promise<User>; // Admin: cambio ruolo
    delete(id: string): Promise<void>;
    existsById(id: string): Promise<boolean>;
    countAll(): Promise<number>;                       // FR15: report admin aggregato
}
