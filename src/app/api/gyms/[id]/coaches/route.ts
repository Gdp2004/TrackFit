// ============================================================
// GET /api/gyms/[id]/coaches – Coach della struttura
// Protetto da middleware: GESTORE | ADMIN
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";
import { CoachSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter";

function buildService() {
    return new CreateGymManagerService(
        new GymSupabaseAdapter(),
        new SubscriptionSupabaseAdapter(),
        new SupabaseRealtimeNotificationAdapter(),
        new AuditLogSupabaseAdapter(),
        new CoachSupabaseAdapter()
    );
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: strutturaid } = await params;
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const service = buildService();
        const coaches = await service.getCoachesStruttura(strutturaid);
        return NextResponse.json(coaches);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
