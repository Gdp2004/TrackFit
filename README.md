# 🏋️ TrackFit

**TrackFit** è una piattaforma web completa per la gestione del fitness, sviluppata con **Next.js 15**, **TypeScript** e **Supabase**. Collega atleti, coach e gestori di palestre in un'unica applicazione integrata — supportando allenamenti, abbonamenti, prenotazioni, pagamenti e notifiche in tempo reale.

---

## Indice

- [Funzionalità per ruolo](#funzionalità-per-ruolo)
- [Tech Stack](#tech-stack)
- [Struttura del progetto](#struttura-del-progetto)
- [Installazione e avvio](#installazione-e-avvio)
- [Variabili d'ambiente](#variabili-dampiente)
- [Script disponibili](#script-disponibili)
- [Autenticazione e ruoli](#autenticazione-e-ruoli)
- [Pagamenti](#pagamenti)
- [Notifiche Realtime](#notifiche-realtime)
- [Integrazioni esterne](#integrazioni-esterne)
- [Testing](#testing)
- [Contribuire](#contribuire)
- [Licenza](#licenza)

---

## Funzionalità per ruolo

### 🧑‍💪 Atleta (Utente)
- Dashboard personale con storico e statistiche degli allenamenti
- Gestione abbonamento e storico pagamenti
- Notifiche in tempo reale in-app
- Prenotazione sessioni con i coach

### 🏃 Coach
- Dashboard con panoramica degli atleti seguiti
- Gestione del roster atleti e calendario disponibilità
- Assegnazione e monitoraggio dei piani di allenamento
- Ricezione e gestione delle richieste di prenotazione

### 🏢 Gestore Palestra
- Dashboard con panoramica della struttura e dei soci
- Gestione della palestra, del personale e dei corsi
- Creazione e gestione di coupon sconto
- Monitoraggio degli abbonamenti attivi

### 🔐 Admin
- Pannello di amministrazione utenti
- Supervisione dell'intera piattaforma

---

## Tech Stack

| Livello          | Tecnologia                                                |
|:-----------------|:----------------------------------------------------------|
| Framework        | [Next.js 15](https://nextjs.org/) (App Router)            |
| Linguaggio       | TypeScript 5                                              |
| Database         | [Supabase](https://supabase.com/) (PostgreSQL + Realtime) |
| Autenticazione   | Supabase Auth con SSR                                     |
| Pagamenti        | [Stripe](https://stripe.com/)                             |
| Grafici          | [Recharts](https://recharts.org/)                         |
| Validazione      | [Zod](https://zod.dev/)                                   |
| Test (unit/int.) | [Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/) |
| Test (E2E)       | [Playwright](https://playwright.dev/)                     |
| Integrazioni     | Strava API, Google Fit API                                |

---

## Struttura del progetto

```
TrackFit/
├── .env.local                    # Variabili d'ambiente (non committato)
├── .gitignore
├── README.md
├── next.config.ts
├── tsconfig.json
├── package.json
├── jest.config.js                # Proxy → config/jest.config.js
├── playwright.config.ts          # Proxy → config/playwright.config.ts
│
├── config/                       # Configurazioni dei tool di test
│   ├── jest.config.js            # Configurazione Jest completa
│   ├── jest.setup.js             # Setup globale Jest
│   └── playwright.config.ts     # Configurazione Playwright E2E
│
├── public/
│   └── images/                   # Asset statici (→ public/images/README.md)
│
├── scripts/                      # Script di utilità (seed, admin, ecc.)
│
├── src/
│   ├── app/
│   │   ├── (auth)/               # Pagine di login e registrazione
│   │   ├── (dashboard)/          # Dashboard basate sul ruolo utente
│   │   └── api/                  # Route handlers Next.js
│   │
│   ├── frontend/
│   │   ├── components/           # Componenti UI riutilizzabili
│   │   ├── contexts/             # Context React (Auth, ecc.)
│   │   ├── hooks/                # Hook React personalizzati
│   │   └── lib/                  # Utility e client frontend
│   │
│   └── backend/
│       ├── application/          # Use case e servizi applicativi
│       ├── domain/               # Modelli di dominio ed enumerazioni
│       └── infrastructure/       # Adapter e accesso ai dati (Supabase, Stripe)
│
├── tests/                        # Suite di test (→ tests/README.md)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── Deliverables/                 # Documentazione di progetto (PDF, meeting)
```

---

## Installazione e avvio

### Prerequisiti

- **Node.js** >= 18
- **npm** >= 9
- Un progetto attivo su [Supabase](https://supabase.com/)
- Un account [Stripe](https://stripe.com/) (per i pagamenti)

### 1. Clona il repository

```bash
git clone https://github.com/your-username/TrackFit.git
cd TrackFit
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

```bash
cp .env.example .env.local
```

Compila `.env.local` con le tue credenziali (vedi sezione [Variabili d'ambiente](#variabili-dampiente)).

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000).

---

## Variabili d'ambiente

| Variabile                              | Descrizione                                          |
|:---------------------------------------|:-----------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del progetto Supabase                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Chiave anonima Supabase (pubblica)                   |
| `SUPABASE_SERVICE_ROLE_KEY`            | Chiave service role Supabase (solo lato server)      |
| `STRIPE_SECRET_KEY`                    | Chiave segreta Stripe                                |
| `STRIPE_WEBHOOK_SECRET`                | Segreto di firma per i webhook Stripe                |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`   | Chiave pubblica Stripe                               |
| `STRAVA_CLIENT_ID`                     | Client ID OAuth2 per Strava                          |
| `STRAVA_CLIENT_SECRET`                 | Client Secret OAuth2 per Strava                      |
| `GOOGLE_FIT_CLIENT_ID`                 | Client ID OAuth2 per Google Fit                      |
| `GOOGLE_FIT_CLIENT_SECRET`             | Client Secret OAuth2 per Google Fit                  |
| `NEXTAUTH_URL`                         | URL base dell'applicazione (es. `http://localhost:3000`) |
| `NEXTAUTH_SECRET`                      | Segreto per la firma delle sessioni                  |

---

## Script disponibili

| Comando                   | Descrizione                                  |
|:--------------------------|:---------------------------------------------|
| `npm run dev`             | Avvia il server di sviluppo (hot reload)     |
| `npm run build`           | Genera il bundle ottimizzato per produzione  |
| `npm run start`           | Avvia il server in modalità produzione       |
| `npm run lint`            | Esegue ESLint sull'intero progetto           |
| `npm run type-check`      | Controllo dei tipi TypeScript                |
| `npm test`                | Esegue tutti i test unit + integration (Jest)|
| `npm run test:watch`      | Esegue i test in modalità watch              |
| `npm run test:coverage`   | Genera il report di copertura del codice     |
| `npm run test:e2e`        | Esegue i test end-to-end con Playwright      |

---

## Autenticazione e ruoli

TrackFit utilizza **Supabase Auth** con SSR per la gestione dell'autenticazione. Ad ogni utente è associato uno dei seguenti ruoli:

| Ruolo      | Accesso                                                              |
|:-----------|:---------------------------------------------------------------------|
| `UTENTE`   | Dashboard personale, allenamenti, abbonamento, prenotazioni          |
| `COACH`    | Gestione atleti, disponibilità, piani di allenamento                 |
| `GESTORE`  | Struttura palestra, corsi, coupon, gestione soci                     |
| `ADMIN`    | Amministrazione completa della piattaforma                           |

Il routing basato sul ruolo è gestito tramite `src/middleware.ts`.

---

## Pagamenti

I pagamenti sono gestiti con **Stripe**. I piani di abbonamento sono acquistabili dalla pagina `/subscription`.

I webhook Stripe devono essere configurati per puntare a `/api/stripe/webhook`.

Per testare i webhook in locale, usa la [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Notifiche Realtime

Le notifiche sfruttano **Supabase Broadcast** (compatibile con il piano gratuito Supabase, senza `postgres_changes`). Il sistema combina broadcast istantaneo e polling leggero ogni 60 secondi.

Per la guida completa all'architettura e al setup, consulta [`NOTIFICHE_SETUP.md`](NOTIFICHE_SETUP.md).

---

## Integrazioni esterne

| Integrazione           | Scopo                                        |
|:-----------------------|:---------------------------------------------|
| **Strava**             | Importazione attività sportive da Strava     |
| **Google Fit**         | Importazione dati di salute e attività       |
| **Supabase Realtime**  | Notifiche live in-app tramite Broadcast      |
| **Stripe**             | Gestione abbonamenti e pagamenti             |

---

## Testing

I test sono organizzati nella cartella `tests/`. Per la documentazione completa dei test case coperti consulta [`tests/README.md`](tests/README.md).

```bash
npm test                   # Unit + Integration (Jest)
npm run test:e2e           # End-to-End (Playwright)
npm run test:coverage      # Report di copertura
```

---

## Contribuire

1. Fai un fork del repository
2. Crea un branch per la tua feature: `git checkout -b feature/mia-feature`
3. Effettua il commit delle modifiche: `git commit -m "feat: descrizione feature"`
4. Fai il push del branch: `git push origin feature/mia-feature`
5. Apri una Pull Request verso il branch `main`

---

## Licenza

Questo progetto è distribuito sotto licenza **MIT**. Consulta il file [LICENSE](LICENSE) per i dettagli.
