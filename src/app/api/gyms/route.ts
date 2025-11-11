import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";

const CreaStrutturaSchema = z.object({
  piva: z.string().min(11).max(11),
  cun: z.string().min(1),
  denominazione: z.string().min(1),
  indirizzo: z.string().min(1),
  gestoreId: z.string().uuid(),
});

// POST /api/gyms â€“ crea struttura palestra (UC2)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreaStrutturaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    // TODO: inject CreateGymManagerService (check unicita P.IVA/CUN + fuzzy anti-duplicato)
    return NextResponse.json({ message: "Struttura in creazione" }, { status: 202 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/gyms?gestoreId=xxx â€“ strutture del gestore (UC2)
export async function GET(req: NextRequest) {
  const gestoreId = req.nextUrl.searchParams.get("gestoreId");
  if (!gestoreId) return NextResponse.json({ error: "gestoreId obbligatorio" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("strutture").select("*").eq("gestoreId", gestoreId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}