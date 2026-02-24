// ============================================================
// Port/out – ReportRepositoryPort
// Outbound repository interface (Hexagonal Architecture)
// ============================================================

import { Report } from "@/backend/domain/model/types";

export interface ReportRepositoryPort {
    save(report: Partial<Report>): Promise<Report>;
    findById(id: string): Promise<Report | null>;
    findByUserId(userid: string): Promise<Report[]>;
    findByStrutturaId(strutturaid: string): Promise<Report[]>;
}
