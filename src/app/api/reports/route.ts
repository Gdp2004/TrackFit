// ============================================================
// POST/GET /api/reports – Report generazione (FR12, FR13, FR14, FR15)
// GET  /api/reports/export – Esportazione CSV (FR28)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateReportManagerService } from "@/backend/application/service/report/CreateReportManagerService";
import { ReportSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/ReportSupabaseAdapter";
import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";

function buildService() {
  return new CreateReportManagerService(
    new ReportSupabaseAdapter(),
    new UserSupabaseAdapter()
  );
}

const GeneraReportSchema = z.object({
  userid: z.string().uuid().optional(),
  coachid: z.string().uuid().optional(),
  strutturaid: z.string().uuid().optional(),
  periodo: z.string().min(1),
  tipo: z.enum(["UTENTE", "COACH", "GESTORE", "ADMIN"]),
  formato: z.enum(["PDF", "CSV"]).optional().default("PDF"),
});

// POST /api/reports – Genera report (FR12–FR15)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GeneraReportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const service = buildService();
    const { tipo, userid, coachid, strutturaid, periodo } = parsed.data;
    let report;

    if (tipo === "UTENTE" && userid) report = await service.generaReportUtente(userid, periodo, tipo);
    else if (tipo === "COACH" && coachid) report = await service.generaReportCoach(coachid, periodo);
    else if (tipo === "GESTORE" && strutturaid) report = await service.generaReportGestore(strutturaid, periodo);
    else if (tipo === "ADMIN") report = await service.generaReportAdmin(periodo);
    else return NextResponse.json({ error: "Parametri incompleti per il tipo di report." }, { status: 400 });

    // FR28: Se formato=CSV restituisce file scaricabile
    if (parsed.data.formato === "CSV") {
      const csv = service.exportCSV(report);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="report-${tipo}-${periodo}.csv"`,
        },
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}