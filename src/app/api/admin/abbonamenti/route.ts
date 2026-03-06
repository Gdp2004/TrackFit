import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const pageSize = 10;

        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const supabase = createSupabaseServerClient();

        // Fetch abbonamenti and join users
        const { data: abbonamenti, count, error } = await supabase
            .from("abbonamenti")
            .select(`
                *,
                user:users!userid (id, nome, cognome, email)
            `, { count: "exact" })
            .range(start, end)
            .order("datainizio", { ascending: false });

        if (error) {
            console.error("Error fetching admin abbonamenti:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch tipi_abbonamento separately according to our previous workaround
        const tipiIds = [...new Set((abbonamenti || []).map(a => a.tipoid).filter(Boolean))];

        let tipiMap = new Map();
        if (tipiIds.length > 0) {
            const { data: tipi, error: tipiError } = await supabase
                .from("tipi_abbonamento")
                .select("id, nome, prezzo, strutturaid")
                .in("id", tipiIds);

            if (!tipiError && tipi) {
                // Fetch struttre to get the name
                const strIds = [...new Set(tipi.map(t => t.strutturaid))];
                let strMap = new Map();
                if (strIds.length > 0) {
                    const { data: strutture } = await supabase
                        .from("strutture")
                        .select("id, denominazione")
                        .in("id", strIds);
                    strMap = new Map(strutture?.map(s => [s.id, s.denominazione]) || []);
                }

                tipiMap = new Map(tipi.map(t => [t.id, { ...t, struttura_nome: strMap.get(t.strutturaid) || "Sconosciuta" }]));
            }
        }

        // Merge data
        const finalData = (abbonamenti || []).map(a => ({
            ...a,
            tipo: tipiMap.get(a.tipoid) || null
        }));

        return NextResponse.json({
            data: finalData,
            meta: {
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            }
        });
    } catch (err: unknown) {
        console.error("Unexpected error in GET /api/admin/abbonamenti:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
