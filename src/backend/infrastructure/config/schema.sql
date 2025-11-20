-- ============================================================
-- TrackFit – Supabase SQL Schema
-- Based on SDD entities & Domain model (src/backend/domain/model/types.ts)
-- ============================================================

-- 1. ENUMS (PostgreSQL native enums matching TS enums)
CREATE TYPE ruolo_enum AS ENUM ('UTENTE', 'COACH', 'GESTORE', 'ADMIN');
CREATE TYPE workout_stato_enum AS ENUM ('PIANIFICATA', 'IN_CORSO', 'IN_PAUSA', 'INTERROTTA', 'COMPLETATA_LOCALMENTE', 'IN_ATTESA_DI_RETE', 'IN_SINCRONIZZAZIONE', 'CONSOLIDATA');
CREATE TYPE abbonamento_stato_enum AS ENUM ('ATTIVO', 'SOSPESO', 'SCADUTO', 'CANCELLATO');
CREATE TYPE prenotazione_stato_enum AS ENUM ('CONFERMATA', 'CANCELLATA', 'IN_ATTESA');
CREATE TYPE pagamento_stato_enum AS ENUM ('IN_ATTESA', 'COMPLETATO', 'FALLITO', 'RIMBORSATO');

-- 2. TABLES

-- Users (Extended from Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo ruolo_enum DEFAULT 'UTENTE',
    dataNascita DATE,
    peso DECIMAL,
    altezza INT,
    coachId UUID, -- Self-referencing FK added later
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaches
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strutturaId UUID,
    specializzazione TEXT,
    rating DECIMAL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5)
);

-- Add foreign key back to users for coach association
ALTER TABLE users ADD CONSTRAINT fk_user_coach FOREIGN KEY (coachId) REFERENCES coaches(id) ON DELETE SET NULL;

-- Strutture (Gyms)
CREATE TABLE strutture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piva TEXT UNIQUE NOT NULL, -- R8 constraint
    cun TEXT UNIQUE NOT NULL,  -- R9 constraint
    denominazione TEXT NOT NULL,
    indirizzo TEXT NOT NULL,
    stato TEXT DEFAULT 'Attiva',
    gestoreId UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Corsi
CREATE TABLE corsi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strutturaId UUID NOT NULL REFERENCES strutture(id) ON DELETE CASCADE,
    coachId UUID REFERENCES coaches(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    dataOra TIMESTAMP WITH TIME ZONE NOT NULL,
    capacitaMassima INT NOT NULL CHECK (capacitaMassima > 0),
    postiOccupati INT DEFAULT 0 CHECK (postiOccupati >= 0),
    durata INT NOT NULL -- in minutes
);

-- Lista Attesa (R6 fallback)
CREATE TABLE lista_attesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corsoId UUID NOT NULL REFERENCES corsi(id) ON DELETE CASCADE,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    posizione INT NOT NULL CHECK (posizione > 0),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(corsoId, userId)
);

-- Prenotazioni
CREATE TABLE prenotazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coachId UUID REFERENCES coaches(id) ON DELETE CASCADE,
    corsoId UUID REFERENCES corsi(id) ON DELETE CASCADE,
    strutturaId UUID REFERENCES strutture(id) ON DELETE CASCADE,
    dataOra TIMESTAMP WITH TIME ZONE NOT NULL,
    stato prenotazione_stato_enum DEFAULT 'CONFERMATA',
    importoTotale DECIMAL NOT NULL,
    rimborso DECIMAL
);

-- Workouts
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    dataOra TIMESTAMP WITH TIME ZONE NOT NULL,
    durata INT NOT NULL,
    obiettivo TEXT,
    stato workout_stato_enum DEFAULT 'PIANIFICATA',
    percezionesSforzo INT CHECK (percezionesSforzo >= 1 AND percezionesSforzo <= 10),
    note TEXT,
    distanza DECIMAL,
    frequenzaCardiacaMedia INT,
    calorie INT,
    gpxTrace TEXT,
    stravaId TEXT UNIQUE,
    sorgente TEXT NOT NULL DEFAULT 'TRACKING'
);

-- Abbonamenti
CREATE TABLE abbonamenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strutturaId UUID REFERENCES strutture(id) ON DELETE SET NULL,
    tipoId UUID,
    stato abbonamento_stato_enum DEFAULT 'ATTIVO',
    qrCode TEXT UNIQUE,
    dataInizio TIMESTAMP WITH TIME ZONE NOT NULL,
    dataFine TIMESTAMP WITH TIME ZONE NOT NULL,
    importo DECIMAL NOT NULL
);

-- Pagamenti
CREATE TABLE pagamenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    abbonamentoId UUID REFERENCES abbonamenti(id) ON DELETE SET NULL,
    importo DECIMAL NOT NULL,
    valuta TEXT DEFAULT 'eur',
    stato pagamento_stato_enum DEFAULT 'IN_ATTESA',
    stripePaymentIntentId TEXT UNIQUE,
    metodo TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log (R1)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coachId UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    sessioneId UUID NOT NULL,
    vecchiaDataOra TIMESTAMP WITH TIME ZONE NOT NULL,
    nuovaDataOra TIMESTAMP WITH TIME ZONE NOT NULL,
    motivazione TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    strutturaId UUID REFERENCES strutture(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    distanzaTotale DECIMAL,
    tempoTotaleMinuti INT,
    ritmoMedio DECIMAL,
    incassoTotale DECIMAL,
    accessiGiornalieri INT,
    abbonamentiAttivi INT,
    formato TEXT NOT NULL,
    generatoAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Policies (Examples)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can read/write their own workouts
CREATE POLICY "Users view own workouts" ON workouts FOR SELECT USING (auth.uid() = userId);
CREATE POLICY "Users insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = userId);
CREATE POLICY "Users update own workouts" ON workouts FOR UPDATE USING (auth.uid() = userId);
