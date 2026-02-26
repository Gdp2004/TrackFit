// ============================================================
// GET  /api/users/me  – Profilo utente autenticato
// PUT  /api/users/me  – Aggiorna nome/cognome/bio/parametri fisici
// Accessibile a tutti i ruoli autenticati
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getUserService } from "@/backend/infrastructure/config/serviceFactory";
import { ok, fail } from "@/backend/infrastructure/http/apiResponse";
import { UnauthorizedError, ValidationError } from "@/backend/domain/model/errors/AppError";

const AggiornaUtenteSchema = z.object({
    nome: z.string().min(1).optional(),
    cognome: z.string().min(1).optional(),
    peso: z.number().positive().optional(),
    altezza: z.number().positive().optional(),
    eta: z.number().int().positive().optional(),
    obiettivo: z.string().optional(),
});

export async function GET(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return fail(new UnauthorizedError());

    try {
        const user = await getUserService().getUtente(userid);
        return ok(user);
    } catch (err) {
        return fail(err);
    }
}

export async function PUT(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return fail(new UnauthorizedError());

    try {
        const body = await req.json();
        const parsed = AggiornaUtenteSchema.safeParse(body);
        if (!parsed.success) return fail(new ValidationError(JSON.stringify(parsed.error.flatten())));

        const service = getUserService();
        let user;

        if (parsed.data.peso !== undefined || parsed.data.altezza !== undefined) {
            const current = await service.getUtente(userid);
            user = await service.aggiornaParametriFisici(
                userid,
                parsed.data.peso ?? current.peso ?? 0,
                parsed.data.altezza ?? current.altezza ?? 0
            );
            const rest = { nome: parsed.data.nome, cognome: parsed.data.cognome, obiettivo: parsed.data.obiettivo };
            const extraFields = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
            if (Object.keys(extraFields).length > 0) {
                user = await service.aggiornaUtente(userid, extraFields);
            }
        } else {
            user = await service.aggiornaUtente(userid, parsed.data);
        }

        return ok(user);
    } catch (err) {
        return fail(err);
    }
}
