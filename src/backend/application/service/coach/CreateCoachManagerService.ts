import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";
import { Prenotazione } from "@backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@backend/domain/model/enums";

/** CreateCoachManagerService â€“ prenotazione slot e gestione piano atleta (UC6, UC7). */
export class CreateCoachManagerService {
  async prenotaSlotCoach(userId: string, coachId: string, dataOra: Date): Promise<Prenotazione> {
    if (dataOra <= new Date()) throw new Error("dataOra deve essere nel futuro.");
    const supabase = createSupabaseServerClient();

    // Verifica slot libero (SDD Â§3.4 pre-condition)
    const { data: slotEsistente } = await supabase.from("prenotazioni")
      .select("id").eq("coachId", coachId).eq("dataOra", dataOra.toISOString())
      .eq("stato", StatoPrenotazioneEnum.CONFERMATA).single();
    if (slotEsistente) throw new Error("Slot giÃ  occupato per questo coach.");

    const { data, error } = await supabase.from("prenotazioni").insert({
      userId, coachId, dataOra: dataOra.toISOString(), stato: StatoPrenotazioneEnum.CONFERMATA,
    }).select().single();
    if (error) throw new Error(error.message);
    return data as Prenotazione;
  }

  async modificaPianoAtleta(coachId: string, sessioneId: string, nuovaDataOra: Date, motivazione: string): Promise<void> {
    // Vincolo R1: preavviso minimo 48h (SDD Â§3.4)
    const { data: sessione } = await createSupabaseServerClient()
      .from("workouts").select("dataOra").eq("id", sessioneId).single();
    if (!sessione) throw new Error("Sessione non trovata.");
    const ore48 = 48 * 60 * 60 * 1000;
    if (new Date(sessione.dataOra).getTime() - Date.now() < ore48)
      throw new Error("Vincolo R1: preavviso minimo 48 ore non rispettato.");
    const supabase = createSupabaseServerClient();
    await supabase.from("workouts").update({ dataOra: nuovaDataOra.toISOString() }).eq("id", sessioneId);
    await supabase.from("audit_log").insert({ coachId, sessioneId, nuovaDataOra: nuovaDataOra.toISOString(), motivazione });
  }
}