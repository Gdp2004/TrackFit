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
    eta: z.number().int().positive().optional(),           // Not in DB yet
    obiettivo: z.string().optional(),                      // Not in DB yet
    datanascita: z.string().optional(),                     // ISO date
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

        // Filtra solo campi esistenti in DB
        const { eta, obiettivo, ...validFields } = parsed.data;
        const finalData = Object.fromEntries(Object.entries(validFields).filter(([, v]) => v !== undefined));

        const service = getUserService();
        let user;

        if (finalData.peso !== undefined || finalData.altezza !== undefined) {
            const current = await service.getUtente(userid);
            user = await service.aggiornaParametriFisici(
                userid,
                (finalData.peso as number) ?? current.peso ?? 0,
                (finalData.altezza as number) ?? current.altezza ?? 0
            );
            // Aggiorna gli altri campi (nome, cognome, datanascita)
            const { peso, altezza, ...others } = finalData;
            if (Object.keys(others).length > 0) {
                user = await service.aggiornaUtente(userid, others);
            }
        } else {
            user = await service.aggiornaUtente(userid, finalData);
        }

        return ok(user);
    } catch (err) {
        return fail(err);
    }
}
