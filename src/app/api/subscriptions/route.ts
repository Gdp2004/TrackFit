// ============================================================
// POST /api/subscriptions  – Acquisto abbonamento (FR20, R4, R6, R10)
// GET  /api/subscriptions  – Abbonamento attivo (FR22)
// PUT  /api/subscriptions/rinnovo – Toggle rinnovo automatico (FR21)
// POST /api/subscriptions/validate – Tessera digitale (FR23)
// POST /api/subscriptions/cancel  – Cancella abbonamento
// GET  /api/subscriptions/payments – Storico pagamenti (FR22)
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

const AcquistaSchema = z.object({
  userid: z.string().uuid(),
  tipoid: z.string().uuid(),
  strutturaid: z.string().uuid(),
  couponCode: z.string().optional(),
});

const ValidaAccessoSchema = z.object({
  qrcode: z.string().uuid(),
  strutturaid: z.string().uuid(),
});

const RinnovoSchema = z.object({
  abbonamentoid: z.string().uuid(),
  userid: z.string().uuid(),
  attivo: z.boolean(),
});

// POST /api/subscriptions – Acquisto (FR20)
export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // POST /api/subscriptions/validate – tessera digitale (FR23)
  if (path.endsWith("/validate")) {
    try {
      const body = await req.json();
      const parsed = ValidaAccessoSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      const service = buildService();
      const valido = await service.validaAccesso(parsed.data.qrcode, parsed.data.strutturaid);
      return NextResponse.json({ valido });
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // POST /api/subscriptions/cancel – Cancellazione
  if (path.endsWith("/cancel")) {
    try {
      const body = await req.json();
      const parsed = z.object({ abbonamentoid: z.string().uuid() }).safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      const service = buildService();
      await service.cancellaAbbonamento(parsed.data.abbonamentoid);
      return NextResponse.json({ message: "Abbonamento cancellato." });
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 400 });
    }
  }

  // POST /api/subscriptions – Acquisto principale
  try {
    const body = await req.json();
    const parsed = AcquistaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const service = buildService();
    const abbonamento = await service.acquistaAbbonamento(
      parsed.data.userid,
      parsed.data.tipoid,
      parsed.data.couponCode
    );
    // Restituisce clientSecret per completare 3-D Secure (R6) lato client
    return NextResponse.json(abbonamento, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

// GET /api/subscriptions?userid=xxx – Abbonamento attivo (FR22)
export async function GET(req: NextRequest) {
  const userid = req.nextUrl.searchParams.get("userid");
  if (!userid) return NextResponse.json({ error: "userid obbligatorio" }, { status: 400 });
  try {
    const service = buildService();
    const abbonamento = await service.getAbbonamento(userid);
    return NextResponse.json(abbonamento ?? null);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/subscriptions – Toggle rinnovo automatico (FR21)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RinnovoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const service = buildService();
    const aggiornato = await service.impostaRinnovoAutomatico(
      parsed.data.abbonamentoid,
      parsed.data.userid,
      parsed.data.attivo
    );
    return NextResponse.json(aggiornato);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}