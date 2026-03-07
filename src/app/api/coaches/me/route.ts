// ============================================================
// GET  /api/coaches/me – Profilo + Stats del Coach autenticato
// PUT  /api/coaches/me – Aggiorna specializzazione/bio/telefono
// Protetto da middleware: solo COACH | ADMIN
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateCoachManagerService } from "@/backend/application/service/coach/CreateCoachManagerService";
import { CoachSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter";
import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";

function buildService() {
    return new CreateCoachManagerService(
        new CoachSupabaseAdapter(),
        new UserSupabaseAdapter(),
        new SupabaseRealtimeNotificationAdapter(),
        new AuditLogSupabaseAdapter()
    );
}

const AggiornaProfiloSchema = z.object({
    specializzazione: z.string().min(1).optional(),
    bio: z.string().optional(),
    telefono: z.string().optional(),
    disponibilita: z.array(z.object({
        giornoSettimana: z.number().min(0).max(6),
        oraInizio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        oraFine: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    })).optional(),
});

export async function GET(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const service = buildService();
        const [coach, stats] = await Promise.all([
            service.getProfiloCoach(userid),
            service.getProfiloCoach(userid).then(c => c ? service.getCoachStats(c.id) : null),
        ]);

        if (!coach) return NextResponse.json({ error: "Profilo coach non trovato." }, { status: 404 });

        return NextResponse.json({ coach, stats });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = AggiornaProfiloSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const service = buildService();
        const coach = await service.getProfiloCoach(userid);
        if (!coach) return NextResponse.json({ error: "Coach non trovato." }, { status: 404 });

        const aggiornato = await service.aggiornaProfiloCoach(coach.id, parsed.data);
        return NextResponse.json(aggiornato);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
