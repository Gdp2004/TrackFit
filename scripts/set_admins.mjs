import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        const { error: updateError } = await supabase.auth.admin.updateUserById(u.id, {
            user_metadata: { ...u.user_metadata, ruolo: 'ADMIN' }
        });
        if (updateError) {
            console.error(`Failed to update Auth for ${u.email}:`, updateError);
        }

        const { error: dbError } = await supabase.from('users').update({ ruolo: 'ADMIN' }).eq('id', u.id);
        if (dbError) {
            console.error(`Failed to update public.users for ${u.email}:`, dbError);
        }
    }
    console.log("All existing users have been elevated to ADMIN.");
}

run();
