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
    userid: z.string().uuid(),
    tipo: z.string().min(1),
    dataora: z.string().datetime(),           // ISO 8601
    durata: z.number().int().positive(),
    obiettivo: z.string().optional(),
});

const TerminaSchema = z.object({
    workoutId: z.string().uuid(),
    action: z.enum(["termina", "sincronizza"]),
    percezione: z.number().int().min(1).max(10).optional(),  // RPE 1-10
    note: z.string().optional(),
});

// ─── POST /api/workouts ── pianifica sessione (UC3) ──────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PianificaSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const { userid, tipo, dataora, durata, obiettivo } = parsed.data;
        const service = buildService();
        const workout = await service.pianificaSessione(
            userid, tipo, new Date(dataora), durata, obiettivo
        );

        return NextResponse.json(workout, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Errore interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ─── GET /api/workouts?userid=xxx&coachid=yyy ── lista sessioni utente o coach ──
export async function GET(req: NextRequest) {
    try {
        const userid = req.nextUrl.searchParams.get("userid");
        const coachid = req.nextUrl.searchParams.get("coachid");

        if (!userid && !coachid) {
            return NextResponse.json({ error: "userid o coachid obbligatorio" }, { status: 400 });
        }

        const service = buildService();
        let workouts;

        if (coachid) {
            workouts = await service.getSessioniCoach(coachid);
        } else if (userid) {
            workouts = await service.getSessioniUtente(userid);
        }

        return NextResponse.json(workouts);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Errore interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ─── PUT /api/workouts ── termina/sincronizza sessione ────────────────────────
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = TerminaSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const { workoutId, action, percezione, note } = parsed.data;
        const service = buildService();

        if (action === "termina") {
            // UC4 – Termina sessione e salva percezione/note
            const workout = await service.terminaSessione(workoutId, percezione, note);
            return NextResponse.json(workout);
        } else {
            // UC5 – Sincronizza sessione salvata in locale verso Supabase
            await service.sincronizzaSessione(workoutId);
            return NextResponse.json({ message: "Sessione sincronizzata con il server." });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Errore interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
