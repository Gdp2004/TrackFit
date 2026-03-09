// ============================================================
// GET /api/coaches/[id]/prenotazioni  – Lista sessioni del coach
// PUT /api/coaches/[id]/prenotazioni  – Modifica slot (R1 48h)
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

const ModificaSlotSchema = z.object({
    sessioneid: z.string().uuid(),
    nuovadataora: z.string().datetime(),
    motivazione: z.string().min(1),
});

const AnnullaSlotSchema = z.object({
    sessioneid: z.string().uuid(),
    motivazione: z.string().min(1),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: coachid } = await params;
    const requesterId = req.headers.get("x-user-id");
    if (!requesterId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const service = buildService();
        const prenotazioni = await service.getPrenotazioniCoach(coachid);
        return NextResponse.json(prenotazioni);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: coachid } = await params;
    const requesterId = req.headers.get("x-user-id");
    if (!requesterId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = ModificaSlotSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const service = buildService();
        await service.modificaPianoAtleta(
            coachid,
            parsed.data.sessioneid,
            new Date(parsed.data.nuovadataora),
            parsed.data.motivazione
        );
        return NextResponse.json({ message: "Sessione aggiornata." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: coachid } = await params;
    const requesterId = req.headers.get("x-user-id");
    if (!requesterId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const sessioneid = searchParams.get("sessioneid");
        const motivazione = searchParams.get("motivazione");

        const parsed = AnnullaSlotSchema.safeParse({ sessioneid, motivazione });
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const service = buildService();
        await service.annullaSessione(
            coachid,
            parsed.data.sessioneid,
            parsed.data.motivazione
        );
        return NextResponse.json({ message: "Sessione annullata." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}
