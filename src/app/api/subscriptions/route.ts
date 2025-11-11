import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";

const AcquistaSchema = z.object({
  userId: z.string().uuid(),
  tipoId: z.string().uuid(),
  couponCode: z.string().optional(),
});

// POST /api/subscriptions â€“ acquista un abbonamento (UC8)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AcquistaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    // TODO: integrate CreateSubscriptionManagerService
    return NextResponse.json({ message: "Abbonamento in lavorazione" }, { status: 202 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/subscriptions?userId=xxx â€“ stato abbonamento (UC8)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obbligatorio" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("abbonamenti").select("*").eq("userId", userId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}