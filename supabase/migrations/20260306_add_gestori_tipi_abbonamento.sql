-- Migration: Aggiungi relazioni tra users, coaches, strutture e gestori

-- 1. Tabella gestori
CREATE TABLE IF NOT EXISTS "gestori" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userid" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "strutturaid" UUID, -- Sarà FK a strutture, aggiunta dopo
    "telefono" TEXT,
    "bio" TEXT,
    "createdat" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella tipi_abbonamento
CREATE TABLE IF NOT EXISTS "tipi_abbonamento" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "strutturaid" UUID NOT NULL, -- Sarà FK a strutture, aggiunta dopo
    "nome" TEXT NOT NULL,
    "duratamesi" INT NOT NULL CHECK ("duratamesi" > 0),
    "prezzo" DECIMAL NOT NULL CHECK ("prezzo" >= 0),
    "rinnovabile" BOOLEAN DEFAULT true,
    "descrizione" TEXT,
    "createdat" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aggiorna FK di gestori
-- Assumendo che la tabella strutture esista già
ALTER TABLE "gestori" 
ADD CONSTRAINT fk_gestori_struttura 
FOREIGN KEY ("strutturaid") 
REFERENCES "strutture"("id") 
ON DELETE SET NULL;

-- 4. Aggiorna FK di tipi_abbonamento
ALTER TABLE "tipi_abbonamento" 
ADD CONSTRAINT fk_tipi_abbonamento_struttura 
FOREIGN KEY ("strutturaid") 
REFERENCES "strutture"("id") 
ON DELETE CASCADE;

-- 5. Aggiungi FK di coach in users (se mancante)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_coach' AND table_name = 'users'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "fk_user_coach" 
        FOREIGN KEY ("coachid") 
        REFERENCES "coaches"("id") 
        ON DELETE SET NULL;
    END IF;
END $$;
