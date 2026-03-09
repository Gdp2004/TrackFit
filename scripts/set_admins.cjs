const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const matchUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const matchKey = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = matchUrl ? matchUrl[1].trim() : null;
const supabaseKey = matchKey ? matchKey[1].trim() : null;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in `.env.local`");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching users...");
    const { data: usersData, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    if (!usersData || usersData.users.length === 0) {
        console.log("No users found in Supabase Auth.");
        return;
    }

    for (const u of usersData.users) {
        console.log(`Elevating ${u.email} to ADMIN...`);

        let meta = u.user_metadata || {};
        meta.ruolo = 'ADMIN';

        const { error: updateError } = await supabase.auth.admin.updateUserById(u.id, {
            user_metadata: meta
        });

        if (updateError) {
            console.error(`Failed to update Auth for ${u.email}:`, updateError.message);
        }

        const { error: dbError } = await supabase.from('users').update({ ruolo: 'ADMIN' }).eq('id', u.id);
        if (dbError) {
            console.error(`Failed to update public.users for ${u.email}:`, dbError.message);
        }
    }
    console.log("All existing users have been elevated to ADMIN.");
}

run();
