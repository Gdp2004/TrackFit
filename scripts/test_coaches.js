const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for checking truth

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE config");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("--- CONTROLLO DATABASE ---");

    // 1. Quanti utenti con ruolo COACH
    const { data: usersData, error: usersErr } = await supabaseAdmin.from('users').select('*').eq('ruolo', 'COACH');
    if (usersErr) console.error("Errore users:", usersErr);
    console.log(`Utenti con ruolo COACH in 'users': ${usersData ? usersData.length : 0}`);
    if (usersData) console.log(usersData.map(u => ({ id: u.id, email: u.email, nome: u.nome })));

    // 2. Quanti record nella tabella coaches
    const { data: coachesData, error: coachesErr } = await supabaseAdmin.from('coaches').select('*');
    if (coachesErr) console.error("Errore coaches:", coachesErr);
    console.log(`\nRecord in tabella 'coaches': ${coachesData ? coachesData.length : 0}`);
    if (coachesData) console.log(coachesData);

    // 3. Test JOIN come nel codice
    const { data: joinData, error: joinErr } = await supabaseAdmin.from('coaches').select('*, user:users!inner(*)');
    if (joinErr) console.error("Errore JOIN:", joinErr);
    console.log(`\nRisultato JOIN (quello che l'API dovrebbe restituire al max): ${joinData ? joinData.length : 0}`);

    console.log("\n--- CONTROLLO NEXT.JS API ---");
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/coaches',
        method: 'GET'
    };

    const req = http.request(options, res => {
        let responseData = '';
        console.log(`STATUS API: ${res.statusCode}`);
        res.on('data', d => { responseData += d; });
        res.on('end', () => {
            console.log("BODY REQ:", responseData);
        });
    });

    req.on('error', error => console.error(error));
    req.end();
}

main().catch(console.error);
