// ============================================================
// CreateGymManagerService
// Application layer – implements GymManagementPort
// Fixes: FR6 (corso creation), FR8 (sub check), R3 (50% penalty),
//        R9 (fuzzy dedup), FR25 (waitlist notify), FR26 (cancel notify)
// ============================================================

import { GymManagementPort } from "@/backend/domain/port/in/GymManagementPort";
import { GymRepositoryPort } from "@/backend/domain/port/out/GymRepositoryPort";
import { CoachRepositoryPort } from "@/backend/domain/port/out/CoachRepositoryPort";
import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { NotificationServicePort } from "@/backend/domain/port/out/NotificationServicePort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { Struttura, Corso, Prenotazione, Coach, CoachWithUser, TipoAbbonamento, GestoreStats } from "@/backend/domain/model/types";
import { StatoAbbonamentoEnum, StatoPrenotazioneEnum, RuoloEnum } from "@/backend/domain/model/enums";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

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
    private readonly auditRepo: AuditLogRepositoryPort,
    private readonly coachRepo?: CoachRepositoryPort
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

    // R9: Anti-duplicato fuzzy su denominazione + indirizzo spostato logicamente su DB
    const struttureSimili = await this.gymRepo.matchStruttureFuzzy(denominazione, indirizzo);
    if (struttureSimili.length > 0) {
      throw new Error(
        `Vincolo R9: Struttura troppo simile a una esistente ("${struttureSimili[0].denominazione}"). Verificare se è un duplicato.`
      );
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

  // ─── UC2: Onboarding Coach ──────────────────────────────────────────────────
  async onboardCoach(
    strutturaid: string,
    emailGestore: string,
    emailCoach: string,
    nomeCoach?: string,
    cognomeCoach?: string
  ): Promise<void> {
    const supabase = createSupabaseServerClient();

    let userId: string;
    let isNewUser = false;
    let inviteData: any = null;
    let existingProfile: any = null;
    let existingCoach: any = null;

    // 1. Controlliamo se l'utente esiste già nel sistema
    const { data: userData } = await supabase
      .from("users")
      .select("id, nome, cognome, ruolo")
      .eq("email", emailCoach)
      .single();

    if (userData) {
      userId = userData.id;
      existingProfile = userData;

      // 2. REGOLE BUSINESS: Se è già un Coach, non possiamo associarlo automaticamente
      if (userData.ruolo === RuoloEnum.COACH) {
        throw new Error("L'utente è già registrato come Coach. Per associarlo a una nuova struttura, contatta il SuperAdmin.");
      }
    } else {
      // 3. Se non esiste affatto, mandiamo il link di INVITO (questo crea l'account Auth)
      const { data, error: inviteError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: emailCoach,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` }
      });

      if (inviteError) {
        throw new Error(`Errore invio invito: ${inviteError.message}`);
      }

      userId = data.user.id;
      inviteData = data;
      isNewUser = true;
    }

    // 4. Upsert Profilo Pubblico (assicura ruolo COACH e campi obbligatori)
    const { error: profileError } = await supabase.from("users").upsert({
      id: userId,
      email: emailCoach,
      nome: isNewUser ? (nomeCoach ?? "Nuovo") : (existingProfile?.nome ?? nomeCoach ?? "Nuovo"),
      cognome: isNewUser ? (cognomeCoach ?? "Coach") : (existingProfile?.cognome ?? cognomeCoach ?? "Coach"),
      ruolo: RuoloEnum.COACH
    });

    if (profileError) {
      throw new Error(`Errore aggiornamento profilo utente: ${profileError.message}`);
    }

    // 4. Add Coach entity mapped to Struttura (UPSERT per ri-associare)
    const { error: coachError } = await supabase.from("coaches").upsert({
      userid: userId,
      strutturaid,
      specializzazione: "Generale",
      rating: 5.0
    }, { onConflict: 'userid' });

    if (coachError) {
      throw new Error(`Errore associazione coach alla struttura: ${coachError.message}`);
    }

    // 5. Invia Email differenziata (UC2 Step 6)
    const emailSubject = isNewUser
      ? "Benvenuto in TrackFit! Completa la tua registrazione"
      : "Nuova associazione struttura palestra";

    const emailBody = isNewUser
      ? `Sei stato invitato come Coach nella nostra struttura. Clicca su questo link per attivare il tuo account: ${inviteData?.properties?.action_link}`
      : `Il tuo account Coach è stato associato correttamente alla nuova struttura della palestra. Ora puoi gestire i tuoi atleti da lì.`;

    await this.notificationService.inviaEmail(emailCoach, emailSubject, { messaggio: emailBody, strutturaid });

    // 4. Register Audit Log (UC2 Step 7)
    await this.auditRepo.registra({
      utenteId: emailGestore, // Usiamo l'email gestore come identificativo attore
      azione: "ONBOARDING_COACH",
      datiJSON: { strutturaid, emailCoach, coachUserId: userId },
      timestamp: new Date().toISOString(),
    });
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

    // Verifica se l'utente è già prenotato
    const esistente = await this.gymRepo.findPrenotazioneByUtenteAndCorso(userid, corsoid);
    if (esistente) {
      throw new Error("Hai già una prenotazione attiva (o in lista d'attesa) per questo corso.");
    }

    // FR8/FR25: Verifica capacità in modo ATOMICO
    const spazioneRiservato = await this.gymRepo.incrementaPostiOccupati(corsoid);
    if (!spazioneRiservato) {
      // FR25: Iscrivi alla lista d'attesa (se la transazione di incremento è fallita, il corso è pieno)
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

  async aggiornaCorso(corsoid: string, data: Partial<Corso>): Promise<Corso> {
    return this.gymRepo.updateCorso(corsoid, data);
  }

  // ─── Gestore dashboard ──────────────────────────────────────────────────────
  async getStrutturaGestore(gestoreid: string): Promise<Struttura | null> {
    return this.gymRepo.findStrutturaByGestoreId(gestoreid);
  }

  async aggiornaStruttura(strutturaid: string, data: Partial<Struttura>): Promise<Struttura> {
    return this.gymRepo.updateStruttura(strutturaid, data);
  }

  async getGestoreStats(strutturaid: string): Promise<GestoreStats> {
    return this.gymRepo.getStats(strutturaid);
  }

  async getCoachesStruttura(strutturaid: string): Promise<CoachWithUser[]> {
    if (this.coachRepo) return this.coachRepo.findByStrutturaId(strutturaid);
    return [];
  }

  async creaTipoAbbonamento(tipo: Omit<TipoAbbonamento, "id" | "createdat">): Promise<TipoAbbonamento> {
    return this.gymRepo.saveTipoAbbonamento(tipo);
  }

  async getTipiAbbonamento(strutturaid: string): Promise<TipoAbbonamento[]> {
    return this.gymRepo.findTipiAbbonamentoByStrutturaId(strutturaid);
  }

  async eliminaTipoAbbonamento(id: string): Promise<void> {
    return this.gymRepo.deleteTipoAbbonamento(id);
  }
}