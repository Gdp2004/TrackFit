// ============================================================
// CreateGymManagerService
// Application layer – implements GymManagementPort
// Fixes: FR6 (corso creation), FR8 (sub check), R3 (50% penalty),
//        R9 (fuzzy dedup), FR25 (waitlist notify), FR26 (cancel notify)
// ============================================================

import { GymManagementPort } from "@/backend/domain/port/in/GymManagementPort";
import { GymRepositoryPort } from "@/backend/domain/port/out/GymRepositoryPort";
import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { Struttura, Corso, Prenotazione } from "@/backend/domain/model/types";
import { StatoAbbonamentoEnum, StatoPrenotazioneEnum } from "@/backend/domain/model/enums";

// ─── R9: Similarità stringa (Dice / bigramma) ────────────────────────────────
function diceCoefficient(a: string, b: string): number {
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2).toLowerCase());
    return set;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  let intersection = 0;
  A.forEach(g => { if (B.has(g)) intersection++; });
  return (2 * intersection) / (A.size + B.size);
}

// ─── R3: Finestra di cancellazione gratuita configurabile ────────────────────
// TODO(Gestore): rendere configurabile per struttura su DB
const CANCELLAZIONE_GRATUITA_ORE = 24;
const PENALE_PERCENTUALE = 0.5; // 50%

export class CreateGymManagerService implements GymManagementPort {
  constructor(
    private readonly gymRepo: GymRepositoryPort,
    private readonly subRepo: SubscriptionRepositoryPort,
    private readonly notificationService: NotificationServicePort,
    private readonly auditRepo: AuditLogRepositoryPort
  ) { }

  // ─── FR5: Crea struttura (R8 unicità, R9 anti-duplicato fuzzy) ───────────
  async creaStruttura(
    piva: string,
    cun: string,
    denominazione: string,
    indirizzo: string,
    gestoreid: string
  ): Promise<Struttura> {
    // R8: Unicità esatta P.IVA e CUN
    const esisteEsatta = await this.gymRepo.existsStrutturaByPivaOrCun(piva, cun);
    if (esisteEsatta) throw new Error("Vincolo R8: P.IVA o CUN già registrati nel sistema.");

    // R9: Anti-duplicato fuzzy su denominazione + indirizzo
    const tutte = await this.gymRepo.findAllStrutture();
    for (const s of tutte) {
      const simDen = diceCoefficient(denominazione, s.denominazione);
      const simInd = diceCoefficient(indirizzo, s.indirizzo);
      const scoreGlobale = (simDen + simInd) / 2;
      if (scoreGlobale >= 0.85) {
        throw new Error(
          `Vincolo R9: Struttura troppo simile a "${s.denominazione}" (score: ${(scoreGlobale * 100).toFixed(0)}%). Verificare se è un duplicato.`
        );
      }
    }

    const struttura = await this.gymRepo.saveStruttura({ piva, cun, denominazione, indirizzo, gestoreid, stato: "Attiva" });

    await this.auditRepo.registra({
      utenteId: gestoreid,
      azione: "CREAZIONE_STRUTTURA",
      datiJSON: { strutturaid: struttura.id, piva, cun, denominazione },
      timestamp: new Date().toISOString(),
    });

    return struttura;
  }

  // ─── FR6/FR26: Crea corso (con notifica cancellazione) ───────────────────
  async creaCorso(corso: Omit<Corso, "id" | "postioccupati">): Promise<Corso> {
    return this.gymRepo.saveCorso({ ...corso, postioccupati: 0 });
  }

  async cancellaCorso(corsoid: string, gestoreid: string): Promise<void> {
    const corso = await this.gymRepo.findCorsoById(corsoid);
    if (!corso) throw new Error("Corso non trovato.");

    // FR26: Notifica tutti gli utenti prenotati e in lista d'attesa
    const prenotatiIds = await this.gymRepo.findUserIdsByCorsoId(corsoid);
    const attesaIds = await this.gymRepo.findUserIdsInListaAttesa(corsoid);
    const tutti = [...new Set([...prenotatiIds, ...attesaIds])];

    await Promise.all(
      tutti.map(uid =>
        this.notificationService.inviaNotificaRealtime(uid, {
          titolo: "Corso cancellato",
          messaggio: `Il corso "${corso.nome}" del ${new Date(corso.dataora).toLocaleDateString("it-IT")} è stato annullato.`,
          tipo: "cancellazione",
          dati: { corsoid, corsoNome: corso.nome },
        })
      )
    );

    await this.gymRepo.deleteCorso(corsoid);

    await this.auditRepo.registra({
      utenteId: gestoreid,
      azione: "CANCELLAZIONE_CORSO",
      datiJSON: { corsoid, corsoNome: corso.nome, utentiNotificati: tutti.length },
      timestamp: new Date().toISOString(),
    });
  }

  // ─── FR8: Prenota corso (verifica abbonamento + capacità) ────────────────
  async prenotaCorsoPalestra(userid: string, corsoid: string): Promise<Prenotazione> {
    const corso = await this.gymRepo.findCorsoById(corsoid);
    if (!corso) throw new Error("Corso non trovato.");

    // FR8: Verifica abbonamento attivo
    const sub = await this.subRepo.findByUserIdActive(userid);
    if (!sub || sub.stato !== StatoAbbonamentoEnum.ATTIVO || new Date(sub.datafine) < new Date()) {
      throw new Error("FR8: Abbonamento non attivo. Acquista un abbonamento per prenotare corsi.");
    }

    // FR8/FR25: Verifica capacità
    if (corso.postioccupati >= corso.capacitamassima) {
      // FR25: Iscrivi alla lista d'attesa
      const entry = await this.gymRepo.addToListaAttesa(corsoid, userid);
      await this.notificationService.inviaNotificaRealtime(userid, {
        titolo: "Corso al completo – Lista d'attesa",
        messaggio: `Sei in posizione ${entry.posizione} nella lista d'attesa per "${corso.nome}".`,
        tipo: "lista_attesa",
        dati: { corsoid, posizione: entry.posizione },
      });
      throw new Error(`Corso al completo. Sei in lista d'attesa (posizione ${entry.posizione}).`);
    }

    const prenotazione = await this.gymRepo.savePrenotazioneCorso({
      userid,
      corsoid,
      strutturaid: corso.strutturaid,
      dataora: corso.dataora,
      stato: StatoPrenotazioneEnum.CONFERMATA,
      importototale: 0, // incluso nell'abbonamento
    });

    await this.gymRepo.incrementaPostiOccupati(corsoid);
    return prenotazione;
  }

  // ─── FR24: Cancella prenotazione (R3: 50% penale se < 24h) ──────────────
  async cancellaPrenotazione(prenotazioneId: string): Promise<void> {
    const p = await this.gymRepo.findPrenotazioneCorsoById(prenotazioneId);
    if (!p) throw new Error("Prenotazione non trovata.");

    const oreAlCorso = (new Date(p.dataora).getTime() - Date.now()) / (1000 * 60 * 60);

    let rimborso = p.importototale;
    if (oreAlCorso < CANCELLAZIONE_GRATUITA_ORE) {
      // R3: penale del 50% se cancellazione tardiva
      rimborso = p.importototale * (1 - PENALE_PERCENTUALE);
    }

    const aggiornata = await this.gymRepo.savePrenotazioneCorso({
      ...p,
      stato: StatoPrenotazioneEnum.CANCELLATA,
      rimborso,
    });

    if (p.corsoid) {
      await this.gymRepo.decrementaPostiOccupati(p.corsoid);

      // FR25: Promuovi primo in lista d'attesa e notificalo
      const prossimo = await this.gymRepo.popFromListaAttesa(p.corsoid);
      if (prossimo) {
        // Crea prenotazione automatica per il prossimo in lista
        await this.gymRepo.savePrenotazioneCorso({
          userid: prossimo.userid,
          corsoid: p.corsoid,
          strutturaid: p.strutturaid,
          dataora: p.dataora,
          stato: StatoPrenotazioneEnum.CONFERMATA,
          importototale: 0,
        });
        await this.gymRepo.incrementaPostiOccupati(p.corsoid);

        // FR25: Notifica il promosso
        await this.notificationService.inviaNotificaRealtime(prossimo.userid, {
          titolo: "Posto disponibile!",
          messaggio: `Si è liberato un posto nel corso. La tua prenotazione è stata confermata automaticamente.`,
          tipo: "lista_attesa",
          dati: { corsoid: p.corsoid },
        });
      }
    }
  }

  async getCorsiStruttura(strutturaid: string): Promise<Corso[]> {
    return this.gymRepo.findCorsiByStrutturaId(strutturaid);
  }
}