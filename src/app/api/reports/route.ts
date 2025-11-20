import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateReportManagerService } from "@/backend/application/service/report/CreateReportManagerService";
import { ReportSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/ReportSupabaseAdapter";

function buildService() {
  const reportRepo = new ReportSupabaseAdapter();
  return new CreateReportManagerService(reportRepo);
}

const GeneraReportSchema = z.object({
  userId: z.string().uuid().optional(),
  strutturaId: z.string().uuid().optional(),
  periodo: z.string().min(1),
  tipo: z.enum(["UTENTE", "COACH", "GESTORE"]),
});

// POST /api/reports - Genera un nuovo report (UC11)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GeneraReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const service = buildService();
    let report;

    if (parsed.data.tipo === "UTENTE" && parsed.data.userId) {
      report = await service.generaReportUtente(parsed.data.userId, parsed.data.periodo, "UTENTE");
    } else if (parsed.data.tipo === "GESTORE" && parsed.data.strutturaId) {
      report = await service.generaReportGestore(parsed.data.strutturaId, parsed.data.periodo);
    } else {
      return NextResponse.json({ error: "Parametri incompleti per il tipo di report" }, { status: 400 });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}