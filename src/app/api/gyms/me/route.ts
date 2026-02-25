// ============================================================
// GET /api/gyms/me – Struttura gestita dal Gestore autenticato
// Protetto da middleware: solo GESTORE | ADMIN
// Header x-user-id iniettato dal middleware RBAC
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";

export async function GET(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) {
        return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
    }

    try {
        const supabase = createSupabaseServerClient();
        const userAdapter = new UserSupabaseAdapter();

        const [user, strutturaResult] = await Promise.all([
            userAdapter.findById(userid),
            supabase
                .from("strutture")
                .select("*")
                .eq("gestoreid", userid)
                .maybeSingle(),
        ]);

        if (strutturaResult.error) {
            throw new Error(strutturaResult.error.message);
        }

        return NextResponse.json({
            user,
            struttura: strutturaResult.data ?? null,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
