import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";
import { Struttura, Corso, Prenotazione } from "@backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@backend/domain/model/enums";

/** CreateGymManagerService â€“ gestione strutture e corsi palestra (UC2). */
export class CreateGymManagerService {
  async creaStruttura(piva: string, cun: string, denominazione: string, indirizzo: string, gestoreId: string): Promise<Struttura> {
    const supabase = createSupabaseServerClient();
    // Vincoli R8+R9: unicitÃ  P.IVA, CUN (SDD Â§3.5)
    const { data: esistente } = await supabase.from("strutture").select("id")
      .or(`piva.eq.${piva},cun.eq.${cun}`).single();
    if (esistente) throw new Error("Vincolo R8: P.IVA o CUN giÃ  registrati.");
    const { data, error } = await supabase.from("strutture")
      .insert({ piva, cun, denominazione, indirizzo, gestoreId, stato: "Attiva" }).select().single();
    if (error) throw new Error(error.message);
    return data as Struttura;
  }

  async prenotaCorsoPalestra(userId: string, corsoId: string): Promise<Prenotazione> {
    const supabase = createSupabaseServerClient();
    const { data: corso } = await supabase.from("corsi").select("*").eq("id", corsoId).single() as { data: Corso | null };
    if (!corso) throw new Error("Corso non trovato.");
    if (corso.postiOccupati >= corso.capacitaMassima) throw new Error("Corso al completo. Iscriviti alla lista d'attesa.");
    const { data, error } = await supabase.from("prenotazioni")
      .insert({ userId, corsoId, stato: StatoPrenotazioneEnum.CONFERMATA, dataOra: corso.dataOra }).select().single();
    if (error) throw new Error(error.message);
    await supabase.from("corsi").update({ postiOccupati: corso.postiOccupati + 1 }).eq("id", corsoId);
    return data as Prenotazione;
  }
}