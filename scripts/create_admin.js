const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment");
    process.exit(1);
}

// Inizializza il client con la service role key per bypassare RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const email = "admin@trackfit.local";
    const password = "adminPassword123!";
    const nome = "Super";
    const cognome = "Admin";
    const ruolo = "ADMIN";

    console.log(`Creazione utente admin: ${email}...`);

    // 1. Crea l'utente nel sistema Auth di Supabase
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
        if (authError.message.includes("already exists")) {
            console.log(`L'utente ${email} esiste già. Lo promuovo ad ADMIN.`);
            // Recupero l'ID dell'utente esistente
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const existingUser = usersData?.users.find(u => u.email === email);
            if (existingUser) {
                userId = existingUser.id;
                // Aggiorna i metadati
                await supabase.auth.admin.updateUserById(userId, {
                    user_metadata: { nome, cognome, ruolo }
                });
            }
        } else {
            console.error(`Errore durante la creazione Auth:`, authError.message);
            process.exit(1);
        }
    } else {
        userId = authData.user.id;
    }

    if (!userId) {
        console.error("Impossibile determinare l'ID utente.");
        process.exit(1);
    }

    // 2. Assicurati che il record esista anche nella tabella pubblica "users" con ruolo ADMIN
    const { error: dbError } = await supabase.from("users").upsert({
        id: userId,
        email: email,
        nome: nome,
        cognome: cognome,
        ruolo: ruolo
    }, { onConflict: "id" });

    if (dbError) {
        console.error(`Errore nell'aggiornamento della tabella users:`, dbError.message);
    } else {
        console.log(`\nSUCCESSO!`);
        console.log(`L'utente amministratore è pronto per l'accesso.`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

main().catch(console.error);
