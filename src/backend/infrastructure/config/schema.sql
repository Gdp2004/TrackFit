-- ============================================================
-- TrackFit – Supabase SQL Schema
-- Based on SDD entities & Domain model (src/backend/domain/model/types.ts)
-- ============================================================

-- 1. ENUMS (PostgreSQL native enums matching TS enums)
DROP TYPE IF EXISTS ruolo_enum CASCADE;
DROP TYPE IF EXISTS workout_stato_enum CASCADE;
DROP TYPE IF EXISTS abbonamento_stato_enum CASCADE;
DROP TYPE IF EXISTS prenotazione_stato_enum CASCADE;
DROP TYPE IF EXISTS pagamento_stato_enum CASCADE;

CREATE TYPE ruolo_enum AS ENUM ('UTENTE', 'COACH', 'GESTORE', 'ADMIN');
CREATE TYPE workout_stato_enum AS ENUM ('PIANIFICATA', 'IN_CORSO', 'IN_PAUSA', 'INTERROTTA', 'COMPLETATA_LOCALMENTE', 'IN_ATTESA_DI_RETE', 'IN_SINCRONIZZAZIONE', 'CONSOLIDATA');
CREATE TYPE abbonamento_stato_enum AS ENUM ('ATTIVO', 'SOSPESO', 'SCADUTO', 'CANCELLATO');
CREATE TYPE prenotazione_stato_enum AS ENUM ('CONFERMATA', 'CANCELLATA', 'IN_ATTESA');
CREATE TYPE pagamento_stato_enum AS ENUM ('IN_ATTESA', 'COMPLETATO', 'FALLITO', 'RIMBORSATO');

-- Drop existing tables to allow clean recreation
DROP TABLE IF EXISTS "storico_uso_coupon" CASCADE;
DROP TABLE IF EXISTS coupon CASCADE;
DROP TABLE IF EXISTS pagamenti CASCADE;
DROP TABLE IF EXISTS abbonamenti CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS prenotazioni CASCADE;
DROP TABLE IF EXISTS lista_attesa CASCADE;
DROP TABLE IF EXISTS corsi CASCADE;
DROP TABLE IF EXISTS strutture CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS reports CASCADE;

-- 2. TABLES

-- Users (Extended from Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo ruolo_enum DEFAULT 'UTENTE',
    datanascita DATE,
    peso DECIMAL,
    altezza INT,
    coachid UUID, -- Self-referencing FK added later
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaches
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strutturaid UUID,
    specializzazione TEXT,
    rating DECIMAL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5)
);

-- Add foreign key back to users for coach association
ALTER TABLE users ADD CONSTRAINT fk_user_coach FOREIGN KEY (coachid) REFERENCES coaches(id) ON DELETE SET NULL;

-- Strutture (Gyms)
CREATE TABLE strutture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piva TEXT UNIQUE NOT NULL, -- R8 constraint
    cun TEXT UNIQUE NOT NULL,  -- R9 constraint
    denominazione TEXT NOT NULL,
    indirizzo TEXT NOT NULL,
    stato TEXT DEFAULT 'Attiva',
    gestoreid UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Corsi
CREATE TABLE corsi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strutturaid UUID NOT NULL REFERENCES strutture(id) ON DELETE CASCADE,
    coachid UUID REFERENCES coaches(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    dataora TIMESTAMP WITH TIME ZONE NOT NULL,
    capacitamassima INT NOT NULL CHECK (capacitamassima > 0),
    postioccupati INT DEFAULT 0 CHECK (postioccupati >= 0),
    durata INT NOT NULL -- in minutes
);

-- Lista Attesa (R6 fallback)
CREATE TABLE lista_attesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corsoid UUID NOT NULL REFERENCES corsi(id) ON DELETE CASCADE,
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    posizione INT NOT NULL CHECK (posizione > 0),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(corsoid, userid)
);

-- Prenotazioni
CREATE TABLE prenotazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coachid UUID REFERENCES coaches(id) ON DELETE CASCADE,
    corsoid UUID REFERENCES corsi(id) ON DELETE CASCADE,
    strutturaid UUID REFERENCES strutture(id) ON DELETE CASCADE,
    dataora TIMESTAMP WITH TIME ZONE NOT NULL,
    stato prenotazione_stato_enum DEFAULT 'CONFERMATA',
    importototale DECIMAL NOT NULL,
    rimborso DECIMAL
);

-- Workouts
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    dataora TIMESTAMP WITH TIME ZONE NOT NULL,
    durata INT NOT NULL,
    obiettivo TEXT,
    stato workout_stato_enum DEFAULT 'PIANIFICATA',
    percezionessforzo INT CHECK (percezionessforzo >= 1 AND percezionessforzo <= 10),
    note TEXT,
    distanza DECIMAL,
    frequenzacardiacamedia INT,
    calorie INT,
    gpxtrace TEXT,
    stravaid TEXT UNIQUE,
    sorgente TEXT NOT NULL DEFAULT 'TRACKING'
);

-- Abbonamenti
CREATE TABLE abbonamenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strutturaid UUID REFERENCES strutture(id) ON DELETE SET NULL,
    tipoid UUID,
    stato abbonamento_stato_enum DEFAULT 'ATTIVO',
    qrCode TEXT UNIQUE,
    datainizio TIMESTAMP WITH TIME ZONE NOT NULL,
    datafine TIMESTAMP WITH TIME ZONE NOT NULL,
    importo DECIMAL NOT NULL,
    rinnovoautomatico BOOLEAN DEFAULT false
);

-- Pagamenti
CREATE TABLE pagamenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    abbonamentoid UUID REFERENCES abbonamenti(id) ON DELETE SET NULL,
    importo DECIMAL NOT NULL,
    valuta TEXT DEFAULT 'eur',
    stato pagamento_stato_enum DEFAULT 'IN_ATTESA',
    stripepaymentintentid TEXT UNIQUE,
    metodo TEXT,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon (R4)
CREATE TABLE coupon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice TEXT UNIQUE NOT NULL,
    strutturaid UUID NOT NULL REFERENCES strutture(id) ON DELETE CASCADE,
    tipoabbonamentoid UUID NOT NULL,
    percentualesconto INT NOT NULL CHECK (percentualesconto > 0 AND percentualesconto <= 100),
    monouso BOOLEAN DEFAULT true,
    usato BOOLEAN DEFAULT false,
    scadenza TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Storico uso coupon (R4 per monouso)
CREATE TABLE storico_uso_coupon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couponid UUID NOT NULL REFERENCES coupon(id) ON DELETE CASCADE,
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usatoat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(couponid, userid)
);

-- Audit Log (R10 esteso)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operazione TEXT NOT NULL,
    risorsaid UUID NOT NULL,
    attoreid UUID NOT NULL,
    dettagli JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID REFERENCES users(id) ON DELETE CASCADE,
    strutturaid UUID REFERENCES strutture(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    distanzatotale DECIMAL,
    tempototaleminuti INT,
    ritmomedio DECIMAL,
    incassototale DECIMAL,
    accessigiornalieri INT,
    abbonamentiattivi INT,
    formato TEXT NOT NULL,
    generatoat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Policies (Examples)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can read/write their own workouts
CREATE POLICY "Users view own workouts" ON workouts FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Users insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = userid);
CREATE POLICY "Users update own workouts" ON workouts FOR UPDATE USING (auth.uid() = userid);

-- ============================================================
-- 4. Funzioni RPC ed Estensioni (Ottimizzazione & Concorrenza)
-- ============================================================

-- R9: Fuzzy Search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- RPC per ricerca fuzzy Strutture (sposta il calcolo Dice in DB)
CREATE OR REPLACE FUNCTION match_strutture(str_denominazione TEXT, str_indirizzo TEXT, similarity_threshold FLOAT)
RETURNS TABLE (id UUID, denominazione TEXT, indirizzo TEXT, similarity FLOAT) AS $$
BEGIN
    RETURN QUERY 
    SELECT s.id, s.denominazione, s.indirizzo, 
           (similarity(s.denominazione, str_denominazione) + similarity(s.indirizzo, str_indirizzo)) / 2.0 AS similarity
    FROM strutture s
    WHERE (similarity(s.denominazione, str_denominazione) + similarity(s.indirizzo, str_indirizzo)) / 2.0 >= similarity_threshold;
END;
$$ LANGUAGE plpgsql;

-- RPC per prenotazione atomica (Previene overbooking)
CREATE OR REPLACE FUNCTION incrementa_posti_corso(p_corso_id UUID)
RETURNS boolean AS $$
DECLARE
    affected_rows INT;
BEGIN
    UPDATE corsi 
    SET postioccupati = postioccupati + 1 
    WHERE id = p_corso_id AND postioccupati < capacitamassima;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows > 0 THEN
        RETURN true;
    ELSE
        RETURN false; -- Se ritorna false, il corso è pieno
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC per riscatto coupon atomico (Previene usi simultanei concorrenti)
CREATE OR REPLACE FUNCTION redeem_coupon(p_coupon_id UUID, p_user_id UUID, is_monouso BOOLEAN)
RETURNS boolean AS $$
DECLARE
    affected_rows INT;
BEGIN
    -- 1. Se è monouso (globale), deve aggiornare la tabella coupon SOLO se usato è false
    IF is_monouso THEN
        UPDATE coupon 
        SET usato = true
        WHERE id = p_coupon_id AND usato = false;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        -- Se non ha aggiornato nulla, significa che era già usato
        IF affected_rows = 0 THEN
            RETURN false;
        END IF;
    END IF;
    
    -- 2. Anche se non è monouso globale, un utente lo può usare 1 sola volta
    -- L'insert fallirà (sollevando eccezione) se la coppia UNIQUE(couponid, userid) esiste già
    BEGIN
        INSERT INTO storico_uso_coupon(couponid, userid) VALUES (p_coupon_id, p_user_id);
    EXCEPTION WHEN unique_violation THEN
        RETURN false;
    END;

    RETURN true;
END;
$$ LANGUAGE plpgsql;
