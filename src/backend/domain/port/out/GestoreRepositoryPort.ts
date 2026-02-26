// ============================================================
// Port/out – GestoreRepositoryPort
// Outbound repository interface for Gestore Palestra entity
// ============================================================

import { Gestore } from "@/backend/domain/model/types";

export interface GestoreRepositoryPort {
    save(gestore: Partial<Gestore>): Promise<Gestore>;
    update(id: string, data: Partial<Gestore>): Promise<Gestore>;
    findById(id: string): Promise<Gestore | null>;
    findByUserId(userid: string): Promise<Gestore | null>;
    findByStrutturaId(strutturaid: string): Promise<Gestore | null>;
}
