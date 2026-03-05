# TrackFit

**TrackFit** è una piattaforma completa per la gestione del fitness, costruita con **Next.js 15**, **TypeScript** e **Supabase**. Connette atleti, coach e gestori di palestre in un'unica applicazione — gestendo allenamenti, abbonamenti, prenotazioni, notifiche e molto altro.

---


### Atleta (Utente)
- Dashboard personale con storico e statistiche degli allenamenti
- Gestione abbonamento 
- Notifiche in tempo reale in-app
- Prenotazione sessioni con i coach

### Coach
- Dashboard con panoramica degli atleti seguiti
- Gestione del roster atleti e calendario disponibilità
- Assegnazione e monitoraggio dei piani di allenamento
- Ricezione richieste di prenotazione dagli atleti

### Gestore Palestra (Gestore)
- Dashboard con panoramica della struttura
- Gestione della palestra e del personale
- Creazione e gestione di coupon sconto
- Monitoraggio degli abbonamenti e dei soci

### Admin
- Pannello di gestione utenti
- Supervisione dell'intera piattaforma

---

## Tech Stack

| Livello       | Tecnologia                                      |
|:-------------|:------------------------------------------------|
| Framework     | [Next.js 15](https://nextjs.org/) (App Router) |
| Linguaggio    | TypeScript 5                                    |
| Database      | [Supabase](https://supabase.com/) (PostgreSQL + Realtime) |
| Autenticazione | Supabase Auth (SSR)                            |
| Pagamenti     | [Stripe](https://stripe.com/)                   |
| Grafici       | [Recharts](https://recharts.org/)               |
| Validazione   | Zod                                             |
| Integrazioni  | Strava API, Google Fit API                      |

---

## Struttura del Progetto

```
TrackFit/
├── public/
│   └── images/
│       ├── auth/          # Sfondi per le pagine di autenticazione
│       ├── coach/         # Asset per la dashboard Coach
│       ├── gym/           # Asset per la dashboard Gestore
│       ├── icons/         # Logo, favicon, icone
│       └── backgrounds/   # Sfondi generici riutilizzabili
├── src/
│   ├── app/
│   │   ├── (auth)/        # Pagine di login e registrazione
│   │   ├── (dashboard)/   # Dashboard basate sul ruolo
│   │   │   ├── coach/
│   │   │   ├── coaches/
│   │   │   ├── gym/
│   │   │   ├── gyms/
│   │   │   ├── dashboard/
│   │   │   ├── workouts/
│   │   │   ├── subscription/
│   │   │   └── profile/
│   │   └── api/           # API route handlers
│   ├── frontend/
│   │   ├── components/    # Componenti UI riutilizzabili
│   │   ├── contexts/      # Context React (Auth, ecc.)
│   │   ├── hooks/         # Hook React personalizzati
│   │   └── lib/           # Utility frontend
│   └── backend/
│       └── domain/        # Modelli di dominio ed enum
├── .env.example           # Template delle variabili d'ambiente
├── next.config.ts
└── tsconfig.json
```

---

### Prerequisiti

- **Node.js** >= 18
- **npm** >= 9
- Un progetto [Supabase](https://supabase.com/)
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

Copia il file di esempio e compila con le tue credenziali:

```bash
cp .env.example .env.local
```

| Variabile | Descrizione |
|:---------|:------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del tuo progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anonima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave service role Supabase (solo lato server) |
| `STRIPE_SECRET_KEY` | Chiave segreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segreto di firma webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chiave pubblica Stripe |
| `STRAVA_CLIENT_ID` | Client ID OAuth2 Strava |
| `STRAVA_CLIENT_SECRET` | Client Secret OAuth2 Strava |
| `GOOGLE_FIT_CLIENT_ID` | Client ID OAuth2 Google Fit |
| `GOOGLE_FIT_CLIENT_SECRET` | Client Secret OAuth2 Google Fit |
| `NEXTAUTH_URL` | URL base dell'app (es. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Segreto casuale per la firma delle sessioni |

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000] nel browser.

---

##  Script Disponibili

| Comando | Descrizione |
|:--------|:------------|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Genera il bundle di produzione |
| `npm run start` | Avvia il server di produzione |
| `npm run lint` | Esegue ESLint |
| `npm run type-check` | Esegue il controllo dei tipi TypeScript |

---

##  Autenticazione e Ruoli

TrackFit utilizza **Supabase Auth** per l'autenticazione. Ad ogni utente viene assegnato uno dei seguenti ruoli:

| Ruolo | Accesso |
|:------|:--------|
| `UTENTE` | Dashboard personale, allenamenti, abbonamento |
| `COACH` | Gestione atleti, disponibilità, strumenti di coaching |
| `GESTORE` | Struttura palestra, coupon, gestione soci |
| `ADMIN` | Amministrazione completa della piattaforma |

Il routing basato sul ruolo è gestito a livello di middleware tramite `src/middleware.ts`.

---

## 💳 Pagamenti

I pagamenti sono gestiti tramite **Stripe**. I piani di abbonamento sono accessibili dalla pagina `/subscription`. I webhook Stripe devono essere configurati per puntare a `/api/stripe/webhook`.

Per testare i webhook in locale, utilizza la [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Integrazioni

| Integrazione | Scopo |
|:------------|:------|
| **Strava** | Importazione dati attività da Strava |
| **Google Fit** | Importazione dati salute e attività |
| **Supabase Realtime** | Notifiche live in-app |

---

## Contribuire

1. Fai un fork del repository
2. Crea un branch per la tua feature: `git checkout -b feature/mia-feature`
3. Effettua il commit: `git commit -m "feat: aggiungi mia feature"`
4. Fai il push del branch: `git push origin feature/mia-feature`
5. Apri una Pull Request

---

## Licenza

Questo progetto è distribuito sotto licenza **MIT**. Consulta il file [LICENSE](LICENSE) per i dettagli.