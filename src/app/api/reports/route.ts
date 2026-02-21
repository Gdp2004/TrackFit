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
  userId: z.string().uuid().optional(),
  coachId: z.string().uuid().optional(),
  strutturaId: z.string().uuid().optional(),
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
    const { tipo, userId, coachId, strutturaId, periodo } = parsed.data;
    let report;

    if (tipo === "UTENTE" && userId) report = await service.generaReportUtente(userId, periodo, tipo);
    else if (tipo === "COACH" && coachId) report = await service.generaReportCoach(coachId, periodo);
    else if (tipo === "GESTORE" && strutturaId) report = await service.generaReportGestore(strutturaId, periodo);
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