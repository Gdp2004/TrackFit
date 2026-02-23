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
  async generaReportUtente(userid: string, periodo: string, tipo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): sostituire con query reali su tabella workouts
    // SELECT SUM(distanza), SUM(durata), AVG(distanza/durata) FROM workouts
    // WHERE userid = $userid AND dataora >= $periodoStart AND dataora <= $periodoFine
    const report = await this.reportRepo.save({
      userid,
      periodo,
      tipo: "UTENTE",
      distanzatotale: 0,       // TODO: SUM(workout.distanza)
      tempototaleminuti: 0,    // TODO: SUM(workout.durata)
      ritmomedio: 0,           // TODO: tempoTotale / distanzatotale
      formato: "PDF",
      generatoat: new Date().toISOString(),
    });
    return report;
  }

  // ─── FR13: Report Coach ───────────────────────────────────────────────────
  async generaReportCoach(coachid: string, periodo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): query reale
    // SELECT COUNT(DISTINCT userid) FROM prenotazioni WHERE coachid = $coachid
    // JOIN workouts per frequenza e progressi
    const atleti = await this.userRepo.findByCoachId(coachid);

    const report = await this.reportRepo.save({
      userid: coachid,
      periodo,
      tipo: "COACH",
      utentiSeguiti: atleti.length,
      tempototaleminuti: 0,    // TODO: SUM(workout.durata) degli atleti seguiti nel periodo
      frequenzaMediaCorsi: 0,  // TODO: COUNT(prenotazioni) / periodoGiorni
      formato: "PDF",
      generatoat: new Date().toISOString(),
    });
    return report;
  }

  // ─── FR14: Report Gestore ─────────────────────────────────────────────────
  async generaReportGestore(strutturaid: string, periodo: string): Promise<Report> {
    // TODO (dopo collegamento Supabase): query reale
    // SELECT SUM(importo) FROM pagamenti JOIN abbonamenti WHERE strutturaid = $strutturaid
    // SELECT COUNT(*) FROM prenotazioni WHERE strutturaid = $strutturaid AND dataora IN periodo
    const report = await this.reportRepo.save({
      strutturaid,
      periodo,
      tipo: "GESTORE",
      incassototale: 0,        // TODO: SUM(pagamento.importo) per struttura nel periodo
      accessigiornalieri: 0,   // TODO: AVG(accessi per giorno) nel periodo
      abbonamentiattivi: 0,    // TODO: COUNT(abbonamenti ATTIVI) per struttura
      formato: "CSV",
      generatoat: new Date().toISOString(),
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
      abbonamentiattivi: 0,    // TODO: COUNT(abbonamenti ATTIVI) globale
      ricavoAggregato: 0,      // TODO: SUM(pagamenti.importo) globale nel periodo
      formato: "CSV",
      generatoat: new Date().toISOString(),
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