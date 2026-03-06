import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";
import { getCoachService } from "@/backend/infrastructure/config/serviceFactory";

const PrenotaSchema = z.object({
  userid: z.string().uuid(),
  coachid: z.string().uuid(),
  dataora: z.string().datetime(),
});

// POST /api/coaches – prenota uno slot con il coach (UC7)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PrenotaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    if (new Date(parsed.data.dataora) <= new Date()) {
      return NextResponse.json({ error: "dataora deve essere futura" }, { status: 400 });
    }
    const service = getCoachService();
    const result = await service.prenotaSlotCoach(
      parsed.data.userid,
      parsed.data.coachid,
      new Date(parsed.data.dataora)
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/coaches?coachid=xxx – roster atleti del coach (UC6)
// GET /api/coaches – lista completa coach per utenti/guest
export async function GET(req: NextRequest) {
  try {
    const coachid = req.nextUrl.searchParams.get("coachid");

    if (coachid) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from("prenotazioni").select("*").eq("coachid", coachid);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    } else {
      const service = getCoachService();
      const coaches = await service.getTuttiCoachesWithDetails();
      return NextResponse.json({ success: true, data: coaches }, { status: 200 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}