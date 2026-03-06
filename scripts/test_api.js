const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE config");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Effettuo login come admin...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@trackfit.local',
        password: 'adminPassword123!'
    });

    if (error) {
        console.error("Login fallito:", error);
        return;
    }

    const token = data.session.access_token;
    const adminId = data.session.user.id;
    console.log("Token ottenuto, effettuo richiesta all'API...");

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/users?pageSize=50',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${token}`
        }
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
