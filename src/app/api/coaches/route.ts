import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";

const PrenotaSchema = z.object({
  userid: z.string().uuid(),
  coachid: z.string().uuid(),
  dataora: z.string().datetime(),
});

// POST /api/coaches â€“ prenota uno slot con il coach (UC7)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PrenotaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    if (new Date(parsed.data.dataora) <= new Date()) {
      return NextResponse.json({ error: "dataora deve essere futura" }, { status: 400 });
    }
    // TODO: inject CreateCoachManagerService
    return NextResponse.json({ message: "Prenotazione coach in lavorazione" }, { status: 202 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/coaches?coachid=xxx â€“ roster atleti del coach (UC6)
export async function GET(req: NextRequest) {
  const coachid = req.nextUrl.searchParams.get("coachid");
  if (!coachid) return NextResponse.json({ error: "coachid obbligatorio" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("prenotazioni").select("*").eq("coachid", coachid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}