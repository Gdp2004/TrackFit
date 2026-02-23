// ============================================================
// Port/in – ReportManagementPort
// Inbound use-case interface (Hexagonal Architecture)
// Source: SDD section 3.6 (UC11)
// ============================================================

import { Report } from "@/backend/domain/model/types";

export interface ReportManagementPort {
    generaReportUtente(userid: string, periodo: string, tipo: string): Promise<Report>;
    generaReportCoach(coachid: string, periodo: string): Promise<Report>;              // FR13
    generaReportGestore(strutturaid: string, periodo: string): Promise<Report>;
    generaReportAdmin(periodo: string): Promise<Report>;                               // FR15
}
