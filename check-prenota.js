require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrenotazioni() {
    console.log("Checking prenotazioni table...");
    const { count, error } = await supabase.from("prenotazioni").select("*", { count: "exact", head: true });
    if (error) {
        console.log("Error:", error);
        return;
    }
    console.log("Total prenotazioni in DB:", count);

    const { data } = await supabase.from("prenotazioni").select("*").limit(2);
    console.log("Sample:", data);
}

checkPrenotazioni();
