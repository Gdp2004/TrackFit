// ============================================================
// GET    /api/admin/users           – Lista utenti (paginata + filtro ruolo)
// PATCH  /api/admin/users           – Cambia ruolo utente
// DELETE /api/admin/users?userid=xx – Elimina utente
// Protetto da middleware: solo ADMIN
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getUserService } from "@/backend/infrastructure/config/serviceFactory";
import { ok, paginated, fail } from "@/backend/infrastructure/http/apiResponse";

export const dynamic = "force-dynamic";
import {
    UnauthorizedError,
    ValidationError,
    NotFoundError,
} from "@/backend/domain/model/errors/AppError";
import { RuoloEnum } from "@/backend/domain/model/enums";

const CambiaRuoloSchema = z.object({
    userid: z.string().uuid(),
    ruolo: z.nativeEnum(RuoloEnum),
});

// GET /api/admin/users?ruolo=COACH&page=1&pageSize=20
export async function GET(req: NextRequest) {
    const ruoloParam = req.nextUrl.searchParams.get("ruolo") as RuoloEnum | null;
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") ?? "20")));

    try {
        const service = getUserService();
        const tutti = await service.getListaUtenti(ruoloParam ?? undefined);
        const total = tutti.length;
        const start = (page - 1) * pageSize;
        const slice = tutti.slice(start, start + pageSize);

        return paginated(slice, total, page, pageSize);
    } catch (err) {
        return fail(err);
    }
}

// PATCH /api/admin/users – { userid, ruolo }
export async function PATCH(req: NextRequest) {
    const adminId = req.headers.get("x-user-id");
    if (!adminId) return fail(new UnauthorizedError());

    try {
        const body = await req.json();
        const parsed = CambiaRuoloSchema.safeParse(body);
        if (!parsed.success) return fail(new ValidationError(JSON.stringify(parsed.error.flatten())));

        const service = getUserService();
        const aggiornato = await service.cambiaRuolo(parsed.data.userid, parsed.data.ruolo);
        return ok({ message: `Ruolo aggiornato a ${parsed.data.ruolo}`, user: aggiornato });
    } catch (err) {
        return fail(err);
    }
}

// DELETE /api/admin/users?userid=xxx
export async function DELETE(req: NextRequest) {
    const adminId = req.headers.get("x-user-id");
    if (!adminId) return fail(new UnauthorizedError());

    const userid = req.nextUrl.searchParams.get("userid");
    if (!userid) return fail(new NotFoundError("userid"));

    try {
        await getUserService().eliminaUtente(userid);
        return ok({ message: "Utente eliminato definitivamente." });
    } catch (err) {
        return fail(err);
    }
}
