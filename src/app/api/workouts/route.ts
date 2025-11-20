// ============================================================
// POST/GET /api/workouts
// Next.js 15 Route Handler (App Router) – port/in REST adapter
// Source: SDD section 3.2 – WorkoutManagement
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateWorkoutManagerService } from "@/backend/application/service/workout/CreateWorkoutManagerService";
import { WorkoutSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/WorkoutSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";

// Dependency injection (manual wiring – no IoC container)
function buildService() {
    const workoutRepo = new WorkoutSupabaseAdapter();
    const notificationService = new SupabaseRealtimeNotificationAdapter();
    return new CreateWorkoutManagerService(workoutRepo, notificationService);
}

// ─── Validation schema (Zod) ─────────────────────────────────────────────────
const PianificaSchema = z.object({
    userId: z.string().uuid(),
    tipo: z.string().min(1),
    dataOra: z.string().datetime(),           // ISO 8601
    durata: z.number().int().positive(),
    obiettivo: z.string().optional(),
});

// ─── POST /api/workouts ── pianifica sessione (UC3) ──────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PianificaSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const { userId, tipo, dataOra, durata, obiettivo } = parsed.data;
        const service = buildService();
        const workout = await service.pianificaSessione(
            userId, tipo, new Date(dataOra), durata, obiettivo
        );

        return NextResponse.json(workout, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Errore interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ─── GET /api/workouts?userId=xxx ── lista sessioni utente ───────────────────
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");
        if (!userId) {
            return NextResponse.json({ error: "userId obbligatorio" }, { status: 400 });
        }

        const service = buildService();
        const workouts = await service.getSessioniUtente(userId);

        return NextResponse.json(workouts);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Errore interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
