import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { z } from "zod";

const ReviewSchema = z.object({
    coachId: z.string().uuid().optional(),
    strutturaId: z.string().uuid().optional(),
    voto: z.number().int().min(1).max(5),
    commento: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
        return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = ReviewSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Dati non validi.", details: parsed.error.format() }, { status: 400 });
        }

        const { coachId, strutturaId, voto, commento } = parsed.data;

        if (!coachId && !strutturaId) {
            return NextResponse.json({ error: "Specificare almeno un coach o una struttura." }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        // Salva la recensione
        const { error: dbError } = await supabase
            .from("recensioni")
            .insert({
                userid: userId,
                coachid: coachId,
                strutturaid: strutturaId,
                voto,
                commento
            });

        if (dbError) throw new Error(dbError.message);

        // Se è una recensione per un coach, aggiorniamo il suo rating medio
        if (coachId) {
            const { data: reviews, error: avgError } = await supabase
                .from("recensioni")
                .select("voto")
                .eq("coachid", coachId);

            if (!avgError && reviews && reviews.length > 0) {
                const totalVoti = reviews.reduce((acc, curr) => acc + curr.voto, 0);
                const avgRating = totalVoti / reviews.length;

                await supabase
                    .from("coaches")
                    .update({ rating: avgRating })
                    .eq("id", coachId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Review API Error]:", err);
        return NextResponse.json({ error: err.message || "Errore interno." }, { status: 500 });
    }
}
