import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: strutturaid } = await params;

        if (!strutturaid) {
            return NextResponse.json({ error: "Missing gym ID" }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        const { data, error } = await supabase
            .from("abbonamenti")
            .select(`
                *,
                user:users!userid(id, nome, cognome, email)
            `)
            .order("datainizio", { ascending: false });

        if (error) {
            console.error("Error fetching abbonamenti:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch user data manually if the relation is also problematic, but users!userid should be fine based on schema.

        // Fetch all tipi_abbonamento for this gym
        const { data: tipi, error: tipiError } = await supabase
            .from("tipi_abbonamento")
            .select("id, nome, prezzo")
            .eq("strutturaid", strutturaid);

        if (tipiError) {
            console.error("Error fetching tipi abbonamento:", tipiError);
            return NextResponse.json({ error: tipiError.message }, { status: 500 });
        }

        // Create a map for fast lookup
        const tipiMap = new Map(tipi?.map(t => [t.id, t]) || []);

        // Filter and map abbonamenti to match the expected format
        const finalData = (data || [])
            .filter(a => tipiMap.has(a.tipoid)) // Only include abbonamenti for this specific gym (based on the tipo's strutturaid)
            .map(a => {
                const tipo = tipiMap.get(a.tipoid) || null;
                // If there is an explicit 'importo' on the abbonamento (from a discounted purchase), use it.
                // Otherwise fallback to the base price.
                const price = a.importo !== undefined && a.importo !== null ? Number(a.importo) : (tipo?.prezzo ? Number(tipo.prezzo) : 0);

                return {
                    ...a,
                    tipo: tipo ? { ...tipo, prezzo: price } : null
                };
            });

        return NextResponse.json({ data: finalData });
    } catch (err: unknown) {
        console.error("Unexpected error in GET /api/gyms/[id]/abbonamenti:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: strutturaid } = await params;
        const abbonamentoid = req.nextUrl.searchParams.get("abbonamentoid");

        if (!strutturaid || !abbonamentoid) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        // Ensure the abbonamento actually belongs to this gym's types to prevent unauthorized deletions
        const { data: abbData, error: abbError } = await supabase
            .from("abbonamenti")
            .select("tipoid")
            .eq("id", abbonamentoid)
            .single();

        if (abbError || !abbData) {
            return NextResponse.json({ error: "Abbonamento not found" }, { status: 404 });
        }

        const { data: tipoData, error: tipoError } = await supabase
            .from("tipi_abbonamento")
            .select("strutturaid")
            .eq("id", abbData.tipoid)
            .single();

        if (tipoError || !tipoData || tipoData.strutturaid !== strutturaid) {
            return NextResponse.json({ error: "Unauthorized or mismatch" }, { status: 403 });
        }

        const { error } = await supabase
            .from("abbonamenti")
            .delete()
            .eq("id", abbonamentoid);

        if (error) {
            console.error("Error deleting abbonamento:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("Unexpected error in DELETE /api/gyms/[id]/abbonamenti:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
