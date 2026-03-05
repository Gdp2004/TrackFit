const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE URL or KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const targetEmail = "gdpalma22@gmail.com";
    console.log(`Looking for coach with email: ${targetEmail}`);

    // 1. Find the coach
    const { data: coachDataList, error: coachError } = await supabase
        .from("users")
        .select("id, ruolo")
        .eq("email", targetEmail)
        .limit(1);

    if (coachError || !coachDataList || coachDataList.length === 0) {
        console.error("Error finding coach:", coachError?.message || "User not found");
        process.exit(1);
    }

    const coachData = coachDataList[0];

    if (coachData.ruolo !== "COACH" && coachData.ruolo !== "ADMIN") {
        console.warn(`User ${targetEmail} has role ${coachData.ruolo}, expected COACH. Proceeding anyway but they might not see athletes in the dashboard unless they are a COACH.`);
    }

    const coachId = coachData.id;
    console.log(`Found coach ID: ${coachId}`);

    // 2. Create mock athletes
    const mockAthletes = [
        { nome: "Luca", cognome: "Bianchi", email: "luca.bianchi.mock@trackfit.local" },
        { nome: "Giulia", cognome: "Verdi", email: "giulia.verdi.mock@trackfit.local" },
        { nome: "Marco", cognome: "Neri", email: "marco.neri.mock@trackfit.local" }
    ];

    for (const athlete of mockAthletes) {
        console.log(`\nProcessing athlete: ${athlete.nome} ${athlete.cognome}`);

        // Create via Admin Auth API so they have an auth.user record
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: athlete.email,
            password: "password123",
            email_confirm: true,
            user_metadata: {
                nome: athlete.nome,
                cognome: athlete.cognome,
                ruolo: "UTENTE"
            }
        });

        if (authError) {
            if (authError.message.includes("already exists")) {
                console.log(`User ${athlete.email} already exists in auth. Skipping auth creation.`);
            } else {
                console.error(`Error creating auth user for ${athlete.email}:`, authError.message);
                continue;
            }
        }

        // Get the user from public.users (triggers usually create this, but we'll upsert to set the coachid)
        // First, let's find their ID if they already existed
        let userId = authData?.user?.id;
        if (!userId) {
            const { data: existingUser } = await supabase.from("users").select("id").eq("email", athlete.email).single();
            if (existingUser) userId = existingUser.id;
        }

        if (!userId) {
            // Fallback: manually generate a UUID just in case auth trigger failed
            userId = crypto.randomUUID();
        }

        // Upsert into public.users
        const { error: dbError } = await supabase.from("users").upsert({
            id: userId,
            email: athlete.email,
            nome: athlete.nome,
            cognome: athlete.cognome,
            ruolo: "UTENTE",
            coachid: coachId,
            createdat: new Date().toISOString()
        }, { onConflict: "id" });

        if (dbError) {
            console.error(`Failed to upsert public.user for ${athlete.email}:`, dbError.message);
            continue;
        }

        console.log(`Created/updated user ${userId} linked to coach ${coachId}`);

        // 3. Create mock workouts for this athlete
        const dateNow = Date.now();
        const workouts = [
            {
                userid: userId,
                tipo: "CORSA",
                dataora: new Date(dateNow - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                durata: 45,
                distanza: 8.5,
                calorie: 450,
                stato: "CONSOLIDATA",
                sorgente: "TRACKING",
                percezionessforzo: 7,
                note: "Ottimo passo costante"
            },
            {
                userid: userId,
                tipo: "PALESTRA",
                dataora: new Date(dateNow - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                durata: 60,
                calorie: 320,
                stato: "CONSOLIDATA",
                sorgente: "TRACKING",
                percezionessforzo: 8,
                note: "Scheda forza"
            },
            {
                userid: userId,
                tipo: "CICLISMO",
                dataora: new Date(dateNow + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day future
                durata: 120,
                distanza: 40,
                stato: "PIANIFICATA",
                sorgente: "TRACKING"
            }
        ];

        const { error: wError } = await supabase.from("workouts").insert(workouts);
        if (wError) {
            console.error(`Failed to insert workouts for ${athlete.email}:`, wError.message);
        } else {
            console.log(`Inserted ${workouts.length} mock workouts for ${athlete.email}`);
        }
    }

    console.log("\nFinished database population script.");
}

main().catch(console.error);
