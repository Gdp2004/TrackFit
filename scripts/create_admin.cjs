const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const matchUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const matchKey = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = matchUrl ? matchUrl[1].trim() : null;
const supabaseKey = matchKey ? matchKey[1].trim() : null;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const email = "admin2@trackfit.local";
    const password = "adminPassword123!";
    const nome = "Super";
    const cognome = "Admin";
    const ruolo = "ADMIN";

    console.log(`Creazione utente admin: ${email}...`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            nome: nome,
            cognome: cognome,
            ruolo: ruolo
        }
    });

    let userId;
    if (authError) {
        console.error("Errore auth:", authError);
    } else {
        userId = authData.user.id;
        console.log("Utente creato con ID:", userId);
        const { error: dbError } = await supabase.from("users").upsert({
            id: userId,
            email: email,
            nome: nome,
            cognome: cognome,
            ruolo: ruolo
        }, { onConflict: "id" });
        if (dbError) {
            console.error("Errore nell'aggiornamento della tabella users:", dbError);
        } else {
            console.log("Utente creato con SUCCESSO!");
        }
    }
}
main();
