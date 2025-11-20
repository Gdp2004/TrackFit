// ============================================================
// CreateReportManagerService
// Application layer – implements ReportManagementPort (UC11)
// ============================================================

import { ReportManagementPort } from "@/backend/domain/port/in/ReportManagementPort";
import { ReportRepositoryPort } from "@/backend/domain/port/out/ReportRepositoryPort";
import { Report } from "@/backend/domain/model/types";

export class CreateReportManagerService implements ReportManagementPort {
  constructor(private readonly reportRepo: ReportRepositoryPort) { }

  async generaReportUtente(userId: string, periodo: string, tipo: string): Promise<Report> {
    // SDD SDD 3.6 - report atleti: calcola da tutti i workout CONSOLIDATI nel periodo
    // Here we just mock the aggregation that should happen on the Repository/Database level

    const report = await this.reportRepo.save({
      userId,
      periodo,
      tipo: "UTENTE",
      distanzaTotale: 42.5, // Mock data based on sum(workout.distanza)
      tempoTotaleMinuti: 340, // Mock data
      ritmoMedio: 8.0, // Mock: 340 / 42.5
      formato: "PDF",
      generatoAt: new Date().toISOString()
    });

    return report;
  }

  async generaReportGestore(strutturaId: string, periodo: string): Promise<Report> {
    // Genera metriche finanziarie e di presenze per la dashboard gestore
    const report = await this.reportRepo.save({
      strutturaId,
      periodo,
      tipo: "GESTORE",
      incassoTotale: 5200.0, // Mock
      accessiGiornalieri: 120, // Mock
      abbonamentiAttivi: 450, // Mock
      formato: "CSV",
      generatoAt: new Date().toISOString()
    });

    return report;
  }
}