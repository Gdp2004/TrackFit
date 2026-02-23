import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateCoachManagerService } from "@/backend/application/service/coach/CreateCoachManagerService";
import { CoachSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter";
import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";

function buildService() {
    const coachRepo = new CoachSupabaseAdapter();
    const userRepo = new UserSupabaseAdapter();
    const notificationService = new SupabaseRealtimeNotificationAdapter();
    const auditRepo = new AuditLogSupabaseAdapter();
    return new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo);
}

const PrenotaSchema = z.object({
    userid: z.string().uuid(),
    coachid: z.string().uuid(),
    dataora: z.string().datetime(), // ISO string
});

const ModificaSchema = z.object({
    coachid: z.string().uuid(),
    atletaId: z.string().uuid(),
    sessioneid: z.string().uuid(),
    nuovadataora: z.string().datetime(),
    motivazione: z.string().min(1)
});

// POST /api/coaches/prenotazioni - Prenota uno slot (UC7)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PrenotaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const service = buildService();
        const prenotazione = await service.prenotaSlotCoach(
            parsed.data.userid,
            parsed.data.coachid,
            new Date(parsed.data.dataora)
        );

        return NextResponse.json(prenotazione, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/coaches/prenotazioni (UC6 validation - R1)
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = ModificaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const service = buildService();
        await service.modificaPianoAtleta(
            parsed.data.coachid,
            parsed.data.sessioneid,
            new Date(parsed.data.nuovadataora),
            parsed.data.motivazione
        );

        return NextResponse.json({ message: "Piano modificato con successo" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
