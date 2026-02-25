// ============================================================
// GET /api/coaches/me – Profilo Coach autenticato
// Protetto da middleware: solo COACH | ADMIN
// Header x-user-id iniettato dal middleware RBAC
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { CoachSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter";
import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";

export async function GET(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) {
        return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
    }

    try {
        const coachAdapter = new CoachSupabaseAdapter();
        const userAdapter = new UserSupabaseAdapter();

        const [coach, user] = await Promise.all([
            coachAdapter.findByUserId(userid),
            userAdapter.findById(userid),
        ]);

        if (!coach) {
            return NextResponse.json({ error: "Profilo coach non trovato." }, { status: 404 });
        }

        return NextResponse.json({ coach, user });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
