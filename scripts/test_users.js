const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("MOCK API CALL TEST");
    console.log("------------------");

    // 1. Prova a contare tutti gli utenti
    const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

    console.log(`Risultato di countAll(): ${count} utenti (Errore: ${countError?.message || 'Nessuno'})`);

    // 2. Prova a prenderli tutti senza filtri di ruolo
    console.log("\nEseguo query findAll()...");
    const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("*")
        .order("createdat", { ascending: false });

    if (allUsersError) {
        console.error("Errore fetch all users:", allUsersError);
    } else {
        console.log(`Trovati ${allUsers?.length || 0} utenti.`);
        console.log(allUsers);
    }

    // 3. Vediamo anche Auth Users per completezza
    console.log("\nUtenti presenti in supabase.auth:");
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    console.log(`Trovati ${authUsers?.users.length || 0} utenti auth.`);
}

main().catch(console.error);
