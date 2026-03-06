import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { z } from "zod";

const RispostaSchema = z.object({
    risposta: z.string().min(1).max(1000),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const { id: recensioneId } = await params;
        const body = await req.json();
        const parsed = RispostaSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Dati non validi.", details: parsed.error.format() }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        // 1. Trova l'id del coach
        const { data: coach, error: coachError } = await supabase
            .from("coaches")
            .select("id")
            .eq("userid", userid)
            .single();

        if (coachError || !coach) {
            return NextResponse.json({ error: "Profilo coach non trovato." }, { status: 404 });
        }

        // 2. Verifica che la recensione appartenga al coach
        const { data: recensione, error: recError } = await supabase
            .from("recensioni")
            .select("coachid, id")
            .eq("id", recensioneId)
            .single();

        if (recError || !recensione) {
            return NextResponse.json({ error: "Recensione non trovata." }, { status: 404 });
        }

        if (recensione.coachid !== coach.id) {
            return NextResponse.json({ error: "Non autorizzato a rispondere a questa recensione." }, { status: 403 });
        }

        // 3. Aggiorna la recensione con la risposta e la data
        const { error: updateError } = await supabase
            .from("recensioni")
            .update({
                risposta: parsed.data.risposta,
                rispostadat: new Date().toISOString()
            })
            .eq("id", recensioneId);

        if (updateError) throw new Error(updateError.message);

        return NextResponse.json({ success: true, message: "Risposta salvata con successo." });
    } catch (err: any) {
        console.error("[Reply to Review Error]:", err);
        return NextResponse.json({ error: err.message || "Errore interno." }, { status: 500 });
    }
}
