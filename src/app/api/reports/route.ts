import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ReportSchema = z.object({
  userId: z.string().uuid().optional(),
  periodo: z.string().min(1),
  tipo: z.enum(["UTENTE", "COACH", "GESTORE"]),
});

// POST /api/reports â€“ genera un report (UC11)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    // TODO: inject CreateReportManagerService
    return NextResponse.json({ message: "Report in generazione" }, { status: 202 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}