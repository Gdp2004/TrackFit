import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export async function GET(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const supabase = createSupabaseServerClient();

        // 1. Trova l'id del coach associato all'utente
        const { data: coach, error: coachError } = await supabase
            .from("coaches")
            .select("id")
            .eq("userid", userid)
            .single();

        if (coachError || !coach) {
            return NextResponse.json({ error: "Profilo coach non trovato." }, { status: 404 });
        }

        // 2. Prendi le recensioni con i dati dell'utente che l'ha lasciata
        const { data: reviews, error: reviewsError } = await supabase
            .from("recensioni")
            .select(`
                id,
                voto,
                commento,
                createdat,
                risposta,
                rispostadat,
                users (
                    id,
                    nome,
                    cognome
                )
            `)
            .eq("coachid", coach.id)
            .order("createdat", { ascending: false });

        if (reviewsError) throw new Error(reviewsError.message);

        return NextResponse.json({ data: reviews });
    } catch (err: any) {
        console.error("[Get Coach Reviews Error]:", err);
        return NextResponse.json({ error: err.message || "Errore interno." }, { status: 500 });
    }
}
