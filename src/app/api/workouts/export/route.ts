import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateWorkoutManagerService } from "@/backend/application/service/workout/CreateWorkoutManagerService";
import { WorkoutSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/WorkoutSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";

function buildService() {
    const workoutRepo = new WorkoutSupabaseAdapter();
    const notificationService = new SupabaseRealtimeNotificationAdapter();
    return new CreateWorkoutManagerService(workoutRepo, notificationService);
}

const ExportSchema = z.object({
    workoutid: z.string().uuid(),
    piattaformaDestinazione: z.enum(["STRAVA", "APPLE_HEALTH", "GOOGLE_FIT"])
});

// POST /api/workouts/export - UC10: Esportazione Dati (OAuth Mock)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = ExportSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const { workoutid, piattaformaDestinazione } = parsed.data;
        const service = buildService();

        // 1. Fetch workout data
        // For UC10, we usually need a method `getWorkoutById`, let's mock the DB retrieval for the demo:
        // In a real scenario, this is an adapter call `const workout = await workoutRepo.findById(workoutid)`

        // 2. Format the data into an interchange format (e.g. JSON/GPX representation)
        const formatDataForOAuth = {
            id: workoutid,
            origin: "TrackFit App",
            exportDate: new Date().toISOString(),
            metrics: {
                distanceKm: 5.2, // mock data
                durationMin: 30, // mock data
                averageHeartRate: 145 // mock data
            }
        };

        // 3. Simulate OAuth dispatch
        // Here we'd normally redirect to or call `https://www.strava.com/oauth/token` and push data
        console.log(`[UC10] OAuth Dispatch to ${piattaformaDestinazione}:`, formatDataForOAuth);

        // 4. Return success to the client
        return NextResponse.json({
            message: `Workout esportato con successo verso ${piattaformaDestinazione} tramite OAuth (Simulato).`,
            exportedDataSnippet: formatDataForOAuth
        }, { status: 200 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Errore interno durante l'esportazione";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
