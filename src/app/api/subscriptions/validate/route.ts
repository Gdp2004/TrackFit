// ============================================================
// POST /api/subscriptions/validate – Valida tessera digitale QR (FR23)
// Usato dal reader del Gestore all'ingresso palestra
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

const ValidaSchema = z.object({
    qrcode: z.string().uuid(),
    strutturaid: z.string().uuid(),
});

export async function POST(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = ValidaSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const service = buildService();
        const valido = await service.validaAccesso(parsed.data.qrcode, parsed.data.strutturaid);

        return NextResponse.json({
            valido,
            message: valido
                ? "✅ Abbonamento valido — accesso consentito."
                : "❌ Abbonamento non valido o scaduto per questa struttura.",
            timestamp: new Date().toISOString(),
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}
