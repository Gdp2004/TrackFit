// ============================================================
// API Route – /api/notifications
// GET  → lista notifiche non lette dell'utente corrente
// PATCH → marca una o tutte le notifiche come lette
// ============================================================

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { ok, fail } from "@/backend/infrastructure/http/apiResponse";

// GET /api/notifications?limit=20&lette=false
export async function GET(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) return ok([], 401);

    const params = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(params.get("limit") ?? "20", 10), 50);
    const soloNonLette = params.get("lette") !== "true";

    const supabase = createSupabaseServerClient();
    let query = supabase
        .from("notifications")
        .select("id, titolo, messaggio, tipo, letta, created_at, dati")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (soloNonLette) query = query.eq("letta", false);

    const { data, error } = await query;
    if (error) return fail(error);
    return ok(data ?? []);
}

// PATCH /api/notifications
// Body: { id?: string } → se id presente: marca quella; altrimenti tutte
export async function PATCH(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) return ok(null, 401);

    const body = await req.json().catch(() => ({}));
    const supabase = createSupabaseServerClient();

    let query = supabase
        .from("notifications")
        .update({ letta: true })
        .eq("user_id", userId);

    if (body.id) {
        query = query.eq("id", body.id);
    } else {
        query = query.eq("letta", false);
    }

    const { error } = await query;
    if (error) return fail(error);
    return ok({ ok: true });
}
