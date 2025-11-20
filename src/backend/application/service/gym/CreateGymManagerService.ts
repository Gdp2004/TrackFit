// ============================================================
// CreateGymManagerService
// Application layer – implements GymManagementPort (UC2)
// ============================================================

import { GymManagementPort } from "@/backend/domain/port/in/GymManagementPort";
import { GymRepositoryPort } from "@/backend/domain/port/out/GymRepositoryPort";
import { Struttura, Corso, Prenotazione } from "@/backend/domain/model/types";
import { StatoPrenotazioneEnum } from "@/backend/domain/model/enums";

export class CreateGymManagerService implements GymManagementPort {
  constructor(private readonly gymRepo: GymRepositoryPort) { }

  async creaStruttura(piva: string, cun: string, denominazione: string, indirizzo: string, gestoreId: string): Promise<Struttura> {
    // SDD Vincoli R8+R9: unicità P.IVA, CUN
    const esiste = await this.gymRepo.existsStrutturaByPivaOrCun(piva, cun);
    if (esiste) throw new Error("Vincolo R8/R9: P.IVA o CUN già registrati nel sistema.");

    return this.gymRepo.saveStruttura({
      piva,
      cun,
      denominazione,
      indirizzo,
      gestoreId,
      stato: "Attiva"
    });
  }

  async prenotaCorsoPalestra(userId: string, corsoId: string): Promise<Prenotazione> {
    const corso = await this.gymRepo.findCorsoById(corsoId);
    if (!corso) throw new Error("Corso non trovato.");

    // SDD Vincolo R6: Gestione capacità e lista d'attesa
    if (corso.postiOccupati >= corso.capacitaMassima) {
      // Metti in lista d'attesa
      await this.gymRepo.addToListaAttesa(corsoId, userId);
      throw new Error(`Corso al completo. Sei stato aggiunto alla lista d'attesa per il corso ${corso.nome}.`);
    }

    const prenotazione = await this.gymRepo.savePrenotazioneCorso({
      userId,
      corsoId,
      strutturaId: corso.strutturaId,
      dataOra: corso.dataOra,
      stato: StatoPrenotazioneEnum.CONFERMATA,
      importoTotale: 15.0 // fee fissa mock
    });

    await this.gymRepo.incrementaPostiOccupati(corsoId);
    return prenotazione;
  }

  async cancellaPrenotazione(prenotazioneId: string): Promise<void> {
    const p = await this.gymRepo.findPrenotazioneCorsoById(prenotazioneId);
    if (!p) throw new Error("Prenotazione non trovata.");

    // OCL Vincolo R3: limite di cancellazione
    let orePreavviso = 0;
    if (p.dataOra) {
      orePreavviso = (new Date(p.dataOra).getTime() - Date.now()) / (1000 * 60 * 60);
    }

    if (orePreavviso < 24) { // Assumiamo 24h default cancellation window
      throw new Error("Vincolo R3: Impossibile cancellare la prenotazione a meno di 24h dall'inizio.");
    }

    p.stato = StatoPrenotazioneEnum.CANCELLATA;
    p.rimborso = p.importoTotale;
    await this.gymRepo.savePrenotazioneCorso(p);

    if (p.corsoId) {
      await this.gymRepo.decrementaPostiOccupati(p.corsoId);
      // SDS: Se c'era lista d'attesa, pop e notifica il prossimo utente (omesso qui, gestibile tramite domain event)
      await this.gymRepo.popFromListaAttesa(p.corsoId);
    }
  }

  async getCorsiStruttura(strutturaId: string): Promise<Corso[]> {
    // Mock method to fulfill port
    const fakeCorso: Corso = {
      id: "corso1", strutturaId, nome: "Crossfit", dataOra: new Date().toISOString(),
      capacitaMassima: 20, postiOccupati: 10, durata: 60
    };
    return [fakeCorso];
  }
}