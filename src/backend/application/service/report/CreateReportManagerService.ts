// ============================================================
// CreateReportManagerService
// Application layer – implements ReportManagementPort
// Implements: FR12 (Gestore), FR13 (Coach), FR15 (Admin), FR28 (CSV export)
// ============================================================

import { ReportManagementPort } from "@/backend/domain/port/in/ReportManagementPort";
import { ReportRepositoryPort } from "@/backend/domain/port/out/ReportRepositoryPort";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { Report } from "@/backend/domain/model/types";

export class CreateReportManagerService implements ReportManagementPort {
  constructor(
    private readonly reportRepo: ReportRepositoryPort,
    private readonly userRepo: UserRepositoryPort
  ) { }

  // ─── FR12: Report Utente ──────────────────────────────────────────────────
  async generaReportUtente(userId: string, periodo: string, tipo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): sostituire con query reali su tabella workouts
    // SELECT SUM(distanza), SUM(durata), AVG(distanza/durata) FROM workouts
    // WHERE userId = $userId AND dataOra >= $periodoStart AND dataOra <= $periodoFine
    const report = await this.reportRepo.save({
      userId,
      periodo,
      tipo: "UTENTE",
      distanzaTotale: 0,       // TODO: SUM(workout.distanza)
      tempoTotaleMinuti: 0,    // TODO: SUM(workout.durata)
      ritmoMedio: 0,           // TODO: tempoTotale / distanzaTotale
      formato: "PDF",
      generatoAt: new Date().toISOString(),
    });
    return report;
  }

  // ─── FR13: Report Coach ───────────────────────────────────────────────────
  async generaReportCoach(coachId: string, periodo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): query reale
    // SELECT COUNT(DISTINCT userId) FROM prenotazioni WHERE coachId = $coachId
    // JOIN workouts per frequenza e progressi
    const atleti = await this.userRepo.findByCoachId(coachId);

    const report = await this.reportRepo.save({
      userId: coachId,
      periodo,
      tipo: "COACH",
      utentiSeguiti: atleti.length,
      tempoTotaleMinuti: 0,    // TODO: SUM(workout.durata) degli atleti seguiti nel periodo
      frequenzaMediaCorsi: 0,  // TODO: COUNT(prenotazioni) / periodoGiorni
      formato: "PDF",
      generatoAt: new Date().toISOString(),
    });
    return report;
  }

  // ─── FR14: Report Gestore ─────────────────────────────────────────────────
  async generaReportGestore(strutturaId: string, periodo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): query reale
    // SELECT SUM(importo) FROM pagamenti JOIN abbonamenti WHERE strutturaId = $strutturaId
    // SELECT COUNT(*) FROM prenotazioni WHERE strutturaId = $strutturaId AND dataOra IN periodo
    const report = await this.reportRepo.save({
      strutturaId,
      periodo,
      tipo: "GESTORE",
      incassoTotale: 0,        // TODO: SUM(pagamento.importo) per struttura nel periodo
      accessiGiornalieri: 0,   // TODO: AVG(accessi per giorno) nel periodo
      abbonamentiAttivi: 0,    // TODO: COUNT(abbonamenti ATTIVI) per struttura
      formato: "CSV",
      generatoAt: new Date().toISOString(),
    });
    return report;
  }

  // ─── FR15: Report Admin aggregato cross-struttura ─────────────────────────
  async generaReportAdmin(periodo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): query aggregate cross-struttura
    const totaleUtenti = await this.userRepo.countAll();

    const report = await this.reportRepo.save({
      periodo,
      tipo: "ADMIN",
      totaleStrutture: 0,      // TODO: COUNT(strutture) FROM strutture
      totaleUtenti,
      abbonamentiAttivi: 0,    // TODO: COUNT(abbonamenti ATTIVI) globale
      ricavoAggregato: 0,      // TODO: SUM(pagamenti.importo) globale nel periodo
      formato: "CSV",
      generatoAt: new Date().toISOString(),
    });
    return report;
  }

  // ─── FR28: Esportazione CSV ───────────────────────────────────────────────
  exportCSV(report: Report): string {
    const headers = Object.keys(report).join(",");
    const values = Object.values(report)
      .map(v => (v === null || v === undefined ? "" : String(v)))
      .join(",");
    return `${headers}\n${values}`;
  }
}