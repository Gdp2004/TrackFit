// ============================================================
// POST/GET /api/gyms  – Struttura (FR5 Admin) + Corso (FR6)
// DELETE /api/gyms/corsi/[id] – Cancella corso (FR26)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";

function buildService() {
    return new CreateGymManagerService(
        new GymSupabaseAdapter(),
        new SubscriptionSupabaseAdapter(),
        new SupabaseRealtimeNotificationAdapter(),
        new AuditLogSupabaseAdapter()
    );
}

const CreaStrutturaSchema = z.object({
    piva: z.string().length(11),
    cun: z.string().min(1),
    denominazione: z.string().min(1),
    indirizzo: z.string().min(1),
    gestoreId: z.string().uuid(),
});

const CreaCorsoSchema = z.object({
    strutturaId: z.string().uuid(),
    nome: z.string().min(1),
    descrizione: z.string().optional(),
    dataOra: z.string().datetime(),
    capacitaMassima: z.number().int().positive(),
    durata: z.number().int().positive(),
    coachId: z.string().uuid().optional(),
});

// POST /api/gyms – Crea Struttura (FR5, ADMIN only – guard in middleware)
//               – oppure Crea Corso (FR6, GESTORE only) se action=corso
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const action = req.nextUrl.searchParams.get("action");
        const service = buildService();

        if (action === "corso") {
            // ─── FR6: Crea corso ──────────────────────────────────────────────
            const parsed = CreaCorsoSchema.safeParse(body);
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
            const corso = await service.creaCorso({
                strutturaId: parsed.data.strutturaId,
                nome: parsed.data.nome,
                dataOra: parsed.data.dataOra,
                capacitaMassima: parsed.data.capacitaMassima,
                durata: parsed.data.durata,
                coachId: parsed.data.coachId,
            });
            return NextResponse.json(corso, { status: 201 });
        }

        // ─── FR5: Crea struttura ──────────────────────────────────────────────
        const parsed = CreaStrutturaSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const struttura = await service.creaStruttura(
            parsed.data.piva,
            parsed.data.cun,
            parsed.data.denominazione,
            parsed.data.indirizzo,
            parsed.data.gestoreId
        );
        return NextResponse.json(struttura, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}

// GET /api/gyms?strutturaId=xxx – Lista corsi (FR6)
export async function GET(req: NextRequest) {
    const strutturaId = req.nextUrl.searchParams.get("strutturaId");
    if (!strutturaId) return NextResponse.json({ error: "strutturaId obbligatorio" }, { status: 400 });
    try {
        const service = buildService();
        const corsi = await service.getCorsiStruttura(strutturaId);
        return NextResponse.json(corsi);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// DELETE /api/gyms?corsoId=xxx – Cancella corso (FR26, GESTORE)
export async function DELETE(req: NextRequest) {
    const corsoId = req.nextUrl.searchParams.get("corsoId");
    const gestoreId = req.headers.get("x-user-id");   // iniettato dal middleware RBAC
    if (!corsoId || !gestoreId) return NextResponse.json({ error: "Parametri mancanti." }, { status: 400 });
    try {
        const service = buildService();
        await service.cancellaCorso(corsoId, gestoreId);
        return NextResponse.json({ message: "Corso cancellato e utenti notificati." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}