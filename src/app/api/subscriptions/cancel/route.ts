// ============================================================
// POST /api/subscriptions/cancel – Cancella abbonamento attivo
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateSubscriptionManagerService } from "@/backend/application/service/subscription/CreateSubscriptionManagerService";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { StripeAdapter } from "@/backend/infrastructure/adapter/out/external/StripeAdapter";
import { PaymentSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/PaymentSupabaseAdapter";
import { CouponSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CouponSupabaseAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";

function buildService() {
    return new CreateSubscriptionManagerService(
        new SubscriptionSupabaseAdapter(),
        new StripeAdapter(),
        new PaymentSupabaseAdapter(),
        new CouponSupabaseAdapter(),
        new AuditLogSupabaseAdapter()
    );
}

const CancelSchema = z.object({ abbonamentoid: z.string().uuid() });

export async function POST(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = CancelSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const service = buildService();
        await service.cancellaAbbonamento(parsed.data.abbonamentoid);

        return NextResponse.json({ message: "Abbonamento cancellato con successo." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}
