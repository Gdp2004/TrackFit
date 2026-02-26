// ============================================================
// GET /api/coaches/[id]/atleti – Lista atleti del coach
// Protetto da middleware: solo COACH | ADMIN
// ============================================================

import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: coachid } = await params;
    const requesterId = req.headers.get("x-user-id");
    if (!requesterId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const service = buildService();
        const atleti = await service.getRosterAtleti(coachid);
        return NextResponse.json(atleti);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
