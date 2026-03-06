// ============================================================
// GET /api/subscriptions/payments?userid=xxx – Storico pagamenti (FR22)
// Visibile all'utente autenticato (i propri pagamenti) o admin
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export async function GET(req: NextRequest) {
    const callerUserId = req.headers.get("x-user-id");
    if (!callerUserId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    const userid = req.nextUrl.searchParams.get("userid") ?? callerUserId;

    try {
        const supabase = createSupabaseServerClient();

        const { data, error } = await supabase
            .from("pagamenti")
            .select(`
                id,
                importo,
                stato,
                metodo,
                createdat,
                abbonamento:abbonamentoid (
                    id,
                    datainizio,
                    datafine,
                    tipo:tipoid (nome, duratamesi)
                )
            `)
            .eq("userid", userid)
            .order("createdat", { ascending: false });

        if (error) throw new Error(error.message);

        return NextResponse.json({
            total: data?.length ?? 0,
            payments: data ?? [],
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
