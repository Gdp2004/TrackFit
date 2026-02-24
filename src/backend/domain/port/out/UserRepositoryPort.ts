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
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    existsById(id: string): Promise<boolean>;
    countAll(): Promise<number>;                       // FR15: report admin aggregato
}
