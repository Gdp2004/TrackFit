import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";
import { Report } from "@backend/domain/model/types";

/** CreateReportManagerService â€“ generazione report aggregati (UC11, SDD Â§3.6). */
export class CreateReportManagerService {
  async generaReportUtente(userId: string, periodo: string, tipo: string): Promise<Report> {
    const supabase = createSupabaseServerClient();
    // Recupera workout consolidati nel periodo
    const { data: workouts, error } = await supabase.from("workouts").select("distanza,durata")
      .eq("userId", userId).eq("stato", "CONSOLIDATA");
    if (error) throw new Error(error.message);
    if (!workouts || workouts.length === 0) throw new Error("Nessun dato disponibile nel periodo selezionato.");
    const distanzaTotale = workouts.reduce((acc, w) => acc + (w.distanza ?? 0), 0);
    const tempoTotaleMinuti = workouts.reduce((acc, w) => acc + (w.durata ?? 0), 0);
    const ritmoMedio = tempoTotaleMinuti > 0 ? tempoTotaleMinuti / distanzaTotale : 0;
    const { data: report, error: repErr } = await supabase.from("reports").insert({
      userId, periodo, tipo, distanzaTotale, tempoTotaleMinuti, ritmoMedio,
      formato: "PDF", generatoAt: new Date().toISOString(),
    }).select().single();
    if (repErr) throw new Error(repErr.message);
    return report as Report;
  }
}