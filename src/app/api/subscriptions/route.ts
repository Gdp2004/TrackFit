import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateSubscriptionManagerService } from "@/backend/application/service/subscription/CreateSubscriptionManagerService";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { StripeAdapter } from "@/backend/infrastructure/adapter/out/external/StripeAdapter";

// Singleton-like factory (no IoC container)
function buildService() {
  const subRepo = new SubscriptionSupabaseAdapter();
  const paymentGateway = new StripeAdapter();
  return new CreateSubscriptionManagerService(subRepo, paymentGateway);
}

const AcquistaSchema = z.object({
  userId: z.string().uuid(),
  tipoId: z.string().uuid(),
  strutturaId: z.string().uuid(),
  couponCode: z.string().optional()
});

// POST /api/subscriptions - Acquista un abbonamento (UC8)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AcquistaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const service = buildService();
    // Since we are mocking payment/coupon here, price is mocked inside the service right now
    const abbonamento = await service.acquistaAbbonamento(
      parsed.data.userId,
      parsed.data.tipoId,
      parsed.data.couponCode
    );

    return NextResponse.json(abbonamento, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}