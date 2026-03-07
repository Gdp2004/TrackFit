
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrewnuaguybqqmzhvffz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZXdudWFndXlicXFtemh2ZmZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE3OTAwNCwiZXhwIjoyMDU2NzU1MDA0fQ.z-7-M-N-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-I-Z-i-A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data: structures, error: sError } = await supabase.from('strutture').select('id, denominazione');
        if (sError) throw sError;
        console.log('Structures found:', structures.length);

        if (structures.length > 0) {
            const sid = structures[0].id;
            console.log('Checking structure:', structures[0].denominazione, sid);

            const [subs, courses, bks, payments] = await Promise.all([
                supabase.from('abbonamenti').select('*', { count: 'exact', head: true }).eq('strutturaid', sid),
                supabase.from('corsi').select('*', { count: 'exact', head: true }).eq('strutturaid', sid),
                supabase.from('prenotazioni').select('*', { count: 'exact', head: true }).eq('strutturaid', sid),
                supabase.from('pagamenti').select('stato').eq('abbonamentoid', sid) // This is wrong sid is structureid not abbonamentoid. correcting below
            ]);

            // Re-fetch all pagamenti for the structure
            const { data: allSubs } = await supabase.from('abbonamenti').select('id').eq('strutturaid', sid);
            const subIds = allSubs.map(s => s.id);

            const { data: allPays } = await supabase.from('pagamenti').select('stato, importo').in('abbonamentoid', subIds);

            console.log('--- DATA FOR STRUCTURE ---');
            console.log('Active Subs (Total):', subs.count);
            console.log('Courses (Total):', courses.count);
            console.log('Bookings (Total):', bks.count);
            console.log('Payments found:', allPays ? allPays.length : 0);
            if (allPays) {
                const groups = allPays.reduce((acc, p) => {
                    acc[p.stato] = (acc[p.stato] || 0) + 1;
                    return acc;
                }, {});
                console.log('Payment States:', groups);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
